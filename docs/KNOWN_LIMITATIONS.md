# RescueRoom Known Limitations & Architecture Disclosures

This document provides transparent, unembellished disclosures regarding the technical boundaries, simulated subsystems, and operational constraints of the current RescueRoom release.

---

## 1. Synthetic J1939 / CAN-bus Telemetry

### Current Implementation
- Machinery telemetry frames (Engine Speed SPN 190, Coolant Temperature SPN 110, Hydraulic Pressure SPN 157, Oil Pressure SPN 100, and DM1 Diagnostic Trouble Codes) are **synthetically generated** by the client runtime in `src/utils/telemetry.js`.
- The telematics generator accurately models realistic industrial machinery failure states (e.g., hydraulic blowout pressure collapse, cooling system thermal runaway, and cyclical engine load fluctuations) at a 1000ms tick rate.

### Production Roadmap & Physical Interface
- RescueRoom does **not** currently interface directly with physical CAN-bus transceivers (e.g., PEAK PCAN-USB, Kvaser Leaf, or Linux SocketCAN interfaces).
- For physical deployment on heavy mobile equipment, an edge IoT telematics gateway (e.g., Advantech, Sierra Wireless, or Teltonika) reading physical SAE J1939 CAN lines must ingest sensor frames and forward them to RescueRoom via MQTT or secure WebSockets.

---

## 2. WebRTC Audio / Video Remote Peer Verification

### Current Implementation
- Kinetic escalation from Alphanumeric Chat to Half-Duplex Voice (`VOICE`) and Full Optical Video (`VIDEO`) is fully implemented using the CometChat Calls JavaScript SDK v5.0.6.
- The lazy-loading chunk architecture (`vendor-cometchat-calls`), call initiation, call ending, camera/mic permissions, and non-blocking audit logging were verified in automated browser testing using fake media devices (`--use-fake-device-for-media-stream`).

### Operational Constraint
- Verification was conducted on a single host environment using automated test harnesses.
- **Physical two-party remote media transmission across separate physical mobile handsets and real-world mobile carrier NAT/STUN/TURN firewalls has not been independently validated in this automated run.** Full cellular field testing across distributed LTE/5G SIM devices is recommended prior to live mine deployment.

---

## 3. Dual-Engine AI Diagnostics & Offline Heuristic Fallback

### Current Implementation
- The diagnostic pipeline (`/api/gemini/analyze`) proxies optical evidence plate photographs and telemetry context to **Google Gemini 2.5 Flash Vision**.
- When `GEMINI_API_KEY` is provided, the remote neural model analyzes the image to identify failed components, failure mechanics, OEM part numbers, torque specifications, and LOTO steps.

### Fallback Behavior
- In offline field environments, cellular blackouts, or if `GEMINI_API_KEY` is unset or rate-limited, the system deterministically falls back to the built-in **Tactical Machinery Heuristic Engine** (`server/heuristics.js`).
- The heuristic engine uses deterministic rule-based pattern matching over machinery metadata and fault descriptions. It does not perform true neural pixel analysis; field operators are notified when heuristic mode is active via the response badge.

---

## 4. In-Memory Session Store & Clustering

### Current Implementation
- Authenticated user sessions are stored in an in-memory `Map` (`activeSessions`) inside `server/index.js` with an 8-hour shift TTL.
- Background garbage collection sweeps expired sessions every 10 minutes.

### Scaling Constraint
- Because sessions reside in process memory, restarting the Node.js server invalidates active sessions, requiring operators to re-enter their PIN on the login screen.
- For high-availability, multi-node Kubernetes or cluster deployments, this in-memory Map must be replaced with a distributed key-value store such as Redis or KeyDB.

---

## 5. Personnel Roster & Enterprise IdP Integration

### Current Implementation
- Multi-tenant personas (`northwind_*` for Northwind Heavy Equipment and `kestrel_*` for Kestrel Logistics) are statically defined in `src/lib/roster.js`.
- Security PINs are verified on the server against this static roster.

### Enterprise Roadmap
- Enterprise rollouts should replace static roster verification with single sign-on (SSO) integrations supporting SAML 2.0, OpenID Connect (OIDC), or Azure Active Directory / Entra ID, mapping field identities directly to corporate directory groups.
