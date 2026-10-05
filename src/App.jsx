import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import OperatorPage from './pages/OperatorPage';
import TriageBoardPage from './pages/TriageBoardPage';
import RoomPage from './pages/RoomPage';
import ServiceReportPage from './pages/ServiceReportPage';
import { initCometChat, ensureUserLoggedIn } from './lib/cometchat';

function AppContent() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = sessionStorage.getItem('rescueroom_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Ensure CometChat SDK is initialized and session restored on startup
  useEffect(() => {
    async function syncAuth() {
      await initCometChat();
      if (currentUser) {
        await ensureUserLoggedIn(currentUser);
      }
    }
    syncAuth().catch((err) => {
      console.warn('Initial CometChat init notice:', err);
    });
  }, [currentUser]);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    sessionStorage.setItem('rescueroom_user', JSON.stringify(user));
    if (user.role === 'operator') {
      navigate('/operator');
    } else {
      navigate('/board');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('rescueroom_user');
    navigate('/login');
  };

  const handleSwitchUser = () => {
    navigate('/login');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        position: 'relative',
      }}
    >
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        onSwitchUser={handleSwitchUser}
      />

      <main style={{ flex: 1, display: 'flex', width: '100%' }}>
        <Routes>
          <Route
            path="/login"
            element={<LoginPage onLoginSuccess={handleLoginSuccess} />}
          />
          <Route
            path="/operator"
            element={
              currentUser ? (
                <OperatorPage currentUser={currentUser} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/board"
            element={
              currentUser ? (
                <TriageBoardPage currentUser={currentUser} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/room/:guid"
            element={
              currentUser ? (
                <RoomPage currentUser={currentUser} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/report/:guid"
            element={
              currentUser ? (
                <ServiceReportPage currentUser={currentUser} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="*"
            element={
              currentUser ? (
                <Navigate
                  to={currentUser.role === 'operator' ? '/operator' : '/board'}
                  replace
                />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
      </main>

      <footer
        style={{
          borderTop: 'var(--border-ink)',
          padding: '12px 32px',
          backgroundColor: 'var(--color-bone)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <span className="mono" style={{ fontSize: '0.78rem', color: 'var(--color-ink-muted)' }}>
          RESCUEROOM LIVE PLATFORM · MULTI-TENANT INCIDENT INFRASTRUCTURE
        </span>
        <span className="mono" style={{ fontSize: '0.78rem', color: 'var(--color-ink-muted)' }}>
          COMETCHAT PROTOCOL ACTIVE · FIELD MANUAL AESTHETIC
        </span>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
