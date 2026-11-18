import * as THREE from 'three';

/**
 * RescueRoom — Industrial 3D Digital Twin Mechanical Assembly
 * Constructs a high-fidelity, modular, exploded-view mechanical assembly of heavy equipment.
 * 
 * Central Subject: Excavator EX-204 High-Pressure Hydraulic Powertrain & Articulation Assembly
 * Includes:
 * 1. Main Boom Cylinder & Hydraulic Actuator (BOOM_CYLINDER)
 * 2. Rexroth A8VO Dual Tandem Swashplate Piston Pump (SWASHPLATE_PUMP)
 * 3. Proportional Directional Valve Manifold Block (VALVE_MANIFOLD)
 * 4. Planetary Slew Reduction Drive & Motor (SLEW_MOTOR)
 * 5. Tier 4F Turbocharged Diesel Engine Prime Mover (DIESEL_ENGINE)
 * 6. Boxed Chassis Boom Foot & Undercarriage Frame (CHASSIS_BASE)
 */

// Field Manual Industrial Palette
export const INDUSTRIAL_PALETTE = {
  castIron: 0x222629,
  machinedSteel: 0x8a9ba8,
  chromeMirror: 0xdde6ed,
  safetyAmber: 0xf2b705,
  safetyOrange: 0xd46816,
  emergencyVermilion: 0xe4421e,
  oxidisedTeal: 0x1f6f68,
  cadCyan: 0x38bdf8,
  brassFitting: 0xc89b3c,
  rubberBlack: 0x14171a,
  cadGrid: 0x0f1a1c,
  cadLine: 0x78c8dc,
};

/**
 * Spatial Camera Focal Targets for each mechanical subsystem
 * Allows smooth, precision camera transitions while keeping context visible
 */
export const SUBSYSTEM_CAMERA_TARGETS = {
  ALL: {
    name: 'Complete Powertrain Assembly',
    pos: [8.5, 4.8, 8.5],
    target: [0, 0.4, 0],
  },
  BOOM_CYLINDER: {
    name: 'Hydraulic Main Boom Cylinder',
    pos: [4.2, 3.2, 3.8],
    target: [0.4, 1.2, 0.4],
  },
  SWASHPLATE_PUMP: {
    name: 'Rexroth A8VO Dual Swashplate Pump',
    pos: [-4.2, 2.6, 3.2],
    target: [-1.4, 0.5, 0.6],
  },
  VALVE_MANIFOLD: {
    name: 'Proportional Flow Valve Manifold',
    pos: [2.2, 2.6, 3.4],
    target: [-0.2, 0.6, 0.8],
  },
  SLEW_MOTOR: {
    name: 'Upperstructure Slew Motor Drive',
    pos: [3.2, 2.0, -2.6],
    target: [0.2, 0.1, -0.4],
  },
  DIESEL_ENGINE: {
    name: 'Tier 4F Turbocharged Diesel Engine',
    pos: [-4.4, 3.0, -2.8],
    target: [-1.4, 0.5, -0.6],
  },
  CHASSIS_BASE: {
    name: 'Chassis Undercarriage & Crawler Tracks',
    pos: [6.8, 2.4, 6.8],
    target: [0, -0.8, 0],
  },
};

/**
 * Helper to build an edge wireframe overlay for high-precision technical CAD look
 */
function createCadEdges(geometry, color = INDUSTRIAL_PALETTE.cadLine, opacity = 0.55, threshold = 28) {
  const edges = new THREE.EdgesGeometry(geometry, threshold);
  const lineMat = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthTest: true,
  });
  return new THREE.LineSegments(edges, lineMat);
}

/**
 * Creates the Main Hydraulic Boom Cylinder Subsystem
 */
function buildBoomCylinderGroup() {
  const group = new THREE.Group();
  group.name = 'BOOM_CYLINDER';

  // 1. Hydraulic Barrel (Outer safety amber cylinder with heavy welded end cap)
  const barrelGeom = new THREE.CylinderGeometry(0.38, 0.38, 2.6, 32);
  const barrelMat = new THREE.MeshStandardMaterial({
    color: INDUSTRIAL_PALETTE.safetyAmber,
    metalness: 0.65,
    roughness: 0.35,
  });
  const barrel = new THREE.Mesh(barrelGeom, barrelMat);
  barrel.castShadow = true;
  barrel.receiveShadow = true;
  barrel.add(createCadEdges(barrelGeom, 0x1c1b18, 0.7));
  group.add(barrel);

  // Barrel reinforcement collar rings
  for (let y of [-0.9, 0.0, 0.9]) {
    const ringGeom = new THREE.CylinderGeometry(0.42, 0.42, 0.12, 32);
    const ringMat = new THREE.MeshStandardMaterial({
      color: INDUSTRIAL_PALETTE.castIron,
      metalness: 0.8,
      roughness: 0.3,
    });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.position.y = y;
    ring.add(createCadEdges(ringGeom, INDUSTRIAL_PALETTE.cadLine, 0.5));
    group.add(ring);
  }

  // 2. Machined Cylinder Head / Gland (Grey machined alloy)
  const glandGeom = new THREE.CylinderGeometry(0.44, 0.42, 0.35, 32);
  const glandMat = new THREE.MeshStandardMaterial({
    color: INDUSTRIAL_PALETTE.machinedSteel,
    metalness: 0.85,
    roughness: 0.25,
  });
  const gland = new THREE.Mesh(glandGeom, glandMat);
  gland.position.y = 1.4;
  gland.add(createCadEdges(glandGeom, INDUSTRIAL_PALETTE.cadLine, 0.6));
  group.add(gland);

  // 3. Mirror-Chromed Piston Rod (High-pressure extendable ram)
  const rodGeom = new THREE.CylinderGeometry(0.22, 0.22, 2.2, 32);
  const rodMat = new THREE.MeshStandardMaterial({
    color: INDUSTRIAL_PALETTE.chromeMirror,
    metalness: 0.98,
    roughness: 0.08,
  });
  const rod = new THREE.Mesh(rodGeom, rodMat);
  rod.position.y = 2.4;
  rod.castShadow = true;
  rod.add(createCadEdges(rodGeom, INDUSTRIAL_PALETTE.chromeMirror, 0.4));
  group.add(rod);

  // 4. Forged Rod Eye / Clevis Mount with Spherical Bearing
  const eyeBaseGeom = new THREE.BoxGeometry(0.46, 0.48, 0.36);
  const eyeBaseMat = new THREE.MeshStandardMaterial({
    color: INDUSTRIAL_PALETTE.castIron,
    metalness: 0.8,
    roughness: 0.4,
  });
  const eyeBase = new THREE.Mesh(eyeBaseGeom, eyeBaseMat);
  eyeBase.position.y = 3.6;
  eyeBase.add(createCadEdges(eyeBaseGeom, INDUSTRIAL_PALETTE.cadLine, 0.6));
  group.add(eyeBase);

  const eyeHoleGeom = new THREE.CylinderGeometry(0.18, 0.18, 0.42, 24);
  eyeHoleGeom.rotateZ(Math.PI / 2);
  const eyeHoleMat = new THREE.MeshStandardMaterial({
    color: INDUSTRIAL_PALETTE.brassFitting,
    metalness: 0.7,
    roughness: 0.3,
  });
  const eyeHole = new THREE.Mesh(eyeHoleGeom, eyeHoleMat);
  eyeHole.position.y = 3.6;
  group.add(eyeHole);

  // 5. SAE Code 62 High-Pressure Hydraulic Inlet Ports & Flange Blocks
  const portGeom = new THREE.BoxGeometry(0.24, 0.22, 0.28);
  const portMat = new THREE.MeshStandardMaterial({
    color: INDUSTRIAL_PALETTE.machinedSteel,
    metalness: 0.8,
    roughness: 0.3,
  });
  const port = new THREE.Mesh(portGeom, portMat);
  port.position.set(0.35, 1.0, 0);
  port.add(createCadEdges(portGeom, INDUSTRIAL_PALETTE.cadLine, 0.7));
  group.add(port);

  // 6. High-Pressure 4-Spiral Braided Hose (Curved spline tube)
  const hoseCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.45, 1.0, 0),
    new THREE.Vector3(0.9, 0.8, 0.3),
    new THREE.Vector3(1.1, -0.2, 0.6),
    new THREE.Vector3(0.8, -1.0, 0.8),
  ]);
  const hoseGeom = new THREE.TubeGeometry(hoseCurve, 32, 0.08, 12, false);
  const hoseMat = new THREE.MeshStandardMaterial({
    color: INDUSTRIAL_PALETTE.rubberBlack,
    metalness: 0.2,
    roughness: 0.8,
  });
  const hose = new THREE.Mesh(hoseGeom, hoseMat);
  hose.add(createCadEdges(hoseGeom, INDUSTRIAL_PALETTE.cadLine, 0.4, 20));
  group.add(hose);

  // 7. Fault Indicator Pulsing Halo / Thermal Stress Field (Hidden by default, shown in fault mode)
  const faultHaloGeom = new THREE.TorusGeometry(0.48, 0.06, 16, 32);
  faultHaloGeom.rotateX(Math.PI / 2);
  const faultHaloMat = new THREE.MeshBasicMaterial({
    color: INDUSTRIAL_PALETTE.emergencyVermilion,
    transparent: true,
    opacity: 0.0,
  });
  const faultHalo = new THREE.Mesh(faultHaloGeom, faultHaloMat);
  faultHalo.position.set(0.35, 1.0, 0);
  faultHalo.name = 'FAULT_HALO';
  group.add(faultHalo);

  // Assembly metadata
  group.userData = {
    id: 'BOOM_CYLINDER',
    name: 'Main Hydraulic Boom Cylinder',
    partNumber: 'CAT-154-8291',
    category: 'HYDRAULIC ACTUATION',
    spec: '4,200 PSI Nominal · 140mm Bore · 100mm Rod',
    burstPressure: '5,500 PSI',
    torqueSpec: 'Flange Head M16: 145 Nm (107 ft-lb)',
    lotoStep: 'Install mechanical boom safety lock bar before relieving pressure.',
    defaultPos: new THREE.Vector3(0.6, 0.8, 0.2),
    explodedPos: new THREE.Vector3(1.2, 2.6, 1.6),
    explodedRot: new THREE.Euler(0.15, -0.1, 0.1),
    annotationAnchor: new THREE.Vector3(1.2, 3.8, 1.6),
    accentColor: INDUSTRIAL_PALETTE.emergencyVermilion,
  };

  return group;
}

/**
 * Creates the Rexroth A8VO Dual Variable Swashplate Piston Pump
 */
function buildSwashplatePumpGroup() {
  const group = new THREE.Group();
  group.name = 'SWASHPLATE_PUMP';

  // 1. Cast Ribbed Housing (Main pump body)
  const bodyGeom = new THREE.CylinderGeometry(0.55, 0.6, 1.7, 24);
  bodyGeom.rotateZ(Math.PI / 2);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: INDUSTRIAL_PALETTE.castIron,
    metalness: 0.85,
    roughness: 0.35,
  });
  const body = new THREE.Mesh(bodyGeom, bodyMat);
  body.castShadow = true;
  body.receiveShadow = true;
  body.add(createCadEdges(bodyGeom, INDUSTRIAL_PALETTE.cadLine, 0.6));
  group.add(body);

  // 2. Rotary Swashplate Angle Yoke & Barrel Ring
  const yokeGeom = new THREE.BoxGeometry(0.3, 1.1, 1.1);
  const yokeMat = new THREE.MeshStandardMaterial({
    color: INDUSTRIAL_PALETTE.machinedSteel,
    metalness: 0.9,
    roughness: 0.2,
  });
  const yoke = new THREE.Mesh(yokeGeom, yokeMat);
  yoke.position.x = 0.55;
  yoke.rotation.z = -0.25; // Angled swashplate angle
  yoke.add(createCadEdges(yokeGeom, INDUSTRIAL_PALETTE.cadLine, 0.7));
  group.add(yoke);

  // 3. 9 Axial Swashplate Pistons (Rotary ring arrangement)
  const pistonHolder = new THREE.Group();
  pistonHolder.name = 'ROTARY_PISTONS';
  pistonHolder.position.x = 0.2;
  const numPistons = 9;
  for (let i = 0; i < numPistons; i++) {
    const angle = (i / numPistons) * Math.PI * 2;
    const r = 0.32;
    const pGeom = new THREE.CylinderGeometry(0.06, 0.06, 0.6, 16);
    pGeom.rotateZ(Math.PI / 2);
    const pMat = new THREE.MeshStandardMaterial({
      color: INDUSTRIAL_PALETTE.chromeMirror,
      metalness: 0.95,
      roughness: 0.1,
    });
    const piston = new THREE.Mesh(pGeom, pMat);
    piston.position.set(0, Math.sin(angle) * r, Math.cos(angle) * r);
    pistonHolder.add(piston);
  }
  group.add(pistonHolder);

  // 4. Drive Shaft with Keyway Splines
  const shaftGeom = new THREE.CylinderGeometry(0.16, 0.16, 1.2, 24);
  shaftGeom.rotateZ(Math.PI / 2);
  const shaftMat = new THREE.MeshStandardMaterial({
    color: INDUSTRIAL_PALETTE.machinedSteel,
    metalness: 0.95,
    roughness: 0.15,
  });
  const shaft = new THREE.Mesh(shaftGeom, shaftMat);
  shaft.position.x = -1.1;
  shaft.add(createCadEdges(shaftGeom, INDUSTRIAL_PALETTE.chromeMirror, 0.5));
  group.add(shaft);

  // 5. SAE Mounting Flange with 8 Bolt Studs
  const flangeGeom = new THREE.CylinderGeometry(0.72, 0.72, 0.15, 24);
  flangeGeom.rotateZ(Math.PI / 2);
  const flangeMat = new THREE.MeshStandardMaterial({
    color: INDUSTRIAL_PALETTE.castIron,
    metalness: 0.8,
    roughness: 0.3,
  });
  const flange = new THREE.Mesh(flangeGeom, flangeMat);
  flange.position.x = -0.7;
  flange.add(createCadEdges(flangeGeom, INDUSTRIAL_PALETTE.cadLine, 0.6));
  group.add(flange);

  // Bolt studs
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const boltGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.22, 12);
    boltGeom.rotateZ(Math.PI / 2);
    const boltMat = new THREE.MeshStandardMaterial({
      color: INDUSTRIAL_PALETTE.chromeMirror,
      metalness: 0.9,
      roughness: 0.2,
    });
    const bolt = new THREE.Mesh(boltGeom, boltMat);
    bolt.position.set(-0.7, Math.sin(angle) * 0.62, Math.cos(angle) * 0.62);
    group.add(bolt);
  }

  // 6. Dual High-Pressure Flow Outlet Port Blocks
  const outBlockGeom = new THREE.BoxGeometry(0.4, 0.45, 0.35);
  const outBlockMat = new THREE.MeshStandardMaterial({
    color: INDUSTRIAL_PALETTE.machinedSteel,
    metalness: 0.8,
    roughness: 0.3,
  });
  const outBlock = new THREE.Mesh(outBlockGeom, outBlockMat);
  outBlock.position.set(0.2, 0.65, 0);
  outBlock.add(createCadEdges(outBlockGeom, INDUSTRIAL_PALETTE.cadLine, 0.7));
  group.add(outBlock);

  // Assembly metadata
  group.userData = {
    id: 'SWASHPLATE_PUMP',
    name: 'Rexroth A8VO Dual Swashplate Pump',
    partNumber: 'REXROTH-A8VO-107',
    category: 'PRIMARY POWER GENERATION',
    spec: '2x 280 L/min variable axial piston · 4,500 PSI Max',
    burstPressure: '5,800 PSI',
    torqueSpec: 'Mounting Flange M20: 320 Nm (236 ft-lb)',
    lotoStep: 'Depressurize pilot and load-sensing accumulator circuits before unbolting.',
    defaultPos: new THREE.Vector3(-1.2, 0.2, 0.0),
    explodedPos: new THREE.Vector3(-2.8, 0.6, 0.5),
    explodedRot: new THREE.Euler(0, 0.3, -0.15),
    annotationAnchor: new THREE.Vector3(-2.8, 1.6, 0.5),
    accentColor: INDUSTRIAL_PALETTE.cadCyan,
  };

  return group;
}

/**
 * Creates the Proportional Directional Valve Manifold Subsystem
 */
function buildValveManifoldGroup() {
  const group = new THREE.Group();
  group.name = 'VALVE_MANIFOLD';

  // 1. CNC-Milled Solid Aluminum Valve Manifold Block
  const blockGeom = new THREE.BoxGeometry(1.6, 0.9, 0.9);
  const blockMat = new THREE.MeshStandardMaterial({
    color: INDUSTRIAL_PALETTE.machinedSteel,
    metalness: 0.75,
    roughness: 0.25,
  });
  const block = new THREE.Mesh(blockGeom, blockMat);
  block.castShadow = true;
  block.receiveShadow = true;
  block.add(createCadEdges(blockGeom, INDUSTRIAL_PALETTE.cadLine, 0.7));
  group.add(block);

  // 2. 4 Proportional Cartridge Solenoid Valves with Knurled Caps
  for (let i = 0; i < 4; i++) {
    const xPos = -0.55 + i * 0.36;

    // Cartridge body
    const cGeom = new THREE.CylinderGeometry(0.1, 0.1, 0.6, 16);
    const cMat = new THREE.MeshStandardMaterial({
      color: INDUSTRIAL_PALETTE.castIron,
      metalness: 0.85,
      roughness: 0.3,
    });
    const cMesh = new THREE.Mesh(cGeom, cMat);
    cMesh.position.set(xPos, 0.65, 0);
    cMesh.add(createCadEdges(cGeom, INDUSTRIAL_PALETTE.cadLine, 0.5));
    group.add(cMesh);

    // Electrical connector cap
    const capGeom = new THREE.CylinderGeometry(0.12, 0.12, 0.18, 16);
    const capMat = new THREE.MeshStandardMaterial({
      color: INDUSTRIAL_PALETTE.brassFitting,
      metalness: 0.7,
      roughness: 0.3,
    });
    const cap = new THREE.Mesh(capGeom, capMat);
    cap.position.set(xPos, 1.0, 0);
    group.add(cap);
  }

  // 3. Side Diagnostic Minicheck Test Ports
  for (let i = 0; i < 3; i++) {
    const pGeom = new THREE.CylinderGeometry(0.06, 0.06, 0.18, 12);
    pGeom.rotateX(Math.PI / 2);
    const pMat = new THREE.MeshStandardMaterial({
      color: INDUSTRIAL_PALETTE.brassFitting,
      metalness: 0.8,
      roughness: 0.25,
    });
    const pMesh = new THREE.Mesh(pGeom, pMat);
    pMesh.position.set(-0.4 + i * 0.4, 0, 0.5);
    group.add(pMesh);
  }

  // Assembly metadata
  group.userData = {
    id: 'VALVE_MANIFOLD',
    name: 'Proportional Flow Valve Manifold',
    partNumber: 'CAT-349-1022',
    category: 'FLUID ROUTING & FLOW REGULATION',
    spec: '4-Bank Electro-Hydraulic Spool · CAN-bus J1939 PWM control',
    burstPressure: '5,200 PSI',
    torqueSpec: 'Solenoid Coils: 28 Nm (21 ft-lb) · Port Plugs: 65 Nm',
    lotoStep: 'Drain residual oil line into catch tray before disconnecting cartridges.',
    defaultPos: new THREE.Vector3(0.2, -0.6, 0.8),
    explodedPos: new THREE.Vector3(1.6, -1.4, 1.8),
    explodedRot: new THREE.Euler(-0.1, 0.2, 0),
    annotationAnchor: new THREE.Vector3(1.6, -0.6, 1.8),
    accentColor: INDUSTRIAL_PALETTE.safetyAmber,
  };

  return group;
}

/**
 * Creates the Planetary Slew Motor & Reduction Drive Subsystem
 */
function buildSlewMotorGroup() {
  const group = new THREE.Group();
  group.name = 'SLEW_MOTOR';

  // 1. Planetary Reduction Gear Casing
  const caseGeom = new THREE.CylinderGeometry(0.7, 0.8, 0.9, 24);
  const caseMat = new THREE.MeshStandardMaterial({
    color: INDUSTRIAL_PALETTE.castIron,
    metalness: 0.8,
    roughness: 0.4,
  });
  const casing = new THREE.Mesh(caseGeom, caseMat);
  casing.castShadow = true;
  casing.add(createCadEdges(caseGeom, INDUSTRIAL_PALETTE.cadLine, 0.6));
  group.add(casing);

  // 2. Heavy Ring Gear Teeth Section
  const ringGeom = new THREE.CylinderGeometry(0.88, 0.88, 0.35, 32);
  const ringMat = new THREE.MeshStandardMaterial({
    color: INDUSTRIAL_PALETTE.machinedSteel,
    metalness: 0.9,
    roughness: 0.25,
  });
  const ring = new THREE.Mesh(ringGeom, ringMat);
  ring.position.y = -0.55;
  ring.add(createCadEdges(ringGeom, INDUSTRIAL_PALETTE.cadLine, 0.8));
  group.add(ring);

  // 3. Orbital Hydraulic Motor Head
  const headGeom = new THREE.CylinderGeometry(0.42, 0.42, 0.7, 20);
  const headMat = new THREE.MeshStandardMaterial({
    color: INDUSTRIAL_PALETTE.machinedSteel,
    metalness: 0.85,
    roughness: 0.3,
  });
  const head = new THREE.Mesh(headGeom, headMat);
  head.position.y = 0.75;
  head.add(createCadEdges(headGeom, INDUSTRIAL_PALETTE.cadLine, 0.6));
  group.add(head);

  // Integrated parking brake release cylinder
  const brakeGeom = new THREE.BoxGeometry(0.3, 0.3, 0.3);
  const brakeMat = new THREE.MeshStandardMaterial({
    color: INDUSTRIAL_PALETTE.safetyAmber,
    metalness: 0.7,
    roughness: 0.35,
  });
  const brake = new THREE.Mesh(brakeGeom, brakeMat);
  brake.position.set(0.35, 0.75, 0);
  group.add(brake);

  // Assembly metadata
  group.userData = {
    id: 'SLEW_MOTOR',
    name: 'Upperstructure Slew Motor Drive',
    partNumber: 'KOMATSU-708-2L',
    category: 'ROTATION & SWING MOTION',
    spec: '11.8 RPM · Integrated Spring-Applied Hydraulic-Release Brake',
    burstPressure: '4,800 PSI',
    torqueSpec: 'Swing Bearing Mounting Bolts: 540 Nm (398 ft-lb)',
    lotoStep: 'Engage mechanical swing lock pin into chassis table.',
    defaultPos: new THREE.Vector3(-0.4, -1.2, 0.0),
    explodedPos: new THREE.Vector3(-0.8, -2.6, 0.0),
    explodedRot: new THREE.Euler(0.2, 0, 0),
    annotationAnchor: new THREE.Vector3(-0.8, -1.6, 0.0),
    accentColor: INDUSTRIAL_PALETTE.oxidisedTeal,
  };

  return group;
}

/**
 * Creates the Tier 4F Turbocharged Diesel Engine Subsystem
 */
function buildDieselEngineGroup() {
  const group = new THREE.Group();
  group.name = 'DIESEL_ENGINE';

  // 1. Heavy Cast Iron Engine Block
  const blockGeom = new THREE.BoxGeometry(1.4, 1.2, 1.8);
  const blockMat = new THREE.MeshStandardMaterial({
    color: INDUSTRIAL_PALETTE.castIron,
    metalness: 0.8,
    roughness: 0.45,
  });
  const block = new THREE.Mesh(blockGeom, blockMat);
  block.castShadow = true;
  block.receiveShadow = true;
  block.add(createCadEdges(blockGeom, INDUSTRIAL_PALETTE.cadLine, 0.6));
  group.add(block);

  // 2. Ribbed Valve Head Covers
  const headGeom = new THREE.BoxGeometry(1.2, 0.25, 1.6);
  const headMat = new THREE.MeshStandardMaterial({
    color: INDUSTRIAL_PALETTE.machinedSteel,
    metalness: 0.85,
    roughness: 0.3,
  });
  const head = new THREE.Mesh(headGeom, headMat);
  head.position.y = 0.7;
  head.add(createCadEdges(headGeom, INDUSTRIAL_PALETTE.cadLine, 0.6));
  group.add(head);

  // 3. Turbocharger Assembly (Turbine and compressor volutes)
  const turboGroup = new THREE.Group();
  turboGroup.position.set(0.8, 0.4, -0.3);

  const voluteGeom = new THREE.TorusGeometry(0.22, 0.09, 16, 24);
  const voluteMat = new THREE.MeshStandardMaterial({
    color: INDUSTRIAL_PALETTE.machinedSteel,
    metalness: 0.9,
    roughness: 0.2,
  });
  const volute = new THREE.Mesh(voluteGeom, voluteMat);
  turboGroup.add(volute);

  // Turbo boost pipe
  const pipeCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.2, 0.3, 0.2),
    new THREE.Vector3(0.1, 0.6, 0.4),
    new THREE.Vector3(-0.4, 0.65, 0.4),
  ]);
  const pipeGeom = new THREE.TubeGeometry(pipeCurve, 24, 0.07, 12, false);
  const pipeMat = new THREE.MeshStandardMaterial({
    color: INDUSTRIAL_PALETTE.safetyOrange,
    metalness: 0.5,
    roughness: 0.4,
  });
  const pipe = new THREE.Mesh(pipeGeom, pipeMat);
  turboGroup.add(pipe);
  group.add(turboGroup);

  // 4. Heavy Multi-Rib Serpentine Pulley
  const pulleyGeom = new THREE.CylinderGeometry(0.3, 0.3, 0.12, 24);
  pulleyGeom.rotateX(Math.PI / 2);
  const pulleyMat = new THREE.MeshStandardMaterial({
    color: INDUSTRIAL_PALETTE.machinedSteel,
    metalness: 0.95,
    roughness: 0.15,
  });
  const pulley = new THREE.Mesh(pulleyGeom, pulleyMat);
  pulley.position.set(0, -0.2, 0.96);
  group.add(pulley);

  // Assembly metadata
  group.userData = {
    id: 'DIESEL_ENGINE',
    name: 'Tier 4F Turbocharged Diesel Prime Mover',
    partNumber: 'CAT-C7.1-ACERT',
    category: 'COMBUSTION PRIME MOVER',
    spec: '6.7L Displacement · 174 kW (233 HP) @ 2,000 RPM',
    burstPressure: '2,200 Bar (Common Rail Fuel)',
    torqueSpec: 'Cylinder Head Studs: 210 Nm + 90° Turn',
    lotoStep: 'Turn off battery master disconnect switch and attach OSHA padlock.',
    defaultPos: new THREE.Vector3(-0.8, 0.2, -1.6),
    explodedPos: new THREE.Vector3(-2.2, 0.4, -3.2),
    explodedRot: new THREE.Euler(0, -0.25, 0),
    annotationAnchor: new THREE.Vector3(-2.2, 1.4, -3.2),
    accentColor: INDUSTRIAL_PALETTE.safetyOrange,
  };

  return group;
}

/**
 * Creates the Boxed Chassis Boom Base & Crawler Track Frame Subsystem
 */
function buildChassisBaseGroup() {
  const group = new THREE.Group();
  group.name = 'CHASSIS_BASE';

  // 1. Boxed Boom Foot Weldment Structural Steel Bracket
  const bracketGeom = new THREE.BoxGeometry(1.8, 0.8, 1.4);
  const bracketMat = new THREE.MeshStandardMaterial({
    color: INDUSTRIAL_PALETTE.castIron,
    metalness: 0.85,
    roughness: 0.4,
  });
  const bracket = new THREE.Mesh(bracketGeom, bracketMat);
  bracket.position.y = -0.4;
  bracket.castShadow = true;
  bracket.receiveShadow = true;
  bracket.add(createCadEdges(bracketGeom, INDUSTRIAL_PALETTE.cadLine, 0.6));
  group.add(bracket);

  // 2. High-Strength Forged Pivot Pin with Grease Fitting
  const pinGeom = new THREE.CylinderGeometry(0.18, 0.18, 2.0, 24);
  pinGeom.rotateX(Math.PI / 2);
  const pinMat = new THREE.MeshStandardMaterial({
    color: INDUSTRIAL_PALETTE.chromeMirror,
    metalness: 0.95,
    roughness: 0.1,
  });
  const pin = new THREE.Mesh(pinGeom, pinMat);
  pin.position.set(0.4, -0.2, 0);
  pin.add(createCadEdges(pinGeom, INDUSTRIAL_PALETTE.chromeMirror, 0.6));
  group.add(pin);

  // 3. Dual Undercarriage Track Beams (Lower crawler frames)
  for (let side of [-1.3, 1.3]) {
    const trackGeom = new THREE.BoxGeometry(0.4, 0.5, 3.4);
    const trackMat = new THREE.MeshStandardMaterial({
      color: 0x181c1f,
      metalness: 0.9,
      roughness: 0.5,
    });
    const track = new THREE.Mesh(trackGeom, trackMat);
    track.position.set(side, -1.8, 0);
    track.add(createCadEdges(trackGeom, INDUSTRIAL_PALETTE.cadLine, 0.5));
    group.add(track);

    // Track Sprocket & Idler Wheels
    for (let z of [-1.5, 1.5]) {
      const wheelGeom = new THREE.CylinderGeometry(0.32, 0.32, 0.42, 20);
      wheelGeom.rotateZ(Math.PI / 2);
      const wheelMat = new THREE.MeshStandardMaterial({
        color: INDUSTRIAL_PALETTE.castIron,
        metalness: 0.8,
        roughness: 0.35,
      });
      const wheel = new THREE.Mesh(wheelGeom, wheelMat);
      wheel.position.set(side, -1.8, z);
      wheel.add(createCadEdges(wheelGeom, INDUSTRIAL_PALETTE.cadLine, 0.6));
      group.add(wheel);
    }
  }

  // 4. Ground Perspective CAD Grid Plane
  const gridHelper = new THREE.GridHelper(12, 24, 0x1f6f68, 0x14282c);
  gridHelper.position.y = -2.1;
  group.add(gridHelper);

  // Assembly metadata
  group.userData = {
    id: 'CHASSIS_BASE',
    name: 'Chassis Undercarriage & Boom Foot',
    partNumber: 'RR-STR-BASE-01',
    category: 'STRUCTURAL GROUND BASE',
    spec: 'High-Tensile Weldox Steel · Reinforced Gusset Bracing',
    burstPressure: 'Structural Load: 450 kN',
    torqueSpec: 'Boom Pivot Pin Keeper Bolt: 280 Nm',
    lotoStep: 'Chock tracks and lower straight blade before undercarriage inspection.',
    defaultPos: new THREE.Vector3(0, 0, 0),
    explodedPos: new THREE.Vector3(0, -0.6, -0.4),
    explodedRot: new THREE.Euler(0, 0, 0),
    annotationAnchor: new THREE.Vector3(0, -0.8, 0),
    accentColor: INDUSTRIAL_PALETTE.cadLine,
  };

  return group;
}

/**
 * Constructs the Complete Master Digital Twin Assembly
 */
export function createDigitalTwinAssembly() {
  const masterGroup = new THREE.Group();
  masterGroup.name = 'DIGITAL_TWIN_EXCAVATOR_EX204';

  const boomCylinder = buildBoomCylinderGroup();
  const pump = buildSwashplatePumpGroup();
  const manifold = buildValveManifoldGroup();
  const slew = buildSlewMotorGroup();
  const engine = buildDieselEngineGroup();
  const chassis = buildChassisBaseGroup();

  masterGroup.add(boomCylinder);
  masterGroup.add(pump);
  masterGroup.add(manifold);
  masterGroup.add(slew);
  masterGroup.add(engine);
  masterGroup.add(chassis);

  // Set initial assembled positions
  const subsystems = [boomCylinder, pump, manifold, slew, engine, chassis];
  for (let sub of subsystems) {
    sub.position.copy(sub.userData.defaultPos);
  }

  return {
    masterGroup,
    subsystems,
  };
}

/**
 * Updates the Digital Twin Assembly state based on scroll exploded percentage,
 * active fault, hover state, and rendering mode.
 */
export function updateExplodedAssembly({
  subsystems,
  explodedAmount = 0.0, // 0.0 = fully assembled, 1.0 = fully exploded
  renderMode = 'pbr',   // 'pbr' | 'cad' | 'xray'
  activeFaultId = 'BOOM_CYLINDER',
  isResolved = false,
  hoveredSubsystemId = null,
  selectedSubsystemId = null,
  elapsedTime = 0,
}) {
  if (!subsystems || !subsystems.length) return;

  // Clamp explodedAmount between 0 and 1
  const t = Math.max(0, Math.min(1, explodedAmount));

  // Pulse oscillation for fault highlighting (smooth 1.5 Hz sine wave)
  const pulse = (Math.sin(elapsedTime * 4.5) + 1.0) / 2.0;

  for (let sub of subsystems) {
    const { id, defaultPos, explodedPos, explodedRot } = sub.userData;

    // 1. Position & Rotation Interpolation
    sub.position.lerpVectors(defaultPos, explodedPos, t);
    if (explodedRot) {
      sub.rotation.x = THREE.MathUtils.lerp(0, explodedRot.x, t);
      sub.rotation.y = THREE.MathUtils.lerp(0, explodedRot.y, t);
      sub.rotation.z = THREE.MathUtils.lerp(0, explodedRot.z, t);
    }

    // 2. Animate internal mechanical components
    if (id === 'SWASHPLATE_PUMP') {
      const rotaryPistons = sub.getObjectByName('ROTARY_PISTONS');
      if (rotaryPistons) {
        // Slow realistic drive rotation
        rotaryPistons.rotation.x = elapsedTime * 1.2;
      }
    }

    // 3. Fault & Selection Highlight Management
    const isFaulted = id === activeFaultId && !isResolved;
    const isSelected = id === selectedSubsystemId;
    const isHovered = id === hoveredSubsystemId;

    // Update fault halo ring on boom cylinder
    if (id === 'BOOM_CYLINDER') {
      const faultHalo = sub.getObjectByName('FAULT_HALO');
      if (faultHalo) {
        if (isFaulted) {
          faultHalo.material.opacity = 0.4 + pulse * 0.6;
          faultHalo.scale.setScalar(1.0 + pulse * 0.25);
          faultHalo.material.color.setHex(INDUSTRIAL_PALETTE.emergencyVermilion);
        } else if (isResolved) {
          faultHalo.material.opacity = 0.4;
          faultHalo.scale.setScalar(1.0);
          faultHalo.material.color.setHex(INDUSTRIAL_PALETTE.oxidisedTeal);
        } else {
          faultHalo.material.opacity = 0.0;
        }
      }
    }

    // Check if an isolated subsystem is selected
    const hasActiveIsolation = Boolean(selectedSubsystemId && selectedSubsystemId !== 'ALL');
    const isMatchingSubsystem = isSelected || isHovered;

    // 4. Update Materials across Child Meshes according to Render Mode & State
    sub.traverse((child) => {
      // 4A. Meshes
      if (child.isMesh) {
        // Cache original material colors if not yet cached
        if (!child.userData.originalColor) {
          child.userData.originalColor = child.material.color ? child.material.color.clone() : new THREE.Color(0xffffff);
          child.userData.originalMetalness = child.material.metalness ?? 0.8;
          child.userData.originalRoughness = child.material.roughness ?? 0.3;
        }

        if (renderMode === 'cad') {
          // CAD Blueprint Mode: Semi-transparent holographic teal with stark edges
          child.material.transparent = true;
          if (hasActiveIsolation) {
            child.material.opacity = isMatchingSubsystem ? 0.95 : 0.18;
          } else {
            child.material.opacity = isMatchingSubsystem ? 0.85 : 0.45;
          }
          child.material.roughness = 0.6;
          child.material.metalness = 0.3;
          if (isFaulted) {
            child.material.color.setHex(INDUSTRIAL_PALETTE.emergencyVermilion);
          } else if (isMatchingSubsystem) {
            child.material.color.setHex(INDUSTRIAL_PALETTE.cadCyan);
          } else {
            child.material.color.setHex(0x13383e);
          }
        } else if (renderMode === 'xray') {
          // X-Ray Mode: High-contrast wireframe holographic substrate
          child.material.transparent = true;
          if (hasActiveIsolation) {
            child.material.opacity = isMatchingSubsystem ? 0.9 : 0.12;
          } else {
            child.material.opacity = 0.35;
          }
          child.material.wireframe = true;
          child.material.color.setHex(isFaulted ? INDUSTRIAL_PALETTE.emergencyVermilion : isMatchingSubsystem ? INDUSTRIAL_PALETTE.cadCyan : INDUSTRIAL_PALETTE.cadLine);
        } else {
          // Solid PBR Industrial Mode
          child.material.wireframe = false;
          child.material.metalness = child.userData.originalMetalness;
          child.material.roughness = child.userData.originalRoughness;

          if (hasActiveIsolation) {
            if (isMatchingSubsystem) {
              // Focused Area: Full opacity, crisp colors, attention spotlight
              child.material.transparent = false;
              child.material.opacity = 1.0;
              if (isFaulted) {
                child.material.color.lerpColors(
                  child.userData.originalColor,
                  new THREE.Color(INDUSTRIAL_PALETTE.emergencyVermilion),
                  0.45 + pulse * 0.35
                );
              } else {
                child.material.color.copy(child.userData.originalColor).offsetHSL(0, 0, 0.15);
              }
            } else {
              // Non-matching areas: Gracefully dimmed & ghosted so only the selected area matches
              child.material.transparent = true;
              child.material.opacity = 0.28;
              child.material.color.copy(child.userData.originalColor).multiplyScalar(0.45);
            }
          } else {
            // Full Assembly View (ALL): All components 100% visible and vivid
            child.material.transparent = false;
            child.material.opacity = 1.0;

            if (isFaulted) {
              child.material.color.lerpColors(
                child.userData.originalColor,
                new THREE.Color(INDUSTRIAL_PALETTE.emergencyVermilion),
                0.45 + pulse * 0.35
              );
            } else if (isResolved && id === activeFaultId) {
              child.material.color.lerpColors(
                child.userData.originalColor,
                new THREE.Color(INDUSTRIAL_PALETTE.oxidisedTeal),
                0.5
              );
            } else {
              child.material.color.copy(child.userData.originalColor);
            }
          }
        }
      }

      // 4B. CAD Edge Line Segments
      if (child.isLineSegments && child.material) {
        if (hasActiveIsolation) {
          if (isMatchingSubsystem) {
            child.material.opacity = 0.95;
            child.material.color.setHex(isFaulted ? INDUSTRIAL_PALETTE.emergencyVermilion : INDUSTRIAL_PALETTE.safetyAmber);
          } else {
            child.material.opacity = 0.15;
            child.material.color.setHex(0x22363b);
          }
        } else {
          child.material.opacity = isFaulted ? 0.9 : 0.55;
          child.material.color.setHex(isFaulted ? INDUSTRIAL_PALETTE.emergencyVermilion : INDUSTRIAL_PALETTE.cadLine);
        }
      }
    });
  }
}

/**
 * Cleans up and disposes all Three.js resources in the assembly to prevent memory leaks
 */
export function disposeAssembly(group) {
  if (!group) return;
  group.traverse((child) => {
    if (child.isMesh || child.isLineSegments) {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    }
  });
}

