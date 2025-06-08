import { NextRequest, NextResponse } from 'next/server';
import { getContract, getClauseAnalysis } from '@/lib/db/redis';
import { translateAnalysis, SupportedLang } from '@/lib/ai/translate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sessionId = req.headers.get('cookie')?.match(/session_id=([^;]+)/)?.[1];
    if (!sessionId) {
      return NextResponse.json({ error: 'No session' }, { status: 401 });
    }
    const { id: contractId } = await params;
    const contract = await getContract(sessionId, contractId);
    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }
    const { targetLang, clauseId } = await req.json();
    if (!['en', 'es', 'pt', 'zh'].includes(targetLang)) {
      return NextResponse.json({ error: 'Unsupported language' }, { status: 400 });
    }
    
    let analysesToTranslate = [];
    
    if (clauseId) {
      // Find analysis for a single clause
      const analysis = await getClauseAnalysis(sessionId, contractId, clauseId);
      if (!analysis) {
        return NextResponse.json({ error: 'Analysis not found for clause' }, { status: 404 });
      }
      analysesToTranslate = [analysis];
    } else {
      // Get all clause analyses
      for (const clause of contract.clauses) {
        const analysis = await getClauseAnalysis(sessionId, contractId, clause.id);
        if (analysis) {
          analysesToTranslate.push(analysis);
        }
      }
    }
    
    if (analysesToTranslate.length === 0) {
      return NextResponse.json({ error: 'No analyses found to translate' }, { status: 404 });
    }
    
    console.log('Translating analyses to', targetLang);
    const translated = await translateAnalysis(analysesToTranslate, targetLang as SupportedLang);
    return NextResponse.json({ translated });
  } catch (err: any) {
    console.error('Translation error:', err);
    return NextResponse.json(
      { error: 'Internal server error', details: err?.message ?? String(err) },
      { status: 500 }
    );
  }
} 