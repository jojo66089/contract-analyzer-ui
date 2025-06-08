import { Clause } from '../types/contract';

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

export function splitClauses(text: string): Clause[] {
  // Enhanced regex for legal clauses (Section, Article, Clause, §, etc.)
  const clauseRegex = /(?:^|\n)(Section|Article|Clause|§)?\s*([\dIVXLC]+)[.)]?\s*(.*?)(?=\n(?:Section|Article|Clause|§)?\s*[\dIVXLC]+[.)]?|\n*$)/gims;
  const clauses: Clause[] = [];
  let match;
  let idx = 0;

  while ((match = clauseRegex.exec(text)) !== null) {
    const [full, sectionType, number, rest] = match;
    const startIndex = match.index;
    const endIndex = clauseRegex.lastIndex;
    // Multi-line title: take first non-empty line as title
    const lines = rest.split('\n').map(l => l.trim()).filter(Boolean);
    const title = lines[0] || undefined;
    const clauseText = full.trim();
    const clauseType = extractClauseType(title || clauseText);
    clauses.push({
      id: `clause-${idx++}`,
      text: clauseText,
      metadata: {
        clauseNumber: number,
        title,
        startIndex,
        endIndex,
        clauseType,
      },
    });
  }

  // Fallback: if no clauses found, split by paragraphs
  if (clauses.length === 0) {
    const paras = text.split(/\n{2,}/);
    for (let i = 0; i < paras.length; i++) {
      const para = paras[i].trim();
      if (!para) continue;
      const clauseType = extractClauseType(para);
      clauses.push({
        id: `para-${i}`,
        text: para,
        metadata: {
          clauseNumber: `${i + 1}`,
          title: undefined,
          startIndex: text.indexOf(para),
          endIndex: text.indexOf(para) + para.length,
          clauseType,
        },
      });
    }
  }

  return clauses;
} 