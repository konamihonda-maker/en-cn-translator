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
  const [direction, setDirection] = useState('en-zh');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const savedDirection = localStorage.getItem('translationDirection');
    if (savedDirection) setDirection(savedDirection);
  }, []);

  const translateText = useCallback(async (text, dir) => {
    if (!text || !text.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const from = dir === 'en-zh' ? 'en' : 'zh';
      const to = dir === 'en-zh' ? 'zh' : 'en';
      const result = await translateWithCache(text, from, to);
      setOutput(result);
    } catch (err) {
      setError('Translation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleTranslate = () => {
    translateText(input, direction);
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleSpeechResult = async (text) => {
    setInput(text);
    const detectedLang = detectLanguage(text);
    const newDirection = detectedLang === 'zh' ? 'zh-en' : 'en-zh';
    setDirection(newDirection);
    localStorage.setItem('translationDirection', newDirection);
    await translateText(text, newDirection);
  };

  const handleCapturedText = async (text) => {
    if (!text || !text.trim()) return;
    setInput(text);
    setShowCamera(false);
    const detectedLang = detectLanguage(text);
    const newDirection = detectedLang === 'zh' ? 'zh-en' : 'en-zh';
    setDirection(newDirection);
    localStorage.setItem('translationDirection', newDirection);
    await translateText(text, newDirection);
  };

  const speakTranslation = async () => {
    if (!output || isSpeaking) return;
    setIsSpeaking(true);
    try {
      const lang = direction === 'en-zh' ? 'zh-CN' : 'en-US';
      await voiceService.speak(output, lang);
    } catch (err) {
      console.error('Speak error:', err);
    }
    setIsSpeaking(false);
  };

  const clearAll = () => {
    setInput('');
    setOutput('');
    setError('');
  };

  return (
    <div className="app">
      <div className="header">
        <h1>English-Chinese Translator</h1>
        <p className="subtitle">Voice & Image Translation</p>
      </div>
      
      <div className="translator-container">
        <div className="input-methods">
          <VoiceButton 
            onSpeechResult={handleSpeechResult}
            isLoading={loading}
          />
          
          <button 
            className="camera-trigger-btn"
            onClick={() => setShowCamera(true)}
          >
            📷 Capture Image
          </button>
        </div>
        
        <div className="input-section">
          <label className="section-label">
            {direction === 'en-zh' ? 'English Input' : 'Chinese Input'}
          </label>
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            placeholder={direction === 'en-zh' ? "Type English here..." : "Type Chinese here..."}
            rows={4}
            className="input-textarea"
          />
          
          <div className="button-group">
            <button 
              className="translate-btn"
              onClick={handleTranslate}
              disabled={loading || !input.trim()}
            >
              {loading ? 'Translating...' : `Translate → ${direction === 'en-zh' ? 'Chinese' : 'English'}`}
            </button>
            
            <button className="clear-btn" onClick={clearAll}>
              Clear
            </button>
          </div>
        </div>
        
        <div className="output-section">
          <label className="section-label">
            {direction === 'en-zh' ? 'Chinese Translation' : 'English Translation'}
          </label>
          
          {error && <div className="error-message">⚠️ {error}</div>}
          
          <div className={`output-box ${output ? 'has-content' : ''}`}>
            {output ? (
              <p className="output-text">{output}</p>
            ) : (
              <p className="placeholder-text">Translation will appear here...</p>
            )}
          </div>
          
          {output && (
            <div className="output-actions">
              <button className="action-btn" onClick={speakTranslation}>
                🔊 Listen
              </button>
              <button className="action-btn" onClick={() => navigator.clipboard.writeText(output)}>
                📋 Copy
              </button>
            </div>
          )}
        </div>
      </div>

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