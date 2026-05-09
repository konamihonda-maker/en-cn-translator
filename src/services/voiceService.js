// Mobile-friendly voice service
class VoiceService {
  constructor() {
    this.recognition = null;
    this.synthesis = window.speechSynthesis;
    this.isListening = false;
    this.finalTranscript = '';
  }

  startListening(language = 'en-US') {
    return new Promise((resolve, reject) => {
      // Check support
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        reject(new Error('Speech recognition not supported in this browser. Try Chrome.'));
        return;
      }

      try {
        // Request microphone permission explicitly for mobile
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then(() => {
            console.log('Microphone access granted');
          })
          .catch(() => {
            reject(new Error('Microphone access denied. Please allow microphone in browser settings.'));
            return;
          });

        this.recognition = new SpeechRecognition();
        this.finalTranscript = '';
        
        // Mobile-optimized settings
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 1;
        this.recognition.lang = language;
        
        let silenceTimer = null;
        let hasSpeech = false;

        // Handle results
        this.recognition.onresult = (event) => {
          let interimTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            if (result.isFinal) {
              this.finalTranscript += result[0].transcript + ' ';
              hasSpeech = true;
            } else {
              interimTranscript += result[0].transcript;
            }
          }
          
          const displayText = (this.finalTranscript + interimTranscript).trim();
          console.log('Speech:', displayText);
          
          // Tell parent about interim results
          if (this.onInterimResult && displayText) {
            this.onInterimResult(displayText);
          }
          
          // Reset silence timer
          if (silenceTimer) clearTimeout(silenceTimer);
          
          // Auto-stop after 3 seconds of silence
          silenceTimer = setTimeout(() => {
            if (this.isListening && hasSpeech && this.finalTranscript.trim()) {
              this.stopListening();
              resolve({ text: this.finalTranscript.trim() });
            }
          }, 3000);
        };

        // Handle errors
        this.recognition.onerror = (event) => {
          console.error('Speech error:', event.error);
          
          if (silenceTimer) clearTimeout(silenceTimer);
          
          // On mobile, 'no-speech' might just be a pause
          if (event.error === 'no-speech' && !hasSpeech) {
            // Wait a bit, maybe speech is coming
            return;
          }
          
          if (event.error === 'aborted') {
            if (this.finalTranscript.trim()) {
              resolve({ text: this.finalTranscript.trim() });
              return;
            }
          }
          
          this.isListening = false;
          
          // If we have some speech, return it
          if (this.finalTranscript.trim()) {
            resolve({ text: this.finalTranscript.trim() });
          } else {
            reject(new Error('No speech detected. Tap the button and speak clearly.'));
          }
        };

        // Handle end of speech
        this.recognition.onend = () => {
          console.log('Speech ended');
          this.isListening = false;
          
          if (silenceTimer) clearTimeout(silenceTimer);
          
          if (hasSpeech && this.finalTranscript.trim()) {
            resolve({ text: this.finalTranscript.trim() });
          } else if (!hasSpeech) {
            reject(new Error('No speech detected. Please try again.'));
          }
        };

        // Start listening
        this.recognition.start();
        this.isListening = true;
        console.log('Listening started...');
        
        // Safety timeout - 15 seconds max
        setTimeout(() => {
          if (this.isListening) {
            this.stopListening();
            if (this.finalTranscript.trim()) {
              resolve({ text: this.finalTranscript.trim() });
            } else {
              reject(new Error('Listening timeout. Please try again.'));
            }
          }
        }, 15000);
        
      } catch (error) {
        console.error('Setup error:', error);
        this.isListening = false;
        reject(error);
      }
    });
  }

  stopListening() {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        console.log('Stop error:', e);
      }
      this.isListening = false;
    }
  }

  speak(text, language = 'zh-CN') {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      this.synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      utterance.rate = 0.9;
      
      // Need to wait for voices to load on mobile
      const setVoice = () => {
        const voices = this.synthesis.getVoices();
        if (voices.length > 0) {
          const voice = voices.find(v => v.lang.startsWith(language.split('-')[0]));
          if (voice) utterance.voice = voice;
        }
      };
      
      setVoice();
      this.synthesis.onvoiceschanged = setVoice;

      utterance.onend = () => {
        this.isSpeaking = false;
        resolve();
      };

      utterance.onerror = () => {
        this.isSpeaking = false;
        resolve(); // Don't reject, just finish
      };

      this.isSpeaking = true;
      this.synthesis.speak(utterance);
    });
  }

  stopSpeaking() {
    if (this.synthesis) {
      this.synthesis.cancel();
      this.isSpeaking = false;
    }
  }
}

const voiceService = new VoiceService();
export default voiceService;