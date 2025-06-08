import { Redis } from '@upstash/redis';
import { Contract } from '../types/contract';

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  throw new Error('Missing Redis configuration. Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables.');
}

console.log('Redis - Initializing with URL:', process.env.UPSTASH_REDIS_REST_URL);

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export async function getContract(sessionId: string, contractId: string) {
  try {
    const key = `contract:${sessionId}:${contractId}`;
    console.log('Redis - Fetching contract with key:', key);
    const contract = await redis.get(key);
    console.log('Redis - Contract found:', contract ? 'yes' : 'no');
    if (contract) {
      console.log('Redis - Contract data:', JSON.stringify(contract, null, 2));
    }
    return contract;
  } catch (err) {
    console.error('Redis - getContract error:', err);
    return null;
  }
}

export async function updateContract(sessionId: string, contractId: string, contract: any) {
  try {
    const key = `contract:${sessionId}:${contractId}`;
    console.log('Redis - Storing contract with key:', key);
    console.log('Redis - Contract data:', JSON.stringify(contract, null, 2));
    
    // Ensure we're storing a plain object
    const plainContract = JSON.parse(JSON.stringify(contract));
    await redis.set(key, plainContract);
    
    // Verify the contract was stored
    const storedContract = await redis.get(key);
    console.log('Redis - Contract stored successfully:', storedContract ? 'yes' : 'no');
    if (storedContract) {
      console.log('Redis - Stored contract data:', JSON.stringify(storedContract, null, 2));
    }
    
    return !!storedContract;
  } catch (err) {
    console.error('Redis - updateContract error:', err);
    return false;
  }
}

export async function storeClauseAnalysis(sessionId: string, contractId: string, clauseId: string, analysis: any) {
  try {
    const key = `analysis:${sessionId}:${contractId}:${clauseId}`;
    console.log('Redis - Storing clause analysis with key:', key);
    console.log('Redis - Analysis data:', JSON.stringify(analysis, null, 2));
    
    // Ensure we're storing a plain object
    const plainAnalysis = JSON.parse(JSON.stringify(analysis));
    await redis.set(key, plainAnalysis);
    
    // Verify the analysis was stored
    const storedAnalysis = await redis.get(key);
    console.log('Redis - Clause analysis stored successfully:', storedAnalysis ? 'yes' : 'no');
    if (storedAnalysis) {
      console.log('Redis - Stored analysis data:', JSON.stringify(storedAnalysis, null, 2));
    }
    
    return !!storedAnalysis;
  } catch (err) {
    console.error('Redis - storeClauseAnalysis error:', err);
    return false;
  }
}

export async function getClauseAnalysis(sessionId: string, contractId: string, clauseId: string) {
  try {
    const key = `analysis:${sessionId}:${contractId}:${clauseId}`;
    console.log('Redis - Fetching clause analysis with key:', key);
    const analysis = await redis.get(key);
    console.log('Redis - Clause analysis found:', analysis ? 'yes' : 'no');
    if (analysis) {
      console.log('Redis - Analysis data:', JSON.stringify(analysis, null, 2));
    }
    return analysis;
  } catch (err) {
    console.error('Redis - getClauseAnalysis error:', err);
    return null;
  }
}

export async function storeContract(sessionId: string, contract: Contract) {
  const client = getRedisClient();
  await client.hset(`contracts:${sessionId}`, contract.id, JSON.stringify(contract));
}

export async function listContracts(sessionId: string): Promise<Contract[]> {
  const client = getRedisClient();
  const all = await client.hgetall(`contracts:${sessionId}`);
  if (!all) return [];
  return Object.values(all).map((v) => typeof v === 'string' ? JSON.parse(v) as Contract : null).filter(Boolean);
} 