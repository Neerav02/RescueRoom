import { useState, useEffect, useRef } from 'react';
import {
  analyzeEvidencePlate,
  formatAiBroadcastMessage,
  getGeminiApiKey,
  setGeminiApiKey,
} from '../lib/gemini';

/**
 * AI Machinery Co-Pilot & Evidence Plate Visual Decoder Modal
 * Provides visual damage forensics, OEM parts lookup, LOTO checklists, and CometChat dispatch.
 */
export default function AiCopilotModal({
  isOpen,
  onClose,
  targetPlateUrl = null,
  targetPlateFile = null,
  equipment = 'Excavator EX-204',
  incidentMeta = {},
  guid = '',
  onBroadcastToChat = null,
}) {
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);

  const [activeTab, setActiveTab] = useState('DIAGNOSTICS'); // 'DIAGNOSTICS' | 'LOTO' | 'TORQUE' | 'SETTINGS'
  const [loading, setLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState(null);
  const [checkedLoto, setCheckedLoto] = useState({});
  const [customKeyInput, setCustomKeyInput] = useState(() => getGeminiApiKey());
  const [keySavedStatus, setKeySavedStatus] = useState(false);
  const [copiedPart, setCopiedPart] = useState(null);

  // Focus management, focus trap, and Escape key listener for accessible modal dialog
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement;

      // Move focus into the dialog once mounted
      const focusTimer = setTimeout(() => {
        if (!dialogRef.current) return;
        const focusable = dialogRef.current.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length > 0) {
          focusable[0].focus();
        } else {
          dialogRef.current.focus();
        }
      }, 50);

      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          onClose();
          return;
        }

        if (e.key === 'Tab') {
          if (!dialogRef.current) return;
          const focusable = dialogRef.current.querySelectorAll(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          );
          if (focusable.length === 0) {
            e.preventDefault();
            return;
          }
          const first = focusable[0];
          const last = focusable[focusable.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === first || !dialogRef.current.contains(document.activeElement)) {
              e.preventDefault();
              last.focus();
            }
          } else {
            if (document.activeElement === last || !dialogRef.current.contains(document.activeElement)) {
              e.preventDefault();
              first.focus();
            }
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);

      return () => {
        clearTimeout(focusTimer);
        document.removeEventListener('keydown', handleKeyDown);
        if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
          previousFocusRef.current.focus();
        }
      };
    }
  }, [isOpen, onClose]);

  // Run or refresh diagnosis when modal opens or target plate changes
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    async function runAnalysis() {
      setLoading(true);
      try {
        const result = await analyzeEvidencePlate({
          imageUrl: targetPlateUrl,
          fileData: targetPlateFile,
          equipment,
          incidentDescription: incidentMeta?.description || '',
          incidentGuid: guid,
        });
        if (isMounted) {
          setDiagnosis(result);
        }
      } catch (err) {
        console.error('[RescueRoom AI] Analysis error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    runAnalysis();
    return () => {
      isMounted = false;
    };
  }, [isOpen, targetPlateUrl, targetPlateFile, equipment, guid, incidentMeta?.description]);

  if (!isOpen) return null;

  const handleSaveKey = (e) => {
    e.preventDefault();
    setGeminiApiKey(customKeyInput);
    setKeySavedStatus(true);
    setTimeout(() => setKeySavedStatus(false), 2000);
    // Re-run analysis with updated key
    setLoading(true);
    analyzeEvidencePlate({
      imageUrl: targetPlateUrl,
      fileData: targetPlateFile,
      equipment,
      incidentDescription: incidentMeta.description || '',
      incidentGuid: guid,
    }).then((res) => {
      setDiagnosis(res);
      setLoading(false);
    });
  };

  const toggleLotoCheck = (idx) => {
    setCheckedLoto((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const handleCopyPart = (pNum) => {
    navigator.clipboard.writeText(pNum);
    setCopiedPart(pNum);
    setTimeout(() => setCopiedPart(null), 2000);
  };

  const handleBroadcast = () => {
    if (onBroadcastToChat && diagnosis) {
      const broadcastText = formatAiBroadcastMessage(diagnosis, incidentMeta.operatorName);
      onBroadcastToChat(broadcastText);
      onClose();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(28, 27, 24, 0.85)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="copilot-modal-title"
        aria-describedby="copilot-modal-desc"
        tabIndex={-1}
        className="paper-card"
        style={{
          width: '100%',
          maxWidth: '820px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          border: 'var(--border-ink-thick)',
          boxShadow: 'var(--shadow-hard-xl)',
          backgroundColor: 'var(--color-bone)',
          padding: 0,
          overflow: 'hidden',
          animation: 'fadeIn 0.15s ease-out',
          outline: 'none',
        }}
      >
        <p id="copilot-modal-desc" className="sr-only">
          {`Visual damage forensics, OEM parts lookup, and LOTO safety verification for ${equipment}`}
        </p>

        {/* Header Bar */}
        <div
          style={{
            backgroundColor: 'var(--color-ink)',
            color: 'var(--color-bone)',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: 'var(--border-ink)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                backgroundColor: 'var(--color-hazard)',
                color: 'var(--color-ink)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                fontWeight: 800,
                padding: '2px 8px',
              }}
            >
              RESCUE-AI
            </span>
            <h2
              id="copilot-modal-title"
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1rem',
                fontWeight: 800,
                letterSpacing: '0.02em',
                margin: 0,
                color: 'var(--color-bone)',
              }}
            >
              MACHINERY CO-PILOT · FORENSICS & PARTS DECODER
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Co-Pilot Window"
            className="btn-icon-dismiss"
            style={{
              color: 'var(--color-bone)',
              fontSize: '1.2rem',
              fontWeight: 700,
            }}
            title="Close Co-Pilot Window"
          >
            ✕
          </button>
        </div>

        {/* Tactical Sub-Nav Tabs */}
        <div
          style={{
            display: 'flex',
            borderBottom: 'var(--border-ink)',
            backgroundColor: 'var(--color-paper-muted)',
            overflowX: 'auto',
          }}
        >
          {[
            { id: 'DIAGNOSTICS', label: '1. FORENSICS & OEM PARTS' },
            { id: 'LOTO', label: '2. LOTO SAFETY CHECKLIST' },
            { id: 'TORQUE', label: '3. TORQUE SPECIFICATIONS' },
            { id: 'SETTINGS', label: '⚙️ AI CONFIG' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                minHeight: '44px',
                padding: '10px 16px',
                border: 'none',
                borderRight: 'var(--border-ink-thin)',
                backgroundColor: activeTab === tab.id ? 'var(--color-bone)' : 'transparent',
                borderBottom: activeTab === tab.id ? '3px solid var(--color-vermilion)' : 'none',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.76rem',
                fontWeight: activeTab === tab.id ? 800 : 600,
                color: activeTab === tab.id ? 'var(--color-ink)' : 'var(--color-ink-muted)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </button>
          ))}

          {/* Engine Status Badge */}
          <div
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              padding: '0 14px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              color: 'var(--color-ink-muted)',
            }}
          >
            {diagnosis?.source === 'GOOGLE_GEMINI_2_5_FLASH' ? (
              <span style={{ color: 'var(--color-teal)', fontWeight: 700 }}>
                ● GEMINI 2.5 FLASH ACTIVE (SERVER PROXIED)
              </span>
            ) : (
              <span style={{ color: 'var(--color-ink)', fontWeight: 600 }}>
                ⚙️ TACTICAL HEURISTIC ENGINE
              </span>
            )}
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
          }}
        >
          {loading ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '48px 16px',
                gap: '16px',
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  border: '4px solid var(--color-paper-muted)',
                  borderTop: '4px solid var(--color-vermilion)',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              <div
                className="mono"
                style={{
                  fontSize: '0.86rem',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  textAlign: 'center',
                }}
              >
                DECODING COMPONENT DAMAGE SIGNATURE & OEM SCHEMATICS...
              </div>
              <div
                className="mono"
                style={{ fontSize: '0.72rem', color: 'var(--color-ink-muted)' }}
              >
                Cross-referencing Caterpillar / Parker Hannifin / Cummins technical manuals
              </div>
            </div>
          ) : diagnosis ? (
            <>
              {/* TAB 1: FORENSICS & OEM PARTS */}
              {activeTab === 'DIAGNOSTICS' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Top Split: Evidence Image preview + Primary Diagnosis */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: targetPlateUrl ? 'minmax(220px, 1fr) 2fr' : '1fr',
                      gap: '16px',
                    }}
                  >
                    {/* Plate photo thumbnail */}
                    {targetPlateUrl && (
                      <div
                        style={{
                          backgroundColor: 'var(--color-ink)',
                          border: 'var(--border-ink)',
                          padding: '6px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                        }}
                      >
                        <div
                          style={{
                            position: 'relative',
                            width: '100%',
                            height: '170px',
                            overflow: 'hidden',
                            backgroundColor: '#000',
                          }}
                        >
                          <img
                            src={targetPlateUrl}
                            alt="Evidence Specimen"
                            loading="lazy"
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'contain',
                            }}
                          />
                          {/* Tactical Scan Line Overlay */}
                          <div
                            style={{
                              position: 'absolute',
                              inset: 0,
                              background:
                                'linear-gradient(rgba(242, 183, 5, 0.15) 50%, rgba(0, 0, 0, 0.25) 50%)',
                              backgroundSize: '100% 4px',
                              pointerEvents: 'none',
                            }}
                          />
                          <div
                            style={{
                              position: 'absolute',
                              top: '6px',
                              left: '6px',
                              backgroundColor: 'rgba(0,0,0,0.7)',
                              color: 'var(--color-hazard)',
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.65rem',
                              padding: '2px 5px',
                              fontWeight: 700,
                            }}
                          >
                            AI SCAN TARGET
                          </div>
                        </div>
                        <div
                          className="mono"
                          style={{
                            fontSize: '0.68rem',
                            color: 'var(--color-bone)',
                            textAlign: 'center',
                          }}
                        >
                          SPECIMEN: {equipment.toUpperCase()}
                        </div>
                      </div>
                    )}

                    {/* Primary Failure Breakdown Box */}
                    <div
                      style={{
                        backgroundColor: 'var(--color-paper-light)',
                        border: 'var(--border-ink)',
                        padding: '14px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '6px',
                          }}
                        >
                          <span
                            className="stamp stamp-critical"
                            style={{ fontSize: '0.68rem', padding: '1px 6px' }}
                          >
                            {diagnosis.severityAssessment}
                          </span>
                          <span
                            className="mono"
                            style={{ fontSize: '0.72rem', color: 'var(--color-teal)', fontWeight: 700 }}
                          >
                            CONFIDENCE: {diagnosis.confidenceScore || 95}%
                          </span>
                        </div>

                        <h4
                          style={{
                            fontFamily: 'var(--font-heading)',
                            fontSize: '1rem',
                            color: 'var(--color-ink)',
                            marginBottom: '6px',
                          }}
                        >
                          {diagnosis.componentIdentified}
                        </h4>

                        <p
                          style={{
                            fontSize: '0.84rem',
                            lineHeight: 1.45,
                            color: 'var(--color-ink)',
                            marginBottom: '10px',
                          }}
                        >
                          {diagnosis.failureMode}
                        </p>
                      </div>

                      {/* Immediate Hazard Alert */}
                      <div
                        style={{
                          backgroundColor: '#FEE2E2',
                          borderLeft: '4px solid var(--color-vermilion)',
                          padding: '6px 10px',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.72rem',
                          color: '#991B1B',
                          fontWeight: 600,
                        }}
                      >
                        ⚠️ HAZARD: {diagnosis.immediateHazard}
                      </div>
                    </div>
                  </div>

                  {/* Failure Mechanics Points */}
                  {diagnosis.failureMechanics && (
                    <div
                      style={{
                        backgroundColor: 'var(--color-white)',
                        border: 'var(--border-ink)',
                        padding: '12px',
                      }}
                    >
                      <div
                        className="mono"
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: 'var(--color-ink-muted)',
                          marginBottom: '6px',
                        }}
                      >
                        ROOT-CAUSE MECHANICS:
                      </div>
                      <ul style={{ paddingLeft: '18px', fontSize: '0.8rem', lineHeight: 1.45 }}>
                        {diagnosis.failureMechanics.map((mech, i) => (
                          <li key={i} style={{ marginBottom: '4px' }}>
                            {mech}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* OEM Replacement Parts Table */}
                  <div
                    style={{
                      border: 'var(--border-ink)',
                      backgroundColor: 'var(--color-white)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: 'var(--color-paper-muted)',
                        padding: '8px 12px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        borderBottom: 'var(--border-ink)',
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>RECOMMENDED OEM REPLACEMENT PARTS</span>
                      <span>INVENTORY DISPATCH</span>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                      <thead>
                        <tr style={{ backgroundColor: 'var(--color-paper-light)', textAlign: 'left' }}>
                          <th style={{ padding: '6px 10px', borderBottom: 'var(--border-ink-thin)' }}>PART NUMBER</th>
                          <th style={{ padding: '6px 10px', borderBottom: 'var(--border-ink-thin)' }}>DESCRIPTION</th>
                          <th style={{ padding: '6px 10px', borderBottom: 'var(--border-ink-thin)' }}>EST. COST</th>
                          <th style={{ padding: '6px 10px', borderBottom: 'var(--border-ink-thin)' }}>LEAD TIME</th>
                          <th style={{ padding: '6px 10px', borderBottom: 'var(--border-ink-thin)' }}>ACTION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {diagnosis.oemParts?.map((part, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #E5E7EB' }}>
                            <td style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                              {part.partNumber}
                            </td>
                            <td style={{ padding: '8px 10px' }}>{part.name}</td>
                            <td style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)' }}>{part.cost}</td>
                            <td style={{ padding: '8px 10px' }}>
                              <span
                                style={{
                                  backgroundColor: part.leadTime.includes('Stock') ? '#D1FAE5' : '#FEF3C7',
                                  color: part.leadTime.includes('Stock') ? 'var(--color-teal)' : '#92400E',
                                  padding: '2px 6px',
                                  fontSize: '0.7rem',
                                  fontFamily: 'var(--font-mono)',
                                  fontWeight: 600,
                                }}
                              >
                                {part.leadTime}
                              </span>
                            </td>
                            <td style={{ padding: '8px 10px' }}>
                              <button
                                type="button"
                                onClick={() => handleCopyPart(part.partNumber)}
                                className="paper-button"
                                style={{
                                  padding: '2px 8px',
                                  fontSize: '0.7rem',
                                  fontFamily: 'var(--font-mono)',
                                }}
                              >
                                {copiedPart === part.partNumber ? 'COPIED ✓' : 'COPY P/N'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Required Tools Box */}
                  {diagnosis.requiredTools && (
                    <div
                      style={{
                        backgroundColor: 'var(--color-paper-light)',
                        border: 'var(--border-ink)',
                        padding: '10px 14px',
                      }}
                    >
                      <span className="mono" style={{ fontSize: '0.72rem', fontWeight: 700 }}>
                        FIELD TOOLS REQUIRED:
                      </span>{' '}
                      <span style={{ fontSize: '0.78rem' }}>
                        {diagnosis.requiredTools.join(' · ')}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: LOTO SAFETY CHECKLIST */}
              {activeTab === 'LOTO' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div
                    style={{
                      backgroundColor: 'var(--color-hazard)',
                      border: 'var(--border-ink)',
                      padding: '10px 14px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      color: 'var(--color-ink)',
                    }}
                  >
                    OSHA / ISO MANDATORY LOCKOUT & TAGOUT (LOTO) ISOLATION SEQUENCE
                  </div>

                  <p style={{ fontSize: '0.82rem', color: 'var(--color-ink)' }}>
                    Technicians must complete and verify every isolation step prior to breaking hydraulic line seals, uncoupling high-pressure fittings, or entering pinch zones:
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {diagnosis.lotoChecklist?.map((step, idx) => {
                      const isChecked = Boolean(checkedLoto[idx]);
                      return (
                        <div
                          key={idx}
                          onClick={() => toggleLotoCheck(idx)}
                          style={{
                            backgroundColor: isChecked ? '#E8F5F1' : 'var(--color-white)',
                            border: 'var(--border-ink)',
                            padding: '10px 14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.1s ease',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            style={{
                              width: '18px',
                              height: '18px',
                              cursor: 'pointer',
                              accentColor: 'var(--color-teal)',
                            }}
                          />
                          <span
                            className="mono"
                            style={{
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              color: isChecked ? 'var(--color-teal)' : 'var(--color-vermilion)',
                            }}
                          >
                            STEP 0{idx + 1}:
                          </span>
                          <span
                            style={{
                              fontSize: '0.84rem',
                              color: isChecked ? 'var(--color-ink-muted)' : 'var(--color-ink)',
                              textDecoration: isChecked ? 'line-through' : 'none',
                              flex: 1,
                            }}
                          >
                            {step}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: TORQUE SPECIFICATIONS */}
              {activeTab === 'TORQUE' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div
                    style={{
                      backgroundColor: 'var(--color-paper-muted)',
                      border: 'var(--border-ink)',
                      padding: '10px 14px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                    }}
                  >
                    CALIBRATED FASTENER TORQUE SPECIFICATIONS · OEM ENGINEERING STANDARDS
                  </div>

                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      backgroundColor: 'var(--color-white)',
                      border: 'var(--border-ink)',
                      fontSize: '0.8rem',
                    }}
                  >
                    <thead>
                      <tr style={{ backgroundColor: 'var(--color-paper-light)', textAlign: 'left' }}>
                        <th style={{ padding: '8px 12px', borderBottom: 'var(--border-ink)' }}>FASTENER / LOCATION</th>
                        <th style={{ padding: '8px 12px', borderBottom: 'var(--border-ink)' }}>TORQUE SPECIFICATION</th>
                        <th style={{ padding: '8px 12px', borderBottom: 'var(--border-ink)' }}>LUBRICATION REQUIREMENT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {diagnosis.torqueSpecifications?.map((t, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #E5E7EB' }}>
                          <td style={{ padding: '10px 12px', fontWeight: 600 }}>{t.item}</td>
                          <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--color-vermilion)' }}>
                            {t.spec}
                          </td>
                          <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', color: 'var(--color-ink-muted)' }}>
                            {t.lube}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 4: AI SETTINGS */}
              {activeTab === 'SETTINGS' && (
                <form onSubmit={handleSaveKey} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div
                    style={{
                      backgroundColor: 'var(--color-paper-light)',
                      border: 'var(--border-ink)',
                      padding: '14px',
                    }}
                  >
                    <h4 style={{ marginBottom: '8px', fontSize: '0.9rem' }}>
                      GOOGLE GEMINI 2.5 FLASH API INTEGRATION (SECURE SERVER PROXY)
                    </h4>
                    <p style={{ fontSize: '0.8rem', lineHeight: 1.4, color: 'var(--color-ink-muted)', marginBottom: '12px' }}>
                      RescueRoom routes multimodal failure forensics through the secure backend proxy (<code>/api/gemini/analyze</code>).
                      Production credentials (<code>GEMINI_API_KEY</code>) are maintained strictly on the server and are never exposed to browser bundles.
                      If no key is configured on the server, RescueRoom engages its built-in <strong>Tactical Machinery Heuristic Engine</strong> with full offline OEM catalog data.
                    </p>

                    <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.74rem', fontWeight: 700, marginBottom: '4px' }}>
                      DEV / SESSION OVERRIDE KEY (OPTIONAL):
                    </label>
                    <input
                      type="password"
                      value={customKeyInput}
                      onChange={(e) => setCustomKeyInput(e.target.value)}
                      placeholder="Leave blank to use server environment GEMINI_API_KEY"
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.85rem',
                        border: 'var(--border-ink)',
                        backgroundColor: '#FFFFFF',
                        marginBottom: '10px',
                      }}
                    />

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        type="submit"
                        className="paper-button"
                        style={{
                          backgroundColor: 'var(--color-ink)',
                          color: 'var(--color-bone)',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.78rem',
                          padding: '6px 14px',
                        }}
                      >
                        SAVE & RE-ANALYZE
                      </button>

                      {keySavedStatus && (
                        <span
                          className="mono"
                          style={{ fontSize: '0.75rem', color: 'var(--color-teal)', fontWeight: 700 }}
                        >
                          SESSION CONFIGURATION UPDATED ✓
                        </span>
                      )}
                    </div>
                  </div>
                </form>
              )}
            </>
          ) : null}
        </div>

        {/* Modal Bottom Action Bar */}
        <div
          style={{
            backgroundColor: 'var(--color-paper-muted)',
            borderTop: 'var(--border-ink)',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div style={{ fontSize: '0.72rem', color: 'var(--color-ink-muted)', fontFamily: 'var(--font-mono)' }}>
            POWERED BY: {diagnosis?.model || 'RescueRoom Forensics Engine'}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {onBroadcastToChat && diagnosis && (
              <button
                type="button"
                onClick={handleBroadcast}
                className="paper-button paper-button-vermilion"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  padding: '6px 14px',
                }}
              >
                📡 TRANSMIT AI REPORT TO COMETCHAT
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="paper-button"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.78rem',
                padding: '6px 14px',
              }}
            >
              DISMISS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
