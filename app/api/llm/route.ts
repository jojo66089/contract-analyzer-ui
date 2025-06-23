import { NextRequest, NextResponse } from "next/server";

// Configuration for different deployment options
const USE_GRADIO_SPACE = process.env.USE_GRADIO_SPACE === 'true';
const GRADIO_SPACE_URL = process.env.GRADIO_SPACE_URL || "http://127.0.0.1:7860";
// Ensure HF_TOKEN is properly formatted
const HF_TOKEN = process.env.HF_TOKEN?.trim();
// Make sure token doesn't have quotes or extra spaces
const cleanHfToken = HF_TOKEN ? HF_TOKEN.replace(/^["']|["']$/g, '').trim() : undefined;
const HF_MODEL_ID = process.env.HF_MODEL_ID || "jojo6608/LegalQwen14B";

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const { instruction, input, clauseText } = await req.json();
    
    // For legal analysis, we expect clauseText to be provided
    const textToAnalyze = clauseText || input || instruction;
    
    if (!textToAnalyze) {
      return NextResponse.json(
        { error: "Clause text is required for analysis" },
        { status: 400 }
      );
    }

    console.log('Analyzing clause with AI service:', textToAnalyze.substring(0, 100) + '...');

    let result;
    
    // Try Gradio Space first if configured
    if (USE_GRADIO_SPACE) {
      try {
        result = await analyzeWithGradioSpace(textToAnalyze);
        console.log('Successfully analyzed with Gradio Space');
        return NextResponse.json({ analysis: result });
      } catch (gradioError) {
        console.warn('Gradio Space failed, trying HF Inference API:', gradioError);
      }
    }
    
    // Try Hugging Face Inference API as fallback
    if (HF_TOKEN) {
      try {
        result = await analyzeWithHuggingFaceAPI(textToAnalyze);
        console.log('Successfully analyzed with Hugging Face Inference API');
        return NextResponse.json({ analysis: result });
      } catch (hfError) {
        console.warn('Hugging Face Inference API failed:', hfError);
      }
    }
    
    // Fallback to enhanced local analysis
    result = createEnhancedFallbackAnalysis(textToAnalyze);
    console.log('Using enhanced fallback analysis');
    return NextResponse.json({ analysis: result });
    
  } catch (error) {
    console.error("Error in LLM API route:", error);
    return NextResponse.json(
      { error: "Failed to process request", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

async function analyzeWithGradioSpace(clauseText: string, retryCount = 0): Promise<any> {
  const maxRetries = 3;
  const backoffFactor = 2;
  const initialBackoff = 2000; // 2 seconds

  try {
    console.log(`Calling Gradio Space API (attempt ${retryCount + 1})`);
    
    // Call your Gradio Space's API endpoint using the correct Gradio API format
    // Add authentication headers if HF_TOKEN is available
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    
    if (cleanHfToken) {
      // Ensure proper Bearer token format
      headers["Authorization"] = cleanHfToken.startsWith('Bearer ') ? cleanHfToken : `Bearer ${cleanHfToken}`;
      console.log(`Using Authorization header: Bearer ${cleanHfToken.substring(0, 5)}...`);
    } else {
      console.warn('No HF_TOKEN provided for authentication');
    }
    
    const callResponse = await fetch(`${GRADIO_SPACE_URL}/gradio_api/call/predict`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        data: [clauseText],
        fn_index: 0
      }),
    });

    if (!callResponse.ok) {
      const status = callResponse.status;
      const errorText = await callResponse.text().catch(() => 'No error details');
      
      // Check if it's an HTML response (authentication issue)
      if (errorText.includes('<!doctype html>') || errorText.includes('<html')) {
        console.error('Gradio Space error: Authentication required');
        
        // Check for specific authentication issues
        if (status === 401) {
          console.error('Authentication failed: Invalid or expired token');
          // Try to extract more info from HTML if possible
          const authErrorMatch = errorText.match(/Authentication\s+(failed|error)[^<]*/i);
          if (authErrorMatch) {
            console.error(`Auth details: ${authErrorMatch[0].trim()}`);
          }
          
          // Handle authentication issues with retry logic
          if (retryCount < 2) {
            console.log(`Authentication failed (401), retrying (${retryCount + 1}/2)...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return analyzeWithGradioSpace(clauseText, retryCount + 1);
          }
        }
        
        throw new Error(`Gradio Space authentication error (${status}): Please check HF_TOKEN validity`);
      }
      
      // Handle space cold start or loading (503 or 502 errors)
      if ((status === 503 || status === 502 || status === 504) && retryCount < maxRetries) {
        const backoffTime = initialBackoff * Math.pow(backoffFactor, retryCount);
        console.log(`Gradio Space not ready (${status}), retrying in ${backoffTime}ms (retry ${retryCount + 1}/${maxRetries})`);
        
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        return analyzeWithGradioSpace(clauseText, retryCount + 1);
      }
      
      throw new Error(`Gradio Space API call error (${status}): ${errorText}`);
    }

    const callResult = await callResponse.json();
    const eventId = callResult.event_id;
    
    if (!eventId) {
      throw new Error("No event ID received from Gradio Space");
    }

    // Get the result using the event ID
    const response = await fetch(`${GRADIO_SPACE_URL}/gradio_api/call/predict/${eventId}`, {
      method: "GET",
      headers: cleanHfToken ? { 
        "Authorization": cleanHfToken.startsWith('Bearer ') ? cleanHfToken : `Bearer ${cleanHfToken}`,
        "Content-Type": "application/json"
      } : { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      const status = response.status;
      const errorText = await response.text();
      
      // Handle space cold start or loading (503 or 502 errors)
      if ((status === 503 || status === 502) && retryCount < maxRetries) {
        const backoffTime = initialBackoff * Math.pow(backoffFactor, retryCount);
        console.log(`Gradio Space not ready (${status}), retrying in ${backoffTime}ms (retry ${retryCount + 1}/${maxRetries})`);
        
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        return analyzeWithGradioSpace(clauseText, retryCount + 1);
      }
      
      throw new Error(`Gradio Space API error (${status}): ${errorText}`);
    }

    const responseText = await response.text();
    console.log('Gradio Space response:', responseText);
    
    // Parse the Server-Sent Events response format
    const lines = responseText.split('\n');
    let resultData = null;
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.substring(6));
          if (Array.isArray(data) && data.length > 0) {
            resultData = data[0];
            break;
          }
        } catch (parseError) {
          console.warn('Could not parse line:', line);
        }
      }
    }
    
    // Extract the analysis from Gradio response
    if (resultData) {
      if (typeof resultData === 'string') {
        try {
          // Try to parse as JSON if it's a JSON string
          const analysisJson = JSON.parse(resultData);
          return analysisJson;
        } catch (parseError) {
          // If it's not JSON, return as structured response
          return {
            rawText: resultData,
            ambiguities: ["Please check the raw analysis text"],
            risks: ["Analysis completed - see raw text"],
            recommendations: ["Review the detailed analysis"],
            missingElements: [],
            references: []
          };
        }
      } else if (typeof resultData === 'object') {
        // If it's already an object, return it directly
        return resultData;
      }
    }
    
    throw new Error("Invalid response format from Gradio Space");
    
  } catch (error) {
    console.error("Error calling Gradio Space:", error);
    
    if (retryCount < maxRetries) {
      const backoffTime = initialBackoff * Math.pow(backoffFactor, retryCount);
      console.log(`Retrying Gradio Space call in ${backoffTime}ms`);
      await new Promise(resolve => setTimeout(resolve, backoffTime));
      return analyzeWithGradioSpace(clauseText, retryCount + 1);
    }
    
    throw error; // Re-throw to be caught by the main function
  }
}

async function analyzeWithHuggingFaceAPI(clauseText: string, retryCount = 0): Promise<any> {
  const maxRetries = 3;
  const backoffFactor = 2;
  const initialBackoff = 1000; // 1 second

  try {
    console.log(`Calling Hugging Face Inference API (attempt ${retryCount + 1})`);
    
    const prompt = `You are a legal expert. Analyze this contract clause and provide a detailed JSON response with:
{
  "ambiguities": ["list of ambiguous terms"],
  "risks": ["list of legal risks"],
  "recommendations": ["list of recommendations"],
  "missingElements": ["list of missing clauses"],
  "references": ["list of legal references"],
  "citations": ["specific text snippets from the clause that are problematic"],
  "problematicText": ["specific phrases or sentences that need attention"],
  "riskLevel": "high/medium/low"
}

Instructions:
- Identify specific problematic text snippets and include them in "citations"
- Quote exact phrases that are ambiguous or risky in "problematicText"
- Assess overall risk level for this clause
- Provide actionable, specific recommendations

Clause: ${clauseText}

Analysis:`;

    const authToken = cleanHfToken?.startsWith('Bearer ') ? cleanHfToken : `Bearer ${cleanHfToken}`;
    console.log(`Using HF token: ${cleanHfToken ? cleanHfToken.substring(0, 5) + '...' : 'undefined'}`);
    
    const response = await fetch(`https://api-inference.huggingface.co/models/${HF_MODEL_ID}`, {
      method: "POST",
      headers: {
        "Authorization": authToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 512,
          temperature: 0.3,
          top_p: 0.9,
          return_full_text: false
        }
      }),
    });

    if (!response.ok) {
      const status = response.status;
      const errorText = await response.text();
      
      // Handle cold start (503 errors)
      if (status === 503 && retryCount < maxRetries) {
        const backoffTime = initialBackoff * Math.pow(backoffFactor, retryCount);
        console.log(`HF API model loading (${status}), retrying in ${backoffTime}ms (retry ${retryCount + 1}/${maxRetries})`);
        
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        return analyzeWithHuggingFaceAPI(clauseText, retryCount + 1);
      }
      
      throw new Error(`Hugging Face API error (${status}): ${errorText}`);
    }

    const result = await response.json();
    
    if (Array.isArray(result) && result.length > 0 && result[0].generated_text) {
      const generatedText = result[0].generated_text;
      
      try {
        // Try to extract JSON from the response
        const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const analysisJson = JSON.parse(jsonMatch[0]);
          return analysisJson;
        }
      } catch (parseError) {
        console.warn('Could not parse HF API response as JSON');
      }
      
      // Fallback to structured analysis of the generated text
      return createStructuredAnalysisFromText(generatedText, clauseText);
    }
    
    throw new Error("Invalid response format from Hugging Face API");
    
  } catch (error) {
    console.error("Error calling Hugging Face API:", error);
    
    if (retryCount < maxRetries) {
      const backoffTime = initialBackoff * Math.pow(backoffFactor, retryCount);
      console.log(`Retrying HF API call in ${backoffTime}ms`);
      await new Promise(resolve => setTimeout(resolve, backoffTime));
      return analyzeWithHuggingFaceAPI(clauseText, retryCount + 1);
    }
    
    throw error; // Re-throw to be caught by the main function
  }
}

function createStructuredAnalysisFromText(analysisText: string, clauseText: string): any {
  // Extract insights from generated text and clause content
  const clause_lower = clauseText.toLowerCase();
  const analysis_lower = analysisText.toLowerCase();
  
  const detected_ambiguities = [];
  const detected_risks = [];
  const detected_recommendations = [];
  const detected_missing = [];
  const detected_references = [];
  
  // Extract from analysis text
  if (analysis_lower.includes('ambiguous') || analysis_lower.includes('unclear')) {
    detected_ambiguities.push("Terms identified as ambiguous in legal analysis");
  }
  if (analysis_lower.includes('risk') || analysis_lower.includes('liable')) {
    detected_risks.push("Legal risks identified in professional analysis");
  }
  
  // Add clause-specific analysis
  if (clause_lower.includes('reasonable')) {
    detected_ambiguities.push("Term 'reasonable' is subjective and may lead to disputes");
    detected_recommendations.push("Define specific criteria for what constitutes 'reasonable'");
  }
  
  if (clause_lower.includes('material') && clause_lower.includes('breach')) {
    detected_ambiguities.push("Definition of 'material breach' is not specified");
    detected_recommendations.push("Define what constitutes a material breach with specific examples");
  }
  
  if (clause_lower.includes('confidential')) {
    detected_risks.push("Scope of confidentiality obligations may be overly broad");
    detected_recommendations.push("Clearly define what information is considered confidential");
  }
  
  if (clause_lower.includes('terminate')) {
    detected_risks.push("Termination conditions and procedures may be unclear");
    detected_recommendations.push("Specify exact termination procedures and notice requirements");
  }
  
  // Add defaults if none detected
  if (detected_ambiguities.length === 0) {
    detected_ambiguities.push("Contract language could benefit from more specific definitions");
  }
  if (detected_risks.length === 0) {
    detected_risks.push("Standard legal review recommended");
  }
  if (detected_recommendations.length === 0) {
    detected_recommendations.push("Consider engaging qualified legal counsel for comprehensive review");
  }
  
  detected_missing.push("Governing law clause", "Dispute resolution mechanism");
  detected_references.push("Contract law fundamentals", "Industry standard practices");
  
  return {
    ambiguities: detected_ambiguities,
    risks: detected_risks,
    recommendations: detected_recommendations,
    missingElements: detected_missing,
    references: detected_references,
    source: "huggingface_api"
  };
}

function createEnhancedFallbackAnalysis(clauseText: string): any {
  console.log('Creating enhanced fallback analysis');
  
  const clause_lower = clauseText.toLowerCase();
  const detected_ambiguities = [];
  const detected_risks = [];
  const detected_recommendations = [];
  const detected_missing = [];
  const detected_references = [];
  
  // Comprehensive legal analysis patterns
  if (clause_lower.includes('reasonable')) {
    detected_ambiguities.push("Term 'reasonable' is subjective and may lead to disputes over interpretation");
    detected_recommendations.push("Define specific criteria, timeframes, or benchmarks for what constitutes 'reasonable'");
  }
  
  if (clause_lower.includes('best efforts') || clause_lower.includes('best endeavors')) {
    detected_ambiguities.push("'Best efforts' standard lacks clear definition and enforcement criteria");
    detected_recommendations.push("Replace with 'commercially reasonable efforts' or define specific performance metrics");
    detected_references.push("Case law: Bloor Italian Gifts Ltd. v. Dixon (reasonable vs. best efforts)");
  }
  
  if (clause_lower.includes('material') && (clause_lower.includes('breach') || clause_lower.includes('change'))) {
    detected_ambiguities.push("Definition of 'material' is not specified and subject to interpretation");
    detected_recommendations.push("Define materiality thresholds with specific examples or percentage/dollar amounts");
  }
  
  if (clause_lower.includes('confidential')) {
    detected_risks.push("Scope of confidentiality obligations may be overly broad or insufficiently defined");
    detected_recommendations.push("Clearly define categories of confidential information with specific exclusions");
    detected_missing.push("Confidentiality carve-outs for publicly available information");
  }
  
  if (clause_lower.includes('terminate') || clause_lower.includes('termination')) {
    detected_risks.push("Termination conditions and procedures may create enforcement difficulties");
    detected_recommendations.push("Specify exact termination procedures, notice requirements, and cure periods");
    detected_missing.push("Post-termination obligations and survival clauses");
  }
  
  if (clause_lower.includes('liability') || clause_lower.includes('damages')) {
    detected_risks.push("Liability exposure may be inadequately limited or undefined");
    detected_recommendations.push("Add comprehensive liability limitation and damages cap clauses");
    detected_references.push("Uniform Commercial Code provisions on consequential damages");
  }
  
  if (clause_lower.includes('irrevocably') && clause_lower.includes('assign')) {
    detected_risks.push("Irrevocable assignment clauses provide no recourse for the assigning party");
    detected_recommendations.push("Add limitations on scope and duration of assignments");
  }
  
  if (clause_lower.includes('perpetuity') || clause_lower.includes('throughout the universe')) {
    detected_risks.push("Overly broad temporal and geographic scope may be unenforceable");
    detected_recommendations.push("Limit scope to reasonable time periods and jurisdictions");
  }
  
  if (clause_lower.includes('waiver') && (clause_lower.includes('audit') || clause_lower.includes('oversight'))) {
    detected_risks.push("Waiver of audit/oversight rights eliminates important protections");
    detected_recommendations.push("Preserve essential audit and oversight rights");
  }
  
  // Check for missing standard clauses
  if (!clause_lower.includes('governing law') && !clause_lower.includes('applicable law')) {
    detected_missing.push("Governing law clause");
  }
  
  if (!clause_lower.includes('dispute') && !clause_lower.includes('arbitration') && !clause_lower.includes('litigation')) {
    detected_missing.push("Dispute resolution mechanism");
  }
  
  // Add defaults if none detected
  if (detected_ambiguities.length === 0) {
    detected_ambiguities.push("Contract language could benefit from more specific definitions");
  }
  
  if (detected_risks.length === 0) {
    detected_risks.push("Standard legal review recommended to identify potential liabilities");
  }
  
  if (detected_recommendations.length === 0) {
    detected_recommendations.push("Consider engaging qualified legal counsel for comprehensive review");
  }
  
  // Add general legal references
  detected_references.push("Restatement (Second) of Contracts");
  detected_references.push("Uniform Commercial Code (UCC)");
  
  // Extract specific problematic text snippets for citations
  const detected_citations = [];
  const detected_problematicText = [];
  
  // Look for specific problematic phrases in the clause
  if (clause_lower.includes('reasonable')) {
    const reasonableMatches = clauseText.match(/[^.]*reasonable[^.]*/gi);
    if (reasonableMatches) {
      detected_citations.push(...reasonableMatches.slice(0, 2));
      detected_problematicText.push("Use of subjective term 'reasonable'");
    }
  }
  
  if (clause_lower.includes('material breach')) {
    const materialMatches = clauseText.match(/[^.]*material[^.]*breach[^.]*/gi);
    if (materialMatches) {
      detected_citations.push(...materialMatches.slice(0, 1));
      detected_problematicText.push("Undefined 'material breach' standard");
    }
  }
  
  if (clause_lower.includes('best efforts')) {
    const effortsMatches = clauseText.match(/[^.]*best efforts[^.]*/gi);
    if (effortsMatches) {
      detected_citations.push(...effortsMatches.slice(0, 1));
      detected_problematicText.push("Vague 'best efforts' obligation");
    }
  }
  
  if (clause_lower.includes('perpetuity') || clause_lower.includes('forever')) {
    const perpetuityMatches = clauseText.match(/[^.]*(?:perpetuity|forever)[^.]*/gi);
    if (perpetuityMatches) {
      detected_citations.push(...perpetuityMatches.slice(0, 1));
      detected_problematicText.push("Overly broad temporal scope");
    }
  }
  
  // Determine risk level based on detected issues
  let riskLevel = 'medium';
  if (detected_risks.length > 3 || detected_ambiguities.length > 3) {
    riskLevel = 'high';
  } else if (detected_risks.length === 0 && detected_ambiguities.length <= 1) {
    riskLevel = 'low';
  }

  return {
    ambiguities: detected_ambiguities.slice(0, 5),
    risks: detected_risks.slice(0, 5),
    recommendations: detected_recommendations.slice(0, 5),
    missingElements: detected_missing.slice(0, 4),
    references: detected_references.slice(0, 3),
    citations: detected_citations.slice(0, 3),
    problematicText: detected_problematicText.slice(0, 3),
    riskLevel: riskLevel,
    fallback: true,
    source: "enhanced_fallback"
  };
}

// TODO: For future self-hosted deployment:
// - Add a configuration option to switch between HF Inference API and self-hosted endpoint
// - Update the fetch URL to point to your self-hosted TGI/vLLM endpoint
// - Consider adding authentication/API key for the self-hosted endpoint
// - May need to adjust streaming response format based on your self-hosted setup 