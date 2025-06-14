// Debug script to test title extraction in the actual context
// We'll test the actual code being used

// Read the TypeScript file and extract the function
const fs = require('fs');
const path = require('path');

// Read and evaluate the TypeScript function (simplified test)
const content = fs.readFileSync('./lib/utils/splitClausesWithLLM.ts', 'utf8');

// Extract the extractTitleFromText function
const functionMatch = content.match(/function extractTitleFromText\(text: string\): string \| undefined \{[\s\S]*?^}/m);

if (!functionMatch) {
  console.error('Could not find extractTitleFromText function');
  process.exit(1);
}

// Convert TypeScript to JavaScript for testing
const functionCode = functionMatch[0]
  .replace(/: string \| undefined/, '')
  .replace(/: string/g, '')
  .replace(/function extractTitleFromText\(text: string\)/, 'function extractTitleFromText(text)');

// Create test function
eval(functionCode);

console.log('=== TESTING ACTUAL TITLE EXTRACTION FUNCTION ===');

const testCases = [
  '1. DEFINITIONS AND INTERPRETATION',
  '2. ENGAGEMENT AND SCOPE OF SERVICES', 
  '3. PAYMENT TERMS AND COMPENSATION',
  '4. INTELLECTUAL PROPERTY RIGHTS',
  'DEFINITIONS AND INTERPRETATION',
  'Section 1. DEFINITIONS AND INTERPRETATION'
];

testCases.forEach((testCase, index) => {
  console.log(`\n--- Test ${index + 1}: "${testCase}" ---`);
  const result = extractTitleFromText(testCase);
  console.log(`Result: "${result}"`);
  
  // Fixed test logic - check if it starts with "EFINITIONS" (missing D)
  if (result && result.startsWith('EFINITIONS')) {
    console.log('❌ TITLE TRUNCATION DETECTED! Missing first character.');
  } else if (result && result.includes('DEFINITIONS')) {
    console.log('✅ Title looks correct');
  } else {
    console.log('ℹ️  Title processed normally');
  }
});

// Test the full clause text patterns that would be seen in practice
console.log('\n=== TESTING WITH FULL CLAUSE TEXT ===');

const fullClauseTest = `1. DEFINITIONS AND INTERPRETATION

For purposes of this Agreement, the following terms shall have the meanings set forth below:

(a) "Agreement" means this Service Agreement and all schedules, exhibits, and amendments hereto;
(b) "Services" means the services to be provided by Company as described in Schedule A;`;

console.log(`\nFull clause test: "${fullClauseTest.split('\n')[0]}"`);
const fullResult = extractTitleFromText(fullClauseTest);
console.log(`Result: "${fullResult}"`);

// Fixed test logic here too
if (fullResult && fullResult.startsWith('EFINITIONS')) {
  console.log('❌ TITLE TRUNCATION DETECTED IN FULL TEXT! Missing first character.');
} else if (fullResult && fullResult.includes('DEFINITIONS')) {
  console.log('✅ Full text title looks correct');
} else {
  console.log('ℹ️  Full text title processed normally');
} 