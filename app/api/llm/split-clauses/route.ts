import { NextRequest, NextResponse } from "next/server";

const USE_GRADIO_SPACE = process.env.USE_GRADIO_SPACE === 'true';
const GRADIO_SPACE_URL = process.env.GRADIO_SPACE_URL || "http://127.0.0.1:7860";
// Ensure HF_TOKEN is properly formatted
const HF_TOKEN = process.env.HF_TOKEN?.trim();
// Make sure token doesn't have quotes or extra spaces
const cleanHfToken = HF_TOKEN ? HF_TOKEN.replace(/^["']|["']$/g, '').trim() : undefined;
const HF_MODEL_ID = process.env.HF_MODEL_ID || "jojo6608/LegalQwen14B";

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const { contractText } = await req.json();
    
    if (!contractText) {
      return NextResponse.json(
        { error: "Contract text is required for clause splitting" },
        { status: 400 }
      );
    }

    console.log('Splitting clauses for text with length:', contractText.length);

    let result;
    
    // Try LLM-based clause splitting
    if (USE_GRADIO_SPACE) {
      try {
        result = await splitClausesWithGradio(contractText);
        console.log('Successfully split clauses with Gradio Space');
        return NextResponse.json({ clauses: result });
      } catch (gradioError) {
        console.warn('Gradio Space clause splitting failed:', gradioError);
      }
    }
    
    if (HF_TOKEN) {
      console.log(`HF_TOKEN is set (starts with: ${HF_TOKEN.substring(0, 5)}...)`);
      try {
        result = await splitClausesWithHuggingFace(contractText);
        console.log('Successfully split clauses with Hugging Face API');
        return NextResponse.json({ clauses: result });
      } catch (hfError) {
        console.warn('Hugging Face clause splitting failed:', hfError);
      }
    } else {
      console.warn('HF_TOKEN is not set in environment variables');
    }
    
    // Return structured error if LLM methods fail
    return NextResponse.json(
      { error: "LLM clause splitting unavailable", fallbackRequired: true },
      { status: 503 }
    );
    
  } catch (error) {
    console.error("Error in clause splitting API:", error);
    return NextResponse.json(
      { error: "Failed to split clauses", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

async function splitClausesWithGradio(contractText: string, retryCount = 0): Promise<any[]> {
  const prompt = `You are a legal expert. Please analyze this contract and split it into individual clauses. For each clause, provide a JSON object with "title" and "text" fields. Return the results as a JSON array.

Guidelines:
- Identify distinct legal clauses, sections, or provisions
- Each clause should be a meaningful, self-contained legal provision
- Provide descriptive titles for each clause
- Preserve the original text of each clause
- Do not merge unrelated provisions
- Include standard clauses like definitions, termination, liability, etc.

Contract text:
${contractText}

Please return only a JSON array of clause objects with "title" and "text" fields:`;

  try {
    console.log(`Calling Gradio Space at: ${GRADIO_SPACE_URL}`);
    
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
    
    // Call Gradio Space for clause splitting with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    try {
      const callResponse = await fetch(`${GRADIO_SPACE_URL}/gradio_api/call/predict`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          data: [prompt],
          fn_index: 0
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!callResponse.ok) {
        // Try to get error details
        const errorText = await callResponse.text().catch(() => 'No error details');
        console.error(`Gradio Space error: ${callResponse.status}, details: ${errorText}`);
        
        // Check if it's an HTML response (authentication issue)
        if (errorText.includes('<!doctype html>') || errorText.includes('<html')) {
          console.error('Gradio Space error: Authentication required');
          
          // Check for specific authentication issues
          if (callResponse.status === 401) {
            console.error('Authentication failed: Invalid or expired token');
            // Try to extract more info from HTML if possible
            const authErrorMatch = errorText.match(/Authentication\s+(failed|error)[^<]*/i);
            if (authErrorMatch) {
              console.error(`Auth details: ${authErrorMatch[0].trim()}`);
            }
          }
          
          // Handle authentication issues with retry logic
        if (callResponse.status === 401 && retryCount < 2) {
          console.log(`Authentication failed (401), retrying (${retryCount + 1}/2)...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          return splitClausesWithGradio(contractText, retryCount + 1);
        }
        
        throw new Error(`Gradio Space authentication error (${callResponse.status}): Please check HF_TOKEN validity`);
        }
        
        // Handle other error codes that might benefit from retry (502, 503, 504)
        if ((callResponse.status === 502 || callResponse.status === 503 || callResponse.status === 504) && retryCount < 3) {
          console.log(`Gradio Space temporarily unavailable (${callResponse.status}), retrying (${retryCount + 1}/3)...`);
          await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1)));
          return splitClausesWithGradio(contractText, retryCount + 1);
        }
        
        throw new Error(`Gradio Space API call error (${callResponse.status}): ${errorText}`);
      }

      // Parse the response as JSON
      const callResult = await callResponse.json().catch((parseError) => {
        console.error('Failed to parse Gradio response as JSON:', parseError);
        throw new Error('Invalid JSON response from Gradio Space');
      });
      
      const eventId = callResult.event_id;
      
      if (!eventId) {
        throw new Error("No event ID received from Gradio Space");
      }

      // Get the result with timeout
      const resultController = new AbortController();
      const resultTimeoutId = setTimeout(() => resultController.abort(), 15000);
      
      try {
        const response = await fetch(`${GRADIO_SPACE_URL}/gradio_api/call/predict/${eventId}`, {
          method: "GET",
          headers: cleanHfToken ? { 
            "Authorization": cleanHfToken.startsWith('Bearer ') ? cleanHfToken : `Bearer ${cleanHfToken}`,
            "Content-Type": "application/json"
          } : { "Content-Type": "application/json" },
          signal: resultController.signal
        });
        
        clearTimeout(resultTimeoutId);

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'No error details');
          throw new Error(`Gradio Space API error (${response.status}): ${errorText}`);
        }

        const responseText = await response.text();
        
        // Parse the Server-Sent Events response
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
        
        if (resultData) {
          try {
            // Try to parse as JSON array
            const parsedClauses = JSON.parse(resultData);
            if (Array.isArray(parsedClauses)) {
              return parsedClauses.filter(clause => 
                clause && 
                typeof clause === 'object' && 
                clause.text && 
                clause.text.length > 20
              );
            }
          } catch (parseError) {
            console.warn('Could not parse Gradio response as JSON:', parseError);
          }
          
          // Fallback: try to extract clauses from plain text response
          return parseClausesFromText(resultData, contractText);
        }
        
        throw new Error("Invalid response from Gradio Space");
      } catch (resultError) {
        clearTimeout(resultTimeoutId);
        throw resultError;
      }
    } catch (callError) {
      clearTimeout(timeoutId);
      throw callError;
    }
  } catch (error) {
    console.error("Error in Gradio clause splitting:", error);
    throw error;
  }
}

async function splitClausesWithHuggingFace(contractText: string): Promise<any[]> {
  const prompt = `You are a legal expert. Analyze this contract and split it into individual clauses. Return a JSON array where each element has "title" and "text" fields.

Guidelines:
- Identify distinct legal provisions/clauses
- Provide descriptive titles  
- Each clause should be self-contained
- Preserve original text

Contract:
${contractText.substring(0, 3000)}

Return JSON array format:
[{"title": "Clause Title", "text": "Full clause text"}, ...]

JSON Array:`;

  try {
    console.log(`Using HF token: ${cleanHfToken ? cleanHfToken.substring(0, 5) + '...' : 'undefined'}`);
    console.log(`Using HF model: ${HF_MODEL_ID}`);
    
    const authToken = cleanHfToken?.startsWith('Bearer ') ? cleanHfToken : `Bearer ${cleanHfToken}`;
    
    const response = await fetch(`https://api-inference.huggingface.co/models/${HF_MODEL_ID}`, {
      method: "POST",
      headers: {
        "Authorization": authToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 1024,
          temperature: 0.1,
          top_p: 0.9,
          return_full_text: false
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error text');
      console.error(`HF API error status: ${response.status}, message: ${errorText}`);
      throw new Error(`Hugging Face API error (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    
    if (Array.isArray(result) && result.length > 0 && result[0].generated_text) {
      const generatedText = result[0].generated_text;
      
      try {
        // Try to extract JSON array from response
        const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsedClauses = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsedClauses)) {
            return parsedClauses.filter(clause => 
              clause && 
              typeof clause === 'object' && 
              clause.text && 
              clause.text.length > 20
            );
          }
        }
      } catch (parseError) {
        console.warn('Could not parse HF response as JSON');
      }
      
      // Fallback: parse from generated text
      return parseClausesFromText(generatedText, contractText);
    }
    
    throw new Error("Invalid response from Hugging Face API");
    
  } catch (error) {
    console.error("Error in HF clause splitting:", error);
    throw error;
  }
}

/**
 * Fallback function to extract clauses from unstructured text response
 */
function parseClausesFromText(responseText: string, originalContract: string): any[] {
  console.log('Parsing clauses from unstructured text response');
  
  const clauses: any[] = [];
  
  // Try to find clause patterns in the response
  const lines = responseText.split('\n').map(l => l.trim()).filter(Boolean);
  
  let currentClause: any = null;
  
  for (const line of lines) {
    // Look for titles (often start with numbers, letters, or are in caps)
    if (/^\d+\.?\s+[A-Z]/.test(line) || /^[A-Z\s]{5,}$/.test(line) || /^[IVX]+\.?\s+/.test(line)) {
      // Save previous clause if exists
      if (currentClause && currentClause.text && currentClause.text.length > 20) {
        clauses.push(currentClause);
      }
      
      // Start new clause
      currentClause = {
        title: line.replace(/^\d+\.?\s*/, '').replace(/^[IVX]+\.?\s*/, '').trim(),
        text: line
      };
    } else if (currentClause && line.length > 10) {
      // Add to current clause text
      currentClause.text += '\n' + line;
    }
  }
  
  // Add last clause
  if (currentClause && currentClause.text && currentClause.text.length > 20) {
    clauses.push(currentClause);
  }
  
  // If we didn't get good clauses, do a simple split
  if (clauses.length === 0) {
    const paragraphs = originalContract.split(/\n\s*\n/);
    for (let i = 0; i < Math.min(paragraphs.length, 10); i++) {
      const para = paragraphs[i].trim();
      if (para && para.length > 50) {
        const firstLine = para.split('\n')[0].trim();
        clauses.push({
          title: firstLine.length < 100 ? firstLine : `Clause ${i + 1}`,
          text: para
        });
      }
    }
  }
  
  return clauses;
} 