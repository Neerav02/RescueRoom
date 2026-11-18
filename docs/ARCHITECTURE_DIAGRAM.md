# RescueRoom System Architecture Diagrams

This document contains visual diagrams documenting RescueRoom's system topology, authentication sequence, kinetic escalation lifecycle, telematics data flow, and failure fallback modes.

---

## 1. End-to-End System Topography

```mermaid
flowchart TD
    subgraph BrowserClient ["Browser Client (React 19 SPA)"]
        subgraph Routes ["Lazy-Loaded Routes"]
            R_LOGIN["/login (LoginPage)"]
            R_OP["/operator (OperatorPage)"]
            R_BOARD["/board (TriageBoardPage)"]
            R_ROOM["/room/:guid (RoomPage)"]
            R_TWIN["/twin (DigitalTwinPage)"]
            R_REP["/report/:guid (ServiceReportPage)"]
        end

        subgraph ClientServices ["Client Subsystems & SDKs"]
            CC_CHAT["CometChat Chat SDK v4.2.0"]
            CC_CALLS["CometChat Calls SDK v5.0.6 (Lazy)"]
            THREE_ENG["Three.js 0.187.0 WebGL Engine"]
            TELEMETRY_EMIT["Synthetic J1939 CAN Streamer"]
            AUDIO_FX["SoundEffects (Web Audio API Synthesizer)"]
        end
    end

    subgraph NodeBackend ["Hardened Staging Backend (Node.js Express)"]
        AUTH_MW["Bearer Token Session Guard (requireAuth)"]
        RATE_LIMIT["Sliding-Window Rate Limiter"]
        SEC_HEADERS["Security Headers (CSP, HSTS, Permissions-Policy)"]
        SESSION_CACHE["In-Memory activeSessions Map (8-hr TTL)"]
        ROSTER_DB["Static Multi-Tenant Roster (server/roster.js)"]
        INCIDENT_MEM["Local Incident Registry (server/incidents.js)"]
        FALLBACK_HEUR["Deterministic Offline Diagnostics Engine"]
    end

    subgraph ExternalCloud ["External Managed Services"]
        CC_API["CometChat REST Cloud API (v3)"]
        CC_SIGNAL["CometChat WebRTC Signaling & Media Bridge"]
        GEMINI_API["Google Gemini Multimodal API (v1beta)"]
    end

    %% Client to Backend
    BrowserClient -- "HTTPS:3443 / HTTP:3001 (Credentials, Sessions, AI Proxy)" --> SEC_HEADERS
    SEC_HEADERS --> RATE_LIMIT
    RATE_LIMIT --> AUTH_MW
    AUTH_MW --> SESSION_CACHE
    AUTH_MW --> ROSTER_DB
    AUTH_MW --> INCIDENT_MEM

    %% Backend to External
    AUTH_MW -- "POST /v3/users/{uid}/auth_tokens (API Key protected)" --> CC_API
    AUTH_MW -- "POST /models/gemini-2.5-flash:generateContent" --> GEMINI_API
    GEMINI_API -. "Fallback on Error / Timeout" .-> FALLBACK_HEUR

    %% Client Direct to Real-time Infrastructure
    CC_CHAT -- "WSS / CometChat WebSockets (Auth Token)" --> CC_API
    CC_CALLS -- "WebRTC SRTP Audio/Video Stream" --> CC_SIGNAL
```

---

## 2. Authentication & Session Minting Sequence

The client never possesses CometChat API keys or master credentials. Authentication flows through a strict two-stage process:

```mermaid
sequenceDiagram
    autonumber
    actor User as Field Operator / Specialist
    participant Client as React 19 Frontend
    participant Server as Staging Server (server/index.js)
    participant CometChat as CometChat REST API

    User->>Client: Selects User & Enters PIN
    Client->>Server: POST /api/auth/login { uid, accessPin, companyId }
    Server->>Server: Validate Credentials & Company Tenant
    alt Invalid Credentials
        Server-->>Client: 401 UNAUTHORIZED / 403 FORBIDDEN
        Client-->>User: Visual Error Shake & Banner
    else Valid Credentials
        Server->>CometChat: POST /v3/users/{uid}/auth_tokens (Header: apiKey)
        CometChat-->>Server: Return { authToken }
        Server->>Server: Mint cryptographically secure sessionToken
        Server->>Server: Cache in activeSessions map with 8-hr expiration
        Server-->>Client: 200 OK { user, sessionToken, cometChatAuthToken }
        Client->>Client: Store sessionToken in sessionStorage
        Client->>CometChat: CometChat.login(authToken)
        CometChat-->>Client: User Session Active
        Client-->>User: Navigate to /operator or /board
    end
```

---

## 3. Kinetic Escalation Modality Lifecycle

RescueRoom transitions across synchronous and asynchronous communication channels within the active incident room:

```mermaid
stateDiagram-v2
    [*] --> TickerChat: Operator Dispatches Incident Room

    state TickerChat {
        [*] --> TextStream
        TextStream: Alphanumeric messages & telemetry alerts
        TextStream: CometChat TextMessage & CustomMessage (telemetry)
        TextStream --> AudioBeep: Web Audio synthetic chime on message
    }

    TickerChat --> VoiceRadio: Incident Commander escalates to VOICE
    
    state VoiceRadio {
        [*] --> AudioOnlyCall
        AudioOnlyCall: CometChatCalls.startCall({ audioOnly: true })
        AudioOnlyCall: Dynamic chunk vendor-cometchat-calls loaded
        AudioOnlyCall: Half-duplex tactical radio overlay
    }

    VoiceRadio --> OpticalVideo: Field specialist requires visual inspection
    
    state OpticalVideo {
        [*] --> FullVideoCall
        FullVideoCall: CometChatCalls.startCall({ audioOnly: false })
        FullVideoCall: Local & Remote WebRTC video tiles displayed
        FullVideoCall: Optical freeze-frame capture enabled
    }

    OpticalVideo --> VoiceRadio: De-escalate video to conserve bandwidth
    VoiceRadio --> TickerChat: Call ended (summary logged to audit trail)
    OpticalVideo --> TickerChat: Direct call termination
    TickerChat --> ServiceReport: Incident resolved -> FORM-RR-808 generated
    ServiceReport --> [*]
```

---

## 4. Dual-Engine Diagnostic Pipeline (Gemini + Offline Heuristics)

RescueRoom ensures uninterrupted field operations through deterministic local failover if the remote AI model is unreachable:

```mermaid
flowchart LR
    subgraph Trigger ["Diagnostic Requisition"]
        REQ["Incident Context, Telemetry JSON & Optical Capture"]
    end

    subgraph BackendProxy ["Server /api/gemini/analyze"]
        CHECK_KEY{"GEMINI_API_KEY Configured?"}
        CALL_GEMINI["Dispatch POST to Gemini 2.5 Flash"]
        PARSER{"Valid JSON Response?"}
        HEURISTIC["Run Deterministic Heuristics Engine (server/heuristics.js)"]
    end

    subgraph Output ["Client Diagnostic Modal"]
        PANELS["Display 4 Diagnostic Panels:\n1. Root Cause Forensics\n2. LOTO Safety Steps\n3. Torque Tolerances\n4. Field Config Overrides"]
    end

    REQ --> CHECK_KEY
    CHECK_KEY -- Yes --> CALL_GEMINI
    CHECK_KEY -- No (Offline Mode) --> HEURISTIC
    CALL_GEMINI -- Success --> PARSER
    CALL_GEMINI -- Timeout / 5xx / Rate-Limit --> HEURISTIC
    PARSER -- Valid --> PANELS
    PARSER -- Malformed Schema --> HEURISTIC
    HEURISTIC --> PANELS
```

---

## 5. Telematics & 3D Digital Twin Data Flow

```mermaid
flowchart TD
    subgraph CAN_Generator ["Telemetry Engine (src/utils/telemetry.js)"]
        CAN_SIM["Simulated J1939 CAN-bus Generator"]
        CAN_SIM -->|PGN 61444| ENG_RPM["Engine Speed & Load (SPN 190)"]
        CAN_SIM -->|PGN 65262| COOL_TEMP["Coolant Temperature (SPN 110)"]
        CAN_SIM -->|PGN 65279| HYD_PRES["Hydraulic Rail Pressure (SPN 157)"]
        CAN_SIM -->|PGN 65226| DTC_ACTIVE["Active Diagnostic Trouble Codes (DM1)"]
    end

    subgraph Sync_Layer ["Telemetry Broadcast Channel"]
        COMET_BROADCAST["CometChat CustomMessage (category: telemetry)"]
        STATE_STORE["React Component State (useTelemetry hook)"]
    end

    subgraph Twin_Visualizer ["Digital Twin Narrative (src/pages/DigitalTwinPage.jsx)"]
        SCROLL_OBS["Scroll-Driven Timeline Observer (Stages 1 to 6)"]
        SHADER_MAT["Custom WebGL Shaders (PBR, Wireframe, Heat Dissipation)"]
        THREE_SCENE["Three.js Scene Graph (Engine Block, Turbo, Hydraulics, Chassis)"]
        HUD_OVERLAY["Tactical Metric Gauges & Diagnostic Badges"]
    end

    CAN_Generator --> COMET_BROADCAST
    CAN_Generator --> STATE_STORE
    STATE_STORE --> HUD_OVERLAY
    STATE_STORE --> SHADER_MAT
    SCROLL_OBS --> THREE_SCENE
    SHADER_MAT --> THREE_SCENE
```
