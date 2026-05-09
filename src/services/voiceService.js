// Enhanced voice recognition service with real-time feedback
class VoiceService {
  constructor() {
    this.recognition = null;
    this.synthesis = window.speechSynthesis;
    this.isListening = false;
    this.isSpeaking = false;
    this.finalTranscript = '';
    this.onInterimResult = null; // Callback for real-time display
  }

  // Initialize speech recognition
  initRecognition(language = 'en-US') {
    // Check for browser support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      throw new Error('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    // Configure for optimal speech capture
    this.recognition.continuous = true;      // Keep listening continuously
    this.recognition.interimResults = true;  // Show results while speaking
    this.recognition.maxAlternatives = 1;    // Single best result
    this.recognition.lang = language;
    
    return this.recognition;
  }

  // Start listening with real-time updates
  startListening(language = 'en-US', onInterimResult = null) {
    return new Promise((resolve, reject) => {
      try {
        // Request microphone permission first
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then(() => {
            console.log('Microphone access granted');
          })
          .catch((err) => {
            reject(new Error('Microphone access denied. Please allow microphone access in your browser settings.'));
            return;
          });

        let recognitionLang = 'en-US';
        if (language === 'zh' || language === 'zh-CN') {
          recognitionLang = 'zh-CN';
        } else if (language === 'en' || language === 'en-US') {
          recognitionLang = 'en-US';
        }
        
        const recognition = this.initRecognition(recognitionLang);
        this.finalTranscript = '';
        this.onInterimResult = onInterimResult;
        
        let silenceTimer = null;
        let hasSpeech = false;
        let speechStartTime = null;

        recognition.onstart = () => {
          console.log('Speech recognition started');
          this.isListening = true;
          hasSpeech = false;
          speechStartTime = Date.now();
          this.finalTranscript = '';
        };

        recognition.onspeechstart = () => {
          console.log('Speech detected');
          hasSpeech = true;
          speechStartTime = Date.now();
        };

        recognition.onspeechend = () => {
          console.log('Speech ended');
          
          // Start silence countdown after speech ends
          if (silenceTimer) clearTimeout(silenceTimer);
          
          silenceTimer = setTimeout(() => {
            if (this.isListening && hasSpeech) {
              console.log('Silence detected, stopping...');
              const result = this.finalTranscript.trim();
              if (result) {
                this.stopListening();
                resolve({ text: result, confidence: 0.9 });
              }
            }
          }, 3000); // 3 seconds of silence as requested
        };

        recognition.onresult = (event) => {
          let interimTranscript = '';
          
          // Process all results
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            if (result.isFinal) {
              this.finalTranscript += result[0].transcript + ' ';
              console.log('Final:', result[0].transcript);
            } else {
              interimTranscript += result[0].transcript;
              console.log('Interim:', result[0].transcript);
            }
          }
          
          // Combine for display
          const displayText = (this.finalTranscript + interimTranscript).trim();
          
          // Call real-time callback
          if (this.onInterimResult && displayText) {
            this.onInterimResult(displayText);
          }
          
          // Reset silence timer on any result
          if (silenceTimer) {
            clearTimeout(silenceTimer);
          }
          
          // Set new silence timer
          silenceTimer = setTimeout(() => {
            if (this.isListening && displayText) {
              console.log('Auto-stopping after silence');
              const finalResult = this.finalTranscript.trim() || displayText;
              if (finalResult) {
                this.stopListening();
                resolve({ text: finalResult, confidence: 0.9 });
              }
            }
          }, 3000);
        };

        recognition.onerror = (event) => {
          console.error('Recognition error:', event.error);
          if (silenceTimer) clearTimeout(silenceTimer);
          
          // Handle different errors
          if (event.error === 'no-speech') {
            // Don't reject immediately, maybe speech is coming
            console.log('Waiting for speech...');
            return;
          }
          
          if (event.error === 'aborted') {
            // User stopped intentionally
            if (this.finalTranscript.trim()) {
              resolve({ text: this.finalTranscript.trim(), confidence: 0.8 });
            }
            return;
          }
          
          this.isListening = false;
          
          // If we have some speech, return it
          if (this.finalTranscript.trim()) {
            resolve({ text: this.finalTranscript.trim(), confidence: 0.7 });
            return;
          }
          
          reject(new Error(this.getErrorMessage(event.error)));
        };

        recognition.onend = () => {
          console.log('Recognition ended');
          this.isListening = false;
          if (silenceTimer) clearTimeout(silenceTimer);
          
          // If we have speech and it ended naturally
          if (hasSpeech && this.finalTranscript.trim()) {
            resolve({ text: this.finalTranscript.trim(), confidence: 0.9 });
          } else if (!hasSpeech && this.finalTranscript.trim()) {
            resolve({ text: this.finalTranscript.trim(), confidence: 0.8 });
          }
        };

        // Start recognition
        recognition.start();
        console.log('Starting recognition...');
        
        // Safety timeout - 30 seconds max
        setTimeout(() => {
          if (this.isListening) {
            console.log('Max time reached');
            this.stopListening();
            if (this.finalTranscript.trim()) {
              resolve({ text: this.finalTranscript.trim(), confidence: 0.8 });
            } else {
              reject(new Error('No speech detected in 30 seconds'));
            }
          }
        }, 30000);
        
      } catch (error) {
        console.error('Setup error:', error);
        this.isListening = false;
        reject(error);
      }
    });
  }

  getErrorMessage(error) {
    const errors = {
      'no-speech': 'No speech was detected. Please try again.',
      'audio-capture': 'No microphone was found. Please check your device.',
      'not-allowed': 'Microphone permission was denied. Please allow access.',
      'network': 'Network error occurred. Please check your connection.',
      'service-not-allowed': 'Speech recognition service is not allowed.',
      'bad-grammar': 'Grammar error in speech recognition.',
      'language-not-supported': 'Selected language is not supported.'
    };
    return errors[error] || 'Speech recognition error: ' + error;
  }

  stopListening() {
    if (this.recognition) {
      try {
        this.recognition.stop();
        console.log('Recognition stopped manually');
      } catch (e) {
        console.log('Error stopping:', e);
      }
      this.isListening = false;
    }
  }

  abortListening() {
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch (e) {
        console.log('Error aborting:', e);
      }
      this.isListening = false;
    }
  }

  // Text to speech (unchanged)
  speak(text, language = 'zh-CN') {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      this.synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      
      if (language === 'zh-CN' || language === 'zh') {
        utterance.lang = 'zh-CN';
        utterance.rate = 0.85;
      } else {
        utterance.lang = 'en-US';
        utterance.rate = 0.95;
      }

      const voices = this.synthesis.getVoices();
      if (voices.length > 0) {
        const preferredVoice = voices.find(voice => 
          voice.lang.startsWith(language.split('-')[0])
        );
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
      }

      utterance.onend = () => {
        this.isSpeaking = false;
        resolve();
      };

      utterance.onerror = (event) => {
        this.isSpeaking = false;
        reject(event);
      };

      this.isSpeaking = true;
      this.synthesis.speak(utterance);
    });
  }

  stopSpeaking() {
    if (this.synthesis && this.isSpeaking) {
      this.synthesis.cancel();
      this.isSpeaking = false;
    }
  }
}

const voiceService = new VoiceService();
export default voiceService;