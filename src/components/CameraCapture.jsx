import { useState, useRef, useCallback } from 'react';
import './CameraCapture.css';

function CameraCapture({ onTextCaptured, onClose, isLoading }) {
  const [mode, setMode] = useState('select');
  const [capturedImage, setCapturedImage] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [ocrText, setOcrText] = useState('');
  const [progress, setProgress] = useState(0);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  // Cleanup on unmount
  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async () => {
    setError('');
    try {
      cleanup();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setMode('camera');
      }
    } catch (err) {
      console.error('Camera error:', err);
      if (err.name === 'NotAllowedError') {
        setError('Camera access denied. Please allow camera permission in browser settings.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else {
        setError('Camera error: ' + err.message);
      }
    }
  };

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      const ctx = canvas.getContext('2d');
      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to image data URL
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      console.log('📸 Photo captured, size:', Math.round(imageDataUrl.length / 1024), 'KB');
      
      setCapturedImage(imageDataUrl);
      cleanup();
      setMode('preview');
    }
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    console.log('📁 File selected:', file.name, 'Size:', Math.round(file.size / 1024), 'KB', 'Type:', file.type);
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, GIF, etc.)');
      return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image is too large. Maximum size is 10MB.');
      return;
    }
    
    setError('');
    
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const imageDataUrl = event.target.result;
      console.log('✅ File loaded as data URL, length:', imageDataUrl.length);
      setCapturedImage(imageDataUrl);
      setMode('preview');
    };
    
    reader.onerror = () => {
      console.error('❌ FileReader error');
      setError('Failed to read the image file. Please try another image.');
    };
    
    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentLoaded = Math.round((event.loaded / event.total) * 100);
        console.log('Loading progress:', percentLoaded + '%');
      }
    };
    
    // Start reading the file
    reader.readAsDataURL(file);
  };

  const processImage = async () => {
    if (!capturedImage) {
      setError('No image to process. Please capture or upload an image first.');
      return;
    }
    
    console.log('🚀 processImage started');
    console.log('capturedImage exists:', !!capturedImage);
    console.log('capturedImage type:', typeof capturedImage);
    console.log('capturedImage preview:', typeof capturedImage === 'string' ? capturedImage.substring(0, 50) : 'NOT A STRING');
    
    setProcessing(true);
    setError('');
    setOcrText('');
    setProgress(0);
    
    // Progress simulation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 500);
    
    try {
      // Make sure we have valid image data
      if (typeof capturedImage !== 'string' || capturedImage.length === 0) {
        throw new Error('Invalid image data. Please retake the photo or upload again.');
      }
      
      console.log('📦 Importing OCR service...');
      const ocrModule = await import('../services/ocrService');
      const ocrService = ocrModule.default;
      
      console.log('🔍 Calling ocrService.recognizeImage...');
      // PASS THE IMAGE DATA DIRECTLY
      const text = await ocrService.recognizeImage(capturedImage);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      console.log('✅ OCR successful!');
      console.log('Text:', text);
      
      if (text && text.trim().length > 0) {
        setOcrText(text.trim());
        
        // Send to parent for translation
        setTimeout(() => {
          console.log('📤 Sending text to parent...');
          onTextCaptured(text.trim());
        }, 500);
      } else {
        console.warn('⚠️ Empty text returned');
        setError('No readable text found. Tips:\n• Use well-lit images\n• Ensure text is clear and large\n• Try a screenshot instead of photo');
        setProcessing(false);
      }
    } catch (err) {
      console.error('❌ OCR Error:', err);
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);
      clearInterval(progressInterval);
      setError('Failed: ' + err.message);
      setProcessing(false);
      setProgress(0);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setOcrText('');
    setError('');
    setProcessing(false);
    setProgress(0);
    setMode('select');
  };

  const handleClose = () => {
    cleanup();
    onClose();
  };

  return (
    <div className="camera-overlay">
      <div className="camera-modal">
        {/* Header */}
        <div className="camera-header">
          <h3>
            {mode === 'select' && '📷 Capture Text Image'}
            {mode === 'camera' && '📸 Take Photo of Text'}
            {mode === 'preview' && '🔍 Extract & Translate'}
          </h3>
          <button className="close-btn" onClick={handleClose} disabled={processing}>
            ✕
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="camera-error">
            <span>⚠️</span> 
            <span style={{ whiteSpace: 'pre-line' }}>{error}</span>
          </div>
        )}

        {/* SELECT MODE */}
        {mode === 'select' && (
          <div className="mode-select">
            <p className="select-hint">Choose how to capture text for translation:</p>
            <div className="option-cards">
              <button className="option-card" onClick={startCamera}>
                <span className="option-icon">📸</span>
                <span className="option-title">Take Photo</span>
                <span className="option-desc">Use camera to capture text</span>
              </button>
              
              <label className="option-card upload-card">
                <span className="option-icon">🖼️</span>
                <span className="option-title">Upload Image</span>
                <span className="option-desc">Select image from device</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  hidden
                />
              </label>
            </div>
          </div>
        )}

        {/* CAMERA MODE */}
        {mode === 'camera' && (
          <div className="mode-camera">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="camera-preview"
            />
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <button className="capture-btn" onClick={capturePhoto} type="button">
                <span className="capture-circle"></span>
              </button>
            </div>
          </div>
        )}

        {/* PREVIEW MODE */}
        {mode === 'preview' && (
          <div className="mode-preview">
            {/* Show the captured/uploaded image */}
            {capturedImage && (
              <div className="image-container">
                <img 
                  src={capturedImage} 
                  alt="Captured" 
                  className="preview-image"
                  onError={(e) => {
                    console.error('❌ Image failed to load');
                    setError('Failed to display image. Please try again.');
                  }}
                  onLoad={() => {
                    console.log('✅ Image displayed successfully');
                  }}
                />
              </div>
            )}

            {/* Progress bar when processing */}
            {processing && (
              <div className="processing-box">
                <div className="progress-bar-container">
                  <div 
                    className="progress-bar-fill" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="progress-label">
                  {progress < 100 ? '⏳ Extracting text...' : '✅ Text extracted!'}
                </p>
                <p style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
                  This may take 10-20 seconds for the first image
                </p>
              </div>
            )}

            {/* Show extracted text */}
            {ocrText && !processing && (
              <div className="extracted-text-box">
                <label>✅ Extracted Text:</label>
                <p>{ocrText}</p>
              </div>
            )}

            {/* Action buttons */}
            {!processing && (
              <div className="preview-actions">
                <button 
                  className="action-btn secondary-btn"
                  onClick={retakePhoto}
                  type="button"
                >
                  ↺ Retake
                </button>
                
                {!ocrText ? (
                  <button 
                    className="action-btn primary-btn"
                    onClick={processImage}
                    type="button"
                  >
                    🔍 Extract Text & Translate
                  </button>
                ) : (
                  <button 
                    className="action-btn primary-btn"
                    onClick={handleClose}
                    type="button"
                  >
                    ✓ View Translation →
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Hidden canvas for camera capture */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </div>
  );
}

export default CameraCapture;