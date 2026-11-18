import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DigitalTwinCanvas from '../components/DigitalTwinCanvas';
import { MACHINERY_CATALOG } from '../lib/gemini';
import { CometChat } from '../lib/cometchat';

// 6 Discrete Engineering Story Stages
const STORY_STAGES = [
  {
    stage: '01',
    id: 'overview',
    title: 'OPERATIONAL EQUIPMENT OVERVIEW',
    sub: 'EXCAVATOR EX-204 · POWERTRAIN ARCHITECTURE',
    explode: 0.0,
    subsystem: 'ALL',
    description:
      'Nominal assembled operational state. Tier 4F turbocharged diesel prime mover delivers 174 kW to the Rexroth A8VO dual swashplate pump, driving proportional high-pressure hydraulic boom cylinders.',
  },
  {
    stage: '02',
    id: 'separation',
    title: 'CONTROLLED EXPLODED SEPARATION',
    sub: 'CLEARANCE TOLERANCE & FLUID CIRCUIT ISOLATION',
    explode: 0.45,
    subsystem: 'ALL',
    description:
      'Controlled component separation uncouples high-pressure hydraulic lines from the main boom cylinder, exposing internal swashplate rotary pistons, milled valve manifold galleries, and planetary slew gearing.',
  },
  {
    stage: '03',
    id: 'identification',
    title: 'SUBSYSTEM ANATOMY & OEM MANIFEST',
    sub: 'SPATIAL TELEMETRY ANNOTATIONS & PART NUMBERS',
    explode: 0.85,
    subsystem: 'BOOM_CYLINDER',
    description:
      'Dynamic spatial callouts pin to exact 3D coordinates. Inspect OEM part numbers, calibrated fastener torque ratings, and operating pressure tolerances for each mechanical subsystem.',
  },
  {
    stage: '04',
    id: 'fault-scan',
    title: 'REAL-TIME FAULT PINPOINTING & TELEMETRY',
    sub: 'CAN-BUS REDLINE PRESSURE ALERT: 5,120 PSI',
    explode: 0.85,
    subsystem: 'BOOM_CYLINDER',
    description:
      'Camera converges on the failed main boom cylinder gland. Thermal stress pulses reveal an acute high-pressure seal rupture. Simulated CAN-bus sensors indicate catastrophic hydraulic spike exceeding 4,500 PSI limit.',
  },
  {
    stage: '05',
    id: 'ai-triage',
    title: 'AI DIAGNOSTIC FORENSICS & ESCALATION',
    sub: 'GEMINI 2.5 FLASH ROOT CAUSE & OSHA LOTO PROTOCOL',
    explode: 0.85,
    subsystem: 'BOOM_CYLINDER',
    description:
      'Automated root-cause analysis confirms seal blowout on cylinder rod gland. OEM Nitrile/Urethane rebuild kit CAT-154-8291 required. Mandatory 6-step OSHA Lockout/Tagout procedure generated for field technician dispatch.',
  },
  {
    stage: '06',
    id: 'resolution',
    title: 'MECHANICAL REASSEMBLY & RESOLUTION SIGN-OFF',
    sub: 'FORM-RR-808 SERVICE COMPLIANCE AUTHORIZATION',
    explode: 0.0,
    subsystem: 'ALL',
    description:
      'Components reverse separation and lock into verified operational alignment. Hydraulic pressure stabilizes at nominal 4,180 PSI. Maintenance sign-off officially stamped in oxidised teal ink.',
  },
];

// List of Interactive Subsystems
const SUBSYSTEM_LIST = [
  { id: 'ALL', label: 'Complete Machine', icon: '🚜', badge: 'ASSEMBLED' },
  { id: 'BOOM_CYLINDER', label: 'Boom Cylinder', icon: '💥', badge: 'CRITICAL FAULT' },
  { id: 'SWASHPLATE_PUMP', label: 'Rexroth Pump', icon: '⚙️', badge: 'PUMP DRIVE' },
  { id: 'VALVE_MANIFOLD', label: 'Valve Block', icon: '🎛️', badge: 'FLOW CONTROL' },
  { id: 'SLEW_MOTOR', label: 'Slew Drive', icon: '🔄', badge: 'PLANETARY' },
  { id: 'DIESEL_ENGINE', label: 'Diesel Engine', icon: '⚡', badge: 'PRIME MOVER' },
  { id: 'CHASSIS_BASE', label: 'Chassis & Tracks', icon: '⛓️', badge: 'UNDERCARRIAGE' },
];

export default function DigitalTwinPage({ currentUser: _currentUser }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const equipmentName = searchParams.get('equipment') || 'Excavator EX-204';
  const incidentGuid = searchParams.get('incidentGuid');

  // Active Stage & Explode State
  const [activeStageIdx, setActiveStageIdx] = useState(0);
  const [explodedAmount, setExplodedAmount] = useState(0.0);
  const [selectedSubsystemId, setSelectedSubsystemId] = useState(
    () => searchParams.get('subsystem') || 'ALL'
  );
  const [hoveredSubsystemId, setHoveredSubsystemId] = useState(null);

  // Render & Camera Modes
  const [renderMode, setRenderMode] = useState('pbr'); // 'pbr' | 'cad' | 'xray'
  const [autoRotate, setAutoRotate] = useState(false);
  const [cameraPreset, setCameraPreset] = useState(null);
  const [isResolved, setIsResolved] = useState(false);
  const [copiedPart, setCopiedPart] = useState(null);
  const [mobileTab, setMobileTab] = useState('story'); // 'story' | 'specs' | 'telemetry'
  const [syncNotice, setSyncNotice] = useState(null);

  // 3D-to-2D Screen Projected Coordinates
  const [projectedCoords, setProjectedCoords] = useState({});

  // Simulated Telemetry (CAN-bus micro-fluctuations)
  const [telemetryPsi, setTelemetryPsi] = useState(5120);
  const [telemetryTemp, setTelemetryTemp] = useState(108);
  const [telemetryRpm, setTelemetryRpm] = useState(2140);

  // Broadcast Twin changes to Incident Room
  const broadcastTwinState = useCallback(
    (partial = {}) => {
      if (!incidentGuid) return;
      try {
        const payload = {
          subsystemId: selectedSubsystemId,
          stageIdx: activeStageIdx,
          explodedAmount,
          isResolved,
          senderName: _currentUser?.name || 'Engineer',
          subsystemLabel: SUBSYSTEM_LIST.find((s) => s.id === (partial.subsystemId || selectedSubsystemId))?.label,
          ...partial,
        };
        const customMsg = new CometChat.CustomMessage(
          incidentGuid,
          'app_twin_sync',
          CometChat.RECEIVER_TYPE.GROUP,
          'custom',
          payload
        );
        CometChat.sendCustomMessage(customMsg).catch((e) => console.warn('[DigitalTwin] Sync notice:', e));
      } catch (err) {
        console.warn('[DigitalTwin] Broadcast notice:', err);
      }
    },
    [incidentGuid, _currentUser, selectedSubsystemId, activeStageIdx, explodedAmount, isResolved]
  );

  // Receive Twin state updates from Incident Room
  useEffect(() => {
    if (!incidentGuid) return;
    const listenerId = `twin_collab_${incidentGuid}_${Date.now()}`;

    CometChat.addMessageListener(
      listenerId,
      new CometChat.MessageListener({
        onCustomMessageReceived: (customMsg) => {
          if (customMsg.getReceiverId() === incidentGuid) {
            const cType = customMsg.getCustomType ? customMsg.getCustomType() : customMsg.type;
            const data = customMsg.getCustomData ? customMsg.getCustomData() : (customMsg.data?.customData || {});
            if (cType === 'app_twin_sync' && data) {
              if (data.subsystemId) setSelectedSubsystemId(data.subsystemId);
              if (data.stageIdx !== undefined) setActiveStageIdx(data.stageIdx);
              if (data.explodedAmount !== undefined) setExplodedAmount(data.explodedAmount);
              if (data.isResolved !== undefined) setIsResolved(data.isResolved);

              setSyncNotice({
                sender: data.senderName || 'Crew Responder',
                text: `Synchronized: ${data.subsystemLabel || data.subsystemId || 'Overview'}`,
              });
              setTimeout(() => setSyncNotice(null), 3500);
            }
          }
        },
      })
    );

    return () => CometChat.removeMessageListener(listenerId);
  }, [incidentGuid]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (isResolved) {
        setTelemetryPsi(Math.floor(4160 + Math.random() * 40));
        setTelemetryTemp(Math.floor(85 + Math.random() * 2));
        setTelemetryRpm(Math.floor(1820 + Math.random() * 30));
      } else if (activeStageIdx >= 3) {
        // Redline alert
        setTelemetryPsi(Math.floor(5080 + Math.random() * 120));
        setTelemetryTemp(Math.floor(107 + Math.random() * 3));
        setTelemetryRpm(Math.floor(2120 + Math.random() * 60));
      } else {
        // Nominal
        setTelemetryPsi(Math.floor(4200 + Math.random() * 50));
        setTelemetryTemp(Math.floor(88 + Math.random() * 2));
        setTelemetryRpm(Math.floor(1900 + Math.random() * 40));
      }
    }, 1500);
    return () => clearInterval(timer);
  }, [isResolved, activeStageIdx]);

  // Subsystem Switcher with Sync Broadcast
  const handleSelectSubsystem = (subId) => {
    setSelectedSubsystemId(subId);
    broadcastTwinState({ subsystemId: subId });
  };

  // Stage Switcher with Sync Broadcast
  const handleSelectStage = (idx) => {
    setActiveStageIdx(idx);
    const stage = STORY_STAGES[idx];
    setExplodedAmount(stage.explode);
    const subTarget = stage.subsystem || 'ALL';
    setSelectedSubsystemId(subTarget);
    broadcastTwinState({ stageIdx: idx, explodedAmount: stage.explode, subsystemId: subTarget });
  };

  const handleNextStage = () => {
    if (activeStageIdx < STORY_STAGES.length - 1) {
      handleSelectStage(activeStageIdx + 1);
    }
  };

  const handlePrevStage = () => {
    if (activeStageIdx > 0) {
      handleSelectStage(activeStageIdx - 1);
    }
  };

  const currentStage = STORY_STAGES[activeStageIdx] || STORY_STAGES[0];

  // Active Subsystem Metadata
  const activeSubsystemMeta = useMemo(() => {
    const catalog = MACHINERY_CATALOG['Excavator EX-204']?.subsystems || {};
    const subId = selectedSubsystemId === 'ALL' ? 'BOOM_CYLINDER' : selectedSubsystemId;

    if (subId === 'BOOM_CYLINDER') {
      return {
        id: 'BOOM_CYLINDER',
        title: 'Hydraulic Main Boom Cylinder',
        partNumber: 'CAT-154-8291',
        manufacturer: 'Caterpillar OEM',
        spec: '4,200 PSI Nominal · 140mm Bore · 100mm Rod',
        burstPressure: '5,500 PSI',
        torque: 'Flange Head M16: 145 Nm (107 ft-lb)',
        status: isResolved ? 'RESOLVED / NOMINAL' : 'CRITICAL FAULT / BLOWN SEAL',
        loto: 'Lower boom to ground, relieve internal tank pressure, cycle pilot valves, disconnect 24V battery, lock rod.',
        parts: catalog['Hydraulic Main Boom Cylinder']?.oemParts || [
          { partNumber: 'CAT-154-8291', name: 'Arm Cylinder Flex Hose SAE 100R15', cost: '$340.00', leadTime: 'In Stock' },
          { partNumber: 'PARKER-787TC-16', name: 'ToughCover Spiral Hose 5000 PSI', cost: '$185.00', leadTime: '1 Day' },
        ],
      };
    } else if (subId === 'SWASHPLATE_PUMP') {
      return {
        id: 'SWASHPLATE_PUMP',
        title: 'Rexroth A8VO Dual Swashplate Pump',
        partNumber: 'REXROTH-A8VO-107',
        manufacturer: 'Bosch Rexroth',
        spec: '2x 280 L/min variable axial piston · 4,500 PSI Max',
        burstPressure: '5,800 PSI',
        torque: 'Mounting Flange M20: 320 Nm (236 ft-lb)',
        status: isResolved ? 'NOMINAL' : 'WARNING / PRESSURE SPIKE IMPACT',
        loto: 'Shut down engine, depressurize accumulator, drain cooler circuit, tag circuit breaker.',
        parts: catalog['Main Hydraulic Pump (Variable Piston)']?.oemParts || [
          { partNumber: 'REX-8812-PMP', name: 'Variable Displacement Swashplate Kit', cost: '$1,420.00', leadTime: '2 Days' },
        ],
      };
    } else if (subId === 'VALVE_MANIFOLD') {
      return {
        id: 'VALVE_MANIFOLD',
        title: 'Proportional Flow Valve Manifold',
        partNumber: 'CAT-349-1022',
        manufacturer: 'Parker Hannifin',
        spec: '4-Bank Electro-Hydraulic Spool · CAN-bus J1939 PWM control',
        burstPressure: '5,200 PSI',
        torque: 'Solenoid Coils: 28 Nm (21 ft-lb)',
        status: 'NOMINAL / MONITORED',
        loto: 'Drain residual oil line into catch tray before disconnecting cartridges.',
        parts: [{ partNumber: 'CAT-349-1022', name: 'Proportional Flow Control Valve Block', cost: '$920.00', leadTime: 'In Stock' }],
      };
    } else if (subId === 'SLEW_MOTOR') {
      return {
        id: 'SLEW_MOTOR',
        title: 'Upperstructure Slew Motor Drive',
        partNumber: 'KOMATSU-708-2L',
        manufacturer: 'Komatsu Heavy Industries',
        spec: '11.8 RPM · Integrated Spring-Applied Hydraulic-Release Brake',
        burstPressure: '4,800 PSI',
        torque: 'Swing Bearing Mounting Bolts: 540 Nm (398 ft-lb)',
        status: 'NOMINAL',
        loto: 'Engage mechanical swing lock pin into chassis table.',
        parts: [{ partNumber: 'KOM-708-2L', name: 'Slew Reduction Planetary Sun Gear', cost: '$1,840.00', leadTime: 'In Stock' }],
      };
    } else if (subId === 'DIESEL_ENGINE') {
      return {
        id: 'DIESEL_ENGINE',
        title: 'Tier 4F Turbocharged Diesel Prime Mover',
        partNumber: 'CAT-C7.1-ACERT',
        manufacturer: 'Caterpillar Engine Div',
        spec: '6.7L Displacement · 174 kW (233 HP) @ 2,000 RPM',
        burstPressure: '2,200 Bar (Common Rail)',
        torque: 'Cylinder Head Studs: 210 Nm + 90° Turn',
        status: isResolved ? 'NOMINAL' : 'MONITORED / LOAD FLUCTUATION',
        loto: 'Turn off battery master disconnect switch and attach OSHA padlock.',
        parts: [{ partNumber: 'CAT-C7.1-TURBO', name: 'Variable Geometry Turbocharger', cost: '$2,150.00', leadTime: '1 Day' }],
      };
    }
    return {
      id: 'CHASSIS_BASE',
      title: 'Chassis Undercarriage & Boom Foot',
      partNumber: 'RR-STR-BASE-01',
      manufacturer: 'Heavy Earthmover Div',
      spec: 'High-Tensile Weldox Steel · Reinforced Gusset Bracing',
      burstPressure: 'Structural Load: 450 kN',
      torque: 'Boom Pivot Pin Keeper Bolt: 280 Nm',
      status: 'NOMINAL',
      loto: 'Chock tracks and lower straight blade before undercarriage inspection.',
      parts: [{ partNumber: 'CAT-8J-6214', name: 'Boom Pivot Hardened Steel Bushing', cost: '$180.00', leadTime: 'In Stock' }],
    };
  }, [selectedSubsystemId, isResolved]);

  const copyPartNumber = (pn) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(pn);
      setCopiedPart(pn);
      setTimeout(() => setCopiedPart(null), 2000);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        flex: 1,
        minHeight: 0,
        overflow: 'hidden',
        backgroundColor: 'var(--color-bone)',
        color: 'var(--color-ink)',
      }}
    >
      {/* 1. TOP ENGINEERING HEADER BAR */}
      <div
        className="digital-twin-header-bar"
        style={{
          borderBottom: 'var(--border-ink)',
          backgroundColor: 'var(--color-paper-light)',
          padding: '6px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
          zIndex: 40,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <button
            onClick={() => navigate(incidentGuid ? `/room/${incidentGuid}` : -1)}
            className="btn"
            style={{ padding: '5px 8px', fontSize: '0.74rem' }}
            title={incidentGuid ? 'Return to incident room' : 'Return to previous screen'}
          >
            {incidentGuid ? '← ROOM' : '← BACK'}
          </button>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span className="stamp stamp-critical" style={{ fontSize: '0.62rem', padding: '1px 5px' }}>
                3D CAD TWIN
              </span>
              {incidentGuid && (
                <span className="stamp stamp-teal" style={{ fontSize: '0.62rem', padding: '1px 6px' }}>
                  ● LIVE SYNC ACTIVE
                </span>
              )}
              <span className="mono digital-twin-header-meta" style={{ fontSize: '0.68rem', color: 'var(--color-ink-muted)' }}>
                BLUEPRINT EX-204 · ASSET #8821-X
              </span>
            </div>
            <h1 className="digital-twin-title" style={{ fontSize: '1.05rem', margin: '2px 0 0', letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {equipmentName.toUpperCase()} · HYDRAULIC TWIN
            </h1>
          </div>
        </div>

        {/* Global Controls & Mode Switcher */}
        <div className="digital-twin-controls-cluster" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {/* Render Style Toggle */}
          <div
            className="paper-card"
            style={{
              padding: '2px 4px',
              display: 'flex',
              gap: '3px',
              backgroundColor: 'var(--color-bone)',
            }}
          >
            <button
              onClick={() => setRenderMode('pbr')}
              className={`btn ${renderMode === 'pbr' ? 'btn-hazard' : ''}`}
              style={{ padding: '3px 7px', fontSize: '0.68rem' }}
              title="Solid Physically Based Rendering"
            >
              SOLID PBR
            </button>
            <button
              onClick={() => setRenderMode('cad')}
              className={`btn ${renderMode === 'cad' ? 'btn-hazard' : ''}`}
              style={{ padding: '3px 7px', fontSize: '0.68rem' }}
              title="Technical CAD Blueprint Wireframe"
            >
              CAD WIRE
            </button>
            <button
              onClick={() => setRenderMode('xray')}
              className={`btn ${renderMode === 'xray' ? 'btn-hazard' : ''}`}
              style={{ padding: '3px 7px', fontSize: '0.68rem' }}
              title="X-Ray Ghost Transparency"
            >
              X-RAY
            </button>
          </div>

          {/* Camera Perspective Presets */}
          <div
            className="paper-card"
            style={{
              padding: '2px 4px',
              display: 'flex',
              gap: '3px',
              backgroundColor: 'var(--color-bone)',
            }}
          >
            <button
              onClick={() => setCameraPreset('iso')}
              className={`btn ${cameraPreset === 'iso' ? 'btn-hazard' : ''}`}
              style={{ padding: '3px 7px', fontSize: '0.68rem' }}
              title="Isometric 3/4 Perspective"
            >
              ISO 3D
            </button>
            <button
              onClick={() => setCameraPreset('top')}
              className={`btn ${cameraPreset === 'top' ? 'btn-hazard' : ''}`}
              style={{ padding: '3px 7px', fontSize: '0.68rem' }}
              title="Top-Down Plan View"
            >
              TOP
            </button>
            <button
              onClick={() => setCameraPreset('side')}
              className={`btn ${cameraPreset === 'side' ? 'btn-hazard' : ''}`}
              style={{ padding: '3px 7px', fontSize: '0.68rem' }}
              title="Side Elevation View"
            >
              SIDE
            </button>
          </div>

          {/* 360 Turntable Auto-Rotate Toggle */}
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`btn ${autoRotate ? 'btn-teal' : ''}`}
            style={{ padding: '5px 8px', fontSize: '0.7rem' }}
            title="Toggle 360° ambient turntable auto-rotation"
          >
            {autoRotate ? '🔄 360° SPINNING' : '🔄 360° AUTO-ROTATE'}
          </button>
        </div>
      </div>

      {/* 2. SUBSYSTEM ATTENTION SELECTION STRIP (Directly Under Header) */}
      <div
        className="digital-twin-subsystem-bar"
        style={{
          borderBottom: 'var(--border-ink)',
          backgroundColor: 'var(--color-paper)',
          padding: '6px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          zIndex: 35,
          flexShrink: 0,
        }}
      >
        <span className="mono" style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-ink-muted)', marginRight: '2px' }}>
          FOCUS:
        </span>
        {SUBSYSTEM_LIST.map((sub) => {
          const isSelected = selectedSubsystemId === sub.id;
          const isFault = sub.id === 'BOOM_CYLINDER' && !isResolved;
          return (
            <button
              key={sub.id}
              onClick={() => handleSelectSubsystem(sub.id)}
              className={`btn ${isSelected ? (isFault ? 'btn-vermilion' : 'btn-hazard') : ''}`}
              style={{
                padding: '4px 8px',
                fontSize: '0.7rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontWeight: isSelected ? 700 : 500,
                borderColor: isFault ? 'var(--color-vermilion)' : undefined,
              }}
            >
              <span>{sub.icon}</span>
              <span>{sub.label}</span>
              {isFault && (
                <span className="stamp stamp-critical" style={{ fontSize: '0.52rem', padding: '1px 3px' }}>
                  FAULT
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. MAIN SPLIT LAYOUT: 3D Canvas Substrate (Left) + Subsystem Intelligence Drawer (Right) */}
      <div className="digital-twin-container">
        {/* LEFT / CENTER: Three.js Viewport */}
        <div className="digital-twin-canvas-wrapper">
          <DigitalTwinCanvas
            renderMode={renderMode}
            activeFaultId="BOOM_CYLINDER"
            isResolved={isResolved}
            hoveredSubsystemId={hoveredSubsystemId}
            selectedSubsystemId={selectedSubsystemId}
            explodedAmount={explodedAmount}
            cameraPreset={cameraPreset}
            autoRotate={autoRotate}
            onProjectedCoordinates={setProjectedCoords}
            onSelectSubsystem={(id) => setSelectedSubsystemId(id)}
            onHoverSubsystem={(id) => setHoveredSubsystemId(id)}
          />

          {/* Dynamic 2D SVG Leader Line Callouts */}
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 10,
            }}
          >
            {Object.entries(projectedCoords).map(([subId, coord]) => {
              if (!coord.visible || coord.x <= 0 || coord.y <= 0) return null;
              const isSelected = subId === selectedSubsystemId;
              const isFault = subId === 'BOOM_CYLINDER' && !isResolved;
              const isHovered = subId === hoveredSubsystemId;

              // Only show callout if selected, hovered, or in exploded stages
              if (!isSelected && !isHovered && activeStageIdx < 2 && selectedSubsystemId !== 'ALL') return null;

              const strokeColor = isFault
                ? 'var(--color-vermilion)'
                : isSelected
                ? 'var(--color-cad-active)'
                : isHovered
                ? 'var(--color-hazard)'
                : 'var(--color-cad-stroke)';

              const isRight = coord.x < 360;
              const dx = isRight ? 35 : -35;
              const hx = isRight ? 110 : -110;
              const elbowX = coord.x + dx;
              const elbowY = coord.y - 20;
              const endX = coord.x + hx;
              const textAnchor = isRight ? 'start' : 'end';
              const textX = isRight ? endX + 4 : endX - 4;

              return (
                <g key={subId}>
                  <circle cx={coord.x} cy={coord.y} r={isFault ? 7 : 4} fill="none" stroke={strokeColor} strokeWidth={2} />
                  <circle cx={coord.x} cy={coord.y} r={2} fill={strokeColor} />
                  {isFault && (
                    <circle cx={coord.x} cy={coord.y} r={13} fill="none" stroke="var(--color-vermilion)" strokeWidth={1.5} strokeDasharray="3 3" />
                  )}
                  <path d={`M ${coord.x} ${coord.y} L ${elbowX} ${elbowY} L ${endX} ${elbowY}`} fill="none" stroke={strokeColor} strokeWidth={1.5} />
                  <text x={textX} y={elbowY - 4} textAnchor={textAnchor} fill={strokeColor} fontSize="9.5" fontFamily="var(--font-mono)" fontWeight="700">
                    {coord.partNumber || subId}
                  </text>
                  {isFault && (
                    <text x={textX} y={elbowY + 10} textAnchor={textAnchor} fill="var(--color-vermilion)" fontSize="8" fontFamily="var(--font-mono)" fontWeight="800">
                      [FAULT: REDLINE 5,120 PSI]
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Minimal Non-Obstructive 3D HUD Badge */}
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              backgroundColor: 'rgba(20, 32, 31, 0.88)',
              border: '1px solid var(--color-cad-stroke)',
              color: 'var(--color-bone)',
              borderRadius: '2px',
              pointerEvents: 'none',
              zIndex: 20,
            }}
          >
            <span
              className="presence-dot"
              style={{ backgroundColor: isResolved ? 'var(--color-teal)' : 'var(--color-vermilion)' }}
            />
            <span className="mono" style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-cad-stroke)' }}>
              3D CAD TWIN · EX-204
            </span>
            <span style={{ color: 'var(--color-ink-muted)', fontSize: '0.65rem' }}>|</span>
            <span className="mono" style={{ fontSize: '0.68rem', color: 'var(--color-hazard)' }}>
              {SUBSYSTEM_LIST.find((s) => s.id === selectedSubsystemId)?.label || 'All Systems'}
            </span>
            <span style={{ color: 'var(--color-ink-muted)', fontSize: '0.65rem' }}>|</span>
            <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--color-bone)' }}>
              ROTATE: DRAG · ZOOM: WHEEL / PINCH
            </span>
          </div>

          {/* Real-time Collaborative Synchronization Toast */}
          {syncNotice && (
            <div
              style={{
                position: 'absolute',
                top: '48px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: 'rgba(20, 32, 31, 0.94)',
                color: 'var(--color-hazard)',
                border: '1px solid var(--color-hazard)',
                boxShadow: 'var(--shadow-hard)',
                padding: '6px 14px',
                fontSize: '0.75rem',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                zIndex: 40,
                pointerEvents: 'none',
              }}
            >
              <span className="presence-dot" style={{ backgroundColor: 'var(--color-hazard)' }} />
              <span>{syncNotice.sender.toUpperCase()}: {syncNotice.text}</span>
            </div>
          )}
        </div>

        {/* RIGHT: Solid Technical Intelligence Drawer (Full height, natural scroll, NEVER blank) */}
        <div className="digital-twin-drawer">
          {/* Mobile Drawer Segmented Tabs (< 900px) */}
          <div className="mobile-drawer-tabs">
            <button
              onClick={() => setMobileTab('story')}
              className={`btn ${mobileTab === 'story' ? 'btn-hazard' : ''}`}
            >
              📖 STORY & EXPLODE
            </button>
            <button
              onClick={() => setMobileTab('specs')}
              className={`btn ${mobileTab === 'specs' ? 'btn-hazard' : ''}`}
            >
              🔧 OEM SPECS
            </button>
            <button
              onClick={() => setMobileTab('telemetry')}
              className={`btn ${mobileTab === 'telemetry' ? 'btn-hazard' : ''}`}
            >
              📊 LIVE CAN BUS
            </button>
          </div>

          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Card 1: Interactive Story & Exploded Assembly Director */}
            <div
              className={`paper-card ${mobileTab !== 'story' ? 'hide-on-mobile-tab' : ''}`}
              style={{
                padding: '16px',
                backgroundColor: 'var(--color-paper-light)',
                border: 'var(--border-ink)',
                boxShadow: 'var(--shadow-hard)',
              }}
            >
              {/* Stepper Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span className="stamp stamp-critical" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                  STAGE {currentStage.stage} OF 06
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={handlePrevStage}
                    disabled={activeStageIdx === 0}
                    className="btn"
                    style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                    title="Previous Stage"
                  >
                    ◀
                  </button>
                  <button
                    onClick={handleNextStage}
                    disabled={activeStageIdx === STORY_STAGES.length - 1}
                    className="btn"
                    style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                    title="Next Stage"
                  >
                    ▶
                  </button>
                </div>
              </div>

              <h2 style={{ fontSize: '1.15rem', lineHeight: 1.2, letterSpacing: '-0.02em', margin: '0 0 4px' }}>
                {currentStage.title}
              </h2>
              <div className="mono" style={{ fontSize: '0.7rem', color: 'var(--color-ink-muted)', marginBottom: '8px' }}>
                {currentStage.sub}
              </div>
              <p style={{ margin: '0 0 12px', fontSize: '0.82rem', lineHeight: 1.45, color: 'var(--color-ink)' }}>
                {currentStage.description}
              </p>

              {/* 6 Stage Navigation Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '14px' }}>
                {STORY_STAGES.map((st, idx) => (
                  <button
                    key={st.id}
                    onClick={() => handleSelectStage(idx)}
                    className={`btn ${activeStageIdx === idx ? 'btn-hazard' : ''}`}
                    style={{
                      padding: '6px 4px',
                      fontSize: '0.68rem',
                      fontWeight: activeStageIdx === idx ? 700 : 500,
                      textAlign: 'center',
                    }}
                    title={`${st.stage}: ${st.title}`}
                  >
                    {st.stage} {st.id.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Exploded Disassembly Slider Control */}
              <div
                style={{
                  backgroundColor: 'var(--color-bone)',
                  padding: '10px 12px',
                  border: '1px solid var(--color-ink)',
                  marginBottom: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span className="mono" style={{ fontSize: '0.72rem', fontWeight: 700 }}>
                    EXPLODED DISASSEMBLY:
                  </span>
                  <span className="mono" style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-vermilion)' }}>
                    {Math.round(explodedAmount * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={explodedAmount}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setExplodedAmount(val);
                    broadcastTwinState({ explodedAmount: val });
                  }}
                  style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--color-hazard)' }}
                  aria-label="Explode Assembly Slider"
                />
              </div>

              {/* Rupture Simulator Toggle & CAN Alert Broadcast */}
              <button
                onClick={() => {
                  const nextResolved = !isResolved;
                  setIsResolved(nextResolved);
                  broadcastTwinState({ isResolved: nextResolved });
                  if (!nextResolved && incidentGuid) {
                    try {
                      const alertMsg = new CometChat.CustomMessage(
                        incidentGuid,
                        'can_alert',
                        CometChat.RECEIVER_TYPE.GROUP,
                        'custom',
                        {
                          text: `⚠️ [J1939 CAN-BUS SPIKE] Hydraulic pressure spiked to 5,120 PSI! Rupture simulation active on ${equipmentName}.`,
                          psi: 5120,
                        }
                      );
                      CometChat.sendCustomMessage(alertMsg).catch(() => {});
                    } catch (e) {
                      console.warn('Alert broadcast notice:', e);
                    }
                  }
                }}
                className={`btn ${isResolved ? 'btn-teal' : 'btn-vermilion'}`}
                style={{ width: '100%', padding: '8px', fontSize: '0.75rem', fontWeight: 700 }}
              >
                {isResolved ? '✓ RESTORE NOMINAL SYSTEM' : '⚠ SIMULATE HYDRAULIC RUPTURE (5,120 PSI)'}
              </button>
            </div>

            {/* Card 2: Active Subsystem Specification Card */}
            <div
              className={`paper-card ${mobileTab !== 'specs' ? 'hide-on-mobile-tab' : ''}`}
              style={{
                padding: '16px',
                backgroundColor: 'var(--color-paper-light)',
                border: 'var(--border-ink)',
                boxShadow: 'var(--shadow-hard)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--color-ink-muted)' }}>
                    OEM COMPONENT SPECIFICATION
                  </span>
                  <h3 style={{ fontSize: '1.05rem', margin: '2px 0 0' }}>
                    {activeSubsystemMeta.title}
                  </h3>
                </div>
                <span
                  className={`stamp ${
                    activeSubsystemMeta.status.includes('CRITICAL')
                      ? 'stamp-critical'
                      : activeSubsystemMeta.status.includes('WARNING')
                      ? 'stamp-serious'
                      : 'stamp-minor'
                  }`}
                  style={{ fontSize: '0.62rem' }}
                >
                  {activeSubsystemMeta.status.split('/')[0].trim()}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 8px',
                  backgroundColor: 'var(--color-bone)',
                  marginBottom: '10px',
                }}
              >
                <div className="mono" style={{ fontSize: '0.75rem' }}>
                  P/N: <strong>{activeSubsystemMeta.partNumber}</strong> · {activeSubsystemMeta.manufacturer}
                </div>
                <button
                  onClick={() => copyPartNumber(activeSubsystemMeta.partNumber)}
                  className="btn"
                  style={{ padding: '2px 6px', fontSize: '0.65rem' }}
                >
                  {copiedPart === activeSubsystemMeta.partNumber ? '✓ COPIED' : 'COPY P/N'}
                </button>
              </div>

              <div style={{ fontSize: '0.78rem', marginBottom: '6px' }}>
                <strong>Operational Rating:</strong> {activeSubsystemMeta.spec}
              </div>

              <div style={{ fontSize: '0.78rem', marginBottom: '8px' }}>
                <strong>Torque Specification:</strong> {activeSubsystemMeta.torque}
              </div>

              {/* OSHA LOTO Box */}
              <div
                style={{
                  backgroundColor: 'var(--color-bone)',
                  padding: '8px 10px',
                  borderLeft: '3px solid var(--color-ink)',
                  fontSize: '0.74rem',
                  lineHeight: 1.4,
                  marginBottom: '10px',
                }}
              >
                <span className="mono" style={{ fontWeight: 700 }}>OSHA LOTO PROTOCOL: </span>
                {activeSubsystemMeta.loto}
              </div>

              {/* OEM Parts Manifest */}
              {activeSubsystemMeta.parts.length > 0 && (
                <div>
                  <div className="mono" style={{ fontSize: '0.68rem', fontWeight: 700, marginBottom: '6px' }}>
                    OEM REPLACEMENT CATALOG:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {activeSubsystemMeta.parts.map((p, pIdx) => (
                      <div
                        key={pIdx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '6px 8px',
                          border: '1px solid var(--color-ink-muted)',
                          fontSize: '0.74rem',
                          backgroundColor: 'var(--color-paper)',
                        }}
                      >
                        <div>
                          <div className="mono" style={{ fontWeight: 700 }}>{p.partNumber}</div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--color-ink-muted)' }}>{p.name}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div className="mono" style={{ fontWeight: 700 }}>{p.cost}</div>
                          <div className="mono" style={{ fontSize: '0.65rem', color: 'var(--color-teal)' }}>{p.leadTime}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Card 3: Live J1939 CAN Telemetry */}
            <div
              className={`paper-card ${mobileTab !== 'telemetry' ? 'hide-on-mobile-tab' : ''}`}
              style={{
                padding: '14px',
                backgroundColor: 'rgba(20, 32, 31, 0.94)',
                color: 'var(--color-bone)',
                border: '1px solid var(--color-cad-stroke)',
                boxShadow: 'var(--shadow-hard)',
              }}
            >
              <div
                className="mono"
                style={{
                  fontSize: '0.68rem',
                  color: 'var(--color-hazard)',
                  fontWeight: 700,
                  borderBottom: '1px solid rgba(242, 183, 5, 0.3)',
                  paddingBottom: '4px',
                  marginBottom: '10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>◈ J1939 SYNTHETIC HARNESS</span>
                <span style={{ color: 'var(--color-cad-stroke)' }}>LIVE SIMULATION</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', textAlign: 'center' }}>
                <div style={{ backgroundColor: 'rgba(0,0,0,0.25)', padding: '8px 4px', border: '1px solid var(--color-cad-stroke)' }}>
                  <div className="mono" style={{ fontSize: '0.62rem', color: 'var(--color-ink-muted)' }}>HYDRAULIC (SIM)</div>
                  <div
                    className="mono"
                    style={{
                      fontSize: '1rem',
                      fontWeight: 700,
                      color: telemetryPsi > 4500 ? 'var(--color-vermilion)' : 'var(--color-cad-nominal)',
                      marginTop: '2px',
                    }}
                  >
                    {telemetryPsi} PSI
                  </div>
                </div>
                <div style={{ backgroundColor: 'rgba(0,0,0,0.25)', padding: '8px 4px', border: '1px solid var(--color-cad-stroke)' }}>
                  <div className="mono" style={{ fontSize: '0.62rem', color: 'var(--color-ink-muted)' }}>OIL TEMP</div>
                  <div
                    className="mono"
                    style={{
                      fontSize: '1rem',
                      fontWeight: 700,
                      color: telemetryTemp > 100 ? 'var(--color-hazard)' : 'var(--color-bone)',
                      marginTop: '2px',
                    }}
                  >
                    {telemetryTemp}°C
                  </div>
                </div>
                <div style={{ backgroundColor: 'rgba(0,0,0,0.25)', padding: '8px 4px', border: '1px solid var(--color-cad-stroke)' }}>
                  <div className="mono" style={{ fontSize: '0.62rem', color: 'var(--color-ink-muted)' }}>ENGINE RPM</div>
                  <div className="mono" style={{ fontSize: '1rem', fontWeight: 700, marginTop: '2px' }}>
                    {telemetryRpm}
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: Incident Response Quick Actions */}
            <div
              className="paper-card"
              style={{
                padding: '14px',
                backgroundColor: 'var(--color-paper-light)',
                border: 'var(--border-ink)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div className="mono" style={{ fontSize: '0.7rem', fontWeight: 700 }}>
                INCIDENT RESPONSE ACTIONS:
              </div>
              <button
                onClick={() => navigate('/board')}
                className="btn btn-hazard"
                style={{ width: '100%', padding: '8px', fontSize: '0.78rem' }}
              >
                VIEW INCIDENTS ON TRIAGE BOARD →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
