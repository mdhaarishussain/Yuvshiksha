/**
 * Recommendation Service for Teacher Recommendations
 * 
 * Handles ranking teachers based on location proximity to students.
 * Uses pincode as primary matching criterion with locality as refinement.
 */

import User, { IUser } from '../models/User';
import {
    parseLocation,
    calculateLocationScore,
    LocationScore,
    MatchType,
    getMatchBadge
} from '../utils/locationUtils';

export interface RecommendedTeacher {
    teacher: IUser;
    locationScore: LocationScore;
    matchBadge: { text: string; emoji: string };
}

export interface RecommendationResult {
    teachers: RecommendedTeacher[];
    studentLocation: {
        raw: string;
        parsed: {
            locality?: string;
            city?: string;
            state?: string;
        };
        pinCode?: string;
    };
    totalCount: number;
}

/**
 * Get recommended teachers ranked by location proximity to the student
 */
export async function getRecommendedTeachers(
    studentId: string
): Promise<RecommendationResult> {
    // Fetch student profile
    const student = await User.findById(studentId).select('studentProfile');

    if (!student || !student.studentProfile) {
        throw new Error('Student profile not found');
    }

    const studentLocation = parseLocation(student.studentProfile.location);
    const studentPinCode = student.studentProfile.pinCode;

    // Fetch all listed teachers
    const teachers = await User.find({
        role: 'teacher',
        'teacherProfile.isListed': true
    }).select('firstName lastName email teacherProfile');

    // Rank teachers by location score
    const rankedTeachers = rankTeachersByLocation(
        teachers,
        studentLocation,
        studentPinCode
    );

    return {
        teachers: rankedTeachers,
        studentLocation: {
            raw: studentLocation.raw,
            parsed: {
                locality: studentLocation.locality,
                city: studentLocation.city,
                state: studentLocation.state
            },
            pinCode: studentPinCode
        },
        totalCount: rankedTeachers.length
    };
}

/**
 * Rank teachers by location proximity
 */
export function rankTeachersByLocation(
    teachers: IUser[],
    studentLocation: ReturnType<typeof parseLocation>,
    studentPinCode?: string
): RecommendedTeacher[] {
    const rankedTeachers: RecommendedTeacher[] = teachers.map(teacher => {
        const teacherLocation = parseLocation(teacher.teacherProfile?.location);
        const teacherPinCode = teacher.teacherProfile?.pinCode;

        const locationScore = calculateLocationScore(
            studentLocation,
            teacherLocation,
            studentPinCode,
            teacherPinCode
        );

        return {
            teacher,
            locationScore,
            matchBadge: getMatchBadge(locationScore.matchType)
        };
    });

    // Sort by score (highest first), then by experience as tiebreaker
    rankedTeachers.sort((a, b) => {
        const scoreDiff = b.locationScore.score - a.locationScore.score;
        if (scoreDiff !== 0) return scoreDiff;

        // Tiebreaker: more experience is better
        const expA = a.teacher.teacherProfile?.experienceYears || 0;
        const expB = b.teacher.teacherProfile?.experienceYears || 0;
        return expB - expA;
    });

    return rankedTeachers;
}

/**
 * Get teachers filtered by specific location criteria
 */
export async function getTeachersByLocationCriteria(
    criteria: {
        city?: string;
        pinCode?: string;
        locality?: string;
    }
): Promise<IUser[]> {
    const query: any = {
        role: 'teacher',
        'teacherProfile.isListed': true
    };

    // Add location filters if provided
    if (criteria.pinCode) {
        query['teacherProfile.pinCode'] = criteria.pinCode;
    }

    if (criteria.city) {
        // Case-insensitive regex match for city in location string
        query['teacherProfile.location'] = new RegExp(criteria.city, 'i');
    }

    return User.find(query).select('firstName lastName email teacherProfile');
}

/**
 * Get location statistics for analytics
 */
export async function getLocationStats(): Promise<{
    totalListedTeachers: number;
    teachersByCity: Record<string, number>;
    teachersWithPinCode: number;
}> {
    const teachers = await User.find({
        role: 'teacher',
        'teacherProfile.isListed': true
    }).select('teacherProfile.location teacherProfile.pinCode');

    const cityCount: Record<string, number> = {};
    let withPinCode = 0;

    for (const teacher of teachers) {
        const parsed = parseLocation(teacher.teacherProfile?.location);
        if (parsed.city) {
            cityCount[parsed.city] = (cityCount[parsed.city] || 0) + 1;
        }
        if (teacher.teacherProfile?.pinCode) {
            withPinCode++;
        }
    }

    return {
        totalListedTeachers: teachers.length,
        teachersByCity: cityCount,
        teachersWithPinCode: withPinCode
    };
}

export const recommendationService = {
    getRecommendedTeachers,
    rankTeachersByLocation,
    getTeachersByLocationCriteria,
    getLocationStats
};
