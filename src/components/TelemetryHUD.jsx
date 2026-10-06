import { useState, useEffect } from 'react';
import { MACHINERY_CATALOG } from '../lib/gemini';

/**
 * Equipment Telemetry HUD & Interactive Vector Schematics
 * Displays live simulated CAN-bus gauges & interactive machine blueprint with pulsing fault pinpoints.
 */
export default function TelemetryHUD({
  equipment = 'Excavator EX-204',
  incidentMeta = {},
  isResolved = false,
  onDispatchInquiry = null,
  initiallyExpanded = false,
}) {
  const [expanded, setExpanded] = useState(initiallyExpanded);
  const [selectedSubsystem, setSelectedSubsystem] = useState(null);

  // Live fluctuating telemetry parameters (CAN-bus simulation)
  const [pressurePsi, setPressurePsi] = useState(isResolved ? 4180 : 5120);
  const [tempCelsius, setTempCelsius] = useState(isResolved ? 86 : 108);
  const [engineRpm, setEngineRpm] = useState(isResolved ? 1850 : 2140);
  const [jitter, setJitter] = useState(0);

  // Micro-jitter simulation for realistic heavy machinery CAN-bus telemetry
  useEffect(() => {
    const interval = setInterval(() => {
      setJitter((prev) => (prev === 0 ? 1 : 0));
      if (!isResolved) {
        // High fluctuating critical pressure readings
        setPressurePsi(Math.floor(5050 + Math.random() * 180));
        setTempCelsius(Math.floor(106 + Math.random() * 4));
        setEngineRpm(Math.floor(2100 + Math.random() * 90));
      } else {
        // Calm nominal readings
        setPressurePsi(Math.floor(4150 + Math.random() * 60));
        setTempCelsius(Math.floor(84 + Math.random() * 3));
        setEngineRpm(Math.floor(1800 + Math.random() * 40));
      }
    }, 1800);
    return () => clearInterval(interval);
  }, [isResolved]);

  // Determine fault node based on equipment and incident description
  const isHydraulic =
    (incidentMeta.description || '').toLowerCase().includes('hydraulic') ||
    (incidentMeta.description || '').toLowerCase().includes('boom') ||
    (incidentMeta.description || '').toLowerCase().includes('pressure') ||
    (incidentMeta.description || '').toLowerCase().includes('rupture');

  const faultSubsystem = isHydraulic ? 'BOOM_CYLINDER' : 'POWERTRAIN';

  // Subsystem node list for Excavator EX-204 & generic heavy earthmovers
  const excavatorNodes = [
    {
      id: 'BOOM_CYLINDER',
      label: 'Main Boom Cylinder',
      cx: 195,
      cy: 78,
      status: isResolved ? 'nominal' : 'fault',
      spec: '4,200 PSI max · 140mm Bore',
      desc: 'High-pressure double-acting hydraulic ram driving primary lift arm.',
    },
    {
      id: 'ARM_CYLINDER',
      label: 'Stick / Arm Ram',
      cx: 310,
      cy: 62,
      status: 'nominal',
      spec: '4,200 PSI max · 120mm Bore',
      desc: 'Secondary articulation actuator for trenching depth control.',
    },
    {
      id: 'MAIN_PUMP',
      label: 'Rexroth A8VO Dual Pump',
      cx: 125,
      cy: 110,
      status: isResolved ? 'nominal' : 'warning',
      spec: '2x 280 L/min variable axial piston',
      desc: 'Variable displacement tandem swashplate pump driven by flywheel.',
    },
    {
      id: 'SLEW_MOTOR',
      label: 'Upperstructure Slew Motor',
      cx: 140,
      cy: 90,
      status: 'nominal',
      spec: '11.8 RPM · Integrated Parking Brake',
      desc: 'Radial piston slew drive with internal relief valves.',
    },
    {
      id: 'DIESEL_ENGINE',
      label: 'Tier 4F Diesel Engine',
      cx: 80,
      cy: 100,
      status: isResolved ? 'nominal' : 'warning',
      spec: '6.7L Turbocharged · 174 kW',
      desc: 'High-pressure common rail diesel prime mover.',
    },
    {
      id: 'FINAL_DRIVE',
      label: 'Track Undercarriage',
      cx: 115,
      cy: 155,
      status: 'nominal',
      spec: 'Planetary 2-Speed Reduction',
      desc: 'Heavy crawler sprocket drive and steel track tensioner.',
    },
  ];

  // Generic truck/van nodes for Kestrel fleet
  const transportNodes = [
    {
      id: 'AIR_BRAKE',
      label: 'Dual Circuit Air Brakes',
      cx: 260,
      cy: 130,
      status: isResolved ? 'nominal' : 'fault',
      spec: '125 PSI Governor Cutout',
      desc: 'Type 30/30 sealed spring brake chambers with ABS modulating valves.',
    },
    {
      id: 'TURBOCHARGER',
      label: 'Holset VGT Turbocharger',
      cx: 120,
      cy: 80,
      status: isResolved ? 'nominal' : 'warning',
      spec: '38 PSI Max Boost · Actuator PWM',
      desc: 'Variable geometry turbine wheel with electronic vane controller.',
    },
    {
      id: 'TRANSMISSION',
      label: 'Automatic HD Powertrain',
      cx: 180,
      cy: 110,
      status: 'nominal',
      spec: '6-Speed Planetary Torque Converter',
      desc: 'Heavy duty vocational transmission with auxiliary PTO.',
    },
    {
      id: 'DRIVE_AXLE',
      label: 'Tandem Rear Drive Axle',
      cx: 280,
      cy: 145,
      status: 'nominal',
      spec: 'Hypoid Gearing 3.73 Ratio',
      desc: 'Full-floating axle shafts with inter-axle differential lock.',
    },
  ];

  const activeNodes = equipment.includes('Freightliner') || equipment.includes('Cargo') || equipment.includes('Telehandler') || equipment.includes('Forklift')
    ? transportNodes
    : excavatorNodes;

  const activeFaultNode = activeNodes.find((n) => n.id === faultSubsystem) || activeNodes[0];

  const handleNodeClick = (node) => {
    setSelectedSubsystem(node);
  };

  const handleInquiryBroadcast = () => {
    if (onDispatchInquiry && selectedSubsystem) {
      const text = `🔧 TELEMETRY INQUIRY: Requesting status update on [${selectedSubsystem.label}] (Spec: ${selectedSubsystem.spec}). Field readings: Pressure ${pressurePsi} PSI, Temp ${tempCelsius}°C.`;
      onDispatchInquiry(text);
      setSelectedSubsystem(null);
    }
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--color-paper-light)',
        border: 'var(--border-ink)',
        borderLeft: isResolved ? '8px solid var(--color-teal)' : '8px solid var(--color-vermilion)',
        boxShadow: 'var(--shadow-hard-sm)',
        marginBottom: '16px',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Top HUD Banner Strip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          borderBottom: expanded ? 'var(--border-ink-thin)' : 'none',
          backgroundColor: isResolved ? '#E8F5F1' : '#FDF4ED',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: isResolved ? 'var(--color-teal)' : 'var(--color-vermilion)',
              letterSpacing: '0.04em',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isResolved ? 'var(--color-teal)' : 'var(--color-vermilion)',
                boxShadow: isResolved ? '0 0 6px var(--color-teal)' : '0 0 8px var(--color-vermilion)',
                animation: isResolved ? 'none' : 'blink 1.2s infinite',
              }}
            />
            {isResolved ? 'CAN-BUS NOMINAL' : 'CAN-BUS FAULT ACTIVE'}
          </span>

          <span
            className="mono"
            style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              color: 'var(--color-ink)',
              padding: '2px 8px',
              backgroundColor: 'var(--color-bone)',
              border: 'var(--border-ink-thin)',
            }}
          >
            {equipment.toUpperCase()}
          </span>

          {/* Quick Real-Time Readout Pills */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span
              className="mono"
              style={{
                fontSize: '0.75rem',
                padding: '2px 6px',
                backgroundColor: pressurePsi > 4800 ? '#FEE2E2' : 'var(--color-white)',
                color: pressurePsi > 4800 ? 'var(--color-vermilion)' : 'var(--color-ink)',
                border: '1px solid var(--color-ink)',
                fontWeight: 600,
              }}
            >
              HYD: <strong>{pressurePsi} PSI</strong>
            </span>

            <span
              className="mono"
              style={{
                fontSize: '0.75rem',
                padding: '2px 6px',
                backgroundColor: tempCelsius > 100 ? '#FEF3C7' : 'var(--color-white)',
                color: tempCelsius > 100 ? '#92400E' : 'var(--color-ink)',
                border: '1px solid var(--color-ink)',
                fontWeight: 600,
              }}
            >
              TEMP: <strong>{tempCelsius}°C</strong>
            </span>

            <span
              className="mono"
              style={{
                fontSize: '0.75rem',
                padding: '2px 6px',
                backgroundColor: 'var(--color-white)',
                color: 'var(--color-ink)',
                border: '1px solid var(--color-ink)',
                fontWeight: 600,
              }}
            >
              RPM: <strong>{engineRpm}</strong>
            </span>
          </div>
        </div>

        {/* Toggle HUD Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="paper-button"
            style={{
              padding: '4px 10px',
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>{expanded ? '▲ HIDE SCHEMATIC' : '▼ BLUEPRINT & GAUGES'}</span>
          </button>
        </div>
      </div>

      {/* Expanded Interactive Blueprint & Instrument Cluster */}
      {expanded && (
        <div style={{ padding: '16px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(300px, 1.4fr) minmax(240px, 1fr)',
              gap: '16px',
            }}
          >
            {/* 1. Interactive SVG Vector Blueprint */}
            <div
              style={{
                backgroundColor: '#0F1A1C',
                border: 'var(--border-ink-thick)',
                padding: '16px',
                position: 'relative',
                minHeight: '260px',
                overflow: 'hidden',
              }}
            >
              {/* Blueprint Grid Lines Background */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: `
                    linear-gradient(to right, rgba(0, 255, 200, 0.06) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(0, 255, 200, 0.06) 1px, transparent 1px)
                  `,
                  backgroundSize: '20px 20px',
                  pointerEvents: 'none',
                }}
              />

              {/* Blueprint Title Stencil */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '10px',
                  position: 'relative',
                  zIndex: 2,
                }}
              >
                <div>
                  <div
                    className="mono"
                    style={{
                      fontSize: '0.68rem',
                      color: 'rgba(255, 255, 255, 0.5)',
                      letterSpacing: '0.08em',
                    }}
                  >
                    DIAGNOSTIC VECTOR SCHEMATIC · SYSTEM BUS 1939
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: '0.92rem',
                      fontWeight: 800,
                      color: '#EFE8D8',
                    }}
                  >
                    {equipment.toUpperCase()} CAD SCHEMATIC
                  </div>
                </div>

                <div
                  className="mono"
                  style={{
                    fontSize: '0.7rem',
                    color: isResolved ? '#34D399' : '#F87171',
                    border: isResolved ? '1px solid #34D399' : '1px solid #F87171',
                    padding: '2px 6px',
                    backgroundColor: 'rgba(0,0,0,0.4)',
                  }}
                >
                  {isResolved ? 'FAULTS CLEARED' : 'PINPOINT 01 ACTIVE'}
                </div>
              </div>

              {/* Vector Machinery Illustration & Clickable Subsystem Nodes */}
              <div style={{ position: 'relative', width: '100%', height: '180px' }}>
                <svg
                  viewBox="0 0 400 190"
                  style={{ width: '100%', height: '100%', overflow: 'visible' }}
                >
                  {/* Heavy Machinery Outline (Excavator Silhouette) */}
                  <g
                    stroke="rgba(120, 200, 220, 0.45)"
                    strokeWidth="1.8"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {/* Undercarriage & Tracks */}
                    <rect x="50" y="140" width="130" height="26" rx="10" stroke="rgba(120, 200, 220, 0.6)" fill="rgba(20, 40, 45, 0.4)" />
                    <line x1="65" y1="140" x2="65" y2="166" />
                    <line x1="90" y1="140" x2="90" y2="166" />
                    <line x1="115" y1="140" x2="115" y2="166" />
                    <line x1="140" y1="140" x2="140" y2="166" />
                    <line x1="165" y1="140" x2="165" y2="166" />

                    {/* Slew Deck & Cab */}
                    <polygon points="60,140 160,140 155,100 80,100" fill="rgba(30, 60, 65, 0.5)" stroke="rgba(120, 200, 220, 0.7)" />
                    <polygon points="120,100 155,100 150,70 125,70" stroke="rgba(120, 200, 220, 0.8)" fill="rgba(40, 90, 100, 0.4)" />
                    {/* Cab Window */}
                    <rect x="130" y="74" width="18" height="20" stroke="rgba(0, 255, 200, 0.6)" fill="rgba(0, 255, 200, 0.1)" />

                    {/* Counterweight */}
                    <rect x="55" y="105" width="28" height="30" stroke="rgba(120, 200, 220, 0.6)" fill="rgba(20, 30, 35, 0.7)" />

                    {/* Main Boom Arm */}
                    <polyline points="145,110 205,75 270,95" strokeWidth="3" stroke="rgba(120, 200, 220, 0.85)" />

                    {/* Hydraulic Boom Cylinder (Fault Line) */}
                    <line
                      x1="150"
                      y1="125"
                      x2="195"
                      y2="78"
                      stroke={isResolved ? '#34D399' : '#EF4444'}
                      strokeWidth="3.5"
                    />

                    {/* Stick / Dipper Arm */}
                    <polyline points="270,95 330,120 340,145" strokeWidth="2.5" stroke="rgba(120, 200, 220, 0.8)" />

                    {/* Bucket */}
                    <polygon points="340,145 365,160 355,175 330,165" stroke="rgba(120, 200, 220, 0.9)" fill="rgba(30, 60, 70, 0.5)" />
                  </g>

                  {/* Pulsing Concentric Radar Rings on Fault Node */}
                  {!isResolved && (
                    <g>
                      <circle
                        cx={activeFaultNode.cx}
                        cy={activeFaultNode.cy}
                        r="18"
                        fill="none"
                        stroke="#EF4444"
                        strokeWidth="1.5"
                        opacity="0.8"
                      >
                        <animate attributeName="r" values="8;24;32" dur="1.8s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.9;0.4;0" dur="1.8s" repeatCount="indefinite" />
                      </circle>
                      <circle
                        cx={activeFaultNode.cx}
                        cy={activeFaultNode.cy}
                        r="10"
                        fill="none"
                        stroke="#F59E0B"
                        strokeWidth="1.5"
                      >
                        <animate attributeName="r" values="6;16" dur="1.2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="1;0.2" dur="1.2s" repeatCount="indefinite" />
                      </circle>
                    </g>
                  )}

                  {/* Subsystem Interactive Target Circles */}
                  {activeNodes.map((node) => {
                    const isFault = node.id === faultSubsystem && !isResolved;
                    const isSelected = selectedSubsystem?.id === node.id;
                    const fillColor = isFault ? '#EF4444' : isResolved ? '#10B981' : '#0EA5E9';

                    return (
                      <g
                        key={node.id}
                        onClick={() => handleNodeClick(node)}
                        style={{ cursor: 'pointer' }}
                      >
                        {/* Outer hit target */}
                        <circle
                          cx={node.cx}
                          cy={node.cy}
                          r={isSelected ? '9' : '7'}
                          fill={fillColor}
                          stroke="#FFFFFF"
                          strokeWidth="2"
                        />
                        {/* Inner pinpoint */}
                        <circle cx={node.cx} cy={node.cy} r="2.5" fill="#FFFFFF" />

                        {/* Label tag */}
                        <text
                          x={node.cx + 10}
                          y={node.cy - 6}
                          fill={isSelected ? '#F2B705' : '#EFE8D8'}
                          fontSize="9.5"
                          fontFamily="IBM Plex Mono"
                          fontWeight={isSelected ? 'bold' : 'normal'}
                        >
                          {node.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Subsystem Node Inspection Overlay */}
                {selectedSubsystem && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '8px',
                      left: '8px',
                      right: '8px',
                      backgroundColor: 'rgba(20, 32, 31, 0.94)',
                      border: '1px solid #F2B705',
                      padding: '8px 12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      zIndex: 10,
                      backdropFilter: 'blur(4px)',
                      flexWrap: 'wrap',
                      gap: '8px',
                    }}
                  >
                    <div>
                      <div
                        className="mono"
                        style={{ fontSize: '0.75rem', fontWeight: 700, color: '#F2B705' }}
                      >
                        INSPECTING: {selectedSubsystem.label.toUpperCase()}
                      </div>
                      <div
                        style={{ fontSize: '0.74rem', color: '#EFE8D8', marginTop: '2px' }}
                      >
                        {selectedSubsystem.desc} · <span className="mono">{selectedSubsystem.spec}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      {onDispatchInquiry && (
                        <button
                          type="button"
                          onClick={handleInquiryBroadcast}
                          className="paper-button"
                          style={{
                            padding: '3px 8px',
                            fontSize: '0.72rem',
                            backgroundColor: '#E4421E',
                            color: '#FFFFFF',
                            borderColor: '#FFFFFF',
                            fontFamily: 'var(--font-mono)',
                          }}
                        >
                          DISPATCH INQUIRY TO CHAT
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setSelectedSubsystem(null)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#9CA3AF',
                          cursor: 'pointer',
                          fontSize: '1rem',
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Instructions banner */}
              <div
                className="mono"
                style={{
                  fontSize: '0.68rem',
                  color: 'rgba(255, 255, 255, 0.45)',
                  textAlign: 'center',
                  marginTop: '4px',
                }}
              >
                CLICK ANY BLUEPRINT NODE TO INSPECT SUBSYSTEM SPECS OR DISPATCH QUERY
              </div>
            </div>

            {/* 2. CAN-Bus Instrument Cluster & Analog-Style Telemetry Dials */}
            <div
              style={{
                backgroundColor: 'var(--color-bone)',
                border: 'var(--border-ink-thick)',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              <div
                className="mono"
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: 'var(--color-ink)',
                  borderBottom: 'var(--border-ink-thin)',
                  paddingBottom: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>CAN-BUS GAUGES</span>
                <span>RATE: 250 KBPS</span>
              </div>

              {/* Hydraulic Pressure Gauge */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    marginBottom: '3px',
                  }}
                >
                  <span style={{ fontWeight: 700 }}>HYDRAULIC PRESSURE</span>
                  <span
                    style={{
                      fontWeight: 800,
                      color: pressurePsi > 4800 ? 'var(--color-vermilion)' : 'var(--color-ink)',
                    }}
                  >
                    {pressurePsi} PSI
                  </span>
                </div>
                {/* Gauge Meter Bar */}
                <div
                  style={{
                    height: '14px',
                    backgroundColor: '#E5E7EB',
                    border: '1px solid var(--color-ink)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(100, (pressurePsi / 6000) * 100)}%`,
                      backgroundColor:
                        pressurePsi > 4800
                          ? 'var(--color-vermilion)'
                          : pressurePsi > 4000
                          ? 'var(--color-hazard)'
                          : 'var(--color-teal)',
                      transition: 'width 0.4s ease',
                    }}
                  />
                  {/* Warning line at 4,800 PSI */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      left: '80%',
                      width: '2px',
                      backgroundColor: 'var(--color-vermilion)',
                    }}
                    title="4,800 PSI Safety Threshold"
                  />
                </div>
                <div
                  className="mono"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.62rem',
                    color: 'var(--color-ink-muted)',
                    marginTop: '2px',
                  }}
                >
                  <span>0</span>
                  <span>2,000</span>
                  <span>4,000</span>
                  <span style={{ color: 'var(--color-vermilion)', fontWeight: 700 }}>6,000 MAX</span>
                </div>
              </div>

              {/* Oil / Engine Coolant Temperature */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    marginBottom: '3px',
                  }}
                >
                  <span style={{ fontWeight: 700 }}>COOLANT & SLEW TEMP</span>
                  <span
                    style={{
                      fontWeight: 800,
                      color: tempCelsius > 100 ? 'var(--color-vermilion)' : 'var(--color-ink)',
                    }}
                  >
                    {tempCelsius}°C
                  </span>
                </div>
                <div
                  style={{
                    height: '14px',
                    backgroundColor: '#E5E7EB',
                    border: '1px solid var(--color-ink)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(100, (tempCelsius / 130) * 100)}%`,
                      backgroundColor:
                        tempCelsius > 102
                          ? 'var(--color-vermilion)'
                          : tempCelsius > 90
                          ? 'var(--color-hazard)'
                          : 'var(--color-teal)',
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
                <div
                  className="mono"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.62rem',
                    color: 'var(--color-ink-muted)',
                    marginTop: '2px',
                  }}
                >
                  <span>40°C</span>
                  <span>80°C</span>
                  <span>100°C CRIT</span>
                  <span>130°C</span>
                </div>
              </div>

              {/* CAN Diagnostic Trouble Code Stencil Box */}
              <div
                style={{
                  backgroundColor: isResolved ? '#D1FAE5' : '#FEE2E2',
                  border: '1px solid var(--color-ink)',
                  padding: '8px 10px',
                }}
              >
                <div
                  className="mono"
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    color: isResolved ? 'var(--color-teal)' : 'var(--color-vermilion)',
                  }}
                >
                  {isResolved ? 'ACTIVE DTC: NONE · ALL MONITORS OK' : 'ACTIVE DTC: SPN 1087 / FMI 01'}
                </div>
                <div
                  className="mono"
                  style={{
                    fontSize: '0.68rem',
                    color: 'var(--color-ink)',
                    marginTop: '2px',
                  }}
                >
                  {isResolved
                    ? 'CAN-Bus cleared. Hydraulic pressure restored to safe baseline.'
                    : 'HYDRAULIC CIRCUIT PRESSURE EXCEEDED RELIEF THRESHOLD'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
