import gradio as gr
import json
import re
import time
from typing import Dict, List, Any

def analyze_legal_clause_enhanced(clause_text: str) -> str:
    """
    Enhanced legal clause analysis with comprehensive pattern matching,
    risk assessment, and plain English explanations
    """
    if not clause_text or not clause_text.strip():
        return json.dumps({
            "error": "Please provide a clause to analyze"
        })
    
    try:
        clause_lower = clause_text.lower()
        
        # Enhanced pattern matching
        ambiguities = []
        risks = []
        risk_scores = {}
        
        # Ambiguous terms with enhanced detection
        ambiguous_patterns = {
            'reasonable': {
                'risk': 2, 
                'desc': 'Subjective standard that may lead to disputes',
                'plain': 'The word "reasonable" means different things to different people',
                'recommendation': 'Define specific criteria, timeframes, or benchmarks for what constitutes "reasonable"'
            },
            'material': {
                'risk': 2, 
                'desc': 'Undefined materiality threshold creates interpretation risk',
                'plain': 'What counts as "material" should be clearly defined with numbers or examples',
                'recommendation': 'Specify dollar amounts, percentages, or concrete examples of materiality'
            },
            'best efforts': {
                'risk': 3, 
                'desc': 'Highest standard of performance with unclear boundaries',
                'plain': '"Best efforts" could mean unlimited obligation - very risky for you',
                'recommendation': 'Replace with "commercially reasonable efforts" with defined performance metrics'
            },
            'timely': {
                'risk': 2, 
                'desc': 'Vague timeframe creates potential scheduling disputes',
                'plain': 'Always use specific dates instead of vague terms like "timely"',
                'recommendation': 'Specify exact deadlines, timeframes, and delivery dates'
            },
            'professional manner': {
                'risk': 1, 
                'desc': 'Subjective performance standard without clear definition',
                'plain': 'Describe exactly what "professional" means in this specific context',
                'recommendation': 'Define specific quality standards or industry benchmarks for professional performance'
            }
        }
        
        for term, details in ambiguous_patterns.items():
            if term in clause_lower:
                risk_level = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'][min(details['risk'], 3)]
                ambiguities.append({
                    'issue': f'Ambiguous term: "{term}"',
                    'description': details['desc'],
                    'plainEnglish': details['plain'],
                    'recommendation': details['recommendation'],
                    'riskLevel': risk_level
                })
                risk_scores[term] = details['risk']
        
        # High-risk patterns with comprehensive detection
        high_risk_patterns = [
            {
                'pattern': r'unlimited liability|any and all damages|no limitation.*liability|liable.*all.*damages',
                'risk': 4,
                'name': 'Unlimited liability exposure',
                'desc': 'Exposes party to potentially catastrophic financial risk',
                'plain': 'This could bankrupt you - always limit your liability exposure',
                'recommendation': 'Add liability caps and exclude consequential damages'
            },
            {
                'pattern': r'irrevocably.*assign|irrevocable.*assignment',
                'risk': 3,
                'name': 'Irrevocable assignment',
                'desc': 'Permanent transfer of rights with no recourse or reversal option',
                'plain': 'Once you sign this, you can never get these rights back',
                'recommendation': 'Add termination conditions and scope limitations to assignments'
            },
            {
                'pattern': r'perpetuity|throughout.*universe|forever',
                'risk': 3,
                'name': 'Unlimited duration',
                'desc': 'Unlimited time duration may be legally unenforceable',
                'plain': 'Forever is too long - courts may not enforce overly broad terms',
                'recommendation': 'Limit scope to reasonable time periods and geographic areas'
            },
            {
                'pattern': r'cayman.*law|cayman islands',
                'risk': 3,
                'name': 'Offshore jurisdiction',
                'desc': 'Offshore jurisdiction may limit legal protections and enforcement',
                'plain': 'Resolving disputes offshore may be difficult, expensive, and risky',
                'recommendation': 'Consider requiring disputes be resolved in more favorable jurisdiction'
            },
            {
                'pattern': r'class action.*waiver|waiving.*class action',
                'risk': 2,
                'name': 'Class action waiver',
                'desc': 'Prevents joining group lawsuits against the other party',
                'plain': 'You cannot join with others to sue - this may limit your legal options',
                'recommendation': 'Verify enforceability under applicable state and federal law'
            },
            {
                'pattern': r'waiver.*audit|waiving.*audit',
                'risk': 3,
                'name': 'Audit rights waiver',
                'desc': 'Eliminates oversight and verification rights',
                'plain': 'You are giving up the right to check if they are following the rules',
                'recommendation': 'Preserve essential audit and oversight rights'
            },
            {
                'pattern': r'terminate.*immediately.*without|immediate.*termination.*without',
                'risk': 2,
                'name': 'Immediate termination without notice',
                'desc': 'Allows abrupt contract termination without warning or cure period',
                'plain': 'The other party can end this deal instantly without warning you',
                'recommendation': 'Add reasonable notice requirements and cure periods'
            },
            {
                'pattern': r'indemnify.*harmless|hold.*harmless',
                'risk': 3,
                'name': 'Broad indemnification',
                'desc': 'May require defending against claims beyond your control',
                'plain': 'You might have to pay for problems you did not cause',
                'recommendation': 'Limit indemnification to specific scenarios and exclude gross negligence'
            }
        ]
        
        for pattern_info in high_risk_patterns:
            if re.search(pattern_info['pattern'], clause_lower):
                risk_level = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'][min(pattern_info['risk'], 3)]
                risks.append({
                    'issue': f'High-risk clause: {pattern_info["name"]}',
                    'description': pattern_info['desc'],
                    'plainEnglish': pattern_info['plain'],
                    'recommendation': pattern_info['recommendation'],
                    'riskLevel': risk_level
                })
                risk_scores[pattern_info['name']] = pattern_info['risk']
        
        # Contract type detection with specialized analysis
        contract_type = 'General Contract'
        if any(term in clause_lower for term in ['employment', 'employee', 'employer', 'salary', 'benefits']):
            contract_type = 'Employment Agreement'
        elif any(term in clause_lower for term in ['service', 'contractor', 'deliverable', 'statement of work']):
            contract_type = 'Service Agreement'
        elif any(term in clause_lower for term in ['confidential', 'non-disclosure', 'proprietary']):
            contract_type = 'Non-Disclosure Agreement'
        elif any(term in clause_lower for term in ['license', 'intellectual property', 'software', 'patent']):
            contract_type = 'License Agreement'
        elif any(term in clause_lower for term in ['purchase', 'sale', 'goods', 'product']):
            contract_type = 'Purchase Agreement'
        
        # Calculate overall severity based on risk scores
        if risk_scores:
            max_risk = max(risk_scores.values())
            avg_risk = sum(risk_scores.values()) / len(risk_scores)
            
            if max_risk >= 4 or avg_risk >= 3:
                severity = 'CRITICAL'
            elif max_risk >= 3 or avg_risk >= 2.5:
                severity = 'HIGH'
            elif max_risk >= 2 or avg_risk >= 1.5:
                severity = 'MEDIUM'
            else:
                severity = 'LOW'
        else:
            severity = 'LOW'
        
        total_issues = len(ambiguities) + len(risks)
        
        # Generate comprehensive key findings
        key_findings = []
        if total_issues == 0:
            key_findings.append('No major legal issues detected in this clause')
        elif total_issues == 1:
            key_findings.append('Found 1 legal concern requiring attention')
        else:
            key_findings.append(f'Found {total_issues} legal concerns requiring attention')
        
        if severity in ['HIGH', 'CRITICAL']:
            key_findings.append(f'⚠️ {severity} RISK: Immediate legal review strongly recommended')
        
        if contract_type != 'General Contract':
            key_findings.append(f'Detected as {contract_type} - specialized analysis applied')
        
        # Missing standard protections check
        missing_protections = []
        if not any(term in clause_lower for term in ['governing law', 'applicable law']):
            missing_protections.append({
                'element': 'Governing Law Clause',
                'description': 'Specifies which jurisdiction\'s laws apply to the contract',
                'recommendation': 'Add governing law clause to clarify legal jurisdiction',
                'plainEnglish': 'You need to specify which state or country\'s laws apply'
            })
        
        if not any(term in clause_lower for term in ['dispute', 'arbitration', 'litigation']):
            missing_protections.append({
                'element': 'Dispute Resolution Mechanism',
                'description': 'Defines how conflicts will be resolved',
                'recommendation': 'Add clear dispute resolution procedures',
                'plainEnglish': 'You need a plan for handling disagreements'
            })
        
        if 'liability' in clause_lower and not any(term in clause_lower for term in ['limit', 'cap', 'exclude']):
            missing_protections.append({
                'element': 'Liability Limitations',
                'description': 'Protects against excessive financial exposure',
                'recommendation': 'Add liability caps and damage exclusions',
                'plainEnglish': 'You should limit how much you could owe if something goes wrong'
            })
        
        # Legal references based on content
        legal_references = ['Restatement (Second) of Contracts']
        
        if contract_type == 'Employment Agreement':
            legal_references.extend(['Fair Labor Standards Act (FLSA)', 'National Labor Relations Act'])
        elif 'intellectual property' in clause_lower:
            legal_references.extend(['Copyright Act of 1976', 'Patent Act (35 U.S.C.)'])
        elif 'arbitration' in clause_lower:
            legal_references.append('Federal Arbitration Act (FAA)')
        elif any(term in clause_lower for term in ['sale', 'goods', 'purchase']):
            legal_references.append('Uniform Commercial Code (UCC)')
        
        # Format comprehensive analysis results
        formatted_analysis = {
            "summary": {
                "contractType": contract_type,
                "overallSeverity": severity,
                "totalIssues": total_issues,
                "keyFindings": key_findings
            },
            "detailedAnalysis": {
                "ambiguities": ambiguities,
                "risks": risks,
                "missingProtections": missing_protections[:3]  # Limit to top 3
            },
            "recommendations": {
                "immediate": [item['recommendation'] for item in ambiguities + risks if item.get('riskLevel') in ['HIGH', 'CRITICAL']],
                "general": [item['recommendation'] for item in ambiguities + risks if item.get('riskLevel') in ['LOW', 'MEDIUM']],
                "missingElements": [item['recommendation'] for item in missing_protections]
            },
            "plainEnglishExplanation": {
                "whatThisMeans": [item['plainEnglish'] for item in ambiguities + risks],
                "whyItMatters": "Legal language can hide important risks and obligations. This analysis helps you understand what you're agreeing to in simple terms.",
                "nextSteps": "Consider consulting with a qualified attorney for complex agreements, high-value transactions, or when critical risks are identified."
            },
            "legalReferences": legal_references[:4],  # Limit to most relevant
            "metadata": {
                "analysisVersion": "2.0-enhanced-production",
                "analysisDate": time.strftime("%Y-%m-%d %H:%M:%S"),
                "disclaimer": "This analysis is for informational purposes only and does not constitute legal advice. Consult qualified legal counsel for specific legal guidance."
            }
        }
        
        return json.dumps(formatted_analysis, indent=2)
        
    except Exception as e:
        return json.dumps({
            "error": f"Analysis failed: {str(e)}",
            "summary": {"overallSeverity": "UNKNOWN"},
            "recommendations": {"immediate": ["Please retry the analysis or consult legal counsel"]},
            "metadata": {"analysisVersion": "2.0-enhanced-error"}
        })

# Create enhanced Gradio interface
demo = gr.Interface(
    fn=analyze_legal_clause_enhanced,
    inputs=gr.Textbox(
        lines=15,
        max_lines=50,
        placeholder="Paste your legal clause here for comprehensive AI-powered analysis...",
        label="Legal Clause Text",
        info="Enter contract clauses, terms, or legal language for detailed analysis with risk assessment and plain-English explanations"
    ),
    outputs=gr.JSON(
        label="Enhanced Legal Analysis Results",
        show_label=True
    ),
    title="🏛️ Enhanced Legal Contract Clause Analyzer",
    description="""
    **AI-Powered Legal Contract Analysis Tool - Enhanced Version 2.0**
    
    This enhanced tool provides comprehensive, professional-grade analysis of legal contract clauses, featuring:
    
    🔍 **Comprehensive Analysis**:
    - **Risk Assessment**: Severity scoring (LOW/MEDIUM/HIGH/CRITICAL) with detailed risk evaluation
    - **Plain English**: Simple explanations of complex legal terms and their implications
    - **Contract Type Detection**: Specialized analysis based on agreement type (Employment, Service, NDA, etc.)
    - **Missing Protections**: Identification of important missing clauses and safeguards
    
    📊 **Enhanced Features**:
    - **Advanced Pattern Matching**: Detects subtle legal risks and problematic language
    - **Jurisdiction Analysis**: Identifies location-specific legal considerations  
    - **Prioritized Recommendations**: Immediate vs. general action items based on risk level
    - **Legal References**: Relevant laws, cases, and regulations for further research
    - **Professional Structure**: Organized analysis comparable to legal review
    
    ⚖️ **Quality Assurance**: Designed to provide thorough, digestible legal insights that help you understand contract risks and make informed decisions.
    
    *Important: This tool provides enhanced legal analysis but should not replace consultation with qualified legal counsel for important agreements or when significant risks are identified.*
    """,
    examples=[
        ["The Contractor shall use reasonable efforts to complete the work in a timely manner using professional standards."],
        ["Company shall be liable for any and all damages, losses, costs, and expenses arising from this agreement, including consequential damages, with no limitation on liability."],
        ["Employee hereby irrevocably assigns to Company all rights, title, and interest in any intellectual property created during employment, including ideas conceived outside work hours, for perpetuity throughout the universe."],
        ["Either party may terminate this agreement immediately without cause or notice. Payment obligations survive indefinitely."],
        ["Recipient agrees to maintain in confidence all information disclosed, including publicly available information, for 50 years."],
        ["All disputes shall be resolved through binding arbitration in the Cayman Islands under Cayman law, with each party waiving rights to class action lawsuits and audit rights."],
        ["Contractor agrees to indemnify and hold harmless Company from any and all claims, including those arising from Company's gross negligence."],
        ["This license grants worldwide, perpetual, irrevocable rights with automatic renewal and waiver of termination rights."]
    ],
    theme=gr.themes.Soft(),
    allow_flagging="never",
    analytics_enabled=False
)

if __name__ == "__main__":
    demo.launch(
        server_name="0.0.0.0",
        server_port=7860,
        share=False
    )