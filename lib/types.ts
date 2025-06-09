export interface Clause {
  id: string
  title?: string
  text: string
  pageNumber?: number
  riskLevel?: "high" | "medium" | "low"
}

export interface Analysis {
  clauseId: string
  ambiguities: string[]
  risks: string[]
  recommendations: string[]
  missingElements?: string[]
  references?: string[] // Citations to legal sources
  citations?: string[] // Specific text snippets from the clause that are problematic
  riskLevel?: 'high' | 'medium' | 'low'
  problematicText?: string[] // Specific problematic phrases or sentences
}

export interface SummaryInsights {
  overallRisk: string
  riskScore: number // e.g., 1-10
  ambiguousTerms: string[] // List of globally ambiguous terms
  unfairClauses: { clauseId: string; description: string; clauseTitle?: string; citation?: string }[]
  missingClauses: string[] // List of standard clauses that are missing
  keyFindings: string[] // Other important observations
  actionableSuggestions: string[]
  problematicClauses: { clauseId: string; title: string; issues: string[]; citations: string[] }[] // Detailed problematic clause citations
}

export interface DocumentDetails {
  id: string
  name: string
  uploadDate: string
  fullText: string // The entire contract text
}
