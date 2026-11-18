# 🚨 RescueRoom — Industrial Emergency Dispatch & Remote Telematics Diagnostics

[![Live Production](https://img.shields.io/badge/LIVE%20DEMO-rescueroom.onrender.com-brightgreen?style=for-the-badge&logo=render)](https://rescueroom.onrender.com/)
[![Production Build](https://img.shields.io/badge/BUILD-PASSING%20(VITE%208.3.8)-brightgreen?style=for-the-badge)](https://rescueroom.onrender.com/)
[![Zero Vulnerabilities](https://img.shields.io/badge/SECURITY-0%20VULNERABILITIES-blue?style=for-the-badge)](file:///d:/RescueRoom/docs/SECURITY.md)
[![A11y Compliant](https://img.shields.io/badge/WCAG%202.1%20AA-197%20PASSES%20%7C%200%20FAILURES-teal?style=for-the-badge)](file:///d:/RescueRoom/docs/TESTING_AND_QA.md)
[![3D WebGL](https://img.shields.io/badge/THREE.JS-60%20FPS%20DIGITAL%20TWIN-orange?style=for-the-badge)](file:///d:/RescueRoom/docs/PERFORMANCE_REPORT.md)
[![CometChat](https://img.shields.io/badge/COMETCHAT-JS%20SDK%20v4%20%2B%20CALLS%20v5-1C1B18?style=for-the-badge&logo=chat&logoColor=white)](file:///d:/RescueRoom/docs/ARCHITECTURE.md)

> 🌐 **Live Cloud Production URL:** [https://rescueroom.onrender.com/](https://rescueroom.onrender.com/)  
> *Direct single-origin access with 3D WebGL Digital Twin, real-time CometChat communications, J1939 CAN-bus telemetry, and field diagnostics.*

RescueRoom is a rugged, field-grade emergency dispatch, telematics telemetry, and remote diagnostics platform engineered for heavy mobile industrial machinery (surface mining excavators, quarry haul trucks, bulldozers, civil logistics).

It unifies **simulated J1939 CAN-bus telemetry**, a **scroll-driven 3D mechanical Digital Twin**, **multimodal AI damage forensics** (Google Gemini 2.5 Flash Vision + offline heuristic fallback), and a **3-tier kinetic escalation ladder** (Alphanumeric Ticker Chat $\to$ Half-Duplex Tactical Radio $\to$ Full Optical Video) into a single hardened, multi-tenant operations environment.

---

## ⚡ Quick Start & Verification

### 1. Prerequisites
- Node.js $\ge 20.6.0$
- Modern browser with WebGL 2.0 support (Chrome, Edge, Firefox, Safari)

### 2. Installation & Production Build
```bash
# Clone and enter directory
cd RescueRoom

# Install production and development dependencies
npm install

# Run static quality analysis (Oxlint: 0 warnings, 0 errors)
npm run lint

# Compile optimized production bundle
npm run build
```

### 3. Launch Hardened Staging Server
```bash
# Launches dual-stack HTTP (3001) and HTTPS (3443) staging server
node server/index.js
```

### 4. Operational URLs
- **Live Cloud Production URL:** [https://rescueroom.onrender.com/](https://rescueroom.onrender.com/)
- **Live Health Status:** [https://rescueroom.onrender.com/api/health](https://rescueroom.onrender.com/api/health)
- **Local HTTP Staging Console:** [`http://localhost:3001/login`](http://localhost:3001/login)
- **Local HTTPS Staging Console:** [`https://localhost:3443/login`](https://localhost:3443/login)
- **Local Health Endpoint:** [`http://localhost:3001/api/health`](http://localhost:3001/api/health)

---

## 👥 Operational Personnel Roster & Credentials

RescueRoom enforces strict multi-tenant isolation. Personnel authenticate with their role, tenant company, and 4-digit security PIN:

| Company Tenant | Personnel Name | Role | Callsign | Access PIN | Landing Route |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **Northwind Heavy Equipment** | Asha Patel | Operator | `OP-NORTH-01` | `1091` | `/operator` (Emergency Console) |
| **Northwind Heavy Equipment** | Ravi Kumar | Mechanic | `TECH-NORTH-09` | `2044` | `/board` (Crisis Triage Board) |
| **Northwind Heavy Equipment** | Meera Singh | Dispatcher | `DISPATCH-NORTH-CENTRAL`| `3082` | `/board` (Crisis Triage Board) |
| **Kestrel Logistics** | Dev Sharma | Operator | `OP-KESTREL-04` | `4110` | `/operator` (Emergency Console) |
| **Kestrel Logistics** | Sana Mir | Mechanic | `TECH-KESTREL-12` | `5221` | `/board` (Crisis Triage Board) |
| **Kestrel Logistics** | Imran Khan | Dispatcher | `DISPATCH-KESTREL-MAIN` | `6335` | `/board` (Crisis Triage Board) |

---

## 🕹️ Primary Application Routes

The application features 6 specialized, lazy-loaded operational interfaces:

1. **Authentication Gate (`/login`):** Multi-tenant personnel selector with PIN verification and server session issuance.
2. **Operator Station (`/operator`):** One-touch emergency requisition trigger (`⚠ SOMETHING'S WRONG`), equipment catalog selector, and company responder presence strip.
3. **Command Triage Board (`/board`):** Kanban incident queue sorted by severity (`CRITICAL`, `SERIOUS`, `MINOR`) with real-time downtime counters and filter controls.
4. **Crisis Incident Room (`/room/:guid`):** Unified 3-panel command layout:
   - *Left Rail:* Monospace ticker chat, presence roster, and kinetic escalation controls (`CHAT` / `VOICE` / `VIDEO`).
   - *Center Stage:* Live simulated J1939 CAN-bus telemetry gauges, 2D vector CAD blueprint with interactive failure hotspots, and photo evidence plate viewer.
   - *Right Rail / Modal:* `RESCUE-AI` diagnostics modal with 4 tabs: Root Cause Forensics, LOTO Safety Isolation, OEM Torque Tolerances, and Field Overrides.
5. **3D Digital Twin Studio (`/twin`):** Interactive, scroll-choreographed 3D mechanical assembly powered by Three.js with custom PBR and CAD wireframe shaders navigating across 6 diagnostic inspection stages.
6. **Forensic Service Report (`/report/:guid`):** Printable, auditable `FORM-RR-808` maintenance sheet capturing telemetry deltas (failure vs. post-repair), AI root cause diagnosis, replaced OEM parts, and technician LOTO signoffs.

---

## 🛡️ Security & Reliability Architecture

RescueRoom has undergone comprehensive penetration and reliability hardening:

- **Zero Privileged Secrets in Frontend:** The client bundle contains zero API keys. `COMETCHAT_API_KEY` and `GEMINI_API_KEY` reside exclusively in the server environment.
- **Server-Side Session Custody:** Authentication generates an 8-hour cryptographic bearer token (`rr_sess_*`). Unauthenticated clients cannot request tokens or execute AI diagnostics.
- **UID Anti-Impersonation Guard:** The server strictly verifies that token retrieval requests match the authenticated session's UID, rejecting spoofing attempts with HTTP 403.
- **Server-Enforced Multi-Tenancy:** Incident rooms follow the prefix convention `{companyId}_inc_{num}`. Cross-tenant access is blocked server-side (`HTTP 403 CROSS_TENANT_VIOLATION`).
- **Sliding-Window Rate Limiting:** In-memory sliding-window limits protect `/api/auth/login` (10/min), `/api/auth/token` (30/min), and `/api/gemini/analyze` (20/min).
- **Defense-in-Depth Headers:** Injects strict `Content-Security-Policy`, `Permissions-Policy: camera=(self), microphone=(self)`, `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, and `X-Frame-Options: SAMEORIGIN`.
- **Zero Vulnerabilities:** `npm audit` verified clean with 0 known vulnerabilities.
- **Graceful Shutdown:** Implements `SIGINT` and `SIGTERM` process listeners with active socket draining and a 5-second force-termination timeout.

---

## 📊 Comprehensive Quality Assurance & Verification

| Test Suite / Metric | Scope | Target | Result | Status |
| :--- | :--- | :---: | :---: | :---: |
| **Static Code Analysis** | Oxlint across 20 source files (104 rules) | 0 Warnings, 0 Errors | **0 Warnings, 0 Errors** | **PASS** |
| **Supply Chain Audit** | `npm audit` dependency scanner | 0 Vulnerabilities | **0 Vulnerabilities** | **PASS** |
| **Full Regression Suite** | 19 assertions across all 9 core journeys | 100% Pass | **19 / 19 PASSED (100%)** | **PASS** |
| **A11y Accessibility** | Axe-core automated WCAG 2.1 AA audit | 0 Violations | **197 Checks Passed, 0 Violations** | **PASS** |
| **Touch Target Compliance** | Minimum 44×44px interactive surface | 100% | **100% Compliance** | **PASS** |
| **Core Web Vitals** | LCP across all routes | $\le 2.5\text{s}$ | **0.58s – 0.81s** | **PASS** |
| **Layout Stability** | CLS across all routes | $\le 0.10$ | **0.000 – 0.011** | **PASS** |
| **3D Digital Twin FPS** | Three.js rendering over 180 continuous frames | $\ge 50\text{ FPS}$ | **58.7 FPS Average** | **PASS** |
| **Memory Growth Delta** | 10 continuous route navigation cycles | $< 15\text{ MB}$ | **8.32 MB Net Delta** | **PASS** |

---

## 📚 Technical Documentation Index

Detailed technical specifications are available in the [`docs/`](file:///d:/RescueRoom/docs) directory:

1. [**System Architecture (`docs/ARCHITECTURE.md`)**](file:///d:/RescueRoom/docs/ARCHITECTURE.md): Component breakdown, routing, middleware pipeline, and technology stack.
2. [**Architecture Diagrams (`docs/ARCHITECTURE_DIAGRAM.md`)**](file:///d:/RescueRoom/docs/ARCHITECTURE_DIAGRAM.md): Mermaid topographies, authentication sequences, and data flows.
3. [**Database & Data Model (`docs/DATABASE_AND_DATA_MODEL.md`)**](file:///d:/RescueRoom/docs/DATABASE_AND_DATA_MODEL.md): Schemas for Roster, Sessions, CometChat Groups, Telemetry Frames, and Service Reports.
4. [**API Reference (`docs/API_REFERENCE.md`)**](file:///d:/RescueRoom/docs/API_REFERENCE.md): Full contracts, status codes, headers, and payload specifications for all `/api/*` endpoints.
5. [**Security Architecture (`docs/SECURITY.md`)**](file:///d:/RescueRoom/docs/SECURITY.md): Threat modeling, authentication guardrails, rate limiting, and dependency audits.
6. [**Testing & QA Report (`docs/TESTING_AND_QA.md`)**](file:///d:/RescueRoom/docs/TESTING_AND_QA.md): Full regression methodology, axe-core a11y audit, and cross-browser test evidence.
7. [**Performance & CWV Report (`docs/PERFORMANCE_REPORT.md`)**](file:///d:/RescueRoom/docs/PERFORMANCE_REPORT.md): Core Web Vitals profiling, bundle decomposition, and Three.js FPS metrics.
8. [**Deployment & Operations Guide (`docs/DEPLOYMENT.md`)**](file:///d:/RescueRoom/docs/DEPLOYMENT.md): Containerization (`Dockerfile`), NGINX reverse proxy config, PM2 supervision, and runbooks.
9. [**Known Limitations & Disclosures (`docs/KNOWN_LIMITATIONS.md`)**](file:///d:/RescueRoom/docs/KNOWN_LIMITATIONS.md): Transparent technical boundaries regarding synthetic CAN telemetry, single-host WebRTC test scope, and offline heuristic fallbacks.
10. [**QA Evidence Catalog (`docs/evidence/README.md`)**](file:///d:/RescueRoom/docs/evidence/README.md): Repository of JSON audit reports and browser verification captures across Stages 1–5.

---

## 💼 Portfolio & Evaluation Package

Specialized portfolio artifacts and recruiter-ready documentation are located in [`portfolio/`](file:///d:/RescueRoom/portfolio):

- [**Project Executive Overview (`portfolio/PROJECT_OVERVIEW.md`)**](file:///d:/RescueRoom/portfolio/PROJECT_OVERVIEW.md): Problem space, $5K–$25K/hr downtime impact, solution capabilities, and multi-tenant fleets.
- [**Technical Highlights & Engineering Deep-Dive (`portfolio/TECHNICAL_HIGHLIGHTS.md`)**](file:///d:/RescueRoom/portfolio/TECHNICAL_HIGHLIGHTS.md): Zero-framework design tokens, Three.js custom shaders, dynamic code splitting, and procedural audio synthesis.
- [**System Architecture Overview (`portfolio/ARCHITECTURE_OVERVIEW.md`)**](file:///d:/RescueRoom/portfolio/ARCHITECTURE_OVERVIEW.md): Client, edge, server, and cloud service topologies, zero-trust perimeters, and rate limiting matrices.
- [**Quality Assurance & Performance Benchmarks (`portfolio/QA_AND_PERFORMANCE.md`)**](file:///d:/RescueRoom/portfolio/QA_AND_PERFORMANCE.md): 19/19 regression scorecard, 197 axe-core WCAG 2.1 AA passes, and WebGL FPS stability charts.
- [**Live Demonstration & Evaluation Guide (`portfolio/DEMO_GUIDE.md`)**](file:///d:/RescueRoom/portfolio/DEMO_GUIDE.md): 9-step guided walkthrough across all operational features for evaluators and judges.
- [**ATS-Friendly Resume Project Entries (`portfolio/RESUME_PROJECT_ENTRY.md`)**](file:///d:/RescueRoom/portfolio/RESUME_PROJECT_ENTRY.md): Tailored bullet points, metrics, and talking points for senior engineering resumes.

---

## 🐳 Production Containerization & Deployment

RescueRoom includes complete production deployment assets:

```bash
# 1. Build and run via Docker Compose
docker compose up -d --build

# 2. Inspect running services (App on 3001, Redis on 6379, NGINX on 80/443)
docker compose ps

# 3. Verify health status
curl -i http://localhost:3001/api/health
```

---

## ⚠️ Transparent Engineering Disclosures

To maintain absolute technical transparency:
1. **Simulated J1939 CAN Telemetry:** Engine speed, coolant temperatures, hydraulic pressures, and DM1 fault codes are synthetically simulated in the browser runtime (`src/utils/telemetry.js`). Physical CAN-bus hardware dongles (PEAK/Kvaser) are not attached.
2. **WebRTC Remote Peer Scope:** The 3-tier kinetic escalation ladder, media permissions, and calling UI are fully implemented and verified via automated Chrome DevTools test harnesses with simulated media streams. Real-world two-party remote media transmission across separate physical mobile handsets and carrier NAT/STUN/TURN firewalls was not field-tested in this automated run.
3. **Dual AI Diagnostic Engine:** The multimodal vision scanner utilizes Google Gemini 2.5 Flash when `GEMINI_API_KEY` is provided. In offline mode or cellular blackouts, the system seamlessly falls back to the deterministic built-in tactical heuristic engine.

---

## 📄 License
MIT © 2026 RescueRoom Engineering Team.
