import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveAuth, getAuth } from '../utils/storage';
import { speak } from '../utils/VoiceManager';

const DEMO_CREDENTIALS = [
  { username: 'admin', password: 'admin123', role: 'Caregiver', displayName: 'Caregiver' },
  { username: 'patient', password: 'patient', role: 'Patient', displayName: 'Patient' },
];

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showSetup, setShowSetup] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', password: '', displayName: '', role: 'Patient' });
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    const savedAuth = getAuth();
    if (savedAuth && savedAuth.username === username && savedAuth.password === password) {
      navigate('/');
      return;
    }

    const match = DEMO_CREDENTIALS.find(c => c.username === username && c.password === password);
    if (match) {
      saveAuth({ username: match.username, role: match.role, displayName: match.displayName });
      speak('Welcome to LifeReplay games, ' + match.displayName);
      navigate('/');
    } else {
      setError('Invalid username or password. Try: admin / admin123');
    }
  };

  const handleSetup = (e) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password) {
      setError('Please fill in all fields.');
      return;
    }
    saveAuth({ username: newUser.username, role: newUser.role, displayName: newUser.username });
    speak('Account created. Welcome to LifeReplay games.');
    navigate('/');
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-brand">
          <div className="login-logo">🧠</div>
          <h1 className="login-title">LifeReplay games</h1>
          <p className="login-tagline">Exercise your memory every day</p>
        </div>

        {!showSetup ? (
          <form className="login-form" onSubmit={handleLogin}>
            <div className="login-card">
              <h2 className="login-heading">Welcome Back</h2>
              <p className="login-subtext">Sign in to continue</p>

              {error && <div className="login-error">{error}</div>}

              <div className="form-group">
                <label>Username</label>
                <input
                  className="form-input"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  autoComplete="username"
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  className="form-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  autoComplete="current-password"
                />
              </div>

              <button className="btn btn-primary btn-full btn-large" type="submit">
                Sign In
              </button>

              <div className="login-demo">
                <p>Demo accounts:</p>
                <div className="demo-accounts">
                  <button type="button" className="demo-btn" onClick={() => { setUsername('admin'); setPassword('admin123'); }}>
                    <span className="demo-role">Caregiver</span>
                    <span className="demo-creds">admin / admin123</span>
                  </button>
                  <button type="button" className="demo-btn" onClick={() => { setUsername('patient'); setPassword('patient'); }}>
                    <span className="demo-role">Patient</span>
                    <span className="demo-creds">patient / patient</span>
                  </button>
                </div>
              </div>

              <div className="login-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowSetup(true)}>
                  Create New Account
                </button>
              </div>
            </div>
          </form>
        ) : (
          <form className="login-form" onSubmit={handleSetup}>
            <div className="login-card">
              <h2 className="login-heading">Create Account</h2>
              <p className="login-subtext">Set up a new user</p>

              {error && <div className="login-error">{error}</div>}

              <div className="form-group">
                <label>Username</label>
                <input
                  className="form-input"
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  placeholder="Choose a username"
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  className="form-input"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Choose a password"
                />
              </div>

              <div className="form-group">
                <label>Role</label>
                <select
                  className="form-select"
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                >
                  <option value="Patient">Patient</option>
                  <option value="Caregiver">Caregiver</option>
                </select>
              </div>

              <button className="btn btn-primary btn-full btn-large" type="submit">
                Create Account
              </button>

              <div className="login-footer">
                <button type="button" className="btn btn-ghost" onClick={() => { setShowSetup(false); setError(''); }}>
                  Back to Sign In
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="login-disclaimer">
          Designed to support cognitive engagement, memory practice, and daily mental activities.
          <br />This is not a medical diagnostic or treatment tool.
        </div>
      </div>
    </div>
  );
}
