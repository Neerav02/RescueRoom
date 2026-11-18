# RescueRoom System Architecture

RescueRoom is an industrial field equipment emergency dispatch, remote diagnostics, and telematics collaboration platform engineered for high-consequence operations (surface mining, quarry haulage, heavy civil earthmoving).

---

## 1. Architectural Philosophy

RescueRoom is designed around four architectural tenets:

1. **Mission-Critical Ruggedness:** Operates with zero external UI framework dependencies (pure Vanilla CSS design tokens), full keyboard accessibility, resilient offline heuristics fallback, and graceful WebGL context recovery.
2. **Strict Multi-Tenant Isolation:** Enforces tenant boundaries server-side. Corporate personas (`northwind_*` vs. `kestrel_*`) cannot view, access, or transcribe cross-tenant incident rooms or reports.
3. **Kinetic Escalation Modalities:** Unifies synchronous and asynchronous collaboration inside a single channel—escalating dynamically from low-bandwidth alphanumeric ticker chat to half-duplex voice radio, to full optical video feeds.
4. **Digital Twin & Telematics Synchronization:** Synthesizes simulated CAN-bus J1939 engine telemetry with both 2D vector CAD schematics and an interactive, scroll-choreographed 3D mechanical Digital Twin.

---

## 2. High-Level System Architecture

RescueRoom uses a decoupled, hybrid architecture consisting of:
- **Client Application:** Modern React 19 Single Page Application (SPA) bundled via Vite with route-level dynamic code-splitting and WebGL shaders.
- **Hardened Staging Backend Server:** Dedicated Node.js runtime (`server/index.js`) providing server-side session authentication, token minting via CometChat REST APIs, proxying of Gemini AI multimodal prompts, rate limiting, and HTTP/HTTPS dual-stack hosting.
- **CometChat Cloud Infrastructure:** Headless real-time messaging, group presence, and WebRTC audio/video call signaling.
- **Google Gemini Generative AI:** Multimodal visual failure analysis and OEM repair plan generation with a local offline deterministic heuristics engine.

---

## 3. Frontend Architecture

### 3.1 Technology Stack
- **Framework:** React 19.2.8 (`react`, `react-dom`)
- **Routing:** React Router v7.18.4 (`react-router-dom`) with lazy loading
- **3D Graphics:** Three.js 0.187.0 (`three`) with custom procedural PBR, CAD wireframe, and X-ray ghost shaders
- **Messaging & Calls:** CometChat JavaScript Chat SDK v4.2.0 (`@cometchat/chat-sdk-javascript`) and Calling SDK v5.0.6 (`@cometchat/calls-sdk-javascript`)
- **Build System:** Vite 8.3.8 with Rolldown runtime
- **Linter:** Oxlint 1.81.0

### 3.2 Route-Based Code Splitting
The frontend bundle is split into distinct asynchronous chunks loaded strictly on demand via `React.lazy()` and `Suspense`:

| Chunk | Source File | Purpose | Loaded When |
| :--- | :--- | :--- | :--- |
| `LoginPage-*.js` | `src/pages/LoginPage.jsx` | Operational roster authentication | Initial `/login` visit |
| `OperatorPage-*.js` | `src/pages/OperatorPage.jsx` | One-touch dispatch console | Visiting `/operator` |
| `TriageBoardPage-*.js` | `src/pages/TriageBoardPage.jsx`| Kanban incident queue & timers | Visiting `/board` |
| `RoomPage-*.js` | `src/pages/RoomPage.jsx` | 3-panel command & escalation | Visiting `/room/:guid` |
| `DigitalTwinPage-*.js` | `src/pages/DigitalTwinPage.jsx` | 6-stage 3D mechanical narrative | Visiting `/twin` |
| `ServiceReportPage-*.js`| `src/pages/ServiceReportPage.jsx` | FORM-RR-808 printable audit sheet | Visiting `/report/:guid` |
| `vendor-three-*.js` | Three.js runtime & shaders | 3D WebGL rendering engine | Visiting `/twin` |
| `vendor-cometchat-calls`| CometChat Calling SDK | WebRTC audio/video calls | Escalating to VOICE/VIDEO |

**Vendor Chunk Isolation:** The 1.81 MB CometChat Calls SDK is never loaded during initial page load, operator dispatch, or board triage. It is fetched strictly on demand when an operator or mechanic clicks the VOICE or VIDEO escalation rungs.

### 3.3 Component Responsibilities

#### `src/pages/LoginPage.jsx`
- Surfaces the dual-company personnel roster (`Northwind Heavy Equipment` vs. `Kestrel Logistics`).
- Submits credentials (`uid`, `accessPin`, `companyId`) to `/api/auth/login`.
- Stores the server-issued cryptographic session token (`rescueroom_session_token`) and user metadata in `sessionStorage`.

#### `src/pages/OperatorPage.jsx`
- Provides the high-visibility emergency trigger button (`.btn-emergency`: `⚠ SOMETHING'S WRONG`).
- Renders the responsive dispatch requisition form with severity selection (`CRITICAL`, `SERIOUS`, `MINOR`).
- Dynamically provisions the incident channel on CometChat and dispatches initial broadcast logs.
- Displays the responsive "Recent Incidents" feed with zero horizontal overflow down to 320px.

#### `src/pages/TriageBoardPage.jsx`
- Kanban crisis board dividing incidents into three severity columns.
- Implements real-time second-by-second downtime clocks (`IncidentTimer`).
- Highlights the oldest-waiting ticket in each column with a vermilion priority accent.
- Features real-time search across equipment codes, descriptions, and callsigns.

#### `src/pages/RoomPage.jsx`
- Central 3-panel command station:
  - **Left Column:** Kinetic Escalation Ladder (`CHAT` → `VOICE` → `VIDEO` → `CHAT`).
  - **Center Column:** Real-time field manual ticker log stream, audio oscilloscope / video feed, and photo upload.
  - **Right Column:** Roster unit presence tracker (`WHO'S HERE`) and equipment specification ledger.
- Enforces server-side cross-tenant isolation (Protocol 403 lockdown).
- Houses the full-screen evidence plate inspection lightbox with accessible focus trapping.

#### `src/components/TelemetryHUD.jsx`
- Simulates real-time CAN-bus J1939 telemetry (hydraulic PSI, coolant temperature, engine RPM) with realistic micro-jitter.
- Renders interactive vector CAD schematics (Excavator EX-204, Bulldozer BD-801, Haul Truck HT-310).
- Animates a pulsing radar crosshair directly locking onto the failed mechanical subsystem.
- Enables single-click dispatch inquiries transmitted into the active chat stream.

#### `src/components/DigitalTwinCanvas.jsx` & `src/lib/digitalTwinAssembly.js`
- Procedurally constructs a 6-subsystem 3D excavator assembly in Three.js:
  1. Primary Boom Cylinder & Gland Seal
  2. Swashplate Hydraulic Pump (Rexroth A8VO)
  3. Directional Control Valve Manifold
  4. Slew Drive Motor & Planetary Reducer
  5. Diesel Prime Mover & Turbocharger
  6. Heavy Excavator Undercarriage & Slew Ring
- Implements 3 shader modes: Solid PBR, Technical CAD Wireframe, and X-Ray Ghost.
- Synchronizes camera trajectory and component explosion distances with scroll progress [0.0 to 1.0].
- Handles WebGL context loss and restoration without page crashes.

#### `src/components/AiCopilotModal.jsx`
- Multimodal visual diagnostics interface for examining uploaded evidence plates.
- Proxies requests to `/api/gemini/analyze` using Google Gemini 2.5 Flash.
- Engages the built-in offline deterministic OEM heuristic engine when external APIs are unconfigured or rate limited.
- Provides a 3-part technical repair breakdown:
  - Tab 1: Forensic diagnosis and OEM replacement parts matrix (with clipboard copy).
  - Tab 2: LOTO safety checklist (interactive completion state).
  - Tab 3: Calibrated fastener torque specifications.

#### `src/pages/ServiceReportPage.jsx`
- Official maintenance record and compliance archive: `FORM-RR-808`.
- Features an authentic mechanical ink stamp seal (`VERIFIED RECORD · RESOLVED`).
- Reconstructs chronological audit trails, time-to-first-responder, and total downtime.
- Embeds high-resolution evidence plate galleries and replacement parts manifests.
- Tailored for print and PDF generation via `@media print` rules.

---

## 4. Backend Architecture

The backend (`server/index.js`) is an independent, zero-dependency Node.js HTTP/HTTPS server engineered for security, reliability, and credential protection.

### 4.1 Server Middleware Pipeline
1. **Request Body Parser (`readJsonBody`):** Enforces a strict 15 MB payload ceiling to prevent memory denial-of-service.
2. **Security Headers Middleware:** Injects standard defense-in-depth headers on all responses:
   - `Content-Security-Policy`: Restricts origins to self, CometChat domains, and Google Fonts.
   - `X-Content-Type-Options: nosniff`: Prevents MIME-type sniffing.
   - `X-Frame-Options: SAMEORIGIN`: Prevents clickjacking attacks.
   - `Referrer-Policy: strict-origin-when-cross-origin`: Restricts leak of query parameters.
   - `Permissions-Policy: camera=(self), microphone=(self), geolocation=()`: Controls device hardware.
   - `Strict-Transport-Security`: Enforced over HTTPS connections.
3. **Sliding-Window Rate Limiter:** Protects authentication and AI endpoints from abuse:
   - `/api/auth/login`: 10 requests per minute per IP.
   - `/api/auth/token`: 30 requests per minute per IP.
   - `/api/gemini/analyze`: 20 requests per minute per IP.
4. **Session Extraction & Impersonation Guard (`extractSession`):**
   - Validates incoming `Authorization: Bearer <sessionToken>`.
   - Rejects expired sessions (8-hour operational shift duration).
   - Prevents UID spoofing by extracting identity strictly from the verified server session.
5. **Static File Server:** Serves production assets from `dist/` with immutable caching for fingerprinted assets (`/assets/*`) and no-cache for `index.html`. SPA fallback returns `index.html` on direct deep-link route navigation.
6. **Graceful Process Lifecycle:** Captures `SIGINT` and `SIGTERM` to cleanly drain sockets, terminate active listeners, and exit with code 0.
