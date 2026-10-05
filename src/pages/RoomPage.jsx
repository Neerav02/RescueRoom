import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CometChat, DEMO_USERS } from '../lib/cometchat';

export default function RoomPage({ currentUser }) {
  const { guid } = useParams();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [activeRung, setActiveRung] = useState('CHAT'); // 'CHAT' | 'VOICE' | 'VIDEO'
  const [callStatus, setCallStatus] = useState(null); // null | 'in-call' | 'ended'
  const [callDuration, setCallDuration] = useState(0);
  const [isResolved, setIsResolved] = useState(false);
  const [showResolvedStamp, setShowResolvedStamp] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const [lightboxImg, setLightboxImg] = useState(null);
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load group details & previous messages
  useEffect(() => {
    async function loadRoom() {
      if (!guid) return;
      try {
        console.log(`[RescueRoom] Fetching group ${guid}...`);
        const grp = await CometChat.getGroup(guid);
        setGroup(grp);

        let meta = {};
        try {
          meta = typeof grp.getMetadata() === 'string' ? JSON.parse(grp.getMetadata()) : grp.getMetadata() || {};
        } catch {
          meta = grp.getMetadata() || {};
        }
        if (meta.status === 'resolved') {
          setIsResolved(true);
        }

        // Fetch recent message history
        const messagesRequest = new CometChat.MessagesRequestBuilder()
          .setGUID(guid)
          .setLimit(50)
          .build();

        const history = await messagesRequest.fetchPrevious();
        setMessages(history || []);
      } catch (err) {
        console.warn('Error loading room:', err);
      }
    }
    loadRoom();
  }, [guid]);

  // Real-time message & typing listener
  useEffect(() => {
    if (!guid) return;
    const listenerId = `room_listener_${guid}_${Date.now()}`;

    CometChat.addMessageListener(
      listenerId,
      new CometChat.MessageListener({
        onTextMessageReceived: (textMsg) => {
          if (textMsg.getReceiverId() === guid) {
            setMessages((prev) => [...prev, textMsg]);
          }
        },
        onMediaMessageReceived: (mediaMsg) => {
          if (mediaMsg.getReceiverId() === guid) {
            setMessages((prev) => [...prev, mediaMsg]);
          }
        },
        onTypingStarted: (typingIndicator) => {
          if (typingIndicator.getReceiverId() === guid) {
            const sender = typingIndicator.getSender();
            setTypingUser(sender.getName());
          }
        },
        onTypingEnded: (typingIndicator) => {
          if (typingIndicator.getReceiverId() === guid) {
            setTypingUser(null);
          }
        },
      })
    );

    return () => {
      CometChat.removeMessageListener(listenerId);
    };
  }, [guid]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUser]);

  // Handle call timer when on VOICE or VIDEO rung
  useEffect(() => {
    let interval = null;
    if (activeRung !== 'CHAT') {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [activeRung]);

  // Format call seconds to MM:SS
  const formatCallTime = (sec) => {
    const mins = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${mins}:${s}`;
  };

  // Send Text Message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;

    setIsSending(true);
    const textToSend = inputText.trim();
    setInputText('');

    try {
      const textMessage = new CometChat.TextMessage(
        guid,
        textToSend,
        CometChat.RECEIVER_TYPE.GROUP
      );
      const sent = await CometChat.sendMessage(textMessage);
      setMessages((prev) => [...prev, sent]);
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  // Send Media / Photo Message (Evidence Plate)
  const handleMediaUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSending(true);
    try {
      const mediaMessage = new CometChat.MediaMessage(
        guid,
        file,
        CometChat.MESSAGE_TYPE.IMAGE,
        CometChat.RECEIVER_TYPE.GROUP
      );
      const sent = await CometChat.sendMediaMessage(mediaMessage);
      setMessages((prev) => [...prev, sent]);
    } catch (err) {
      console.error('Failed to upload image:', err);
      alert('Photo upload failed. Please ensure file is a valid image under 5MB.');
    } finally {
      setIsSending(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Escalation Ladder handler
  const handleClimbLadder = async (rung) => {
    if (rung === activeRung) return;

    if (rung === 'CHAT') {
      // Ending call and returning to chat
      if (activeRung !== 'CHAT' && callDuration > 0) {
        const sysMsg = new CometChat.TextMessage(
          guid,
          `📞 TACTICAL ${activeRung} CALL TERMINATED · DURATION: ${formatCallTime(callDuration)}`,
          CometChat.RECEIVER_TYPE.GROUP
        );
        try {
          const sent = await CometChat.sendMessage(sysMsg);
          setMessages((prev) => [...prev, sent]);
        } catch (e) {
          console.warn(e);
        }
      }
      setActiveRung('CHAT');
      return;
    }

    // Climbing to VOICE or VIDEO
    setActiveRung(rung);
    const logCallStart = new CometChat.TextMessage(
      guid,
      `🚨 ESCALATION LADDER CLIMBED TO [${rung} CALL] BY ${currentUser?.name.toUpperCase()}`,
      CometChat.RECEIVER_TYPE.GROUP
    );
    try {
      const sent = await CometChat.sendMessage(logCallStart);
      setMessages((prev) => [...prev, sent]);
    } catch (e) {
      console.warn(e);
    }
  };

  // Resolve incident
  const handleResolveIncident = async () => {
    setShowResolvedStamp(true);
    setIsResolved(true);

    try {
      const resolveMsg = new CometChat.TextMessage(
        guid,
        `✅ INCIDENT OFFICIALLY RESOLVED BY ${currentUser?.name.toUpperCase()} (${currentUser?.callsign})\nSTATUS: MARKED COMPLETED`,
        CometChat.RECEIVER_TYPE.GROUP
      );
      const sent = await CometChat.sendMessage(resolveMsg);
      setMessages((prev) => [...prev, sent]);
    } catch (e) {
      console.warn(e);
    }
  };

  // Parse metadata
  let metadata = {};
  try {
    metadata = typeof group?.getMetadata() === 'string' ? JSON.parse(group.getMetadata()) : group?.getMetadata() || {};
  } catch {
    metadata = group?.getMetadata() || {};
  }
  const isCritical = metadata.severity === 'CRITICAL';

  // Responders roster
  const companyResponders = DEMO_USERS.filter((u) => u.companyId === currentUser?.companyId);

  return (
    <div style={{ width: '100%', flex: 1, padding: '24px 32px 48px' }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
        {/* Top Incident Banner */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            borderBottom: 'var(--border-ink)',
            paddingBottom: '12px',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className={`stamp ${isCritical ? 'stamp-critical' : 'stamp-serious'}`}>
                {metadata.severity || 'INCIDENT ROOM'}
              </span>
              <span className="mono" style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)' }}>
                CHANNEL: {guid}
              </span>
            </div>
            <h1 style={{ fontSize: '1.8rem', margin: '4px 0 0' }}>
              {group?.getName() || 'INCIDENT CHANNEL ACTIVE'}
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => navigate(currentUser?.role === 'operator' ? '/operator' : '/board')}
              className="btn btn-hazard"
              style={{ fontSize: '0.78rem', padding: '8px 14px' }}
            >
              ← BACK TO {currentUser?.role === 'operator' ? 'STATION' : 'TRIAGE BOARD'}
            </button>

            {!isResolved && (currentUser?.role === 'mechanic' || currentUser?.role === 'dispatcher') && (
              <button
                onClick={handleResolveIncident}
                className="btn btn-teal"
                style={{ fontSize: '0.78rem', padding: '8px 16px' }}
              >
                ✓ RESOLVE INCIDENT
              </button>
            )}
          </div>
        </div>

        {/* Critical Severity Hazard Tape Across Room */}
        {isCritical && (
          <div className="hazard-strip-banner" style={{ marginBottom: '16px' }}>
            <span>⚠ CRITICAL WORK STOPPAGE IN EFFECT · HIGH PRIORITY ESCALATION</span>
          </div>
        )}

        {/* Resolved Stamp Overlay Indicator */}
        {isResolved && (
          <div
            className="paper-card"
            style={{
              backgroundColor: '#E8F5F3',
              borderLeft: '8px solid var(--color-teal)',
              marginBottom: '16px',
              padding: '12px 18px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <span className="stamp stamp-resolved">RESOLVED</span>
              <span className="mono" style={{ marginLeft: '12px', fontSize: '0.85rem', fontWeight: 700 }}>
                INCIDENT HAS BEEN CLOSED AND SIGNED OFF
              </span>
            </div>
            <span className="mono" style={{ fontSize: '0.78rem', color: 'var(--color-teal)' }}>
              LOG ARCHIVED
            </span>
          </div>
        )}

        {/* 3-Panel Main Layout: Left Ladder | Center Feed | Right Roster */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '140px 1fr 280px',
            gap: '20px',
            minHeight: '620px',
          }}
        >
          {/* Panel 1: The Escalation Ladder (Left Column) */}
          <div
            className="paper-card"
            style={{
              backgroundColor: 'var(--color-paper-light)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '20px 10px',
              border: 'var(--border-ink)',
            }}
          >
            <div className="mono" style={{ fontSize: '0.65rem', fontWeight: 700, marginBottom: '16px', textAlign: 'center' }}>
              ESCALATION<br />LADDER
            </div>

            {/* Vertical Ladder Control */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column-reverse',
                gap: '12px',
                width: '100%',
                flex: 1,
                justifyContent: 'center',
              }}
            >
              {[
                { id: 'CHAT', label: '1. CHAT', icon: '💬', color: 'var(--color-bone)' },
                { id: 'VOICE', label: '2. VOICE', icon: '🎙', color: 'var(--color-hazard)' },
                { id: 'VIDEO', label: '3. VIDEO', icon: '📹', color: 'var(--color-vermilion)' },
              ].map((rung) => {
                const isActive = activeRung === rung.id;
                return (
                  <button
                    key={rung.id}
                    onClick={() => handleClimbLadder(rung.id)}
                    className="btn"
                    style={{
                      width: '100%',
                      padding: '18px 8px',
                      backgroundColor: isActive ? (rung.id === 'VIDEO' ? 'var(--color-vermilion)' : rung.id === 'VOICE' ? 'var(--color-hazard)' : 'var(--color-ink)') : 'var(--color-bone)',
                      color: isActive ? (rung.id === 'VOICE' ? 'var(--color-ink)' : '#FFFFFF') : 'var(--color-ink)',
                      border: 'var(--border-ink-thick)',
                      boxShadow: isActive ? 'var(--shadow-hard-lg)' : 'var(--shadow-hard-sm)',
                      transform: isActive ? 'translate(-2px, -2px)' : 'none',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <span style={{ fontSize: '1.3rem' }}>{rung.icon}</span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800 }}>{rung.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="mono" style={{ fontSize: '0.62rem', color: 'var(--color-ink-muted)', marginTop: '16px', textAlign: 'center' }}>
              TAP HIGHER RUNG TO ESCALATE
            </div>
          </div>

          {/* Panel 2: Center Message Stream / Call View */}
          <div
            className="paper-card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: 0,
              overflow: 'hidden',
              backgroundColor: activeRung !== 'CHAT' ? 'var(--color-dark-panel)' : 'var(--color-bone)',
              transition: 'background-color 0.2s ease',
            }}
          >
            {/* If on VOICE or VIDEO rung: Show Tactical Dark Call Panel */}
            {activeRung !== 'CHAT' ? (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '32px',
                  color: 'var(--color-bone)',
                }}
              >
                <div className="hazard-tape-sm" style={{ width: '80%', marginBottom: '24px' }} />
                
                <span className="stamp stamp-critical" style={{ fontSize: '0.85rem', marginBottom: '16px' }}>
                  TACTICAL {activeRung} CALL ACTIVE
                </span>

                <h2 style={{ fontSize: '2.2rem', color: '#FFFFFF', marginBottom: '8px' }}>
                  {activeRung === 'VIDEO' ? '📹 TACTICAL VIDEO FEED' : '🎙 FIELD RADIO VOICE CHANNEL'}
                </h2>

                <div className="timer-display mono" style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-hazard)', marginBottom: '24px' }}>
                  {formatCallTime(callDuration)}
                </div>

                <div
                  style={{
                    border: '2px solid rgba(255,255,255,0.2)',
                    padding: '16px 28px',
                    backgroundColor: 'rgba(0,0,0,0.4)',
                    marginBottom: '32px',
                    textAlign: 'center',
                  }}
                >
                  <div className="mono" style={{ fontSize: '0.75rem', color: '#888' }}>
                    CHANNEL PARTICIPANTS:
                  </div>
                  <div className="mono" style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '4px' }}>
                    {currentUser?.name.toUpperCase()} (TRANSMITTING) · ALL ROSTER LISTENERS
                  </div>
                </div>

                <button
                  onClick={() => handleClimbLadder('CHAT')}
                  className="btn btn-vermilion btn-lg"
                  style={{ minWidth: '220px' }}
                >
                  END CALL & RETURN TO CHAT
                </button>
              </div>
            ) : (
              /* If on CHAT rung: The Field Manual Ticker Log Stream */
              <>
                {/* Chat Log Header */}
                <div
                  style={{
                    padding: '10px 16px',
                    borderBottom: 'var(--border-ink)',
                    backgroundColor: 'var(--color-paper-light)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span className="mono" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                    INCIDENT LOG TICKER · CHAT CHANNEL
                  </span>
                  <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--color-ink-muted)' }}>
                    REAL-TIME SYNC ACTIVE
                  </span>
                </div>

                {/* Messages Feed */}
                <div
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '16px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    maxHeight: '480px',
                  }}
                >
                  {messages.length === 0 ? (
                    <div className="mono" style={{ textAlign: 'center', padding: '40px', color: 'var(--color-ink-muted)' }}>
                      NO TRANSMISSIONS YET. BEGIN BY POSTING FAULT DETAILS OR PHOTOS BELOW.
                    </div>
                  ) : (
                    messages.map((msg, idx) => {
                      const sender = msg.getSender ? msg.getSender() : null;
                      const senderName = sender ? sender.getName() : 'SYSTEM';
                      const isMe = sender && sender.getUid() === currentUser?.uid;
                      const timeStr = msg.getSentAt
                        ? new Date(msg.getSentAt() * 1000).toISOString().substring(11, 19)
                        : new Date().toISOString().substring(11, 19);

                      const isMedia = msg.getType && msg.getType() === CometChat.MESSAGE_TYPE.IMAGE;

                      return (
                        <div
                          key={msg.getId ? msg.getId() : idx}
                          style={{
                            borderBottom: '1px dashed rgba(28, 27, 24, 0.25)',
                            paddingBottom: '10px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--color-ink-muted)' }}>
                              [{timeStr} UTC]
                            </span>
                            <span
                              style={{
                                fontWeight: 800,
                                fontSize: '0.85rem',
                                color: isMe ? 'var(--color-vermilion)' : 'var(--color-ink)',
                              }}
                            >
                              {senderName.toUpperCase()}
                            </span>
                            {isMe && (
                              <span className="stamp" style={{ fontSize: '0.58rem', padding: '1px 4px' }}>
                                YOU
                              </span>
                            )}
                          </div>

                          {/* Image Evidence Plate or Text */}
                          {isMedia ? (
                            <div
                              style={{
                                marginTop: '6px',
                                border: 'var(--border-ink)',
                                padding: '8px',
                                backgroundColor: 'var(--color-paper-light)',
                                display: 'inline-block',
                                maxWidth: '320px',
                                cursor: 'pointer',
                              }}
                              onClick={() => setLightboxImg(msg.getData().url)}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span className="stamp stamp-critical" style={{ fontSize: '0.62rem' }}>
                                  EVIDENCE PLATE
                                </span>
                                <span className="mono" style={{ fontSize: '0.65rem' }}>CLICK TO INSPECT</span>
                              </div>
                              <img
                                src={msg.getData().url}
                                alt="Incident fault evidence"
                                style={{
                                  width: '100%',
                                  maxHeight: '220px',
                                  objectFit: 'cover',
                                  border: '1px solid var(--color-ink)',
                                }}
                              />
                            </div>
                          ) : (
                            <div
                              className="mono"
                              style={{
                                fontSize: '0.92rem',
                                whiteSpace: 'pre-wrap',
                                lineHeight: 1.4,
                                color: 'var(--color-ink)',
                              }}
                            >
                              {msg.getText ? msg.getText() : ''}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}

                  {/* Typing Indicator */}
                  {typingUser && (
                    <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--color-vermilion)' }}>
                      ✍ {typingUser.toUpperCase()} IS TRANSMITTING...
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input Bar with Photo Camera & Text Field */}
                <form
                  onSubmit={handleSendMessage}
                  style={{
                    borderTop: 'var(--border-ink)',
                    padding: '12px 16px',
                    backgroundColor: 'var(--color-paper-light)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  {/* Photo / Evidence Plate Upload */}
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleMediaUpload}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn btn-hazard"
                    style={{ padding: '9px 12px', fontSize: '0.8rem' }}
                    title="Attach Evidence Photo"
                  >
                    📷 PHOTO
                  </button>

                  <input
                    type="text"
                    className="form-input"
                    placeholder="Type dispatch transmission or status update..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    disabled={isSending}
                    style={{ flex: 1 }}
                  />

                  <button
                    type="submit"
                    className="btn btn-vermilion"
                    disabled={isSending || !inputText.trim()}
                    style={{ padding: '9px 18px', fontSize: '0.85rem' }}
                  >
                    {isSending ? 'SENDING...' : 'TRANSMIT →'}
                  </button>
                </form>
              </>
            )}
          </div>

          {/* Panel 3: "Who's Here" Tactical Roster (Right Column) */}
          <div
            className="paper-card"
            style={{
              backgroundColor: 'var(--color-paper-light)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              border: 'var(--border-ink)',
            }}
          >
            <div
              style={{
                borderBottom: 'var(--border-ink)',
                paddingBottom: '8px',
                marginBottom: '14px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1rem', margin: 0 }}>WHO'S HERE</h3>
                <span className="presence-dot" />
              </div>
              <div className="mono" style={{ fontSize: '0.68rem', color: 'var(--color-ink-muted)' }}>
                {currentUser?.companyName.toUpperCase()} ROSTER
              </div>
            </div>

            {/* List of Responders */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
              {companyResponders.map((u) => {
                const isOnline = true; // In room all company roster is available
                return (
                  <div
                    key={u.uid}
                    style={{
                      border: '1px solid var(--color-ink)',
                      padding: '8px 10px',
                      backgroundColor: 'var(--color-bone)',
                      boxShadow: 'var(--shadow-hard-sm)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{u.name}</span>
                      <span className="presence-dot" />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                      <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--color-ink-muted)' }}>
                        {u.role.toUpperCase()}
                      </span>
                      <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--color-ink-muted)' }}>
                        {u.callsign}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Incident Summary Card */}
            <div
              style={{
                marginTop: '16px',
                paddingTop: '12px',
                borderTop: '1px dashed var(--color-ink-subtle)',
              }}
            >
              <div className="mono" style={{ fontSize: '0.68rem', color: 'var(--color-ink-muted)' }}>
                EQUIPMENT UNIT:
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                {metadata.equipment || group?.getName()}
              </div>
            </div>
          </div>
        </div>

        {/* Lightbox for Evidence Plate */}
        {lightboxImg && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(20, 32, 31, 0.95)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000,
              padding: '24px',
            }}
            onClick={() => setLightboxImg(null)}
          >
            <div className="paper-card" style={{ maxWidth: '800px', backgroundColor: 'var(--color-bone)' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span className="stamp stamp-critical">EVIDENCE INSPECTION</span>
                <button onClick={() => setLightboxImg(null)} className="btn">✕ CLOSE</button>
              </div>
              <img src={lightboxImg} alt="Fault plate" style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain' }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
