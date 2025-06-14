// Debug script to understand title extraction issue

function extractTitleFromText(text) {
  if (!text) return undefined;
  
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return undefined;
  
  const firstLine = lines[0];
  console.log('First line:', firstLine);
  
  // Clean up section markers and get title - preserve full titles
  let cleanTitle = firstLine
    .replace(/^(Section|Article|Clause|§)\s*[\dIVXLC]+[.)]?\s*[-–—]?\s*/i, '')
    .replace(/^\d+\.\s*/, '') // Just remove the number and dot, don't be too aggressive
    .replace(/[.:]+$/, '')
    .trim();
  
  console.log('After initial cleanup:', cleanTitle);
  
  // If we ended up with something too short or the title starts with a single letter
  // likely we removed too much, so use a more conservative approach
  if (cleanTitle.length < 5 || (cleanTitle.length > 0 && cleanTitle[0] && cleanTitle[0] !== cleanTitle[0].toUpperCase())) {
    console.log('Title too short or issue detected, trying conservative approach');
    // More conservative: just remove number and period
    cleanTitle = firstLine
      .replace(/^\d+\.\s*/, '')
      .replace(/^\d+\s*/, '') // Also handle cases without periods
      .replace(/[.:]+$/, '')
      .trim();
    console.log('After conservative cleanup:', cleanTitle);
  }
  
  if (cleanTitle && cleanTitle.length > 0 && cleanTitle.length < 100) {
    return cleanTitle;
  }
  
  // Fallback: extract from first few words
  const words = text.split(/\s+/).slice(0, 8).join(' ');
  if (words && words.length < 80) {
    return words.replace(/[.:]+$/, '').trim();
  }
  
  return undefined;
}

// Test cases
const testCases = [
  '1. DEFINITIONS AND INTERPRETATION',
  '2. ENGAGEMENT AND SCOPE OF SERVICES',
  '3. PAYMENT TERMS AND COMPENSATION',
  '4. INTELLECTUAL PROPERTY RIGHTS',
  '5. CONFIDENTIALITY OBLIGATIONS',
  '6. TERM AND TERMINATION',
  '7. LIABILITY LIMITATION AND INDEMNIFICATION',
  '8. DISPUTE RESOLUTION AND GOVERNING LAW',
  '9. GENERAL PROVISIONS'
];

console.log('=== TITLE EXTRACTION DEBUG ===\n');

testCases.forEach((testCase, index) => {
  console.log(`--- Test ${index + 1}: "${testCase}" ---`);
  const result = extractTitleFromText(testCase);
  console.log(`Result: "${result}"`);
  console.log(`Expected: "${testCase.replace(/^\d+\.\s*/, '')}"`);
  console.log(`Match: ${result === testCase.replace(/^\d+\.\s*/, '') ? '✅' : '❌'}\n`);
});

// Additional debugging to see where the issue is coming from
console.log('=== REGEX PATTERN TESTING ===');

const sampleText = `1. DEFINITIONS AND INTERPRETATION

For purposes of this Agreement, the following terms shall have the meanings set forth below:`;

console.log('Sample text:', sampleText);

// Test the pattern that's being used in the clause splitting
const pattern = /(?:^|\n\n)\s*(\d+\.?\s+[A-Z][^\n]*?)[\.\:]?\s*\n([\s\S]*?)(?=\n\n\s*\d+\.|\n\n\s*[A-Z\s]{8,}\s*\n|$)/gim;

const match = pattern.exec(sampleText);
if (match) {
  console.log('Pattern match found:');
  console.log('  Full match:', match[0]);
  console.log('  Heading (group 1):', match[1]);
  console.log('  Content (group 2):', match[2]);
  
  const extractedTitle = extractTitleFromText(match[1]);
  console.log('  Extracted title:', extractedTitle);
} 