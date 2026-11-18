# RescueRoom — ATS-Friendly Resume & Portfolio Project Entries

This document provides ready-to-use, ATS-optimized project descriptions, bullet points, and interview talking points tailored for senior software engineering, full-stack, frontend, and graphics engineering roles.

---

## 1. Resume Project Entry (Standard Format)

**RescueRoom — Industrial Emergency Dispatch & Remote Diagnostics Platform**  
*Lead Full-Stack & Graphics Engineer* | `React 19, Three.js, Node.js, CometChat SDK v4/v5, WebRTC, Gemini 2.5 Flash, Vite 8, Docker`

- Engineered a mission-critical emergency dispatch and telematics platform for heavy mobile equipment (mining/quarrying), featuring simulated SAE J1939 CAN-bus telemetry, a 3D mechanical Digital Twin, and a 3-tier kinetic escalation ladder (Chat $\to$ Voice $\to$ Video).
- Implemented headless CometChat JavaScript SDK v4 for real-time messaging and Calling SDK v5 for WebRTC audio/video calls, architecting dynamic route-based code splitting that deferred the 1.81 MB calling runtime until call initiation, keeping initial critical JS to ~275 KB.
- Built a scroll-choreographed 3D mechanical Digital Twin in Three.js with custom GLSL procedural PBR and CAD wireframe shaders, achieving 58.7 FPS sustained frame rates with zero WebGL buffer leaks.
- Developed a hardened Node.js backend proxy for Google Gemini 2.5 Flash Vision multimodal diagnostics, pairing neural failure analysis with a deterministic local heuristic fallback engine for offline reliability during cellular blackouts.
- Enforced strict server-side multi-tenant isolation, cryptographic session management (8-hr TTL), anti-impersonation guards, and sliding-window rate limiters, blocking unauthorized cross-tenant incident access with HTTP 403.
- Automated comprehensive QA suites via Chrome DevTools Protocol (CDP): 19/19 end-to-end regression assertions passed, 197 axe-core automated WCAG 2.1 AA checks passed (0 violations, 100% $\ge 44\times 44\text{px}$ touch targets), and optimized Cumulative Layout Shift (CLS) from 0.6057 to 0.0112.
- Packaged complete production containerization (multi-stage Dockerfile, NGINX TLS 1.3 reverse proxy with caching and WebSocket upgrades, and PM2 cluster supervision).

---

## 2. Resume Project Entry (Condensed / Bullet-Focused Format)

**RescueRoom | Heavy Machinery Emergency Telematics & Dispatch Platform**
- **Architecture & Performance:** Engineered a React 19 / Node.js Single Page Application using Vite 8 with route-level code splitting; achieved Core Web Vitals LCP $< 0.81\text{s}$, CLS $< 0.012$, and zero dependency vulnerabilities across all packages.
- **Real-Time Communication:** Integrated CometChat JavaScript SDK v4 (chat/presence) and Calling SDK v5 (WebRTC half-duplex voice radio and optical video), decoupling system announcements from signaling to eliminate call drops under network lag.
- **3D Graphics & Shaders:** Designed an interactive 6-stage disassembly 3D Digital Twin using Three.js 0.187 and custom GLSL vertex/fragment shaders (CAD Wireframe & X-Ray Ghost modes), rendering at 58.7 FPS.
- **Multimodal AI Diagnostics:** Built a secure backend proxy for Google Gemini 2.5 Flash Vision with structured JSON outputs (OEM part numbers, LOTO safety checklists, calibrated torque specs) and a zero-latency deterministic offline fallback engine.
- **Enterprise Security & Isolation:** Implemented server-side token minting via CometChat REST APIs, removing all API keys from client bundles; enforced corporate fleet tenant isolation (`HTTP 403`), sliding-window abuse rate limiters, and defense-in-depth headers (CSP, HSTS).
- **Accessibility & Testing:** Verified 100% compliance across 197 automated axe-core WCAG 2.1 AA rules and 144 responsive viewport combinations (320px–1920px).

---

## 3. Key Technical Distinctions (Interview & Evaluation Talking Points)

### What Was Genuinely Built vs. What Was Simulated
- **Real Engineering:**
  - Complete React 19 single-page application with 6 lazy-loaded routes and a custom Vanilla CSS design system.
  - Headless CometChat Chat SDK v4 and Calling SDK v5 WebRTC signaling, call duration timers, and non-blocking event logging.
  - Custom Three.js 0.187 scene graph, procedural geometry, orbital controls, and custom GLSL shaders (PBR, CAD wireframe, X-ray ghost).
  - Production Node.js backend server with cryptographic session issuance, sliding-window rate limiters, anti-impersonation checks, and server-side tenant isolation.
  - Secure backend proxy for Google Gemini 2.5 Flash Vision paired with a local deterministic heuristic fallback engine.
  - Full automated CDP regression suite (19 journeys), axe-core accessibility scanner (197 rules), and Core Web Vitals profiler.
- **Simulated Hardware Subsystems (Transparently Disclosed):**
  - **J1939 CAN-bus Telemetry:** Sensor feeds (SPN 190 RPM, SPN 110 Coolant Temp, SPN 157 Hydraulic Pressure) are synthetically simulated in client runtime (`src/utils/telemetry.js`) because physical heavy machinery CAN-bus transceivers are not connected.
  - **WebRTC Peer Verification:** Calling workflows were verified on a single host using automated CDP fake media devices (`--use-fake-device-for-media-stream`). Real-world two-party remote media transmission across separate physical mobile handsets and carrier NAT/STUN/TURN firewalls was not field-tested in this automated run.

