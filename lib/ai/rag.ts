import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';

const PINECONE_API_KEY = process.env.PINECONE_API_KEY || '';
const PINECONE_ENVIRONMENT = process.env.PINECONE_ENVIRONMENT || '';
const PINECONE_INDEX = process.env.PINECONE_INDEX || 'legal-knowledge';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

const pinecone = new Pinecone({ apiKey: PINECONE_API_KEY });
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

/**
 * Generate an embedding for a clause using OpenAI
 */
export async function embedClause(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: text,
  });
  return response.data[0].embedding;
}

/**
 * Query Pinecone for the top N most relevant legal documents
 */
export async function queryPineconeRag(query: string, topK = 5): Promise<string[]> {
  const embedding = await embedClause(query);
  const index = pinecone.index(PINECONE_INDEX);
  const results = await index.query({
    vector: embedding,
    topK,
    includeMetadata: true,
  });
  // Assume each match has metadata.text (the legal passage)
  return results.matches?.map((m: any) => m.metadata?.text).filter(Boolean) || [];
}

/**
 * Format retrieved context for prompt injection
 */
export function formatRagContext(passages: string[]): string {
  if (!passages.length) return '';
  return passages.map((p, i) => `Context ${i + 1}:\n${p}`).join('\n\n');
}

// TODO: Populate your Pinecone index with legal knowledge (law review articles, statutes, model contracts, etc.)
// See Pinecone docs for ingestion scripts and best practices. 