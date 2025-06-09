import { Clause } from '../types';

// Simple keyword-based clause type extraction
const CLAUSE_TYPE_KEYWORDS: Record<string, string> = {
  termination: 'Termination',
  confidentiality: 'Confidentiality',
  indemnification: 'Indemnification',
  liability: 'Liability',
  dispute: 'Dispute Resolution',
  payment: 'Payment',
  warranty: 'Warranty',
  assignment: 'Assignment',
  force: 'Force Majeure',
  governing: 'Governing Law',
  jurisdiction: 'Jurisdiction',
  amendment: 'Amendment',
  notice: 'Notice',
  severability: 'Severability',
  entire: 'Entire Agreement',
  intellectual: 'Intellectual Property',
  audit: 'Audit',
  insurance: 'Insurance',
  noncompete: 'Non-Compete',
  'non-solicit': 'Non-Solicit',
  arbitration: 'Arbitration',
  agreement: 'Agreement',
  disclosure: 'Disclosure',
  term: 'Term and Termination',
  license: 'License',
  privacy: 'Privacy',
  compliance: 'Compliance',
  limitation: 'Limitation of Liability',
  consent: 'Consent',
  obligations: 'Obligations',
  purpose: 'Purpose',
  representations: 'Representations and Warranties',
  remedies: 'Remedies',
  waiver: 'Waiver',
  compensation: 'Compensation',
  confidential: 'Confidentiality',
  non: 'Non-Disclosure'
};

function extractClauseType(text: string): string | undefined {
  const lower = text.toLowerCase();
  for (const [keyword, type] of Object.entries(CLAUSE_TYPE_KEYWORDS)) {
    if (lower.includes(keyword)) return type;
  }
  return undefined;
}

/**
 * Removes binary data and cleans up text for clause extraction
 */
function cleanForClauseExtraction(text: string): string {
  if (!text) return '';
  
  // Check if text contains PDF structural data or binary content
  const binaryIndicators = [
    /endobj|xref|trailer|\/Type\/|\/Length \d+|\/Filter\/|PDFium/,
    /D:\d{14}\s+PDFium/,  // PDF timestamp markers like "D:20250608020620 PDFium"
    /stream[\s\S]*?endstream/,  // PDF stream data
    /\d+\s+\d+\s+obj/,  // PDF object markers
    /%%EOF/,  // PDF end marker
    /%PDF-\d\.\d/  // PDF header
  ];
  
  for (const pattern of binaryIndicators) {
    if (pattern.test(text)) {
      console.log('cleanForClauseExtraction - PDF structure/binary data detected');
      throw new Error('PDF contains binary or structural data that cannot be parsed');
    }
  }
  
  // Check for high ratio of non-printable or random characters
  const totalChars = text.length;
  const printableChars = (text.match(/[a-zA-Z0-9\s.,;:!?'"()-]/g) || []).length;
  const printableRatio = printableChars / Math.max(totalChars, 1);
  
  if (printableRatio < 0.6 && totalChars > 100) {
    console.log('cleanForClauseExtraction - Too many non-printable characters:', printableRatio);
    throw new Error('Text contains too many non-printable characters - likely corrupted');
  }
  
  // Check if text looks like random character sequences
  const words = text.split(/\s+/).filter(word => word.length > 2);
  const validWords = words.filter(word => /^[a-zA-Z][a-zA-Z0-9]*$/.test(word));
  const validWordRatio = validWords.length / Math.max(words.length, 1);
  
  if (validWordRatio < 0.2 && text.length > 100) {
    console.log('cleanForClauseExtraction - Too few valid words, text appears corrupted:', validWordRatio);
    throw new Error('Text appears to be corrupted or contains mostly invalid characters');
  }
  
  // Remove any remaining non-printable characters
  text = text.replace(/[^\x20-\x7E\n\r\t]/g, ' ');
  
  // Clean up whitespace
  return text
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Function to validate if a text segment looks like a legitimate clause
function isValidClause(text: string): boolean {
  if (!text || text.length < 10) return false;
  
  // Count readable characters
  const readableChars = (text.match(/[a-zA-Z0-9\s.,;:!?'"()-]/g) || []).length;
  const totalChars = text.length;
  
  // Should be at least 70% readable characters
  if (readableChars / totalChars < 0.7) {
    console.log('isValidClause - Less than 70% readable characters');
    return false;
  }
  
  // Should contain some actual words
  const words = text.match(/\b[a-zA-Z]{3,}\b/g) || [];
  if (words.length < 3) {
    console.log('isValidClause - Fewer than 3 actual words');
    return false;
  }
  
  // Detect if the text is mostly binary or PDF structural data
  if (/endobj|xref|trailer|\/Type\/|\/Length \d+|\/Filter\/|PDFium/.test(text)) {
    console.log('isValidClause - PDF structure data detected');
    return false;
  }
  
  // Check for natural language patterns (e.g., articles, prepositions)
  const naturalLanguagePattern = /\b(the|a|an|in|of|to|for|with|by|on|at)\b/i;
  if (!naturalLanguagePattern.test(text) && text.length > 50) {
    console.log('isValidClause - No natural language patterns detected');
    return false;
  }
  
  return true;
}

// Function to extract a meaningful title from clause text
function extractTitle(text: string): string | undefined {
  const cleanText = text.trim();
  if (!cleanText) return undefined;
  
  // Try to find the first meaningful line as title
  const lines = cleanText.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return undefined;
  
  // Check if the first line looks like a title
  const firstLine = lines[0];
  if (firstLine.length < 100 && firstLine.length > 5) {
    // Remove common section markers from the title
    const titleCandidate = firstLine
      .replace(/^(Section|Article|Clause|§)\s*[\dIVXLC]+[.)]?\s*/i, '')
      .replace(/^\d+[.)]?\s*/, '')
      .trim();
    
    if (titleCandidate && titleCandidate.length > 0 && titleCandidate.length < 80) {
      return titleCandidate;
    }
  }
  
  // Attempt to extract clause type from content
  const clauseType = extractClauseType(cleanText);
  if (clauseType) {
    return clauseType;
  }
  
  // Fallback: try to extract a title from the beginning of the text
  const words = cleanText.split(/\s+/).slice(0, 10).join(' ');
  if (words.length > 0 && words.length < 80) {
    return words;
  }
  
  return undefined;
}

export function splitClauses(text: string): Clause[] {
  console.log('splitClauses - Starting with text length:', text.length);
  
  // First clean the text for clause extraction
  let cleanedText: string;
  try {
    cleanedText = cleanForClauseExtraction(text);
  } catch (error) {
    console.error('splitClauses - Text cleaning failed:', error);
    // Re-throw the error so it can be caught at the upload level
    throw new Error(`Document parsing failed: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  // First validate the input text
  if (!cleanedText || cleanedText.trim().length < 50) {
    console.warn('splitClauses: Input text is too short or empty');
    return [{
      id: 'error-short',
      text: 'The document text is too short or could not be properly extracted. Please check the file and try again.',
      title: 'Document Error',
      riskLevel: 'high'
    }];
  }
  
  const clauses: Clause[] = [];
  let idx = 0;
  
  // Strategy 1: Look for numbered sections with § symbol or Roman numerals
  const sectionRegex = /(?:^|\n)(§\s*[\dIVXLC]+\.?\d*|[IVX]+\.\s*|Section\s+[\dIVXLC]+\.?\d*|Article\s+[\dIVXLC]+\.?\d*)\s*([^\n]*?)(?=\n(?:§\s*[\dIVXLC]+\.?\d*|[IVX]+\.\s*|Section\s+[\dIVXLC]+\.?\d*|Article\s+[\dIVXLC]+\.?\d*|\n\s*$))/gims;
  
  let match;
  let matchFound = false;
  while ((match = sectionRegex.exec(cleanedText)) !== null) {
    matchFound = true;
    const [full, sectionMarker, rest] = match;
    const clauseText = full.trim();
    
    // Validate the clause before adding it
    if (!isValidClause(clauseText)) {
      console.warn(`splitClauses: Skipping invalid section: ${clauseText.substring(0, 50)}...`);
      continue;
    }
    
    // Extract a meaningful title
    const title = extractTitle(clauseText);
    
    clauses.push({
      id: `clause-${idx++}`,
      text: clauseText,
      title,
      riskLevel: 'medium'
    });
  }
  
  // Strategy 2: If no sections found, look for numbered paragraphs
  if (clauses.length === 0) {
    console.log('splitClauses: No sections found, trying numbered paragraphs');
    const numberedRegex = /(?:^|\n)(\d+\.?\d*)\s*([^\n]*?)(?=\n\d+\.?\d*\s*|\n\s*$)/gims;
    
    while ((match = numberedRegex.exec(cleanedText)) !== null) {
      matchFound = true;
      const [full, number, rest] = match;
      const clauseText = full.trim();
      
      if (!isValidClause(clauseText)) {
        console.warn(`splitClauses: Skipping invalid numbered clause: ${clauseText.substring(0, 50)}...`);
        continue;
      }
      
      const title = extractTitle(clauseText);
      
      clauses.push({
        id: `clause-${idx++}`,
        text: clauseText,
        title,
        riskLevel: 'medium'
      });
    }
  }
  
  // Strategy 3: Fallback to paragraph splitting
  if (clauses.length === 0) {
    console.log('splitClauses: No structured clauses found, falling back to paragraph splitting');
    const paras = cleanedText.split(/\n\s*\n/);
    for (let i = 0; i < paras.length; i++) {
      const para = paras[i].trim();
      if (!para) continue;
      
      // Validate paragraph before creating clause
      if (!isValidClause(para)) {
        console.warn(`splitClauses: Skipping invalid paragraph: ${para.substring(0, 50)}...`);
        continue;
      }
      
      // Extract a meaningful title from the paragraph
      const title = extractTitle(para);
      
      clauses.push({
        id: `para-${i}`,
        text: para,
        title,
        riskLevel: 'medium'
      });
    }
  }
  
  // Strategy 4: If still no clauses, check if we have found any matches but they were all invalid
  if (clauses.length === 0 && matchFound) {
    console.log('splitClauses: Found patterns but all were invalid, creating error clause');
    return [{
      id: 'invalid-content',
      text: 'The document appears to contain invalid content or binary data. Please try uploading a different file or format.',
      title: 'Invalid Content',
      riskLevel: 'high'
    }];
  }
  
  // Strategy 5: If still no clauses, create a single clause with the entire text
  if (clauses.length === 0) {
    console.log('splitClauses: Creating single clause from entire text');
    // Final check if the text looks valid at all
    if (!isValidClause(cleanedText)) {
      return [{
        id: 'binary-data',
        text: 'The document appears to contain binary data instead of text. Please try uploading a different file or format.',
        title: 'Binary Data Detected',
        riskLevel: 'high'
      }];
    }
    
    clauses.push({
      id: 'full-text',
      text: cleanedText.trim(),
      title: 'Full Document',
      riskLevel: 'medium'
    });
  }
  
  console.log(`splitClauses: Extracted ${clauses.length} clauses`);
  return clauses;
} 