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
    } catch (parseError) {
      console.error('Upload Route - Failed to parse file:', parseError);
      // Fallback to raw text for non-PDF files
      text = await file.text();
    }
    
    const contractId = `doc-${Date.now()}`;
    console.log('Upload Route - Generated contract ID:', contractId);
    
    // Extract clauses from the contract text
    console.log('Upload Route - Extracting clauses from contract text');
    const clauses = splitClauses(text);
    console.log(`Upload Route - Extracted ${clauses.length} clauses`);
    
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