import { Buffer } from "buffer";
// Use require for pdf-parse since it doesn't have proper TypeScript definitions
// We use dynamic import to avoid issues with server-side rendering
import * as fs from 'fs';
import * as path from 'path';

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
 * Simple fallback function to extract text from a PDF buffer
 * This is a very basic implementation and won't work for all PDFs,
 * but it's sufficient for text-based PDFs in a serverless environment
 */
function extractTextFromPdfBuffer(buffer: Buffer): string {
  console.log('extractTextFromPdfBuffer - Starting basic PDF text extraction');
  
  try {
    // Convert buffer to string and remove binary content
    const bufferString = buffer.toString('utf8', 0, Math.min(buffer.length, 1000000));
    
    // Find text objects - look for common patterns in PDF text objects
    let text = '';
    
    // Extract text from PDF using regex
    // This is a simplified approach and won't work for all PDFs
    const textChunks: string[] = [];
    
    // Look for text between BT and ET tags (text objects in PDF)
    const btEtRegex = /BT\s*(.*?)\s*ET/gs;
    let match;
    while ((match = btEtRegex.exec(bufferString)) !== null) {
      if (match[1]) {
        textChunks.push(match[1]);
      }
    }
    
    // Look for text in content streams
    const streamRegex = /stream\s*(.*?)\s*endstream/gs;
    while ((match = streamRegex.exec(bufferString)) !== null) {
      if (match[1]) {
        const streamContent = match[1];
        // Look for text elements in stream
        const textElementRegex = /\((.*?)\)Tj/g;
        let textMatch;
        while ((textMatch = textElementRegex.exec(streamContent)) !== null) {
          if (textMatch[1]) {
            textChunks.push(textMatch[1]);
          }
        }
        
        // Also look for <...> text format
        const hexTextRegex = /<([0-9A-Fa-f]+)>Tj/g;
        while ((textMatch = hexTextRegex.exec(streamContent)) !== null) {
          if (textMatch[1]) {
            // Convert hex to text
            try {
              const hexText = textMatch[1];
              let decoded = '';
              for (let i = 0; i < hexText.length; i += 2) {
                decoded += String.fromCharCode(parseInt(hexText.substr(i, 2), 16));
              }
              textChunks.push(decoded);
            } catch (e) {
              // Ignore errors in hex conversion
            }
          }
        }
      }
    }
    
    // Join all text chunks
    text = textChunks.join(' ');
    
    console.log('extractTextFromPdfBuffer - Extracted raw text, length:', text.length);
    
    // Additional attempt to find text if the previous methods didn't work
    if (text.length < 100) {
      console.log('extractTextFromPdfBuffer - Trying alternative text extraction method');
      
      // Look for strings in the PDF
      const stringRegex = /\(([^\)\\]*(?:\\.[^\)\\]*)*)\)/g;
      const strings: string[] = [];
      
      while ((match = stringRegex.exec(bufferString)) !== null) {
        if (match[1] && match[1].length > 2) {
          strings.push(match[1]);
        }
      }
      
      if (strings.length > 0) {
        text = strings.join(' ');
        console.log('extractTextFromPdfBuffer - Alternative method extracted text, length:', text.length);
      }
    }
    
    // Last attempt - just extract anything that looks like text
    if (text.length < 100) {
      console.log('extractTextFromPdfBuffer - Trying last resort text extraction');
      
      // Extract anything that looks like text
      const textLikeRegex = /[A-Za-z]{3,}[A-Za-z\s.,;:!?'"-]{10,}/g;
      const textLike: string[] = [];
      
      while ((match = textLikeRegex.exec(bufferString)) !== null) {
        if (match[0]) {
          textLike.push(match[0]);
        }
      }
      
      if (textLike.length > 0) {
        text = textLike.join(' ');
        console.log('extractTextFromPdfBuffer - Last resort method extracted text, length:', text.length);
      }
    }
    
    return text;
  } catch (error) {
    console.error('Error in extractTextFromPdfBuffer:', error);
    return '';
  }
}

/**
 * A minimal PDF text extraction wrapper that handles errors from pdf-parse
 * by providing a fallback extraction method
 */
async function safePdfParse(buffer: Buffer): Promise<string> {
  console.log('safePdfParse - Attempting to parse PDF with pdf-parse');
  
  try {
    // Try using pdf-parse first
    const pdfParse = await import('pdf-parse');
    const data = await pdfParse.default(buffer);
    console.log('safePdfParse - PDF parsed successfully with pdf-parse');
    return data.text || '';
  } catch (error: any) {
    console.warn('safePdfParse - pdf-parse failed, error:', error.message);
    
    // If the error is about the test file, we can fallback to our custom extractor
    if (error.message && (
        error.message.includes('05-versions-space.pdf') || 
        error.code === 'ENOENT' ||
        error.message.includes('no such file or directory')
    )) {
      console.log('safePdfParse - Falling back to custom text extraction');
      return extractTextFromPdfBuffer(buffer);
    }
    
    // For other errors, we might still want to try our fallback
    console.log('safePdfParse - Falling back to custom text extraction for other error');
    return extractTextFromPdfBuffer(buffer);
  }
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
        
        // Use our safe PDF parse function that provides fallbacks
        let text = await safePdfParse(buffer);
        
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
