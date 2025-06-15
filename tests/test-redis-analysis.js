const { Redis } = require('@upstash/redis');
const fs = require('fs');

// Load environment variables from .env.local
if (fs.existsSync('.env.local')) {
  const envFile = fs.readFileSync('.env.local', 'utf8');
  envFile.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
    }
  });
}

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

async function testRedisAnalysis() {
  const sessionId = 'test-session-123';
  const contractId = 'doc-1749441720180'; 
  const clauseId = 'para-0';
  
  console.log('🧪 Testing Redis analysis storage and retrieval...\n');
  
  // Test 1: Store an analysis
  console.log('1️⃣ Storing analysis...');
  const testAnalysis = {
    ambiguities: ["Test ambiguity"],
    risks: ["Test risk"],
    recommendations: ["Test recommendation"],
    missingElements: ["Test missing"],
    references: ["Test reference"]
  };
  
  const storeKey = `analysis:${sessionId}:${contractId}:${clauseId}`;
  console.log('Store key:', storeKey);
  
  try {
    await redis.set(storeKey, testAnalysis);
    console.log('✅ Analysis stored successfully');
  } catch (error) {
    console.log('❌ Failed to store analysis:', error.message);
    return;
  }
  
  // Test 2: Retrieve the analysis
  console.log('\n2️⃣ Retrieving analysis...');
  const retrieveKey = `analysis:${sessionId}:${contractId}:${clauseId}`;
  console.log('Retrieve key:', retrieveKey);
  
  try {
    const retrievedAnalysis = await redis.get(retrieveKey);
    console.log('Retrieved analysis:', retrievedAnalysis);
    
    if (retrievedAnalysis) {
      console.log('✅ Analysis retrieved successfully');
      console.log('Analysis content:', JSON.stringify(retrievedAnalysis, null, 2));
    } else {
      console.log('❌ No analysis found');
    }
  } catch (error) {
    console.log('❌ Failed to retrieve analysis:', error.message);
    return;
  }
  
  // Test 3: List all keys with our pattern
  console.log('\n3️⃣ Listing all analysis keys...');
  try {
    // Note: SCAN is not available in Upstash REST API, so we'll just check our specific key
    const keyExists = await redis.exists(storeKey);
    console.log(`Key ${storeKey} exists:`, keyExists);
  } catch (error) {
    console.log('❌ Failed to check key existence:', error.message);
  }
  
  // Test 4: Try with exactly the same parameters used in the API
  console.log('\n4️⃣ Testing with API simulation...');
  
  // Simulate the storeClauseAnalysis function
  try {
    const key = `analysis:${sessionId}:${contractId}:${clauseId}`;
    console.log('Redis - Storing clause analysis with key:', key);
    console.log('Redis - Analysis data:', JSON.stringify(testAnalysis, null, 2));
    
    const plainAnalysis = JSON.parse(JSON.stringify(testAnalysis));
    await redis.set(key, plainAnalysis);
    
    const storedAnalysis = await redis.get(key);
    console.log('Redis - Clause analysis stored successfully:', storedAnalysis ? 'yes' : 'no');
    if (storedAnalysis) {
      console.log('Redis - Stored analysis data:', JSON.stringify(storedAnalysis, null, 2));
    }
  } catch (error) {
    console.log('❌ API simulation failed:', error.message);
  }
  
  // Test 5: Simulate the getClauseAnalysis function
  try {
    const key = `analysis:${sessionId}:${contractId}:${clauseId}`;
    console.log('\nRedis - Fetching clause analysis with key:', key);
    const analysis = await redis.get(key);
    console.log('Redis - Clause analysis found:', analysis ? 'yes' : 'no');
    if (analysis) {
      console.log('Redis - Analysis data:', JSON.stringify(analysis, null, 2));
    }
  } catch (error) {
    console.log('❌ Fetch simulation failed:', error.message);
  }
  
  console.log('\n🎉 Redis test completed!');
}

testRedisAnalysis().catch(console.error); 