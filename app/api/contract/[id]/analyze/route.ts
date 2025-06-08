import { NextRequest, NextResponse } from 'next/server';
import { getContract, storeClauseAnalysis, updateContract } from '@/lib/db/redis';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';
import { queryPineconeRag, formatRagContext } from '@/lib/ai/rag';
import { getSessionId } from '@/lib/utils/session';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// --- World-Class System Prompt ---
const SYSTEM_PROMPT = `You are a world-class legal expert analyzing contract clauses. For each clause:
- Identify ambiguities and vague terms
- Spot potential risks and liabilities
- Detect missing standard protections
- Provide actionable recommendations
- Cite relevant legal standards when possible

Focus on clarity and practical insights. Output JSON:
{
  "ambiguities": [ "..." ],
  "risks": [ "..." ],
  "recommendations": [ "..." ],
  "missingElements": [ "..." ],
  "references": [ "..." ]
}`;

async function analyzeClause(clauseText: string) {
  // Skip RAG for speed in development - can be re-enabled for production
  // const ragPassages = await queryPineconeRag(clauseText, 5);
  // const ragContext = formatRagContext(ragPassages);
  
  const userPrompt = `Clause:\n"""\n${clauseText}\n"""\nAnalyze this clause as described.`;
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo', // Faster model for initial analysis
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.2,
    max_tokens: 600, // Reduced for speed
  });
  // Try to parse JSON from the response
  const content = response.choices[0].message?.content || '';
  try {
    return JSON.parse(content);
  } catch {
    // Fallback: return as string
    return { raw: content };
  }
}

// --- SSE Streaming Handler ---
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessionId = req.headers.get('cookie')?.match(/session_id=([^;]+)/)?.[1];
  if (!sessionId) {
    return new Response('No session', { status: 401 });
  }
  const { id: contractId } = await params;
  const contract = await getContract(sessionId, contractId);
  if (!contract) {
    return new Response('Contract not found', { status: 404 });
  }
  const clauses = contract.clauses;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Process clauses in parallel batches for speed
      const batchSize = 3; // Process 3 clauses at a time
      
      for (let i = 0; i < clauses.length; i += batchSize) {
        const batch = clauses.slice(i, i + batchSize);
        const promises = batch.map(async (clause) => {
          try {
            const analysis = await analyzeClause(clause.text);
            await storeClauseAnalysis(sessionId, contractId, clause.id, analysis);
            return { clauseId: clause.id, analysis };
          } catch (err) {
            return { clauseId: clause.id, error: String(err) };
          }
        });
        
        // Wait for batch to complete
        const results = await Promise.all(promises);
        
        // Send results
        for (const result of results) {
          const event = `data: ${JSON.stringify(result)}\n\n`;
          controller.enqueue(encoder.encode(event));
        }
      }
      
      // Signal end of stream
      controller.enqueue(encoder.encode('event: end\ndata: done\n\n'));
      controller.close();
    },
  });
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
} 