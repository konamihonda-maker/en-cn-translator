import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('SW registered');
      })
      .catch(err => {
        console.log('SW registration failed:', err);
      });
  });
}

// Prevent double-tap zoom on buttons
document.addEventListener('dblclick', function(e) {
  if (e.target.tagName === 'BUTTON') {
    e.preventDefault();
  }
}, { passive: false });

// Fix iOS viewport height issue
function setVH() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

window.addEventListener('resize', setVH);
window.addEventListener('orientationchange', setVH);
setVH();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)