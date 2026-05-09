import './LanguageSwitch.css';

function LanguageSwitch({ direction, onToggle }) {
  return (
    <div className="language-switch">
      <button 
        className={`lang-option ${direction === 'en-zh' ? 'active' : ''}`}
        onClick={() => direction !== 'en-zh' && onToggle()}
      >
        <span className="lang-flag">🇬🇧</span>
        <span className="lang-name">English</span>
        <span className="lang-arrow">→</span>
        <span className="lang-flag">🇨🇳</span>
        <span className="lang-name">Chinese</span>
      </button>
      
      <button 
        className="switch-btn"
        onClick={onToggle}
        title="Switch translation direction"
      >
        <svg viewBox="0 0 24 24" width="24" height="24">
          <path fill="currentColor" d="M16,17.01V10H14V17.01H11L15,21L19,17.01H16ZM9,3L5,6.99H8V14H10V6.99H13L9,3Z"/>
        </svg>
      </button>
      
      <button 
        className={`lang-option ${direction === 'zh-en' ? 'active' : ''}`}
        onClick={() => direction !== 'zh-en' && onToggle()}
      >
        <span className="lang-flag">🇨🇳</span>
        <span className="lang-name">Chinese</span>
        <span className="lang-arrow">→</span>
        <span className="lang-flag">🇬🇧</span>
        <span className="lang-name">English</span>
      </button>
    </div>
  );
}

export default LanguageSwitch;