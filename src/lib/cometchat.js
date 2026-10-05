/**
 * RescueRoom — CometChat JavaScript SDK Client & Initializer
 * Custom UI integration directly on top of @cometchat/chat-sdk-javascript
 */

import { CometChat } from "@cometchat/chat-sdk-javascript";

export const COMETCHAT_CONFIG = {
  APP_ID: import.meta.env.VITE_COMETCHAT_APP_ID || "",
  REGION: (import.meta.env.VITE_COMETCHAT_REGION || "").toLowerCase(),
  AUTH_KEY: import.meta.env.VITE_COMETCHAT_AUTH_KEY || "",
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

  const { APP_ID, REGION } = COMETCHAT_CONFIG;

  if (!APP_ID || !REGION) {
    const errorMsg = "CometChat Error: Missing VITE_COMETCHAT_APP_ID or VITE_COMETCHAT_REGION in .env";
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
 * Log in a user using their UID and the configured Auth Key
 */
export async function loginUser(uid) {
  await initCometChat();
  const { AUTH_KEY } = COMETCHAT_CONFIG;
  if (!AUTH_KEY) {
    throw new Error("Missing VITE_COMETCHAT_AUTH_KEY in .env");
  }
  console.log(`[RescueRoom] Logging in user: ${uid}...`);
  const user = await CometChat.login(uid, AUTH_KEY);
  console.log(`[RescueRoom] User logged in:`, user.getName());
  return user;
}

/**
 * Log out current user
 */
export async function logoutUser() {
  await initCometChat();
  return CometChat.logout();
}

export { CometChat };
