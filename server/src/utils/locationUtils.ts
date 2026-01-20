/**
 * Location Utilities for Teacher Recommendation
 * 
 * Handles parsing of freeform location strings and calculating
 * location match scores between students and teachers.
 */

export interface ParsedLocation {
  locality?: string;   // Most specific (e.g., "Banjara Hills")
  city?: string;       // City name (e.g., "Hyderabad")
  state?: string;      // State if present
  raw: string;         // Original string
}

export type MatchType = 'pincode' | 'locality' | 'city' | 'state' | 'none';

export interface LocationScore {
  score: number;       // 0-100
  matchType: MatchType;
  details: string;     // Human-readable match description
}

// Common Indian cities for detection
const MAJOR_CITIES = new Set([
  'hyderabad', 'bangalore', 'bengaluru', 'mumbai', 'delhi', 'chennai',
  'kolkata', 'pune', 'ahmedabad', 'jaipur', 'lucknow', 'kanpur',
  'nagpur', 'indore', 'thane', 'bhopal', 'visakhapatnam', 'vizag',
  'patna', 'vadodara', 'ghaziabad', 'ludhiana', 'agra', 'nashik',
  'faridabad', 'meerut', 'rajkot', 'varanasi', 'srinagar', 'aurangabad',
  'dhanbad', 'amritsar', 'allahabad', 'ranchi', 'howrah', 'coimbatore',
  'jabalpur', 'gwalior', 'vijayawada', 'jodhpur', 'madurai', 'raipur',
  'kota', 'chandigarh', 'guwahati', 'solapur', 'hubli', 'mysore',
  'tiruchirappalli', 'bareilly', 'aligarh', 'tiruppur', 'moradabad',
  'jalandhar', 'bhubaneswar', 'salem', 'warangal', 'guntur', 'bhiwandi',
  'saharanpur', 'gorakhpur', 'bikaner', 'amravati', 'noida', 'jamshedpur',
  'bhilai', 'cuttack', 'firozabad', 'kochi', 'cochin', 'trivandrum',
  'nellore', 'secunderabad', 'gurgaon', 'gurugram'
]);

// Common Indian states for detection
const STATES = new Set([
  'telangana', 'andhra pradesh', 'karnataka', 'tamil nadu', 'kerala',
  'maharashtra', 'gujarat', 'rajasthan', 'uttar pradesh', 'madhya pradesh',
  'west bengal', 'bihar', 'odisha', 'jharkhand', 'chhattisgarh',
  'punjab', 'haryana', 'uttarakhand', 'himachal pradesh', 'jammu and kashmir',
  'assam', 'goa', 'tripura', 'meghalaya', 'manipur', 'nagaland',
  'arunachal pradesh', 'mizoram', 'sikkim', 'delhi'
]);

/**
 * Parse a freeform location string into structured components
 * Handles formats like:
 * - "Hyderabad"
 * - "Banjara Hills, Hyderabad"
 * - "Banjara Hills, Hyderabad, Telangana"
 * - "Plot 123, Banjara Hills, Hyderabad"
 */
export function parseLocation(locationString: string | undefined | null): ParsedLocation {
  if (!locationString || typeof locationString !== 'string') {
    return { raw: '' };
  }

  const raw = locationString.trim();
  const result: ParsedLocation = { raw };

  // Split by common delimiters
  const parts = raw.split(/[,\-\/]/).map(p => p.trim()).filter(p => p.length > 0);

  if (parts.length === 0) {
    return result;
  }

  // Work backwards since city/state are usually at the end
  for (let i = parts.length - 1; i >= 0; i--) {
    const partLower = parts[i].toLowerCase();

    // Check if this is a state
    if (STATES.has(partLower) && !result.state) {
      result.state = parts[i];
      continue;
    }

    // Check if this is a city
    if (MAJOR_CITIES.has(partLower) && !result.city) {
      result.city = parts[i];
      continue;
    }

    // If we already have a city and this isn't a state, it's likely a locality
    if (result.city && !result.locality && !STATES.has(partLower)) {
      // Skip if it looks like a plot/house number
      if (!/^\d+$/.test(parts[i]) && !/^plot|house|flat|apt|apartment/i.test(parts[i])) {
        result.locality = parts[i];
      }
    }
  }

  // If no city found but we have a single part, treat it as city
  if (!result.city && parts.length === 1) {
    result.city = parts[0];
  }

  // If we have 2+ parts but no city detected, assume last non-state part is city
  if (!result.city && parts.length >= 2) {
    for (let i = parts.length - 1; i >= 0; i--) {
      const partLower = parts[i].toLowerCase();
      if (!STATES.has(partLower)) {
        result.city = parts[i];
        break;
      }
    }
  }

  // If still no locality but we have parts before the city
  if (!result.locality && result.city && parts.length >= 2) {
    const cityIndex = parts.findIndex(p => p === result.city);
    if (cityIndex > 0) {
      // Take the part just before the city as locality
      const potentialLocality = parts[cityIndex - 1];
      if (!/^\d+$/.test(potentialLocality) && !/^plot|house|flat|apt/i.test(potentialLocality.toLowerCase())) {
        result.locality = potentialLocality;
      }
    }
  }

  return result;
}

/**
 * Normalize a string for comparison (lowercase, remove extra spaces)
 */
function normalize(str: string | undefined | null): string {
  if (!str) return '';
  return str.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Check if two pin codes are in proximity
 * Same first 3 digits = same postal zone/district
 */
export function arePinCodesNearby(pin1: string | undefined, pin2: string | undefined): boolean {
  if (!pin1 || !pin2) return false;
  
  // Clean pin codes
  const clean1 = pin1.replace(/\D/g, '');
  const clean2 = pin2.replace(/\D/g, '');
  
  // Indian pin codes are 6 digits
  if (clean1.length !== 6 || clean2.length !== 6) return false;
  
  // Same first 3 digits = nearby (same postal zone)
  return clean1.substring(0, 3) === clean2.substring(0, 3);
}

/**
 * Check if two pin codes are exactly the same
 */
export function arePinCodesExact(pin1: string | undefined, pin2: string | undefined): boolean {
  if (!pin1 || !pin2) return false;
  
  const clean1 = pin1.replace(/\D/g, '');
  const clean2 = pin2.replace(/\D/g, '');
  
  return clean1.length === 6 && clean2.length === 6 && clean1 === clean2;
}

/**
 * Calculate a location match score between student and teacher
 * 
 * Scoring priority (based on user feedback):
 * 1. Exact pincode match = 100 (highest priority - small area in dense cities)
 * 2. Same locality + city = 95
 * 3. Same pincode zone (first 3 digits) = 80
 * 4. Same city only = 60
 * 5. Same state = 30
 * 6. No match = 0
 */
export function calculateLocationScore(
  studentLocation: ParsedLocation,
  teacherLocation: ParsedLocation,
  studentPinCode?: string,
  teacherPinCode?: string
): LocationScore {
  
  // Priority 1: Exact pincode match
  if (arePinCodesExact(studentPinCode, teacherPinCode)) {
    // If we also have locality match, slightly higher
    if (studentLocation.locality && teacherLocation.locality &&
        normalize(studentLocation.locality) === normalize(teacherLocation.locality)) {
      return {
        score: 100,
        matchType: 'pincode',
        details: `Same pincode (${studentPinCode}) and locality (${studentLocation.locality})`
      };
    }
    return {
      score: 100,
      matchType: 'pincode',
      details: `Same pincode: ${studentPinCode}`
    };
  }

  // Priority 2: Same locality + city (without pincode)
  const studentCity = normalize(studentLocation.city);
  const teacherCity = normalize(teacherLocation.city);
  const studentLocality = normalize(studentLocation.locality);
  const teacherLocality = normalize(teacherLocation.locality);

  if (studentLocality && teacherLocality && 
      studentLocality === teacherLocality &&
      studentCity && teacherCity && studentCity === teacherCity) {
    return {
      score: 95,
      matchType: 'locality',
      details: `Same area: ${studentLocation.locality}, ${studentLocation.city}`
    };
  }

  // Priority 3: Same pincode zone (first 3 digits match)
  if (arePinCodesNearby(studentPinCode, teacherPinCode)) {
    return {
      score: 80,
      matchType: 'pincode',
      details: `Nearby pincode zone: ${studentPinCode?.substring(0, 3)}xxx`
    };
  }

  // Priority 4: Same city only
  if (studentCity && teacherCity && studentCity === teacherCity) {
    return {
      score: 60,
      matchType: 'city',
      details: `Same city: ${studentLocation.city || teacherLocation.city}`
    };
  }

  // Priority 5: Same state
  const studentState = normalize(studentLocation.state);
  const teacherState = normalize(teacherLocation.state);
  
  if (studentState && teacherState && studentState === teacherState) {
    return {
      score: 30,
      matchType: 'state',
      details: `Same state: ${studentLocation.state || teacherLocation.state}`
    };
  }

  // No match
  return {
    score: 0,
    matchType: 'none',
    details: 'Different location'
  };
}

/**
 * Get a human-readable badge for the match type
 */
export function getMatchBadge(matchType: MatchType): { text: string; emoji: string } {
  switch (matchType) {
    case 'pincode':
      return { text: 'Same Area', emoji: '📍' };
    case 'locality':
      return { text: 'Same Locality', emoji: '🏘️' };
    case 'city':
      return { text: 'Same City', emoji: '🌆' };
    case 'state':
      return { text: 'Same State', emoji: '🗺️' };
    default:
      return { text: '', emoji: '' };
  }
}
