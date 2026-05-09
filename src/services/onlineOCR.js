// Free online OCR API fallback
export async function onlineOCR(imageData) {
  try {
    // Convert base64 to blob
    const response = await fetch(imageData);
    const blob = await response.blob();
    
    // Use OCR.space free API
    const formData = new FormData();
    formData.append('file', blob, 'image.jpg');
    formData.append('language', 'eng');
    formData.append('apikey', 'helloworld'); // Free API key
    
    const result = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      body: formData
    });
    
    const data = await result.json();
    
    if (data.ParsedResults && data.ParsedResults.length > 0) {
      return data.ParsedResults[0].ParsedText;
    }
    
    throw new Error('No text found');
  } catch (error) {
    console.error('Online OCR failed:', error);
    throw error;
  }
}