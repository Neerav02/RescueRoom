# RescueRoom API Reference

This document provides a comprehensive contract specification for all endpoints exposed by the RescueRoom hardened backend server (`server/index.js`).

---

## Global Headers & Security Conventions

All API requests and responses adhere to the following conventions:

- **Base URLs:**
  - HTTP Staging: `http://localhost:3001`
  - HTTPS Staging: `https://localhost:3443`
- **Standard Request Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <sessionToken>` (Required for all protected routes)
  - `x-session-token: <sessionToken>` (Accepted alternative to Authorization header)
- **Standard Defense-in-Depth Response Headers:**
  - `Content-Type: application/json; charset=utf-8`
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: SAMEORIGIN`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(self), microphone=(self), geolocation=()`
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains` (HTTPS only)
- **Error Format:**
  ```json
  {
    "ok": false,
    "error": "Human-readable description of the error",
    "code": "MACHINE_READABLE_ERROR_CODE"
  }
  ```

---

## 1. System Health Check

### `GET /api/health`
Inspects server runtime status, active sessions count, uptime, and configured security flags.

- **Authentication:** None (Public)
- **Rate Limit:** Unrestricted

#### Success Response (`200 OK`)
```json
{
  "status": "healthy",
  "service": "RescueRoom Staging Backend",
  "version": "1.0.0",
  "uptimeSeconds": 1842,
  "activeSessions": 1,
  "timestamp": "2026-11-16T03:45:00.000Z",
  "security": {
    "cometchatConfigured": true,
    "geminiConfigured": true,
    "strictTenantIsolation": true,
    "sessionAuthenticationRequired": true,
    "rateLimitingActive": true,
    "httpsActive": true,
    "transport": "https"
  }
}
```

---

## 2. Personnel Authentication

### `POST /api/auth/login`
Authenticates a user against the corporate roster, mints a CometChat user auth token via CometChat REST API v3, and generates an 8-hour session token.

- **Authentication:** None (Public login gate)
- **Rate Limit:** 10 requests / minute / IP (HTTP 429)

#### Request Body
```json
{
  "uid": "northwind_asha",
  "accessPin": "1091",
  "companyId": "northwind"
}
```

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `uid` | string | Yes | Unique personnel identifier from roster |
| `accessPin` | string | Yes | 4-digit security PIN |
| `companyId` | string | Optional | Corporate tenant verification check |

#### Success Response (`200 OK`)
```json
{
  "ok": true,
  "sessionToken": "rr_sess_a8f9b2c3d4e5f601...",
  "authToken": "cometchat_auth_token_string",
  "devFallback": false,
  "user": {
    "uid": "northwind_asha",
    "name": "Asha Patel",
    "role": "operator",
    "companyId": "northwind",
    "companyName": "Northwind Heavy Equipment",
    "callsign": "OP-NORTH-01",
    "tagline": "Heavy Excavator Lead Operator"
  },
  "expiresAt": 1794787200000
}
```

#### Error Responses
- `400 BAD REQUEST` (`CREDENTIALS_MISSING`): Missing `uid` or `accessPin`.
- `401 UNAUTHORIZED` (`INVALID_CREDENTIALS` | `USER_NOT_FOUND`): Invalid PIN or unknown UID.
- `403 FORBIDDEN` (`TENANT_MISMATCH`): User exists but companyId does not match.
- `429 TOO MANY REQUESTS` (`RATE_LIMIT_EXCEEDED`): Exceeded 10 attempts/min. Includes `Retry-After`.

---

## 3. Scoped Token Retrieval & Impersonation Guard

### `POST /api/auth/token`
Retrieves or refreshes a CometChat auth token for the authenticated user. Guarantees that users cannot obtain tokens for arbitrary UIDs.

- **Authentication:** Required (`Authorization: Bearer <sessionToken>`)
- **Rate Limit:** 30 requests / minute / IP (HTTP 429)

#### Request Body (Optional)
```json
{
  "uid": "northwind_asha",
  "companyId": "northwind"
}
```
*Note: If `uid` is supplied in the request body, the server asserts that it exactly matches the authenticated session's UID.*

#### Success Response (`200 OK`)
```json
{
  "ok": true,
  "authToken": "cometchat_auth_token_string",
  "uid": "northwind_asha",
  "companyId": "northwind",
  "user": {
    "uid": "northwind_asha",
    "name": "Asha Patel",
    "role": "operator",
    "companyId": "northwind"
  }
}
```

#### Error Responses
- `401 UNAUTHORIZED` (`UNAUTHENTICATED` | `SESSION_EXPIRED` | `SESSION_REVOKED`): Session invalid, expired, or missing.
- `403 FORBIDDEN` (`IMPERSONATION_DETECTED`): Client requested token for a UID different from the authenticated session.
- `403 FORBIDDEN` (`FORBIDDEN_CROSS_TENANT`): Client requested token for a different tenant company.

---

## 4. Session Revocation (Logout)

### `POST /api/auth/logout`
Destroys the server-side session from `activeSessions` and invokes the CometChat REST API to revoke the user's CometChat auth token.

- **Authentication:** Optional (Idempotent cleanup)
- **Rate Limit:** Unrestricted

#### Headers
```http
Authorization: Bearer <sessionToken>
```

#### Success Response (`200 OK`)
```json
{
  "ok": true,
  "message": "Session and associated credentials successfully revoked."
}
```

---

## 5. Server-Enforced Tenant Incident Authorization

### `POST /api/auth/authorize-tenant`
Verifies whether an authenticated personnel member is permitted to access a specific incident room GUID or report.

- **Authentication:** Required (`Authorization: Bearer <sessionToken>`)
- **Rate Limit:** Unrestricted

#### Request Body
```json
{
  "guid": "northwind_inc_4821"
}
```

#### Success Response (`200 OK`)
```json
{
  "authorized": true,
  "guid": "northwind_inc_4821",
  "companyId": "northwind",
  "uid": "northwind_asha"
}
```

#### Error Responses
- `401 UNAUTHORIZED`: No active session provided.
- `403 FORBIDDEN` (`CROSS_TENANT_VIOLATION`): Incident GUID does not match the session user's `companyId`.
  ```json
  {
    "authorized": false,
    "error": "Cross-tenant access violation: Incident room does not belong to your company.",
    "code": "CROSS_TENANT_VIOLATION"
  }
  ```

---

## 6. Protected Multimodal AI Analysis

### `POST /api/gemini/analyze`
Proxies optical failure images and machinery telematics to Google Gemini 2.5 Flash Vision. If Gemini is unreachable, times out, or lacks credentials, the endpoint deterministically fails over to the local tactical heuristic engine.

- **Authentication:** Required (`Authorization: Bearer <sessionToken>`)
- **Rate Limit:** 20 requests / minute / IP (HTTP 429)

#### Request Body
```json
{
  "imageUrl": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "fileData": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "mimeType": "image/jpeg",
  "equipment": "Excavator EX-204",
  "incidentDescription": "Hydraulic pressure loss on primary boom lift cylinder",
  "incidentGuid": "northwind_inc_4821"
}
```

#### Optional Headers
- `x-gemini-api-key`: Client-supplied Gemini API key override (for developer test sessions).

#### Success Response (`200 OK`)
```json
{
  "ok": true,
  "diagnosis": {
    "componentIdentified": "High-Pressure 4-Spiral Hydraulic Hose SAE 100R15",
    "failureMode": "Carcass burst resulting from wire reinforcement fatigue and impulse spike",
    "failureMechanics": [
      "Abrasive chafing on boom guide compromised outer cover",
      "Dynamic pressure spikes exceeded 350 bar threshold",
      "Catastrophic hydraulic fluid blowout"
    ],
    "severityAssessment": "CRITICAL - IMMEDIATE STOPPAGE",
    "immediateHazard": "Severe high-pressure fluid injection hazard (340+ bar)",
    "oemParts": [
      { "partNumber": "CAT-154-8291", "name": "Arm Cylinder Flex Hose", "cost": "$340.00", "leadTime": "In Stock" }
    ],
    "requiredTools": [
      "36mm Open-End Hydraulic Service Wrench",
      "Calibrated Torque Wrench (50-250 Nm)"
    ],
    "torqueSpecifications": [
      { "item": "Flange Head Bolts", "spec": "145 Nm (107 ft-lb)", "lube": "Clean Engine Oil" }
    ],
    "lotoChecklist": [
      "Lower boom and bucket completely to ground.",
      "Shut down engine and cycle joysticks 15 times to relieve accumulator pressure.",
      "Engage master battery disconnect switch and padlock.",
      "Attach Danger / Do Not Operate tag."
    ],
    "confidenceScore": 96,
    "recommendedAction": "Isolate hydraulic accumulator and replace failed hose segment before restarting prime mover.",
    "source": "GOOGLE_GEMINI_2_5_FLASH",
    "model": "Gemini 2.5 Flash Vision (Server Proxied)",
    "timestamp": "2026-11-16T03:50:00.000Z"
  }
}
```

#### Deterministic Fallback Response (`200 OK`)
When Gemini credentials are not supplied or the remote API fails:
```json
{
  "ok": true,
  "diagnosis": {
    "componentIdentified": "Excavator EX-204 Hydraulic Subsystem",
    "failureMode": "Tactical Heuristic Diagnosis: Severe pressure collapse detected.",
    "severityAssessment": "CRITICAL - IMMEDIATE STOPPAGE",
    "notice": "Tactical Forensics Heuristic Engine engaged (No GEMINI_API_KEY configured).",
    "source": "TACTICAL_HEURISTIC_ENGINE"
  }
}
```
