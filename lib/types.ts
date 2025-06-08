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
}

export interface SummaryInsights {
  overallRisk: string
  riskScore: number // e.g., 1-10
  ambiguousTerms: string[] // List of globally ambiguous terms
  unfairClauses: { clauseId: string; description: string }[]
  missingClauses: string[] // List of standard clauses that are missing
  keyFindings: string[] // Other important observations
  actionableSuggestions: string[]
}

export interface DocumentDetails {
  id: string
  name: string
  uploadDate: string
  fullText: string // The entire contract text
}
