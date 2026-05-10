// Translation service
const cache = new Map();
const MAX_CACHE = 100;

export async function translateText(text, from = 'en', to = 'zh') {
  if (!text || !text.trim()) return '';
  
  const trimmedText = text.trim();
  
  // Try Google Translate first
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(trimmedText)}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data && data[0] && data[0][0]) {
      const translated = data[0].map(item => item[0]).join('');
      return translated;
    }
  } catch (e) {
    console.log('Google Translate failed, trying fallback...');
  }
  
  // Fallback: MyMemory API
  try {
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmedText)}&langpair=${from}|${to}&mt=1`
    );
    const data = await response.json();
    
    if (data.responseStatus === 200 && data.responseData) {
      const translatedText = data.responseData.translatedText;
      
      // Validate: reject spam/garbage responses
      if (translatedText.includes('PayPal') || 
          translatedText.includes('%s') ||
          translatedText.includes('$%s')) {
        throw new Error('Invalid response');
      }
      
      return translatedText;
    }
    throw new Error('API error');
  } catch (e) {
    console.log('MyMemory failed, using basic dictionary...');
    
    // Basic dictionary for common words
    const dict = {
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
      'i': '我',
      'you': '你',
      'he': '他',
      'she': '她',
      'we': '我们',
      'they': '他们',
      'am': '是',
      'is': '是',
      'are': '是',
      'my': '我的',
      'your': '你的',
      'name': '名字',
      'what': '什么',
      'where': '哪里',
      'when': '什么时候',
      'why': '为什么',
      'how': '怎么',
    };
    
    const lower = trimmedText.toLowerCase();
    if (to === 'zh' && dict[lower]) {
      return dict[lower];
    }
    
    // Return meaningful error
    return `[Unable to translate: "${trimmedText}"]`;
  }
}

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

export function detectLanguage(text) {
  if (!text) return 'en';
  
  const chineseRegex = /[\u4e00-\u9fff]/;
  const hasChinese = chineseRegex.test(text);
  const hasEnglish = /[a-zA-Z]{2,}/.test(text);
  
  if (hasChinese && !hasEnglish) return 'zh';
  if (hasEnglish && !hasChinese) return 'en';
  
  if (hasChinese && hasEnglish) {
    const chineseChars = (text.match(chineseRegex) || []).length;
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
    return chineseChars > englishWords ? 'zh' : 'en';
  }
  
  return 'en';
}