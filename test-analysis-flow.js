const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testAnalysisFlow() {
  try {
    console.log('🧪 Testing contract analysis flow...\n');
    
    // Step 1: Upload a PDF
    console.log('1️⃣ Uploading PDF...');
    
    const pdfPath = './Contract MockUP.pdf';
    if (!fs.existsSync(pdfPath)) {
      console.log('❌ Contract MockUP.pdf not found, creating a dummy text file instead');
      // Create a test text file with contract content
      const testContent = `
NON-DISCLOSURE AGREEMENT (NDA)

This Non-Disclosure Agreement (the "Agreement") is entered into as of the date below by and between:

Company ABC
Address: 123 Main St, City, State, 12345, USA
("Disclosing Party")

AND

John Doe
Address: 456 Oak Ave, City, State, 67890, USA
("Receiving Party")

1. PURPOSE:
The purpose of this Agreement is to prevent the unauthorized disclosure of proprietary and confidential information related to the project "Project X", which the Receiving Party will have access to as part of their involvement in the project.

2. CONFIDENTIAL INFORMATION:
For the purposes of this Agreement, "Confidential Information" includes, but is not limited to, all information related to Project X, including business plans, marketing strategies, financial data, technical information, creative work, and any other proprietary information, whether written, verbal, or electronic, disclosed by the Disclosing Party.

3. OBLIGATIONS OF THE RECEIVING PARTY:
The Receiving Party agrees to:
• Maintain the confidentiality of all Confidential Information received from the Disclosing Party.
• Not disclose any Confidential Information to any third party without prior written consent from the Disclosing Party.
• Use the Confidential Information solely for the purposes related to Project X.
• Take all reasonable measures to protect the Confidential Information from unauthorized access or disclosure.

4. TERM:
This Agreement shall be effective as of the date hereof and shall remain in effect for a period of two (2) years from the date of disclosure of Confidential Information.

5. REMEDIES:
The Receiving Party acknowledges that any breach of this Agreement may result in irreparable harm to the Disclosing Party and that the Disclosing Party shall be entitled to seek injunctive relief, in addition to any other legal remedies available.
      `;
      
      fs.writeFileSync('test-contract.txt', testContent);
      console.log('Created test-contract.txt for testing');
    }
    
    const formData = new FormData();
    const fileBuffer = fs.existsSync(pdfPath) ? 
      fs.readFileSync(pdfPath) : 
      fs.readFileSync('test-contract.txt');
    
    const fileName = fs.existsSync(pdfPath) ? 'Contract MockUP.pdf' : 'test-contract.txt';
    const mimeType = fs.existsSync(pdfPath) ? 'application/pdf' : 'text/plain';
    
    formData.append('file', fileBuffer, {
      filename: fileName,
      contentType: mimeType
    });
    
    const uploadResponse = await fetch('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
      headers: {
        'Cookie': 'session_id=test-session-123'
      }
    });
    
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.log('❌ Upload failed:', uploadResponse.status, errorText);
      return;
    }
    
    const uploadResult = await uploadResponse.json();
    console.log('✅ Upload successful:', uploadResult);
    
    const documentId = uploadResult.id;
    
    // Step 2: Trigger analysis
    console.log('\n2️⃣ Triggering analysis...');
    
    const analysisResponse = await fetch(`http://localhost:3000/api/contract/${documentId}/analyze`, {
      method: 'GET',
      headers: {
        'Cookie': 'session_id=test-session-123',
        'Accept': 'text/event-stream'
      }
    });
    
    if (!analysisResponse.ok) {
      console.log('❌ Analysis request failed:', analysisResponse.status);
      return;
    }
    
    console.log('✅ Analysis stream started');
    
    // Step 3: Read analysis stream
    console.log('\n3️⃣ Reading analysis results...');
    
    const reader = analysisResponse.body.getReader();
    const decoder = new TextDecoder();
    let analysisResults = [];
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              console.log('📊 Analysis result:', data);
              analysisResults.push(data);
            } catch (e) {
              // Skip parsing errors for non-JSON lines
            }
          }
          if (line.startsWith('event: end')) {
            console.log('🏁 Analysis stream ended');
            break;
          }
        }
      }
    } catch (error) {
      console.log('⚠️ Stream reading error:', error.message);
    }
    
    // Step 4: Check summary
    console.log('\n4️⃣ Fetching summary...');
    
    const summaryResponse = await fetch(`http://localhost:3000/api/contract/${documentId}/summary`, {
      headers: {
        'Cookie': 'session_id=test-session-123'
      }
    });
    
    if (summaryResponse.ok) {
      const summary = await summaryResponse.json();
      console.log('✅ Summary:', summary);
    } else {
      console.log('❌ Summary request failed:', summaryResponse.status);
    }
    
    console.log('\n🎉 Analysis flow test completed!');
    console.log(`📈 Total analysis results received: ${analysisResults.length}`);
    
    // Clean up test file
    if (fs.existsSync('test-contract.txt')) {
      fs.unlinkSync('test-contract.txt');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Install node-fetch if not available
try {
  require('node-fetch');
} catch (e) {
  console.log('Installing node-fetch...');
  require('child_process').execSync('npm install node-fetch form-data', { stdio: 'inherit' });
}

testAnalysisFlow(); 