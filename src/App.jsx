import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import { initCometChat, ensureUserLoggedIn } from './lib/cometchat';

// Route-based code splitting: Lazy-load pages on demand to reduce initial bundle footprint
const LoginPage = lazy(() => import('./pages/LoginPage'));
const OperatorPage = lazy(() => import('./pages/OperatorPage'));
const TriageBoardPage = lazy(() => import('./pages/TriageBoardPage'));
const RoomPage = lazy(() => import('./pages/RoomPage'));
const ServiceReportPage = lazy(() => import('./pages/ServiceReportPage'));
const DigitalTwinPage = lazy(() => import('./pages/DigitalTwinPage'));

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' ? window.innerWidth > 900 : true
  );

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth > 900);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isFixedViewport = (location.pathname.startsWith('/twin') || location.pathname.startsWith('/room')) && isDesktop;
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
        height: isFixedViewport ? '100vh' : 'auto',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        position: 'relative',
        overflow: isFixedViewport ? 'hidden' : 'visible',
      }}
    >
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        onSwitchUser={handleSwitchUser}
      />

      <main style={{ flex: 1, minHeight: 0, display: 'flex', width: '100%', overflow: isFixedViewport ? 'hidden' : 'auto' }}>
        <Suspense
          fallback={
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                width: '100%',
                padding: '60px 16px',
              }}
            >
              <div
                className="paper-card mono"
                style={{
                  padding: '24px 32px',
                  textAlign: 'center',
                  backgroundColor: 'var(--color-paper-light)',
                  border: 'var(--border-ink-thick)',
                  boxShadow: 'var(--shadow-hard)',
                }}
              >
                <span className="stamp stamp-serious" style={{ fontSize: '0.75rem', marginBottom: '8px' }}>
                  FIELD MODULE DISPATCH
                </span>
                <div style={{ fontSize: '0.86rem', fontWeight: 700, marginTop: '8px' }}>
                  INITIALIZING TACTICAL MODULE...
                </div>
              </div>
            </div>
          }
        >
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
              path="/twin"
              element={
                currentUser ? (
                  <DigitalTwinPage currentUser={currentUser} />
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
        </Suspense>
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
