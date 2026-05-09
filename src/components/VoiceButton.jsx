import { useState, useEffect, useRef } from 'react';
import './VoiceButton.css';

function VoiceButton({ onSpeechResult, onInterimResult, isLoading }) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState('');
  const [listeningTime, setListeningTime] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const timerRef = useRef(null);
  const voiceServiceRef = useRef(null);

  useEffect(() => {
    if (isListening) {
      // Timer for display
      timerRef.current = setInterval(() => {
        setListeningTime(prev => {
          // Auto-stop warning at 25 seconds
          if (prev >= 25) {
            return prev + 1;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setListeningTime(0);
      setDisplayText('');
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isListening]);

  const handleVoiceInput = async () => {
    if (isListening) {
      // Manual stop
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
      
      // Start listening with real-time callback
      const result = await voiceService.startListening('en-US', (interimText) => {
        // Real-time display update
        setDisplayText(interimText);
        if (onInterimResult) {
          onInterimResult(interimText);
        }
      });
      
      if (result.text && result.text.trim()) {
        const finalText = result.text.trim();
        setDisplayText(finalText);
        onSpeechResult(finalText);
      } else {
        setError('No speech detected. Please try again.');
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      console.error('Voice error:', err);
      setError(err.message || 'Voice input failed');
      setTimeout(() => setError(''), 4000);
    } finally {
      setIsListening(false);
    }
  };

  return (
    <div className="voice-button-container">
      {/* Real-time speech display */}
      {isListening && displayText && (
        <div className="live-speech-display">
          <div className="live-speech-header">
            <span className="live-dot"></span>
            Speaking...
          </div>
          <div className="live-speech-text">
            {displayText}
          </div>
        </div>
      )}

      <button
        className={`voice-btn ${isListening ? 'listening' : ''} ${isLoading ? 'disabled' : ''}`}
        onClick={handleVoiceInput}
        disabled={isLoading}
        title={isListening ? 'Click to stop and translate' : 'Click to start speaking'}
      >
        {isListening ? (
          <div className="listening-content">
            <div className="listening-indicator">
              <span className="pulse"></span>
              <span className="pulse"></span>
              <span className="pulse"></span>
            </div>
            <div className="listening-text">
              <span className="listening-label">Listening...</span>
              {listeningTime > 0 && (
                <span className="listening-time">
                  {listeningTime}s
                </span>
              )}
            </div>
            <span className="stop-hint">Tap to stop & translate</span>
          </div>
        ) : (
          <div className="idle-content">
            <svg className="mic-icon" viewBox="0 0 24 24" width="28" height="28">
              <path fill="currentColor" d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
              <path fill="currentColor" d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
            <span className="voice-text">Tap to Speak English</span>
          </div>
        )}
      </button>
      
      {error && (
        <div className="voice-error">
          <span>⚠️</span> {error}
        </div>
      )}

      {isListening && !displayText && (
        <div className="listening-tip">
          💡 Speak naturally now... pauses will auto-translate
        </div>
      )}

      {isListening && listeningTime > 25 && (
        <div className="listening-warning">
          ⚠️ Will stop soon - {30 - listeningTime}s remaining
        </div>
      )}
    </div>
  );
}

export default VoiceButton;