// Test script to debug the exact splitting issue
const fs = require('fs');

// Simulate the contract text that might be uploaded
const contractText = `
LOAN AGREEMENT

1. DEFINITIONS AND INTERPRETATION

In this Agreement, unless the context otherwise requires:

(a) "Borrower" means the party receiving the loan
(b) "Lender" means the party providing the loan

2. LOAN TERMS AND CONDITIONS

The principal amount shall be as specified in Schedule A.

3. INTEREST RATE AND PAYMENT

Interest shall accrue at the rate specified.

4. DEFAULT AND REMEDIES

In the event of default, the Lender may accelerate.
`;

console.log('=== DEBUGGING EXACT SPLITTING ISSUE ===\n');

// Test 1: Check what splitClauses produces (fallback function)
console.log('1. Testing splitClauses (fallback):');
try {
    const { splitClauses } = require('./lib/utils/splitClauses');
    const result = splitClauses(contractText);
    
    console.log(`Found ${result.length} clauses:`);
    result.forEach((clause, index) => {
        console.log(`  ${index + 1}. Title: "${clause.title}"`);
        console.log(`     ID: ${clause.id}`);
        console.log(`     Text length: ${clause.text.length}`);
        console.log(`     Text preview: "${clause.text.substring(0, 80)}..."`);
        console.log('');
    });
} catch (error) {
    console.log('Error with splitClauses:', error.message);
}

// Test 2: Test individual title extraction
console.log('\n2. Testing title extraction individually:');
const testTitles = [
    "1. DEFINITIONS AND INTERPRETATION",
    "2. LOAN TERMS AND CONDITIONS", 
    "3. INTEREST RATE AND PAYMENT",
    "4. DEFAULT AND REMEDIES"
];

// Try to import the actual function
try {
    // Read the splitClauses file to get the extractTitle function
    const splitContent = fs.readFileSync('lib/utils/splitClauses.ts', 'utf8');
    
    // Look for extractTitle function
    const extractTitleMatch = splitContent.match(/const extractTitle = [^;]+;/s);
    if (extractTitleMatch) {
        console.log('Found extractTitle function, testing...');
        
        // Convert to JS and evaluate
        const jsCode = extractTitleMatch[0].replace(/: string/g, '');
        eval(jsCode);
        
        testTitles.forEach(title => {
            const result = extractTitle(title + '\n\nSome content here...');
            console.log(`Input: "${title}" -> Output: "${result}"`);
        });
    } else {
        console.log('Could not find extractTitle function');
    }
} catch (error) {
    console.log('Error testing title extraction:', error.message);
}

console.log('\n=== END DEBUG ==='); 