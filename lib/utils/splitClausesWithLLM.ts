import { Clause } from '../types';

/**
 * Intelligently splits contract text into clauses using LLM analysis
 * This provides much better clause separation than keyword-based approaches
 */
export async function splitClausesWithLLM(contractText: string): Promise<Clause[]> {
  console.log('splitClausesWithLLM - Starting with text length:', contractText.length);
  
  if (!contractText || contractText.trim().length < 50) {
    console.warn('splitClausesWithLLM: Input text is too short');
    return [{
      id: 'error-short',
      text: 'The document text is too short or could not be properly extracted.',
      title: 'Document Error',
      riskLevel: 'high'
    }];
  }

  try {
    // Call our LLM API specifically for clause separation
    const response = await fetch('/api/llm/split-clauses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contractText: contractText.trim()
      }),
    });

    if (!response.ok) {
      console.error('splitClausesWithLLM - LLM API error:', response.status);
      throw new Error(`LLM API error: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.clauses && Array.isArray(result.clauses)) {
      console.log(`splitClausesWithLLM - Successfully extracted ${result.clauses.length} clauses via LLM`);
      
      // Convert to proper Clause objects with IDs and metadata
      const clauses: Clause[] = result.clauses.map((clause: any, index: number) => ({
        id: `llm-clause-${index + 1}`,
        text: clause.text || clause.content || clause,
        title: clause.title || clause.heading || extractTitleFromText(clause.text || clause.content || clause),
        riskLevel: 'medium' as const,
        pageNumber: clause.page || undefined
      }));

      // Validate clauses
      const validClauses = clauses.filter(clause => 
        clause.text && 
        clause.text.length > 20 && 
        isValidClauseText(clause.text)
      );

      if (validClauses.length === 0) {
        console.warn('splitClausesWithLLM - No valid clauses extracted from LLM response');
        throw new Error('No valid clauses extracted');
      }

      return validClauses;
    } else {
      console.warn('splitClausesWithLLM - Invalid LLM response format');
      throw new Error('Invalid LLM response format');
    }

  } catch (error) {
    console.error('splitClausesWithLLM - Error:', error);
    
    // Fallback to enhanced regex-based splitting if LLM fails
    console.log('splitClausesWithLLM - Falling back to enhanced regex splitting');
    return fallbackClauseSplit(contractText);
  }
}

/**
 * Enhanced fallback clause splitting using improved regex patterns
 */
function fallbackClauseSplit(contractText: string): Clause[] {
  console.log('fallbackClauseSplit - Using enhanced fallback method');
  
  const clauses: Clause[] = [];
  let idx = 0;

  // Clean the text first
  const cleanedText = contractText
    .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Enhanced patterns for clause detection
  const patterns = [
    // Numbered sections with titles (e.g., "1. Definitions", "Section 1 - Payment Terms")
    /(?:^|\n\n)\s*((?:Section|Article|Clause)\s+\d+\.?\s*[-–—]?\s*[^\n]+|^\s*\d+\.?\s+[A-Z][^\n]+?)[\.\:]?\s*\n([\s\S]*?)(?=\n\n\s*(?:Section|Article|Clause)\s+\d+|\n\n\s*\d+\.|\n\n\s*[A-Z\s]{10,}\s*\n|$)/gim,
    
    // Roman numerals (I., II., III., etc.)
    /(?:^|\n\n)\s*([IVX]+\.?\s+[^\n]+?)[\.\:]?\s*\n([\s\S]*?)(?=\n\n\s*[IVX]+\.|\n\n\s*\d+\.|\n\n\s*[A-Z\s]{10,}\s*\n|$)/gim,
    
    // Lettered sections (A., B., C., etc.)
    /(?:^|\n\n)\s*([A-Z]\.?\s+[^\n]+?)[\.\:]?\s*\n([\s\S]*?)(?=\n\n\s*[A-Z]\.|\n\n\s*\d+\.|\n\n\s*[A-Z\s]{10,}\s*\n|$)/gim,

    // All caps headings followed by content
    /(?:^|\n\n)\s*([A-Z\s]{5,})\s*\n([\s\S]*?)(?=\n\n\s*[A-Z\s]{5,}\s*\n|\n\n\s*\d+\.|\n\n\s*[IVX]+\.|$)/gim
  ];

  for (const pattern of patterns) {
    let match;
    pattern.lastIndex = 0; // Reset regex
    
    while ((match = pattern.exec(cleanedText)) !== null) {
      const [fullMatch, heading, content] = match;
      const clauseText = (heading + '\n' + content).trim();
      
      if (isValidClauseText(clauseText)) {
        const title = extractTitleFromText(heading) || `Clause ${idx + 1}`;
        
        clauses.push({
          id: `fallback-clause-${idx + 1}`,
          text: clauseText,
          title: title,
          riskLevel: 'medium'
        });
        idx++;
      }
    }
    
    if (clauses.length > 0) {
      break; // Stop at first successful pattern
    }
  }

  // If no structured clauses found, split by paragraphs
  if (clauses.length === 0) {
    console.log('fallbackClauseSplit - No structured clauses found, splitting by paragraphs');
    const paragraphs = cleanedText.split(/\n\s*\n/);
    
    for (let i = 0; i < paragraphs.length; i++) {
      const para = paragraphs[i].trim();
      if (para && isValidClauseText(para)) {
        clauses.push({
          id: `paragraph-${i + 1}`,
          text: para,
          title: extractTitleFromText(para) || `Paragraph ${i + 1}`,
          riskLevel: 'medium'
        });
      }
    }
  }

  // Last resort: treat entire text as one clause
  if (clauses.length === 0) {
    console.log('fallbackClauseSplit - Creating single clause from entire text');
    clauses.push({
      id: 'full-document',
      text: cleanedText,
      title: 'Full Document',
      riskLevel: 'medium'
    });
  }

  console.log(`fallbackClauseSplit - Extracted ${clauses.length} clauses`);
  return clauses;
}

/**
 * Validates if text looks like a legitimate contract clause
 */
function isValidClauseText(text: string): boolean {
  if (!text || text.length < 20) return false;
  
  // Check for reasonable amount of actual words
  const words = text.match(/\b[a-zA-Z]{3,}\b/g) || [];
  if (words.length < 5) return false;
  
  // Check for reasonable character distribution
  const readableChars = (text.match(/[a-zA-Z0-9\s.,;:!?'"()-]/g) || []).length;
  const readableRatio = readableChars / text.length;
  if (readableRatio < 0.7) return false;
  
  // Check for natural language patterns
  const naturalLanguagePattern = /\b(the|a|an|in|of|to|for|with|by|on|at|shall|will|may|must)\b/i;
  if (!naturalLanguagePattern.test(text)) return false;
  
  return true;
}

/**
 * Extracts a meaningful title from clause text
 */
function extractTitleFromText(text: string): string | undefined {
  if (!text) return undefined;
  
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return undefined;
  
  const firstLine = lines[0];
  
  // Clean up section markers and get title
  const cleanTitle = firstLine
    .replace(/^(Section|Article|Clause|§)\s*[\dIVXLC]+[.)]?\s*[-–—]?\s*/i, '')
    .replace(/^\d+[.)]?\s*[-–—]?\s*/, '')
    .replace(/^[A-Z][.)]?\s*[-–—]?\s*/, '')
    .replace(/[.:]+$/, '')
    .trim();
  
  if (cleanTitle && cleanTitle.length > 0 && cleanTitle.length < 100) {
    return cleanTitle;
  }
  
  // Fallback: extract from first few words
  const words = text.split(/\s+/).slice(0, 8).join(' ');
  if (words && words.length < 80) {
    return words.replace(/[.:]+$/, '').trim();
  }
  
  return undefined;
} 