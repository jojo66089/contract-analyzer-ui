const fs = require('fs');
const { parseFile } = require('./lib/utils/parseFile.ts');

async function testPdfParsing() {
  try {
    console.log('Testing PDF parsing...');
    
    // Test with the Contract MockUP.pdf file
    const pdfPath = './Contract MockUP.pdf';
    
    if (!fs.existsSync(pdfPath)) {
      console.log('Contract MockUP.pdf not found, skipping test');
      return;
    }
    
    const buffer = fs.readFileSync(pdfPath);
    console.log(`Loaded PDF: ${buffer.length} bytes`);
    
    const text = await parseFile(buffer, 'application/pdf');
    console.log(`Extracted text length: ${text.length}`);
    console.log('First 200 characters:', text.substring(0, 200));
    
    if (text.length > 100) {
      console.log('✅ PDF parsing successful!');
    } else {
      console.log('⚠️ PDF parsing returned short text');
    }
    
  } catch (error) {
    console.error('❌ PDF parsing failed:', error.message);
  }
}

testPdfParsing(); 