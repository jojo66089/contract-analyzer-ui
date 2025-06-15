const fs = require('fs');
const path = require('path');

// Test the PDF parsing functionality
async function testPdfParsing() {
  try {
    console.log('Testing PDF parsing functionality...');
    
    // Import the parseFile function
    const { parseFile } = require('./lib/utils/parseFile.ts');
    
    // Create a simple test PDF buffer (this is just a placeholder)
    // In a real test, you would load an actual PDF file
    const testBuffer = Buffer.from('Test PDF content');
    
    console.log('Testing with mock PDF buffer...');
    
    try {
      const result = await parseFile(testBuffer, 'application/pdf');
      console.log('PDF parsing successful:', result.substring(0, 100));
    } catch (error) {
      console.log('PDF parsing failed as expected with mock data:', error.message);
    }
    
    console.log('PDF parsing test completed.');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testPdfParsing();