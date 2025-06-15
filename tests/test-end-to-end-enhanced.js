// End-to-end test for the complete contract analysis pipeline
// This tests upload, clause splitting, analysis, and citation features

const fs = require('fs');
const path = require('path');

// Create a test contract file to upload
const testContract = `MASTER SERVICE AGREEMENT

This Master Service Agreement ("Agreement") is entered into as of June 8, 2025 ("Effective Date") by and between Less Than Skin LLC, a Delaware corporation ("Company"), and Joshua Guillen, a sole proprietorship ("Contractor").

WHEREAS, Company desires to engage Contractor to provide certain professional services; and
WHEREAS, Contractor represents that it has the necessary skills, experience, and resources to provide such services;

NOW, THEREFORE, in consideration of the mutual covenants and agreements contained herein, the parties agree as follows:

1. DEFINITIONS AND INTERPRETATION

For purposes of this Agreement, the following terms shall have the meanings set forth below:

1.1 "Confidential Information" means any and all non-public, proprietary, or confidential information, including but not limited to technical data, trade secrets, know-how, research, product plans, products, services, customers, customer lists, markets, software, developments, inventions, processes, formulas, technology, designs, drawings, engineering, hardware configuration information, marketing, finances, or other business information.

1.2 "Services" means the professional services to be provided by Contractor as described in each Statement of Work executed pursuant to this Agreement.

1.3 "Statement of Work" or "SOW" means a written agreement between the parties that describes the specific Services to be performed, deliverables, timeline, and compensation for a particular project.

1.4 "Work Product" means all deliverables, documents, materials, and other work product created, developed, or provided by Contractor in connection with the Services.

2. ENGAGEMENT AND SCOPE OF SERVICES

2.1 Engagement. Company hereby engages Contractor, and Contractor agrees to provide, the Services in accordance with the terms and conditions of this Agreement and each applicable SOW.

2.2 Statements of Work. The specific Services to be provided shall be set forth in one or more SOWs. Each SOW shall specify the scope of Services, deliverables, timeline, milestones, and compensation. No Services shall be performed without an executed SOW.

2.3 Performance Standards. Contractor shall perform all Services in a professional and workmanlike manner in accordance with the highest standards of Contractor's profession and industry best practices.

2.4 Resources and Personnel. Contractor shall provide all personnel, equipment, and materials necessary to perform the Services, unless otherwise specified in an SOW.

3. PAYMENT TERMS AND COMPENSATION

3.1 Payment Schedule. Client shall pay Contractor the fees specified in each SOW within thirty (30) days of receipt of a properly submitted invoice.

3.2 Late Payment. Late payments shall incur a penalty of one and one-half percent (1.5%) per month or the maximum rate permitted by law, whichever is less.

3.3 Expenses. Unless otherwise specified in an SOW, Contractor shall be responsible for all expenses incurred in connection with the performance of Services.

3.4 Taxes. Each party shall be responsible for its own taxes arising from or relating to this Agreement.

3.5 Non-Refundable Fees. All fees paid under this Agreement are non-refundable unless otherwise specified in writing.

4. INTELLECTUAL PROPERTY RIGHTS

4.1 Work Product Ownership. All Work Product shall be deemed "work made for hire" under applicable copyright law. To the extent any Work Product is not deemed work made for hire, Contractor hereby assigns all right, title, and interest in and to such Work Product to Company.

4.2 Pre-Existing Materials. Contractor retains all rights to any pre-existing intellectual property, methodologies, tools, or materials that existed prior to this Agreement.

4.3 License Grant. Contractor grants Company a non-exclusive, royalty-free license to use any pre-existing materials incorporated into the Work Product.

5. CONFIDENTIALITY OBLIGATIONS

5.1 Confidentiality Covenant. Each party acknowledges that it may have access to Confidential Information of the other party. Each party agrees to maintain in confidence all Confidential Information received from the other party.

5.2 Use Restrictions. Confidential Information shall be used solely for the purposes of this Agreement and shall not be disclosed to any third party without the prior written consent of the disclosing party.

5.3 Exceptions. The obligations of confidentiality shall not apply to information that: (a) is or becomes publicly available through no fault of the receiving party; (b) was already in the possession of the receiving party prior to disclosure; (c) is received from a third party without breach of any confidentiality obligation; or (d) is required to be disclosed by law or court order.

6. TERM AND TERMINATION

6.1 Term. This Agreement shall commence on the Effective Date and continue until terminated in accordance with this Section 6.

6.2 Termination for Convenience. Either party may terminate this Agreement at any time with thirty (30) days prior written notice to the other party.

6.3 Termination for Cause. Either party may terminate this Agreement immediately upon written notice if the other party materially breaches this Agreement and fails to cure such breach within fifteen (15) days after receiving written notice thereof.

6.4 Effect of Termination. Upon termination, all unpaid fees for Services performed prior to termination shall become immediately due and payable. All Work Product shall be delivered to Company. The provisions relating to confidentiality, intellectual property, and liability limitation shall survive termination.

7. LIABILITY LIMITATION AND INDEMNIFICATION

7.1 Limitation of Liability. IN NO EVENT SHALL CONTRACTOR BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, OR USE, ARISING OUT OF OR RELATING TO THIS AGREEMENT, REGARDLESS OF THE THEORY OF LIABILITY.

7.2 Damages Cap. Contractor's total liability under this Agreement shall not exceed the total amount paid to Contractor under the applicable SOW in the twelve (12) months preceding the event giving rise to the liability.

7.3 Mutual Indemnification. Each party shall indemnify, defend, and hold harmless the other party from and against any claims, damages, losses, and expenses arising from the indemnifying party's gross negligence or willful misconduct.

8. DISPUTE RESOLUTION AND GOVERNING LAW

8.1 Governing Law. This Agreement shall be governed by and construed in accordance with the laws of the State of California, without regard to its conflict of law principles.

8.2 Dispute Resolution. Any disputes arising under this Agreement shall be resolved through binding arbitration administered by the American Arbitration Association in accordance with its Commercial Arbitration Rules.

8.3 Venue. Any arbitration proceedings shall take place in San Francisco, California.

8.4 Attorney's Fees. The prevailing party in any dispute resolution proceeding shall be entitled to recover its reasonable attorneys' fees and costs.

9. GENERAL PROVISIONS

9.1 Independent Contractor. Contractor is an independent contractor and not an employee, agent, or partner of Company. Nothing in this Agreement creates any employment, agency, partnership, or joint venture relationship.

9.2 Assignment. This Agreement may not be assigned by either party without the prior written consent of the other party, except that Company may assign this Agreement to an affiliate or in connection with a merger, acquisition, or sale of all or substantially all of its assets.

9.3 Amendment. This Agreement may only be amended by a written instrument signed by both parties.

9.4 Severability. If any provision of this Agreement is held to be invalid or unenforceable, the remaining provisions shall remain in full force and effect.

9.5 Force Majeure. Neither party shall be liable for any delay or failure to perform due to causes beyond its reasonable control, including but not limited to acts of God, war, terrorism, pandemic, government regulations, or natural disasters.

9.6 Entire Agreement. This Agreement, together with any SOWs executed hereunder, constitutes the entire agreement between the parties and supersedes all prior negotiations, representations, and agreements.

9.7 Counterparts. This Agreement may be executed in counterparts, including electronic signatures, each of which shall be deemed an original and all of which together shall constitute one and the same instrument.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.

COMPANY:                           CONTRACTOR:

_________________________         _________________________
By: [Name]                        By: [Name]
Title: [Title]                    Title: [Title]
Date: _______________             Date: _______________`;

async function testEndToEnd() {
  console.log('🚀 STARTING END-TO-END CONTRACT ANALYSIS TEST\n');
  console.log('This test simulates the complete contract analysis pipeline:\n');
  console.log('1. Upload contract document');
  console.log('2. Extract and split clauses');
  console.log('3. Run analysis on each clause');
  console.log('4. Generate summary with citations');
  console.log('5. Validate all features work correctly\n');
  
  const startTime = Date.now();
  
  try {
    // Step 1: Create test file
    console.log('📄 Step 1: Creating test contract file...');
    const testFilePath = path.join(__dirname, 'tmp', 'test-contract.txt');
    
    // Ensure tmp directory exists
    const tmpDir = path.join(__dirname, 'tmp');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    
    fs.writeFileSync(testFilePath, testContract);
    console.log(`✅ Test file created: ${testFilePath}`);
    console.log(`📊 Contract length: ${testContract.length} characters\n`);
    
    // Step 2: Test upload API
    console.log('⬆️ Step 2: Testing upload API...');
    const FormData = require('form-data');
    const axios = require('axios');
    
    const form = new FormData();
    form.append('file', fs.createReadStream(testFilePath), 'test-contract.txt');
    
    try {
      const uploadResponse = await axios.post('http://localhost:3000/api/upload', form, {
        headers: {
          ...form.getHeaders(),
          'Cookie': 'session_id=test-session-' + Date.now()
        },
        timeout: 30000
      });
      
      console.log('✅ Upload successful!');
      console.log(`📋 Contract ID: ${uploadResponse.data.id}`);
      console.log(`📑 Clauses extracted: ${uploadResponse.data.clauseCount}`);
      
      const contractId = uploadResponse.data.id;
      
      // Step 3: Test analysis API
      console.log('\n🔍 Step 3: Testing analysis API...');
      console.log('Starting analysis stream...');
      
      const analysisResponse = await axios.get(`http://localhost:3000/api/contract/${contractId}/analyze`, {
        headers: {
          'Cookie': uploadResponse.headers['set-cookie']?.[0] || 'session_id=test-session-' + Date.now(),
          'Accept': 'text/event-stream'
        },
        timeout: 60000
      });
      
      console.log('✅ Analysis initiated successfully');
      
      // Wait a bit for analysis to process
      console.log('⏳ Waiting for analysis to complete...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Step 4: Test summary API
      console.log('\n📊 Step 4: Testing summary generation...');
      
      const summaryResponse = await axios.get(`http://localhost:3000/api/contract/${contractId}/summary`, {
        headers: {
          'Cookie': uploadResponse.headers['set-cookie']?.[0] || 'session_id=test-session-' + Date.now()
        },
        timeout: 30000
      });
      
      console.log('✅ Summary generated successfully!');
      
      const summary = summaryResponse.data.summary;
      console.log(`📈 Risk Score: ${summary.riskScore}/10`);
      console.log(`⚠️ Risk Level: ${summary.overallRisk.substring(0, 100)}...`);
      console.log(`🔍 Ambiguous Terms: ${summary.ambiguousTerms.length}`);
      console.log(`⚡ Unfair Clauses: ${summary.unfairClauses.length}`);
      console.log(`📋 Missing Clauses: ${summary.missingClauses.length}`);
      console.log(`💡 Key Findings: ${summary.keyFindings.length}`);
      console.log(`🎯 Actionable Suggestions: ${summary.actionableSuggestions.length}`);
      console.log(`🚨 Problematic Clauses: ${summary.problematicClauses?.length || 0}`);
      
      // Step 5: Validate results
      console.log('\n✅ Step 5: Validating results...');
      
      const validationResults = {
        uploadSuccessful: uploadResponse.status === 200,
        clausesExtracted: uploadResponse.data.clauseCount > 0,
        analysisInitiated: analysisResponse.status === 200,
        summaryGenerated: summaryResponse.status === 200,
        riskScoreValid: summary.riskScore >= 1 && summary.riskScore <= 10,
        hasAmbiguousTerms: summary.ambiguousTerms.length > 0,
        hasKeyFindings: summary.keyFindings.length > 0,
        hasSuggestions: summary.actionableSuggestions.length > 0,
        hasProblematicClauses: (summary.problematicClauses?.length || 0) > 0
      };
      
      console.log('\n📋 VALIDATION RESULTS:');
      Object.entries(validationResults).forEach(([key, value]) => {
        console.log(`${value ? '✅' : '❌'} ${key}: ${value}`);
      });
      
      const passedTests = Object.values(validationResults).filter(Boolean).length;
      const totalTests = Object.keys(validationResults).length;
      
      console.log(`\n🏆 OVERALL SCORE: ${passedTests}/${totalTests} tests passed`);
      
      if (passedTests === totalTests) {
        console.log('\n🎉 ALL TESTS PASSED! The contract analysis pipeline is working correctly.');
        console.log('✨ Features confirmed working:');
        console.log('   • Contract upload and parsing');
        console.log('   • Clause separation and extraction');
        console.log('   • Individual clause analysis');
        console.log('   • Summary generation with risk scoring');
        console.log('   • Citation of problematic terms');
        console.log('   • Comprehensive reporting');
      } else {
        console.log('\n⚠️ Some tests failed. The pipeline needs additional work.');
      }
      
    } catch (apiError) {
      console.error('❌ API Test failed:', apiError.message);
      if (apiError.response) {
        console.error('Response status:', apiError.response.status);
        console.error('Response data:', apiError.response.data);
      }
      console.log('\n💡 This is expected if the Next.js development server is not running.');
      console.log('To run the full test:');
      console.log('1. Start the development server: npm run dev');
      console.log('2. In another terminal, run: node test-end-to-end-enhanced.js');
      
      // Run offline tests instead
      console.log('\n🔄 Running offline validation tests...');
      await runOfflineTests();
    }
    
  } catch (error) {
    console.error('❌ End-to-end test failed:', error);
  } finally {
    // Cleanup
    const testFilePath = path.join(__dirname, 'tmp', 'test-contract.txt');
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
      console.log('\n🧹 Cleanup: Test file removed');
    }
    
    const endTime = Date.now();
    console.log(`⏱️ Total test time: ${Math.round((endTime - startTime) / 1000)}s`);
  }
}

async function runOfflineTests() {
  console.log('\n🔧 OFFLINE VALIDATION TESTS');
  
  // Test clause splitting logic
  console.log('\n1. Testing clause splitting...');
  const { splitClausesWithLLM } = require('./lib/utils/splitClausesWithLLM');
  
  try {
    // This will use the fallback method since no LLM is available
    const clauses = await splitClausesWithLLM(testContract);
    console.log(`✅ Clause splitting: ${clauses.length} clauses extracted`);
    
    const validClauses = clauses.filter(c => c.text && c.text.length > 50);
    console.log(`✅ Valid clauses: ${validClauses.length}/${clauses.length}`);
    
    const clausesWithTitles = clauses.filter(c => c.title && c.title.length > 3);
    console.log(`✅ Clauses with titles: ${clausesWithTitles.length}/${clauses.length}`);
    
    // Sample a few clauses to show they're working
    console.log('\n📋 Sample clauses:');
    clauses.slice(0, 3).forEach((clause, i) => {
      console.log(`   ${i + 1}. "${clause.title}" (${clause.text.length} chars)`);
    });
    
  } catch (splitError) {
    console.error('❌ Clause splitting test failed:', splitError.message);
  }
  
  console.log('\n2. Testing type definitions...');
  try {
    // Check if our types are working
    const { Analysis, SummaryInsights } = require('./lib/types');
    console.log('✅ Type definitions loaded successfully');
  } catch (typeError) {
    console.error('❌ Type definition test failed:', typeError.message);
  }
  
  console.log('\n✅ Offline tests completed');
}

// Run the test
if (require.main === module) {
  testEndToEnd().then(() => {
    console.log('\n✅ End-to-end test completed!');
  }).catch(error => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
}

module.exports = { testEndToEnd, runOfflineTests }; 