# RescueRoom Security Architecture & Audit Report

This document outlines the security controls, authentication safeguards, threat mitigations, and compliance postures implemented across the RescueRoom platform.

---

## 1. Security Architecture Principles

RescueRoom protects mission-critical industrial operational data and communications through five core defense layers:

1. **Zero Privileged Secrets in Frontend:** The client bundle contains zero API keys or administrative credentials. Privileged CometChat API keys and Google Gemini API keys exist strictly within the server environment.
2. **Server-Side Identity Custody:** Client UIDs are never trusted. All privileged requests derive caller identity and corporate tenancy directly from a cryptographically signed server session.
3. **Multi-Tenant Partitioning:** Strict logical segregation between corporate tenants (`northwind` vs. `kestrel`). Cross-tenant access is blocked at the HTTP middleware layer.
4. **Resilient Session Lifecycle:** Sessions are bound to 8-hour operational shift windows, tracked in-memory, cleaned via background garbage collection, and explicitly revoked upon logout.
5. **Abuse Protection & Rate Limiting:** Sliding-window per-IP rate limiters protect authentication, token issuance, and AI endpoints against brute force, denial of service, and resource exhaustion.

---

## 2. Authentication & Authorization Controls

### 2.1 Server-Side Authentication (`/api/auth/login`)
- Personnel authenticate using their assigned UID, company ID, and 4-digit security PIN (`src/lib/roster.js`).
- PINs are verified on the server.
- Upon successful authentication, the server generates a cryptographically secure session token:
  $$\text{token} = \text{"rr\_sess\_"} + \text{crypto.randomBytes(32).toString('hex')}$$
- The session is stored in the server's `activeSessions` map with an expiration timestamp ($T + 8\text{ hours}$).

### 2.2 UID Impersonation Guard (`/api/auth/token`)
- Endpoints requiring tokens require an active session (`Authorization: Bearer <sessionToken>`).
- If an unauthenticated client requests a token, the server returns `401 UNAUTHENTICATED`.
- If a client provides a request body containing a `uid` that differs from `session.uid`, the server logs a security alert and returns `403 FORBIDDEN` (`IMPERSONATION_DETECTED`).
- A user cannot request or refresh tokens on behalf of another operator.

### 2.3 Server-Side Tenant Isolation (`/api/auth/authorize-tenant`)
- Incident rooms adhere to the pattern `{companyId}_inc_{incidentNum}`.
- Before opening `/room/:guid` or `/report/:guid`, client components invoke `/api/auth/authorize-tenant`.
- The server checks whether `guid.startsWith(session.companyId + '_inc_')`.
- If a `kestrel_*` user attempts to access a `northwind_*` room, access is rejected with `403 FORBIDDEN` (`CROSS_TENANT_VIOLATION`).

### 2.4 Credential & Session Revocation (`/api/auth/logout`)
- Logging out immediately purges the session from `activeSessions`.
- If CometChat REST credentials are configured, the server executes `DELETE /v3/users/{uid}/auth_tokens/{authToken}` to invalidate the token at the CometChat cloud gateway.
- Client storage (`rescueroom_user`, `rescueroom_session_token`, `cometchat_auth_token`) is purged.

---

## 3. Defense-in-Depth HTTP Headers

The server injects defense-in-depth headers into all HTTP and HTTPS responses:

| Header | Configured Value | Security Purpose |
| :--- | :--- | :--- |
| `Content-Security-Policy` | `default-src 'self' ... connect-src 'self' https://*.cometchat.io wss://*.cometchat.io ...` | Restricts script execution and unauthorized outbound network calls. |
| `Permissions-Policy` | `camera=(self), microphone=(self), geolocation=()` | Restricts hardware access strictly to current origin for WebRTC calls. |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Enforces HTTPS transport encryption on staging/production (RFC 6797). |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME-type confusion attacks. |
| `X-Frame-Options` | `SAMEORIGIN` | Mitigates clickjacking attacks. |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Prevents credential and GUID leakage in referrer headers. |

---

## 4. Rate Limiting Matrix

The backend enforces sliding-window rate limits per client IP:

| Endpoint | Max Requests | Window | On Exceeded |
| :--- | :--- | :--- | :--- |
| `/api/auth/login` | 10 requests | 60 seconds | `429 Too Many Requests` + `Retry-After` |
| `/api/auth/token` | 30 requests | 60 seconds | `429 Too Many Requests` + `Retry-After` |
| `/api/gemini/analyze` | 20 requests | 60 seconds | `429 Too Many Requests` + `Retry-After` |

---

## 5. Dependency & Supply Chain Security

- **Vulnerability Scanner:** `npm audit` executed regularly.
- **Current Status:** **0 vulnerabilities** across all runtime and build dependencies.
- **Vite Hardening:** Upgraded to `vite@8.3.8` to eliminate reported devDependency vulnerabilities in legacy Vite 8.3.x releases.
- **Static Analysis:** `oxlint` executed with 104 security and correctness rules: **0 warnings, 0 errors**.

---

## 6. Known Security Boundaries & Recommendations

1. **Staging TLS Certificates:** The staging server includes auto-generated local development certificates in `server/certs/`. In enterprise production, terminate TLS at an upstream Load Balancer or NGINX ingress with valid certificates.
2. **In-Memory Session Store:** Active sessions are held in a Node.js `Map`. For multi-instance clustered production deployments, back sessions with a distributed Redis or KeyDB cluster.
3. **Multi-Tenant Static Roster:** Roster credentials are currently mapped in code (`src/lib/roster.js`). For enterprise deployments, federate with SAML 2.0 / OpenID Connect (Okta, Azure AD, PingFederate).
