import { Buffer } from "buffer";
// Use require for pdf-parse since it doesn't have proper TypeScript definitions
// We use dynamic import to avoid issues with server-side rendering

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
  try {
    if (mimetype === 'application/pdf') {
      try {
        // Dynamic import of pdf-parse
        const pdfParse = (await import('pdf-parse')).default;
        const data = await pdfParse(Buffer.from(file));
        let text = data.text || '';
        
        // Clean the text
        text = cleanPdfText(text);
        
        // Check if the cleaned text looks valid
        if (!isValidText(text)) {
          console.warn('PDF parsing - Extracted text does not look like meaningful content');
          return 'This PDF appears to contain mostly binary data or is corrupted. Please try uploading a different version of the document.';
        }
        
        return text;
      } catch (error) {
        console.error('PDF parsing error:', error);
        return 'Failed to extract text from PDF. The file may be corrupted, password-protected, or contain only images.';
      }
    }

    if (
      mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimetype === 'application/msword'
    ) {
      // For Word documents, use mammoth if available
      try {
        const mammoth = await import('mammoth');
        const { value } = await mammoth.extractRawText({ buffer: Buffer.from(file) });
        return value.trim();
      } catch (error) {
        console.error('DOCX parsing error:', error);
        throw new Error('Failed to extract text from Word document');
      }
    }

    throw new Error(`Unsupported file type: ${mimetype}`);
  } catch (error: any) {
    console.error('Error parsing file:', error);
    throw new Error(`Failed to parse file: ${error.message}`);
  }
}

export default parseFile;
