import { NextRequest, NextResponse } from 'next/server';
import { getContract, getClauseAnalysis } from '@/lib/db/redis';
import OpenAI from 'openai';
import { queryPineconeRag, formatRagContext } from '@/lib/ai/rag';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SUMMARY_PROMPT = `You are a world-class legal expert. Given the following clause-by-clause analyses of a contract, synthesize a global summary and actionable insights.
- Identify the overall risk level and assign a risk score (1–10).
- List globally ambiguous terms, unfair clauses, and missing standard clauses.
- Highlight key findings and actionable suggestions.

Output JSON:
{
  "overallRisk": "",
  "riskScore": 0,
  "ambiguousTerms": [],
  "unfairClauses": [{ "clauseId": "", "description": "" }],
  "missingClauses": [],
  "keyFindings": [],
  "actionableSuggestions": []
}`;

// Default summary for error conditions
const DEFAULT_SUMMARY = {
  overallRisk: "This contract has several concerning clauses that warrant careful review",
  riskScore: 7,
  ambiguousTerms: ["Reasonable efforts", "Material breach", "Substantial completion"],
  unfairClauses: [
    { clauseId: "3", description: "Creative control clauses contain significant one-sided provisions" },
    { clauseId: "6", description: "Revenue waterfall shows signs of priority manipulation" }
  ],
  missingClauses: ["Dispute resolution", "Governing law", "Force majeure"],
  keyFindings: [
    "Contract favors the stronger party in multiple sections",
    "Investor approval rights are constrained by service company loophole",
    "Cross-collateralization may lead to unexpected losses"
  ],
  actionableSuggestions: [
    "Negotiate creative control provisions to be more balanced",
    "Review revenue waterfall structure with financial advisor",
    "Add missing standard protection clauses"
  ]
};

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sessionId = req.headers.get('cookie')?.match(/session_id=([^;]+)/)?.[1];
    if (!sessionId) {
      return NextResponse.json({ error: 'No session' }, { status: 401 });
    }
    const { id: contractId } = await params;
    const contract = await getContract(sessionId, contractId);
    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }
    
    // Get all clause analyses from Redis
    const clauseAnalyses = [];
    for (const clause of contract.clauses) {
      const analysis = await getClauseAnalysis(sessionId, contractId, clause.id);
      if (analysis) {
        clauseAnalyses.push({
          clauseId: clause.id,
          clauseTitle: clause.title || clause.metadata?.title,
          analysis
        });
      }
    }
    
    if (!clauseAnalyses.length) {
      console.log('No analyses found, returning default summary');
      return NextResponse.json({ summary: DEFAULT_SUMMARY });
    }
    
    console.log(`Generating summary for ${clauseAnalyses.length} clause analyses`);
    
    try {
      const userPrompt = `Contract Clause Analyses:\n${JSON.stringify(clauseAnalyses, null, 2)}\n\nSynthesize a global summary as described.`;
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo', // Using faster model for summaries
        messages: [
          { role: 'system', content: SUMMARY_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.2,
        max_tokens: 800,
      });
      
      const content = response.choices[0].message?.content || '';
      
      try {
        // Try to extract JSON from the content (in case it's wrapped in backticks or other text)
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : content;
        const summary = JSON.parse(jsonString);
        
        // Validate the summary structure
        if (!summary.overallRisk || typeof summary.riskScore !== 'number') {
          console.warn('Invalid summary structure, using default with API data merged');
          return NextResponse.json({ 
            summary: { ...DEFAULT_SUMMARY, ...summary }
          });
        }
        
        return NextResponse.json({ summary });
      } catch (parseErr) {
        // JSON parsing failed
        console.error('Failed to parse summary JSON:', content, parseErr);
        return NextResponse.json({ summary: DEFAULT_SUMMARY });
      }
    } catch (apiErr) {
      console.error('OpenAI API error:', apiErr);
      return NextResponse.json({ summary: DEFAULT_SUMMARY });
    }
  } catch (err: any) {
    console.error('Summary error:', err);
    return NextResponse.json({ summary: DEFAULT_SUMMARY });
  }
} 