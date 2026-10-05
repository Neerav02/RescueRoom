import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CometChat } from '../lib/cometchat';

export default function TriageBoardPage({ currentUser }) {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());

  // 1-second interval to drive live monospace timers
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch all incidents for this company
  const loadIncidents = async () => {
    if (!currentUser) return;
    try {
      const request = new CometChat.GroupsRequestBuilder()
        .setLimit(50)
        .build();
      const groups = await request.fetchNext();
      
      // Filter for this company's incidents
      const companyGroups = groups.filter((g) => {
        const guid = g.getGuid();
        return guid.startsWith(`${currentUser.companyId}_inc_`);
      });

      // Parse metadata & sort by openedAt
      const parsed = companyGroups.map((g) => {
        let meta = {};
        try {
          meta = typeof g.getMetadata() === 'string' ? JSON.parse(g.getMetadata()) : g.getMetadata() || {};
        } catch {
          meta = g.getMetadata() || {};
        }
        return {
          guid: g.getGuid(),
          name: g.getName(),
          membersCount: g.getMembersCount(),
          severity: meta.severity || 'SERIOUS',
          equipment: meta.equipment || g.getName(),
          description: meta.description || 'Field incident in progress',
          openedAt: meta.openedAt || Date.now() - 300000,
          status: meta.status || 'open',
          operatorCallsign: meta.operatorCallsign || 'OP-LEAD',
          unreadCount: 0,
        };
      });

      setIncidents(parsed);
    } catch (err) {
      console.warn('Error loading triage incidents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncidents();
    // Poll every 5s for real-time triage updates
    const pollInterval = setInterval(loadIncidents, 5000);
    return () => clearInterval(pollInterval);
  }, [currentUser]);

  // Format elapsed time as HH:MM:SS
  const formatTimer = (openedAt) => {
    const diffSec = Math.max(0, Math.floor((now - openedAt) / 1000));
    const hrs = String(Math.floor(diffSec / 3600)).padStart(2, '0');
    const mins = String(Math.floor((diffSec % 3600) / 60)).padStart(2, '0');
    const secs = String(diffSec % 60).padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  // Group open incidents into three columns
  const openIncidents = incidents.filter((i) => i.status !== 'resolved');
  const criticalList = openIncidents.filter((i) => i.severity === 'CRITICAL').sort((a, b) => a.openedAt - b.openedAt);
  const seriousList = openIncidents.filter((i) => i.severity === 'SERIOUS').sort((a, b) => a.openedAt - b.openedAt);
  const minorList = openIncidents.filter((i) => i.severity === 'MINOR').sort((a, b) => a.openedAt - b.openedAt);

  const columns = [
    {
      id: 'CRITICAL',
      title: 'CRITICAL SEVERITY',
      subtitle: 'IMMEDIATE WORK STOPPAGE',
      items: criticalList,
      bannerBg: 'var(--color-vermilion)',
      bannerText: '#FFFFFF',
    },
    {
      id: 'SERIOUS',
      title: 'SERIOUS SEVERITY',
      subtitle: 'REDUCED CAPACITY / RISK',
      items: seriousList,
      bannerBg: 'var(--color-hazard)',
      bannerText: 'var(--color-ink)',
    },
    {
      id: 'MINOR',
      title: 'MINOR ADVISORY',
      subtitle: 'ROUTINE FAULT REPORT',
      items: minorList,
      bannerBg: 'var(--color-paper-light)',
      bannerText: 'var(--color-ink)',
    },
  ];

  return (
    <div style={{ width: '100%', flex: 1, padding: '32px 32px 64px' }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
        {/* Triage Board Top Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: '28px',
            borderBottom: 'var(--border-ink)',
            paddingBottom: '16px',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="stamp stamp-serious">TACTICAL TRIAGE BOARD</span>
              <span className="mono" style={{ fontSize: '0.78rem', color: 'var(--color-ink-muted)' }}>
                {currentUser?.companyName.toUpperCase()} · WORKSPACE
              </span>
            </div>
            <h1 style={{ fontSize: '2.4rem', margin: '4px 0 0' }}>
              INCIDENT COMMAND BOARD
            </h1>
            <p className="mono" style={{ fontSize: '0.88rem', color: 'var(--color-ink-muted)', marginTop: '4px' }}>
              REAL-TIME SEVERITY QUEUE · PINNED PAPER TAGS WITH ACTIVE ELAPSED TIMERS
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {currentUser?.role === 'operator' && (
              <button
                onClick={() => navigate('/operator')}
                className="btn btn-vermilion"
                style={{ fontSize: '0.82rem', padding: '8px 16px' }}
              >
                ⚠ SOMETHING'S WRONG
              </button>
            )}

            <button
              onClick={loadIncidents}
              className="btn btn-hazard"
              style={{ fontSize: '0.82rem', padding: '8px 16px' }}
            >
              ↻ REFRESH BOARD
            </button>
          </div>
        </div>

        {/* The Three Triage Severity Columns */}
        {loading ? (
          <div className="paper-card mono" style={{ textAlign: 'center', padding: '48px' }}>
            SCANNING COMETCHAT INCIDENT QUEUE...
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
              gap: '24px',
            }}
          >
            {columns.map((col) => (
              <div
                key={col.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                {/* Column Pinned Header */}
                <div
                  style={{
                    backgroundColor: col.bannerBg,
                    color: col.bannerText,
                    border: 'var(--border-ink-thick)',
                    boxShadow: 'var(--shadow-hard)',
                    padding: '12px 18px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <h2 style={{ fontSize: '1.25rem', margin: 0 }}>{col.title}</h2>
                    <div className="mono" style={{ fontSize: '0.68rem', opacity: 0.85 }}>
                      {col.subtitle}
                    </div>
                  </div>
                  <span
                    className="stamp"
                    style={{
                      backgroundColor: 'var(--color-bone)',
                      color: 'var(--color-ink)',
                      fontWeight: 800,
                      fontSize: '0.9rem',
                    }}
                  >
                    {col.items.length} ACTIVE
                  </span>
                </div>

                {/* Paper Tags in Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {col.items.length === 0 ? (
                    <div
                      className="paper-card"
                      style={{
                        backgroundColor: 'rgba(239, 232, 216, 0.4)',
                        border: '1px dashed var(--color-ink-subtle)',
                        textAlign: 'center',
                        padding: '32px 16px',
                      }}
                    >
                      <span className="mono" style={{ fontSize: '0.78rem', color: 'var(--color-ink-muted)' }}>
                        NO UNRESOLVED {col.id} INCIDENTS
                      </span>
                    </div>
                  ) : (
                    col.items.map((inc, idx) => {
                      // Oldest waiting incident in each column gets a vermilion highlighted edge
                      const isOldestWaiting = idx === 0;

                      return (
                        <div
                          key={inc.guid}
                          className="paper-card"
                          onClick={() => navigate(`/room/${inc.guid}`)}
                          style={{
                            backgroundColor: 'var(--color-bone)',
                            border: 'var(--border-ink)',
                            borderLeft: isOldestWaiting ? '8px solid var(--color-vermilion)' : 'var(--border-ink)',
                            boxShadow: 'var(--shadow-hard)',
                            padding: '18px 20px',
                            cursor: 'pointer',
                            transition: 'var(--transition-tactile)',
                            position: 'relative',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translate(-2px, -2px)';
                            e.currentTarget.style.boxShadow = 'var(--shadow-hard-lg)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'none';
                            e.currentTarget.style.boxShadow = 'var(--shadow-hard)';
                          }}
                        >
                          {/* Pin / Header Tape Indicator */}
                          {isOldestWaiting && (
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                marginBottom: '8px',
                              }}
                            >
                              <span className="stamp stamp-critical" style={{ fontSize: '0.62rem', padding: '1px 5px' }}>
                                LONGEST WAITING
                              </span>
                            </div>
                          )}

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <span className="mono" style={{ fontSize: '0.74rem', color: 'var(--color-ink-muted)' }}>
                                {inc.operatorCallsign}
                              </span>
                              <h3 style={{ fontSize: '1.2rem', marginTop: '2px' }}>
                                {inc.name}
                              </h3>
                            </div>

                            {/* Large Monospace Live Elapsed Timer */}
                            <div
                              style={{
                                backgroundColor: isOldestWaiting ? '#FFEBE8' : 'var(--color-paper-light)',
                                border: '1px solid var(--color-ink)',
                                padding: '4px 10px',
                                textAlign: 'right',
                              }}
                            >
                              <div className="mono" style={{ fontSize: '0.62rem', color: 'var(--color-ink-muted)' }}>
                                OPEN FOR
                              </div>
                              <div
                                className="timer-display mono"
                                style={{
                                  fontSize: '1.15rem',
                                  fontWeight: 800,
                                  color: isOldestWaiting ? 'var(--color-vermilion)' : 'var(--color-ink)',
                                }}
                              >
                                {formatTimer(inc.openedAt)}
                              </div>
                            </div>
                          </div>

                          <p
                            style={{
                              fontSize: '0.9rem',
                              color: 'var(--color-ink-muted)',
                              margin: '12px 0 16px',
                              lineHeight: 1.35,
                            }}
                          >
                            {inc.description}
                          </p>

                          {/* Footer Tag Indicators */}
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              borderTop: '1px dashed var(--color-ink-subtle)',
                              paddingTop: '12px',
                            }}
                          >
                            <span className="mono" style={{ fontSize: '0.74rem' }}>
                              👥 {inc.membersCount} RESPONDERS
                            </span>

                            <button className="btn btn-hazard" style={{ fontSize: '0.72rem', padding: '5px 10px' }}>
                              JOIN INCIDENT ROOM →
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
