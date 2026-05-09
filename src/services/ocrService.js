// Hybrid OCR Service - tries online API first, then local processing
class OCRService {
  constructor() {
    this.worker = null;
    this.useLocal = false;
  }

  async recognizeImage(imageData) {
    console.log('🔍 Starting OCR...');
    
    // Validate input
    if (!imageData || typeof imageData !== 'string') {
      throw new Error('Invalid image data');
    }

    // Try online API first (faster, no download needed)
    try {
      console.log('📡 Trying online OCR...');
      return await this.onlineOCR(imageData);
    } catch (onlineError) {
      console.log('⚠️ Online OCR failed:', onlineError.message);
      console.log('🔄 Falling back to local OCR...');
      
      // Fall back to local Tesseract
      try {
        return await this.localOCR(imageData);
      } catch (localError) {
        console.error('❌ Both methods failed');
        throw new Error('OCR failed. Please try a clearer image or type text manually.');
      }
    }
  }

  // Online OCR using free API
  async onlineOCR(imageData) {
    const base64Data = imageData.split(',')[1];
    if (!base64Data) throw new Error('Invalid image format');

    // Convert to blob
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Uint8Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const blob = new Blob([byteNumbers], { type: 'image/jpeg' });

    const formData = new FormData();
    formData.append('file', blob, 'image.jpg');
    formData.append('language', 'eng');
    formData.append('apikey', 'helloworld');

    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    
    if (data.ErrorMessage) throw new Error(data.ErrorMessage);
    
    const text = data.ParsedResults?.[0]?.ParsedText;
    if (!text || !text.trim()) throw new Error('No text found');

    return text.replace(/\s+/g, ' ').trim();
  }

  // Local OCR using Tesseract.js
  async localOCR(imageData) {
    if (!this.worker) {
      const { createWorker } = await import('tesseract.js');
      
      this.worker = await createWorker({
        logger: (m) => console.log('OCR:', m.status),
      });
      
      await this.worker.loadLanguage('eng');
      await this.worker.initialize('eng');
    }

    const result = await this.worker.recognize(imageData);
    const text = result.data?.text || '';
    
    if (!text.trim()) throw new Error('No text found');
    
    return text.replace(/\s+/g, ' ').trim();
  }

  async terminate() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}

const ocrService = new OCRService();
export default ocrService;