const DEBUG = true; // Set to false in production

export function log(...args) {
  if (DEBUG) {
    console.log('[Translator]', ...args);
  }
}

export function logError(...args) {
  if (DEBUG) {
    console.error('[Translator Error]', ...args);
  }
}

export function logOCR(...args) {
  if (DEBUG) {
    console.log('[OCR]', ...args);
  }
}