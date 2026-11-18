import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CometChat, ensureUserLoggedIn } from '../lib/cometchat';
import { seedDemoIncidents } from '../lib/seed';
import { IncidentTimer } from '../components';

export default function TriageBoardPage({ currentUser }) {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showResolvedArchive, setShowResolvedArchive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');

  // Fetch all incidents and unread counts for this company
  const loadIncidents = useCallback(async () => {
    if (!currentUser) return;
    try {
      await ensureUserLoggedIn(currentUser);
      // 1. Fetch group list
      const request = new CometChat.GroupsRequestBuilder()
        .setLimit(50)
        .build();
      const groups = await request.fetchNext();
      
      // Filter for this company's incidents
      const companyGroups = groups.filter((g) => {
        const guid = g.getGuid();
        return guid.startsWith(`${currentUser.companyId}_inc_`);
      });

      // 2. Fetch unread counts via Conversations API (Prompt 7 unread pill)
      let unreads = {};
      try {
        const convRequest = new CometChat.ConversationsRequestBuilder()
          .setLimit(50)
          .setConversationType('group')
          .build();
        const convs = await convRequest.fetchNext();
        convs.forEach((c) => {
          const peer = c.getConversationWith();
          if (peer && peer.getGuid) {
            unreads[peer.getGuid()] = c.getUnreadMessageCount() || 0;
          }
        });
      } catch (convErr) {
        console.warn('[RescueRoom] Unread count fetch notice:', convErr);
      }

      // 3. Parse metadata & calculate properties
      const parsed = companyGroups.map((g) => {
        let meta = {};
        try {
          meta = typeof g.getMetadata() === 'string' ? JSON.parse(g.getMetadata()) : g.getMetadata() || {};
        } catch {
          meta = g.getMetadata() || {};
        }

        const guid = g.getGuid();
        const unreadCount = unreads[guid] || 0;
        const incidentCode = meta.incidentNum || guid.replace(`${currentUser.companyId}_inc_`, 'INC-').toUpperCase();

        // Check local override or group metadata
        let isResolvedStatus = meta.status === 'resolved';
        let localResolved = null;
        try {
          const stored = localStorage.getItem(`rescueroom_resolved_${guid}`);
          if (stored) {
            localResolved = JSON.parse(stored);
            isResolvedStatus = true;
          }
        } catch (e) {
          console.warn(e);
        }

        return {
          guid,
          incidentCode,
          name: g.getName(),
          membersCount: g.getMembersCount() || 1,
          severity: meta.severity || 'SERIOUS',
          equipment: meta.equipment || g.getName(),
          description: meta.description || 'Live machinery emergency in progress',
          openedAt: Number(meta.openedAt) || Date.now() - 300000,
          status: isResolvedStatus ? 'resolved' : (meta.status || 'open'),
          resolvedAt: isResolvedStatus ? (meta.resolvedAt ? Number(meta.resolvedAt) : localResolved?.resolvedAt || Date.now()) : null,
          resolvedBy: isResolvedStatus ? (meta.resolvedBy || localResolved?.resolvedBy || 'DISPATCH') : null,
          operatorCallsign: meta.operatorCallsign || 'OP-FIELD',
          unreadCount,
        };
      });

      setIncidents(parsed);
    } catch (err) {
      console.warn('[RescueRoom] Error loading triage incidents:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Real-time CometChat listeners: New incidents pin themselves live without page reload (Prompt 7)
  useEffect(() => {
    let isSubscribed = true;
    (async () => {
      if (isSubscribed) {
        await loadIncidents();
      }
    })();

    const timestamp = Date.now();
    const groupListenerId = `triage_group_listener_${timestamp}`;
    const messageListenerId = `triage_msg_listener_${timestamp}`;

    // Group Listener: Fires when new groups are created or users added
    CometChat.addGroupListener(
      groupListenerId,
      new CometChat.GroupListener({
        onMemberAddedToGroup: () => {
          console.log('[RescueRoom] Member added event received. Refreshing board in real-time...');
          loadIncidents();
        },
        onGroupMemberJoined: () => {
          loadIncidents();
        },
        onGroupMemberLeft: () => {
          loadIncidents();
        },
      })
    );

    // Message Listener: Fires when dispatch logs, evidence, or resolution notices are sent
    CometChat.addMessageListener(
      messageListenerId,
      new CometChat.MessageListener({
        onTextMessageReceived: () => {
          console.log('[RescueRoom] Incident message received. Updating triage board...');
          loadIncidents();
        },
        onMediaMessageReceived: () => {
          loadIncidents();
        },
        onCustomMessageReceived: () => {
          loadIncidents();
        },
      })
    );

    // Visibility-aware smart polling fallback: 12-second heartbeat, pauses when tab is hidden
    let pollInterval = null;
    const startPolling = () => {
      if (!pollInterval) {
        pollInterval = setInterval(loadIncidents, 12000);
      }
    };
    const stopPolling = () => {
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        loadIncidents();
        startPolling();
      }
    };

    if (!document.hidden) {
      startPolling();
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      CometChat.removeGroupListener(groupListenerId);
      CometChat.removeMessageListener(messageListenerId);
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentUser, loadIncidents]);

  // Group open incidents into three columns
  const openIncidents = incidents.filter((i) => i.status !== 'resolved');
  const resolvedIncidents = incidents.filter((i) => i.status === 'resolved').sort((a, b) => (b.resolvedAt || 0) - (a.resolvedAt || 0));

  const filteredOpenIncidents = openIncidents.filter((i) => {
    const matchesSeverity = severityFilter === 'ALL' || i.severity === severityFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      i.name.toLowerCase().includes(q) ||
      i.incidentCode.toLowerCase().includes(q) ||
      i.equipment.toLowerCase().includes(q) ||
      i.description.toLowerCase().includes(q);
    return matchesSeverity && matchesSearch;
  });

  const criticalList = filteredOpenIncidents.filter((i) => i.severity === 'CRITICAL').sort((a, b) => a.openedAt - b.openedAt);
  const seriousList = filteredOpenIncidents.filter((i) => i.severity === 'SERIOUS').sort((a, b) => a.openedAt - b.openedAt);
  const minorList = filteredOpenIncidents.filter((i) => i.severity === 'MINOR').sort((a, b) => a.openedAt - b.openedAt);

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
      subtitle: 'REDUCED CAPACITY / SAFETY RISK',
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
    <div className="triage-page-container">
      <div style={{ maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
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
          <div style={{ minWidth: 0, flex: '1 1 300px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span className="stamp stamp-serious">TACTICAL TRIAGE BOARD</span>
              <span className="mono" style={{ fontSize: '0.78rem', color: 'var(--color-ink-muted)' }}>
                {currentUser?.companyName.toUpperCase()} · WORKSPACE
              </span>
              <span className="mono" style={{ fontSize: '0.78rem', color: 'var(--color-teal)' }}>
                ● REAL-TIME DISPATCH QUEUE
              </span>
            </div>
            <h1
              style={{
                fontSize: 'clamp(1.6rem, 4vw, 2.4rem)',
                margin: '4px 0 0',
                wordBreak: 'break-word',
              }}
            >
              INCIDENT COMMAND BOARD
            </h1>
            <p
              className="mono"
              style={{
                fontSize: '0.82rem',
                color: 'var(--color-ink-muted)',
                marginTop: '4px',
                lineHeight: 1.4,
              }}
            >
              PHYSICAL PINNED PAPER TAGS · LIVE ACTIVE ELAPSED MONOSPACE TIMERS · REAL-TIME CLOUD SYNC
            </p>
          </div>

          <div className="triage-header-actions">
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
              onClick={async () => {
                setLoading(true);
                await seedDemoIncidents(currentUser);
                await loadIncidents();
              }}
              className="btn"
              style={{ fontSize: '0.82rem', padding: '8px 16px', backgroundColor: 'var(--color-paper-light)' }}
              title="Generate sample operational incidents in CometChat"
            >
              ⚡ SEED DEMO SCENARIOS
            </button>

            <button
              onClick={loadIncidents}
              className="btn btn-hazard"
              style={{ fontSize: '0.82rem', padding: '8px 16px' }}
              title="Force sync board with CometChat cloud"
            >
              ↻ REFRESH BOARD
            </button>
          </div>
        </div>

        {/* Operational Telemetry & KPI Strip */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            marginBottom: '20px',
          }}
        >
          <div
            className="paper-card"
            style={{
              padding: '12px 14px',
              borderLeft: '4px solid var(--color-ink)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div className="mono" style={{ fontSize: '0.68rem', color: 'var(--color-ink-muted)', letterSpacing: '0.06em' }}>
              TOTAL ACTIVE FAULTS
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
              <span className="mono" style={{ fontSize: '1.6rem', fontWeight: 900, lineHeight: 1 }}>
                {openIncidents.length}
              </span>
              <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--color-ink-muted)' }}>
                QUEUED
              </span>
            </div>
          </div>

          <div
            className="paper-card"
            style={{
              padding: '12px 14px',
              borderLeft: '4px solid var(--color-vermilion)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div className="mono" style={{ fontSize: '0.68rem', color: '#8F1D05', fontWeight: 700, letterSpacing: '0.06em' }}>
              CRITICAL WORK STOPPAGE
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
              <span className="mono" style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--color-vermilion)', lineHeight: 1 }}>
                {openIncidents.filter((i) => i.severity === 'CRITICAL').length}
              </span>
              <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--color-ink-muted)' }}>
                REDLINE
              </span>
            </div>
          </div>

          <div
            className="paper-card"
            style={{
              padding: '12px 14px',
              borderLeft: '4px solid var(--color-hazard)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div className="mono" style={{ fontSize: '0.68rem', color: 'var(--color-ink)', letterSpacing: '0.06em' }}>
              DEGRADED / MINOR FAULTS
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
              <span className="mono" style={{ fontSize: '1.6rem', fontWeight: 900, lineHeight: 1 }}>
                {openIncidents.filter((i) => i.severity !== 'CRITICAL').length}
              </span>
              <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--color-ink-muted)' }}>
                ATTENTION
              </span>
            </div>
          </div>

          <div
            className="paper-card"
            style={{
              padding: '12px 14px',
              borderLeft: '4px solid var(--color-teal)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div className="mono" style={{ fontSize: '0.68rem', color: 'var(--color-teal)', letterSpacing: '0.06em' }}>
              RESOLVED & AUDITED
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
              <span className="mono" style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--color-teal)', lineHeight: 1 }}>
                {resolvedIncidents.length}
              </span>
              <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--color-ink-muted)' }}>
                STAMPED
              </span>
            </div>
          </div>

          <div
            className="paper-card"
            style={{
              padding: '12px 14px',
              backgroundColor: 'var(--color-paper-light)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'flex-start',
              gap: '6px',
            }}
          >
            <div className="mono" style={{ fontSize: '0.68rem', color: 'var(--color-teal)', fontWeight: 800 }}>
              ◈ 3D DIGITAL TWIN
            </div>
            <button
              onClick={() => navigate('/twin')}
              className="btn btn-teal"
              style={{ width: '100%', fontSize: '0.76rem', padding: '8px 12px' }}
              title="Open full interactive 3D digital twin"
            >
              LAUNCH 3D TWIN ↗
            </button>
          </div>
        </div>

        {/* Triage Search & Severity Filter Bar */}
        <div
          className="paper-card"
          style={{
            padding: '14px 16px',
            marginBottom: '24px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 280px', minWidth: 0 }}>
            <label htmlFor="triage-search" className="mono" style={{ fontSize: '0.76rem', fontWeight: 800, whiteSpace: 'nowrap' }}>
              SEARCH:
            </label>
            <input
              id="triage-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by incident ID, machinery, or description..."
              className="input-field mono"
              style={{
                flex: 1,
                fontSize: '0.82rem',
                padding: '8px 10px',
                minWidth: '160px',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="btn"
                style={{ padding: '6px 10px', fontSize: '0.74rem' }}
                title="Clear search query"
              >
                ✕
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--color-ink-muted)', marginRight: '4px' }}>
              SEVERITY:
            </span>
            {['ALL', 'CRITICAL', 'SERIOUS', 'MINOR'].map((sev) => {
              const isSelected = severityFilter === sev;
              const count =
                sev === 'ALL'
                  ? openIncidents.length
                  : openIncidents.filter((i) => i.severity === sev).length;

              return (
                <button
                  key={sev}
                  type="button"
                  onClick={() => setSeverityFilter(sev)}
                  className={`btn ${isSelected ? (sev === 'CRITICAL' ? 'btn-vermilion' : sev === 'SERIOUS' ? 'btn-hazard' : 'btn-teal') : ''}`}
                  style={{
                    fontSize: '0.72rem',
                    padding: '6px 10px',
                    backgroundColor: isSelected ? undefined : 'var(--color-paper-light)',
                  }}
                  aria-pressed={isSelected}
                >
                  {sev} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* The Three Triage Severity Columns */}
        {loading ? (
          <div className="paper-card mono" style={{ textAlign: 'center', padding: '48px 16px', minWidth: 0 }}>
            SCANNING COMETCHAT INCIDENT QUEUE...
          </div>
        ) : (
          <div className="triage-grid">
            {columns.map((col) => (
              <div
                key={col.id}
                className="triage-column"
              >
                {/* Column Pinned Header */}
                <div
                  style={{
                    backgroundColor: col.bannerBg,
                    color: col.bannerText,
                    border: 'var(--border-ink-thick)',
                    boxShadow: 'var(--shadow-hard)',
                    padding: '12px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '8px',
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h2 style={{ fontSize: '1.25rem', margin: 0, wordBreak: 'break-word' }}>{col.title}</h2>
                    <div className="mono" style={{ fontSize: '0.68rem', color: col.bannerText }}>
                      {col.subtitle}
                    </div>
                  </div>
                  <span
                    className="stamp"
                    style={{
                      backgroundColor: 'var(--color-bone)',
                      color: 'var(--color-ink)',
                      fontWeight: 800,
                      fontSize: '0.88rem',
                      flexShrink: 0,
                    }}
                  >
                    {col.items.length} ACTIVE
                  </span>
                </div>

                {/* Paper Tags in Column (Prompt 7 Tag Anatomy) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {col.items.length === 0 ? (
                    <div
                      className="paper-card"
                      style={{
                        backgroundColor: 'rgba(239, 232, 216, 0.4)',
                        border: '1px dashed var(--color-ink-subtle)',
                        textAlign: 'center',
                        padding: '36px 16px',
                        minWidth: 0,
                      }}
                    >
                      <span className="mono" style={{ fontSize: '0.78rem', color: 'var(--color-ink-muted)' }}>
                        NO UNRESOLVED {col.id} INCIDENTS
                      </span>
                    </div>
                  ) : (
                    col.items.map((inc, idx) => {
                      // Prompt 7 requirement: Oldest waiting incident in each column gets a vermilion highlighted edge
                      const isOldestWaiting = idx === 0;

                      return (
                        <div
                          key={inc.guid}
                          className={`paper-card triage-tag triage-tag-card ${isOldestWaiting ? 'triage-tag-oldest' : ''}`}
                          onClick={() => navigate(`/room/${inc.guid}`)}
                        >
                          {/* Pin & Header Tape Indicator */}
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: '10px',
                              flexWrap: 'wrap',
                              gap: '6px',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                              <span className="triage-pin-head" title="Pinned Paper Tag" style={{ flexShrink: 0 }} />
                              <span className="mono" style={{ fontSize: '0.75rem', fontWeight: 800, wordBreak: 'break-all' }}>
                                #{inc.incidentCode}
                              </span>
                            </div>

                            {/* Unread Message Pill (Prompt 7 Tag Anatomy) */}
                            {inc.unreadCount > 0 ? (
                              <span className="unread-pill" style={{ flexShrink: 0 }}>
                                ● {inc.unreadCount} NEW
                              </span>
                            ) : (
                              <span className="caught-up-pill" style={{ flexShrink: 0 }}>
                                ✓ CAUGHT UP
                              </span>
                            )}
                          </div>

                          {/* Oldest Waiting Alert Tape */}
                          {isOldestWaiting && (
                            <div style={{ marginBottom: '10px' }}>
                              <span className="stamp stamp-critical" style={{ fontSize: '0.65rem', padding: '2px 7px' }}>
                                ★ LONGEST WAITING IN QUEUE
                              </span>
                            </div>
                          )}

                          {/* Tag Machinery Badge & Live Monospace Timer */}
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              gap: '12px',
                              flexWrap: 'wrap',
                            }}
                          >
                            <div style={{ minWidth: 0, flex: '1 1 140px' }}>
                              {/* Machinery Badge */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                <span
                                  className="stamp"
                                  style={{
                                    backgroundColor: 'var(--color-paper-light)',
                                    fontSize: '0.68rem',
                                    padding: '2px 6px',
                                    wordBreak: 'break-word',
                                  }}
                                >
                                  🚜 {inc.equipment}
                                </span>
                              </div>
                              <h3
                                style={{
                                  fontSize: '1.25rem',
                                  marginTop: '6px',
                                  lineHeight: 1.15,
                                  wordBreak: 'break-word',
                                }}
                              >
                                {inc.name}
                              </h3>
                            </div>

                            {/* Large Monospace Live Elapsed Timer (Prompt 7) */}
                            <div
                              style={{
                                backgroundColor: isOldestWaiting ? 'var(--color-vermilion-subtle)' : 'var(--color-paper-light)',
                                border: '1px solid var(--color-ink)',
                                padding: '6px 10px',
                                textAlign: 'right',
                                minWidth: '100px',
                                flexShrink: 0,
                              }}
                            >
                              <div className="mono" style={{ fontSize: '0.62rem', color: 'var(--color-ink-muted)' }}>
                                OPEN TIME
                              </div>
                              <div
                                className="timer-display mono"
                                style={{
                                  fontSize: '1.25rem',
                                  fontWeight: 800,
                                  color: isOldestWaiting ? 'var(--color-vermilion)' : 'var(--color-ink)',
                                  letterSpacing: '0.04em',
                                }}
                              >
                                <IncidentTimer openedAt={inc.openedAt} />
                              </div>
                            </div>
                          </div>

                          {/* Fault Description Preview */}
                          <p
                            style={{
                              fontSize: '0.88rem',
                              color: 'var(--color-ink)',
                              margin: '12px 0 16px',
                              lineHeight: 1.4,
                              opacity: 0.9,
                              wordBreak: 'break-word',
                            }}
                          >
                            {inc.description}
                          </p>

                          {/* Footer Tag Indicators: Joined Responders & Station Action */}
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              borderTop: '1px dashed var(--color-ink-subtle)',
                              paddingTop: '12px',
                              flexWrap: 'wrap',
                              gap: '8px',
                            }}
                          >
                            <span className="mono" style={{ fontSize: '0.76rem', fontWeight: 700, minWidth: 0 }}>
                              👥 {inc.membersCount} RESPONDERS JOINED
                            </span>

                            <button className="btn btn-hazard" style={{ fontSize: '0.74rem', padding: '6px 12px', flexShrink: 0 }}>
                              OPEN DISPATCH ROOM →
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

        {/* Resolved Incidents Archive Section (Prompt 7) */}
        {resolvedIncidents.length > 0 && (
          <div style={{ marginTop: '48px', borderTop: 'var(--border-ink)', paddingTop: '24px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                marginBottom: '16px',
                flexWrap: 'wrap',
                gap: '12px',
              }}
              onClick={() => setShowResolvedArchive((prev) => !prev)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <span className="stamp stamp-resolved">RESOLVED ARCHIVE</span>
                <span className="mono" style={{ fontSize: '0.88rem', fontWeight: 700 }}>
                  {resolvedIncidents.length} COMPLETED INCIDENTS
                </span>
              </div>
              <button className="btn" style={{ fontSize: '0.75rem', padding: '6px 12px', flexShrink: 0 }}>
                {showResolvedArchive ? '▲ HIDE ARCHIVE' : '▼ VIEW RESOLVED ARCHIVE'}
              </button>
            </div>

            {showResolvedArchive && (
              <div className="triage-resolved-grid">
                {resolvedIncidents.map((inc) => (
                  <div
                    key={inc.guid}
                    className="paper-card"
                    style={{
                      backgroundColor: 'rgba(239, 232, 216, 0.6)',
                      border: '1px solid var(--color-ink)',
                      borderLeft: '8px solid var(--color-teal)',
                      padding: '16px',
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '6px',
                      }}
                    >
                      <span className="stamp stamp-resolved" style={{ fontSize: '0.65rem' }}>
                        RESOLVED
                      </span>
                      <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>
                        TOTAL DOWNTIME: <IncidentTimer openedAt={inc.openedAt} endedAt={inc.resolvedAt} />
                      </span>
                    </div>

                    <h4 style={{ fontSize: '1.1rem', margin: '8px 0 4px', wordBreak: 'break-word' }}>
                      {inc.name}
                    </h4>

                    <div className="mono" style={{ fontSize: '0.74rem', color: 'var(--color-ink-muted)', wordBreak: 'break-word' }}>
                      EQUIPMENT: {inc.equipment}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: '12px',
                        paddingTop: '8px',
                        borderTop: '1px dashed var(--color-ink-subtle)',
                        flexWrap: 'wrap',
                        gap: '8px',
                      }}
                    >
                      <span className="mono" style={{ fontSize: '0.72rem' }}>
                        BY: {inc.resolvedBy || 'DISPATCH'}
                      </span>
                      <button
                        onClick={() => navigate(`/report/${inc.guid}`)}
                        className="btn btn-teal"
                        style={{ fontSize: '0.72rem', padding: '5px 10px', flexShrink: 0 }}
                      >
                        📄 SERVICE REPORT →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
