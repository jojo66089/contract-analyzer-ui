import { Buffer } from "buffer";
// Use require for pdf-parse since it doesn't have proper TypeScript definitions
// We use dynamic import to avoid issues with server-side rendering
import * as fs from 'fs';
import * as path from 'path';
import pdfParse from 'pdf-parse';

/**
 * Clean PDF text by removing binary data and formatting issues
 */
function cleanPdfText(text: string): string {
  if (!text) return '';
  
  // Remove PDF metadata and structure markers
  text = text.replace(/<<[^>]+>>/g, ' ');
  text = text.replace(/\d+\s+\d+\s+obj/g, ' ');
  text = text.replace(/endobj/g, ' ');
  text = text.replace(/stream\s*[\s\S]*?endstream/g, ' ');
  text = text.replace(/xref[\s\S]*?trailer/g, ' ');
  
  // Remove PDF commands and operators
  text = text.replace(/\b(BT|ET|Td|TD|Tj|TJ|Tm|q|Q|gs|rg|RG|re|f|S|s|W|w|c|m|l|h)\b/g, ' ');
  
  // Remove hex strings and other PDF artifacts
  text = text.replace(/<[0-9a-fA-F\s]+>/g, ' ');
  text = text.replace(/\[[0-9\s\-\.]+\]/g, ' ');
  
  // Remove excessive whitespace and normalize
  text = text.replace(/\s+/g, ' ');
  text = text.replace(/\n\s*\n/g, '\n');
  
  return text.trim();
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
  const pdfStructurePattern = /endobj|xref|trailer|\/Type\/|\/Length \d+|\/Filter\/|PDFium/;
  if (pdfStructurePattern.test(text)) {
    console.log('isValidText - PDF structure markers detected');
    return false;
  }
  
  // Check for common readable text patterns
  const readablePattern = /[a-zA-Z]{3,}/;
  if (!readablePattern.test(text)) {
    console.log('isValidText - No readable text patterns found');
    return false;
  }
  
  return true;
}

/**
 * Improved PDF parsing using pdf-parse with better error handling
 */
async function parsePdfWithPdfParse(buffer: Buffer): Promise<string> {
  console.log('parsePdfWithPdfParse - Starting pdf-parse extraction');
  
  try {
    const data = await pdfParse(buffer);
    
    console.log(`parsePdfWithPdfParse - Extracted ${data.text.length} characters from ${data.numpages} pages`);
    
    if (data.text && data.text.length > 50) {
      const cleaned = cleanPdfText(data.text);
      if (isValidText(cleaned)) {
        console.log('parsePdfWithPdfParse - Successfully extracted valid text');
        return cleaned;
      }
    }
    
    console.log('parsePdfWithPdfParse - Extracted text is invalid or too short');
    return '';
  } catch (error) {
    console.error('parsePdfWithPdfParse - Error:', error);
    return '';
  }
}

/**
 * Fallback PDF parsing using basic buffer analysis
 */
function parsePdfFallback(buffer: Buffer): string {
  console.log('parsePdfFallback - Using fallback PDF parsing');
  
  try {
    const text = buffer.toString('utf8');
    
    // Extract text between stream markers
    const streamRegex = /stream\s*([\s\S]*?)\s*endstream/g;
    let extractedText = '';
    let match;
    
    while ((match = streamRegex.exec(text)) !== null) {
      const streamContent = match[1];
      // Try to extract readable text from stream
      const readableText = streamContent.replace(/[^\x20-\x7E\n\r\t]/g, ' ');
      if (readableText.length > 10) {
        extractedText += readableText + ' ';
      }
    }
    
    // Also try to find text outside streams
    const outsideStreams = text.replace(/stream\s*[\s\S]*?endstream/g, ' ');
    const readableOutside = outsideStreams.replace(/[^\x20-\x7E\n\r\t]/g, ' ');
    extractedText += readableOutside;
    
    const cleaned = cleanPdfText(extractedText);
    
    if (isValidText(cleaned)) {
      console.log(`parsePdfFallback - Successfully extracted ${cleaned.length} characters`);
      return cleaned;
    }
    
    console.log('parsePdfFallback - Fallback extraction did not produce valid text');
    return '';
  } catch (error) {
    console.error('parsePdfFallback - Error:', error);
    return '';
  }
}

/**
 * Main PDF parsing function with multiple fallback methods
 */
async function parsePdf(buffer: Buffer): Promise<string> {
  console.log('parsePdf - Starting PDF parsing with multiple methods');
  
  // Method 1: Try pdf-parse (most reliable)
  const pdfParseResult = await parsePdfWithPdfParse(buffer);
  if (pdfParseResult) {
    console.log('parsePdf - pdf-parse method successful');
    return pdfParseResult;
  }
  
  // Method 2: Try fallback parsing
  const fallbackResult = parsePdfFallback(buffer);
  if (fallbackResult) {
    console.log('parsePdf - Fallback method successful');
    return fallbackResult;
  }
  
  // Method 3: Last resort - return descriptive error
  console.log('parsePdf - All parsing methods failed');
  throw new Error('Failed to extract text from this PDF. The file appears to contain binary data, is encrypted, or uses a format our parser cannot read. Please try a different PDF file.');
}

/**
 * Parse DOCX files using simple text extraction
 */
async function parseDocx(buffer: Buffer): Promise<string> {
  try {
    // For now, return a placeholder - we can implement DOCX parsing later
    throw new Error('DOCX parsing not yet implemented');
  } catch (error) {
    throw new Error('Failed to parse DOCX file. Please convert to PDF and try again.');
  }
}

/**
 * Main file parsing function
 */
export async function parseFile(file: Buffer | Uint8Array, mimetype: string): Promise<string> {
  console.log('parseFile - Starting with mimetype:', mimetype, 'buffer size:', file.length);
  
  try {
    const buffer = Buffer.from(file);
    console.log('parseFile - Buffer created, size:', buffer.length);

    if (mimetype === 'application/pdf' || mimetype.includes('pdf')) {
      console.log('parseFile - Processing PDF file');
      const text = await parsePdf(buffer);
      
      console.log('parseFile - Raw text first 200 chars:', text.substring(0, 200));
      
      // Final validation
      if (!isValidText(text)) {
        throw new Error('Extracted text appears to be corrupted or binary data');
      }
      
      console.log('parseFile - PDF parsing successful');
      return text;
    } 
    
    if (mimetype.includes('wordprocessingml') || mimetype.includes('docx')) {
      console.log('parseFile - Processing DOCX file');
      return await parseDocx(buffer);
    }
    
    // For other file types, try to parse as plain text
    console.log('parseFile - Processing as plain text');
    const text = buffer.toString('utf8');
    
    if (text.length < 50) {
      throw new Error('File appears to be empty or too short');
    }
    
    return text;
    
  } catch (error) {
    console.error('parseFile - Error:', error);
    throw error;
  }
}

export default parseFile;
