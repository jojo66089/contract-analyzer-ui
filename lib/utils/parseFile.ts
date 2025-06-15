import { Buffer } from "buffer";
// Use pdfjs-dist for reliable PDF parsing
import * as fs from 'fs';
import * as path from 'path';

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
 * Improved PDF parsing using pdfjs-dist with better error handling
 */
async function parsePdfWithPdfjs(buffer: Buffer): Promise<string> {
  console.log('parsePdfWithPdfjs - Starting pdfjs-dist extraction');
  
  try {
    // Dynamic import to avoid SSR issues - use legacy build for Node.js
    console.log('parsePdfWithPdfjs - Loading pdfjs-dist legacy build for Node.js compatibility');
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    
    // Properly configure for server-side usage without worker
    if (pdfjsLib.GlobalWorkerOptions) {
      // For server-side rendering, we need to disable the worker
      // Different approaches for different environments
      try {
        pdfjsLib.GlobalWorkerOptions.workerSrc = '';
      } catch (workerError) {
        // If setting empty string fails, try other approaches
        try {
          delete pdfjsLib.GlobalWorkerOptions.workerSrc;
        } catch (deleteError) {
          console.warn('parsePdfWithPdfjs - Could not configure worker options:', deleteError);
        }
      }
    }
    
    // Convert Buffer to Uint8Array for pdfjs-dist compatibility
    const uint8Array = new Uint8Array(buffer);
    console.log('parsePdfWithPdfjs - Converted buffer to Uint8Array, size:', uint8Array.length);
    
    const loadingTask = pdfjsLib.getDocument({
      data: uint8Array,
      verbosity: 0, // Reduce console output
      useWorkerFetch: false, // Disable worker fetch for server-side
      isEvalSupported: false, // Disable eval for security
      useSystemFonts: false, // Don't rely on system fonts
    });
    
    const pdf = await loadingTask.promise;
    console.log(`parsePdfWithPdfjs - PDF loaded with ${pdf.numPages} pages`);
    
    let fullText = '';
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Combine text items with proper spacing
        const pageText = textContent.items
          .map((item: any) => {
            // Handle text items properly
            if (typeof item === 'object' && item.str) {
              return item.str;
            }
            return '';
          })
          .filter(text => text.trim().length > 0)
          .join(' ');
        
        if (pageText.trim()) {
          fullText += pageText + '\n\n';
        }
      } catch (pageError) {
        console.warn(`parsePdfWithPdfjs - Error extracting page ${pageNum}:`, pageError);
        // Continue with other pages
      }
    }
    
    console.log(`parsePdfWithPdfjs - Extracted ${fullText.length} characters from ${pdf.numPages} pages`);
    
    if (fullText && fullText.length > 50) {
      const cleaned = cleanPdfText(fullText);
      if (isValidText(cleaned)) {
        console.log('parsePdfWithPdfjs - Successfully extracted valid text');
        return cleaned;
      }
    }
    
    console.log('parsePdfWithPdfjs - Extracted text is invalid or too short');
    return '';
  } catch (error) {
    console.error('parsePdfWithPdfjs - Error:', error);
    return '';
  }
}

/**
 * OCR fallback using Tesseract.js for image-based PDFs
 * Note: This is computationally expensive and should be used as last resort
 */
async function parsePdfWithOCR(buffer: Buffer): Promise<string> {
  console.log('parsePdfWithOCR - Starting OCR extraction (last resort)');
  
  try {
    // Only attempt OCR in development or if explicitly enabled
    if (process.env.NODE_ENV === 'production' && !process.env.ENABLE_OCR) {
      console.log('parsePdfWithOCR - OCR disabled in production');
      return '';
    }
    
    // This would require converting PDF to images first
    // For now, we'll skip this implementation as it's very resource-intensive
    console.log('parsePdfWithOCR - OCR extraction not implemented (resource-intensive)');
    return '';
  } catch (error) {
    console.error('parsePdfWithOCR - Error:', error);
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
 * Enhanced fallback PDF parsing with better text extraction
 */
function parsePdfEnhancedFallback(buffer: Buffer): string {
  console.log('parsePdfEnhancedFallback - Using enhanced fallback PDF parsing');
  
  try {
    const text = buffer.toString('latin1'); // Use latin1 for better binary handling
    
    let extractedText = '';
    
    // Method 1: Extract text between BT/ET markers (text objects)
    const textObjectRegex = /BT\s*([\s\S]*?)\s*ET/g;
    let match;
    while ((match = textObjectRegex.exec(text)) !== null) {
      const textObject = match[1];
      // Extract text from Tj and TJ operators
      const tjRegex = /\((.*?)\)\s*Tj/g;
      const tjArrayRegex = /\[(.*?)\]\s*TJ/g;
      
      let tjMatch;
      while ((tjMatch = tjRegex.exec(textObject)) !== null) {
        const textContent = tjMatch[1];
        if (textContent && textContent.length > 0) {
          extractedText += textContent + ' ';
        }
      }
      
      while ((tjMatch = tjArrayRegex.exec(textObject)) !== null) {
        const arrayContent = tjMatch[1];
        // Extract strings from array format
        const stringRegex = /\((.*?)\)/g;
        let stringMatch;
        while ((stringMatch = stringRegex.exec(arrayContent)) !== null) {
          const textContent = stringMatch[1];
          if (textContent && textContent.length > 0) {
            extractedText += textContent + ' ';
          }
        }
      }
    }
    
    // Method 2: Look for readable text patterns
    if (extractedText.length < 100) {
      // Extract any parenthesized text that might be content
      const parenthesizedRegex = /\(([^)]{3,})\)/g;
      while ((match = parenthesizedRegex.exec(text)) !== null) {
        const content = match[1];
        // Filter out PDF commands and keep readable text
        if (!/^[0-9\s\.\-]+$/.test(content) && !/^[A-Z]{1,3}$/.test(content)) {
          extractedText += content + ' ';
        }
      }
    }
    
    // Method 3: Extract from stream content with better filtering
    if (extractedText.length < 100) {
      const streamRegex = /stream\s*([\s\S]*?)\s*endstream/g;
      while ((match = streamRegex.exec(text)) !== null) {
        const streamContent = match[1];
        // Extract readable characters and common words
        const readableText = streamContent
          .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
          .replace(/\s+/g, ' ')
          .split(' ')
          .filter(word => word.length > 2 && /[a-zA-Z]/.test(word))
          .join(' ');
        
        if (readableText.length > 10) {
          extractedText += readableText + ' ';
        }
      }
    }
    
    const cleaned = cleanPdfText(extractedText);
    
    if (isValidText(cleaned)) {
      console.log(`parsePdfEnhancedFallback - Successfully extracted ${cleaned.length} characters`);
      return cleaned;
    }
    
    console.log('parsePdfEnhancedFallback - Enhanced fallback extraction did not produce valid text');
    return '';
  } catch (error) {
    console.error('parsePdfEnhancedFallback - Error:', error);
    return '';
  }
}

/**
 * Main PDF parsing function with multiple fallback methods
 */
async function parsePdf(buffer: Buffer): Promise<string> {
  console.log('parsePdf - Starting PDF parsing with multiple methods');
  
  // Method 1: Try pdfjs-dist (most reliable)
  try {
    const pdfjsResult = await parsePdfWithPdfjs(buffer);
    if (pdfjsResult && pdfjsResult.length > 50) {
      console.log('parsePdf - pdfjs-dist method successful');
      return pdfjsResult;
    }
  } catch (pdfjsError) {
    console.warn('parsePdf - pdfjs-dist method failed:', pdfjsError);
  }
  
  // Method 2: Try enhanced fallback parsing
  try {
    const enhancedFallbackResult = parsePdfEnhancedFallback(buffer);
    if (enhancedFallbackResult && enhancedFallbackResult.length > 50) {
      console.log('parsePdf - Enhanced fallback method successful');
      return enhancedFallbackResult;
    }
  } catch (enhancedError) {
    console.warn('parsePdf - Enhanced fallback method failed:', enhancedError);
  }
  
  // Method 3: Try basic fallback parsing
  try {
    const fallbackResult = parsePdfFallback(buffer);
    if (fallbackResult && fallbackResult.length > 50) {
      console.log('parsePdf - Basic fallback method successful');
      return fallbackResult;
    }
  } catch (fallbackError) {
    console.warn('parsePdf - Basic fallback method failed:', fallbackError);
  }
  
  // Method 4: Last resort - return descriptive error
  console.log('parsePdf - All parsing methods failed');
  throw new Error('Failed to extract text from this PDF. The file may be:\n• Password-protected or encrypted\n• Scanned images without OCR text layer\n• Corrupted or using an unsupported PDF format\n• Contains only images or graphics\n\nPlease try:\n• Converting to a text-based PDF\n• Using OCR software first\n• Ensuring the PDF is not password-protected');
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
