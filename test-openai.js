const OpenAI = require('openai');

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here' 
});

const testAnalysis = async () => {
  try {
    console.log('Testing OpenAI API...');
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a legal expert. Analyze this contract clause and return JSON with ambiguities, risks, and recommendations.' },
        { role: 'user', content: 'Test clause: The party agrees to maintain confidentiality.' }
      ],
      temperature: 0.2,
      max_tokens: 300
    });
    console.log('✅ OpenAI API Response:', response.choices[0].message.content);
  } catch (error) {
    console.error('❌ OpenAI API Error:', error.message);
  }
};

testAnalysis(); 