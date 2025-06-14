from http.server import BaseHTTPRequestHandler
import json
import re
import time
from urllib.parse import parse_qs

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
        
        # Contract type detection
        contract_type = 'General Contract'
        if any(term in clause_lower for term in ['employment', 'employee', 'employer', 'salary', 'benefits']):
            contract_type = 'Employment Agreement'
        elif any(term in clause_lower for term in ['service', 'contractor', 'deliverable', 'statement of work']):
            contract_type = 'Service Agreement'
        elif any(term in clause_lower for term in ['confidential', 'non-disclosure', 'proprietary']):
            contract_type = 'Non-Disclosure Agreement'
        
        # Calculate overall severity
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
        
        # Generate key findings
        key_findings = []
        if total_issues == 0:
            key_findings.append('No major legal issues detected in this clause')
        else:
            key_findings.append(f'Found {total_issues} legal concerns requiring attention')
        
        if severity in ['HIGH', 'CRITICAL']:
            key_findings.append(f'⚠️ {severity} RISK: Immediate legal review strongly recommended')
        
        if contract_type != 'General Contract':
            key_findings.append(f'Detected as {contract_type} - specialized analysis applied')
        
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
                "missingProtections": []
            },
            "recommendations": {
                "immediate": [item['recommendation'] for item in ambiguities + risks if item.get('riskLevel') in ['HIGH', 'CRITICAL']],
                "general": [item['recommendation'] for item in ambiguities + risks if item.get('riskLevel') in ['LOW', 'MEDIUM']]
            },
            "plainEnglishExplanation": {
                "whatThisMeans": [item['plainEnglish'] for item in ambiguities + risks],
                "whyItMatters": "Legal language can hide important risks and obligations. This analysis helps you understand what you're agreeing to in simple terms.",
                "nextSteps": "Consider consulting with a qualified attorney for complex agreements, high-value transactions, or when critical risks are identified."
            },
            "legalReferences": ['Restatement (Second) of Contracts', 'Uniform Commercial Code (UCC)'],
            "metadata": {
                "analysisVersion": "2.0-enhanced-api",
                "analysisDate": time.strftime("%Y-%m-%d %H:%M:%S"),
                "disclaimer": "This analysis is for informational purposes only and does not constitute legal advice."
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

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        html = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>Enhanced Legal Clause Analyzer</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                .container { background: #f5f5f5; padding: 20px; border-radius: 10px; }
                textarea { width: 100%; height: 200px; margin: 10px 0; padding: 10px; }
                button { background: #007cba; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
                button:hover { background: #005a87; }
                .result { margin-top: 20px; padding: 15px; background: white; border-radius: 5px; }
                .risk-critical { color: #d32f2f; font-weight: bold; }
                .risk-high { color: #f57c00; font-weight: bold; }
                .risk-medium { color: #fbc02d; font-weight: bold; }
                .risk-low { color: #388e3c; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🏛️ Enhanced Legal Clause Analyzer</h1>
                <p>Analyze legal contract clauses with AI-powered risk assessment and plain English explanations.</p>
                
                <textarea id="clauseText" placeholder="Paste your legal clause here for analysis..."></textarea>
                <br>
                <button onclick="analyzeClause()">Analyze Clause</button>
                
                <div id="result" class="result" style="display: none;"></div>
            </div>
            
            <script>
                async function analyzeClause() {
                    const clauseText = document.getElementById('clauseText').value;
                    if (!clauseText.trim()) {
                        alert('Please enter a clause to analyze');
                        return;
                    }
                    
                    const resultDiv = document.getElementById('result');
                    resultDiv.innerHTML = '<p>Analyzing...</p>';
                    resultDiv.style.display = 'block';
                    
                    try {
                        const response = await fetch('/api/analyze', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ clause: clauseText })
                        });
                        
                        const data = await response.json();
                        displayResults(data);
                    } catch (error) {
                        resultDiv.innerHTML = '<p style="color: red;">Error: ' + error.message + '</p>';
                    }
                }
                
                function displayResults(data) {
                    const resultDiv = document.getElementById('result');
                    
                    if (data.error) {
                        resultDiv.innerHTML = '<p style="color: red;">Error: ' + data.error + '</p>';
                        return;
                    }
                    
                    const summary = data.summary;
                    const detailed = data.detailedAnalysis;
                    const plainEnglish = data.plainEnglishExplanation;
                    
                    let html = '<h2>Analysis Results</h2>';
                    
                    // Summary
                    html += '<h3>Summary</h3>';
                    html += '<p><strong>Contract Type:</strong> ' + summary.contractType + '</p>';
                    html += '<p><strong>Overall Severity:</strong> <span class="risk-' + summary.overallSeverity.toLowerCase() + '">' + summary.overallSeverity + '</span></p>';
                    html += '<p><strong>Total Issues:</strong> ' + summary.totalIssues + '</p>';
                    
                    // Key Findings
                    if (summary.keyFindings && summary.keyFindings.length > 0) {
                        html += '<h4>Key Findings:</h4><ul>';
                        summary.keyFindings.forEach(finding => {
                            html += '<li>' + finding + '</li>';
                        });
                        html += '</ul>';
                    }
                    
                    // Plain English Explanations
                    if (plainEnglish.whatThisMeans && plainEnglish.whatThisMeans.length > 0) {
                        html += '<h3>Plain English Explanations</h3><ul>';
                        plainEnglish.whatThisMeans.forEach(explanation => {
                            html += '<li>' + explanation + '</li>';
                        });
                        html += '</ul>';
                    }
                    
                    // Risks
                    if (detailed.risks && detailed.risks.length > 0) {
                        html += '<h3>Identified Risks</h3>';
                        detailed.risks.forEach(risk => {
                            html += '<div style="margin: 10px 0; padding: 10px; border-left: 3px solid #f57c00;">';
                            html += '<strong>' + risk.issue + '</strong><br>';
                            html += risk.description + '<br>';
                            html += '<em>Recommendation: ' + risk.recommendation + '</em>';
                            html += '</div>';
                        });
                    }
                    
                    resultDiv.innerHTML = html;
                }
            </script>
        </body>
        </html>
        """
        
        self.wfile.write(html.encode())
    
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        try:
            data = json.loads(post_data.decode('utf-8'))
            clause_text = data.get('clause', '')
            
            result = analyze_legal_clause_enhanced(clause_text)
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            self.wfile.write(result.encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            error_response = json.dumps({"error": str(e)})
            self.wfile.write(error_response.encode())