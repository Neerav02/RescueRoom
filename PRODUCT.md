# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Heavy Equipment Field Operators (e.g., Asha Patil, Dev Malhotra)**: On-site heavy equipment operators in remote or active construction, mining, and haulage environments facing sudden mechanical failures. Need an immediate, zero-friction emergency dispatch button to trigger incident triage without navigating complex menus.
- **Traveling Field Service Mechanics & Technicians (e.g., Ravi Kumar, Sana Sheikh)**: Dispatched or mobile technicians reviewing incoming breakdown tickets, assessing live CAN-bus telemetry, analyzing photo evidence plates with AI diagnostics, and coordinating via tactical radio and video calls directly from the field console.
- **Workshop Dispatchers & Maintenance Leads (e.g., Meera Sen, Imran Baig)**: Base coordinators monitoring the real-time Triage Board (`/board`), overseeing downtime clocks, assigning priorities, and generating official maintenance service reports (`FORM-RR-808`) for compliance and OEM audit records.

## Product Purpose

RescueRoom is a rugged, field-grade emergency dispatch and remote diagnostics console built for heavy equipment breakdowns in remote and mission-critical operations. Success means slashing heavy machinery downtime through instantaneous incident dispatch, a 3-tier kinetic escalation ladder (Chat -> Voice Radio -> Optical Video), real-time vector CAD blueprint telemetry localization, hybrid AI damage forensics, and automated service documentation.

## Positioning

Unlike generic messaging software or conventional SaaS fleet telematics:
1. **Kinetic Escalation Ladder**: Progresses smoothly across communication modalities within a single incident room—from a military-style monospace chat ticker to a 2-way tactical voice radio with a live audio oscilloscope visualizer, to an optical video stream with HUD crosshairs and automated call duration auditing.
2. **CAD Telemetry Radar Pinpointing**: Correlates simulated CAN-bus sensor dynamics (hydraulic PSI, oil temperature, engine RPM) with interactive SVG equipment schematics, pulsing a radar pinpoint directly on the failed subsystem.
3. **Field-Grade Resilience & Hybrid Diagnostics**: Combines multimodal Gemini 2.5 Flash damage scanning with an instant offline deterministic heuristics engine, ensuring mechanics are never stalled by remote connectivity drops.

## Operating Context

- **Physical Environment**: High-noise, high-vibration field sites (mines, quarries, construction sites, transit yards) where operators and mechanics wear gloves, work under direct sunlight or adverse conditions, and deal with critical machinery downtime costing thousands of dollars per hour.
- **Workflows & Artifacts**:
  1. *Incident Dispatch*: One-click emergency trigger (`/operator`) generating a designated CometChat incident group room (`INC-XXXX`).
  2. *Live Triage*: Kanban-style Triage Board (`/board`) divided by severity (`CRITICAL`, `SERIOUS`, `MINOR`) with real-time second-by-second downtime clocks and unread message counters.
  3. *Diagnostic Room*: Live vector CAD schematic view (`/room/:guid`) with fault pinpoint radar ping, live telemetry gauges, damage photo inspection, and inline 3D Digital Twin CAD inspection toggle.
  4. *3D Digital Twin & Exploded Subsystem Inspector*: Immersive 6-stage scroll-driven mechanical disassembly and diagnostic narrative (`/twin`), featuring real-time CAN-bus telemetry synchronization, PBR/CAD/X-Ray rendering modes, 3D-to-2D screen space leader lines, and 360° free orbit inspection.
  5. *AI Co-Pilot*: Automated 3-part diagnostic breakdown (Forensics & OEM Parts matrix, LOTO safety isolation checklist, calibrated fastener torque specs).
  6. *Escalation Ladder*: Ticker chat -> Voice radio -> Optical video stream.
  7. *Compliance Sign-off*: Formal incident resolution stamped in oxidised teal ink, generating printable workshop maintenance sheet `FORM-RR-808` (`/report/:guid`).

## Capabilities and Constraints

- **Confirmed Capabilities**:
  - Headless CometChat JavaScript Chat SDK v4 for real-time messaging, group management, presence, and unread counts.
  - Headless CometChat JavaScript Calling SDK v5 for WebRTC peer/group tactical voice and optical video sessions.
  - Interactive Three.js 3D Digital Twin mechanical assembly for Excavator EX-204 (Boom Cylinder, Rexroth A8VO Swashplate Pump, Valve Manifold, Slew Motor, Diesel Prime Mover, Chassis Base) with 6-stage scroll-synchronized choreography.
  - Interactive SVG Vector CAD blueprints for Excavators, Bulldozers, Haul Trucks, Freightliners, etc.
  - Real-time simulated CAN-bus J1939 telemetry (hydraulic PSI with redline alerts, temperature, RPM).
  - Multimodal Gemini 2.5 Flash visual damage analysis with full offline deterministic heuristic engine fallback.
  - Auto-audited call duration logging scribed directly into the incident chat ledger.
  - Print-ready `@media print` layout for `FORM-RR-808` maintenance sheet.
- **Technical Constraints**:
  - Pure Vanilla CSS design tokens (`design-tokens.css`, `field-manual.css`); strictly zero Tailwind and zero third-party UI component libraries.
  - Three.js procedural modular mechanical assembly: zero runtime external network asset dependencies, sub-millisecond initialisation, guaranteed memory cleanup via explicit `.dispose()`, and automatic 2D CAD vector fallback on non-WebGL environments.
  - Multi-tenancy currently scoped at demo level (`northwind_*` vs `kestrel_*`) via client guards and GUID prefixes.
  - Simulated telemetry and illustrative OEM parts data for demonstration safety.

## Brand Commitments

- **Name**: RescueRoom
- **Aesthetic**: "Field Manual" (Heavy Machinery Workshop Manual x Rugged Dispatch Radio).
- **Palette**:
  - Bone Paper (`#EFE8D8`)
  - Deep Ink (`#1C1B18`)
  - Emergency Vermilion (`#E4421E`)
  - Safety Amber / Hazard Yellow (`#F2B705`)
  - Oxidised Teal (`#1F6F68`)
  - Tactical Dark Panel (`#14201F`)
- **Typography**:
  - Headings & Stencils: `Bricolage Grotesque`
  - Technical Data, Monospace Tickers, Timestamps & Serials: `IBM Plex Mono`
- **Construction Rules**:
  - 90° strictly square mechanical corners (`border-radius: 0px`).
  - Thick ink outlines (`2px` and `3px solid #1C1B18`).
  - Zero-blur hard mechanical drop shadows (`2px 2px`, `3px 3px`, `5px 5px 0px #1C1B18`).

## Evidence on Hand

- Full working React 19 application in `src/` (`LoginPage.jsx`, `OperatorPage.jsx`, `TriageBoardPage.jsx`, `RoomPage.jsx`, `ServiceReportPage.jsx`).
- CAD schematics and telemetry gauges in `src/components/TelemetryHUD.jsx`.
- AI co-pilot modal and offline rules heuristics in `src/components/AiCopilotModal.jsx` and `src/lib/gemini.js`.
- CometChat headless SDK integration in `src/lib/cometchat.js`.
- Comprehensive walkthrough, persona matrix, and architectural diagrams in `README.md`.
- Design token definitions in `src/styles/design-tokens.css` and `src/styles/field-manual.css`.

## Product Principles

1. **Tactile Clarity Over Decorative Noise**: Interfaces must feel like physical workshop instruments—high-contrast ink-on-bone, physical stamps, legible monospace readouts, and immediate tactile feedback.
2. **Escalate Without Context Switching**: Communication, telemetry, and diagnostics must live in the same unified dispatch room so technicians never lose sight of schematics while talking or typing.
3. **Mission-Critical Fault Tolerance**: Every automated or network-dependent feature (AI analysis, telemetry, cloud calls) must have a deterministic offline or local fallback; a field mechanic should never face a blocking spinner.
4. **Transparent Audit Trail**: Every status change, call duration, diagnostic broadcast, and technical dispatch note must be logged in a chronological immutable ledger for post-incident review.

## Accessibility & Inclusion

- High contrast default palette (Deep ink `#1C1B18` on Bone paper `#EFE8D8` meeting WCAG AAA contrast ratios for body copy).
- Monospace alphanumeric technical clarity for serial numbers, part codes, and timestamps.
- Redundant status cues (color vermilion/amber/teal paired with explicit textual tags and icons like `CRITICAL`, `SERIOUS`, `RESOLVED`).
- Clean print-optimized media stylesheets for paper printing and screen reader compatibility.

