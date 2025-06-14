// Enhanced Legal Clause Analyzer - Node.js API for Vercel
export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    res.status(200).json({
      service: 'Enhanced Legal Clause Analyzer',
      version: '2.0-enhanced-nodejs',
      status: 'online',
      message: 'Send POST request with {"clause": "your legal text"} to analyze'
    });
    return;
  }

  if (req.method === 'POST') {
    try {
      const { clause } = req.body;
      
      if (!clause || !clause.trim()) {
        return res.status(400).json({
          error: 'Please provide a clause to analyze'
        });
      }

      const result = analyzeLegalClauseEnhanced(clause);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        error: `Analysis failed: ${error.message}`,
        summary: { overallSeverity: 'UNKNOWN' },
        recommendations: { immediate: ['Please retry the analysis or consult legal counsel'] },
        metadata: { analysisVersion: '2.0-enhanced-error' }
      });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

function analyzeLegalClauseEnhanced(clauseText) {
  const clauseLower = clauseText.toLowerCase();
  const ambiguities = [];
  const risks = [];
  const riskScores = {};

  // Ambiguous terms patterns
  const ambiguousPatterns = {
    'reasonable': {
      risk: 2,
      desc: 'Subjective standard that may lead to disputes',
      plain: 'The word "reasonable" means different things to different people',
      rec: 'Define specific criteria, timeframes, or benchmarks for what constitutes "reasonable"'
    },
    'material': {
      risk: 2,
      desc: 'Undefined materiality threshold creates interpretation risk',
      plain: 'What counts as "material" should be clearly defined with numbers or examples',
      rec: 'Specify dollar amounts, percentages, or concrete examples of materiality'
    },
    'best efforts': {
      risk: 3,
      desc: 'Highest standard of performance with unclear boundaries',
      plain: '"Best efforts" could mean unlimited obligation - very risky for you',
      rec: 'Replace with "commercially reasonable efforts" with defined performance metrics'
    },
    'timely': {
      risk: 2,
      desc: 'Vague timeframe creates potential scheduling disputes',
      plain: 'Always use specific dates instead of vague terms like "timely"',
      rec: 'Specify exact deadlines, timeframes, and delivery dates'
    },
    'professional manner': {
      risk: 1,
      desc: 'Subjective performance standard without clear definition',
      plain: 'Describe exactly what "professional" means in this specific context',
      rec: 'Define specific quality standards or industry benchmarks for professional performance'
    }
  };

  // Check for ambiguous terms
  for (const [term, details] of Object.entries(ambiguousPatterns)) {
    if (clauseLower.includes(term)) {
      const riskLevel = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'][Math.min(details.risk, 3)];
      ambiguities.push({
        issue: `Ambiguous term: "${term}"`,
        description: details.desc,
        plainEnglish: details.plain,
        recommendation: details.rec,
        riskLevel: riskLevel
      });
      riskScores[term] = details.risk;
    }
  }

  // High-risk patterns
  const highRiskPatterns = [
    {
      pattern: /unlimited liability|any and all damages|no limitation.*liability|liable.*all.*damages/i,
      risk: 4,
      name: 'Unlimited liability exposure',
      desc: 'Exposes party to potentially catastrophic financial risk',
      plain: 'This could bankrupt you - always limit your liability exposure',
      rec: 'Add liability caps and exclude consequential damages'
    },
    {
      pattern: /irrevocably.*assign|irrevocable.*assignment/i,
      risk: 3,
      name: 'Irrevocable assignment',
      desc: 'Permanent transfer of rights with no recourse or reversal option',
      plain: 'Once you sign this, you can never get these rights back',
      rec: 'Add termination conditions and scope limitations to assignments'
    },
    {
      pattern: /perpetuity|throughout.*universe|forever/i,
      risk: 3,
      name: 'Unlimited duration',
      desc: 'Unlimited time duration may be legally unenforceable',
      plain: 'Forever is too long - courts may not enforce overly broad terms',
      rec: 'Limit scope to reasonable time periods and geographic areas'
    },
    {
      pattern: /cayman.*law|cayman islands/i,
      risk: 3,
      name: 'Offshore jurisdiction',
      desc: 'Offshore jurisdiction may limit legal protections and enforcement',
      plain: 'Resolving disputes offshore may be difficult, expensive, and risky',
      rec: 'Consider requiring disputes be resolved in more favorable jurisdiction'
    },
    {
      pattern: /class action.*waiver|waiving.*class action/i,
      risk: 2,
      name: 'Class action waiver',
      desc: 'Prevents joining group lawsuits against the other party',
      plain: 'You cannot join with others to sue - this may limit your legal options',
      rec: 'Verify enforceability under applicable state and federal law'
    },
    {
      pattern: /waiver.*audit|waiving.*audit/i,
      risk: 3,
      name: 'Audit rights waiver',
      desc: 'Eliminates oversight and verification rights',
      plain: 'You are giving up the right to check if they are following the rules',
      rec: 'Preserve essential audit and oversight rights'
    }
  ];

  // Check for high-risk patterns
  for (const patternInfo of highRiskPatterns) {
    if (patternInfo.pattern.test(clauseText)) {
      const riskLevel = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'][Math.min(patternInfo.risk, 3)];
      risks.push({
        issue: `High-risk clause: ${patternInfo.name}`,
        description: patternInfo.desc,
        plainEnglish: patternInfo.plain,
        recommendation: patternInfo.rec,
        riskLevel: riskLevel
      });
      riskScores[patternInfo.name] = patternInfo.risk;
    }
  }

  // Contract type detection
  let contractType = 'General Contract';
  if (/employment|employee|employer|salary|benefits/i.test(clauseText)) {
    contractType = 'Employment Agreement';
  } else if (/service|contractor|deliverable|statement of work/i.test(clauseText)) {
    contractType = 'Service Agreement';
  } else if (/confidential|non-disclosure|proprietary/i.test(clauseText)) {
    contractType = 'Non-Disclosure Agreement';
  } else if (/license|intellectual property|software|patent/i.test(clauseText)) {
    contractType = 'License Agreement';
  }

  // Calculate overall severity
  let severity = 'LOW';
  if (Object.keys(riskScores).length > 0) {
    const maxRisk = Math.max(...Object.values(riskScores));
    const avgRisk = Object.values(riskScores).reduce((a, b) => a + b, 0) / Object.values(riskScores).length;
    
    if (maxRisk >= 4 || avgRisk >= 3) {
      severity = 'CRITICAL';
    } else if (maxRisk >= 3 || avgRisk >= 2.5) {
      severity = 'HIGH';
    } else if (maxRisk >= 2 || avgRisk >= 1.5) {
      severity = 'MEDIUM';
    }
  }

  const totalIssues = ambiguities.length + risks.length;

  // Generate key findings
  const keyFindings = [];
  if (totalIssues === 0) {
    keyFindings.push('No major legal issues detected in this clause');
  } else {
    keyFindings.push(`Found ${totalIssues} legal concern${totalIssues > 1 ? 's' : ''} requiring attention`);
  }

  if (['HIGH', 'CRITICAL'].includes(severity)) {
    keyFindings.push(`⚠️ ${severity} RISK: Immediate legal review strongly recommended`);
  }

  if (contractType !== 'General Contract') {
    keyFindings.push(`Detected as ${contractType} - specialized analysis applied`);
  }

  // Format comprehensive analysis results
  return {
    summary: {
      contractType: contractType,
      overallSeverity: severity,
      totalIssues: totalIssues,
      keyFindings: keyFindings
    },
    detailedAnalysis: {
      ambiguities: ambiguities,
      risks: risks,
      missingProtections: []
    },
    recommendations: {
      immediate: [...ambiguities, ...risks]
        .filter(item => ['HIGH', 'CRITICAL'].includes(item.riskLevel))
        .map(item => item.recommendation),
      general: [...ambiguities, ...risks]
        .filter(item => ['LOW', 'MEDIUM'].includes(item.riskLevel))
        .map(item => item.recommendation)
    },
    plainEnglishExplanation: {
      whatThisMeans: [...ambiguities, ...risks].map(item => item.plainEnglish),
      whyItMatters: 'Legal language can hide important risks and obligations. This analysis helps you understand what you\'re agreeing to in simple terms.',
      nextSteps: 'Consider consulting with a qualified attorney for complex agreements, high-value transactions, or when critical risks are identified.'
    },
    legalReferences: [
      'Restatement (Second) of Contracts',
      'Uniform Commercial Code (UCC)',
      ...(contractType === 'Employment Agreement' ? ['Fair Labor Standards Act (FLSA)'] : []),
      ...(clauseText.toLowerCase().includes('arbitration') ? ['Federal Arbitration Act (FAA)'] : [])
    ],
    metadata: {
      analysisVersion: '2.0-enhanced-nodejs',
      analysisDate: new Date().toISOString(),
      disclaimer: 'This analysis is for informational purposes only and does not constitute legal advice. Consult qualified legal counsel for specific legal guidance.'
    }
  };
}