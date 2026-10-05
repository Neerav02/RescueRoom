import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CometChat, DEMO_USERS } from '../lib/cometchat';

export default function OperatorPage({ currentUser }) {
  const navigate = useNavigate();

  // Company equipment catalogs
  const equipmentOptions =
    currentUser?.companyId === 'kestrel'
      ? ['Freightliner FL-90', 'Telehandler TH-44', 'Electric Forklift EF-12', 'Cargo Van CV-08']
      : ['Excavator EX-204', 'Bulldozer BD-801', 'Haul Truck HT-310', 'Wheel Loader WL-550'];

  const [formOpen, setFormOpen] = useState(false);
  const [equipment, setEquipment] = useState(equipmentOptions[0]);
  const [severity, setSeverity] = useState('CRITICAL');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [recentIncidents, setRecentIncidents] = useState([]);
  const [onlineResponders, setOnlineResponders] = useState([]);

  // Check presence of company responders
  useEffect(() => {
    async function checkResponders() {
      if (!currentUser) return;
      try {
        const companyResponders = DEMO_USERS.filter(
          (u) => u.companyId === currentUser.companyId && u.role !== 'operator'
        );
        // By default show available responders in company
        setOnlineResponders(companyResponders);
      } catch (err) {
        console.warn('Error checking responders:', err);
      }
    }
    checkResponders();
  }, [currentUser]);

  // Fetch recent incidents for this company
  useEffect(() => {
    async function fetchCompanyIncidents() {
      if (!currentUser) return;
      try {
        const request = new CometChat.GroupsRequestBuilder()
          .setLimit(20)
          .build();
        const groups = await request.fetchNext();
        // Filter by company prefix for tenant isolation
        const companyGroups = groups.filter((g) => {
          const guid = g.getGuid();
          return guid.startsWith(`${currentUser.companyId}_inc_`);
        });
        setRecentIncidents(companyGroups);
      } catch (err) {
        console.warn('Could not fetch existing incidents:', err);
      }
    }
    fetchCompanyIncidents();
  }, [currentUser]);

  const handleSubmitIncident = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      setSubmitError('Please enter a brief description of the machinery fault.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const incidentNum = String(Math.floor(1000 + Math.random() * 9000));
      const rawGuid = `${currentUser.companyId}_inc_${incidentNum}`;
      const groupName = `INC-${incidentNum} · ${equipment}`;
      const groupType = CometChat.GROUP_TYPE.PUBLIC;

      console.log(`[RescueRoom] Creating incident room: ${groupName} (${rawGuid})...`);

      const group = new CometChat.Group(rawGuid, groupName, groupType);
      const metadata = {
        incidentNum: `INC-${incidentNum}`,
        equipment,
        severity,
        companyId: currentUser.companyId,
        companyName: currentUser.companyName,
        operatorUid: currentUser.uid,
        operatorName: currentUser.name,
        operatorCallsign: currentUser.callsign,
        description: description.trim(),
        openedAt: Date.now(),
        status: 'open',
      };
      group.setMetadata(metadata);

      // Create Group in CometChat
      await CometChat.createGroup(group);
      console.log(`[RescueRoom] Incident room created on CometChat.`);

      // Add company responders (Mechanic and Dispatcher) to room
      try {
        const otherResponders = DEMO_USERS.filter(
          (u) => u.companyId === currentUser.companyId && u.uid !== currentUser.uid
        );
        const membersList = otherResponders.map(
          (u) => new CometChat.GroupMember(u.uid, CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT)
        );
        if (membersList.length > 0) {
          await CometChat.addMembersToGroup(rawGuid, membersList, []);
          console.log(`[RescueRoom] Added ${membersList.length} responders to incident room.`);
        }
      } catch (addErr) {
        console.warn('[RescueRoom] Non-blocking notice adding responders:', addErr);
      }

      // Post initial dispatch log message
      const initialText = `🚨 EMERGENCY DISPATCH · INCIDENT REPORT\n` +
        `----------------------------------------\n` +
        `INCIDENT ID: INC-${incidentNum}\n` +
        `EQUIPMENT: ${equipment}\n` +
        `SEVERITY: ${severity}\n` +
        `OPERATOR: ${currentUser.name} (${currentUser.callsign})\n` +
        `FAULT DETAILS: ${description.trim()}\n` +
        `TIME: ${new Date().toISOString().substring(11, 19)} UTC\n` +
        `----------------------------------------\n` +
        `Responders notified. Stand by on this channel.`;

      const firstMessage = new CometChat.TextMessage(
        rawGuid,
        initialText,
        CometChat.RECEIVER_TYPE.GROUP
      );
      await CometChat.sendMessage(firstMessage);
      console.log(`[RescueRoom] Initial dispatch message broadcast.`);

      // Navigate to the Incident Room
      navigate(`/room/${rawGuid}`);
    } catch (err) {
      console.error('[RescueRoom] Group creation failed:', err);
      setSubmitError(err?.message || 'Failed to dispatch incident room. Please retry.');
      setIsSubmitting(false);
    }
  };

  const quickDescriptions = [
    'Hydraulic pressure loss on primary lift boom. Fluid leak visible near valve block.',
    'High engine coolant temperature warning active. Engine rattling under medium load.',
    'Braking response delayed and air compressor pressure failing to build past 60 PSI.',
    'Electrical power loss to main instrument cluster and steering power assist failing.',
  ];

  return (
    <div style={{ width: '100%', flex: 1, padding: '32px 32px 64px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Top Operational Status Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '28px',
            borderBottom: 'var(--border-ink)',
            paddingBottom: '16px',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="stamp stamp-critical">FIELD STATION</span>
              <span className="mono" style={{ fontSize: '0.78rem', color: 'var(--color-ink-muted)' }}>
                OPERATOR CALLSIGN: {currentUser?.callsign}
              </span>
            </div>
            <h1 style={{ fontSize: '2.2rem', margin: '4px 0 0' }}>
              OPERATOR EMERGENCY DISPATCH
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div
              className="paper-card"
              style={{
                padding: '8px 16px',
                backgroundColor: 'var(--color-paper-light)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <span className="presence-dot" />
              <div>
                <div className="mono" style={{ fontSize: '0.68rem', color: 'var(--color-ink-muted)' }}>
                  COMPANY RESPONDERS
                </div>
                <div className="mono" style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                  {onlineResponders.length} ASSIGNED IN ROSTER
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate('/board')}
              className="btn btn-hazard"
              style={{ padding: '8px 16px', fontSize: '0.82rem' }}
            >
              VIEW TRIAGE BOARD →
            </button>
          </div>
        </div>

        {/* The Urgency Action Center */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: formOpen ? '1fr 1fr' : '1fr',
            gap: '32px',
            marginBottom: '40px',
            transition: 'all 0.2s ease',
          }}
        >
          {/* Giant Emergency Button Trigger */}
          <div
            className="paper-card"
            style={{
              backgroundColor: 'var(--color-paper-light)',
              border: 'var(--border-ink-thick)',
              boxShadow: 'var(--shadow-hard-xl)',
              padding: '36px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              minHeight: '360px',
            }}
          >
            <div className="hazard-tape" style={{ width: '100%', height: '14px', marginBottom: '24px' }} />
            
            <span className="stamp stamp-critical" style={{ fontSize: '0.85rem', padding: '4px 12px', marginBottom: '16px' }}>
              IMMEDIATE ESCALATION PROTOCOL
            </span>

            <h2 style={{ fontSize: '2rem', marginBottom: '12px', letterSpacing: '-0.02em' }}>
              MACHINERY FAULT OR SITE EMERGENCY?
            </h2>

            <p style={{ maxWidth: '520px', fontSize: '1.05rem', color: 'var(--color-ink-muted)', marginBottom: '28px' }}>
              Pressing this trigger creates a dedicated incident room, alerts company mechanics & dispatchers, and opens the live field manual channel.
            </p>

            <button
              onClick={() => setFormOpen(true)}
              className="btn-emergency"
              style={{
                maxWidth: '540px',
                animation: formOpen ? 'none' : 'pulse 2s infinite',
              }}
            >
              ⚠ SOMETHING'S WRONG
            </button>

            <div className="hazard-tape" style={{ width: '100%', height: '14px', marginTop: '28px' }} />
          </div>

          {/* Incident Requisition Form (Appears when trigger is pressed) */}
          {formOpen && (
            <div
              className="paper-card"
              style={{
                backgroundColor: 'var(--color-bone)',
                border: 'var(--border-ink-thick)',
                boxShadow: 'var(--shadow-hard-lg)',
                padding: '28px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: 'var(--border-ink)',
                  paddingBottom: '12px',
                  marginBottom: '20px',
                }}
              >
                <div>
                  <span className="stamp stamp-serious">DISPATCH REQUISITION</span>
                  <h3 style={{ fontSize: '1.4rem', marginTop: '4px' }}>Incident Details</h3>
                </div>
                <button
                  onClick={() => setFormOpen(false)}
                  className="btn"
                  style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                >
                  ✕ CANCEL
                </button>
              </div>

              {submitError && (
                <div
                  className="paper-card"
                  style={{
                    backgroundColor: '#FFEBE8',
                    borderColor: 'var(--color-vermilion)',
                    borderLeft: '6px solid var(--color-vermilion)',
                    marginBottom: '16px',
                    padding: '10px 14px',
                  }}
                >
                  <p className="mono" style={{ fontSize: '0.82rem', color: 'var(--color-vermilion)' }}>
                    {submitError}
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmitIncident}>
                {/* Equipment Picker */}
                <div className="form-group">
                  <label className="form-label">ASSIGNED EQUIPMENT / UNIT</label>
                  <select
                    className="form-select"
                    value={equipment}
                    onChange={(e) => setEquipment(e.target.value)}
                  >
                    {equipmentOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Severity Tappable Tags */}
                <div className="form-group">
                  <label className="form-label">SEVERITY LEVEL (TAP TO CLASSIFY)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    {[
                      { id: 'CRITICAL', label: 'CRITICAL', desc: 'Work Stoppage / Safety Risk', color: 'var(--color-vermilion)', text: '#FFF' },
                      { id: 'SERIOUS', label: 'SERIOUS', desc: 'Impaired Function', color: 'var(--color-hazard)', text: 'var(--color-ink)' },
                      { id: 'MINOR', label: 'MINOR', desc: 'Advisory / Maintenance', color: 'var(--color-paper-light)', text: 'var(--color-ink)' },
                    ].map((sev) => {
                      const isSelected = severity === sev.id;
                      return (
                        <div
                          key={sev.id}
                          onClick={() => setSeverity(sev.id)}
                          style={{
                            border: isSelected ? '3px solid var(--color-ink)' : 'var(--border-ink)',
                            backgroundColor: isSelected ? sev.color : 'var(--color-paper-light)',
                            color: isSelected ? sev.text : 'var(--color-ink)',
                            padding: '12px 10px',
                            cursor: 'pointer',
                            textAlign: 'center',
                            boxShadow: isSelected ? 'var(--shadow-hard-lg)' : 'var(--shadow-hard-sm)',
                            transform: isSelected ? 'translate(-1px, -1px)' : 'none',
                            transition: 'var(--transition-tactile)',
                          }}
                        >
                          <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{sev.label}</div>
                          <div className="mono" style={{ fontSize: '0.65rem', opacity: 0.85, marginTop: '2px' }}>
                            {sev.desc}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Fault Description */}
                <div className="form-group">
                  <label className="form-label">ONE-LINE FAULT DESCRIPTION</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Hydraulic pressure drop on main lift cylinder..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />

                  {/* Preset quick buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                    <span className="mono" style={{ fontSize: '0.68rem', color: 'var(--color-ink-muted)' }}>
                      QUICK-FILL FAULT LOG:
                    </span>
                    {quickDescriptions.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setDescription(preset)}
                        className="btn"
                        style={{
                          justifyContent: 'flex-start',
                          padding: '6px 10px',
                          fontSize: '0.72rem',
                          textAlign: 'left',
                          backgroundColor: 'var(--color-paper-light)',
                        }}
                      >
                        ▸ {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action Submit */}
                <div style={{ marginTop: '24px' }}>
                  <button
                    type="submit"
                    className="btn btn-vermilion btn-lg"
                    style={{ width: '100%' }}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'DISPATCHING INCIDENT ROOM...' : 'DISPATCH EMERGENCY ROOM →'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Existing Open Incidents for this Company */}
        <section className="paper-card" style={{ backgroundColor: 'var(--color-paper-light)' }}>
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
              <span className="stamp stamp-minor">ACTIVE LOG</span>
              <h3 style={{ fontSize: '1.2rem', marginTop: '2px' }}>
                Open Incidents · {currentUser?.companyName}
              </h3>
            </div>
            <span className="mono" style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)' }}>
              {recentIncidents.length} INCIDENTS LOGGED
            </span>
          </div>

          {recentIncidents.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center' }} className="mono">
              NO ACTIVE INCIDENTS FOR {currentUser?.companyName.toUpperCase()}. ALL FLEET SYSTEMS OPERATIONAL.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
              {recentIncidents.map((inc) => {
                const meta = inc.getMetadata() || {};
                const sev = meta.severity || 'SERIOUS';
                const stampClass =
                  sev === 'CRITICAL'
                    ? 'stamp-critical'
                    : sev === 'SERIOUS'
                    ? 'stamp-serious'
                    : 'stamp-minor';

                return (
                  <div
                    key={inc.getGuid()}
                    className="paper-card"
                    style={{
                      backgroundColor: 'var(--color-bone)',
                      cursor: 'pointer',
                      border: 'var(--border-ink)',
                    }}
                    onClick={() => navigate(`/room/${inc.getGuid()}`)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span className={`stamp ${stampClass}`}>{sev}</span>
                      <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--color-ink-muted)' }}>
                        {inc.getMembersCount()} RESPONDERS
                      </span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '4px' }}>
                      {inc.getName()}
                    </div>
                    <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)', marginBottom: '12px' }}>
                      {meta.description || 'Incident in progress...'}
                    </div>
                    <button className="btn btn-hazard" style={{ width: '100%', fontSize: '0.75rem', padding: '6px' }}>
                      ENTER INCIDENT ROOM →
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
