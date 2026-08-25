import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getUserProfile, getAuth, clearAuth } from '../utils/storage';
import { speak } from '../utils/VoiceManager';
import { useNavigate } from 'react-router-dom';

const HOME_BUTTONS = [
  { path: '/games', icon: '🧩', label: 'Cognitive Games', color: '#2E86AB' },
  { path: '/progress', icon: '📊', label: 'My Progress', color: '#48BF84' },
  { path: '#voice', icon: '🎙', label: 'Voice Assistant', color: '#9B59B6', isVoice: true },
  { path: '/profile', icon: '👤', label: 'My Profile', color: '#E67E22' },
  { path: '/settings', icon: '⚙', label: 'Settings', color: '#5D6D7E' },
];

export default function Home() {
  const [profile, setProfile] = useState({ name: '' });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [greeting, setGreeting] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    setProfile(getUserProfile());
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleVoiceAssistant = () => {
    speak('Welcome to CognitiveCare. Choose a game or section.');
  };

  const auth = getAuth();
  const displayName = profile.name || auth?.displayName || 'Friend';

  return (
    <div className="home-page">
      <div className="home-hero">
        <div className="home-logo-wrap">
          <div className="home-logo">🧠</div>
        </div>
        <h1 className="home-title">CognitiveCare</h1>
        <p className="home-tagline">Exercise your memory every day</p>
      </div>

      <div className="home-greeting-section">
        <div className="home-welcome">
          {greeting}, {displayName}
        </div>
        <span className={`status-badge ${isOnline ? 'status-online' : 'status-offline'}`}>
          {isOnline ? '🟢 Online' : '🟠 Offline Mode'}
        </span>
      </div>

      <div className="home-buttons">
        {HOME_BUTTONS.map((btn) =>
          btn.isVoice ? (
            <button key={btn.label} className="home-btn" onClick={handleVoiceAssistant}
              style={{ '--btn-color': btn.color }}>
              <span className="btn-icon-emoji" style={{ background: btn.color + '15', color: btn.color }}>{btn.icon}</span>
              <span>{btn.label}</span>
              <span className="btn-arrow">›</span>
            </button>
          ) : (
            <Link key={btn.path} to={btn.path} style={{ textDecoration: 'none' }}>
              <div className="home-btn" style={{ '--btn-color': btn.color }}>
                <span className="btn-icon-emoji" style={{ background: btn.color + '15', color: btn.color }}>{btn.icon}</span>
                <span>{btn.label}</span>
                <span className="btn-arrow">›</span>
              </div>
            </Link>
          )
        )}
      </div>

      <div className="home-disclaimer">
        Designed to support cognitive engagement, memory practice, and daily mental activities.
        <br />
        This is not a medical diagnostic or treatment tool.
      </div>
    </div>
  );
}
