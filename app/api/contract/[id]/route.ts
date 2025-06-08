import { NextRequest, NextResponse } from 'next/server';
import { getContract } from '@/lib/db/redis';
import { getSessionId } from '@/lib/utils/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('API Route - Request received');
    
    const sessionId = getSessionId(request);
    console.log('API Route - Session ID:', sessionId);
    
    if (!sessionId) {
      console.log('API Route - No session ID found');
      return NextResponse.json({ error: 'No session' }, { status: 401 });
    }

    // Await params for Next.js 13+
    const { id: contractId } = await params;
    console.log('API Route - Contract ID:', contractId);
    
    if (!contractId) {
      console.log('API Route - Invalid contract ID');
      return NextResponse.json({ error: 'Invalid contract ID' }, { status: 400 });
    }

    console.log('API Route - Fetching contract with ID:', contractId, 'for session:', sessionId);
    const contract = await getContract(sessionId, contractId);
    console.log('API Route - Contract found:', contract ? 'yes' : 'no');

    if (!contract) {
      console.log('API Route - Contract not found');
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    // Set session cookie if not present
    const res = NextResponse.json(contract);
    if (!request.headers.get('cookie')?.includes('session_id')) {
      console.log('API Route - Setting session cookie');
      res.cookies.set('session_id', sessionId, {
        httpOnly: true,
        secure: false, // Changed to false for development
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 1 week
      });
    }
    
    console.log('API Route - Returning contract data');
    return res;
  } catch (err: any) {
    console.error('API Route - Contract fetch error:', err);
    return NextResponse.json(
      { error: 'Internal server error', details: err?.message ?? String(err) },
      { status: 500 }
    );
  }
} 