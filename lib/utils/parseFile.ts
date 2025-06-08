import { Buffer } from 'buffer';
// Use require for mammoth due to export style
import * as mammoth from 'mammoth';
import * as fs from 'fs';
import * as path from 'path';

// Fix for pdf-parse loading test file in production
// Monkey patch the fs.readFileSync to handle the test file reference
const originalReadFileSync = fs.readFileSync;
// @ts-ignore
fs.readFileSync = function(path, options) {
  if (path === './test/data/05-versions-space.pdf') {
    // Return an empty buffer when the test file is requested
    console.log('Intercepted request for test PDF file');
    return Buffer.from([]);
  }
  // @ts-ignore
  return originalReadFileSync(path, options);
};

// Enhanced function to clean PDF text by removing binary data and object references
function cleanPdfText(text: string): string {
  if (!text) return '';
  
  return text
    // Remove PDF object markers (more comprehensive)
    .replace(/\d+ 0 obj[^>]*>?/gi, '')
    .replace(/<<[^>]*>>/g, '')
    .replace(/\bobj\b/g, '')
    .replace(/\bendobj\b/g, '')
    // Remove stream markers
    .replace(/\bstream\b[\s\S]*?\bendstream\b/gi, '')
    // Remove xref tables
    .replace(/\bxref\b[\s\S]*?(?=\d+ 0 obj|$)/gi, '')
    // Remove trailer
    .replace(/\btrailer\b[\s\S]*?(?=\d+ 0 obj|$)/gi, '')
    // Remove startxref
    .replace(/\bstartxref\b.*$/gm, '')
    // Remove binary data markers that start with x and special chars
    .replace(/x[\u0000-\u001F\u007F-\u00FF]+/g, '')
    // Remove lines that are mostly binary/encoded data
    .replace(/^[^\w\s]*[\u0080-\uFFFF\u0000-\u001F]+[^\w\s]*$/gm, '')
    // Remove PDF version headers
    .replace(/%PDF-[\d.]+/g, '')
    // Remove other PDF markers
    .replace(/%%EOF/g, '')
    // Remove non-printable characters but preserve line breaks
    .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
    // Split by lines and filter out garbage lines, but preserve structure
    .split('\n')
    .filter(line => {
      const trimmed = line.trim();
      
      // Keep empty lines for paragraph separation
      if (!trimmed) return true;
      
      // Skip lines that are just numbers (likely object references)
      if (/^\d+(\s+\d+)*\s*$/.test(trimmed)) return false;
      
      // Skip lines that contain mostly special characters or binary data
      const alphaNumericCount = (trimmed.match(/[a-zA-Z0-9\s]/g) || []).length;
      const totalLength = trimmed.length;
      if (totalLength < 3) return false;
      
      // Require at least 50% readable characters
      return (alphaNumericCount / totalLength) > 0.5;
    })
    .join('\n')
    // Clean up excessive whitespace but preserve paragraph breaks
    .replace(/[ \t]+/g, ' ') // Multiple spaces/tabs to single space
    .replace(/\n[ \t]*\n/g, '\n\n') // Ensure proper paragraph breaks
    .replace(/\n{3,}/g, '\n\n') // Limit to double line breaks max
    .trim();
}

// Function to check if extracted text looks like meaningful content
function isValidText(text: string): boolean {
  if (!text || text.length < 50) return false;
  
  // Count words vs non-word characters
  const words = text.match(/\b[a-zA-Z]{2,}\b/g) || [];
  const wordCount = words.length;
  
  // Should have at least 10 recognizable words
  if (wordCount < 10) return false;
  
  // Check for common contract words
  const contractKeywords = [
    'agreement', 'contract', 'party', 'parties', 'shall', 'will', 'terms',
    'conditions', 'clause', 'section', 'article', 'payment', 'liability',
    'termination', 'effective', 'date', 'obligations', 'rights', 'duties'
  ];
  
  const lowerText = text.toLowerCase();
  const foundKeywords = contractKeywords.filter(keyword => lowerText.includes(keyword));
  
  // Should have at least some contract-related words
  return foundKeywords.length >= 3;
}

/**
 * Parse a file and extract its text content
 */
async function parseFile(file: Buffer | Uint8Array, mimetype: string): Promise<string> {
  try {
    if (mimetype === 'application/pdf') {
      // For PDF files, try to extract text with pdf-parse
      try {
        // @ts-ignore - Missing types for pdf-parse
        const pdfParse = require('pdf-parse');
        const data = await pdfParse(Buffer.from(file));
        let text = data.text || '';
        
        console.log('PDF parsing - Raw text length:', text.length);
        console.log('PDF parsing - First 200 chars:', text.substring(0, 200));
        
        // Always clean the text for PDFs since they often contain artifacts
        text = cleanPdfText(text);
        
        console.log('PDF parsing - Cleaned text length:', text.length);
        console.log('PDF parsing - First 200 chars after cleaning:', text.substring(0, 200));
        
        // Check if the cleaned text looks valid
        if (!isValidText(text)) {
          console.warn('PDF parsing - Extracted text does not look like meaningful content');
          return 'This PDF appears to contain mostly binary data or is corrupted. Please try uploading a different version of the document or convert it to a text-based PDF.';
        }
        
        return text;
      } catch (error) {
        console.error('PDF parsing error:', error);
        return 'Failed to extract text from PDF. The file may be corrupted, password-protected, or contain only images. Please try uploading a text-based PDF or convert the document to a different format.';
      }
    }

    if (
      mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimetype === 'application/msword'
    ) {
      // Use mammoth for DOCX extraction
      const { value } = await mammoth.extractRawText({ buffer: Buffer.from(file) });
      return value.trim();
    }

    throw new Error(`Unsupported file type: ${mimetype}`);
  } catch (error: any) {
    console.error('Error parsing file:', error);
    throw new Error(`Failed to parse file: ${error.message}`);
  }
}

// CLI test harness for local dev
if (require.main === module) {
  (async () => {
    const [,, filePath, mimetype] = process.argv;
    if (!filePath || !mimetype) {
      console.error('Usage: node lib/utils/parseFile.js <file> <mimetype>');
      process.exit(1);
    }
    const fs = require('fs');
    // Read as a true Uint8Array
    const fileBuffer = new Uint8Array(fs.readFileSync(filePath, null));
    try {
      const text = await parseFile(fileBuffer, mimetype);
      console.log('--- Extracted Text Start ---');
      console.log(text);
      console.log('--- Extracted Text End ---');
    } catch (err) {
      console.error('Extraction failed:', err);
      process.exit(2);
    }
  })();
}

export { parseFile };
export default parseFile; 