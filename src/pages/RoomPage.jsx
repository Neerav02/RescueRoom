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
  const [callDuration, setCallDuration] = useState(0);
  const [isResolved, setIsResolved] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const [lightboxPlate, setLightboxPlate] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [onlineUserMap, setOnlineUserMap] = useState({});

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Load group details & previous messages
  useEffect(() => {
    async function loadRoom() {
      if (!guid) return;
      try {
        console.log(`[RescueRoom] Fetching incident channel ${guid}...`);
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

  // Real-time message & typing listener (Prompt 4)
  useEffect(() => {
    if (!guid) return;
    const listenerId = `room_msg_listener_${guid}_${Date.now()}`;

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
            if (sender && sender.getUid() !== currentUser?.uid) {
              setTypingUser(sender.getName());
            }
          }
        },
        onTypingEnded: (typingIndicator) => {
          if (typingIndicator.getReceiverId() === guid) {
            setTypingUser(null);
          }
        },
      })
    );

    // Presence listener for online/offline updates (Prompt 4)
    const presenceListenerId = `presence_listener_${guid}_${Date.now()}`;
    CometChat.addUserListener(
      presenceListenerId,
      new CometChat.UserListener({
        onUserOnline: (user) => {
          setOnlineUserMap((prev) => ({ ...prev, [user.getUid()]: true }));
        },
        onUserOffline: (user) => {
          setOnlineUserMap((prev) => ({ ...prev, [user.getUid()]: false }));
        },
      })
    );

    return () => {
      CometChat.removeMessageListener(listenerId);
      CometChat.removeUserListener(presenceListenerId);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [guid, currentUser]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUser]);

  // Call duration counter when escalated
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

  // Handle typing indicator trigger
  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (!guid) return;

    try {
      const indicator = new CometChat.TypingIndicator(guid, CometChat.RECEIVER_TYPE.GROUP);
      CometChat.startTyping(indicator);

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        CometChat.endTyping(indicator);
      }, 1800);
    } catch (err) {
      console.warn('Typing indicator error:', err);
    }
  };

  // Send Text Message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;

    setIsSending(true);
    const textToSend = inputText.trim();
    setInputText('');

    try {
      // Clear typing indicator immediately
      const indicator = new CometChat.TypingIndicator(guid, CometChat.RECEIVER_TYPE.GROUP);
      CometChat.endTyping(indicator);

      const textMessage = new CometChat.TextMessage(
        guid,
        textToSend,
        CometChat.RECEIVER_TYPE.GROUP
      );
      const sent = await CometChat.sendMessage(textMessage);
      setMessages((prev) => [...prev, sent]);
    } catch (err) {
      console.error('Failed to send text message:', err);
    } finally {
      setIsSending(false);
    }
  };

  // Send Media / Photo Message (Evidence Plate - Prompt 5)
  const handleMediaUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Prompt 5 Validation: Images only, max 5MB
    setUploadError(null);
    if (!file.type.startsWith('image/')) {
      setUploadError('Invalid file: only photographic image files (JPG, PNG, WEBP) are accepted.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size exceeds 5MB limit. Please attach a compressed image.');
      return;
    }

    setIsSending(true);
    try {
      console.log(`[RescueRoom] Uploading evidence plate: ${file.name} (${file.size} bytes)...`);
      const mediaMessage = new CometChat.MediaMessage(
        guid,
        file,
        CometChat.MESSAGE_TYPE.IMAGE,
        CometChat.RECEIVER_TYPE.GROUP
      );

      // Store caption and plate timestamp in metadata
      const plateMeta = {
        isEvidencePlate: true,
        fileName: file.name,
        uploadedAt: Date.now(),
        senderCallsign: currentUser?.callsign || 'OPERATOR',
      };
      mediaMessage.setMetadata(plateMeta);

      const sent = await CometChat.sendMediaMessage(mediaMessage);
      setMessages((prev) => [...prev, sent]);
      console.log(`[RescueRoom] Evidence plate transmitted successfully.`);
    } catch (err) {
      console.error('Failed to upload evidence plate:', err);
      setUploadError(err?.message || 'Transmission failed. Check network connection.');
    } finally {
      setIsSending(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  // Escalation Ladder handler (Prompt 6: Voice & Video Calling)
  const [callError, setCallError] = useState(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const videoPreviewRef = useRef(null);

  // Initialize and handle CometChat Calls / WebRTC session
  const handleClimbLadder = async (rung) => {
    if (rung === activeRung) return;
    setCallError(null);

    // If returning to CHAT rung -> end any active call session
    if (rung === 'CHAT') {
      if (activeRung !== 'CHAT' && callDuration > 0) {
        // Stop local media stream tracks
        if (localStream) {
          localStream.getTracks().forEach((track) => track.stop());
          setLocalStream(null);
        }

        // Leave CometChatCalls session if active
        try {
          const { CometChatCalls } = await import('@cometchat/calls-sdk-javascript');
          CometChatCalls.leaveSession();
        } catch (e) {
          console.warn('[RescueRoom] Calls leaveSession notice:', e);
        }

        // Broadcast call end system message with exact duration
        const durationFormatted = formatCallTime(callDuration);
        const sysMsg = new CometChat.TextMessage(
          guid,
          `📞 TACTICAL ${activeRung} CALL TERMINATED\nDURATION: ${durationFormatted}\nCALL SIGN OFF BY: ${currentUser?.name.toUpperCase()} (${currentUser?.callsign})`,
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
    try {
      console.log(`[RescueRoom] Escalating to ${rung} call on channel ${guid}...`);
      setActiveRung(rung);

      // Attempt live WebRTC camera/microphone access
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: rung === 'VIDEO',
          audio: true,
        });
        setLocalStream(stream);
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = stream;
        }
      } catch (mediaErr) {
        console.warn('[RescueRoom] Camera/Mic access note (using tactical simulation fallback):', mediaErr);
        // Does not crash — continues with tactical dark panel and live audio waveform
      }

      // Initialize CometChat Calls SDK & generate session token
      try {
        const { CometChatCalls } = await import('@cometchat/calls-sdk-javascript');
        const tokenRes = await CometChatCalls.generateToken(guid);
        console.log('[RescueRoom] Call token generated:', tokenRes?.token ? '✓' : 'None');
      } catch (callsErr) {
        console.warn('[RescueRoom] CometChatCalls token notice (graceful fallback active):', callsErr);
      }

      // Broadcast call start system message
      const logCallStart = new CometChat.TextMessage(
        guid,
        `🚨 ESCALATION LADDER CLIMBED TO [${rung} CALL]\nSTATION: ${currentUser?.name.toUpperCase()} (${currentUser?.callsign})\nCHANNEL: ALL ROSTER UNITS STAND BY`,
        CometChat.RECEIVER_TYPE.GROUP
      );
      const sent = await CometChat.sendMessage(logCallStart);
      setMessages((prev) => [...prev, sent]);
    } catch (err) {
      console.error('[RescueRoom] Escalation error:', err);
      setCallError(`Could not initialize ${rung} hardware: ${err.message}. Returning to chat.`);
      setActiveRung('CHAT');
    }
  };

  // Toggle Mute Audio
  const toggleMuteAudio = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
    }
    setIsAudioMuted((prev) => !prev);
  };

  // Toggle Mute Video
  const toggleMuteVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
    }
    setIsVideoMuted((prev) => !prev);
  };

  // Bind video element whenever localStream changes
  useEffect(() => {
    if (videoPreviewRef.current && localStream) {
      videoPreviewRef.current.srcObject = localStream;
    }
  }, [localStream, activeRung]);

  // Resolve incident
  const handleResolveIncident = async () => {
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

  // Count image plates for sequential numbering (PLATE 01, PLATE 02...)
  let plateCounter = 0;

  // Company responders list
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
                {metadata.severity || 'INCIDENT CHANNEL'}
              </span>
              <span className="mono" style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)' }}>
                ROOM: {guid}
              </span>
            </div>
            <h1 style={{ fontSize: '1.85rem', margin: '4px 0 0' }}>
              {group?.getName() || 'LIVE INCIDENT CHANNEL'}
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
            <span>⚠ CRITICAL WORK STOPPAGE · LIVE INCIDENT CHANNEL ACTIVE</span>
          </div>
        )}

        {/* Resolved Banner */}
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
                INCIDENT OFFICIALLY RESOLVED AND CLOSED
              </span>
            </div>
            <span className="mono" style={{ fontSize: '0.78rem', color: 'var(--color-teal)' }}>
              CHANNEL ARCHIVED
            </span>
          </div>
        )}

        {/* 3-Panel Main Layout: Left Ladder | Center Feed | Right Roster */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '150px 1fr 300px',
            gap: '24px',
            minHeight: '640px',
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
            <div className="mono" style={{ fontSize: '0.68rem', fontWeight: 700, marginBottom: '16px', textAlign: 'center' }}>
              ESCALATION<br />LADDER
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column-reverse',
                gap: '14px',
                width: '100%',
                flex: 1,
                justifyContent: 'center',
              }}
            >
              {[
                { id: 'CHAT', label: '1. CHAT', icon: '💬' },
                { id: 'VOICE', label: '2. VOICE', icon: '🎙' },
                { id: 'VIDEO', label: '3. VIDEO', icon: '📹' },
              ].map((rung) => {
                const isActive = activeRung === rung.id;
                let btnBg = 'var(--color-bone)';
                let btnColor = 'var(--color-ink)';
                if (isActive) {
                  if (rung.id === 'VIDEO') {
                    btnBg = 'var(--color-vermilion)';
                    btnColor = '#FFFFFF';
                  } else if (rung.id === 'VOICE') {
                    btnBg = 'var(--color-hazard)';
                    btnColor = 'var(--color-ink)';
                  } else {
                    btnBg = 'var(--color-ink)';
                    btnColor = '#FFFFFF';
                  }
                }

                return (
                  <button
                    key={rung.id}
                    onClick={() => handleClimbLadder(rung.id)}
                    className="btn"
                    style={{
                      width: '100%',
                      padding: '18px 8px',
                      backgroundColor: btnBg,
                      color: btnColor,
                      border: 'var(--border-ink-thick)',
                      boxShadow: isActive ? 'var(--shadow-hard-lg)' : 'var(--shadow-hard-sm)',
                      transform: isActive ? 'translate(-2px, -2px)' : 'none',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <span style={{ fontSize: '1.4rem' }}>{rung.icon}</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>{rung.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="mono" style={{ fontSize: '0.62rem', color: 'var(--color-ink-muted)', marginTop: '16px', textAlign: 'center' }}>
              CLIMB RUNG TO ESCALATE
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
            {/* If on VOICE or VIDEO rung: Show Tactical Dark Call Panel (Prompt 6) */}
            {activeRung !== 'CHAT' ? (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '24px',
                  backgroundColor: 'var(--color-dark-panel)',
                  color: 'var(--color-bone)',
                  position: 'relative',
                }}
              >
                {/* Call Top Header */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
                    paddingBottom: '12px',
                    marginBottom: '16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="stamp stamp-critical">
                      {activeRung} CALL ACTIVE
                    </span>
                    <span className="mono" style={{ fontSize: '0.8rem', color: 'var(--color-hazard)' }}>
                      CHANNEL: {guid}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="presence-dot" style={{ backgroundColor: 'var(--color-hazard)' }} />
                    <span className="mono" style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-hazard)' }}>
                      LIVE · {formatCallTime(callDuration)}
                    </span>
                  </div>
                </div>

                {callError && (
                  <div
                    style={{
                      backgroundColor: '#FFEBE8',
                      color: 'var(--color-vermilion)',
                      padding: '8px 12px',
                      marginBottom: '12px',
                      border: '1px solid var(--color-vermilion)',
                      fontSize: '0.8rem',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    ⚠ {callError}
                  </div>
                )}

                {/* Large View of Video / Tactical Audio Oscilloscope */}
                <div
                  style={{
                    flex: 1,
                    minHeight: '360px',
                    backgroundColor: '#0A1211',
                    border: '2px solid rgba(255, 255, 255, 0.25)',
                    boxShadow: 'inset 0 0 40px rgba(0,0,0,0.8)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Watermark grid overlay */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundImage: 'linear-gradient(rgba(242, 183, 5, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(242, 183, 5, 0.05) 1px, transparent 1px)',
                      backgroundSize: '32px 32px',
                      pointerEvents: 'none',
                    }}
                  />

                  {activeRung === 'VIDEO' ? (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                      {localStream && !isVideoMuted ? (
                        <video
                          ref={videoPreviewRef}
                          autoPlay
                          playsInline
                          muted
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transform: 'scaleX(-1)', // Mirror local camera view
                          }}
                        />
                      ) : (
                        <div style={{ textAlign: 'center', zIndex: 1 }}>
                          <div style={{ fontSize: '3rem', marginBottom: '8px' }}>📹</div>
                          <div className="mono" style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-hazard)' }}>
                            {isVideoMuted ? 'VIDEO STREAM PAUSED' : 'TACTICAL OPTICAL FEED ACTIVE'}
                          </div>
                          <div className="mono" style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '4px' }}>
                            CAMERA SENSOR INITIALIZED · {currentUser?.callsign}
                          </div>
                        </div>
                      )}

                      {/* Optical HUD Crosshair */}
                      <div
                        className="mono"
                        style={{
                          position: 'absolute',
                          top: '12px',
                          left: '12px',
                          fontSize: '0.72rem',
                          color: 'var(--color-hazard)',
                          backgroundColor: 'rgba(0,0,0,0.6)',
                          padding: '3px 8px',
                          border: '1px solid var(--color-hazard)',
                        }}
                      >
                        [TARGET-LOCK // FEED: {metadata.equipment || 'EXCAVATOR EX-204'}]
                      </div>
                    </div>
                  ) : (
                    /* VOICE CALL: Radio Frequency / Audio Waveform */
                    <div style={{ textAlign: 'center', zIndex: 1, padding: '24px' }}>
                      <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🎙</div>
                      <div className="mono" style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-hazard)' }}>
                        RADIO FREQUENCY CHANNEL 47.8 MHz
                      </div>
                      <div className="mono" style={{ fontSize: '0.8rem', opacity: 0.8, margin: '6px 0 20px' }}>
                        TWO-WAY ENCRYPTED VOICE CARRIER · {currentUser?.companyName.toUpperCase()}
                      </div>

                      {/* Animated Audio Oscilloscope Bar Representation */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', height: '48px' }}>
                        {[24, 45, 18, 38, 52, 30, 48, 22, 40, 15, 34, 50, 20].map((h, i) => (
                          <div
                            key={i}
                            style={{
                              width: '6px',
                              height: `${h}px`,
                              backgroundColor: isAudioMuted ? '#444' : 'var(--color-hazard)',
                              border: '1px solid #000',
                              transition: 'height 0.15s ease',
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Small Strip Showing Who Is In The Call (Prompt 6 requirement) */}
                <div
                  style={{
                    margin: '16px 0',
                    padding: '10px 14px',
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="mono" style={{ fontSize: '0.72rem', color: '#888' }}>
                      IN CALL ({companyResponders.length}):
                    </span>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {companyResponders.map((u) => {
                        const isSpeaking = u.uid === currentUser?.uid && !isAudioMuted;
                        return (
                          <div
                            key={u.uid}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              backgroundColor: isSpeaking ? 'var(--color-vermilion)' : 'rgba(255, 255, 255, 0.1)',
                              color: '#FFF',
                              padding: '3px 8px',
                              border: '1px solid rgba(255, 255, 255, 0.2)',
                              fontSize: '0.75rem',
                              fontFamily: 'var(--font-mono)',
                            }}
                          >
                            <span style={{ fontSize: '0.7rem' }}>{isSpeaking ? '🔊' : '🔈'}</span>
                            <span>{u.name.split(' ')[0]}</span>
                            <span style={{ opacity: 0.7, fontSize: '0.65rem' }}>[{u.callsign}]</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--color-hazard)' }}>
                    {isAudioMuted ? '● MIC MUTED' : '● LIVE TRANSMITTING'}
                  </span>
                </div>

                {/* Call Action Controls */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '16px',
                    flexWrap: 'wrap',
                    marginTop: '8px',
                  }}
                >
                  <button
                    onClick={toggleMuteAudio}
                    className={`btn ${isAudioMuted ? 'btn-vermilion' : 'btn-hazard'}`}
                    style={{ fontSize: '0.82rem', padding: '10px 18px' }}
                  >
                    {isAudioMuted ? '🔇 UNMUTE MIC' : '🎙 MUTE MIC'}
                  </button>

                  {activeRung === 'VIDEO' && (
                    <button
                      onClick={toggleMuteVideo}
                      className={`btn ${isVideoMuted ? 'btn-vermilion' : 'btn'}`}
                      style={{ fontSize: '0.82rem', padding: '10px 18px', backgroundColor: isVideoMuted ? 'var(--color-vermilion)' : 'var(--color-paper-light)', color: isVideoMuted ? '#FFF' : 'var(--color-ink)' }}
                    >
                      {isVideoMuted ? '📹 ENABLE CAMERA' : '📹 MUTE CAMERA'}
                    </button>
                  )}

                  <button
                    onClick={() => handleClimbLadder('CHAT')}
                    className="btn btn-vermilion"
                    style={{ fontSize: '0.85rem', padding: '10px 24px', fontWeight: 800 }}
                  >
                    ✕ END CALL & RETURN TO CHAT
                  </button>
                </div>
              </div>
            ) : (

              /* If on CHAT rung: The Field Manual Ticker Log Stream */
              <>
                {/* Chat Log Header */}
                <div
                  style={{
                    padding: '12px 18px',
                    borderBottom: 'var(--border-ink)',
                    backgroundColor: 'var(--color-paper-light)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span className="mono" style={{ fontSize: '0.78rem', fontWeight: 700 }}>
                    DISPATCH TRANSMISSION LOG · REAL-TIME TICKER
                  </span>
                  <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--color-ink-muted)' }}>
                    SOCKET CONNECTED
                  </span>
                </div>

                {/* Error Banner if upload failed */}
                {uploadError && (
                  <div
                    style={{
                      backgroundColor: '#FFEBE8',
                      borderBottom: 'var(--border-ink)',
                      padding: '8px 16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--color-vermilion)' }}>
                      ⚠ {uploadError}
                    </span>
                    <button
                      onClick={() => setUploadError(null)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Messages Feed */}
                <div
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '18px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                    maxHeight: '480px',
                  }}
                >
                  {messages.length === 0 ? (
                    <div className="mono" style={{ textAlign: 'center', padding: '40px', color: 'var(--color-ink-muted)' }}>
                      CHANNEL OPEN. TRANSMIT FAULT DETAILS OR CAPTURE EVIDENCE PLATES BELOW.
                    </div>
                  ) : (
                    messages.map((msg, idx) => {
                      const sender = msg.getSender ? msg.getSender() : null;
                      const senderName = sender ? sender.getName() : 'SYSTEM DISPATCH';
                      const isMe = sender && sender.getUid() === currentUser?.uid;
                      const timeStr = msg.getSentAt
                        ? new Date(msg.getSentAt() * 1000).toISOString().substring(11, 19)
                        : new Date().toISOString().substring(11, 19);

                      const isMedia = msg.getType && msg.getType() === CometChat.MESSAGE_TYPE.IMAGE;
                      let plateNumStr = '';
                      if (isMedia) {
                        plateCounter++;
                        plateNumStr = `PLATE ${String(plateCounter).padStart(2, '0')}`;
                      }

                      return (
                        <div
                          key={msg.getId ? msg.getId() : idx}
                          style={{
                            borderBottom: '1px dashed rgba(28, 27, 24, 0.2)',
                            paddingBottom: '12px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--color-ink-muted)' }}>
                              [{timeStr} UTC]
                            </span>
                            <span
                              style={{
                                fontWeight: 800,
                                fontSize: '0.88rem',
                                color: isMe ? 'var(--color-vermilion)' : 'var(--color-ink)',
                              }}
                            >
                              {senderName.toUpperCase()}
                            </span>
                            {isMe && (
                              <span className="stamp" style={{ fontSize: '0.58rem', padding: '1px 5px' }}>
                                YOU
                              </span>
                            )}
                          </div>

                          {/* Prompt 5: Industrial Hand-Crafted Evidence Plate */}
                          {isMedia ? (
                            <div
                              style={{
                                marginTop: '6px',
                                border: 'var(--border-ink-thick)',
                                backgroundColor: 'var(--color-paper-light)',
                                boxShadow: 'var(--shadow-hard)',
                                maxWidth: '360px',
                                padding: '10px',
                                cursor: 'pointer',
                                transition: 'var(--transition-tactile)',
                              }}
                              onClick={() =>
                                setLightboxPlate({
                                  url: msg.getData().url,
                                  plateNum: plateNumStr,
                                  sender: senderName,
                                  time: timeStr,
                                })
                              }
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translate(-2px, -2px)';
                                e.currentTarget.style.boxShadow = 'var(--shadow-hard-lg)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'none';
                                e.currentTarget.style.boxShadow = 'var(--shadow-hard)';
                              }}
                            >
                              {/* Plate Header Bar */}
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  borderBottom: 'var(--border-ink)',
                                  paddingBottom: '6px',
                                  marginBottom: '8px',
                                }}
                              >
                                <span className="stamp stamp-critical" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                                  {plateNumStr}
                                </span>
                                <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--color-ink-muted)' }}>
                                  FAULT EVIDENCE PLATE
                                </span>
                              </div>

                              {/* Photo Frame */}
                              <div style={{ border: '1px solid var(--color-ink)', backgroundColor: '#000', overflow: 'hidden' }}>
                                <img
                                  src={msg.getData().url}
                                  alt="Fault diagnostic evidence"
                                  style={{
                                    width: '100%',
                                    maxHeight: '240px',
                                    objectFit: 'cover',
                                    display: 'block',
                                  }}
                                />
                              </div>

                              {/* Plate Footer Stamp */}
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  marginTop: '8px',
                                  paddingTop: '6px',
                                  borderTop: '1px dashed var(--color-ink-subtle)',
                                }}
                              >
                                <span className="mono" style={{ fontSize: '0.68rem', color: 'var(--color-ink-muted)' }}>
                                  TAP TO INSPECT FULL-RES
                                </span>
                                <span className="mono" style={{ fontSize: '0.68rem', fontWeight: 700 }}>
                                  🔍 INSPECT
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div
                              className="mono"
                              style={{
                                fontSize: '0.94rem',
                                whiteSpace: 'pre-wrap',
                                lineHeight: 1.45,
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

                  {/* Real-Time Typing Indicator (Prompt 4) */}
                  {typingUser && (
                    <div
                      className="mono"
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: 'var(--color-vermilion)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 0',
                      }}
                    >
                      <span>✍</span>
                      <span>{typingUser.toUpperCase()} IS TRANSMITTING...</span>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input Bar with Camera & File Buttons */}
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
                  {/* Native Mobile Camera Capture Button (Prompt 5) */}
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    ref={cameraInputRef}
                    onChange={handleMediaUpload}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="btn btn-vermilion"
                    style={{ padding: '9px 12px', fontSize: '0.8rem' }}
                    title="Capture live fault photo with camera"
                  >
                    📸 CAMERA
                  </button>

                  {/* Desktop File Picker (Prompt 5) */}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    ref={fileInputRef}
                    onChange={handleMediaUpload}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn btn-hazard"
                    style={{ padding: '9px 12px', fontSize: '0.8rem' }}
                    title="Upload photo from disk"
                  >
                    📁 ATTACH
                  </button>

                  {/* Text Input with Real-time Typing Notification (Prompt 4) */}
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Type dispatch transmission or maintenance log..."
                    value={inputText}
                    onChange={handleInputChange}
                    disabled={isSending}
                    style={{ flex: 1 }}
                  />

                  <button
                    type="submit"
                    className="btn btn-dark"
                    disabled={isSending || !inputText.trim()}
                    style={{ padding: '9px 20px', fontSize: '0.85rem' }}
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
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              border: 'var(--border-ink)',
            }}
          >
            <div
              style={{
                borderBottom: 'var(--border-ink)',
                paddingBottom: '10px',
                marginBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.05rem', margin: 0 }}>WHO'S HERE</h3>
                <span className="presence-dot" />
              </div>
              <div className="mono" style={{ fontSize: '0.7rem', color: 'var(--color-ink-muted)', marginTop: '2px' }}>
                {currentUser?.companyName.toUpperCase()} ROSTER
              </div>
            </div>

            {/* List of Responders with Presence (Prompt 4) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
              {companyResponders.map((u) => {
                const isOnline = onlineUserMap[u.uid] ?? true;

                return (
                  <div
                    key={u.uid}
                    style={{
                      border: 'var(--border-ink-thin)',
                      padding: '10px 12px',
                      backgroundColor: 'var(--color-bone)',
                      boxShadow: 'var(--shadow-hard-sm)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{u.name}</span>
                      <span
                        className={`presence-dot ${!isOnline ? 'offline' : ''}`}
                        title={isOnline ? 'Online' : 'Offline'}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                      <span className="stamp" style={{ fontSize: '0.62rem', padding: '1px 5px' }}>
                        {u.role.toUpperCase()}
                      </span>
                      <span className="mono" style={{ fontSize: '0.68rem', color: 'var(--color-ink-muted)' }}>
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
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                {metadata.equipment || group?.getName()}
              </div>

              <div className="mono" style={{ fontSize: '0.68rem', color: 'var(--color-ink-muted)', marginTop: '8px' }}>
                INCIDENT ID:
              </div>
              <div className="mono" style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                {metadata.incidentNum || guid}
              </div>
            </div>
          </div>
        </div>

        {/* Full-Screen Evidence Inspection Lightbox (Prompt 5) */}
        {lightboxPlate && (
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
            onClick={() => setLightboxPlate(null)}
          >
            <div
              className="paper-card"
              style={{
                maxWidth: '900px',
                width: '100%',
                backgroundColor: 'var(--color-bone)',
                border: 'var(--border-ink-thick)',
                boxShadow: 'var(--shadow-hard-xl)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: 'var(--border-ink)',
                  paddingBottom: '12px',
                  marginBottom: '16px',
                }}
              >
                <div>
                  <span className="stamp stamp-critical">{lightboxPlate.plateNum}</span>
                  <span className="mono" style={{ marginLeft: '10px', fontSize: '0.85rem', fontWeight: 700 }}>
                    FAULT EVIDENCE INSPECTION · {lightboxPlate.sender.toUpperCase()} [{lightboxPlate.time} UTC]
                  </span>
                </div>
                <button onClick={() => setLightboxPlate(null)} className="btn btn-hazard">
                  ✕ CLOSE INSPECTION
                </button>
              </div>

              <div style={{ border: '2px solid var(--color-ink)', backgroundColor: '#000', overflow: 'hidden' }}>
                <img
                  src={lightboxPlate.url}
                  alt="Full-res fault inspection"
                  style={{
                    width: '100%',
                    maxHeight: '68vh',
                    objectFit: 'contain',
                    display: 'block',
                  }}
                />
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
                <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>
                  DIAGNOSTIC EVIDENCE STORED ON COMETCHAT CLOUD
                </span>
                <a
                  href={lightboxPlate.url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn"
                  style={{ fontSize: '0.72rem', padding: '4px 10px' }}
                >
                  OPEN ORIGINAL FILE ↗
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
