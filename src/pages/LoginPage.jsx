import { useState } from 'react';
import { DEMO_USERS, loginOrProvisionUser } from '../lib/cometchat';

export default function LoginPage({ onLoginSuccess }) {
  const [loadingUid, setLoadingUid] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const northwindUsers = DEMO_USERS.filter((u) => u.companyId === 'northwind');
  const kestrelUsers = DEMO_USERS.filter((u) => u.companyId === 'kestrel');

  const handleSelectUser = async (user) => {
    setLoadingUid(user.uid);
    setErrorMsg(null);
    try {
      console.log(`[RescueRoom] Authenticating ${user.name} (${user.uid})...`);
      await loginOrProvisionUser(user);
      onLoginSuccess(user);
    } catch (err) {
      console.error('[RescueRoom] Login failure:', err);
      setErrorMsg(
        err?.message || 'Authentication error with CometChat. Check your network or credentials.'
      );
    } finally {
      setLoadingUid(null);
    }
  };

  return (
    <div style={{ width: '100%', flex: 1, padding: '32px 32px 64px' }}>
      {/* Centered Top Dispatch Ticker */}
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: '24px',
            borderBottom: 'var(--border-ink)',
            paddingBottom: '16px',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="stamp stamp-serious">ACCESS TERMINAL</span>
              <span className="mono" style={{ fontSize: '0.78rem', color: 'var(--color-ink-muted)' }}>
                STATION ID: CENTRAL-DISPATCH-01
              </span>
            </div>
            <h1 style={{ fontSize: '2.4rem', letterSpacing: '-0.02em', margin: 0 }}>
              SELECT OPERATIONAL ROSTER
            </h1>
            <p style={{ marginTop: '4px', fontSize: '1rem', color: 'var(--color-ink-muted)' }}>
              Choose a personnel persona to authenticate with CometChat. Multi-tenant isolation is strictly enforced per company.
            </p>
          </div>

          {/* Multi-Tenant Security Guarantee Badge */}
          <div
            className="paper-card"
            style={{
              padding: '10px 16px',
              backgroundColor: 'var(--color-paper-light)',
              maxWidth: '440px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="presence-dot" />
              <span className="mono" style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-teal)' }}>
                STRICT TENANT ISOLATION ACTIVE
              </span>
            </div>
            <div className="mono" style={{ fontSize: '0.74rem', color: 'var(--color-ink-muted)', lineHeight: 1.4 }}>
              Personnel & incident rooms are namespaced by company (<code>northwind_*</code> vs <code>kestrel_*</code>). Zero cross-tenant data visibility.
            </div>
          </div>
        </div>

        {/* Error Alert if any */}
        {errorMsg && (
          <div
            className="paper-card"
            style={{
              backgroundColor: '#FFEBE8',
              borderColor: 'var(--color-vermilion)',
              borderLeft: '8px solid var(--color-vermilion)',
              marginBottom: '24px',
            }}
          >
            <span className="stamp stamp-critical">AUTHENTICATION FAILURE</span>
            <p className="mono" style={{ marginTop: '6px', color: 'var(--color-vermilion)' }}>
              {errorMsg}
            </p>
          </div>
        )}

        {/* Dual Company Columns: Northwind Heavy Equipment & Kestrel Logistics */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(560px, 1fr))',
            gap: '32px',
          }}
        >
          {/* Company 1: Northwind Heavy Equipment */}
          <section
            className="paper-card"
            style={{
              backgroundColor: 'var(--color-paper-light)',
              border: 'var(--border-ink-thick)',
              boxShadow: 'var(--shadow-hard-lg)',
              padding: '24px',
            }}
          >
            {/* Company Banner */}
            <div
              style={{
                borderBottom: 'var(--border-ink)',
                paddingBottom: '16px',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span className="stamp stamp-critical">WORKSPACE A</span>
                <span className="mono" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                  FLEET: 24 HEAVY UNITS
                </span>
              </div>
              <h2 style={{ fontSize: '1.6rem', margin: 0 }}>
                Northwind Heavy Equipment
              </h2>
              <div className="mono" style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)', marginTop: '4px' }}>
                SECTOR: SURFACE MINING & HEAVY QUARRY OPERATIONS
              </div>
            </div>

            {/* Personnel Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {northwindUsers.map((user) => {
                const isLoading = loadingUid === user.uid;
                const roleBadgeClass =
                  user.role === 'operator'
                    ? 'stamp-critical'
                    : user.role === 'mechanic'
                    ? 'stamp-serious'
                    : 'stamp-minor';

                return (
                  <div
                    key={user.uid}
                    className="paper-card"
                    style={{
                      padding: '16px 20px',
                      backgroundColor: 'var(--color-bone)',
                      cursor: loadingUid ? 'wait' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'transform 0.1s ease, box-shadow 0.1s ease',
                      border: 'var(--border-ink)',
                    }}
                    onClick={() => !loadingUid && handleSelectUser(user)}
                    onMouseEnter={(e) => {
                      if (!loadingUid) {
                        e.currentTarget.style.transform = 'translate(-2px, -2px)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-hard-lg)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!loadingUid) {
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = 'var(--shadow-hard)';
                      }
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span className={`stamp ${roleBadgeClass}`}>
                          {user.role.toUpperCase()}
                        </span>
                        <span className="mono" style={{ fontSize: '0.74rem', color: 'var(--color-ink-muted)' }}>
                          {user.callsign}
                        </span>
                      </div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                        {user.name}
                      </div>
                      <div className="mono" style={{ fontSize: '0.78rem', color: 'var(--color-ink-muted)' }}>
                        {user.tagline}
                      </div>
                    </div>

                    <div>
                      <button
                        className={`btn ${user.role === 'operator' ? 'btn-vermilion' : 'btn-hazard'}`}
                        style={{ fontSize: '0.82rem', padding: '10px 16px' }}
                        disabled={loadingUid}
                      >
                        {isLoading ? 'CONNECTING...' : 'LOGIN & DISPATCH →'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Equipment Fleet List */}
            <div
              style={{
                marginTop: '20px',
                paddingTop: '16px',
                borderTop: '1px dashed var(--color-ink-subtle)',
              }}
            >
              <span className="mono" style={{ fontSize: '0.74rem', color: 'var(--color-ink-muted)' }}>
                ASSIGNED MACHINERY: Excavator EX-204 · Bulldozer BD-801 · Haul Truck HT-310 · Wheel Loader WL-550
              </span>
            </div>
          </section>

          {/* Company 2: Kestrel Logistics */}
          <section
            className="paper-card"
            style={{
              backgroundColor: 'var(--color-paper-light)',
              border: 'var(--border-ink-thick)',
              boxShadow: 'var(--shadow-hard-lg)',
              padding: '24px',
            }}
          >
            {/* Company Banner */}
            <div
              style={{
                borderBottom: 'var(--border-ink)',
                paddingBottom: '16px',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span className="stamp stamp-teal" style={{ backgroundColor: 'var(--color-teal)', color: '#FFF' }}>
                  WORKSPACE B
                </span>
                <span className="mono" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                  FLEET: 52 LOGISTICS ASSETS
                </span>
              </div>
              <h2 style={{ fontSize: '1.6rem', margin: 0 }}>
                Kestrel Logistics
              </h2>
              <div className="mono" style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)', marginTop: '4px' }}>
                SECTOR: REGIONAL FREIGHT, COLD CHAIN & WAREHOUSING
              </div>
            </div>

            {/* Personnel Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {kestrelUsers.map((user) => {
                const isLoading = loadingUid === user.uid;
                const roleBadgeClass =
                  user.role === 'operator'
                    ? 'stamp-critical'
                    : user.role === 'mechanic'
                    ? 'stamp-serious'
                    : 'stamp-minor';

                return (
                  <div
                    key={user.uid}
                    className="paper-card"
                    style={{
                      padding: '16px 20px',
                      backgroundColor: 'var(--color-bone)',
                      cursor: loadingUid ? 'wait' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'transform 0.1s ease, box-shadow 0.1s ease',
                      border: 'var(--border-ink)',
                    }}
                    onClick={() => !loadingUid && handleSelectUser(user)}
                    onMouseEnter={(e) => {
                      if (!loadingUid) {
                        e.currentTarget.style.transform = 'translate(-2px, -2px)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-hard-lg)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!loadingUid) {
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = 'var(--shadow-hard)';
                      }
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span className={`stamp ${roleBadgeClass}`}>
                          {user.role.toUpperCase()}
                        </span>
                        <span className="mono" style={{ fontSize: '0.74rem', color: 'var(--color-ink-muted)' }}>
                          {user.callsign}
                        </span>
                      </div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                        {user.name}
                      </div>
                      <div className="mono" style={{ fontSize: '0.78rem', color: 'var(--color-ink-muted)' }}>
                        {user.tagline}
                      </div>
                    </div>

                    <div>
                      <button
                        className={`btn ${user.role === 'operator' ? 'btn-vermilion' : 'btn-hazard'}`}
                        style={{ fontSize: '0.82rem', padding: '10px 16px' }}
                        disabled={loadingUid}
                      >
                        {isLoading ? 'CONNECTING...' : 'LOGIN & DISPATCH →'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Equipment Fleet List */}
            <div
              style={{
                marginTop: '20px',
                paddingTop: '16px',
                borderTop: '1px dashed var(--color-ink-subtle)',
              }}
            >
              <span className="mono" style={{ fontSize: '0.74rem', color: 'var(--color-ink-muted)' }}>
                ASSIGNED MACHINERY: Freightliner FL-90 · Telehandler TH-44 · Electric Forklift EF-12 · Cargo Van CV-08
              </span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
