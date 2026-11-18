import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { logoutUser } from '../lib/cometchat';

export default function Navbar({ currentUser, onLogout, onSwitchUser }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    function updateClock() {
      const now = new Date();
      setTimeStr(
        now.toISOString().substring(11, 19) + ' UTC · ' + 
        now.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase()
      );
    }
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (e) {
      console.warn("Logout error:", e);
    }
    onLogout();
  };

  return (
    <header className="navbar-header">
      {/* Brand & System Code */}
      <div className="navbar-brand-section">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="stamp stamp-critical" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
              INCIDENT COMMAND
            </span>
            <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--color-ink-muted)' }}>
              SYS-VER 4.2
            </span>
          </div>
          <a
            href="/"
            onClick={(e) => {
              if (onSwitchUser) {
                e.preventDefault();
                onSwitchUser();
              }
            }}
            style={{
              textDecoration: 'none',
              color: 'var(--color-ink)',
              fontSize: '1.75rem',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              display: 'inline-flex',
              alignItems: 'center',
              minHeight: '44px',
            }}
          >
            RESCUEROOM
          </a>
        </div>

        {currentUser && (
          <div className="navbar-workspace-badge">
            <span className="mono" style={{ fontSize: '0.68rem', color: 'var(--color-ink-muted)' }}>
              ACTIVE WORKSPACE
            </span>
            <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--color-ink)' }}>
              {currentUser.companyName}
            </span>
          </div>
        )}

        {currentUser && (
          <nav className="navbar-nav-links" aria-label="Main Navigation">
            <button
              onClick={() => navigate('/board')}
              className={`btn ${location.pathname === '/board' ? 'btn-hazard' : ''}`}
              style={{ padding: '6px 10px', fontSize: '0.76rem' }}
            >
              TRIAGE BOARD
            </button>
            <button
              onClick={() => navigate('/operator')}
              className={`btn ${location.pathname === '/operator' ? 'btn-hazard' : ''}`}
              style={{ padding: '6px 10px', fontSize: '0.76rem' }}
            >
              OPERATOR
            </button>
            <button
              onClick={() => navigate('/twin')}
              className={`btn ${location.pathname === '/twin' ? 'btn-hazard' : ''}`}
              style={{
                padding: '6px 10px',
                fontSize: '0.76rem',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
              title="Open 3D Exploded Digital Twin & Subsystem Inspector"
            >
              <span style={{ color: 'var(--color-cad-active)' }}>◈</span>
              <span>3D DIGITAL TWIN</span>
            </button>
          </nav>
        )}
      </div>

      {/* Clock, Status & User Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {/* Monospace System Clock */}
        <div
          className="paper-card navbar-clock-card"
          style={{
            padding: '6px 12px',
            backgroundColor: 'var(--color-paper-light)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span className="presence-dot" title="Network Connected" />
          <span className="mono" style={{ fontSize: '0.78rem', fontWeight: 600 }}>
            {timeStr}
          </span>
        </div>

        {/* AI Co-Pilot Status Badge */}
        <div
          className="paper-card navbar-ai-badge"
          style={{
            padding: '6px 10px',
            backgroundColor: 'var(--color-paper-light)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.74rem',
            fontWeight: 700,
            border: 'var(--border-ink)',
          }}
          title="Google Gemini Machinery Failure Analysis Engine"
        >
          <span>🤖</span>
          <span>RESCUE-AI ONLINE</span>
        </div>

        {currentUser ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', minWidth: 0 }}>
            <div
              className="paper-card"
              style={{
                padding: '6px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'var(--color-paper-light)',
                minWidth: 0,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span
                    className={`stamp ${
                      currentUser.role === 'operator'
                        ? 'stamp-critical'
                        : currentUser.role === 'mechanic'
                        ? 'stamp-serious'
                        : 'stamp-minor'
                    }`}
                    style={{ fontSize: '0.65rem', padding: '2px 5px' }}
                  >
                    {currentUser.role.toUpperCase()}
                  </span>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem', wordBreak: 'break-word' }}>{currentUser.name}</span>
                </div>
                <div className="mono" style={{ fontSize: '0.68rem', color: 'var(--color-ink-muted)' }}>
                  CALLSIGN: {currentUser.callsign}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              <button
                onClick={onSwitchUser}
                className="btn btn-hazard"
                style={{ padding: '6px 10px', fontSize: '0.74rem' }}
                title="Switch demo persona or company"
              >
                SWITCH USER
              </button>

              <button
                onClick={handleLogout}
                className="btn"
                style={{ padding: '6px 10px', fontSize: '0.74rem' }}
                title="Log out of CometChat"
              >
                LOGOUT
              </button>
            </div>
          </div>
        ) : (
          <div className="mono" style={{ fontSize: '0.78rem', color: 'var(--color-ink-muted)' }}>
            AUTHENTICATION REQUIRED · PLEASE SELECT OPERATIONAL ROSTER
          </div>
        )}
      </div>
    </header>
  );
}
