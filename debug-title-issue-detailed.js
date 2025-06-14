const fs = require('fs');

// Test contract text with clear section headers
const testText = `
LOAN AGREEMENT

1. DEFINITIONS AND INTERPRETATION

In this Agreement, unless the context otherwise requires:

"Borrower" means XYZ Corporation

2. LOAN TERMS

The principal amount of the loan shall be $1,000,000.

3. INTEREST RATE

Interest shall accrue at a rate of 5% per annum.
`;

console.log('=== DEBUGGING TITLE EXTRACTION ISSUE ===\n');

// Test 1: Check the actual functions in the main files
console.log('1. Testing extractTitleFromText from splitClausesWithLLM.ts:');
try {
    // Read the actual function from the file
    const llmSplitContent = fs.readFileSync('lib/utils/splitClausesWithLLM.ts', 'utf8');
    
    // Extract the extractTitleFromText function
    const functionMatch = llmSplitContent.match(/function extractTitleFromText\([^}]+}\s*}/s);
    if (functionMatch) {
        console.log('Found function:\n', functionMatch[0].substring(0, 200) + '...\n');
        
        // Execute the function with eval (normally not recommended, but for debugging)
        eval(functionMatch[0]);
        
        const testCases = [
            "1. DEFINITIONS AND INTERPRETATION",
            "DEFINITIONS AND INTERPRETATION",
            "1) DEFINITIONS AND INTERPRETATION",
            "A. DEFINITIONS AND INTERPRETATION",
            "SECTION 1 - DEFINITIONS AND INTERPRETATION"
        ];
        
        testCases.forEach(test => {
            const result = extractTitleFromText(test);
            console.log(`Input: "${test}" -> Output: "${result}"`);
        });
    }
} catch (error) {
    console.log('Error testing LLM split function:', error.message);
}

console.log('\n2. Testing extractTitle from splitClauses.ts:');
try {
    // Read the actual function from the file
    const splitContent = fs.readFileSync('lib/utils/splitClauses.ts', 'utf8');
    
    // Extract the extractTitle function
    const extractTitleMatch = splitContent.match(/const extractTitle = \([^}]+}\)/s);
    if (extractTitleMatch) {
        console.log('Found function:\n', extractTitleMatch[0].substring(0, 200) + '...\n');
        
        // Execute the function
        eval(extractTitleMatch[0]);
        
        const testCases = [
            "1. DEFINITIONS AND INTERPRETATION\n\nIn this Agreement...",
            "DEFINITIONS AND INTERPRETATION\n\nIn this Agreement...",
            "1) DEFINITIONS AND INTERPRETATION\n\nSome content...",
        ];
        
        testCases.forEach(test => {
            const result = extractTitle(test);
            console.log(`Input: "${test.split('\n')[0]}" -> Output: "${result}"`);
        });
    }
} catch (error) {
    console.log('Error testing split function:', error.message);
}

console.log('\n3. Testing clause splitting with actual content:');
try {
    // Test the full clause splitting process
    const { splitClausesWithLLM } = require('./lib/utils/splitClausesWithLLM');
    
    console.log('Testing with splitClausesWithLLM...');
    splitClausesWithLLM(testText, 'test-doc').then(result => {
        console.log('Clauses found:');
        result.clauses.forEach((clause, index) => {
            console.log(`${index + 1}. Title: "${clause.title}"`);
            console.log(`   Content preview: "${clause.content.substring(0, 50)}..."\n`);
        });
    }).catch(error => {
        console.log('LLM splitting failed:', error.message);
        
        // Fallback to regular splitting
        console.log('\nTesting fallback with splitClauses...');
        const { splitClauses } = require('./lib/utils/splitClauses');
        const fallbackResult = splitClauses(testText);
        
        console.log('Fallback clauses found:');
        fallbackResult.forEach((clause, index) => {
            console.log(`${index + 1}. Title: "${clause.title}"`);
            console.log(`   Content preview: "${clause.content.substring(0, 50)}..."\n`);
        });
    });
} catch (error) {
    console.log('Error testing clause splitting:', error.message);
}

console.log('\n4. Checking for problematic regex patterns in main files:');

// Search for the problematic pattern in main files
const filesToCheck = [
    'lib/utils/splitClausesWithLLM.ts',
    'lib/utils/splitClauses.ts',
    'app/api/upload/route.ts'
];

filesToCheck.forEach(file => {
    try {
        const content = fs.readFileSync(file, 'utf8');
        // Look for the problematic pattern
        if (content.includes('.replace(/^[A-Z][.)]?\\s*[-–—]?\\s*/')) {
            console.log(`❌ Found problematic pattern in ${file}`);
        } else {
            console.log(`✅ No problematic pattern in ${file}`);
        }
        
        // Look for any suspicious replace patterns
        const replaceMatches = content.match(/\.replace\([^)]+\)/g);
        if (replaceMatches) {
            console.log(`   Replace patterns in ${file}:`);
            replaceMatches.forEach(match => {
                console.log(`     ${match}`);
            });
        }
    } catch (error) {
        console.log(`❌ Could not read ${file}: ${error.message}`);
    }
}); 