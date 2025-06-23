import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { updateContract } from '@/lib/db/redis';
import { getSessionId } from '@/lib/utils/session';
import { splitClauses } from '@/lib/utils/splitClauses';
import { splitClausesWithLLM } from '@/lib/utils/splitClausesWithLLM';
import { parseFile } from '@/lib/utils/parseFile';

export const runtime = 'nodejs';        // Force Node.js runtime
export const dynamic = 'force-dynamic';  // Skip static optimization

export async function POST(request: NextRequest): Promise<Response> {
  // Add a top-level try-catch to prevent Lambda crashes
  try {
    // Set a global timeout for the entire function
    const timeoutPromise = new Promise<Response>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Request timed out after 28 seconds'));
      }, 28000); // Lambda timeout is 30s, we use 28s to allow for clean response
    });
    
    // Create a promise for the actual handler
    const handlerPromise = (async (): Promise<Response> => {
      try {
    console.log('Upload Route - Request received');
    
    const sessionId = getSessionId(request);
    console.log('Upload Route - Session ID:', sessionId);
    
    if (!sessionId) {
      console.log('Upload Route - No session ID found');
      return NextResponse.json({ error: 'No session' }, { status: 401 });
    }

    console.log('Upload Route - Processing form data');
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      console.log('Upload Route - No file provided');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log('Upload Route - File received:', file.name, 'Type:', file.type);
    
    // Convert file to buffer for parsing
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Parse the file to extract text properly
    console.log('Upload Route - Parsing file with proper text extraction');
    let text: string;
    try {
      // Wrap the parseFile call in a timeout to prevent hanging
      const parseWithTimeout = async (): Promise<string> => {
        return new Promise<string>((resolve, reject) => {
          // Set a timeout for the parsing operation (25 seconds for Lambda)
          const timeoutId = setTimeout(() => {
            reject(new Error('PDF parsing timed out after 25 seconds'));
          }, 25000);
          
          // Use an immediately invoked async function to handle the parsing
          (async () => {
            try {
              const result = await parseFile(buffer, file.type);
              clearTimeout(timeoutId);
              resolve(result);
            } catch (error) {
              clearTimeout(timeoutId);
              reject(error);
            }
          })();
        });
      };
      
      text = await parseWithTimeout();
      console.log('Upload Route - Successfully extracted text, length:', text.length);
      
      // Basic validation
      if (text.length < 50) {
        throw new Error('Extracted text is too short - file may be corrupted or empty');
      }
    } catch (parseError) {
      console.error('Upload Route - Failed to parse file:', parseError);
      
      if (file.type === 'application/pdf' || file.type.includes('pdf')) {
        // For PDFs, return a proper error with helpful suggestions
        const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
        
        // Return a 400 status with helpful error message
        return NextResponse.json({ 
          error: 'Failed to extract text from PDF',
          details: errorMessage,
          suggestions: [
            'Ensure the PDF is not password-protected',
            'Try converting scanned PDFs to text-based PDFs using OCR',
            'Check if the PDF contains actual text (not just images)',
            'Try a different PDF file format or version',
            'Some PDFs with complex formatting may not be compatible'
          ]
        }, { status: 400 });
      } else {
        // Fallback to raw text for non-PDF files
        try {
          text = await file.text();
          if (text.length < 50) {
            throw new Error('File appears to be empty or too short');
          }
        } catch (fallbackError) {
          return NextResponse.json({ 
            error: 'Failed to extract text from file. The file may be corrupted or in an unsupported format.',
            details: fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
          }, { status: 400 });
        }
      }
    }
    
    const contractId = `doc-${Date.now()}`;
    console.log('Upload Route - Generated contract ID:', contractId);
    
    // Extract clauses from the contract text using enhanced LLM splitting
    console.log('Upload Route - Extracting clauses from contract text');
    let clauses;
    try {
      // Try LLM-based clause splitting first for better accuracy, but handle failures gracefully
      console.log('Upload Route - Attempting enhanced LLM-based clause splitting');
      try {
        // Check if the text is too long for efficient LLM processing
        if (text.length > 50000) {
          console.log('Upload Route - Text too long for LLM processing, using fallback directly');
          throw new Error('Text too long for efficient LLM processing');
        }
        
        clauses = await splitClausesWithLLM(text);
        console.log(`Upload Route - Enhanced LLM extracted ${clauses.length} clauses successfully`);
        
        // Validate LLM results - they should be reasonable in number and length
        if (clauses.length === 0 || (clauses.length === 1 && clauses[0].text.length > text.length * 0.8)) {
          console.warn('Upload Route - LLM results seem insufficient, trying fallback');
          throw new Error('LLM clause splitting returned insufficient results');
        }
      } catch (llmError) {
        console.warn('Upload Route - LLM clause splitting failed, using enhanced fallback method:', llmError);
        // Use the fallback clause splitting method which is more reliable
        clauses = splitClauses(text);
        console.log(`Upload Route - Enhanced fallback method extracted ${clauses.length} clauses`);
      }
      
      // Final validation that we got meaningful clauses
      if (clauses.length === 0) {
        console.warn('Upload Route - No clauses extracted at all');
        return NextResponse.json({ 
          error: 'Could not extract any meaningful content from the document. The file may be corrupted, password-protected, or contain only images.',
          details: `No clauses extracted from ${text.length} characters of text`
        }, { status: 400 });
      }
      
      // Check if we only got one huge clause (likely means splitting failed)
      if (clauses.length === 1 && clauses[0].text.length > text.length * 0.8) {
        console.warn('Upload Route - Only one large clause extracted, may indicate splitting failure');
        // Don't error, but log the issue for monitoring
        console.log('Upload Route - Single clause length:', clauses[0].text.length, 'vs total text:', text.length);
      }
      
    } catch (clauseError) {
      console.error('Upload Route - Clause extraction failed completely:', clauseError);
      return NextResponse.json({ 
        error: 'Failed to parse document content. The file appears to contain corrupted or binary data.',
        details: clauseError instanceof Error ? clauseError.message : String(clauseError)
      }, { status: 400 });
    }
    
    // Create a plain object for Redis storage
    const contract = {
      id: contractId,
      originalFilename: file.name,
      text,
      uploadedAt: new Date().toISOString(),
      status: 'pending',
      clauses, // Now populated with extracted clauses
      analysis: null,
      summary: null
    };

    console.log('Upload Route - Storing contract with ID:', contractId);
    // Store contract in Redis with proper serialization
    const success = await updateContract(sessionId, contractId, JSON.parse(JSON.stringify(contract)));
    if (!success) {
      console.error('Upload Route - Failed to store contract in Redis');
      return NextResponse.json({ error: 'Failed to store contract' }, { status: 500 });
    }
    console.log('Upload Route - Contract stored successfully');

    // Set session cookie if not present
    const res = NextResponse.json({ 
      id: contractId,
      filename: file.name,
      status: 'pending',
      clauseCount: clauses.length
    });
    
    if (!request.headers.get('cookie')?.includes('session_id')) {
      console.log('Upload Route - Setting session cookie');
      res.cookies.set('session_id', sessionId, {
        httpOnly: true,
        secure: false, // Changed to false for development
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 1 week
      });
    }
    
    console.log('Upload Route - Returning success response');
    return res;
      } catch (err: any) {
        console.error('Upload Route - Error in handler:', err);
        return NextResponse.json(
          { error: 'Internal server error', details: err?.message ?? String(err) },
          { status: 500 }
        );
      }
    })();
    
    // Race the handler against the timeout
    return await Promise.race<Response>([handlerPromise, timeoutPromise]);
  } catch (outerError: any) {
    console.error('Upload Route - Fatal error:', outerError);
    return NextResponse.json(
      { 
        error: 'Request processing failed', 
        details: outerError?.message ?? String(outerError),
        suggestion: 'Please try again with a smaller or simpler document'
      },
      { status: 500 }
    );
  }
} 