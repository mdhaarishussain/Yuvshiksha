
import { parseLocation, calculateLocationScore, getMatchBadge } from './locationUtils';

console.log('--- Starting Manual Verification of locationUtils ---');

const tests = [
    {
        name: 'Parse exact locality and city',
        input: 'Banjara Hills, Hyderabad',
        check: (res: any) => res.locality === 'Banjara Hills' && res.city === 'Hyderabad',
    },
    {
        name: 'Parse city only',
        input: 'Hyderabad',
        check: (res: any) => res.city === 'Hyderabad' && !res.locality,
    },
    {
        name: 'Score: Exact Pin Code (100)',
        run: () => calculateLocationScore(
            { raw: '' },
            { raw: '' },
            '500034',
            '500034'
        ),
        expected: 100,
    },
    {
        name: 'Score: Same Locality & City (95)',
        run: () => calculateLocationScore(
            { locality: 'Banjara Hills', city: 'Hyderabad', raw: '' },
            { locality: 'Banjara Hills', city: 'Hyderabad', raw: '' },
            '500034',
            '500099'
        ),
        expected: 95,
    },
    {
        name: 'Score: Same City (60)',
        run: () => calculateLocationScore(
            { locality: 'Banjara Hills', city: 'Hyderabad', raw: '' },
            { locality: 'Jubilee Hills', city: 'Hyderabad', raw: '' },
            '500034',
            '600033' // Different zone to force City match fallback (priority 4) instead of Pincode Zone (priority 3)
        ),
        expected: 60,
    },
    {
        name: 'Score: Same Pin Code Zone (80)',
        run: () => calculateLocationScore(
            { locality: 'Locality A', raw: '' },
            { locality: 'Locality B', raw: '' },
            '500034',
            '500001'
        ),
        expected: 80,
    },
    {
        name: 'Score: No Match (0)',
        run: () => calculateLocationScore(
            { city: 'Hyderabad', raw: '' },
            { city: 'Chennai', raw: '' },
            '500034',
            '600001'
        ),
        expected: 0,
    }
];

let passed = 0;
let failed = 0;

tests.forEach((test, index) => {
    try {
        let result;
        if ('input' in test && test.check) {
            result = parseLocation(test.input as string);
            if (test.check(result)) {
                console.log(`✅ Test ${index + 1}: ${test.name} PASSED`);
                passed++;
            } else {
                console.error(`❌ Test ${index + 1}: ${test.name} FAILED`);
                console.error('   Result:', result);
                failed++;
            }
        } else if ('run' in test && 'expected' in test) {
            result = test.run();
            const actualScore = (result as any).score !== undefined ? (result as any).score : result;

            if (actualScore === test.expected) {
                console.log(`✅ Test ${index + 1}: ${test.name} PASSED`);
                passed++;
            } else {
                console.error(`❌ Test ${index + 1}: ${test.name} FAILED`);
                console.error(`   Expected score ${test.expected}, got`, result);
                failed++;
            }
        }
    } catch (err) {
        console.error(`❌ Test ${index + 1}: ${test.name} EXCEPTION`, err);
        failed++;
    }
});

console.log(`\n--- Summary: ${passed} Passed, ${failed} Failed ---`);
if (failed > 0) process.exit(1);
