# RescueRoom — Live Field Equipment Emergency Dispatch Platform

> **CometChat Hackathon Submission · Built with Antigravity AI Agent**  
> **Platform**: Live Machinery Incident Command & Diagnostics  
> **Aesthetic Philosophy**: "Field Manual" (Tactile Workshop Blueprint & Military Radio)  
> **Stack**: React (Vite) + Pure Vanilla CSS + CometChat Headless JavaScript SDK (`@cometchat/chat-sdk-javascript`) + CometChat Calls SDK (`@cometchat/calls-sdk-javascript`)

---

## 1. Executive Summary & Design Philosophy

**RescueRoom** is an emergency incident response and field maintenance platform designed specifically for heavy equipment operators, industrial mechanics, and central fleet dispatchers.

Rather than relying on generic, rounded purple SaaS templates, RescueRoom is hand-crafted with a **bespoke "Field Manual" aesthetic**:
- **Paper & Ink Palette**: Tactile bone paper (`#EFE8D8`), deep ink borders (`#1C1B18`), sharp 90° corners, and zero-blur hard offset shadows (`3px 3px 0px #1C1B18`).
- **Industrial Signals**: Vermilion (`#E4421E`) emergency triggers, hazard-tape diagonal stripes (`#F2B705`), oxidised teal (`#1F6F68`) verified seals, and nighttime tactical dark panels (`#14201F`).
- **Typography**: Industrial Google Fonts **Bricolage Grotesque** (rugged manual headings) and **IBM Plex Mono** (military UTC timestamps, serial numbers, and equipment codes).

---

## 2. Signature Platform Innovations

### 🧗 The Escalation Ladder
A tactile, kinetic 3-rung vertical control embedded directly inside every incident channel:
- **Rung 1: CHAT**: Real-time printed ticker log, military timestamps (`[HH:MM:SS UTC]`), and typing indicators.
- **Rung 2: VOICE**: Instant two-way group voice radio call with real-time audio oscilloscope bar visualization and participant roster.
- **Rung 3: VIDEO**: Full tactical optical stream with camera mirroring, optical crosshair HUD overlay, and hardware mute controls.
- When terminated, an automated system dispatch record logs exact call duration (`Call ended · Duration: 04m 12s`) into the permanent incident ledger.

### 📋 The Triage Board (`/board`)
A physical pinned paper tag command board organized into three distinct severity columns:
- **`CRITICAL SEVERITY`**: Immediate work stoppage (Vermilion header).
- **`SERIOUS SEVERITY`**: Reduced equipment capacity / safety risk (Hazard Yellow header).
- **`MINOR ADVISORY`**: Routine operational fault report (Paper Light header).
- **Tag Anatomy**:
  - Pinned black square pin-head (`.triage-pin-head`).
  - Monospace incident code (e.g. `#INC-9322`).
  - Equipment unit badge (e.g. `🚜 Excavator EX-204`).
  - **Live counting monospace timer (`HH:MM:SS`)**: Counting elapsed downtime second-by-second.
  - Active responder count (`👥 X RESPONDERS JOINED`).
  - **Unread message pill**: Real-time unread counter (`● X NEW` vs `✓ CAUGHT UP`) powered by CometChat Conversations API.
  - **Oldest Waiting Highlight**: The longest unaddressed tag in each column receives an `8px` vermilion highlighted edge (`.triage-tag-oldest`) and a `★ LONGEST WAITING IN QUEUE` stamp.
- **Real-Time Group Listeners**: New incidents pin themselves live via CometChat event listeners without manual page refreshes.

### 📸 Numbered Evidence Plates
- Native mobile camera capture (`capture="environment"`) and desktop file picker.
- Strict 5MB file validation and image MIME enforcement.
- Industrial photographic print styling: heavy border, serial markings (`PLATE 01`, `PLATE 02`), timestamp, and operator signature.
- Interactive full-screen high-resolution inspection lightbox modal.

### 📊 Equipment Telemetry HUD & Interactive Vector Schematics
- **Interactive CAD Vector Blueprints**: Dynamic SVG schematics for Excavators, Bulldozers, Haul Trucks, Wheel Loaders, and Transport Fleets.
- **Pulsing Fault Node Pinpoint**: Concentric animated radar ping (`PINPOINT 01 ACTIVE`) highlighting the specific failed subsystem (e.g. Main Boom Cylinder, Rexroth A8VO Tandem Pump, Air Brake Chamber).
- **Click-to-Inspect Subsystems**: Click any node on the CAD schematic to inspect operating envelope, bore diameter, fluid flow, and nominal pressure thresholds.
- **Dispatch Subsystem Inquiry**: Instantly broadcasts a structured technical inquiry directly into the CometChat channel.
- **Simulated CAN-Bus J1939 Instrument Gauges**: Live animated analog/digital indicators for Hydraulic Pressure (PSI), Coolant/Slew Temp (°C), and Engine RPM with realistic sensor jitter and redline threshold alarms.

### 🤖 AI Machinery Co-Pilot & Failure Analysis Engine
- **Multimodal Visual Evidence Decoding**: Powered by **Google Gemini 2.5 Flash** with an offline **Tactical Engineering Heuristics Engine** fallback.
- **Root-Cause Mechanics**: Automated structural failure diagnosis (pressure carcass rupture, cyclic shock loading, thermal degradation).
- **OEM Parts Procurement Matrix**: Exact OEM part numbers (Caterpillar, Parker Hannifin, Bosch Rexroth, Bendix, Holset) with estimated unit costs and availability.
- **OSHA Lockout/Tagout (LOTO) Sequence**: Interactive checkable 6-step isolation procedures (chocking tracks, relieving tank pressure, padlocking 24V isolators).
- **Calibrated Fastener Torque Specs**: OEM factory torque ratings (Nm, ft-lb) and lubrication specifications.
- **One-Click CometChat Broadcast**: Dispatches the entire AI forensic briefing directly into the incident stream so all personnel stand by with exact specs.

### 📄 Auto-Generated Printable Service Report (`/report/:guid`)
- Reconstructs a complete physical workshop maintenance report (`FORM-RR-808`).
- **4 Metric Tiles**: Time to First Responder, Total Downtime Duration, Evidence Plates Scribed, and Call Minutes Logged.
- **Diagnostic Narrative**: Plain-language engineering diagnosis synthesized from telemetry.
- **Chronological Incident Event Ledger**: Minute-by-minute audit trail (Dispatched $\to$ First Responder $\to$ Evidence Scribed $\to$ Radio/Video Call $\to$ Officially Resolved).
- **Embedded Evidence Plate Gallery**: With click-to-inspect modal.
- **CAD Schematic Diagnosis & OEM Parts Manifest**: Reconstructed engineering schematic and inventory replenishment table.
- **Workshop Sign-off Block**: Lead technician signature line, supervisor stamp, and archive seal.
- **Print & PDF Export**: `@media print` CSS formats the document cleanly for physical paper filing and PDF generation.

---

## 3. Strict Multi-Tenant Isolation

RescueRoom provides 100% data separation between independent corporate workspaces:
1. **Northwind Heavy Equipment** (Mining & Excavation Fleet)
2. **Kestrel Logistics** (Warehouse & Transport Fleet)

- **Scoping Architecture**: All user UIDs (`northwind_ravi` vs `kestrel_dev`) and group GUIDs (`northwind_inc_*` vs `kestrel_inc_*`) are strictly prefixed.
- **403 Lockdown Shields**: If a user attempts to enter a foreign company incident room or inspect an external service report, an automated **Security Lockdown Card** halts navigation and preserves corporate confidentiality.

---

## 4. Multi-Tenant Demo Personnel Credentials

RescueRoom includes 6 pre-configured operational personnel across the two companies with one-click access:

| Workspace | Name | Role | Callsign | Access Route |
| :--- | :--- | :--- | :--- | :--- |
| **Northwind Heavy Equipment** | Asha Patil | Operator | `OP-LEAD` | `/operator` (Emergency Button) |
| **Northwind Heavy Equipment** | Ravi Kumar | Mechanic | `TECH-NORTH-09` | `/board` (Triage Board) |
| **Northwind Heavy Equipment** | Meera Sen | Dispatcher | `DISPATCH-01` | `/board` (Triage Board) |
| **Kestrel Logistics** | Dev Malhotra | Operator | `YARD-CHIEF` | `/operator` (Emergency Button) |
| **Kestrel Logistics** | Sana Sheikh | Mechanic | `MOBILE-TECH` | `/board` (Triage Board) |
| **Kestrel Logistics** | Imran Baig | Dispatcher | `KESTREL-BASE` | `/board` (Triage Board) |

---

## 5. CometChat MCP Tools Integration Log

Throughout development, the **CometChat Model Context Protocol (MCP)** server was queried live to ground every integration step in official, up-to-date documentation:

1. **`search_cometchat_docs`**:
   - Queried JavaScript Chat SDK v4 for group creation, membership management, and metadata updates (`search_cometchat_docs(query="updateGroup JavaScript SDK")`).
   - Queried real-time listeners for group events, incoming messages, and presence (`search_cometchat_docs(query="addGroupListener GroupListener JavaScript SDK")`).
   - Queried conversation unread count retrieval (`search_cometchat_docs(query="getUnreadMessageCount JavaScript SDK")`).
   - Queried group member scopes (`search_cometchat_docs(query="GROUP_MEMBER_SCOPE ADMIN MODERATOR PARTICIPANT")`).
2. **`fetch_cometchat_doc_page`**:
   - Retrieved full documentation for `/sdk/javascript/llms-javascript-v4` (routing index for SDK v4).
   - Retrieved full specification for `/sdk/javascript/update-group` (verifying `updateGroup` syntax and metadata capabilities).
   - Retrieved full documentation for `/sdk/javascript/all-real-time-listeners` (implementing `GroupListener`, `MessageListener`, `UserListener`, and `OngoingCallListener`).
   - Retrieved full documentation for `/sdk/javascript/retrieve-conversations` (implementing `ConversationsRequestBuilder` for unread pills).

---

## 6. Architectural Decision: CometChat Cloud Metadata

### Why Group Metadata was Chosen for Incident State:
1. **Decentralized Cloud Persistence**: Storing `{ status, severity, equipment, openedAt, resolvedAt, resolvedBy }` directly in CometChat group metadata removes any requirement for an external database (PostgreSQL, MongoDB, etc.).
2. **Zero Synchronization Drift**: The incident ticket lifecycle is tightly coupled to the CometChat room GUID (`companyId_inc_XXXX`). Chat transcripts, evidence plates, calling records, and resolution timestamps remain atomic.
3. **Multi-Client Real-Time Distribution**: Any technician or dispatcher fetching the group (`CometChat.getGroup`) or listing channels (`CometChat.GroupsRequestBuilder`) receives the latest incident state immediately.

---

## 7. Step-by-Step Judge Walkthrough Guide

To evaluate the full end-to-end incident lifecycle:

1. **Log in as Operator**:
   - Go to `http://localhost:5173/login`.
   - Select **Asha Patil** (Operator at Northwind).
   - Click **CONFIRM WORKSPACE ACCESS →**. You land on the Operator Station (`/operator`).
2. **Trigger an Emergency**:
   - Click the giant vermilion **"⚠ SOMETHING'S WRONG"** button.
   - Select equipment (e.g. `Excavator EX-204`), set severity to `CRITICAL`, and select preset fault *"HYDRAULIC BURST - High pressure line failure on main boom"*.
   - Click **TRANSMIT EMERGENCY DISPATCH →**.
3. **Switch to Mechanic on Triage Board**:
   - Click **SWITCH USER** in the navbar and select **Ravi Kumar** (Mechanic, Northwind).
   - You land on the **Triage Board (`/board`)**.
   - Notice the new incident pinned under `CRITICAL SEVERITY` with its live monospace timer ticking up, equipment badge, and vermilion `★ LONGEST WAITING IN QUEUE` edge.
4. **Enter Incident Room & Transmit Evidence**:
   - Click **OPEN DISPATCH ROOM →**.
   - Attach an image file using **📸 CAMERA** or **📁 ATTACH**.
   - Observe the photo formatted as an authentic industrial **Evidence Plate** (`PLATE 01`).
   - Click the plate to open the full-resolution inspection lightbox.
5. **Climb the Escalation Ladder**:
   - In the left rail, click **2. VOICE** to escalate to voice radio mode.
   - Observe the dark tactical panel, audio oscilloscope waveform, and participant strip.
   - Click **3. VIDEO** to escalate to tactical optical video.
   - Click **✕ END CALL & RETURN TO CHAT**. Notice the automated call duration log scribed to the message ticker.
6. **Resolve the Incident**:
   - In the top header, click **✓ RESOLVE INCIDENT**.
   - Watch the physical rubber stamp seal slam down in oxidised teal ink (`INCIDENT WORK ORDER COMPLETED & CLOSED`).
7. **View Printable Service Report**:
   - Click **📄 VIEW SERVICE REPORT →** (or return to `/board` and expand the **RESOLVED ARCHIVE**).
   - Review the calculated metrics, diagnostic narrative, chronological timeline ledger, and signature blocks.
   - Click **🖨 PRINT / EXPORT PDF SERVICE REPORT** to see the clean, high-contrast `@media print` layout.

---

## 8. Local Setup & Installation

### Prerequisites
- Node.js 18+ (tested on Node v20/v22)
- CometChat App Credentials

### Environment Configuration
Create a `.env` file in the root directory:
```bash
VITE_COMETCHAT_APP_ID=16843505914f60cbb
VITE_COMETCHAT_REGION=in
VITE_COMETCHAT_AUTH_KEY=cc35ff3816d06739765c7994842d0971fff65d80
```

### Installation & Run
```bash
# Install dependencies
npm install

# Start Vite development server
npm run dev

# Production build validation
npm run build
```

---

## 9. Verification & Code Quality
- **Zero Component Libraries**: 100% hand-crafted Pure Vanilla CSS design tokens.
- **Zero Tailwind / MUI / Bootstrap**: Pure Field Manual utility system.
- **CometChat Headless SDK**: Direct API interactions through `@cometchat/chat-sdk-javascript` and `@cometchat/calls-sdk-javascript`.
- **Production Build**: Verified with Vite 8.3 (`npm run build` succeeds in < 1 second).

---
*RescueRoom · Mission-Critical Emergency Dispatch Infrastructure · 2026*
