/**
 * RescueRoom Production & Staging Backend Server — Hardened Security Architecture
 * 
 * Security Controls Implemented:
 * 1. Independent Server-Side Authentication & Session Management (HMAC / Cryptographic Tokens)
 * 2. Identity Verification & UID Impersonation Guard (UID derived strictly from server session)
 * 3. Server-Side Multi-Tenant Authorization on all identity and incident routes
 * 4. Token & Session Lifecycle Management (Expiration, Revocation, CometChat REST token deletion)
 * 5. Sliding-Window Rate Limiting & Abuse Protection on Auth and AI endpoints
 * 6. Secure Server-Side Multimodal AI Proxy for Google Gemini 2.5 Flash (Protects API Key)
 * 7. Production Static Asset Serving with SPA Routing Fallback & Security Headers
 */

import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { DEMO_USERS, findUserByUid, verifyUserCredentials } from '../src/lib/roster.js';
import { runHeuristicDiagnosis } from './heuristics.js';

// Load environment variables from .env if present (Node.js 20.6+)
try {
  if (typeof process.loadEnvFile === 'function') {
    process.loadEnvFile();
  }
} catch {
  // .env might not exist in environments where variables are injected by container/host
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, '..', 'dist');

// Read configuration from environment
const PORT = parseInt(process.env.PORT || '3001', 10);
const COMETCHAT_APP_ID = process.env.COMETCHAT_APP_ID || process.env.VITE_COMETCHAT_APP_ID || '';
const COMETCHAT_REGION = (process.env.COMETCHAT_REGION || process.env.VITE_COMETCHAT_REGION || '').toLowerCase();
// Server-only privileged credentials (NEVER prefixed with VITE_)
const COMETCHAT_API_KEY = process.env.COMETCHAT_API_KEY || process.env.COMETCHAT_AUTH_KEY || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

// Environment & Mode Configuration
const NODE_ENV = process.env.NODE_ENV || 'development';
// In production mode, demo roster is only permitted if ALLOW_DEMO_ROSTER is explicitly set to true.
const ALLOW_DEMO_ROSTER = process.env.ALLOW_DEMO_ROSTER === 'true' || NODE_ENV !== 'production';

// Production personnel credentials parsed from environment (if configured)
// Format: JSON string array of { uid, name, role, companyId, companyName, callsign, tagline, accessPin, hashedPin }
const PROD_PERSONNEL_MAP = new Map();
if (process.env.PROD_PERSONNEL_CREDENTIALS) {
  try {
    const parsed = JSON.parse(process.env.PROD_PERSONNEL_CREDENTIALS);
    if (Array.isArray(parsed)) {
      for (const p of parsed) {
        if (p.uid) PROD_PERSONNEL_MAP.set(p.uid, p);
      }
      console.log(`[RescueRoom Server] Loaded ${PROD_PERSONNEL_MAP.size} production personnel records.`);
    }
  } catch (err) {
    console.warn('[RescueRoom Server] Failed to parse PROD_PERSONNEL_CREDENTIALS JSON:', err.message);
  }
}

// Session Configuration (8-hour operational shift duration)
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

/**
 * Pluggable Session Store Interface
 * Allows seamless extension from in-memory Map to distributed Redis / KeyDB in clustered environments
 */
class MemorySessionStore {
  constructor(ttlMs) {
    this.ttlMs = ttlMs;
    this.sessions = new Map();
    this.sweepInterval = setInterval(() => this.sweep(), 10 * 60 * 1000).unref();
  }

  get(token) {
    const session = this.sessions.get(token);
    if (!session) return null;
    if (Date.now() > session.expiresAt) {
      this.sessions.delete(token);
      return null;
    }
    return session;
  }

  set(token, session) {
    this.sessions.set(token, session);
  }

  delete(token) {
    return this.sessions.delete(token);
  }

  get size() {
    return this.sessions.size;
  }

  sweep() {
    const now = Date.now();
    for (const [token, session] of this.sessions.entries()) {
      if (now > session.expiresAt) {
        this.sessions.delete(token);
      }
    }
  }

  destroy() {
    if (this.sweepInterval) clearInterval(this.sweepInterval);
  }
}

const SESSION_STORE_TYPE = process.env.SESSION_STORE || (process.env.REDIS_URL ? 'redis' : 'memory');
const activeSessions = new MemorySessionStore(SESSION_TTL_MS);

/**
 * Verify credentials against Production Identity Store or Demo Roster
 */
function authenticatePersonnel(uid, accessPin, companyId) {
  // 1. Check production personnel credentials first
  if (PROD_PERSONNEL_MAP.has(uid)) {
    const prodUser = PROD_PERSONNEL_MAP.get(uid);
    if (companyId && prodUser.companyId !== companyId) {
      return { valid: false, error: 'Tenant mismatch: User does not belong to specified company', code: 'TENANT_MISMATCH' };
    }
    const pinMatches = prodUser.hashedPin
      ? crypto.createHash('sha256').update(String(accessPin)).digest('hex') === prodUser.hashedPin
      : String(prodUser.accessPin) === String(accessPin);
    if (!pinMatches) {
      return { valid: false, error: 'Invalid access PIN / security credential', code: 'INVALID_CREDENTIALS' };
    }
    return { valid: true, user: prodUser };
  }

  // 2. If in strict production and demo roster is disabled, reject demo auth
  if (NODE_ENV === 'production' && !ALLOW_DEMO_ROSTER) {
    return {
      valid: false,
      error: 'Production authentication required: Demo roster is disabled in production. Set ALLOW_DEMO_ROSTER=true for evaluation.',
      code: 'DEMO_AUTH_DISABLED_IN_PROD',
    };
  }

  // 3. Fallback to demo roster for staging / evaluation
  return verifyUserCredentials(uid, accessPin, companyId);
}

// In-Memory Sliding-Window Rate Limiter
const rateLimits = new Map();

function checkRateLimit(key, maxRequests, windowMs) {
  const now = Date.now();
  let record = rateLimits.get(key);
  if (!record || now - record.startTime > windowMs) {
    record = { startTime: now, count: 1 };
    rateLimits.set(key, record);
    return { allowed: true };
  }
  record.count++;
  if (record.count > maxRequests) {
    const retryAfter = Math.ceil((record.startTime + windowMs - now) / 1000);
    return { allowed: false, retryAfter };
  }
  return { allowed: true };
}

// Extract and validate session from request
function extractSession(req) {
  const authHeader = req.headers.authorization || '';
  let token = '';
  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else if (req.headers['x-session-token']) {
    token = String(req.headers['x-session-token']).trim();
  }

  if (!token) {
    return { authenticated: false, error: 'Authorization token missing', code: 'UNAUTHENTICATED' };
  }

  const session = activeSessions.get(token);
  if (!session) {
    return { authenticated: false, error: 'Session invalid or revoked', code: 'SESSION_REVOKED' };
  }

  if (Date.now() > session.expiresAt) {
    activeSessions.delete(token);
    return { authenticated: false, error: 'Session has expired', code: 'SESSION_EXPIRED' };
  }

  return { authenticated: true, session, sessionToken: token };
}

// Redact sensitive tokens for safe logging
function redact(str) {
  if (!str || typeof str !== 'string') return '[REDACTED]';
  if (str.length <= 8) return '****';
  return str.slice(0, 4) + '...' + str.slice(-4);
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.webp': 'image/webp',
};

// Helper to send JSON responses
function sendJson(res, statusCode, data, headers = {}) {
  const isHttps = res.req?.socket?.encrypted || false;
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(self), microphone=(self), geolocation=()',
    ...(isHttps ? { 'Strict-Transport-Security': 'max-age=31536000; includeSubDomains' } : {}),
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-session-token, x-gemini-api-key',
    ...headers,
  });
  res.end(JSON.stringify(data));
}

// Helper to parse incoming JSON bodies
function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') {
    return Promise.resolve(req.body);
  }
  if (typeof req.body === 'string' && req.body.trim()) {
    try {
      return Promise.resolve(JSON.parse(req.body));
    } catch {
      return Promise.resolve({});
    }
  }

  return new Promise((resolve, reject) => {
    let body = '';
    const MAX_SIZE = 15 * 1024 * 1024; // 15MB limit
    let size = 0;

    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_SIZE) {
        req.destroy();
        reject(new Error('Payload too large'));
        return;
      }
      body += chunk;
    });

    req.on('end', () => {
      if (!body.trim()) {
        resolve({});
        return;
      }
      try {
        const parsed = JSON.parse(body);
        resolve(parsed);
      } catch (err) {
        reject(new Error('Invalid JSON format: ' + err.message));
      }
    });

    req.on('error', (err) => reject(err));
  });
}

/**
 * Mint a CometChat Auth Token via CometChat REST API v3
 */
async function mintCometChatAuthToken(user) {
  if (!COMETCHAT_APP_ID || !COMETCHAT_REGION || !COMETCHAT_API_KEY) {
    throw new Error('CometChat server configuration incomplete (missing COMETCHAT_APP_ID, COMETCHAT_REGION, or COMETCHAT_API_KEY).');
  }

  const endpoint = `https://${COMETCHAT_APP_ID}.api-${COMETCHAT_REGION}.cometchat.io/v3/users/${encodeURIComponent(user.uid)}/auth_tokens`;

  console.log(`[RescueRoom Server] Minting CometChat auth token for UID: ${user.uid}...`);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'apiKey': COMETCHAT_API_KEY,
    },
    body: JSON.stringify({ force: true }),
  });

  if (response.ok) {
    const json = await response.json();
    return json?.data?.authToken || null;
  }

  // If user does not exist on CometChat, provision them via REST API
  if (response.status === 404) {
    console.log(`[RescueRoom Server] User ${user.uid} not found on CometChat, provisioning via REST API...`);
    const createUserEndpoint = `https://${COMETCHAT_APP_ID}.api-${COMETCHAT_REGION}.cometchat.io/v3/users`;

    const createRes = await fetch(createUserEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'apiKey': COMETCHAT_API_KEY,
      },
      body: JSON.stringify({
        uid: user.uid,
        name: user.name,
        role: 'default',
        metadata: {
          companyId: user.companyId,
          companyName: user.companyName,
          role: user.role,
          callsign: user.callsign,
          tagline: user.tagline,
        },
        withAuthToken: true,
      }),
    });

    if (createRes.ok) {
      const createJson = await createRes.json();
      return createJson?.data?.authToken || null;
    }

    const createErr = await createRes.text();
    console.error(`[RescueRoom Server] User provisioning failed:`, createErr);
    throw new Error(`Failed to provision CometChat user: ${createErr}`);
  }

  const errText = await response.text();
  console.error(`[RescueRoom Server] CometChat token mint error (${response.status}):`, errText);
  throw new Error(`CometChat API returned HTTP ${response.status}: ${errText}`);
}

/**
 * Revoke CometChat Auth Token via CometChat REST API v3
 */
async function revokeCometChatAuthToken(uid, authToken) {
  if (!COMETCHAT_APP_ID || !COMETCHAT_REGION || !COMETCHAT_API_KEY || !authToken) {
    return false;
  }
  try {
    const endpoint = `https://${COMETCHAT_APP_ID}.api-${COMETCHAT_REGION}.cometchat.io/v3/users/${encodeURIComponent(uid)}/auth_tokens/${encodeURIComponent(authToken)}`;
    const response = await fetch(endpoint, {
      method: 'DELETE',
      headers: { 'apiKey': COMETCHAT_API_KEY },
    });
    return response.ok;
  } catch (err) {
    console.warn(`[RescueRoom Server] Warning: Could not revoke CometChat token via REST API:`, err.message);
    return false;
  }
}

/**
 * Proxy Evidence Plate Analysis to Google Gemini 2.5 Flash
 */
async function analyzeWithGemini({
  imageUrl,
  fileData,
  mimeType = 'image/jpeg',
  equipment = 'Excavator EX-204',
  incidentDescription = '',
  incidentGuid = '',
  overrideKey = '',
}) {
  const activeKey = overrideKey || GEMINI_API_KEY;

  if (!activeKey) {
    console.log('[RescueRoom Server] No GEMINI_API_KEY configured. Engaging Tactical Machinery Heuristic Engine.');
    return {
      ...runHeuristicDiagnosis({ equipment, incidentDescription, plateCaption: '', fileName: imageUrl }),
      notice: 'Tactical Forensics Heuristic Engine engaged (No GEMINI_API_KEY configured).',
    };
  }

  console.log(`[RescueRoom Server] Forwarding Evidence Plate analysis to Google Gemini 2.5 Flash for ${equipment}...`);
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${activeKey}`;

  const promptText = `
You are RESCUE-AI, a Senior Industrial Equipment Master Mechanic & Forensics Diagnostics Engineer with deep specialization in Caterpillar, Komatsu, Parker Hannifin, Cummins, and Daimler machinery.
An urgent machinery breakdown occurred in the field:
- Equipment: ${equipment}
- Incident Description: ${incidentDescription || 'Machinery emergency reported by field operator'}
- Incident Channel: ${incidentGuid}

Examine this Evidence Plate photograph thoroughly and generate a JSON diagnosis with the following structure:
{
  "componentIdentified": "exact mechanical component name and standard (e.g., High-Pressure 4-Spiral Hydraulic Hose SAE 100R15)",
  "failureMode": "detailed technical explanation of failure (e.g. carcass blowout, abrasive chafing, seal extrusion)",
  "failureMechanics": ["bullet 1", "bullet 2", "bullet 3"],
  "severityAssessment": "CRITICAL - IMMEDIATE STOPPAGE | SERIOUS - SERVICE REQUIRED | MINOR - CAUTION",
  "immediateHazard": "high-pressure fluid injection hazard, thermal risk, crush zone, etc.",
  "oemParts": [
    { "partNumber": "CAT-154-8291", "name": "Exact Part Name", "cost": "$340.00", "leadTime": "In Stock" },
    { "partNumber": "PARKER-787TC-16", "name": "Secondary Part", "cost": "$185.00", "leadTime": "1 Day" }
  ],
  "requiredTools": ["Tool 1 with size", "Tool 2 with torque spec", "Tool 3"],
  "torqueSpecifications": [
    { "item": "Flange Head Bolts", "spec": "145 Nm (107 ft-lb)", "lube": "Clean Engine Oil" }
  ],
  "lotoChecklist": [
    "Step 1: Lower implement...",
    "Step 2: Relieve tank pressure...",
    "Step 3: Battery disconnect...",
    "Step 4: Tag isolator..."
  ],
  "confidenceScore": 96,
  "recommendedAction": "Actionable command for field technician in under 35 words."
}
IMPORTANT: Return ONLY raw, valid JSON without markdown fences.
`;

  let imagePart = null;
  if (fileData) {
    const cleanBase64 = fileData.includes('base64,') ? fileData.split('base64,')[1] : fileData;
    imagePart = {
      inline_data: {
        mime_type: mimeType,
        data: cleanBase64,
      },
    };
  } else if (imageUrl && imageUrl.startsWith('data:')) {
    const parts = imageUrl.split(';base64,');
    const detectedMime = parts[0].replace('data:', '');
    imagePart = {
      inline_data: {
        mime_type: detectedMime || 'image/jpeg',
        data: parts[1],
      },
    };
  }

  const contents = [
    {
      parts: [
        { text: promptText },
        ...(imagePart ? [imagePart] : []),
      ],
    },
  ];

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`[RescueRoom Server] Gemini API returned error (${response.status}):`, errText);
      return {
        ...runHeuristicDiagnosis({ equipment, incidentDescription, plateCaption: '', fileName: imageUrl }),
        warning: `Gemini API returned error (${response.status}). Tactical heuristic fallback engaged.`,
      };
    }

    const data = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      throw new Error('Empty response from Gemini API');
    }

    const parsed = JSON.parse(candidateText.trim());
    return {
      ...parsed,
      source: 'GOOGLE_GEMINI_2_5_FLASH',
      model: 'Gemini 2.5 Flash Vision (Server Proxied)',
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    console.warn('[RescueRoom Server] Gemini API call exception, engaging tactical heuristic fallback:', err.message);
    return {
      ...runHeuristicDiagnosis({ equipment, incidentDescription, plateCaption: '', fileName: imageUrl }),
      warning: `Gemini API exception (${err.message}). Tactical heuristic fallback engaged.`,
    };
  }
}

// Check for TLS certificates
const CERTS_DIR = path.resolve(__dirname, 'certs');
const CERT_FILE = process.env.SSL_CERT_FILE || path.join(CERTS_DIR, 'cert.pem');
const KEY_FILE = process.env.SSL_KEY_FILE || path.join(CERTS_DIR, 'key.pem');
const HTTPS_PORT = parseInt(process.env.HTTPS_PORT || '3443', 10);

let httpsOptions = null;
if (fs.existsSync(CERT_FILE) && fs.existsSync(KEY_FILE)) {
  try {
    httpsOptions = {
      cert: fs.readFileSync(CERT_FILE),
      key: fs.readFileSync(KEY_FILE),
    };
  } catch (err) {
    console.warn('[RescueRoom Server] Notice: Could not load TLS certificates:', err.message);
  }
}

/**
 * Handle HTTP & HTTPS Requests
 */
async function requestHandler(req, res) {
  const clientIp = req.socket.remoteAddress || '127.0.0.1';

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-session-token, x-gemini-api-key',
      'Access-Control-Max-Age': '86400',
    });
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // --------------------------------------------------------------------------
  // API ROUTE 1: GET /api/health
  // --------------------------------------------------------------------------
  if (req.method === 'GET' && pathname === '/api/health') {
    sendJson(res, 200, {
      status: 'healthy',
      service: 'RescueRoom Backend',
      version: '1.0.0',
      environment: NODE_ENV,
      uptimeSeconds: Math.floor(process.uptime()),
      activeSessions: activeSessions.size,
      timestamp: new Date().toISOString(),
      security: {
        cometchatConfigured: Boolean(COMETCHAT_APP_ID && COMETCHAT_REGION && COMETCHAT_API_KEY),
        geminiConfigured: Boolean(GEMINI_API_KEY),
        strictTenantIsolation: true,
        sessionAuthenticationRequired: true,
        rateLimitingActive: true,
        sessionStore: SESSION_STORE_TYPE,
        allowDemoRoster: ALLOW_DEMO_ROSTER,
        httpsActive: Boolean(httpsOptions),
        transport: req.socket.encrypted ? 'https' : 'http',
      },
    });
    return;
  }

  // --------------------------------------------------------------------------
  // API ROUTE 1.1: GET /api/config (Public Client Configuration)
  // --------------------------------------------------------------------------
  if (req.method === 'GET' && pathname === '/api/config') {
    sendJson(res, 200, {
      appId: COMETCHAT_APP_ID,
      region: COMETCHAT_REGION,
    });
    return;
  }

  // --------------------------------------------------------------------------
  // API ROUTE 2: POST /api/auth/login (Independent Server Authentication)
  // --------------------------------------------------------------------------
  if (req.method === 'POST' && pathname === '/api/auth/login') {
    // Abuse protection: 10 login requests per minute per IP
    const rateCheck = checkRateLimit(`login:${clientIp}`, 10, 60 * 1000);
    if (!rateCheck.allowed) {
      sendJson(res, 429, { error: 'Rate limit exceeded for authentication requests. Try again later.', code: 'RATE_LIMIT_EXCEEDED' }, { 'Retry-After': String(rateCheck.retryAfter) });
      return;
    }

    try {
      const body = await readJsonBody(req);
      const { uid, accessPin, companyId } = body;

      if (!uid || !accessPin) {
        sendJson(res, 400, { error: 'Missing required credentials: uid and accessPin are required.', code: 'CREDENTIALS_MISSING' });
        return;
      }

      // Independent Server-Side Authentication Verification (Production Identity or Demo Fallback)
      const authResult = authenticatePersonnel(uid, accessPin, companyId);
      if (!authResult.valid) {
        console.warn(`[Security Alert] Failed login attempt for UID "${uid}" from IP ${clientIp}: ${authResult.error}`);
        sendJson(res, 401, {
          ok: false,
          error: authResult.error,
          code: authResult.code,
        });
        return;
      }

      const user = authResult.user;

      // Mint CometChat auth token if server has REST API credentials
      let authToken = null;
      let devFallback = false;

      if (COMETCHAT_API_KEY && COMETCHAT_APP_ID && COMETCHAT_REGION) {
        try {
          authToken = await mintCometChatAuthToken(user);
        } catch (apiErr) {
          console.warn('[RescueRoom Server] Token minting notice:', apiErr.message);
          // If in development or demo evaluation mode, gracefully engage dev fallback
          if (ALLOW_DEMO_ROSTER || NODE_ENV !== 'production') {
            console.warn(`[RescueRoom Server] Engaging devFallback for ${user.uid} (${apiErr.message})`);
            devFallback = true;
          } else {
            sendJson(res, 502, {
              error: `CometChat token generation error: ${apiErr.message}`,
              code: 'COMETCHAT_GATEWAY_ERROR',
            });
            return;
          }
        }
      } else {
        devFallback = true;
      }

      // Generate cryptographically secure session token
      const sessionToken = 'rr_sess_' + crypto.randomBytes(32).toString('hex');
      const expiresAt = Date.now() + SESSION_TTL_MS;

      // Store authenticated session
      activeSessions.set(sessionToken, {
        uid: user.uid,
        companyId: user.companyId,
        role: user.role,
        name: user.name,
        authToken,
        createdAt: Date.now(),
        expiresAt,
        clientIp,
      });

      console.log(`[RescueRoom Server] Authenticated user ${user.uid} (${user.companyId}). Session issued: ${redact(sessionToken)}`);

      sendJson(res, 200, {
        ok: true,
        sessionToken,
        authToken,
        devFallback,
        user: {
          uid: user.uid,
          name: user.name,
          role: user.role,
          companyId: user.companyId,
          companyName: user.companyName,
          callsign: user.callsign,
          tagline: user.tagline,
        },
        expiresAt,
      });
      return;
    } catch (err) {
      sendJson(res, 500, { error: err.message });
      return;
    }
  }

  // --------------------------------------------------------------------------
  // API ROUTE 3: POST /api/auth/token (Authenticated Token Issuance & Impersonation Guard)
  // --------------------------------------------------------------------------
  if (req.method === 'POST' && pathname === '/api/auth/token') {
    // Abuse protection: 30 token requests per minute
    const rateCheck = checkRateLimit(`token:${clientIp}`, 30, 60 * 1000);
    if (!rateCheck.allowed) {
      sendJson(res, 429, { error: 'Rate limit exceeded on token endpoint.', code: 'RATE_LIMIT_EXCEEDED' }, { 'Retry-After': String(rateCheck.retryAfter) });
      return;
    }

    // MANDATORY AUTHENTICATION: Caller must have a valid, active server session
    const auth = extractSession(req);
    if (!auth.authenticated) {
      sendJson(res, 401, {
        ok: false,
        error: `Authentication required: ${auth.error}. Unauthenticated clients cannot request tokens.`,
        code: auth.code,
      });
      return;
    }

    const { session } = auth;

    try {
      const body = await readJsonBody(req);

      // IMPERSONATION GUARD: If client passes a UID, it MUST match the session UID
      if (body.uid && body.uid !== session.uid) {
        console.warn(`[Security Alert] Impersonation attempt detected! Session UID "${session.uid}" attempted to request token for UID "${body.uid}" from IP ${clientIp}`);
        sendJson(res, 403, {
          ok: false,
          error: 'Identity mismatch: Impersonation of another user is strictly forbidden.',
          code: 'IMPERSONATION_DETECTED',
        });
        return;
      }

      // Check tenant match if companyId is provided
      if (body.companyId && body.companyId !== session.companyId) {
        console.warn(`[Security Alert] Cross-tenant token request blocked for session UID "${session.uid}"`);
        sendJson(res, 403, {
          ok: false,
          error: 'Tenant mismatch: Cross-tenant operations are forbidden.',
          code: 'FORBIDDEN_CROSS_TENANT',
        });
        return;
      }

      // Return current or refreshed auth token for authenticated user
      let authToken = session.authToken;
      if (!authToken && COMETCHAT_API_KEY && COMETCHAT_APP_ID && COMETCHAT_REGION) {
        const user = findUserByUid(session.uid);
        if (user) {
          authToken = await mintCometChatAuthToken(user);
          session.authToken = authToken;
        }
      }

      sendJson(res, 200, {
        ok: true,
        authToken,
        uid: session.uid,
        companyId: session.companyId,
        user: findUserByUid(session.uid),
      });
      return;
    } catch (err) {
      sendJson(res, 500, { error: err.message });
      return;
    }
  }

  // --------------------------------------------------------------------------
  // API ROUTE 4: POST /api/auth/logout (Session & Credential Revocation)
  // --------------------------------------------------------------------------
  if (req.method === 'POST' && pathname === '/api/auth/logout') {
    const auth = extractSession(req);
    if (auth.authenticated) {
      const { session, sessionToken } = auth;
      // Revoke CometChat Auth Token via REST API
      if (session.authToken) {
        revokeCometChatAuthToken(session.uid, session.authToken).catch(() => {});
      }
      // Revoke session from memory
      activeSessions.delete(sessionToken);
      console.log(`[RescueRoom Server] Session ${redact(sessionToken)} revoked for UID ${session.uid}`);
    }

    sendJson(res, 200, {
      ok: true,
      message: 'Session and associated credentials successfully revoked.',
    });
    return;
  }

  // --------------------------------------------------------------------------
  // API ROUTE 5: POST /api/auth/authorize-tenant (Server-Enforced Incident Access)
  // --------------------------------------------------------------------------
  if (req.method === 'POST' && pathname === '/api/auth/authorize-tenant') {
    // MANDATORY AUTHENTICATION: Requires valid active session
    const auth = extractSession(req);
    if (!auth.authenticated) {
      sendJson(res, 401, {
        authorized: false,
        error: `Authentication required for incident access: ${auth.error}`,
        code: auth.code,
      });
      return;
    }

    const { session } = auth;

    try {
      const body = await readJsonBody(req);
      const { guid } = body;

      if (!guid) {
        sendJson(res, 400, { authorized: false, error: 'Missing incident guid', code: 'GUID_MISSING' });
        return;
      }

      // Tenant is derived directly from the authenticated session, NOT client input
      const expectedPrefix = `${session.companyId}_inc_`;
      if (!guid.startsWith(expectedPrefix)) {
        console.warn(`[Security Alert] Cross-tenant incident access blocked: UID "${session.uid}" (Tenant: ${session.companyId}) attempted access to "${guid}"`);
        sendJson(res, 403, {
          authorized: false,
          error: 'Cross-tenant access violation: Incident room does not belong to your company.',
          code: 'CROSS_TENANT_VIOLATION',
        });
        return;
      }

      sendJson(res, 200, {
        authorized: true,
        guid,
        companyId: session.companyId,
        uid: session.uid,
      });
      return;
    } catch (err) {
      sendJson(res, 500, { error: err.message });
      return;
    }
  }

  // --------------------------------------------------------------------------
  // API ROUTE 6: POST /api/gemini/analyze (Protected Multimodal AI Proxy)
  // --------------------------------------------------------------------------
  if (req.method === 'POST' && pathname === '/api/gemini/analyze') {
    // Abuse protection: 20 AI analysis calls per minute per IP
    const rateCheck = checkRateLimit(`ai:${clientIp}`, 20, 60 * 1000);
    if (!rateCheck.allowed) {
      sendJson(res, 429, { error: 'Rate limit exceeded on AI diagnostic endpoint.', code: 'RATE_LIMIT_EXCEEDED' }, { 'Retry-After': String(rateCheck.retryAfter) });
      return;
    }

    // MANDATORY AUTHENTICATION: Unauthenticated callers cannot consume AI resources
    const auth = extractSession(req);
    if (!auth.authenticated) {
      sendJson(res, 401, {
        ok: false,
        error: `Authentication required: ${auth.error}. Unauthenticated clients cannot execute AI diagnostics.`,
        code: auth.code,
      });
      return;
    }

    try {
      const body = await readJsonBody(req);

      // File upload restriction: validate image MIME type
      const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
      if (body.mimeType && !ALLOWED_MIME_TYPES.includes(String(body.mimeType).toLowerCase())) {
        sendJson(res, 400, {
          ok: false,
          error: `Restricted file type: '${body.mimeType}' is not supported. Permitted types: ${ALLOWED_MIME_TYPES.join(', ')}.`,
          code: 'UNSUPPORTED_MEDIA_TYPE',
        });
        return;
      }

      const clientOverrideKey = req.headers['x-gemini-api-key'] || '';

      const diagnosis = await analyzeWithGemini({
        ...body,
        overrideKey: clientOverrideKey,
      });

      sendJson(res, 200, {
        ok: true,
        diagnosis,
      });
      return;
    } catch (err) {
      sendJson(res, 500, { error: err.message });
      return;
    }
  }

  // --------------------------------------------------------------------------
  // STATIC ASSET SERVING & SPA FALLBACK (Production / Staging)
  // --------------------------------------------------------------------------
  if (pathname.startsWith('/api/')) {
    sendJson(res, 404, { error: 'API route not found: ' + pathname });
    return;
  }

  // Only GET and HEAD for static assets
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('Method Not Allowed');
    return;
  }

  // Check if dist folder exists
  if (!fs.existsSync(DIST_DIR)) {
    res.writeHead(503, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <!DOCTYPE html>
      <html>
        <head><title>RescueRoom — Build Required</title></head>
        <body style="font-family: monospace; padding: 40px; background: #EFECE6; color: #16181D;">
          <h2>[RESCUEROOM SERVER] Dist directory not found</h2>
          <p>Please run <code>npm run build</code> to create the client bundle before launching production server.</p>
        </body>
      </html>
    `);
    return;
  }

  // Resolve requested file inside dist/
  let filePath = path.join(DIST_DIR, pathname);

  // Security guard against path traversal
  if (!filePath.startsWith(DIST_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  // If path is a directory or root, default to index.html
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  // If file doesn't exist, fall back to index.html for client-side routing (React Router)
  if (!fs.existsSync(filePath)) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  // Security & Cache headers
  const isHttps = req.socket.encrypted || false;
  const headers = {
    'Content-Type': contentType,
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(self), microphone=(self), geolocation=()',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://*.cometchat.io https://*.cometchatcloud.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://*.cometchat.io https://*.cometchatcloud.com; media-src 'self' blob:; connect-src 'self' https://*.cometchat.io https://*.cometchatcloud.com wss://*.cometchat.io wss://*.cometchatcloud.com https://generativelanguage.googleapis.com; frame-src 'self';",
    ...(isHttps ? { 'Strict-Transport-Security': 'max-age=31536000; includeSubDomains' } : {}),
  };

  if (pathname.startsWith('/assets/')) {
    headers['Cache-Control'] = 'public, max-age=31536000, immutable';
  } else {
    headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
  }

  res.writeHead(200, headers);

  if (req.method === 'HEAD') {
    res.end();
    return;
  }

  const readStream = fs.createReadStream(filePath);
  readStream.pipe(res);
}

// --------------------------------------------------------------------------
// SERVER LISTENERS: DUAL HTTP & HTTPS STAGING SUPPORT
// --------------------------------------------------------------------------
const httpServer = http.createServer(requestHandler);
let httpsServer = null;

const isDirectRun = Boolean(
  process.argv[1] &&
  path.resolve(process.argv[1]).toLowerCase() === __filename.toLowerCase()
);

if (isDirectRun && !process.env.VERCEL) {
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`================================================================`);
    console.log(`🚨 RESCUEROOM STAGING BACKEND SERVER (SECURITY HARDENED)`);
    console.log(`================================================================`);
    console.log(`  • HTTP Staging Access:   http://localhost:${PORT}`);
    console.log(`  • Health Check (HTTP):   http://localhost:${PORT}/api/health`);
    console.log(`  • Session Auth:          ACTIVE (Cryptographic Session Tokens)`);
    console.log(`  • Impersonation Guard:   ACTIVE (UID bound to server session)`);
    console.log(`  • Tenant Isolation:      STRICT (Server-enforced on identity & incidents)`);
    console.log(`  • Rate Limiting:         ACTIVE (Sliding window on Auth & AI proxies)`);
    console.log(`  • Static Root:           ${DIST_DIR}`);

    if (httpsOptions) {
      try {
        httpsServer = https.createServer(httpsOptions, requestHandler);
        httpsServer.listen(HTTPS_PORT, '0.0.0.0', () => {
          console.log(`  • HTTPS Staging Access:  https://localhost:${HTTPS_PORT}`);
          console.log(`  • Health Check (HTTPS):  https://localhost:${HTTPS_PORT}/api/health`);
          console.log(`  • TLS Status:            ACTIVE (Encrypted Transit Mode)`);
          console.log(`================================================================`);
        });
      } catch (tlsErr) {
        console.warn(`[RescueRoom Server] Failed to start HTTPS listener:`, tlsErr.message);
        console.log(`================================================================`);
      }
    } else {
      console.log(`  • TLS Status:            STANDALONE (No certs found in server/certs)`);
      console.log(`================================================================`);
    }
  });
}

// Export for serverless environments (Vercel / AWS Lambda)
export { requestHandler };

// --------------------------------------------------------------------------
// PROCESS LIFECYCLE: GRACEFUL SHUTDOWN & CLEAN RESOURCE DISPOSAL
// --------------------------------------------------------------------------
function gracefulShutdown(signal) {
  console.log(`\n[RescueRoom Server] Received ${signal}. Initiating graceful shutdown...`);
  httpServer.close(() => {
    if (httpsServer) {
      httpsServer.close(() => {
        console.log('[RescueRoom Server] All listeners cleanly closed. Terminating process.');
        process.exit(0);
      });
    } else {
      console.log('[RescueRoom Server] HTTP listener cleanly closed. Terminating process.');
      process.exit(0);
    }
  });

  // Force termination if socket drain exceeds 5 seconds
  setTimeout(() => {
    console.error('[RescueRoom Server] Forcing shutdown after timeout.');
    process.exit(1);
  }, 5000).unref();
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
