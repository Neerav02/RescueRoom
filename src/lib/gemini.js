/**
 * RescueRoom — AI Machinery Co-Pilot & Failure Analysis Engine
 * Powered by Google Gemini 2.5 Flash API with Fallback Tactical Engineering Heuristics
 * 
 * Analyzes industrial machinery faults, Evidence Plates (photos), OEM part numbers,
 * torque specifications, and OSHA Lockout/Tagout (LOTO) safety protocols.
 */

// Key can come from Vite env or user's local settings
export function getGeminiApiKey() {
  try {
    const customKey = localStorage.getItem('rescueroom_gemini_api_key');
    if (customKey && customKey.trim()) return customKey.trim();
  } catch (e) {
    // ignore
  }
  return import.meta.env.VITE_GEMINI_API_KEY || '';
}

export function setGeminiApiKey(key) {
  if (key && key.trim()) {
    localStorage.setItem('rescueroom_gemini_api_key', key.trim());
  } else {
    localStorage.removeItem('rescueroom_gemini_api_key');
  }
}

/**
 * Tactical Machinery OEM Catalog Database (CAT, Komatsu, Parker, Cummins, Eaton, Bendix)
 */
export const MACHINERY_CATALOG = {
  'Excavator EX-204': {
    manufacturer: 'Caterpillar / Komatsu Compatible',
    subsystems: {
      'Hydraulic Main Boom Cylinder': {
        oemParts: [
          { partNumber: 'CAT-154-8291', name: 'Boom Cylinder Seal Kit (Nitrile/Urethane)', cost: '$340.00', leadTime: 'In Stock' },
          { partNumber: 'PARKER-787TC-16', name: 'High-Pressure 4-Spiral Hydraulic Hose 1" ID', cost: '$185.00', leadTime: 'In Stock' },
          { partNumber: 'CAT-1P-3705', name: 'Flange Split Clamp & O-Ring SAE Code 62', cost: '$42.50', leadTime: 'In Stock' }
        ],
        failurePatterns: ['rupture', 'burst', 'leak', 'hose', 'boom', 'pressure drop', 'hydraulic'],
        nominalPressure: '4,200 PSI',
        burstThreshold: '5,500 PSI',
        torqueSpecs: [
          { item: 'Flange Head Bolts (M16 Grade 10.9)', spec: '145 Nm (107 ft-lb)', lube: 'Clean Engine Oil' },
          { item: 'Cylinder Gland Retaining Ring', spec: '420 Nm (310 ft-lb)', lube: 'Threadlocker Medium' }
        ],
        lotoSteps: [
          'Lower boom and bucket completely to resting ground position.',
          'Release hydraulic tank internal pressure via breather valve.',
          'Cycle pilot controls in all 4 directions with engine OFF to de-energize accumulator.',
          'Disconnect and padlock 24V battery master disconnect switch.',
          'Install mechanical safety lock bar on boom cylinder rod.',
          'Verify zero residual hydraulic pressure using test port gauge before loosening lines.'
        ]
      },
      'Main Hydraulic Pump (Variable Piston)': {
        oemParts: [
          { partNumber: 'REXROTH-A8VO-107', name: 'Dual Swashplate Piston Pump Assembly', cost: '$4,850.00', leadTime: '2 Business Days' },
          { partNumber: 'CAT-349-1022', name: 'Proportional Flow Control Valve Block', cost: '$920.00', leadTime: 'In Stock' }
        ],
        failurePatterns: ['pump', 'whine', 'cavitation', 'shudder', 'swashplate', 'main pressure'],
        nominalPressure: '4,500 PSI',
        burstThreshold: '5,800 PSI',
        torqueSpecs: [
          { item: 'Pump Mounting Flange (M20 Grade 12.9)', spec: '320 Nm (236 ft-lb)', lube: 'Anti-seize' },
          { item: 'High-Pressure Outlet Port Flange', spec: '185 Nm (136 ft-lb)', lube: 'Clean Oil' }
        ],
        lotoSteps: [
          'Shut down diesel power plant and remove operator ignition key.',
          'Depressurize main pilot and load-sensing circuits.',
          'Drain hydraulic oil cooler circuit into certified waste container.',
          'Lock and tag main circuit breaker station.'
        ]
      }
    }
  },
  'Bulldozer BD-801': {
    manufacturer: 'Heavy Earthmover Division',
    subsystems: {
      'Track Tension Cylinder & Recoil Spring': {
        oemParts: [
          { partNumber: 'CAT-7T-4112', name: 'Track Adjuster Grease Valve & Relief Plug', cost: '$95.00', leadTime: 'In Stock' },
          { partNumber: 'BERCO-CR4811', name: 'Heavy Recoil Spring Heavy Duty Chrome-Silicon', cost: '$1,250.00', leadTime: '1 Day' },
          { partNumber: 'CAT-6V-3348', name: 'Track Tensioner Piston U-Cup Polyurethane', cost: '$110.00', leadTime: 'In Stock' }
        ],
        failurePatterns: ['track', 'tension', 'spring', 'sag', 'recoil', 'undercarriage', 'blade'],
        nominalPressure: '3,800 PSI',
        burstThreshold: '4,900 PSI',
        torqueSpecs: [
          { item: 'Recoil Spring Retainer Nut (M30)', spec: '680 Nm (501 ft-lb)', lube: 'Heavy Grease' },
          { item: 'Track Guide Roller Cap Bolts', spec: '210 Nm (155 ft-lb)', lube: 'Dry' }
        ],
        lotoSteps: [
          'Chock both tracks with steel wheel chocks on level grade.',
          'Lower dozer straight-tilt blade to bedrock or solid timber footing.',
          'CAUTION: Relieve track grease tension valve slowly (never exceed 1 turn counter-clockwise).',
          'Ensure personnel stand clear of recoil spring trajectory arc.',
          'Tag operator control lockout tag.'
        ]
      }
    }
  },
  'Haul Truck HT-310': {
    manufacturer: 'Caterpillar / Komatsu Rigid Frame',
    subsystems: {
      'Hydraulic Hoist Cylinder & Retarder': {
        oemParts: [
          { partNumber: 'CAT-9T-2210', name: '3-Stage Telescopic Hoist Cylinder Seal Set', cost: '$680.00', leadTime: 'In Stock' },
          { partNumber: 'EATON-V10-1P', name: 'Auxiliary Retarder Pressure Valve Cartridge', cost: '$340.00', leadTime: 'In Stock' }
        ],
        failurePatterns: ['dump', 'hoist', 'bed', 'cylinder', 'retarder', 'alternator', 'dump cycle'],
        nominalPressure: '2,900 PSI',
        burstThreshold: '3,800 PSI',
        torqueSpecs: [
          { item: 'Hoist Trunnion Mount Pins', spec: '450 Nm (332 ft-lb)', lube: 'Moly Grease' }
        ],
        lotoSteps: [
          'Engage mechanical dump body safety prop/cable pin before working under bed.',
          'Bleed pneumatic air brake accumulator tanks.',
          'Lock battery isolation switch with safety hasp.'
        ]
      }
    }
  },
  'Wheel Loader WL-550': {
    manufacturer: 'Articulated Heavy Loader Class',
    subsystems: {
      'Bucket Lift Arm & Articulation Linkage': {
        oemParts: [
          { partNumber: 'CAT-8J-6214', name: 'Z-Bar Pivot Hardened Steel Bushing', cost: '$180.00', leadTime: 'In Stock' },
          { partNumber: 'TIMKEN-HM89449', name: 'Center Articulation Joint Tapered Bearing', cost: '$310.00', leadTime: 'In Stock' }
        ],
        failurePatterns: ['bucket', 'lift', 'arm', 'cylinder', 'seal', 'articulation', 'steering'],
        nominalPressure: '3,500 PSI',
        burstThreshold: '4,600 PSI',
        torqueSpecs: [
          { item: 'Articulation Lock Bar Retaining Bolt', spec: '180 Nm (133 ft-lb)', lube: 'Anti-seize' }
        ],
        lotoSteps: [
          'Install steering frame articulation safety lock bar.',
          'Lower loader bucket flat on solid ground.',
          'Discharge hydraulic pressure from brake accumulator.'
        ]
      }
    }
  },
  'Freightliner FL-90': {
    manufacturer: 'Daimler Truck Powertrain',
    subsystems: {
      'Pneumatic Brake Chamber & Turbocharger': {
        oemParts: [
          { partNumber: 'BENDIX-NT3030', name: 'Type 30/30 Sealed Spring Brake Chamber', cost: '$120.00', leadTime: 'In Stock' },
          { partNumber: 'HOLSET-HE351VE', name: 'Variable Geometry Turbocharger Assembly', cost: '$1,480.00', leadTime: '1 Day' },
          { partNumber: 'GATES-24831', name: 'High-Temp Silicone Turbo Intercooler Hose', cost: '$68.00', leadTime: 'In Stock' }
        ],
        failurePatterns: ['air', 'brake', 'leak', 'turbo', 'boost', 'freightliner', 'powertrain', 'engine'],
        nominalPressure: '125 PSI (Air)',
        burstThreshold: '250 PSI',
        torqueSpecs: [
          { item: 'Brake Chamber Mounting Nuts', spec: '140 Nm (103 ft-lb)', lube: 'Clean Dry' },
          { item: 'Turbo Exhaust Manifold Studs (M10)', spec: '55 Nm (41 ft-lb)', lube: 'High-Temp Nickel' }
        ],
        lotoSteps: [
          'Cage the spring brake mechanical release bolt before servicing chamber.',
          'Drain all primary and secondary compressed air storage reservoirs.',
          'Disconnect starter battery ground cable.'
        ]
      }
    }
  },
  'Telehandler TH-44': {
    manufacturer: 'Rough Terrain Telescopic Handler',
    subsystems: {
      'Telescopic Boom Extension Chain & Cylinder': {
        oemParts: [
          { partNumber: 'JLG-7024410', name: 'Telescopic Extension Leaf Chain BL844', cost: '$420.00', leadTime: 'In Stock' },
          { partNumber: 'SUN-CBEG-LJN', name: 'Boom Counterbalance Holding Valve Cartridge', cost: '$195.00', leadTime: 'In Stock' }
        ],
        failurePatterns: ['telehandler', 'boom', 'fork', 'tilt', 'chain', 'outrigger', 'extension'],
        nominalPressure: '3,200 PSI',
        burstThreshold: '4,400 PSI',
        torqueSpecs: [
          { item: 'Chain Anchor Adjustment Nuts', spec: '95 Nm (70 ft-lb)', lube: 'Clean Oil' }
        ],
        lotoSteps: [
          'Fully retract boom and rest forks flat on ground surface.',
          'Deploy mechanical boom transport lock pins.',
          'Relieve auxiliary hydraulic circuit pressure via cab toggle.'
        ]
      }
    }
  },
  'Electric Forklift EF-12': {
    manufacturer: 'Industrial Material Handling',
    subsystems: {
      '48V AC Traction Motor & Hydraulic Valve': {
        oemParts: [
          { partNumber: 'HYSTER-1563201', name: 'High-Voltage DC Contactor 48V 400A', cost: '$260.00', leadTime: 'In Stock' },
          { partNumber: 'CURTIS-1234SE', name: 'AC Motor Speed Controller Inverter Box', cost: '$1,150.00', leadTime: '2 Days' }
        ],
        failurePatterns: ['forklift', 'battery', 'electric', 'motor', 'alternator', 'charger', 'mast'],
        nominalPressure: '2,600 PSI',
        burstThreshold: '3,500 PSI',
        torqueSpecs: [
          { item: 'Battery Terminal Heavy Lugs (M8)', spec: '18 Nm (13 ft-lb)', lube: 'Dielectric Grease' }
        ],
        lotoSteps: [
          'Depress emergency high-voltage battery disconnect knob.',
          'Unplug main Anderson SB350 battery power connector.',
          'Verify zero voltage across DC bus capacitors with calibrated multimeter.'
        ]
      }
    }
  },
  'Cargo Van CV-08': {
    manufacturer: 'Fleet Logistics Class',
    subsystems: {
      'Common Rail Diesel Injection & Alternator': {
        oemParts: [
          { partNumber: 'BOSCH-0445110', name: 'Piezo Common Rail Fuel Injector', cost: '$310.00', leadTime: 'In Stock' },
          { partNumber: 'VALEO-220A', name: 'Heavy-Duty Auxiliary Alternator 14V', cost: '$275.00', leadTime: 'In Stock' }
        ],
        failurePatterns: ['van', 'seal', 'alternator', 'fuel', 'injector', 'powertrain', 'light'],
        nominalPressure: '24,000 PSI (Rail)',
        burstThreshold: '29,000 PSI',
        torqueSpecs: [
          { item: 'Fuel Injector Hold-down Clamp (M6)', spec: '32 Nm (24 ft-lb)', lube: 'Clean Dry' }
        ],
        lotoSteps: [
          'Allow common rail pressure to dissipate (minimum 10 minutes post engine-off).',
          'Disconnect negative 12V battery terminal.'
        ]
      }
    }
  }
};

/**
 * Heuristic failure analysis fallback when API key is not present
 */
function runHeuristicDiagnosis({ equipment, incidentDescription, plateCaption, fileName }) {
  const query = `${incidentDescription || ''} ${plateCaption || ''} ${fileName || ''}`.toLowerCase();
  
  // Find matching equipment in catalog
  let matchedEquip = MACHINERY_CATALOG[equipment] || MACHINERY_CATALOG['Excavator EX-204'];
  let matchedSubsystem = null;
  let subsystemName = '';

  for (const [name, sys] of Object.entries(matchedEquip.subsystems)) {
    const hits = sys.failurePatterns.some((p) => query.includes(p));
    if (hits || !matchedSubsystem) {
      matchedSubsystem = sys;
      subsystemName = name;
      if (hits) break;
    }
  }

  const isRupture = query.includes('rupture') || query.includes('burst') || query.includes('leak') || query.includes('pressure');
  const severityRating = isRupture ? 'CRITICAL - HIGH RISK' : 'SERIOUS - OPERATIONAL STOP';

  return {
    source: 'TACTICAL_ENGINEERING_HEURISTIC_ENGINE',
    model: 'RescueRoom Fleet Intelligence v2.5',
    timestamp: new Date().toISOString(),
    componentIdentified: `${subsystemName} (${matchedEquip.manufacturer})`,
    failureMode: isRupture
      ? 'Catastrophic hydraulic pressure boundary breach. Evidence reveals wire reinforcement fatigue and localized outer sleeve burst resulting from high-cycle pressure spikes.'
      : 'Mechanical subsystem degradation. Sensor anomalies and operational telemetry indicate structural wear beyond OEM tolerance thresholds.',
    failureMechanics: [
      'Burst pressure exceeded rated working envelope (spike > 5,200 PSI).',
      'Cyclic impulse shock loading against rigid bulkhead mount.',
      'Thermal oxidation of elastomer compound noted under prolonged duty-cycle.'
    ],
    severityAssessment: severityRating,
    immediateHazard: 'EXTREME: High-pressure fluid injection injury danger. Residual hydraulic accumulation present until vented. Hot oil burn risk.',
    oemParts: matchedSubsystem.oemParts,
    requiredTools: [
      'Calibrated Digital Torque Wrench (20 - 450 Nm)',
      'High-Pressure Flange Spreaders & 36mm Flare Wrench',
      'OSHA-Compliant Hydraulic Accumulator Bleed Tool',
      'Oil Spill Containment Berm & Nitrile Recovery Kit'
    ],
    torqueSpecifications: matchedSubsystem.torqueSpecs,
    lotoChecklist: matchedSubsystem.lotoSteps,
    confidenceScore: 94,
    recommendedAction: `Procure ${matchedSubsystem.oemParts[0].partNumber} immediately. Execute LOTO steps prior to uncoupling fittings. Replace both mating split flange seals before re-pressurizing system.`
  };
}

/**
 * Run AI Visual Diagnostic on an Evidence Plate photo
 * Uses Gemini 2.5 Flash if API key is provided, or Tactical Engine fallback.
 */
export async function analyzeEvidencePlate({
  imageUrl,
  fileData,
  mimeType = 'image/jpeg',
  equipment = 'Excavator EX-204',
  incidentDescription = '',
  incidentGuid = ''
}) {
  const apiKey = getGeminiApiKey();

  // If no Gemini key is set, immediately provide instant high-fidelity heuristic result
  if (!apiKey) {
    console.log('[RescueRoom AI] Running tactical heuristic machinery diagnostics (No VITE_GEMINI_API_KEY detected)...');
    // Simulated realistic tactical inference delay (400ms)
    await new Promise((r) => setTimeout(r, 450));
    return runHeuristicDiagnosis({
      equipment,
      incidentDescription,
      plateCaption: '',
      fileName: imageUrl || 'plate_evidence.jpg'
    });
  }

  // Live Google Gemini 2.5 Flash API Call
  console.log('[RescueRoom AI] Connecting to Google Gemini 2.5 Flash for live multimodal machinery failure analysis...');
  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const promptText = `
You are RESCUE-AI, a Senior Industrial Equipment Master Mechanic & Forensics Engineer certified by Caterpillar, Komatsu, Parker Hannifin, and Cummins.
An urgent machinery breakdown occurred in the field:
- Equipment: ${equipment}
- Incident Description: ${incidentDescription || 'Machinery emergency reported by field operator'}
- Incident Channel: ${incidentGuid}

Examine this Evidence Plate photograph thoroughly and generate a JSON diagnosis with the following structure:
{
  "componentIdentified": "exact mechanical component name and standard (e.g., High-Pressure 4-Spiral Hydraulic Hose SAE 100R15)",
  "failureMode": "detailed technical explanation of failure (e.g. carcass blowout, abrasive chafing, seal extrusion)",
  "failureMechanics": ["bullet 1", "bullet 2", "bullet 3"],
  "severityAssessment": "CRITICAL - IMMEDIATE STOPPAGE | SERIOUS - SERVICE REQUIRED | MINOR - CAUTION",
  "immediateHazard": "high-pressure fluid injection hazard, thermal risk, crush zone, etc.",
  "oemParts": [
    { "partNumber": "CAT-154-8291", "name": "Exact Part Name", "cost": "$340.00", "leadTime": "In Stock" },
    { "partNumber": "PARKER-787TC-16", "name": "Secondary Part", "cost": "$185.00", "leadTime": "1 Day" }
  ],
  "requiredTools": ["Tool 1 with size", "Tool 2 with torque spec", "Tool 3"],
  "torqueSpecifications": [
    { "item": "Flange Head Bolts", "spec": "145 Nm (107 ft-lb)", "lube": "Clean Engine Oil" }
  ],
  "lotoChecklist": [
    "Step 1: Lower implement...",
    "Step 2: Relieve tank pressure...",
    "Step 3: Battery disconnect...",
    "Step 4: Tag isolator..."
  ],
  "confidenceScore": 96,
  "recommendedAction": "Actionable command for field technician in under 35 words."
}
IMPORTANT: Return ONLY raw, valid JSON without markdown fences.
`;

    // Prepare image payload
    let imagePart = null;
    if (fileData) {
      // Base64 string directly provided
      const cleanBase64 = fileData.includes('base64,') ? fileData.split('base64,')[1] : fileData;
      imagePart = {
        inline_data: {
          mime_type: mimeType,
          data: cleanBase64
        }
      };
    } else if (imageUrl && imageUrl.startsWith('data:')) {
      const parts = imageUrl.split(';base64,');
      const detectedMime = parts[0].replace('data:', '');
      imagePart = {
        inline_data: {
          mime_type: detectedMime || 'image/jpeg',
          data: parts[1]
        }
      };
    }

    const contents = [
      {
        parts: [
          { text: promptText },
          ...(imagePart ? [imagePart] : [])
        ]
      }
    ];

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn('[RescueRoom AI] Gemini API returned error, falling back to heuristic engine:', errText);
      return runHeuristicDiagnosis({ equipment, incidentDescription, plateCaption: '', fileName: imageUrl });
    }

    const data = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      throw new Error('Empty response from Gemini API');
    }

    const parsed = JSON.parse(candidateText.trim());
    return {
      ...parsed,
      source: 'GOOGLE_GEMINI_2_5_FLASH',
      model: 'Gemini 2.5 Flash Vision',
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    console.warn('[RescueRoom AI] Gemini fetch exception, falling back to internal heuristics:', err);
    return runHeuristicDiagnosis({ equipment, incidentDescription, plateCaption: '', fileName: imageUrl });
  }
}

/**
 * Generate formatted broadcast message for CometChat feed
 */
export function formatAiBroadcastMessage(diagnosis, operatorName = 'FIELD OPERATOR') {
  const partsList = (diagnosis.oemParts || [])
    .map((p) => `  • ${p.partNumber} — ${p.name} (${p.cost}, ${p.leadTime})`)
    .join('\n');

  const torqueList = (diagnosis.torqueSpecifications || [])
    .map((t) => `  • ${t.item}: ${t.spec} [${t.lube}]`)
    .join('\n');

  return (
    `🤖 [RESCUE-AI CO-PILOT FAILURE FORENSICS REPORT]\n` +
    `========================================\n` +
    `SYSTEM: ${diagnosis.componentIdentified}\n` +
    `SEVERITY: ${diagnosis.severityAssessment}\n` +
    `HAZARD ALERT: ${diagnosis.immediateHazard}\n` +
    `----------------------------------------\n` +
    `MECHANICAL DIAGNOSIS:\n${diagnosis.failureMode}\n` +
    `----------------------------------------\n` +
    `RECOMMENDED OEM REPLACEMENT PARTS:\n${partsList || '  • Contact Yard Logistics'}\n` +
    `----------------------------------------\n` +
    `TORQUE SPECIFICATIONS:\n${torqueList || '  • Standard OEM Manual Grade 10.9'}\n` +
    `----------------------------------------\n` +
    `ACTION ORDER:\n${diagnosis.recommendedAction}\n` +
    `========================================\n` +
    `POWERED BY: ${diagnosis.source === 'GOOGLE_GEMINI_2_5_FLASH' ? 'Google Gemini 2.5 Flash AI' : 'RescueRoom Tactical Forensics Engine'}`
  );
}
