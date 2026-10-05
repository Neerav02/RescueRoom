import { useState, useEffect } from 'react';
import { logoutUser } from '../lib/cometchat';

export default function Navbar({ currentUser, onLogout, onSwitchUser }) {
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
    <header
      style={{
        borderBottom: 'var(--border-ink-thick)',
        backgroundColor: 'var(--color-bone)',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 2px 0 var(--color-ink)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Brand & System Code */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
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
            }}
          >
            RESCUEROOM
          </a>
        </div>

        {currentUser && (
          <div
            style={{
              borderLeft: 'var(--border-ink)',
              paddingLeft: '14px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <span className="mono" style={{ fontSize: '0.68rem', color: 'var(--color-ink-muted)' }}>
              ACTIVE WORKSPACE
            </span>
            <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--color-ink)' }}>
              {currentUser.companyName}
            </span>
          </div>
        )}
      </div>

      {/* Clock, Status & User Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        {/* Monospace System Clock */}
        <div
          className="paper-card"
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

        {currentUser ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              className="paper-card"
              style={{
                padding: '6px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                backgroundColor: 'var(--color-paper-light)',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                  <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{currentUser.name}</span>
                </div>
                <div className="mono" style={{ fontSize: '0.68rem', color: 'var(--color-ink-muted)' }}>
                  CALLSIGN: {currentUser.callsign}
                </div>
              </div>
            </div>

            <button
              onClick={onSwitchUser}
              className="btn btn-hazard"
              style={{ padding: '7px 12px', fontSize: '0.78rem' }}
              title="Switch demo persona or company"
            >
              SWITCH USER
            </button>

            <button
              onClick={handleLogout}
              className="btn"
              style={{ padding: '7px 12px', fontSize: '0.78rem' }}
              title="Log out of CometChat"
            >
              LOGOUT
            </button>
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
