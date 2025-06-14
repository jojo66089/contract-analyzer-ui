import type { Clause, Analysis, SummaryInsights, DocumentDetails } from "./types"

export const DUMMY_DOCUMENT_DETAILS = (docId: string): DocumentDetails => ({
  id: docId,
  name: `Contract Alpha ${docId.substring(0, 8)}.pdf`,
  uploadDate: new Date().toISOString(),
  fullText: `
CONTRACT AGREEMENT

This agreement is made on ${new Date().toLocaleDateString()} between Party A ("Client") and Party B ("Service Provider").

1. Scope of Work
The Service Provider agrees to perform services as outlined in Appendix A. This includes software development and consultation.

2. Payment Terms
Client shall pay Service Provider a sum of $10,000 upon completion. Payment is due within 30 days. Late payments incur a 5% monthly interest.

3. Confidentiality
Both parties agree to maintain the confidentiality of all proprietary information disclosed during the term of this agreement. This obligation survives termination.

4. Term and Termination
This agreement shall commence on the date hereof and continue for one year, unless terminated earlier by either party with 30 days written notice. Gross misconduct allows immediate termination.

5. Limitation of Liability
The Service Provider's liability shall not exceed the total fees paid under this agreement. Neither party is liable for consequential damages.

6. Governing Law
This agreement shall be governed by the laws of the State of California. Any disputes shall be resolved in courts located in San Francisco.
    `.trim(),
})

export const DUMMY_CLAUSES: Clause[] = [
  {
    id: "1",
    title: "Scope of Work",
    text: "The Service Provider agrees to perform services as outlined in Appendix A. This includes software development and consultation.",
    pageNumber: 1,
    riskLevel: "low",
  },
  {
    id: "2",
    title: "Payment Terms",
    text: "Client shall pay Service Provider a sum of $10,000 upon completion. Payment is due within 30 days. Late payments incur a 5% monthly interest.",
    pageNumber: 1,
    riskLevel: "medium",
  },
  {
    id: "3",
    title: "Confidentiality",
    text: "Both parties agree to maintain the confidentiality of all proprietary information disclosed during the term of this agreement. This obligation survives termination.",
    pageNumber: 2,
    riskLevel: "low",
  },
  {
    id: "4",
    title: "Term and Termination",
    text: "This agreement shall commence on the date hereof and continue for one year, unless terminated earlier by either party with 30 days written notice. Gross misconduct allows immediate termination.",
    pageNumber: 2,
    riskLevel: "medium",
  },
  {
    id: "5",
    title: "Limitation of Liability",
    text: "The Service Provider's liability shall not exceed the total fees paid under this agreement. Neither party is liable for consequential damages.",
    pageNumber: 3,
    riskLevel: "high",
  },
  {
    id: "6",
    title: "Governing Law",
    text: "This agreement shall be governed by the laws of the State of California. Any disputes shall be resolved in courts located in San Francisco.",
    pageNumber: 3,
    riskLevel: "low",
  },
]

export const DUMMY_ANALYSES: Record<string, Analysis> = {
  "1": {
    clauseId: "1",
    ambiguities: ["'Appendix A' is not provided. The specific scope is unclear without it."],
    risks: ["Potential for scope creep if Appendix A is not well-defined."],
    recommendations: ["Ensure Appendix A is detailed, specific, and attached to the agreement."],
    missingElements: ["No mention of acceptance criteria for services."],
  },
  "2": {
    clauseId: "2",
    ambiguities: ["'Upon completion' could be subjective. Define completion criteria clearly."],
    risks: [
      "A 5% monthly interest on late payments (60% APR) might be considered usurious or excessively high in some jurisdictions.",
    ],
    recommendations: [
      "Specify objective completion milestones. Consider a more standard late payment interest rate (e.g., 1.5% per month).",
    ],
  },
  "3": {
    clauseId: "3",
    ambiguities: ["'Proprietary information' is not defined. This could lead to disputes over what is covered."],
    risks: ["Lack of definition might make enforcement difficult."],
    recommendations: [
      "Include a clear definition of 'Proprietary Information', listing examples. Specify exceptions to confidentiality (e.g., legally required disclosures).",
    ],
    missingElements: [
      "No specified duration for confidentiality post-termination, though 'survives termination' is present, a fixed term (e.g., 3-5 years) is common for some types of info.",
    ],
  },
  "4": {
    clauseId: "4",
    ambiguities: [
      "'Gross misconduct' is not defined, potentially leading to disputes over grounds for immediate termination.",
    ],
    risks: ["Subjective termination clause can be misused."],
    recommendations: [
      "Define 'Gross misconduct' with specific examples or refer to a company policy. Consider adding a cure period for breaches other than gross misconduct before termination.",
    ],
  },
  "5": {
    clauseId: "5",
    ambiguities: [
      "The term 'consequential damages' can be interpreted broadly. Specific examples of excluded damages could be beneficial.",
    ],
    risks: [
      "While common, a liability cap at total fees paid might be very low for significant damages caused by negligence. This heavily favors the Service Provider.",
    ],
    recommendations: [
      "Consider if the liability cap is appropriate for the potential risks involved. For critical services, a higher cap or specific carve-outs (e.g., for breach of confidentiality, gross negligence) might be negotiated.",
    ],
  },
  "6": {
    clauseId: "6",
    ambiguities: [],
    risks: [
      "Specifying courts in San Francisco might be inconvenient or costly for one party if they are not located there.",
    ],
    recommendations: [
      "Consider alternative dispute resolution methods like mediation or arbitration before litigation to save costs.",
    ],
    missingElements: [
      "No mention of how notices under the agreement should be delivered (e.g., email, registered mail).",
    ],
  },
}

export const DUMMY_SUMMARY_INSIGHTS: SummaryInsights = {
  overallRisk:
    "The contract presents a moderate level of risk, primarily due to potentially high late payment fees, undefined key terms (Proprietary Information, Gross Misconduct), and a very low limitation of liability for the Service Provider.",
  riskScore: 6, // on a scale of 1-10
  ambiguousTerms: [
    "'Appendix A' (Scope of Work)",
    "'Upon completion' (Payment Terms)",
    "'Proprietary Information' (Confidentiality)",
    "'Gross misconduct' (Termination)",
  ],
  unfairClauses: [
    { clauseId: "2", description: "5% monthly interest on late payments may be excessively high." },
    {
      clauseId: "5",
      description: "Limitation of liability capped at total fees paid heavily favors the Service Provider.",
    },
  ],
  missingClauses: [
    "Clear definition of 'Completion Criteria' for payment.",
    "Specific examples or definition for 'Proprietary Information'.",
    "Specific examples or definition for 'Gross Misconduct'.",
    "Dispute resolution mechanism beyond court litigation (e.g., arbitration/mediation).",
    "Notice provisions (how to formally communicate under the agreement).",
  ],
  keyFindings: [
    "Governing law is California, disputes in San Francisco courts.",
    "Confidentiality obligation survives termination, but duration is not specified.",
  ],
  actionableSuggestions: [
    "Define all capitalized terms used within the agreement or in an appendix.",
    "Negotiate a more balanced limitation of liability clause.",
    "Clarify payment triggers and consider revising the late payment interest rate.",
    "Add a section detailing how formal notices should be exchanged.",
  ],
  problematicClauses: [
    {
      clauseId: "2",
      title: "Payment Terms",
      issues: ["5% monthly interest on late payments may be excessively high", "Unclear completion criteria"],
      citations: ["Late payments incur a 5% monthly interest", "upon completion"]
    },
    {
      clauseId: "5",
      title: "Limitation of Liability",
      issues: ["Liability cap heavily favors Service Provider", "Consequential damages definition unclear"],
      citations: ["liability shall not exceed the total fees paid", "Neither party is liable for consequential damages"]
    }
  ],
}
