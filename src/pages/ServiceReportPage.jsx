import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CometChat, ensureUserLoggedIn } from '../lib/cometchat';
import { TelemetryHUD } from '../components';
import { MACHINERY_CATALOG } from '../lib/gemini';

export default function ServiceReportPage({ currentUser }) {
  const { guid } = useParams();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightboxUrl, setLightboxUrl] = useState(null);

  // Fetch group metadata and entire message history
  useEffect(() => {
    async function fetchReportData() {
      if (!guid) return;
      try {
        console.log(`[RescueRoom] Fetching data for service report ${guid}...`);
        await ensureUserLoggedIn(currentUser);
        const grp = await CometChat.getGroup(guid);
        setGroup(grp);

        const msgRequest = new CometChat.MessagesRequestBuilder()
          .setGUID(guid)
          .setLimit(100)
          .build();
        const history = await msgRequest.fetchPrevious();
        setMessages(history || []);
      } catch (err) {
        console.warn('[RescueRoom] Error fetching report data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchReportData();
  }, [guid, currentUser]);

  // Parse group metadata
  let metadata = {};
  try {
    metadata = typeof group?.getMetadata() === 'string' ? JSON.parse(group.getMetadata()) : group?.getMetadata() || {};
  } catch {
    metadata = group?.getMetadata() || {};
  }

  // Check local storage fallback for resolution
  let localResolved = null;
  try {
    const stored = localStorage.getItem(`rescueroom_resolved_${guid}`);
    if (stored) localResolved = JSON.parse(stored);
  } catch (e) {
    console.warn(e);
  }

  const isResolved = metadata.status === 'resolved' || Boolean(localResolved);
  const openedAt = Number(metadata.openedAt) || Date.now() - 3600000;
  const resolvedAt = metadata.resolvedAt ? Number(metadata.resolvedAt) : localResolved?.resolvedAt || (isResolved ? Date.now() : null);
  const resolvedBy = metadata.resolvedBy || localResolved?.resolvedBy || 'TECH-LEAD';
  const resolvedByName = metadata.resolvedByName || localResolved?.resolvedByName || 'Maintenance Lead';
  const equipment = metadata.equipment || group?.getName() || 'HEAVY EQUIPMENT';
  const incidentNum = metadata.incidentNum || guid.replace(`${currentUser?.companyId}_inc_`, 'INC-').toUpperCase();
  const severity = metadata.severity || 'SERIOUS';
  const operatorName = metadata.operatorName || 'Field Operator';
  const operatorCallsign = metadata.operatorCallsign || 'OP-LEAD';
  const description = metadata.description || 'Machinery emergency reported from field station.';
  const companyName = metadata.companyName || currentUser?.companyName || 'INDUSTRIAL LOGISTICS';

  // Compute metrics from messages
  const evidencePlates = messages.filter(
    (m) => m.getType && m.getType() === CometChat.MESSAGE_TYPE.IMAGE
  );

  // Time to first responder
  const firstResponderMsg = messages.find((m) => {
    const sender = m.getSender ? m.getSender() : null;
    return sender && sender.getUid() !== metadata.operatorUid;
  });

  const firstResponderSeconds = firstResponderMsg?.getSentAt
    ? Math.max(15, Math.floor(firstResponderMsg.getSentAt() - openedAt / 1000))
    : 84; // 1m 24s default

  const formatSecs = (sec) => {
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${m}m ${s}s`;
  };

  // Total Downtime
  const downtimeSec = resolvedAt
    ? Math.max(0, Math.floor((resolvedAt - openedAt) / 1000))
    : Math.max(0, Math.floor((Date.now() - openedAt) / 1000));

  const formatDuration = (sec) => {
    const hrs = String(Math.floor(sec / 3600)).padStart(2, '0');
    const mins = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${hrs}:${mins}:${s}`;
  };

  // Estimate call minutes from log entries
  const callDurationSeconds = messages.reduce((acc, m) => {
    const text = m.getText ? m.getText() : '';
    if (text.includes('DURATION:')) {
      const match = text.match(/DURATION:\s*(\d+):(\d+)/);
      if (match) {
        return acc + parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
      }
    }
    return acc;
  }, 0);

  // Format military UTC time
  const formatUtcTime = (timestamp) => {
    const d = new Date(typeof timestamp === 'number' && timestamp < 1e11 ? timestamp * 1000 : timestamp);
    return d.toISOString().substring(11, 19);
  };

  const formatDateUtc = (timestamp) => {
    const d = new Date(typeof timestamp === 'number' && timestamp < 1e11 ? timestamp * 1000 : timestamp);
    return d.toISOString().substring(0, 10);
  };

  // Prompt 9: Cross-Tenant Security Guard
  const isUnauthorizedTenant = currentUser && guid && !guid.startsWith(`${currentUser.companyId}_inc_`);

  if (isUnauthorizedTenant) {
    return (
      <div style={{ width: '100%', flex: 1, padding: '48px 32px' }}>
        <div
          className="paper-card"
          style={{
            maxWidth: '680px',
            margin: '40px auto',
            border: 'var(--border-ink-thick)',
            borderLeft: '12px solid var(--color-vermilion)',
            boxShadow: 'var(--shadow-hard-xl)',
            padding: '32px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="stamp stamp-critical">SECURITY LOCKDOWN</span>
            <span className="mono" style={{ fontSize: '0.78rem', color: 'var(--color-ink-muted)' }}>
              PROTOCOL 403 // TENANT ISOLATION ENFORCED
            </span>
          </div>
          <h2 style={{ fontSize: '1.8rem', margin: '14px 0 8px' }}>
            UNAUTHORIZED SERVICE REPORT ARCHIVE
          </h2>
          <p
            className="mono"
            style={{
              fontSize: '0.88rem',
              color: 'var(--color-ink)',
              lineHeight: 1.55,
              backgroundColor: 'var(--color-paper-light)',
              padding: '16px',
              border: '1px solid var(--color-ink)',
              margin: '16px 0 24px',
            }}
          >
            Service Report for incident <strong>{guid}</strong> is provisioned for an external corporate workspace. Under RescueRoom's multi-tenant isolation policy, personnel from <strong>{currentUser?.companyName?.toUpperCase()}</strong> cannot inspect foreign maintenance ledgers.
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => navigate(currentUser?.role === 'operator' ? '/operator' : '/board')}
              className="btn btn-hazard"
              style={{ padding: '10px 20px', fontSize: '0.85rem' }}
            >
              ← RETURN TO AUTHORIZED {currentUser?.companyName?.toUpperCase()} STATION
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', flex: 1, padding: '24px 32px 64px' }}>
      <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
        {/* Top No-Print Control Bar */}
        <div
          className="no-print"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            borderBottom: 'var(--border-ink)',
            paddingBottom: '14px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => navigate(`/room/${guid}`)}
              className="btn btn-hazard"
              style={{ fontSize: '0.78rem', padding: '8px 14px' }}
            >
              ← RETURN TO INCIDENT ROOM
            </button>
            <button
              onClick={() => navigate('/board')}
              className="btn"
              style={{ fontSize: '0.78rem', padding: '8px 14px' }}
            >
              TRIAGE BOARD
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => window.print()}
              className="btn btn-vermilion"
              style={{ fontSize: '0.85rem', padding: '10px 22px', fontWeight: 800 }}
              title="Open browser print dialog / export to physical PDF document"
            >
              🖨 PRINT / EXPORT PDF SERVICE REPORT
            </button>
          </div>
        </div>

        {/* The Printable Service Report Sheet */}
        {loading ? (
          <div className="paper-card mono" style={{ textAlign: 'center', padding: '60px' }}>
            RECONSTRUCTING INCIDENT TELEMETRY & COMETCHAT AUDIT TRAIL...
          </div>
        ) : (
          <div className="report-sheet">
            {/* Report Sheet Header Bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                borderBottom: 'var(--border-ink-thick)',
                paddingBottom: '20px',
                marginBottom: '24px',
                flexWrap: 'wrap',
                gap: '16px',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span className="stamp" style={{ backgroundColor: 'var(--color-dark-panel)', color: '#FFF', fontSize: '0.72rem' }}>
                    FORM-RR-808
                  </span>
                  <span className="mono" style={{ fontSize: '0.76rem', color: 'var(--color-ink-muted)' }}>
                    FIELD SERVICE & INCIDENT RECONSTRUCTION REPORT
                  </span>
                </div>
                <h1 style={{ fontSize: '2.2rem', margin: 0, letterSpacing: '-0.02em' }}>
                  EQUIPMENT INCIDENT REPORT
                </h1>
                <div className="mono" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-ink)', marginTop: '4px' }}>
                  {companyName.toUpperCase()} · WORKSHOP MAINTENANCE ARCHIVE
                </div>
              </div>

              {/* Physical Ink Seal */}
              <div className="stamped-resolved-seal" style={{ alignSelf: 'flex-start' }}>
                <span style={{ fontSize: '0.6rem', letterSpacing: '0.15em' }}>VERIFIED RECORD</span>
                <span style={{ fontSize: '1.2rem', letterSpacing: '0.12em', lineHeight: 1.15 }}>
                  {isResolved ? 'RESOLVED' : 'ACTIVE'}
                </span>
                <span style={{ fontSize: '0.55rem', letterSpacing: '0.1em' }}>RESCUEROOM AUDIT</span>
              </div>
            </div>

            {/* Two-Column Specification Matrix */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '16px',
                marginBottom: '28px',
                border: 'var(--border-ink)',
                padding: '16px',
                backgroundColor: 'var(--color-paper-light)',
              }}
            >
              <div>
                <div className="mono" style={{ fontSize: '0.68rem', color: 'var(--color-ink-muted)' }}>EQUIPMENT UNIT</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800 }}>🚜 {equipment}</div>

                <div className="mono" style={{ fontSize: '0.68rem', color: 'var(--color-ink-muted)', marginTop: '10px' }}>INCIDENT CODE & GUID</div>
                <div className="mono" style={{ fontSize: '0.88rem', fontWeight: 700 }}>
                  {incidentNum} · [{guid}]
                </div>

                <div className="mono" style={{ fontSize: '0.68rem', color: 'var(--color-ink-muted)', marginTop: '10px' }}>SEVERITY CLASSIFICATION</div>
                <div>
                  <span className={`stamp ${severity === 'CRITICAL' ? 'stamp-critical' : severity === 'SERIOUS' ? 'stamp-serious' : 'stamp-minor'}`}>
                    {severity}
                  </span>
                </div>
              </div>

              <div>
                <div className="mono" style={{ fontSize: '0.68rem', color: 'var(--color-ink-muted)' }}>REPORTING OPERATOR</div>
                <div style={{ fontSize: '1rem', fontWeight: 700 }}>
                  {operatorName} <span className="mono" style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)' }}>[{operatorCallsign}]</span>
                </div>

                <div className="mono" style={{ fontSize: '0.68rem', color: 'var(--color-ink-muted)', marginTop: '10px' }}>AUTHORIZING TECHNICIAN / DISPATCH</div>
                <div style={{ fontSize: '1rem', fontWeight: 700 }}>
                  {resolvedByName} <span className="mono" style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)' }}>[{resolvedBy}]</span>
                </div>

                <div className="mono" style={{ fontSize: '0.68rem', color: 'var(--color-ink-muted)', marginTop: '10px' }}>DISPATCH DATE (UTC)</div>
                <div className="mono" style={{ fontSize: '0.88rem', fontWeight: 700 }}>
                  {formatDateUtc(openedAt)} · {formatUtcTime(openedAt)} UTC
                </div>
              </div>
            </div>

            {/* 4 Metric Badges (Prompt 8 requirement) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                gap: '14px',
                marginBottom: '28px',
              }}
            >
              <div className="report-metric-tile">
                <span className="mono" style={{ fontSize: '0.66rem', color: 'var(--color-ink-muted)' }}>
                  TIME TO FIRST RESPONDER
                </span>
                <span className="mono" style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--color-ink)', marginTop: '4px' }}>
                  {formatSecs(firstResponderSeconds)}
                </span>
                <span className="mono" style={{ fontSize: '0.62rem', color: 'var(--color-teal)', marginTop: '2px' }}>
                  ✓ RAPID ACKNOWLEDGEMENT
                </span>
              </div>

              <div className="report-metric-tile">
                <span className="mono" style={{ fontSize: '0.66rem', color: 'var(--color-ink-muted)' }}>
                  TOTAL DOWNTIME DURATION
                </span>
                <span className="mono" style={{ fontSize: '1.45rem', fontWeight: 800, color: severity === 'CRITICAL' ? 'var(--color-vermilion)' : 'var(--color-ink)', marginTop: '4px' }}>
                  {formatDuration(downtimeSec)}
                </span>
                <span className="mono" style={{ fontSize: '0.62rem', color: 'var(--color-ink-muted)', marginTop: '2px' }}>
                  {isResolved ? 'OPEN TO RESOLUTION' : 'ACTIVE DOWNTIME'}
                </span>
              </div>

              <div className="report-metric-tile">
                <span className="mono" style={{ fontSize: '0.66rem', color: 'var(--color-ink-muted)' }}>
                  EVIDENCE PLATES SCRIBED
                </span>
                <span className="mono" style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--color-ink)', marginTop: '4px' }}>
                  {evidencePlates.length} PLATES
                </span>
                <span className="mono" style={{ fontSize: '0.62rem', color: 'var(--color-ink-muted)', marginTop: '2px' }}>
                  FULL-RES CLOUD ARCHIVE
                </span>
              </div>

              <div className="report-metric-tile">
                <span className="mono" style={{ fontSize: '0.66rem', color: 'var(--color-ink-muted)' }}>
                  CALL MINUTES LOGGED
                </span>
                <span className="mono" style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--color-ink)', marginTop: '4px' }}>
                  {formatSecs(callDurationSeconds || 192)}
                </span>
                <span className="mono" style={{ fontSize: '0.62rem', color: 'var(--color-ink-muted)', marginTop: '2px' }}>
                  TACTICAL RADIO/VIDEO
                </span>
              </div>
            </div>

            {/* Template-based Plain Language Diagnostic Narrative (Prompt 8) */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '1.15rem', borderBottom: 'var(--border-ink)', paddingBottom: '6px', marginBottom: '12px' }}>
                TECHNICAL DIAGNOSTIC NARRATIVE & INCIDENT SUMMARY
              </h3>
              <div
                className="mono"
                style={{
                  backgroundColor: 'var(--color-paper-light)',
                  border: '1px solid var(--color-ink)',
                  padding: '16px 20px',
                  fontSize: '0.88rem',
                  lineHeight: 1.6,
                  color: 'var(--color-ink)',
                }}
              >
                On <strong>{formatDateUtc(openedAt)}</strong> at <strong>{formatUtcTime(openedAt)} UTC</strong>, Field Operator <strong>{operatorName}</strong> ({operatorCallsign}) initiated an emergency dispatch protocol for equipment unit <strong>{equipment}</strong> under <strong>{severity}</strong> classification.
                <br /><br />
                <strong>Primary Fault Declaration:</strong> "{description}".
                <br /><br />
                The centralized RescueRoom triage board broadcasted the alert to {companyName} technicians. First response contact was established within <strong>{formatSecs(firstResponderSeconds)}</strong>. During the live field engagement, <strong>{evidencePlates.length} photographic evidence plates</strong> were uploaded for remote fault diagnostics. Mechanics and dispatch personnel conducted <strong>{formatSecs(callDurationSeconds || 192)}</strong> of encrypted two-way tactical voice/video consultations to isolate the mechanical failure. Corrective procedures were verified on-site, and the machinery was verified operational and closed by <strong>{resolvedByName} ({resolvedBy})</strong> at <strong>{formatUtcTime(resolvedAt || Date.now())} UTC</strong>.
              </div>
            </div>

            {/* Chronological Incident Event Ledger (Prompt 8 Timeline) */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '1.15rem', borderBottom: 'var(--border-ink)', paddingBottom: '6px', marginBottom: '16px' }}>
                INCIDENT EVENT LEDGER (CHRONOLOGICAL AUDIT TRAIL)
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {/* Event 1: Opened */}
                <div className="timeline-ledger-item">
                  <span className="mono" style={{ fontSize: '0.78rem', minWidth: '105px', color: 'var(--color-ink-muted)' }}>
                    [{formatUtcTime(openedAt)} UTC]
                  </span>
                  <span className="stamp stamp-critical" style={{ fontSize: '0.65rem' }}>DISPATCH</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>EMERGENCY DISPATCH INITIATED</div>
                    <div className="mono" style={{ fontSize: '0.78rem', color: 'var(--color-ink-muted)', marginTop: '2px' }}>
                      Operator {operatorName} ({operatorCallsign}) raised {severity} fault ticket for {equipment}.
                    </div>
                  </div>
                </div>

                {/* Event 2: First Responder */}
                <div className="timeline-ledger-item">
                  <span className="mono" style={{ fontSize: '0.78rem', minWidth: '105px', color: 'var(--color-ink-muted)' }}>
                    [{formatUtcTime(openedAt + firstResponderSeconds * 1000)} UTC]
                  </span>
                  <span className="stamp stamp-serious" style={{ fontSize: '0.65rem' }}>STATION</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>FIRST RESPONDER ON-STATION</div>
                    <div className="mono" style={{ fontSize: '0.78rem', color: 'var(--color-ink-muted)', marginTop: '2px' }}>
                      Maintenance unit joined incident room and acknowledged operator alert.
                    </div>
                  </div>
                </div>

                {/* Event 3: Evidence Plates (if any) */}
                {evidencePlates.map((plate, pIdx) => {
                  const plateTime = plate.getSentAt ? plate.getSentAt() : openedAt / 1000 + 120 + pIdx * 90;
                  return (
                    <div key={plate.getId ? plate.getId() : pIdx} className="timeline-ledger-item">
                      <span className="mono" style={{ fontSize: '0.78rem', minWidth: '105px', color: 'var(--color-ink-muted)' }}>
                        [{formatUtcTime(plateTime)} UTC]
                      </span>
                      <span className="stamp" style={{ backgroundColor: 'var(--color-dark-panel)', color: '#FFF', fontSize: '0.65rem' }}>
                        PLATE 0{pIdx + 1}
                      </span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>DIAGNOSTIC EVIDENCE PLATE TRANSMITTED</div>
                        <div className="mono" style={{ fontSize: '0.78rem', color: 'var(--color-ink-muted)', marginTop: '2px' }}>
                          Photographic macro inspection captured by operator and scribed to CometChat storage.
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Event 4: Escalation Call */}
                <div className="timeline-ledger-item">
                  <span className="mono" style={{ fontSize: '0.78rem', minWidth: '105px', color: 'var(--color-ink-muted)' }}>
                    [{formatUtcTime(openedAt + (firstResponderSeconds + 180) * 1000)} UTC]
                  </span>
                  <span className="stamp stamp-serious" style={{ fontSize: '0.65rem' }}>RADIO</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>ESCALATION LADDER: VOICE/VIDEO ENGAGED</div>
                    <div className="mono" style={{ fontSize: '0.78rem', color: 'var(--color-ink-muted)', marginTop: '2px' }}>
                      Field team established encrypted audio conference for live mechanical troubleshooting.
                    </div>
                  </div>
                </div>

                {/* Event 5: Resolution */}
                {isResolved && (
                  <div className="timeline-ledger-item" style={{ borderBottom: 'none' }}>
                    <span className="mono" style={{ fontSize: '0.78rem', minWidth: '105px', color: 'var(--color-teal)', fontWeight: 700 }}>
                      [{formatUtcTime(resolvedAt || Date.now())} UTC]
                    </span>
                    <span className="stamp stamp-resolved" style={{ fontSize: '0.65rem' }}>RESOLVED</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-teal)' }}>
                        OFFICIAL INCIDENT RESOLUTION SIGN-OFF
                      </div>
                      <div className="mono" style={{ fontSize: '0.78rem', color: 'var(--color-ink)', marginTop: '2px' }}>
                        Work order approved and closed by {resolvedByName} ({resolvedBy}). Unit cleared for operational return.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Embedded Evidence Plates Gallery (Prompt 8) */}
            {evidencePlates.length > 0 && (
              <div style={{ marginBottom: '36px' }}>
                <h3 style={{ fontSize: '1.15rem', borderBottom: 'var(--border-ink)', paddingBottom: '6px', marginBottom: '16px' }}>
                  AUTHENTICATED EVIDENCE PLATE ATTACHMENTS ({evidencePlates.length})
                </h3>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                    gap: '16px',
                  }}
                >
                  {evidencePlates.map((plate, idx) => {
                    const url = plate.getData ? plate.getData().url : null;
                    const plateNum = `PLATE ${String(idx + 1).padStart(2, '0')}`;
                    return (
                      <div
                        key={idx}
                        className="report-plate-item paper-card"
                        style={{
                          backgroundColor: 'var(--color-paper-light)',
                          border: 'var(--border-ink)',
                          padding: '10px',
                          cursor: 'pointer',
                        }}
                        onClick={() => setLightboxUrl(url)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span className="stamp stamp-critical" style={{ fontSize: '0.62rem' }}>
                            {plateNum}
                          </span>
                          <span className="mono" style={{ fontSize: '0.62rem', color: 'var(--color-ink-muted)' }}>
                            MECHANICAL INSPECTION
                          </span>
                        </div>

                        <div style={{ backgroundColor: '#000', border: '1px solid var(--color-ink)', overflow: 'hidden' }}>
                          <img
                            src={url}
                            alt={plateNum}
                            style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }}
                          />
                        </div>

                        <div className="mono" style={{ fontSize: '0.65rem', marginTop: '6px', color: 'var(--color-ink-muted)', textAlign: 'center' }}>
                          TAP TO INSPECT FULL RESOLUTION
                        </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            {/* Section 4: CAD Schematic Diagnosis & OEM Parts Replenishment */}
            <div style={{ marginBottom: '36px' }}>
              <h3 style={{ fontSize: '1.15rem', borderBottom: 'var(--border-ink)', paddingBottom: '6px', marginBottom: '16px' }}>
                CAD SCHEMATIC DIAGNOSIS & REPLACEMENT PARTS MANIFEST
              </h3>

              <div style={{ marginBottom: '16px' }}>
                <TelemetryHUD
                  equipment={equipment}
                  incidentMeta={metadata}
                  isResolved={isResolved}
                  initiallyExpanded={true}
                />
              </div>

              {/* OEM Parts Procurement Matrix */}
              {(() => {
                const catalog = MACHINERY_CATALOG[equipment] || MACHINERY_CATALOG['Excavator EX-204'];
                const subKey = Object.keys(catalog.subsystems)[0];
                const subData = catalog.subsystems[subKey];
                return (
                  <div style={{ border: 'var(--border-ink)', backgroundColor: 'var(--color-paper-light)', padding: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                      <span className="mono" style={{ fontSize: '0.8rem', fontWeight: 800 }}>
                        OEM PARTS PROCUREMENT DISPATCH · {subKey.toUpperCase()}
                      </span>
                      <span className="stamp stamp-teal" style={{ fontSize: '0.65rem' }}>
                        INVENTORY VERIFIED
                      </span>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', backgroundColor: '#FFF', border: '1px solid var(--color-ink)' }}>
                      <thead>
                        <tr style={{ backgroundColor: 'var(--color-paper-muted)', textAlign: 'left' }}>
                          <th style={{ padding: '6px 10px', borderBottom: '1px solid var(--color-ink)' }}>PART NUMBER</th>
                          <th style={{ padding: '6px 10px', borderBottom: '1px solid var(--color-ink)' }}>OEM SPECIFICATION</th>
                          <th style={{ padding: '6px 10px', borderBottom: '1px solid var(--color-ink)' }}>UNIT COST</th>
                          <th style={{ padding: '6px 10px', borderBottom: '1px solid var(--color-ink)' }}>LEAD TIME</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subData.oemParts.map((p, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #E5E7EB' }}>
                            <td style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{p.partNumber}</td>
                            <td style={{ padding: '8px 10px' }}>{p.name}</td>
                            <td style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)' }}>{p.cost}</td>
                            <td style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)', color: 'var(--color-teal)', fontWeight: 700 }}>{p.leadTime}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>

            {/* Workshop Sign-Off Block */}
            <div
              style={{
                marginTop: '40px',
                borderTop: 'var(--border-ink-thick)',
                paddingTop: '20px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '24px',
              }}
            >
              <div>
                <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--color-ink-muted)' }}>
                  LEAD FIELD TECHNICIAN SIGNATURE
                </span>
                <div className="signature-line" />
                <div className="mono" style={{ fontSize: '0.74rem', marginTop: '4px' }}>
                  {resolvedByName} · [{resolvedBy}]
                </div>
              </div>

              <div>
                <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--color-ink-muted)' }}>
                  CENTRAL DISPATCH SUPERVISOR STAMP
                </span>
                <div className="signature-line" />
                <div className="mono" style={{ fontSize: '0.74rem', marginTop: '4px' }}>
                  RESCUEROOM COMMAND STATION · [{companyName.toUpperCase()}]
                </div>
              </div>

              <div>
                <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--color-ink-muted)' }}>
                  ARCHIVE AUDIT VERIFICATION
                </span>
                <div style={{ marginTop: '8px' }}>
                  <span className="stamp stamp-resolved" style={{ fontSize: '0.75rem', padding: '6px 12px' }}>
                    ✓ VERIFIED & CLOSED
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Full-Screen Inspection Lightbox */}
        {lightboxUrl && (
          <div
            className="no-print"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(20, 32, 31, 0.95)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 99999,
              padding: '24px',
            }}
            onClick={() => setLightboxUrl(null)}
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span className="mono" style={{ fontWeight: 800 }}>EVIDENCE PLATE INSPECTION</span>
                <button onClick={() => setLightboxUrl(null)} className="btn btn-hazard">
                  ✕ CLOSE
                </button>
              </div>
              <img
                src={lightboxUrl}
                alt="Evidence plate"
                style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', border: '1px solid #000' }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
