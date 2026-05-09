// Translation API with language detection
export async function translateText(text, from = 'en', to = 'zh') {
  try {
    // Primary: MyMemory API
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`
    );
    const data = await response.json();
    
    if (data.responseStatus === 200) {
      return data.responseData.translatedText;
    }
    throw new Error('Translation failed');
  } catch (error) {
    // Fallback: LibreTranslate
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
      return data.translatedText;
    } catch {
      return '翻译失败，请稍后重试';
    }
  }
}

// Auto-detect language (simple version)
export function detectLanguage(text) {
  const chineseRegex = /[\u4e00-\u9fff]/;
  const hasChinese = chineseRegex.test(text);
  const hasEnglish = /[a-zA-Z]/.test(text);
  
  if (hasChinese && !hasEnglish) return 'zh';
  if (hasEnglish && !hasChinese) return 'en';
  
  // If mixed, check ratio
  const chineseChars = text.match(chineseRegex);
  const englishChars = text.match(/[a-zA-Z]/g);
  
  if (chineseChars && englishChars) {
    return chineseChars.length > englishChars.length ? 'zh' : 'en';
  }
  
  return 'auto';
}

// Minimal cache
const cache = new Map();
const MAX_CACHE = 100;

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