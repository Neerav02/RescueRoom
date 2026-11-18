# RescueRoom — Live Demonstration & Evaluation Guide

This guide provides a structured, step-by-step walkthrough for evaluators, recruiters, and engineering leaders to experience the full operational lifecycle of RescueRoom across Chat, Voice, Video, 3D Graphics, Telematics, and AI Diagnostics.

---

## ⚡ Quick Evaluation Overview

| Demonstration Phase | Core Technologies Showcased | Operational Objective |
| :--- | :--- | :--- |
| **Phase 1: Personnel Authentication** | Server Sessions, Multi-Tenancy, Access PINs | Authenticate into Northwind Heavy Equipment roster. |
| **Phase 2: Emergency Dispatch** | CometChat Group Creation, Initial Ticker Broadcast | Trigger emergency requisition for Excavator EX-204 breakdown. |
| **Phase 3: Command Triage Board** | Kanban Workflow, Real-Time Downtime Timers | Monitor active downtime counters across severity tiers. |
| **Phase 4: 3-Panel Incident Room** | Simulated J1939 CAN Telemetry, 2D Vector CAD | Inspect live fluctuating hydraulic pressures & fault pinpoints. |
| **Phase 5: Kinetic Escalation Ladder**| CometChat Calls v5 WebRTC (Audio & Video) | Escalate from Alphanumeric Chat $\to$ Voice Radio $\to$ Optical Video. |
| **Phase 6: RESCUE-AI Diagnostics** | Google Gemini 2.5 Flash Vision + Offline Fallback | Generate forensic root cause, OEM part numbers, and LOTO steps. |
| **Phase 7: 3D Digital Twin Studio** | Three.js 0.187, Procedural PBR & CAD Shaders | Scroll through 6-stage mechanical disassembly and X-ray modes. |
| **Phase 8: Service Report Generation** | FORM-RR-808, `@media print` Layout Engine | Close incident and generate printable maintenance audit sheet. |
| **Phase 9: Multi-Tenant Security Proof**| Server-Enforced Tenant Isolation (HTTP 403) | Demonstrate cross-tenant access rejection under a different fleet. |

---

## Step-by-Step Walkthrough

### Step 1: Authenticate as Operator (Asha Patel)
1. Open [`http://localhost:3001/login`](http://localhost:3001/login) (or HTTPS on port `3443`).
2. Under **Northwind Heavy Equipment**, select **Asha Patel (Operator)**.
3. Notice the 4-digit PIN auto-populates (`1091`) or enter it manually.
4. Click **AUTHORIZE STATION →**.
5. The server verifies credentials, mints an 8-hour cryptographic session token (`rr_sess_*`), logs in via CometChat, and redirects to the **Operator Emergency Station (`/operator`)**.

### Step 2: Transmit Emergency Dispatch Requisition
1. On `/operator`, observe the large vermilion trigger: **`⚠ SOMETHING'S WRONG`**.
2. Click the button to expand the emergency requisition form.
3. Select equipment: **`Excavator EX-204`**.
4. Select severity: **`CRITICAL`** (Safety Hazard / Production Halting).
5. Enter fault details:
   ```
   Hydraulic pressure loss on primary boom lift cylinder. Fluid spraying near valve block. Immediate shutdown initiated.
   ```
6. Click **TRANSMIT EMERGENCY DISPATCH →**.
7. An incident channel group (`northwind_inc_*`) is created via CometChat REST APIs, responders are provisioned, and you are automatically routed into the new Incident Room (`/room/:guid`).

### Step 3: Command Triage Board & Real-Time Timers
1. In the top navigation bar, click **TRIAGE BOARD (`/board`)**.
2. Observe the 3-column severity layout (**CRITICAL**, **SERIOUS**, **MINOR**).
3. Notice your newly dispatched incident appears under the **CRITICAL** column with an active, ticking downtime clock tracking lost operational minutes.
4. Click **OPEN DISPATCH ROOM →** on the card to return to the active incident.

### Step 4: Inspect Live CAN Telemetry HUD & CAD Blueprint
1. In the Incident Room, observe the top **Telemetry HUD**:
   - Notice the prominent **`[SIMULATED J1939]`** disclosure badge.
   - Observe simulated live fluctuating sensor readouts (Hydraulic Pressure: $> 5,000\text{ PSI}$, Coolant Temp: $> 106^\circ\text{C}$).
2. Click **`▼ BLUEPRINT & GAUGES`** to expand the 2D vector CAD schematic.
3. Notice the **pulsing red radar pinpoint** locking onto the failed **Main Boom Cylinder**. Click the node to inspect technical specifications, then click **DISPATCH INQUIRY TO CHAT** to inject a telemetry alert into the chat stream.

### Step 5: Escalate Up the Kinetic Ladder (Voice & Video Calls)
1. On the left rail under **COMMUNICATION MODALITY**, observe the ladder controls:
   - **`1. CHAT`** is currently active (alphanumeric monospace ticker with Web Audio synthetic chimes).
2. Click **`2. VOICE`**:
   - The lazy-loaded `vendor-cometchat-calls` chunk loads asynchronously.
   - Tactical half-duplex radio activates with a real-time audio oscilloscope visualizer and participant strip.
3. Click **`3. VIDEO`**:
   - Optical video connects with HUD crosshairs and hardware mute toggles.
4. Click **`✕ END CALL & RETURN TO CHAT`**:
   - WebRTC tracks are cleanly disposed.
   - An automated call duration audit entry (e.g. `[VOICE CALL CONCLUDED · DURATION: 18s]`) is scribed to the chat ticker.

### Step 6: Execute RESCUE-AI Multimodal Diagnostics
1. In the right-hand panel, click **`🤖 RESCUE-AI CO-PILOT`**.
2. The diagnostic modal opens and queries `/api/gemini/analyze`:
   - If `GEMINI_API_KEY` is present, Google Gemini 2.5 Flash Vision processes the evidence plate.
   - If offline or unconfigured, the tactical heuristic engine engages immediately with zero interruption.
3. Review the 4 diagnostic tabs:
   - **FORENSICS:** Component identification, failure mechanics, and OEM part numbers (`CAT-154-8291`, `PARKER-787TC-16`) with one-click **COPY P/N** buttons.
   - **LOTO:** Interactive 4-step Lockout/Tagout physical safety isolation checklist.
   - **TORQUE:** Calibrated fastener specifications (`145 Nm (107 ft-lb)`).
   - **CONFIG:** Hydraulic relief bypass thresholds and emergency overrides.
4. Click **📡 TRANSMIT AI REPORT TO COMETCHAT** to broadcast the diagnostic summary into the operational chat ticker.

### Step 7: Explore the 3D Mechanical Digital Twin Studio
1. In the navigation bar, click **3D TWIN (`/twin`)**.
2. The Three.js 3D mechanical assembly loads with procedural PBR materials.
3. Scroll through the **6-Stage Disassembly Narrative**:
   - *Stage 1: Structural Chassis Overview*
   - *Stage 2: Hydraulic Valve Block Separation*
   - *Stage 3: Main Boom Cylinder Gland Inspection*
   - *Stage 4: Carcass Rupture Point Identification*
   - *Stage 5: AI Optical Damage Scan*
   - *Stage 6: Pressurized Reassembly & Verification*
4. In the top-right HUD, switch shader modes:
   - Click **`CAD WIREFRAME`** to activate the blue holographic blueprint shader.
   - Click **`X-RAY GHOST`** to render semi-transparent structural cowlings.
5. Click **`ORBIT CAM`** to freely rotate, pan, and inspect the mechanical assembly in 3D space.

### Step 8: Resolve Incident & Generate Service Report (FORM-RR-808)
1. Navigate back to the Incident Room (`/room/:guid`).
2. In the top-right header, click **`✓ RESOLVE INCIDENT`**.
3. An animated resolution stamp seals the incident in oxidized teal ink (`STATE: RESOLVED`).
4. Click **`📄 VIEW SERVICE REPORT →`**.
5. You land on [`/report/:guid`](file:///d:/RescueRoom/src/pages/ServiceReportPage.jsx):
   - Inspect the printable `FORM-RR-808` maintenance audit sheet.
   - Observe baseline vs. post-repair telemetry deltas (Hydraulic pressure restored from 5,120 PSI to nominal 4,180 PSI).
   - Review parts replaced, technician LOTO signoffs, and timestamps.
6. Click **`🖨 PRINT / EXPORT PDF`** to preview the clean, unbranded `@media print` layout.

### Step 9: Verify Multi-Tenant Security & Tenant Isolation
1. In the navigation bar, click **`LOGOUT`** (session and CometChat tokens are revoked).
2. On `/login`, select **Dev Sharma (Operator)** under **Kestrel Logistics** (PIN: `4110`) and log in.
3. Attempt to paste or open the previous Northwind incident URL (`http://localhost:3001/room/northwind_inc_*`).
4. Observe the immediate security response:
   - The backend checks tenant ownership at `/api/auth/authorize-tenant`.
   - Access is **blocked with HTTP 403 Forbidden (`CROSS_TENANT_VIOLATION`)**.
   - The UI displays an industrial security access denial stamp, proving strict multi-tenant data boundaries.

