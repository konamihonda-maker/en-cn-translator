const processImage = async () => {
    if (!capturedImage) {
      setError('No image to process.');
      return;
    }
    
    setProcessing(true);
    setError('');
    
    try {
      // First try Tesseract
      const ocrModule = await import('../services/ocrService');
      const ocrService = ocrModule.default;
      const text = await ocrService.recognizeImage(capturedImage);
      
      if (text && text.trim()) {
        setOcrText(text);
        onTextCaptured(text.trim());
      } else {
        setError('No text found. Try a clearer image.');
        setProcessing(false);
      }
    } catch (err) {
      console.error('OCR failed:', err);
      // Fallback: Show error with option to type manually
      setError('OCR failed. The image might be unclear. Try again or type text manually.');
      setProcessing(false);
    }
  };