import { useState, useEffect, useCallback, useRef } from 'react';
import { translateWithCache, detectLanguage } from './services/translator';
import voiceService from './services/voiceService';
import LanguageSwitch from './components/LanguageSwitch';
import VoiceButton from './components/VoiceButton';
import CameraCapture from './components/CameraCapture';
import './App.css';

function App() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [direction, setDirection] = useState('en-zh'); // Default: English to Chinese
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListeningLive, setIsListeningLive] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const inputRef = useRef(null);

  // Load saved direction
  useEffect(() => {
    const savedDirection = localStorage.getItem('translationDirection');
    if (savedDirection) {
      setDirection(savedDirection);
    }
  }, []);

  // ============ CORE TRANSLATION FUNCTION ============
  const translateText = useCallback(async (text, dir) => {
    if (!text || !text.trim()) return;
    
    console.log('🔄 Translating:', text.substring(0, 50) + '...');
    setLoading(true);
    setError('');
    
    try {
      let from, to;
      
      if (dir === 'en-zh') {
        from = 'en';
        to = 'zh';
      } else {
        from = 'zh';
        to = 'en';
      }
      
      const result = await translateWithCache(text, from, to);
      console.log('✅ Translation result:', result);
      setOutput(result);
      return result;
    } catch (err) {
      console.error('❌ Translation error:', err);
      setError('Translation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // ============ DIRECTION TOGGLE ============
  const toggleDirection = useCallback(() => {
    setDirection(prev => {
      const newDirection = prev === 'en-zh' ? 'zh-en' : 'en-zh';
      localStorage.setItem('translationDirection', newDirection);
      return newDirection;
    });
    
    // Swap input/output if both exist
    if (input && output) {
      setInput(output);
      setOutput(input);
    } else {
      setOutput('');
    }
  }, [input, output]);

  // ============ TEXT INPUT HANDLER ============
  const handleInputChange = (e) => {
    const text = e.target.value;
    setInput(text);
    
    // Auto-detect language for longer text
    if (text.trim().length > 2) {
      const detectedLang = detectLanguage(text);
      const newDirection = detectedLang === 'zh' ? 'zh-en' : 'en-zh';
      
      if (newDirection !== direction) {
        setDirection(newDirection);
        localStorage.setItem('translationDirection', newDirection);
      }
    }
  };

  // ============ TRANSLATE BUTTON ============
  const handleTranslate = useCallback(() => {
    translateText(input, direction);
  }, [input, direction, translateText]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTranslate();
    }
  };

  // ============ VOICE HANDLERS ============
  const handleInterimSpeech = useCallback((text) => {
    setInput(text);
    setIsListeningLive(true);
  }, []);

  const handleSpeechResult = useCallback(async (text) => {
    console.log('🎤 Voice result:', text);
    setInput(text);
    setIsListeningLive(false);
    
    // Auto-detect and translate
    const detectedLang = detectLanguage(text);
    const newDirection = detectedLang === 'zh' ? 'zh-en' : 'en-zh';
    setDirection(newDirection);
    localStorage.setItem('translationDirection', newDirection);
    
    // Auto-translate voice input
    await translateText(text, newDirection);
  }, [translateText]);

  // ============ CAMERA/IMAGE HANDLER ============
    const handleCapturedText = useCallback(async (text) => {
    console.log('========================================');
    console.log('📷 handleCapturedText CALLED');
    console.log('Text received:', text);
    console.log('Text type:', typeof text);
    console.log('Text length:', text ? text.length : 0);
    console.log('========================================');
    
    if (!text || !text.trim()) {
      console.warn('⚠️ Empty text - not translating');
      return;
    }
    
    // Set text in input box
    console.log('Setting input text...');
    setInput(text);
    
    // Close camera
    console.log('Closing camera modal...');
    setShowCamera(false);
    
    // Detect language
    const detectedLang = detectLanguage(text);
    const newDirection = detectedLang === 'zh' ? 'zh-en' : 'en-zh';
    console.log('Detected language:', detectedLang);
    console.log('Translation direction:', newDirection);
    
    setDirection(newDirection);
    localStorage.setItem('translationDirection', newDirection);
    
    // Translate
    console.log('Starting translation...');
    await translateText(text, newDirection);
    console.log('✅ Translation complete!');
  }, [translateText]);

  // ============ SPEAK OUTPUT ============
   const speakTranslation = async () => {
    if (!output || isSpeaking) return;
    
    setIsSpeaking(true);
    try {
      const targetLang = direction === 'en-zh' ? 'zh-CN' : 'en-US';
      await voiceService.speak(output, targetLang);
    } catch (err) {
      console.error('Speech failed:', err);
    } finally {
      setIsSpeaking(false);
    }
  };

  // ============ CLEAR ALL ============
  const clearAll = () => {
    setInput('');
    setOutput('');
    setError('');
    setIsListeningLive(false);
    voiceService.stopSpeaking();
    voiceService.abortListening();
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // ============ RENDER ============
  return (
    <div className="app">
      <div className="header">
        <h1>English to Chinese Translator</h1>
        <p className="subtitle">Voice & Text & Image Translation</p>
      </div>
      
      <LanguageSwitch 
        direction={direction} 
        onToggle={toggleDirection} 
      />
      
      <div className="translator-container">
        {/* Input Methods */}
        <div className="input-methods">
          <VoiceButton 
            onSpeechResult={handleSpeechResult}
            onInterimResult={handleInterimSpeech}
            isLoading={loading}
          />
          
          <button 
            className="camera-trigger-btn"
            onClick={() => setShowCamera(true)}
            title="Capture text from image"
            disabled={loading}
          >
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4z"/>
              <path fill="currentColor" d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
            </svg>
            <span>Capture Image</span>
          </button>
        </div>
        
        {/* Text Input */}
        <div className="input-section">
          <label className="section-label">
            {direction === 'en-zh' ? '🇬🇧 English Input' : '🇨🇳 Chinese Input'}
            {isListeningLive && <span className="live-badge">LIVE</span>}
          </label>
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={direction === 'en-zh' ? 
              "Type English here or use voice/image input..." : 
              "Type Chinese here or use voice/image input..."
            }
            rows={5}
            className={`input-textarea ${isListeningLive ? 'live-input' : ''}`}
          />
          
          {input.length > 0 && (
            <div className="char-count">
              {input.length} characters
            </div>
          )}
          
          <div className="button-group">
            <button 
              className="translate-btn"
              onClick={handleTranslate} 
              disabled={loading || !input.trim()}
            >
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  Translating...
                </>
              ) : (
                <>
                  Translate to {direction === 'en-zh' ? 'Chinese' : 'English'}
                  <span className="btn-icon">→</span>
                </>
              )}
            </button>
            
            <button 
              className="clear-btn"
              onClick={clearAll}
              disabled={!input && !output}
            >
              Clear All
            </button>
          </div>
        </div>
        
        {/* Translation Output */}
        <div className="output-section">
          <label className="section-label">
            {direction === 'en-zh' ? '🇨🇳 Chinese Translation' : '🇬🇧 English Translation'}
          </label>
          
          {error && (
            <div className="error-message">
              <span>⚠️</span> {error}
            </div>
          )}
          
          <div className={`output-box ${output ? 'has-content' : ''}`}>
            {loading ? (
              <div className="loading-container">
                <div className="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <p>Translating...</p>
              </div>
            ) : output ? (
              <div className="output-content">
                <p className="output-text">{output}</p>
              </div>
            ) : (
              <div className="empty-state">
                <span className="empty-icon">📝</span>
                <p className="placeholder-text">
                  {direction === 'en-zh' ? 
                    'Translation will appear here...' : 
                    'Translation will appear here...'
                  }
                </p>
              </div>
            )}
          </div>
          
          {output && !loading && (
            <div className="output-actions">
              <button 
                className={`action-btn speak-btn ${isSpeaking ? 'active' : ''}`}
                onClick={speakTranslation}
                disabled={isSpeaking}
                title="Listen to pronunciation"
              >
                {isSpeaking ? '🔊 Speaking...' : '🔈 Listen'}
              </button>
              
              <button 
                className="action-btn copy-btn"
                onClick={() => {
                  navigator.clipboard.writeText(output);
                  const btn = document.querySelector('.copy-btn');
                  if (btn) {
                    btn.textContent = '✅ Copied!';
                    setTimeout(() => {
                      btn.textContent = '📋 Copy';
                    }, 2000);
                  }
                }}
                title="Copy translation"
              >
                📋 Copy
              </button>
              
              <button 
                className="action-btn share-btn"
                onClick={() => {
                  const textToShare = `${input}\n\n↓ Translation ↓\n\n${output}`;
                  if (navigator.share) {
                    navigator.share({
                      title: 'Translation',
                      text: textToShare
                    }).catch(() => {
                      // Fallback if share fails
                      navigator.clipboard.writeText(textToShare);
                    });
                  } else {
                    navigator.clipboard.writeText(textToShare);
                    const btn = document.querySelector('.share-btn');
                    if (btn) {
                      btn.textContent = '✅ Copied!';
                      setTimeout(() => {
                        btn.textContent = '📤 Share';
                      }, 2000);
                    }
                  }
                }}
                title="Share translation"
              >
                📤 Share
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="app-footer">
        <p>Speak • Type • Capture - Instant Translation</p>
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <CameraCapture
          onTextCaptured={handleCapturedText}
          onClose={() => setShowCamera(false)}
          isLoading={loading}
        />
      )}
    </div>
  );
}

export default App;