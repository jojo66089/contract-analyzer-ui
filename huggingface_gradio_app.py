import gradio as gr
import json
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig
import re

# Load your fine-tuned model
MODEL_NAME = "jojo6608/LegalQwen14B"  # Replace with your actual model name if different

# Quantization config for efficiency (4-bit loading to save memory)
quantization_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_compute_dtype=torch.float16,
    bnb_4bit_use_double_quant=True,
    bnb_4bit_quant_type="nf4"
)

print("Loading model and tokenizer...")
try:
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, trust_remote_code=True)
    model = AutoModelForCausalLM.from_pretrained(
        MODEL_NAME,
        quantization_config=quantization_config,
        device_map="auto",
        trust_remote_code=True,
        torch_dtype=torch.float16
    )
    print("Model loaded successfully!")
except Exception as e:
    print(f"Error loading model: {e}")
    # Fallback to a smaller model if your specific model fails
    MODEL_NAME = "microsoft/DialoGPT-medium"
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    model = AutoModelForCausalLM.from_pretrained(MODEL_NAME)

# Set pad token if not present
if tokenizer.pad_token is None:
    tokenizer.pad_token = tokenizer.eos_token

def analyze_legal_clause(clause_text):
    """
    Analyze a legal clause and return structured analysis
    """
    if not clause_text.strip():
        return json.dumps({
            "error": "Please provide a clause to analyze"
        })
    
    try:
        # Create a comprehensive prompt for legal analysis
        prompt = f"""You are a world-class legal expert analyzing contract clauses. Analyze the following clause and provide a detailed assessment.

CLAUSE TO ANALYZE:
{clause_text}

Please provide your analysis in the following JSON format:
{{
  "ambiguities": ["List specific ambiguous terms or phrases"],
  "risks": ["List potential legal risks and liabilities"],
  "recommendations": ["List specific actionable recommendations"],
  "missingElements": ["List any missing standard legal protections"],
  "references": ["List relevant legal standards or precedents"]
}}

ANALYSIS:"""

        # Tokenize and generate
        inputs = tokenizer(
            prompt,
            return_tensors="pt",
            truncation=True,
            max_length=2048,
            padding=True
        )
        
        # Move to GPU if available
        if torch.cuda.is_available():
            inputs = {k: v.to(model.device) for k, v in inputs.items()}
        
        # Generate response
        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=512,
                temperature=0.3,
                do_sample=True,
                pad_token_id=tokenizer.eos_token_id,
                eos_token_id=tokenizer.eos_token_id,
                repetition_penalty=1.1
            )
        
        # Decode response
        response = tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        # Extract the analysis part (after "ANALYSIS:")
        analysis_start = response.find("ANALYSIS:")
        if analysis_start != -1:
            analysis_text = response[analysis_start + 9:].strip()
        else:
            analysis_text = response[len(prompt):].strip()
        
        # Try to extract JSON from the response
        json_match = re.search(r'\{[\s\S]*\}', analysis_text)
        if json_match:
            try:
                analysis_json = json.loads(json_match.group())
                return json.dumps(analysis_json, indent=2)
            except json.JSONDecodeError:
                pass
        
        # If JSON extraction fails, create structured response from text
        return create_structured_analysis(analysis_text, clause_text)
        
    except Exception as e:
        print(f"Error in analysis: {e}")
        return json.dumps({
            "error": f"Analysis failed: {str(e)}",
            "ambiguities": ["Unable to analyze - please try again"],
            "risks": ["Analysis service temporarily unavailable"],
            "recommendations": ["Please retry the analysis"],
            "missingElements": [],
            "references": []
        })

def create_structured_analysis(analysis_text, clause_text):
    """
    Create a structured analysis when JSON parsing fails
    """
    # Extract insights from the generated text
    ambiguities = extract_section(analysis_text, ["ambiguous", "unclear", "vague", "indefinite"])
    risks = extract_section(analysis_text, ["risk", "liability", "danger", "concern", "problem"])
    recommendations = extract_section(analysis_text, ["recommend", "suggest", "should", "must", "need"])
    
    # Basic clause analysis based on content
    clause_lower = clause_text.lower()
    detected_ambiguities = []
    detected_risks = []
    detected_recommendations = []
    
    # Common legal issues detection
    if "reasonable" in clause_lower:
        detected_ambiguities.append("Term 'reasonable' is subjective and may lead to disputes")
        detected_recommendations.append("Define specific criteria for what constitutes 'reasonable'")
    
    if "best efforts" in clause_lower:
        detected_ambiguities.append("'Best efforts' standard is vague and difficult to enforce")
        detected_recommendations.append("Replace with 'commercially reasonable efforts' or specific performance metrics")
    
    if "material" in clause_lower and "breach" in clause_lower:
        detected_ambiguities.append("Definition of 'material breach' is not specified")
        detected_recommendations.append("Define what constitutes a material breach with specific examples")
    
    if "confidential" in clause_lower:
        detected_risks.append("Scope of confidentiality obligations may be overly broad")
        detected_recommendations.append("Clearly define what information is considered confidential")
    
    if "terminate" in clause_lower:
        detected_risks.append("Termination conditions and procedures may be unclear")
        detected_recommendations.append("Specify exact termination procedures and notice requirements")
    
    return json.dumps({
        "ambiguities": detected_ambiguities + ambiguities[:3],
        "risks": detected_risks + risks[:3],
        "recommendations": detected_recommendations + recommendations[:3],
        "missingElements": [
            "Governing law clause may be missing",
            "Dispute resolution mechanism should be specified"
        ],
        "references": [
            "Contract law fundamentals",
            "Industry standard practices"
        ]
    }, indent=2)

def extract_section(text, keywords):
    """
    Extract relevant points from analysis text based on keywords
    """
    sentences = text.split('.')
    relevant = []
    
    for sentence in sentences:
        sentence = sentence.strip()
        if any(keyword in sentence.lower() for keyword in keywords) and len(sentence) > 20:
            relevant.append(sentence)
    
    return relevant[:3]  # Return top 3 relevant points

# Create Gradio interface
def gradio_analyze(clause_text):
    """Gradio wrapper for the analysis function"""
    result = analyze_legal_clause(clause_text)
    return result

# Create the interface
demo = gr.Interface(
    fn=gradio_analyze,
    inputs=gr.Textbox(
        lines=10,
        placeholder="Paste your legal clause here...",
        label="Legal Clause Text"
    ),
    outputs=gr.JSON(label="Legal Analysis"),
    title="Legal Contract Clause Analyzer",
    description="Analyze legal contract clauses for ambiguities, risks, and recommendations using a fine-tuned legal LLM.",
    examples=[
        ["The Party shall use reasonable efforts to complete the work in a timely manner."],
        ["Either party may terminate this agreement upon thirty (30) days written notice."],
        ["Confidential Information includes all non-public information disclosed by either party."]
    ]
)

if __name__ == "__main__":
    demo.launch() 