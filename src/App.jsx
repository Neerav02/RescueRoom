import { useEffect, useState } from 'react';
import { initCometChat, COMETCHAT_CONFIG } from './lib/cometchat';

export default function App() {
  const [initStatus, setInitStatus] = useState({
    loading: true,
    success: false,
    error: null,
  });

  useEffect(() => {
    async function init() {
      try {
        await initCometChat();
        setInitStatus({ loading: false, success: true, error: null });
      } catch (err) {
        setInitStatus({
          loading: false,
          success: false,
          error: err?.message || 'Failed to initialize CometChat SDK',
        });
      }
    }
    init();
  }, []);

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '32px 20px 60px' }}>
      {/* Top Field Dispatch Header */}
      <header
        style={{
          borderBottom: 'var(--border-ink-thick)',
          paddingBottom: '16px',
          marginBottom: '28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span className="stamp stamp-critical">EMERGENCY DISPATCH</span>
            <span className="mono" style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)' }}>
              FIELD MANUAL PROTOCOL 01
            </span>
          </div>
          <h1 style={{ fontSize: '2.5rem', margin: 0, letterSpacing: '-0.03em' }}>
            RESCUEROOM
          </h1>
          <p className="mono" style={{ fontSize: '0.9rem', color: 'var(--color-ink-muted)', marginTop: '4px' }}>
            LIVE EQUIPMENT INCIDENT PLATFORM · RUNTIME VERIFICATION
          </p>
        </div>

        {/* CometChat Connection Status Tag */}
        <div
          className="paper-card"
          style={{
            padding: '12px 18px',
            backgroundColor: initStatus.success ? 'var(--color-paper-light)' : 'var(--color-paper-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <span
            className="presence-dot"
            style={{
              backgroundColor: initStatus.loading
                ? 'var(--color-hazard)'
                : initStatus.success
                ? 'var(--color-teal)'
                : 'var(--color-vermilion)',
            }}
          />
          <div>
            <div className="mono" style={{ fontSize: '0.72rem', color: 'var(--color-ink-muted)' }}>
              COMETCHAT ENGINE
            </div>
            <div className="mono" style={{ fontSize: '0.88rem', fontWeight: 700 }}>
              {initStatus.loading && 'INITIALIZING...'}
              {initStatus.success && `ONLINE · REGION [${COMETCHAT_CONFIG.REGION.toUpperCase()}]`}
              {initStatus.error && 'INIT FAILED'}
            </div>
          </div>
        </div>
      </header>

      {/* Hazard Banner */}
      <div className="hazard-tape" style={{ height: '14px', marginBottom: '28px' }} />

      {/* System Status Message */}
      {initStatus.success && (
        <div
          className="paper-card"
          style={{
            backgroundColor: 'var(--color-paper-light)',
            marginBottom: '32px',
            borderLeft: '8px solid var(--color-teal)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--color-teal)', fontWeight: 700 }}>
                ● SYSTEM READY · PROMPT 1 COMPLETE
              </div>
              <h2 style={{ fontSize: '1.3rem', marginTop: '4px' }}>
                Field Manual Design System & CometChat SDK Initialized
              </h2>
              <p style={{ marginTop: '4px', fontSize: '0.95rem' }}>
                Custom UI running directly on <code className="mono">@cometchat/chat-sdk-javascript</code>. No Tailwind, no component library, 100% bespoke design system.
              </p>
            </div>
            <span className="stamp stamp-resolved">VERIFIED</span>
          </div>
        </div>
      )}

      {initStatus.error && (
        <div
          className="paper-card"
          style={{
            backgroundColor: '#FFECE8',
            borderColor: 'var(--color-vermilion)',
            marginBottom: '32px',
            borderLeft: '8px solid var(--color-vermilion)',
          }}
        >
          <span className="stamp stamp-critical">CONFIG ERROR</span>
          <p className="mono" style={{ marginTop: '8px', color: 'var(--color-vermilion)' }}>
            {initStatus.error}
          </p>
        </div>
      )}

      {/* Grid: Design Tokens & Palette */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        {/* Palette Card */}
        <div className="paper-card">
          <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)', marginBottom: '8px' }}>
            PALETTE REFERENCE // SPECIFICATION
          </div>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>6-Color Custom Palette</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            {[
              { label: 'Bone (Background)', code: '#EFE8D8', bg: 'var(--color-bone)', text: 'var(--color-ink)' },
              { label: 'Ink (Text/Borders)', code: '#1C1B18', bg: 'var(--color-ink)', text: '#FFFFFF' },
              { label: 'Vermilion (Alert)', code: '#E4421E', bg: 'var(--color-vermilion)', text: '#FFFFFF' },
              { label: 'Teal (Calm/Resolved)', code: '#1F6F68', bg: 'var(--color-teal)', text: '#FFFFFF' },
              { label: 'Hazard (Yellow)', code: '#F2B705', bg: 'var(--color-hazard)', text: 'var(--color-ink)' },
              { label: 'Dark Panel (Calls)', code: '#14201F', bg: 'var(--color-dark-panel)', text: '#FFFFFF' },
            ].map((c) => (
              <div
                key={c.code}
                style={{
                  border: 'var(--border-ink)',
                  boxShadow: 'var(--shadow-hard-sm)',
                  backgroundColor: c.bg,
                  color: c.text,
                  padding: '10px 12px',
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>{c.label}</div>
                <div className="mono" style={{ fontSize: '0.75rem', opacity: 0.9 }}>{c.code}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Signature Elements Preview Card */}
        <div className="paper-card">
          <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)', marginBottom: '8px' }}>
            SIGNATURE ELEMENTS // TACTILE TOKENS
          </div>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Physical Controls & Stamps</h3>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
            <span className="stamp stamp-critical">CRITICAL</span>
            <span className="stamp stamp-serious">SERIOUS</span>
            <span className="stamp stamp-minor">MINOR</span>
            <span className="stamp stamp-resolved">RESOLVED</span>
            <span className="stamp">STAMP PROTOCOL</span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <button className="btn btn-vermilion">Alert Button</button>
            <button className="btn btn-teal">Resolved</button>
            <button className="btn btn-hazard">Warning</button>
            <button className="btn btn-dark">Dark Panel</button>
          </div>
        </div>
      </div>

      {/* Emergency Button Teaser */}
      <div className="paper-card" style={{ marginBottom: '32px' }}>
        <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)', marginBottom: '8px' }}>
          PROMPT 3 SIGNATURE TRIGGER PREVIEW
        </div>
        <button className="btn-emergency">
          ⚠ SOMETHING'S WRONG
        </button>
      </div>

      {/* Footer Info */}
      <footer
        style={{
          borderTop: 'var(--border-ink)',
          paddingTop: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <span className="mono" style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)' }}>
          RESCUEROOM BUILD KIT · ANTIGRAVITY ENGINE
        </span>
        <span className="mono" style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)' }}>
          APP ID: {COMETCHAT_CONFIG.APP_ID.slice(0, 8)}... | AUTH KEY: {COMETCHAT_CONFIG.AUTH_KEY ? 'CONFIGURED ✓' : 'MISSING ✗'}
        </span>
      </footer>
    </div>
  );
}
