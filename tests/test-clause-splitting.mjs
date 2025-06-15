import { splitClausesWithLLM } from './lib/utils/splitClausesWithLLM.ts';

// Test contract text with clear clause structure
const testContract = `
MASTER SERVICE AGREEMENT

1. DEFINITIONS
For purposes of this Agreement, the following terms shall have the meanings set forth below:
"Confidential Information" means any and all non-public information.
"Services" means the services described in each Statement of Work.

2. PAYMENT TERMS
Client shall pay Contractor within thirty (30) days of receipt of invoice.
Late payments shall incur a penalty of 1.5% per month.
All fees are non-refundable unless otherwise specified.

3. TERMINATION
Either party may terminate this Agreement with thirty (30) days written notice.
Upon termination, all work product shall be delivered to Client.
Confidentiality obligations shall survive termination.

4. LIABILITY LIMITATION
IN NO EVENT SHALL CONTRACTOR BE LIABLE FOR CONSEQUENTIAL DAMAGES.
Total liability shall not exceed the amount paid under this Agreement.
These limitations apply to the maximum extent permitted by law.

5. GOVERNING LAW
This Agreement shall be governed by the laws of California.
Any disputes shall be resolved through binding arbitration.
The prevailing party shall be entitled to reasonable attorneys' fees.
`;

async function testClauseSplitting() {
  console.log('Testing clause splitting functionality...\n');
  
  try {
    const clauses = await splitClausesWithLLM(testContract);
    
    console.log(`Successfully extracted ${clauses.length} clauses:\n`);
    
    clauses.forEach((clause, index) => {
      console.log(`--- Clause ${index + 1} ---`);
      console.log(`ID: ${clause.id}`);
      console.log(`Title: ${clause.title || 'No title'}`);
      console.log(`Risk Level: ${clause.riskLevel}`);
      console.log(`Text Length: ${clause.text.length} characters`);
      console.log(`Text Preview: ${clause.text.substring(0, 100)}...`);
      console.log('');
    });
    
    // Test validation
    console.log('=== VALIDATION RESULTS ===');
    const validClauses = clauses.filter(c => c.text && c.text.length > 20);
    console.log(`Valid clauses: ${validClauses.length}/${clauses.length}`);
    
    const clausesWithTitles = clauses.filter(c => c.title && c.title !== 'No title');
    console.log(`Clauses with titles: ${clausesWithTitles.length}/${clauses.length}`);
    
    console.log('\n✅ Clause splitting test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing clause splitting:', error);
  }
}

testClauseSplitting(); 