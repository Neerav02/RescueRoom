import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CometChat } from '../lib/cometchat';

export default function TriageBoardPage({ currentUser }) {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState([]);
  const [unreadMap, setUnreadMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());
  const [showResolvedArchive, setShowResolvedArchive] = useState(false);

  // 1-second interval to drive live monospace timers
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch all incidents and unread counts for this company
  const loadIncidents = async () => {
    if (!currentUser) return;
    try {
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
        setUnreadMap(unreads);
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
  };

  // Real-time CometChat listeners: New incidents pin themselves live without page reload (Prompt 7)
  useEffect(() => {
    loadIncidents();

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

    // Reliable 4-second polling fallback
    const pollInterval = setInterval(loadIncidents, 4000);

    return () => {
      CometChat.removeGroupListener(groupListenerId);
      CometChat.removeMessageListener(messageListenerId);
      clearInterval(pollInterval);
    };
  }, [currentUser]);

  // Format elapsed time as HH:MM:SS
  const formatTimer = (openedAt, endedAt = null) => {
    const end = endedAt || now;
    const diffSec = Math.max(0, Math.floor((end - openedAt) / 1000));
    const hrs = String(Math.floor(diffSec / 3600)).padStart(2, '0');
    const mins = String(Math.floor((diffSec % 3600) / 60)).padStart(2, '0');
    const secs = String(diffSec % 60).padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  // Group open incidents into three columns
  const openIncidents = incidents.filter((i) => i.status !== 'resolved');
  const resolvedIncidents = incidents.filter((i) => i.status === 'resolved').sort((a, b) => (b.resolvedAt || 0) - (a.resolvedAt || 0));

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
              <span className="mono" style={{ fontSize: '0.78rem', color: 'var(--color-teal)' }}>
                ● REAL-TIME DISPATCH QUEUE
              </span>
            </div>
            <h1 style={{ fontSize: '2.4rem', margin: '4px 0 0' }}>
              INCIDENT COMMAND BOARD
            </h1>
            <p className="mono" style={{ fontSize: '0.88rem', color: 'var(--color-ink-muted)', marginTop: '4px' }}>
              PHYSICAL PINNED PAPER TAGS · LIVE ACTIVE ELAPSED MONOSPACE TIMERS · REAL-TIME CLOUD SYNC
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
              title="Force sync board with CometChat cloud"
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
                      fontSize: '0.88rem',
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
                          className={`paper-card triage-tag ${isOldestWaiting ? 'triage-tag-oldest' : ''}`}
                          onClick={() => navigate(`/room/${inc.guid}`)}
                          style={{
                            padding: '18px 20px',
                            cursor: 'pointer',
                          }}
                        >
                          {/* Pin & Header Tape Indicator */}
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: '10px',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span className="triage-pin-head" title="Pinned Paper Tag" />
                              <span className="mono" style={{ fontSize: '0.75rem', fontWeight: 800 }}>
                                #{inc.incidentCode}
                              </span>
                            </div>

                            {/* Unread Message Pill (Prompt 7 Tag Anatomy) */}
                            {inc.unreadCount > 0 ? (
                              <span className="unread-pill">
                                ● {inc.unreadCount} NEW
                              </span>
                            ) : (
                              <span className="caught-up-pill">
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
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                            <div>
                              {/* Machinery Badge */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span className="stamp" style={{ backgroundColor: 'var(--color-paper-light)', fontSize: '0.68rem', padding: '2px 6px' }}>
                                  🚜 {inc.equipment}
                                </span>
                              </div>
                              <h3 style={{ fontSize: '1.25rem', marginTop: '6px', lineHeight: 1.15 }}>
                                {inc.name}
                              </h3>
                            </div>

                            {/* Large Monospace Live Elapsed Timer (Prompt 7) */}
                            <div
                              style={{
                                backgroundColor: isOldestWaiting ? '#FFEBE8' : 'var(--color-paper-light)',
                                border: '1px solid var(--color-ink)',
                                padding: '6px 10px',
                                textAlign: 'right',
                                minWidth: '105px',
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
                                {formatTimer(inc.openedAt)}
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
                            }}
                          >
                            <span className="mono" style={{ fontSize: '0.76rem', fontWeight: 700 }}>
                              👥 {inc.membersCount} RESPONDERS JOINED
                            </span>

                            <button className="btn btn-hazard" style={{ fontSize: '0.74rem', padding: '6px 12px' }}>
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
              }}
              onClick={() => setShowResolvedArchive((prev) => !prev)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="stamp stamp-resolved">RESOLVED ARCHIVE</span>
                <span className="mono" style={{ fontSize: '0.88rem', fontWeight: 700 }}>
                  {resolvedIncidents.length} COMPLETED INCIDENTS
                </span>
              </div>
              <button className="btn" style={{ fontSize: '0.75rem', padding: '6px 12px' }}>
                {showResolvedArchive ? '▲ HIDE ARCHIVE' : '▼ VIEW RESOLVED ARCHIVE'}
              </button>
            </div>

            {showResolvedArchive && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                  gap: '18px',
                }}
              >
                {resolvedIncidents.map((inc) => (
                  <div
                    key={inc.guid}
                    className="paper-card"
                    style={{
                      backgroundColor: 'rgba(239, 232, 216, 0.6)',
                      border: '1px solid var(--color-ink)',
                      borderLeft: '8px solid var(--color-teal)',
                      padding: '16px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="stamp stamp-resolved" style={{ fontSize: '0.65rem' }}>
                        RESOLVED
                      </span>
                      <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>
                        TOTAL DOWNTIME: {formatTimer(inc.openedAt, inc.resolvedAt)}
                      </span>
                    </div>

                    <h4 style={{ fontSize: '1.1rem', margin: '8px 0 4px' }}>
                      {inc.name}
                    </h4>

                    <div className="mono" style={{ fontSize: '0.74rem', color: 'var(--color-ink-muted)' }}>
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
                      }}
                    >
                      <span className="mono" style={{ fontSize: '0.72rem' }}>
                        BY: {inc.resolvedBy || 'DISPATCH'}
                      </span>
                      <button
                        onClick={() => navigate(`/report/${inc.guid}`)}
                        className="btn btn-teal"
                        style={{ fontSize: '0.72rem', padding: '5px 10px' }}
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
