// Reliable translation service for mobile and desktop
const TRANSLATION_API = 'https://api.mymemory.translated.net/get';

export async function translateText(text, from = 'en', to = 'zh') {
  console.log(`Translating: "${text}" from ${from} to ${to}`);
  
  try {
    // Try MyMemory with proper parameters
    const url = `${TRANSLATION_API}?q=${encodeURIComponent(text)}&langpair=${from}|${to}&mt=1&onlyprivate=0&de=a@b.c`;
    console.log('API URL:', url);
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('API Response:', data);
    
    // Check if response is valid
    if (data.responseStatus === 200 && data.responseData) {
      const translatedText = data.responseData.translatedText;
      
      // Validate translation - reject obvious spam/garbage
      if (translatedText.includes('PayPal') || 
          translatedText.includes('%s') || 
          translatedText.includes('提现') ||
          translatedText.length > text.length * 5) {
        throw new Error('Invalid translation received');
      }
      
      return translatedText;
    }
    
    throw new Error('Translation failed');
    
  } catch (error) {
    console.log('Primary API failed, trying fallback...');
    
    // Fallback 1: LibreTranslate
    try {
      const response = await fetch('https://libretranslate.com/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: text,
          source: from,
          target: to,
          format: 'text'
        })
      });
      const data = await response.json();
      
      if (data.translatedText) {
        return data.translatedText;
      }
    } catch (e) {
      console.log('Fallback 1 failed');
    }
    
    // Fallback 2: Google Translate unofficial API
    try {
      const response = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`
      );
      const data = await response.json();
      
      if (data && data[0] && data[0][0]) {
        const translated = data[0].map(item => item[0]).join('');
        return translated;
      }
    } catch (e) {
      console.log('Fallback 2 failed');
    }
    
    // Fallback 3: Simple word-by-word dictionary
    return getBasicTranslation(text, to);
  }
}

// Basic fallback translation for common words
function getBasicTranslation(text, to) {
  const dictionary = {
    'hello': '你好',
    'hi': '嗨',
    'good morning': '早上好',
    'goodbye': '再见',
    'thank you': '谢谢',
    'thanks': '谢谢',
    'yes': '是',
    'no': '不是',
    'please': '请',
    'sorry': '对不起',
    'how are you': '你好吗',
    'good': '好',
    'bad': '坏',
    'friend': '朋友',
    'love': '爱',
    'help': '帮助',
    'water': '水',
    'food': '食物',
    'eat': '吃',
    'drink': '喝',
    'go': '去',
    'come': '来',
    'see': '看',
    'hear': '听',
    'speak': '说',
    'read': '读',
    'write': '写',
  };
  
  const lowerText = text.toLowerCase().trim();
  
  if (to === 'zh' && dictionary[lowerText]) {
    return dictionary[lowerText];
  }
  
  // If we can't translate, return error message
  return `[Translation unavailable for: "${text}"]`;
}

// Cache for performance
const cache = new Map();
const MAX_CACHE = 50;

export async function translateWithCache(text, from, to) {
  const key = `${text}|${from}|${to}`;
  
  if (cache.has(key)) {
    return cache.get(key);
  }
  
  const result = await translateText(text, from, to);
  
  if (cache.size > MAX_CACHE) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
  
  cache.set(key, result);
  return result;
}

// Language detection
export function detectLanguage(text) {
  const chineseRegex = /[\u4e00-\u9fff]/;
  const hasChinese = chineseRegex.test(text);
  const hasEnglish = /[a-zA-Z]{2,}/.test(text);
  
  if (hasChinese && !hasEnglish) return 'zh';
  if (hasEnglish && !hasChinese) return 'en';
  
  if (hasChinese && hasEnglish) {
    const chineseChars = text.match(chineseRegex) || [];
    const englishWords = text.match(/[a-zA-Z]+/g) || [];
    return chineseChars.length > englishWords.length ? 'zh' : 'en';
  }
  
  return 'en';
}