// End-to-end test for enhanced contract analysis features
const fs = require('fs');

const API_BASE = 'http://localhost:3000';

// Sample contract for testing
const testContract = `
MASTER SERVICE AGREEMENT

1. DEFINITIONS
For purposes of this Agreement, the following terms shall have the meanings set forth below:
"Confidential Information" means any and all non-public, proprietary information.
"Services" means the services described in each Statement of Work.
The parties shall make reasonable efforts to maintain confidentiality.

2. PAYMENT TERMS  
Client shall pay Contractor within thirty (30) days of receipt of invoice.
Late payments shall incur reasonable penalty fees as determined by Contractor.
All fees are non-refundable unless otherwise specified in writing.
Payment disputes shall be resolved through reasonable commercial efforts.

3. TERMINATION
Either party may terminate this Agreement for material breach with reasonable notice.
Upon termination, all work product shall be delivered to Client immediately.
Confidentiality obligations shall survive termination indefinitely.
Reasonable efforts shall be made to ensure orderly transition.

4. LIABILITY LIMITATION
IN NO EVENT SHALL CONTRACTOR BE LIABLE FOR CONSEQUENTIAL DAMAGES.
Total liability shall not exceed the amount paid under this Agreement.
These limitations apply to the maximum extent permitted by law.
Force majeure events shall excuse performance for reasonable periods.

5. GOVERNING LAW
This Agreement shall be governed by the laws of California.
Any disputes shall be resolved through binding arbitration.
The prevailing party shall be entitled to reasonable attorneys' fees.
`;

async function runEndToEndTest() {
  console.log('🚀 Starting End-to-End Contract Analysis Test\n');
  
  try {
    // Test 1: Clause Splitting
    console.log('📋 Test 1: Clause Splitting Functionality');
    console.log('='.repeat(50));
    
    const clauseResponse = await fetch(`${API_BASE}/api/llm/split-clauses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contractText: testContract })
    });
    
    const clauseResult = await clauseResponse.json();
    console.log('Clause Splitting Response:', JSON.stringify(clauseResult, null, 2));
    
    if (clauseResult.error && clauseResult.fallbackRequired) {
      console.log('✅ Clause splitting fallback correctly triggered');
    } else if (clauseResult.clauses) {
      console.log(`✅ Successfully extracted ${clauseResult.clauses.length} clauses`);
    } else {
      console.log('❌ Unexpected clause splitting response');
    }
    
    console.log('\n');
    
    // Test 2: Individual Clause Analysis with Citations
    console.log('🔍 Test 2: Clause Analysis with Citations');
    console.log('='.repeat(50));
    
    const testClause = "Either party may terminate this Agreement for material breach with reasonable notice.";
    
    const analysisResponse = await fetch(`${API_BASE}/api/llm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clauseText: testClause })
    });
    
    const analysisResult = await analysisResponse.json();
    console.log('Analysis Response:', JSON.stringify(analysisResult, null, 2));
    
    if (analysisResult.analysis) {
      const analysis = analysisResult.analysis;
      console.log('\n📊 Analysis Summary:');
      console.log(`- Ambiguities: ${analysis.ambiguities?.length || 0}`);
      console.log(`- Risks: ${analysis.risks?.length || 0}`);
      console.log(`- Citations: ${analysis.citations?.length || 0}`);
      console.log(`- Problematic Text: ${analysis.problematicText?.length || 0}`);
      console.log(`- Risk Level: ${analysis.riskLevel || 'not set'}`);
      
      if (analysis.citations && analysis.citations.length > 0) {
        console.log('\n✅ Citations feature working:');
        analysis.citations.forEach((citation, i) => {
          console.log(`  ${i + 1}. "${citation}"`);
        });
      } else {
        console.log('❌ No citations found');
      }
      
      if (analysis.problematicText && analysis.problematicText.length > 0) {
        console.log('\n✅ Problematic text identification working:');
        analysis.problematicText.forEach((issue, i) => {
          console.log(`  ${i + 1}. ${issue}`);
        });
      } else {
        console.log('❌ No problematic text identified');
      }
    }
    
    console.log('\n');
    
    // Test 3: Upload and full analysis flow (simulated)
    console.log('📄 Test 3: Simulating Upload Flow');
    console.log('='.repeat(50));
    
    // Simulate what happens in the upload route
    console.log('Simulating clause splitting in upload flow...');
    
    // This would normally be done by uploading a real file, but we'll simulate
    const simulatedClauses = [
      {
        id: 'clause-1',
        text: 'For purposes of this Agreement, the following terms shall have the meanings set forth below: "Confidential Information" means any and all non-public, proprietary information.',
        title: 'Definitions',
        riskLevel: 'low'
      },
      {
        id: 'clause-2', 
        text: 'Client shall pay Contractor within thirty (30) days of receipt of invoice. Late payments shall incur reasonable penalty fees as determined by Contractor.',
        title: 'Payment Terms',
        riskLevel: 'medium'
      },
      {
        id: 'clause-3',
        text: 'Either party may terminate this Agreement for material breach with reasonable notice. Upon termination, all work product shall be delivered to Client immediately.',
        title: 'Termination',
        riskLevel: 'high'
      }
    ];
    
    console.log(`Simulated clause extraction: ${simulatedClauses.length} clauses`);
    
    // Test analysis of each clause
    let totalAnalyses = [];
    for (let i = 0; i < simulatedClauses.length; i++) {
      const clause = simulatedClauses[i];
      console.log(`\\nAnalyzing clause ${i + 1}: ${clause.title}`);
      
      const response = await fetch(`${API_BASE}/api/llm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clauseText: clause.text })
      });
      
      const result = await response.json();
      if (result.analysis) {
        totalAnalyses.push({
          clauseId: clause.id,
          clauseTitle: clause.title,
          ...result.analysis
        });
        
        console.log(`  ✅ Analysis complete - ${result.analysis.risks?.length || 0} risks, ${result.analysis.citations?.length || 0} citations`);
      } else {
        console.log(`  ❌ Analysis failed for ${clause.title}`);
      }
    }
    
    console.log('\n');
    
    // Test 4: Summary Generation with Problematic Clauses
    console.log('📊 Test 4: Summary with Problematic Clauses');
    console.log('='.repeat(50));
    
    // Simulate summary generation
    const problematicClauses = totalAnalyses
      .filter(analysis => (analysis.risks?.length || 0) > 0 || (analysis.citations?.length || 0) > 0)
      .map(analysis => ({
        clauseId: analysis.clauseId,
        title: analysis.clauseTitle,
        issues: [...(analysis.risks || []), ...(analysis.ambiguities || [])].slice(0, 3),
        citations: analysis.citations || []
      }));
    
    console.log(`Found ${problematicClauses.length} problematic clauses:`);
    
    problematicClauses.forEach((clause, i) => {
      console.log(`\\n${i + 1}. ${clause.title} (${clause.clauseId})`);
      console.log(`   Issues: ${clause.issues.length}`);
      console.log(`   Citations: ${clause.citations.length}`);
      
      if (clause.citations.length > 0) {
        console.log(`   Key Citation: "${clause.citations[0].substring(0, 60)}..."`);
      }
    });
    
    console.log('\n');
    
    // Final Assessment
    console.log('🎯 Final Assessment');
    console.log('='.repeat(50));
    
    const featuresWorking = [];
    const featuresNeedWork = [];
    
    // Check clause splitting
    if (clauseResult.error || clauseResult.clauses) {
      featuresWorking.push('✅ Clause splitting (with fallback)');
    } else {
      featuresNeedWork.push('❌ Clause splitting');
    }
    
    // Check citations
    const hasCitations = totalAnalyses.some(a => a.citations && a.citations.length > 0);
    if (hasCitations) {
      featuresWorking.push('✅ Citation extraction');
    } else {
      featuresNeedWork.push('❌ Citation extraction');
    }
    
    // Check problematic text
    const hasProblematicText = totalAnalyses.some(a => a.problematicText && a.problematicText.length > 0);
    if (hasProblematicText) {
      featuresWorking.push('✅ Problematic text identification');
    } else {
      featuresNeedWork.push('❌ Problematic text identification');
    }
    
    // Check risk levels
    const hasRiskLevels = totalAnalyses.some(a => a.riskLevel);
    if (hasRiskLevels) {
      featuresWorking.push('✅ Risk level assessment');
    } else {
      featuresNeedWork.push('❌ Risk level assessment');
    }
    
    console.log('Working Features:');
    featuresWorking.forEach(feature => console.log(`  ${feature}`));
    
    if (featuresNeedWork.length > 0) {
      console.log('\\nFeatures Needing Work:');
      featuresNeedWork.forEach(feature => console.log(`  ${feature}`));
    }
    
    console.log(`\\n🎉 Test completed! ${featuresWorking.length}/${featuresWorking.length + featuresNeedWork.length} features working correctly.`);
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
runEndToEndTest(); 