import { Buffer } from "buffer";
// Use require for pdf-parse since it doesn't have proper TypeScript definitions
// We use dynamic import to avoid issues with server-side rendering
import * as fs from 'fs';
import * as path from 'path';

// Create mock test files directory to prevent pdf-parse from failing
try {
  // Create test directory structure if it doesn't exist
  const testDir = path.join(process.cwd(), 'test', 'data');
  if (!fs.existsSync(path.join(process.cwd(), 'test'))) {
    fs.mkdirSync(path.join(process.cwd(), 'test'));
  }
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir);
  }
  
  // Create an empty test file that pdf-parse tries to access
  const testFilePath = path.join(testDir, '05-versions-space.pdf');
  if (!fs.existsSync(testFilePath)) {
    fs.writeFileSync(testFilePath, Buffer.from([]));
    console.log('Created empty test PDF file for pdf-parse compatibility');
  }
} catch (err) {
  console.warn('Could not create test file directory, but will continue:', err);
}

/**
 * Clean PDF text by removing binary data and object references
 */
function cleanPdfText(text: string): string {
  if (!text) return '';
  
  return text
    // Remove PDF object markers
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
    // Remove binary data markers
    .replace(/x[\u0000-\u001F\u007F-\u00FF]+/g, '')
    // Remove lines that are mostly binary/encoded data
    .replace(/^[^\w\s]*[\u0080-\uFFFF\u0000-\u001F]+[^\w\s]*$/gm, '')
    // Remove PDF version headers
    .replace(/%PDF-[\d.]+/g, '')
    // Remove other PDF markers
    .replace(/%%EOF/g, '')
    // Remove non-printable characters but preserve line breaks
    .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
    // Clean up excessive whitespace but preserve paragraph breaks
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t]*\n/g, '\n\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Check if extracted text looks like meaningful content
 */
function isValidText(text: string): boolean {
  if (!text || text.length < 50) return false;
  
  // Count words
  const words = text.match(/\b[a-zA-Z]{2,}\b/g) || [];
  const wordCount = words.length;
  
  // Should have at least 10 recognizable words
  if (wordCount < 10) return false;
  
  return true;
}

/**
 * Parse a file and extract its text content
 */
export async function parseFile(file: Buffer | Uint8Array, mimetype: string): Promise<string> {
  console.log('parseFile - Starting with mimetype:', mimetype, 'buffer size:', file.length);
  
  try {
    if (mimetype === 'application/pdf') {
      console.log('parseFile - Processing PDF file');
      
      try {
        // Ensure we have a proper Buffer
        const buffer = Buffer.isBuffer(file) ? file : Buffer.from(file);
        console.log('parseFile - Buffer created, size:', buffer.length);
        
        // Try to use require first (more reliable in server environment)
        let pdfParse;
        try {
          pdfParse = require('pdf-parse');
          console.log('parseFile - Using require for pdf-parse');
        } catch (requireError) {
          console.log('parseFile - Require failed, trying dynamic import:', requireError);
          const pdfParseModule = await import('pdf-parse');
          pdfParse = pdfParseModule.default;
          console.log('parseFile - Using dynamic import for pdf-parse');
        }
        
        console.log('parseFile - Calling pdf-parse with buffer');
        const data = await pdfParse(buffer);
        console.log('parseFile - PDF parse completed, text length:', data?.text?.length || 0);
        
        let text = data.text || '';
        
        if (!text) {
          console.warn('parseFile - No text extracted from PDF');
          return 'No text could be extracted from this PDF. The file may contain only images or be corrupted.';
        }
        
        console.log('parseFile - Raw text first 200 chars:', text.substring(0, 200));
        
        // Clean the text
        text = cleanPdfText(text);
        console.log('parseFile - Cleaned text length:', text.length);
        console.log('parseFile - Cleaned text first 200 chars:', text.substring(0, 200));
        
        // Check if the cleaned text looks valid
        if (!isValidText(text)) {
          console.warn('parseFile - Extracted text does not look like meaningful content');
          return 'This PDF appears to contain mostly binary data or is corrupted. Please try uploading a different version of the document.';
        }
        
        console.log('parseFile - PDF parsing successful');
        return text;
      } catch (error) {
        console.error('parseFile - PDF parsing error:', error);
        // Return the actual error details for debugging
        return `Failed to extract text from PDF. Error: ${error instanceof Error ? error.message : String(error)}. The file may be corrupted, password-protected, or contain only images.`;
      }
    }

    if (
      mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimetype === 'application/msword'
    ) {
      console.log('parseFile - Processing Word document');
      
      // For Word documents, use mammoth if available
      try {
        const mammoth = await import('mammoth');
        const buffer = Buffer.isBuffer(file) ? file : Buffer.from(file);
        const { value } = await mammoth.extractRawText({ buffer });
        console.log('parseFile - Word document parsing successful, text length:', value.length);
        return value.trim();
      } catch (error) {
        console.error('parseFile - DOCX parsing error:', error);
        throw new Error(`Failed to extract text from Word document: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // For text files, try to extract as plain text
    if (mimetype === 'text/plain' || mimetype.startsWith('text/')) {
      console.log('parseFile - Processing text file');
      const buffer = Buffer.isBuffer(file) ? file : Buffer.from(file);
      return buffer.toString('utf-8').trim();
    }

    throw new Error(`Unsupported file type: ${mimetype}`);
  } catch (error: any) {
    console.error('parseFile - General error:', error);
    throw new Error(`Failed to parse file: ${error.message}`);
  }
}

export default parseFile;
