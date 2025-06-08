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
};

function extractClauseType(text: string): string | undefined {
  const lower = text.toLowerCase();
  for (const [keyword, type] of Object.entries(CLAUSE_TYPE_KEYWORDS)) {
    if (lower.includes(keyword)) return type;
  }
  return undefined;
}

// Function to validate if a text segment looks like a legitimate clause
function isValidClause(text: string): boolean {
  if (!text || text.length < 10) return false;
  
  // Check for PDF artifacts that shouldn't be in clauses
  if (text.includes('obj') && text.includes('endobj')) return false;
  if (text.match(/^[\d\s]+$/)) return false; // Just numbers
  if (text.match(/^x[\u0000-\u001F\u007F-\u00FF]+/)) return false; // Binary data
  
  // Count readable characters
  const readableChars = (text.match(/[a-zA-Z0-9\s.,;:!?'"()-]/g) || []).length;
  const totalChars = text.length;
  
  // Should be at least 70% readable characters
  if (readableChars / totalChars < 0.7) return false;
  
  // Should contain some actual words
  const words = text.match(/\b[a-zA-Z]{2,}\b/g) || [];
  if (words.length < 3) return false;
  
  return true;
}

// Function to extract a meaningful title from clause text
function extractTitle(text: string, clauseNumber?: string): string | undefined {
  // Clean the text first
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
  
  // Fallback: try to extract a title from the beginning of the text
  const words = cleanText.split(/\s+/).slice(0, 10).join(' ');
  if (words.length > 0 && words.length < 80) {
    return words;
  }
  
  return undefined;
}

export function splitClauses(text: string): Clause[] {
  // First validate the input text
  if (!text || text.trim().length < 50) {
    console.warn('splitClauses: Input text is too short or empty');
    return [];
  }
  
  // Check if the text looks like valid contract content
  const words = text.match(/\b[a-zA-Z]{2,}\b/g) || [];
  if (words.length < 10) {
    console.warn('splitClauses: Input text does not contain enough words');
    return [];
  }
  
  const clauses: Clause[] = [];
  let idx = 0;
  
  // Try multiple splitting strategies
  
  // Strategy 1: Look for numbered sections with § symbol or Roman numerals
  const sectionRegex = /(?:^|\n)(§\s*[\dIVXLC]+\.?\d*|[IVX]+\.\s*|Section\s+[\dIVXLC]+\.?\d*|Article\s+[\dIVXLC]+\.?\d*)\s*([^\n]*?)(?=\n(?:§\s*[\dIVXLC]+\.?\d*|[IVX]+\.\s*|Section\s+[\dIVXLC]+\.?\d*|Article\s+[\dIVXLC]+\.?\d*|\n\s*$))/gims;
  
  let match;
  while ((match = sectionRegex.exec(text)) !== null) {
    const [full, sectionMarker, rest] = match;
    const clauseText = full.trim();
    
    // Validate the clause before adding it
    if (!isValidClause(clauseText)) {
      console.warn(`splitClauses: Skipping invalid section: ${clauseText.substring(0, 50)}...`);
      continue;
    }
    
    // Extract a meaningful title
    const title = extractTitle(clauseText, sectionMarker);
    
    clauses.push({
      id: `clause-${idx++}`,
      text: clauseText,
      title,
      riskLevel: 'medium'
    });
  }
  
  // Strategy 2: If no sections found, look for numbered paragraphs
  if (clauses.length === 0) {
    const numberedRegex = /(?:^|\n)(\d+\.?\d*)\s*([^\n]*?)(?=\n\d+\.?\d*\s*|\n\s*$)/gims;
    
    while ((match = numberedRegex.exec(text)) !== null) {
      const [full, number, rest] = match;
      const clauseText = full.trim();
      
      if (!isValidClause(clauseText)) {
        console.warn(`splitClauses: Skipping invalid numbered clause: ${clauseText.substring(0, 50)}...`);
        continue;
      }
      
      const title = extractTitle(clauseText, number);
      
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
    const paras = text.split(/\n\s*\n/);
    for (let i = 0; i < paras.length; i++) {
      const para = paras[i].trim();
      if (!para) continue;
      
      // Validate paragraph before creating clause
      if (!isValidClause(para)) {
        console.warn(`splitClauses: Skipping invalid paragraph: ${para.substring(0, 50)}...`);
        continue;
      }
      
      // Extract a meaningful title from the paragraph
      const title = extractTitle(para, `${i + 1}`);
      
      clauses.push({
        id: `para-${i}`,
        text: para,
        title,
        riskLevel: 'medium'
      });
    }
  }
  
  // Strategy 4: If still no clauses, split by major headings or dashes
  if (clauses.length === 0) {
    console.log('splitClauses: Trying heading-based splitting');
    const headingRegex = /(?:^|\n)((?:[A-Z][A-Z\s]{10,}|---\s*[^\n]+\s*---|[IVX]+\.\s*[^\n]+))(?:\n|$)([\s\S]*?)(?=\n(?:[A-Z][A-Z\s]{10,}|---\s*[^\n]+\s*---|[IVX]+\.\s*[^\n]+)|\n*$)/gims;
    
    while ((match = headingRegex.exec(text)) !== null) {
      const [full, heading, content] = match;
      const clauseText = (heading + '\n' + content).trim();
      
      if (!isValidClause(clauseText)) {
        continue;
      }
      
      const title = heading.replace(/^---\s*/, '').replace(/\s*---$/, '').trim();
      
      clauses.push({
        id: `heading-${idx++}`,
        text: clauseText,
        title: title.length > 0 && title.length < 100 ? title : undefined,
        riskLevel: 'medium'
      });
    }
  }

  console.log(`splitClauses: Successfully extracted ${clauses.length} valid clauses`);
  return clauses;
} 