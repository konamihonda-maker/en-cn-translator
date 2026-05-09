export function checkSpeechSupport() {
  const speechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (!speechRecognition) {
    return {
      supported: false,
      message: 'Speech recognition is not supported in this browser. Please use Chrome or Microsoft Edge.'
    };
  }

  // Check for HTTPS (required for speech recognition)
  if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
    return {
      supported: false,
      message: 'Speech recognition requires HTTPS. Please use a secure connection.'
    };
  }

  return {
    supported: true,
    message: ''
  };
}

export function checkMicrophonePermission() {
  return navigator.permissions 
    ? navigator.permissions.query({ name: 'microphone' })
    : Promise.resolve({ state: 'prompt' });
}