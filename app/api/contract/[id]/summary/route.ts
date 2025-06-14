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

// Default summary for error conditions when no analyses are available
const DEFAULT_SUMMARY = {
  overallRisk: "Analysis is still in progress - please wait for completion",
  riskScore: 5,
  ambiguousTerms: ["Analysis pending"],
  unfairClauses: [],
  missingClauses: ["Analysis pending"],
  keyFindings: ["Analysis is still processing"],
  actionableSuggestions: ["Please wait for analysis to complete"]
};

// Generate a dynamic summary based on actual clause analyses
function generateMockSummary(clauseAnalyses: any[]): any {
  console.log('Generating mock summary based on', clauseAnalyses.length, 'analyses');
  
  if (!clauseAnalyses.length) {
    return DEFAULT_SUMMARY;
  }
  
  // Extract all unique terms from analyses
  const allAmbiguities = new Set<string>();
  const allRisks = new Set<string>();
  const allRecommendations = new Set<string>();
  const allMissingElements = new Set<string>();
  const unfairClauses: Array<{clauseId: string, description: string}> = [];
  
  let totalRiskScore = 0;
  let riskCount = 0;
  
  for (const item of clauseAnalyses) {
    const analysis = item.analysis;
    if (!analysis) continue;
    
    // Collect ambiguities
    if (Array.isArray(analysis.ambiguities)) {
      analysis.ambiguities.forEach((amb: string) => allAmbiguities.add(amb));
    }
    
    // Collect risks and calculate risk score
    if (Array.isArray(analysis.risks)) {
      analysis.risks.forEach((risk: string) => allRisks.add(risk));
      // Risk score based on number of risks (more risks = higher score)
      totalRiskScore += Math.min(analysis.risks.length * 1.5, 4);
      riskCount++;
    }
    
    // Collect recommendations
    if (Array.isArray(analysis.recommendations)) {
      analysis.recommendations.forEach((rec: string) => allRecommendations.add(rec));
    }
    
    // Collect missing elements
    if (Array.isArray(analysis.missingElements)) {
      analysis.missingElements.forEach((missing: string) => allMissingElements.add(missing));
    }
    
    // Identify unfair clauses based on risk patterns
    if (analysis.risks && analysis.risks.length > 2) {
      unfairClauses.push({
        clauseId: item.clauseId,
        description: `Multiple concerning risks identified in this clause`
      });
    }
  }
  
  // Calculate overall risk score (1-10)
  const avgRiskScore = riskCount > 0 ? totalRiskScore / riskCount : 5;
  const finalRiskScore = Math.min(Math.max(Math.round(avgRiskScore), 1), 10);
  
  // Determine overall risk message based on score
  let overallRisk = "";
  if (finalRiskScore <= 3) {
    overallRisk = "This contract appears to have minimal risk factors and standard protections";
  } else if (finalRiskScore <= 6) {
    overallRisk = "This contract has moderate risk factors that should be reviewed carefully";
  } else {
    overallRisk = "This contract has significant risk factors that require immediate attention";
  }
  
  // Create key findings based on the actual analysis
  const keyFindings: string[] = [];
  if (allRisks.size > 5) {
    keyFindings.push(`Contract contains ${allRisks.size} distinct risk factors across multiple clauses`);
  }
  if (allAmbiguities.size > 3) {
    keyFindings.push(`${allAmbiguities.size} ambiguous terms identified that could lead to disputes`);
  }
  if (allMissingElements.size > 2) {
    keyFindings.push(`Missing ${allMissingElements.size} standard protective clauses`);
  }
  if (unfairClauses.length > 0) {
    keyFindings.push(`${unfairClauses.length} clauses identified with concerning risk profiles`);
  }
  
  // Limit arrays to most relevant items
  const limitedAmbiguities = Array.from(allAmbiguities).slice(0, 5);
  const limitedMissing = Array.from(allMissingElements).slice(0, 5);
  const limitedRecommendations = Array.from(allRecommendations).slice(0, 5);
  const limitedUnfair = unfairClauses.slice(0, 3);
  
  return {
    overallRisk,
    riskScore: finalRiskScore,
    ambiguousTerms: limitedAmbiguities,
    unfairClauses: limitedUnfair,
    missingClauses: limitedMissing,
    keyFindings: keyFindings.length > 0 ? keyFindings : ["Analysis completed successfully"],
    actionableSuggestions: limitedRecommendations
  };
}

// Enhanced summary generation with better legal insights
function generateEnhancedMockSummary(clauseAnalyses: any[]): any {
  console.log('Generating enhanced mock summary based on', clauseAnalyses.length, 'analyses');
  
  if (!clauseAnalyses.length) {
    return DEFAULT_SUMMARY;
  }
  
  // Extract comprehensive insights from analyses
  const allAmbiguities = new Set<string>();
  const allRisks = new Set<string>();
  const allRecommendations = new Set<string>();
  const allMissingElements = new Set<string>();
  const allReferences = new Set<string>();
  const unfairClauses: Array<{clauseId: string, description: string}> = [];
  const criticalIssues: string[] = [];
  const problematicClauses: Array<{clauseId: string, title: string, issues: string[], citations: string[]}> = [];
  
  let totalRiskScore = 0;
  let riskCount = 0;
  let highRiskClauses = 0;
  let ambiguousTermCount = 0;
  
  // Analyze each clause
  for (const item of clauseAnalyses) {
    const analysis = item.analysis;
    if (!analysis) continue;
    
    // Collect ambiguities
    if (Array.isArray(analysis.ambiguities)) {
      analysis.ambiguities.forEach((amb: string) => {
        allAmbiguities.add(amb);
        ambiguousTermCount++;
      });
    }
    
    // Collect and score risks
    if (Array.isArray(analysis.risks)) {
      analysis.risks.forEach((risk: string) => {
        allRisks.add(risk);
        
        // Score risk severity based on keywords
        const riskLower = risk.toLowerCase();
        let riskWeight = 1;
        
        if (riskLower.includes('liability') || riskLower.includes('damages') || riskLower.includes('breach')) {
          riskWeight = 3;
        } else if (riskLower.includes('termination') || riskLower.includes('penalty') || riskLower.includes('dispute')) {
          riskWeight = 2.5;
        } else if (riskLower.includes('confidential') || riskLower.includes('ip') || riskLower.includes('property')) {
          riskWeight = 2;
        }
        
        totalRiskScore += riskWeight;
        riskCount++;
      });
      
      // High risk clause detection
      if (analysis.risks.length > 2) {
        highRiskClauses++;
        const clauseTitle = item.clauseTitle || `Clause ${item.clauseId}`;
        const citation = analysis.citations?.[0] || analysis.problematicText?.[0] || '';
        unfairClauses.push({
          clauseId: item.clauseId,
          description: `High-risk clause with ${analysis.risks.length} identified concerns`,
          clauseTitle: clauseTitle,
          citation: citation
        });
      }
    }
    
    // Collect recommendations
    if (Array.isArray(analysis.recommendations)) {
      analysis.recommendations.forEach((rec: string) => allRecommendations.add(rec));
    }
    
    // Collect missing elements
    if (Array.isArray(analysis.missingElements)) {
      analysis.missingElements.forEach((missing: string) => allMissingElements.add(missing));
    }
    
    // Collect references
    if (Array.isArray(analysis.references)) {
      analysis.references.forEach((ref: string) => allReferences.add(ref));
    }
    
    // Build problematic clauses with citations
    if ((analysis.risks && analysis.risks.length > 0) || 
        (analysis.ambiguities && analysis.ambiguities.length > 1) ||
        (analysis.citations && analysis.citations.length > 0)) {
      
      const clauseTitle = item.clauseTitle || `Clause ${item.clauseId}`;
      const issues = [];
      const citations = [];
      
      // Combine risks and ambiguities as issues
      if (analysis.risks) {
        issues.push(...analysis.risks.slice(0, 3));
      }
      if (analysis.ambiguities) {
        issues.push(...analysis.ambiguities.slice(0, 2));
      }
      
      // Add citations and problematic text
      if (analysis.citations) {
        citations.push(...analysis.citations.slice(0, 2));
      }
      if (analysis.problematicText) {
        citations.push(...analysis.problematicText.slice(0, 1));
      }
      
      if (issues.length > 0) {
        problematicClauses.push({
          clauseId: item.clauseId,
          title: clauseTitle,
          issues: issues.slice(0, 3),
          citations: citations.slice(0, 3)
        });
      }
    }
  }
  
  // Calculate sophisticated risk score (1-10)
  const avgRiskScore = riskCount > 0 ? totalRiskScore / riskCount : 3;
  const complexityFactor = Math.min(clauseAnalyses.length / 10, 1); // More clauses = more complexity
  const ambiguityFactor = Math.min(ambiguousTermCount / 15, 1); // More ambiguous terms = higher risk
  const highRiskFactor = Math.min(highRiskClauses / clauseAnalyses.length, 0.5); // Proportion of high-risk clauses
  
  const finalRiskScore = Math.min(Math.max(Math.round(
    (avgRiskScore * 1.5) + 
    (complexityFactor * 2) + 
    (ambiguityFactor * 2) + 
    (highRiskFactor * 3)
  ), 1), 10);
  
  // Generate overall risk assessment
  let overallRisk = "";
  if (finalRiskScore <= 3) {
    overallRisk = `This contract presents relatively low legal risk with ${allRisks.size} identified concerns across ${clauseAnalyses.length} clauses. Standard protective measures appear adequate.`;
  } else if (finalRiskScore <= 6) {
    overallRisk = `This contract contains moderate legal risks requiring careful attention. ${allRisks.size} risk factors identified across ${clauseAnalyses.length} clauses, with ${highRiskClauses} clauses requiring immediate review.`;
  } else if (finalRiskScore <= 8) {
    overallRisk = `This contract presents significant legal risks that demand immediate attention. ${allRisks.size} risk factors identified, including ${highRiskClauses} high-risk clauses with potential for substantial liability exposure.`;
  } else {
    overallRisk = `This contract contains critical legal risks requiring urgent review and revision. ${allRisks.size} risk factors across ${clauseAnalyses.length} clauses present serious liability exposure and enforcement challenges.`;
  }
  
  // Generate key findings based on analysis
  const keyFindings: string[] = [];
  
  if (allRisks.size > 8) {
    keyFindings.push(`Contract contains ${allRisks.size} distinct risk factors indicating need for comprehensive legal review`);
  }
  
  if (ambiguousTermCount > 10) {
    keyFindings.push(`${ambiguousTermCount} ambiguous terms identified across multiple clauses may lead to interpretation disputes`);
  }
  
  if (allMissingElements.size > 5) {
    keyFindings.push(`${allMissingElements.size} standard protective clauses are missing, creating potential enforcement gaps`);
  }
  
  if (highRiskClauses > 0) {
    keyFindings.push(`${highRiskClauses} clauses contain multiple risk factors requiring immediate legal attention`);
  }
  
  if (allRecommendations.size > 10) {
    keyFindings.push(`${allRecommendations.size} specific recommendations provided for contract improvement`);
  }
  
  // Priority recommendations
  const priorityRecommendations = Array.from(allRecommendations).filter(rec => {
    const recLower = rec.toLowerCase();
    return recLower.includes('define') || recLower.includes('specify') || recLower.includes('add') || recLower.includes('clarify');
  });
  
  // Limit arrays to most relevant items
  const limitedAmbiguities = Array.from(allAmbiguities).slice(0, 8);
  const limitedMissing = Array.from(allMissingElements).slice(0, 6);
  const limitedRecommendations = priorityRecommendations.length > 0 
    ? priorityRecommendations.slice(0, 8) 
    : Array.from(allRecommendations).slice(0, 8);
  const limitedUnfair = unfairClauses.slice(0, 5);
  
  // Ensure we have meaningful key findings
  if (keyFindings.length === 0) {
    keyFindings.push(`Comprehensive analysis of ${clauseAnalyses.length} clauses completed with detailed risk assessment`);
    keyFindings.push(`Legal review identified areas for improvement in contract structure and terminology`);
  }
  
  return {
    overallRisk,
    riskScore: finalRiskScore,
    ambiguousTerms: limitedAmbiguities,
    unfairClauses: limitedUnfair,
    missingClauses: limitedMissing,
    keyFindings: keyFindings.slice(0, 6),
    actionableSuggestions: limitedRecommendations,
    problematicClauses: problematicClauses.slice(0, 8),
    enhanced: true,
    analysisMetrics: {
      totalClauses: clauseAnalyses.length,
      riskFactors: allRisks.size,
      ambiguousTerms: ambiguousTermCount,
      highRiskClauses: highRiskClauses,
      recommendations: allRecommendations.size
    }
  };
}

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
    console.log(`Summary route - Checking analyses for ${contract.clauses.length} clauses`);
    for (const clause of contract.clauses) {
      console.log(`Summary route - Fetching analysis for clause ${clause.id}`);
      const analysis = await getClauseAnalysis(sessionId, contractId, clause.id);
      console.log(`Summary route - Analysis for ${clause.id}:`, analysis ? 'found' : 'not found');
      if (analysis) {
        clauseAnalyses.push({
          clauseId: clause.id,
          clauseTitle: clause.title || clause.metadata?.title,
          analysis
        });
      }
    }
    console.log(`Summary route - Found ${clauseAnalyses.length} analyses out of ${contract.clauses.length} clauses`);
    
    if (!clauseAnalyses.length) {
      console.log('No analyses found, returning default summary');
      return NextResponse.json({ summary: DEFAULT_SUMMARY });
    }
    
    console.log(`Generating summary for ${clauseAnalyses.length} clause analyses`);
    
    try {
      // Try to use Gradio Space for summary generation
      console.log('Calling Gradio Space for summary generation...');
      
      const summaryPrompt = `Please analyze this contract and provide a comprehensive summary with the following structure:

CONTRACT ANALYSES:
${JSON.stringify(clauseAnalyses, null, 2)}

Please provide a JSON response with:
- overallRisk: string description
- riskScore: number from 1-10
- ambiguousTerms: array of problematic terms
- unfairClauses: array of {clauseId, description}
- missingClauses: array of missing standard clauses
- keyFindings: array of important observations
- actionableSuggestions: array of recommendations

Return only the JSON object.`;

      const baseUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : process.env.NEXTAUTH_URL || 'http://localhost:3000';
      
      const response = await fetch(`${baseUrl}/api/llm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clauseText: summaryPrompt
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Gradio Space summary response received');
        
        if (result.analysis) {
          // Try to parse the analysis as a summary
          let summary;
          
          if (typeof result.analysis === 'object') {
            summary = result.analysis;
          } else if (typeof result.analysis === 'string') {
            try {
              summary = JSON.parse(result.analysis);
            } catch (parseError) {
              console.warn('Could not parse Gradio summary response as JSON');
              summary = null;
            }
          }
          
          // Validate the summary structure
          if (summary && summary.overallRisk && typeof summary.riskScore === 'number') {
            console.log('Successfully generated summary with Gradio Space');
            return NextResponse.json({ summary });
          }
        }
      }
      
      console.log('Gradio Space summary failed, falling back to enhanced mock summary');
    } catch (gradioError) {
      console.error('Gradio Space summary error:', gradioError);
      console.log('Falling back to enhanced mock summary generation');
    }
    
    // Enhanced fallback summary generation
    const enhancedSummary = generateEnhancedMockSummary(clauseAnalyses);
    return NextResponse.json({ summary: enhancedSummary });
  } catch (err: any) {
    console.error('Summary error:', err);
    // Try to get some analyses if possible, otherwise use default
    return NextResponse.json({ summary: DEFAULT_SUMMARY });
  }
} 