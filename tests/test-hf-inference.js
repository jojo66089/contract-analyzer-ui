// Test script to check if the Hugging Face Inference API is responding correctly
const fetch = require('node-fetch');

// Configuration from .env.local
const HF_TOKEN = process.env.HF_TOKEN || 'hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
const HF_MODEL_ID = 'jojo6608/LegalQwen14B';
const HF_API_URL = 'https://api-inference.huggingface.co/models';

// Sample clause text for testing
const sampleClause = `
The Contractor shall provide all services in a reasonable and professional manner.
All work shall be completed within a reasonable time frame, and the Contractor
shall use best efforts to meet all deadlines specified by the Client.
`;

// System prompt for legal analysis
const SYSTEM_PROMPT = `You are a world-class legal expert analyzing contract clauses. For each clause:
- Identify ambiguities and vague terms
- Spot potential risks and liabilities
- Detect missing standard protections
- Provide actionable recommendations
- Cite relevant legal standards when possible

Focus on clarity and practical insights. Output JSON:
{
  "ambiguities": [ "..." ],
  "risks": [ "..." ],
  "recommendations": [ "..." ],
  "missingElements": [ "..." ],
  "references": [ "..." ]
}`;

async function testHuggingFaceInference() {
  console.log('Testing Hugging Face Inference API...');
  console.log(`Model: ${HF_MODEL_ID}`);
  console.log(`Sample clause: ${sampleClause.substring(0, 50)}...`);
  
  try {
    console.log('\nCalling Hugging Face Inference API...');
    
    // Create the prompt with system instructions and user input
    const prompt = {
      inputs: `${SYSTEM_PROMPT}\n\nAnalyze this contract clause:\n${sampleClause}`,
      parameters: {
        max_new_tokens: 1024,
        temperature: 0.3,
        top_p: 0.9,
        do_sample: true,
        return_full_text: false
      }
    };
    
    const response = await fetch(`${HF_API_URL}/${HF_MODEL_ID}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${HF_TOKEN}`
      },
      body: JSON.stringify(prompt)
    });
    
    if (!response.ok) {
      const status = response.status;
      const errorText = await response.text();
      throw new Error(`Hugging Face API error (${status}): ${errorText}`);
    }
    
    const result = await response.json();
    console.log('\nAPI Response:');
    console.log(JSON.stringify(result, null, 2));
    
    // Try to extract and parse the analysis
    if (Array.isArray(result) && result.length > 0 && result[0].generated_text) {
      const generatedText = result[0].generated_text;
      console.log('\nGenerated text:');
      console.log(generatedText);
      
      // Try to extract JSON from the generated text
      try {
        // Look for JSON structure in the text
        const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const jsonStr = jsonMatch[0];
          const analysisJson = JSON.parse(jsonStr);
          
          console.log('\nParsed JSON analysis:');
          console.log(JSON.stringify(analysisJson, null, 2));
          
          // Check if the analysis has the expected fields
          const hasExpectedFormat = 
            Array.isArray(analysisJson.ambiguities) &&
            Array.isArray(analysisJson.risks) &&
            Array.isArray(analysisJson.recommendations);
          
          console.log('\nAnalysis has expected format:', hasExpectedFormat);
          
          if (!hasExpectedFormat) {
            console.log('Missing expected fields in analysis response');
          }
        } else {
          console.log('No JSON structure found in the generated text');
        }
      } catch (parseError) {
        console.error('Error parsing result as JSON:', parseError.message);
      }
    } else {
      console.error('Unexpected response format from Hugging Face API');
    }
    
    console.log('\nTest completed successfully');
  } catch (error) {
    console.error('\nTest failed:', error.message);
  }
}

// Run the test
testHuggingFaceInference();