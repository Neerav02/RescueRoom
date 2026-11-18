/**
 * RescueRoom — CometChat JavaScript SDK Client & Initializer
 * Custom UI integration directly on top of @cometchat/chat-sdk-javascript
 */

import { CometChat } from "@cometchat/chat-sdk-javascript";
export { DEMO_USERS } from "./roster.js";

export const COMETCHAT_CONFIG = {
  APP_ID: import.meta.env.VITE_COMETCHAT_APP_ID || "",
  REGION: (import.meta.env.VITE_COMETCHAT_REGION || "").toLowerCase(),
};

let initPromise = null;
let isInitialized = false;

/**
 * Initialize CometChat JavaScript SDK singleton
 */
export async function initCometChat() {
  if (isInitialized) {
    return true;
  }
  if (initPromise) {
    return initPromise;
  }

  let { APP_ID, REGION } = COMETCHAT_CONFIG;

  // Runtime fallback: fetch public client parameters from unified server if not baked into Vite bundle
  if (!APP_ID || !REGION) {
    try {
      const resp = await fetch('/api/config');
      if (resp.ok) {
        const cfg = await resp.json();
        if (cfg.appId) APP_ID = cfg.appId;
        if (cfg.region) REGION = cfg.region.toLowerCase();
        COMETCHAT_CONFIG.APP_ID = APP_ID;
        COMETCHAT_CONFIG.REGION = REGION;
      }
    } catch {
      // ignore network errors on static hosting
    }
  }

  if (!APP_ID || !REGION) {
    const errorMsg = "CometChat Error: Missing VITE_COMETCHAT_APP_ID or VITE_COMETCHAT_REGION in environment.";
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  initPromise = (async () => {
    try {
      console.log(`[RescueRoom] Initializing CometChat SDK (App: ${APP_ID.slice(0, 6)}..., Region: ${REGION})...`);
      
      const appSettings = new CometChat.AppSettingsBuilder()
        .subscribePresenceForAllUsers()
        .setRegion(REGION)
        .autoEstablishSocketConnection(true)
        .build();

      await CometChat.init(APP_ID, appSettings);
      isInitialized = true;
      console.log("[RescueRoom] CometChat SDK successfully initialized.");
      return true;
    } catch (error) {
      console.error("[RescueRoom] CometChat initialization failed:", error);
      initPromise = null;
      throw error;
    }
  })();

  return initPromise;
}

/**
 * Get current logged in user (or null)
 */
export async function getLoggedInUser() {
  await initCometChat();
  return CometChat.getLoggedInUser();
}

/**
 * Ensure the specified user is actively authenticated with CometChat
 */
export async function ensureUserLoggedIn(user = null) {
  let targetUser = user;
  if (!targetUser) {
    try {
      const stored = sessionStorage.getItem('rescueroom_user');
      if (stored) {
        targetUser = JSON.parse(stored);
      }
    } catch {
      // ignore
    }
  }
  if (!targetUser) return null;
  await initCometChat();
  try {
    const loggedIn = await CometChat.getLoggedInUser();
    if (loggedIn && loggedIn.getUid() === targetUser.uid) {
      return loggedIn;
    }
  } catch (e) {
    console.warn("[RescueRoom] getLoggedInUser check notice:", e);
  }
  return loginOrProvisionUser(targetUser);
}

/**
 * Ensure user joins a group channel safely. If already joined, handles gracefully.
 */
export async function ensureGroupJoined(guid, groupType = CometChat.GROUP_TYPE.PUBLIC) {
  if (!guid) return;
  await initCometChat();
  try {
    await CometChat.joinGroup(guid, groupType, "");
    console.log(`[RescueRoom] Active user joined channel ${guid}`);
  } catch (err) {
    if (err?.code !== 'ERR_ALREADY_JOINED') {
      console.warn('[RescueRoom] joinGroup notice:', err?.message || err);
    }
  }
}

/**
 * Send text message safely with automatic group-membership self-healing and re-auth
 */
export async function safeSendMessage(textMessage, currentUser = null) {
  try {
    return await CometChat.sendMessage(textMessage);
  } catch (err) {
    if (err?.code === 'ERR_NOT_A_MEMBER' || err?.code === 'USER_NOT_LOGED_IN') {
      console.warn(`[RescueRoom] Resolving send error (${err.code}), joining group & re-authenticating...`);
      if (currentUser) {
        await ensureUserLoggedIn(currentUser);
      }
      const guid = textMessage.getReceiverId();
      await ensureGroupJoined(guid);
      return await CometChat.sendMessage(textMessage);
    }
    throw err;
  }
}

/**
 * Send media message safely with automatic group-membership self-healing and re-auth
 */
export async function safeSendMediaMessage(mediaMessage, currentUser = null) {
  try {
    return await CometChat.sendMediaMessage(mediaMessage);
  } catch (err) {
    if (err?.code === 'ERR_NOT_A_MEMBER' || err?.code === 'USER_NOT_LOGED_IN') {
      console.warn(`[RescueRoom] Resolving media send error (${err.code}), joining group & re-authenticating...`);
      if (currentUser) {
        await ensureUserLoggedIn(currentUser);
      }
      const guid = mediaMessage.getReceiverId();
      await ensureGroupJoined(guid);
      return await CometChat.sendMediaMessage(mediaMessage);
    }
    throw err;
  }
}

export function getSessionToken() {
  try {
    return sessionStorage.getItem('rescueroom_session_token') || '';
  } catch {
    return '';
  }
}

/**
 * Helper to log in or provision user using client-side dev Auth Key
 */
async function loginWithDevKey(demoUser, devAuthKey) {
  try {
    const loggedIn = await CometChat.login(demoUser.uid, devAuthKey);
    console.log(`[RescueRoom] Authenticated with CometChat (dev auth):`, loggedIn.getName());
    return loggedIn;
  } catch (loginErr) {
    console.warn(`[RescueRoom] Dev login initial attempt for ${demoUser.uid}, provisioning user...`, loginErr);
    const newUser = new CometChat.User(demoUser.uid);
    newUser.setName(demoUser.name);
    newUser.setMetadata({
      companyId: demoUser.companyId,
      companyName: demoUser.companyName,
      role: demoUser.role,
      callsign: demoUser.callsign,
    });
    await CometChat.createUser(newUser, devAuthKey);
    return await CometChat.login(demoUser.uid, devAuthKey);
  }
}

/**
 * Log in a user securely via independent server-side authentication.
 * Server verifies credentials, establishes an authenticated session, and mints a scoped CometChat auth token.
 */
export async function loginOrProvisionUser(demoUser) {
  await initCometChat();

  console.log(`[RescueRoom] Authenticating with server for ${demoUser.uid} (${demoUser.companyId})...`);

  let response;
  try {
    response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid: demoUser.uid,
        accessPin: demoUser.accessPin,
        companyId: demoUser.companyId,
      }),
    });
  } catch (netErr) {
    console.error('[RescueRoom] Backend auth endpoint unreachable:', netErr);
    const devAuthKey = import.meta.env.VITE_COMETCHAT_AUTH_KEY;
    if (devAuthKey) {
      console.warn(`[RescueRoom Notice] Backend unreachable. Engaging client-side dev authentication.`);
      return await loginWithDevKey(demoUser, devAuthKey);
    }
    throw new Error('Authentication backend server unreachable. Ensure the backend server is running on port 3001.');
  }

  if (!response.ok) {
    const devAuthKey = import.meta.env.VITE_COMETCHAT_AUTH_KEY;
    // If backend returned 502 / 503 / 504 and local dev Auth Key exists, fall back smoothly
    if (devAuthKey && (response.status >= 502 && response.status <= 504)) {
      console.warn(`[RescueRoom Notice] Backend proxy returned ${response.status}. Engaging client-side dev authentication.`);
      return await loginWithDevKey(demoUser, devAuthKey);
    }
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Authentication failed with status ${response.status}`);
  }

  const result = await response.json();

  // Store server-issued cryptographic session token
  if (result.sessionToken) {
    try {
      sessionStorage.setItem('rescueroom_session_token', result.sessionToken);
    } catch {
      // ignore
    }
  }

  // Primary Production / Staging Flow: Login using secure server-minted Auth Token
  if (result.authToken) {
    console.log(`[RescueRoom] Authenticating with CometChat via server-minted Auth Token...`);
    const loggedIn = await CometChat.login(result.authToken);
    console.log(`[RescueRoom] Authenticated with CometChat as:`, loggedIn.getName());
    return loggedIn;
  }

  // Development Fallback if server runs in unconfigured local mode
  if (result.devFallback) {
    const devAuthKey = import.meta.env.VITE_COMETCHAT_AUTH_KEY;
    if (devAuthKey) {
      console.warn(`[RescueRoom Security Notice] Backend server has no COMETCHAT_API_KEY configured. Falling back to local dev Auth Key.`);
      return await loginWithDevKey(demoUser, devAuthKey);
    }
    throw new Error('CometChat server credentials (COMETCHAT_API_KEY) are required on the server to authenticate.');
  }

  throw new Error('No valid authentication token received from server.');
}

/**
 * Log out current user and revoke session & tokens server-side
 */
export async function logoutUser() {
  await initCometChat();
  const sessionToken = getSessionToken();
  if (sessionToken) {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${sessionToken}` },
      });
    } catch (e) {
      console.warn('[RescueRoom] Server session revocation warning:', e);
    }
  }
  try {
    sessionStorage.removeItem('rescueroom_session_token');
  } catch {
    // ignore
  }
  return CometChat.logout();
}

/**
 * CometChat Calls SDK Initialization (Prompt 6)
 */
let callsInitPromise = null;
let isCallsInitialized = false;

export async function initCometChatCalls() {
  if (isCallsInitialized) return true;
  if (callsInitPromise) return callsInitPromise;

  callsInitPromise = (async () => {
    try {
      const { CometChatCalls } = await import("@cometchat/calls-sdk-javascript");
      const { APP_ID, REGION } = COMETCHAT_CONFIG;
      const callAppSettings = {
        appId: APP_ID,
        region: REGION,
      };
      const res = await CometChatCalls.init(callAppSettings);
      isCallsInitialized = true;
      console.log("[RescueRoom] CometChatCalls SDK initialized:", res);
      return CometChatCalls;
    } catch (err) {
      console.warn("[RescueRoom] CometChatCalls initialization notice:", err);
      return null;
    }
  })();

  return callsInitPromise;
}

export { CometChat };
