import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Header, { Navigation } from './components/Navigation';
import Login from './pages/Login';
import Home from './pages/Home';
import GamesDashboard from './pages/GamesDashboard';
import MyDayMyWay from './pages/MyDayMyWay';
import WhoIsThis from './pages/WhoIsThis';
import FamilyIdentification from './pages/FamilyIdentification';
import FamilyManager from './pages/FamilyManager';
import FindItBeforeIForget from './pages/FindItBeforeIForget';
import PatternReplay from './pages/PatternReplay';
import Progress from './pages/Progress';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import { getSettings, getAuth } from './utils/storage';

function AuthGuard({ children }) {
  if (!getAuth()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  const [authKey, setAuthKey] = useState(0);

  useEffect(() => {
    const settings = getSettings();
    document.body.classList.remove('font-size-medium', 'font-size-large', 'font-size-extra-large', 'high-contrast');
    if (settings.fontSize) {
      document.body.classList.add('font-size-' + settings.fontSize);
    }
    if (settings.highContrast) {
      document.body.classList.add('high-contrast');
    }
  }, []);

  const handleLogin = () => setAuthKey(k => k + 1);

  return (
    <BrowserRouter>
      <div className="app-container">
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="*" element={
            <AuthGuard>
              <Header />
              <main className="main-content">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/games" element={<GamesDashboard />} />
                  <Route path="/games/my-day-my-way" element={<MyDayMyWay />} />
                  <Route path="/games/who-is-this" element={<WhoIsThis />} />
                  <Route path="/games/family-identification" element={<FamilyIdentification />} />
                  <Route path="/games/family-manager" element={<FamilyManager />} />
                  <Route path="/games/find-it-before-i-forget" element={<FindItBeforeIForget />} />
                  <Route path="/games/pattern-replay" element={<PatternReplay />} />
                  <Route path="/progress" element={<Progress />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </main>
              <Navigation />
            </AuthGuard>
          } />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
