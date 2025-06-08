import axios from 'axios';
import OpenAI from 'openai';

const DEEPL_API_KEY = process.env.DEEPL_API_KEY || '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

export type SupportedLang = 'en' | 'es' | 'pt' | 'zh';

const DEEPL_LANG_MAP: Record<SupportedLang, string> = {
  en: 'EN',
  es: 'ES',
  pt: 'PT',
  zh: 'ZH', // DeepL does not support Chinese, so fallback to OpenAI for zh
};

// Add sleep function for retries
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Translate text using DeepL (for en, es, pt)
 */
async function translateWithDeepL(text: string, targetLang: SupportedLang, sourceLang?: SupportedLang): Promise<string> {
  if (!DEEPL_API_KEY) throw new Error('DEEPL_API_KEY not set');
  if (targetLang === 'zh') throw new Error('DeepL does not support Chinese');
  const params = new URLSearchParams();
  params.append('text', text);
  params.append('target_lang', DEEPL_LANG_MAP[targetLang]);
  if (sourceLang && DEEPL_LANG_MAP[sourceLang]) {
    params.append('source_lang', DEEPL_LANG_MAP[sourceLang]);
  }
  const res = await axios.post('https://api.deepl.com/v2/translate', params, {
    headers: { 'Authorization': `DeepL-Auth-Key ${DEEPL_API_KEY}` },
  });
  return res.data.translations[0].text;
}

/**
 * Translate text using OpenAI with rate limiting and retries
 */
async function translateWithOpenAI(text: string, targetLang: SupportedLang, sourceLang?: SupportedLang, retries = 3): Promise<string> {
  if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not set');
  const langMap: Record<SupportedLang, string> = {
    en: 'English', es: 'Spanish', pt: 'Portuguese', zh: 'Chinese (Mandarin)'
  };
  
  const prompt = `Translate the following legal/contract text from ${sourceLang ? langMap[sourceLang] : 'its original language'} to ${langMap[targetLang]}. Preserve all legal nuance and terminology.\n\nText:\n"""\n${text}\n"""`;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo', // Use faster, cheaper model to avoid rate limits
        messages: [
          { role: 'system', content: 'You are a professional legal translator.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 1000, // Reduced token usage
      });
      return response.choices[0].message?.content?.trim() || '';
    } catch (error: any) {
      if (error.status === 429 && attempt < retries - 1) {
        // Rate limit hit - wait and retry with exponential backoff
        const waitTime = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        console.log(`Rate limit hit, waiting ${waitTime}ms before retry ${attempt + 1}/${retries}`);
        await sleep(waitTime);
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}

/**
 * Translate a string or structured analysis object with batching
 */
export async function translateAnalysis(
  input: string | Record<string, any>,
  targetLang: SupportedLang,
  sourceLang: SupportedLang = 'en'
): Promise<string | Record<string, any>> {
  // If the target language is the same as source, return input unchanged
  if (targetLang === sourceLang) {
    return input;
  }

  if (typeof input === 'string') {
    if (targetLang === 'zh' || sourceLang === 'zh') {
      return await translateWithOpenAI(input, targetLang, sourceLang);
    }
    try {
      return await translateWithDeepL(input, targetLang, sourceLang);
    } catch {
      // Fallback to OpenAI if DeepL fails
      return await translateWithOpenAI(input, targetLang, sourceLang);
    }
  }
  
  // For arrays (multiple analyses), process in smaller batches to avoid rate limits
  if (Array.isArray(input)) {
    const batchSize = 2; // Process 2 analyses at a time
    const results = [];
    
    for (let i = 0; i < input.length; i += batchSize) {
      const batch = input.slice(i, i + batchSize);
      console.log(`Translating batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(input.length/batchSize)}`);
      
      const batchPromises = batch.map(item => translateAnalysis(item, targetLang, sourceLang));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Add small delay between batches to avoid rate limits
      if (i + batchSize < input.length) {
        await sleep(500); // 500ms delay between batches
      }
    }
    
    return results;
  }
  
  // Special handling for unfairClauses which contains objects
  if (input.unfairClauses && Array.isArray(input.unfairClauses)) {
    const output = { ...input };
    output.unfairClauses = await Promise.all(
      input.unfairClauses.map(async (clause: any) => {
        if (typeof clause === 'object' && clause !== null) {
          return {
            clauseId: clause.clauseId, // Keep ID unchanged
            description: await translateAnalysis(clause.description || '', targetLang, sourceLang)
          };
        }
        return clause; // If it's not an object, return as is
      })
    );
    
    // Translate the rest of the object, excluding unfairClauses
    for (const key in input) {
      if (key !== 'unfairClauses') {
        if (typeof input[key] === 'string') {
          output[key] = await translateAnalysis(input[key], targetLang, sourceLang);
        } else if (Array.isArray(input[key])) {
          output[key] = await Promise.all(
            input[key].map((item: any) => 
              typeof item === 'string' 
                ? translateAnalysis(item, targetLang, sourceLang)
                : translateAnalysis(item, targetLang, sourceLang)
            )
          );
        } else if (typeof input[key] === 'object' && input[key] !== null) {
          output[key] = await translateAnalysis(input[key], targetLang, sourceLang);
        } else {
          output[key] = input[key];
        }
      }
    }
    
    return output;
  }
  
  // Standard recursive translation for other objects
  const output: Record<string, any> = {};
  for (const key in input) {
    if (typeof input[key] === 'string') {
      output[key] = await translateAnalysis(input[key], targetLang, sourceLang);
    } else if (Array.isArray(input[key])) {
      output[key] = await Promise.all(
        input[key].map((item: any) => translateAnalysis(item, targetLang, sourceLang))
      );
    } else if (typeof input[key] === 'object' && input[key] !== null) {
      output[key] = await translateAnalysis(input[key], targetLang, sourceLang);
    } else {
      output[key] = input[key];
    }
  }
  
  return output;
}

// TODO: Add batching for large objects, error handling, and rate limit management as needed. 