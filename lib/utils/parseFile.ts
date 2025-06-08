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
  
  // Check if the text looks like binary/PDF structure data
  if (/PDFium|endstream|endobj|\/Type\/|\/Length \d+|\/Filter\/|xref|trailer/.test(text)) {
    console.log('cleanPdfText - PDF structure data detected, applying aggressive cleaning');
    
    // Remove common PDF structure markers and binary data
    text = text
      // Remove PDF object markers completely
      .replace(/\d+ \d+ obj[\s\S]*?endobj/g, '')
      // Remove stream data
      .replace(/stream[\s\S]*?endstream/g, '')
      // Remove xref tables
      .replace(/xref[\s\S]*?trailer/g, '')
      // Remove binary data markers
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u00FF]+/g, ' ')
      // Remove PDF structural syntax
      .replace(/\/[A-Za-z0-9]+/g, ' ') // Remove PDF name objects like /Type, /Page
      .replace(/<<[\s\S]*?>>/g, ' ')   // Remove PDF dictionaries
      .replace(/\[[\s\S]*?\]/g, ' ')   // Remove PDF arrays
      // Remove escaped characters
      .replace(/\\[nrtfb\\()]/g, ' ')
      // Remove non-printable characters
      .replace(/[^\x20-\x7E\n\r\t]/g, ' ');
  }
  
  // Apply standard cleaning for text content
  return text
    // Remove remaining PDF object markers
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
    .replace(/[\u0000-\u001F\u007F-\u00FF]+/g, '')
    // Remove PDF version headers
    .replace(/%PDF-[\d.]+/g, '')
    // Remove other PDF markers
    .replace(/%%EOF/g, '')
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
  
  // Detect if text is mostly binary/garbage
  const binaryPattern = /[^\x20-\x7E\n\r\t]/g;
  const binaryMatches = text.match(binaryPattern) || [];
  const binaryRatio = binaryMatches.length / text.length;
  
  // If more than 15% is binary/non-printable, it's probably not valid text
  if (binaryRatio > 0.15) {
    console.log('isValidText - High binary character ratio detected:', binaryRatio);
    return false;
  }
  
  // Check for PDF structure markers that indicate raw PDF data rather than content
  const pdfStructurePattern = /endobj|xref|trailer|\/Type\/|\/Length \d+|\/Filter\//;
  if (pdfStructurePattern.test(text)) {
    console.log('isValidText - PDF structure markers detected, likely not valid text');
    return false;
  }
  
  // Count words (improved to avoid counting PDF syntax elements as words)
  const words = text.match(/\b[a-zA-Z]{3,}\b/g) || [];
  const wordCount = words.length;
  
  // Should have at least 15 recognizable words
  if (wordCount < 15) {
    console.log('isValidText - Insufficient word count:', wordCount);
    return false;
  }
  
  // Check for sentence structure (periods followed by spaces and capital letters)
  const sentencePattern = /\.\s+[A-Z]/g;
  const sentenceMatches = text.match(sentencePattern) || [];
  
  // Should have at least a few proper sentences
  if (sentenceMatches.length < 2 && text.length > 200) {
    console.log('isValidText - No proper sentence structure detected');
    return false;
  }
  
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
    
    // Clean the text before returning
    text = cleanPdfText(text);
    
    return text;
  } catch (error) {
    console.error('Error in extractTextFromPdfBuffer:', error);
    return '';
  }
}

/**
 * Extract text directly from PDF using advanced techniques
 */
async function extractTextFromPdfAdvanced(buffer: Buffer): Promise<string> {
  console.log('extractTextFromPdfAdvanced - Attempting advanced PDF text extraction');
  
  try {
    // Try multiple approaches to extract text
    let text = await extractTextFromPdfBuffer(buffer);
    
    // If we got some text but it doesn't look valid, try another approach
    if (text && !isValidText(text)) {
      console.log('extractTextFromPdfAdvanced - First extraction attempt produced invalid text, trying alternative method');
      
      // Simplified approach based on string patterns
      const bufferString = buffer.toString('utf8', 0, Math.min(buffer.length, 2000000));
      
      // Try to find blocks of readable text
      const readableTextBlocks: string[] = [];
      const readableTextRegex = /[A-Za-z][A-Za-z\s.,;:!?'"-]{30,}/g;
      let match;
      
      while ((match = readableTextRegex.exec(bufferString)) !== null) {
        if (match[0]) {
          readableTextBlocks.push(match[0]);
        }
      }
      
      if (readableTextBlocks.length > 0) {
        text = readableTextBlocks.join('\n\n');
        console.log('extractTextFromPdfAdvanced - Found readable text blocks, length:', text.length);
      }
    }
    
    // If we still don't have valid text, create a clear error message
    if (!text || !isValidText(text)) {
      console.log('extractTextFromPdfAdvanced - Failed to extract valid text from PDF');
      return 'Failed to extract text from this PDF. The file appears to contain binary data, is encrypted, or uses a format our parser cannot read. Please try a different PDF file.';
    }
    
    return text;
  } catch (error) {
    console.error('Error in extractTextFromPdfAdvanced:', error);
    return 'Error extracting text from PDF. The file may be corrupted or use an unsupported format.';
  }
}

/**
 * This is a complete replacement for pdf-parse that doesn't rely on file system access
 * It patches the functionality to avoid the dependency on test files
 */
async function patchedPdfParse(pdfBuffer: Buffer): Promise<{ text: string, numpages?: number }> {
  console.log('patchedPdfParse - Using patched pdf-parse implementation');
  
  try {
    // Import the PDF.js library (already a dependency of pdf-parse)
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf');
    
    // Load the PDF document
    const pdf = await pdfjsLib.getDocument({
      data: pdfBuffer,
      // Use a proper DocumentInitParameters object
      disableStream: true,
      disableAutoFetch: true
    }).promise;
    
    console.log(`patchedPdfParse - PDF loaded successfully, pages: ${pdf.numPages}`);
    
    // Extract text from all pages
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: any) => 'str' in item ? item.str : '')
        .join(' ');
      text += pageText + '\n\n';
    }
    
    console.log(`patchedPdfParse - Extracted text from ${pdf.numPages} pages, text length: ${text.length}`);
    
    return {
      text,
      numpages: pdf.numPages
    };
  } catch (error) {
    console.error('patchedPdfParse - Error:', error);
    
    // If the patched implementation fails, fall back to extracting text directly
    const extractedText = await extractTextFromPdfAdvanced(pdfBuffer);
    return {
      text: extractedText,
      numpages: 1 // Assume single page as we can't determine actual page count
    };
  }
}

/**
 * A minimal PDF text extraction wrapper that handles errors from pdf-parse
 * by providing a fallback extraction method
 */
async function safePdfParse(buffer: Buffer): Promise<string> {
  console.log('safePdfParse - Starting safe PDF parsing');
  
  try {
    // First try our patched version that doesn't depend on filesystem
    const result = await patchedPdfParse(buffer);
    let text = result.text || '';
    
    // If we got text but it doesn't look valid, try our alternative methods
    if (!isValidText(text)) {
      console.log('safePdfParse - Patched pdf-parse produced invalid text, falling back to advanced extraction');
      return extractTextFromPdfAdvanced(buffer);
    }
    
    return text;
  } catch (error: any) {
    console.warn('safePdfParse - Patched pdf-parse failed:', error.message);
    
    // If the error is about the test file or any other error, try our advanced extractor
    console.log('safePdfParse - Falling back to advanced text extraction');
    return extractTextFromPdfAdvanced(buffer);
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
        
        // Check for binary data in the first few bytes
        const headerBytes = buffer.slice(0, Math.min(100, buffer.length)).toString('utf8');
        if (headerBytes.includes('PDFium') || /[^\x20-\x7E\n\r\t]{10,}/.test(headerBytes)) {
          console.warn('parseFile - PDF appears to contain binary data in header');
          return 'This PDF appears to contain binary data that cannot be parsed. Please try uploading a different version of the document.';
        }
        
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
