import { Buffer } from 'buffer';
// Use require for mammoth due to export style
import * as mammoth from 'mammoth';
// @ts-ignore - Missing types for pdf-parse
import pdfParse from 'pdf-parse';
import * as fs from 'fs';

/**
 * Parse a file and extract its text content
 */
export async function parseFile(file: Buffer | Uint8Array, mimetype: string): Promise<string> {
  try {
    if (mimetype === 'application/pdf') {
      // Use pdf-parse for PDF text extraction
      try {
        const data = await pdfParse(Buffer.from(file));
        return data.text || '';
      } catch (pdfError) {
        console.error('PDF parsing error:', pdfError);
        return 'Failed to extract text from PDF. The file may be corrupted or password-protected.';
      }
    }

    if (
      mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimetype === 'application/msword'
    ) {
      // Use mammoth for robust DOCX extraction
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