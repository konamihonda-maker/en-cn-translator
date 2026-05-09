import { useState, useEffect, useRef } from 'react';
import './VoiceButton.css';

function VoiceButton({ onSpeechResult, onInterimResult, isLoading }) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState('');
  const [displayText, setDisplayText] = useState('');
  const voiceServiceRef = useRef(null);

  const handleVoiceInput = async (e) => {
    // Prevent double-tap zoom on mobile
    e.preventDefault();
    
    if (isListening) {
      const voiceService = (await import('../services/voiceService')).default;
      voiceService.stopListening();
      setIsListening(false);
      return;
    }
    
    setError('');
    setDisplayText('');
    setIsListening(true);
    
    try {
      const voiceService = (await import('../services/voiceService')).default;
      voiceServiceRef.current = voiceService;
      
      // Set interim callback
      voiceService.onInterimResult = (text) => {
        setDisplayText(text);
        if (onInterimResult) onInterimResult(text);
      };
      
      const result = await voiceService.startListening('en-US');
      
      if (result.text && result.text.trim()) {
        setDisplayText(result.text);
        onSpeechResult(result.text.trim());
      }
    } catch (err) {
      console.error('Voice error:', err);
      setError(err.message || 'Please try again');
      setTimeout(() => setError(''), 4000);
    } finally {
      setIsListening(false);
    }
  };

  return (
    <div className="voice-button-container">
      {isListening && displayText && (
        <div className="live-speech">
          <span className="live-dot"></span>
          {displayText}
        </div>
      )}
      
      <button
        className={`voice-btn ${isListening ? 'listening' : ''}`}
        onClick={handleVoiceInput}
        onTouchStart={(e) => e.preventDefault()}
        disabled={isLoading}
      >
        {isListening ? (
          <>
            <span className="pulse-dot"></span>
            Listening... Tap to stop
          </>
        ) : (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
            Tap to Speak English
          </>
        )}
      </button>
      
      {error && (
        <div className="voice-error">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}

export default VoiceButton;