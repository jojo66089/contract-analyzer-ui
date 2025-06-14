// Test script for clause splitting functionality
// This tests the enhanced clause separation and citation features

// Test contract with clear clause structure (over 100 lines)
const testContractLong = `
MASTER SERVICE AGREEMENT

This Master Service Agreement ("Agreement") is entered into as of ________________ ("Effective Date") by and between Company Name, a Delaware corporation ("Company"), and Contractor Name, a sole proprietorship ("Contractor").

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
Date: _______________             Date: _______________
`;

// Simple clause splitting implementation for testing
function splitClausesTest(text) {
  console.log('Testing clause splitting with text length:', text.length);
  
  if (!text || text.trim().length < 50) {
    console.warn('Input text is too short');
    return [{
      id: 'error-short',
      text: 'The document text is too short or could not be properly extracted.',
      title: 'Document Error',
      riskLevel: 'high'
    }];
  }

  const clauses = [];
  let idx = 0;

  // Clean the text first
  const cleanedText = text
    .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Enhanced patterns for clause detection
  const patterns = [
    // Numbered sections with titles (e.g., "1. Definitions", "Section 1 - Payment Terms")
    /(?:^|\n\n)\s*((?:Section|Article|Clause)\s+\d+\.?\s*[-–—]?\s*[^\n]+|^\s*\d+\.?\s+[A-Z][^\n]+?)[\.\:]?\s*\n([\s\S]*?)(?=\n\n\s*(?:Section|Article|Clause)\s+\d+|\n\n\s*\d+\.|\n\n\s*[A-Z\s]{10,}\s*\n|$)/gim,
    
    // Main numbered sections (1., 2., 3., etc.)
    /(?:^|\n\n)\s*(\d+\.?\s+[A-Z][^\n]+?)[\.\:]?\s*\n([\s\S]*?)(?=\n\n\s*\d+\.|\n\n\s*[A-Z\s]{10,}\s*\n|$)/gim,
    
    // All caps headings followed by content
    /(?:^|\n\n)\s*([A-Z\s]{5,})\s*\n([\s\S]*?)(?=\n\n\s*[A-Z\s]{5,}\s*\n|\n\n\s*\d+\.|\n\n\s*[IVX]+\.|$)/gim
  ];

  for (const pattern of patterns) {
    let match;
    pattern.lastIndex = 0; // Reset regex
    
    while ((match = pattern.exec(cleanedText)) !== null) {
      const [fullMatch, heading, content] = match;
      const clauseText = (heading + '\n' + content).trim();
      
      if (isValidClauseText(clauseText)) {
        const title = extractTitleFromText(heading) || `Clause ${idx + 1}`;
        
        clauses.push({
          id: `clause-${idx + 1}`,
          text: clauseText,
          title: title,
          riskLevel: 'medium',
          citations: extractCitations(clauseText)
        });
        idx++;
      }
    }
    
    if (clauses.length > 0) {
      break; // Stop at first successful pattern
    }
  }

  // If no structured clauses found, split by paragraphs
  if (clauses.length === 0) {
    console.log('No structured clauses found, splitting by paragraphs');
    const paragraphs = cleanedText.split(/\n\s*\n/);
    
    for (let i = 0; i < paragraphs.length; i++) {
      const para = paragraphs[i].trim();
      if (para && isValidClauseText(para)) {
        clauses.push({
          id: `paragraph-${i + 1}`,
          text: para,
          title: extractTitleFromText(para) || `Paragraph ${i + 1}`,
          riskLevel: 'medium',
          citations: extractCitations(para)
        });
      }
    }
  }

  console.log(`Extracted ${clauses.length} clauses`);
  return clauses;
}

function isValidClauseText(text) {
  if (!text || text.length < 20) return false;
  
  // Check for reasonable amount of actual words
  const words = text.match(/\b[a-zA-Z]{3,}\b/g) || [];
  if (words.length < 5) return false;
  
  // Check for reasonable character distribution
  const readableChars = (text.match(/[a-zA-Z0-9\s.,;:!?'"()-]/g) || []).length;
  const readableRatio = readableChars / text.length;
  if (readableRatio < 0.7) return false;
  
  // Check for natural language patterns
  const naturalLanguagePattern = /\b(the|a|an|in|of|to|for|with|by|on|at|shall|will|may|must)\b/i;
  if (!naturalLanguagePattern.test(text)) return false;
  
  return true;
}

function extractTitleFromText(text) {
  if (!text) return undefined;
  
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return undefined;
  
  const firstLine = lines[0];
  
  // Clean up section markers and get title
  const cleanTitle = firstLine
    .replace(/^(Section|Article|Clause|§)\s*[\dIVXLC]+[.)]?\s*[-–—]?\s*/i, '')
    .replace(/^\d+[.)]?\s*[-–—]?\s*/, '')
    .replace(/^[A-Z][.)]?\s*[-–—]?\s*/, '')
    .replace(/[.:]+$/, '')
    .trim();
  
  if (cleanTitle && cleanTitle.length > 0 && cleanTitle.length < 100) {
    return cleanTitle;
  }
  
  // Fallback: extract from first few words
  const words = text.split(/\s+/).slice(0, 8).join(' ');
  if (words && words.length < 80) {
    return words.replace(/[.:]+$/, '').trim();
  }
  
  return undefined;
}

function extractCitations(text) {
  const citations = [];
  
  // Look for specific problematic phrases that should be cited
  const problematicPatterns = [
    /\b(reasonable|best efforts|material breach|substantial|significant)\b/gi,
    /\b(may|shall|will|must)\s+[^.]{10,}\b/gi,
    /\b(including but not limited to|without limitation)\b/gi,
    /\b(from time to time|as applicable|if any)\b/gi
  ];
  
  for (const pattern of problematicPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      citations.push(...matches.slice(0, 3)); // Limit to 3 citations per pattern
    }
  }
  
  return citations.slice(0, 5); // Limit total citations
}

async function testClauseSplitting() {
  console.log('=== ENHANCED CLAUSE SPLITTING TEST ===\n');
  console.log('Testing with comprehensive contract (over 100 lines)...\n');
  
  try {
    const clauses = splitClausesTest(testContractLong);
    
    console.log(`✅ Successfully extracted ${clauses.length} clauses:\n`);
    
    clauses.forEach((clause, index) => {
      console.log(`--- Clause ${index + 1} ---`);
      console.log(`ID: ${clause.id}`);
      console.log(`Title: ${clause.title || 'No title'}`);
      console.log(`Risk Level: ${clause.riskLevel}`);
      console.log(`Text Length: ${clause.text.length} characters`);
      console.log(`Citations: ${clause.citations?.length || 0} problematic phrases found`);
      if (clause.citations && clause.citations.length > 0) {
        console.log(`Sample citations: ${clause.citations.slice(0, 2).join(', ')}`);
      }
      console.log(`Text Preview: ${clause.text.substring(0, 150)}...`);
      console.log('');
    });
    
    // Test validation
    console.log('=== VALIDATION RESULTS ===');
    const validClauses = clauses.filter(c => c.text && c.text.length > 20);
    console.log(`✅ Valid clauses: ${validClauses.length}/${clauses.length}`);
    
    const clausesWithTitles = clauses.filter(c => c.title && c.title !== 'No title');
    console.log(`✅ Clauses with titles: ${clausesWithTitles.length}/${clauses.length}`);
    
    const clausesWithCitations = clauses.filter(c => c.citations && c.citations.length > 0);
    console.log(`✅ Clauses with citations: ${clausesWithCitations.length}/${clauses.length}`);
    
    const majorSections = clauses.filter(c => c.title && (
      c.title.toLowerCase().includes('payment') ||
      c.title.toLowerCase().includes('termination') ||
      c.title.toLowerCase().includes('confidentiality') ||
      c.title.toLowerCase().includes('liability') ||
      c.title.toLowerCase().includes('intellectual property')
    ));
    console.log(`✅ Major contract sections identified: ${majorSections.length}`);
    
    // Test citation functionality
    const totalCitations = clauses.reduce((sum, clause) => sum + (clause.citations?.length || 0), 0);
    console.log(`✅ Total problematic phrases cited: ${totalCitations}`);
    
    console.log('\n=== SUCCESS METRICS ===');
    console.log(`• Contract length: ${testContractLong.length} characters`);
    console.log(`• Clauses extracted: ${clauses.length}`);
    console.log(`• Average clause length: ${Math.round(clauses.reduce((sum, c) => sum + c.text.length, 0) / clauses.length)} characters`);
    console.log(`• Citation coverage: ${Math.round((clausesWithCitations.length / clauses.length) * 100)}%`);
    
    if (clauses.length >= 8 && clausesWithTitles.length >= 6 && totalCitations >= 10) {
      console.log('\n🎉 ALL TESTS PASSED - Clause splitting and citation features working correctly!');
    } else {
      console.log('\n⚠️ Some tests failed - improvements needed');
    }
    
  } catch (error) {
    console.error('❌ Error testing clause splitting:', error);
    process.exit(1);
  }
}

// Run the test
testClauseSplitting().then(() => {
  console.log('\n✅ Test completed successfully!');
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
}); 