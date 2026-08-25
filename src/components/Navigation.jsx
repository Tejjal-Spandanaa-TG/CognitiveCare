import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getAuth, clearAuth } from '../utils/storage';

const NAV_ITEMS = [
  { path: '/', icon: '🏠', label: 'Home' },
  { path: '/games', icon: '🧩', label: 'Games' },
  { path: '/progress', icon: '📊', label: 'Progress' },
  { path: '/profile', icon: '👤', label: 'Profile' },
  { path: '/settings', icon: '⚙', label: 'Settings' },
];

export default function Header() {
  const auth = getAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <header className="app-header">
      <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
        <h1 className="header-logo">🧠 LifeReplay games</h1>
      </Link>
      <div className="header-actions">
        {auth && (
          <span className="header-user">{auth.displayName || auth.username}</span>
        )}
        <button className="header-btn" onClick={handleLogout} title="Sign Out">
          🚪
        </button>
      </div>
    </header>
  );
}

export function Navigation() {
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
        >
          <span className="nav-icon">{item.icon}</span>
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
