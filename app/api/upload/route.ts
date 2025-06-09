import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { updateContract } from '@/lib/db/redis';
import { getSessionId } from '@/lib/utils/session';
import { splitClauses } from '@/lib/utils/splitClauses';
import { parseFile } from '@/lib/utils/parseFile';

export const runtime = 'nodejs';        // Force Node.js runtime
export const dynamic = 'force-dynamic';  // Skip static optimization

export async function POST(request: NextRequest) {
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
      text = await parseFile(buffer, file.type);
      console.log('Upload Route - Successfully extracted text, length:', text.length);
      
      // Basic validation
      if (text.length < 50) {
        throw new Error('Extracted text is too short - file may be corrupted or empty');
      }
    } catch (parseError) {
      console.error('Upload Route - Failed to parse file:', parseError);
      
      if (file.type === 'application/pdf') {
        // For PDFs, return a proper error instead of trying to proceed
        return NextResponse.json({ 
          error: 'Failed to extract text from PDF. The file may be password-protected, corrupted, or contain only images. Please try a different PDF or contact support.',
          details: parseError instanceof Error ? parseError.message : String(parseError)
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
    
    // Extract clauses from the contract text
    console.log('Upload Route - Extracting clauses from contract text');
    let clauses;
    try {
      clauses = splitClauses(text);
      console.log(`Upload Route - Extracted ${clauses.length} clauses`);
      
      // Validate that we got meaningful clauses
      if (clauses.length === 0 || (clauses.length === 1 && clauses[0].text.length < 100)) {
        console.warn('Upload Route - Insufficient clauses extracted, text may be corrupted');
        return NextResponse.json({ 
          error: 'Could not extract meaningful content from the document. The file may be corrupted, password-protected, or contain only images.',
          details: `Extracted ${clauses.length} clauses with ${text.length} total characters`
        }, { status: 400 });
      }
    } catch (clauseError) {
      console.error('Upload Route - Clause extraction failed:', clauseError);
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
    console.error('Upload Route - Error:', err);
    return NextResponse.json(
      { error: 'Internal server error', details: err?.message ?? String(err) },
      { status: 500 }
    );
  }
} 