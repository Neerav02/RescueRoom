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
 * Demo Users for Multi-Tenant Isolation
 * Company 1: Northwind Heavy Equipment (Asha, Ravi, Meera)
 * Company 2: Kestrel Logistics (Dev, Sana, Imran)
 */
export const DEMO_USERS = [
  {
    uid: "northwind_asha",
    name: "Asha Patel",
    role: "operator",
    companyId: "northwind",
    companyName: "Northwind Heavy Equipment",
    callsign: "OP-NORTH-01",
    tagline: "Heavy Excavator Lead Operator",
  },
  {
    uid: "northwind_ravi",
    name: "Ravi Kumar",
    role: "mechanic",
    companyId: "northwind",
    companyName: "Northwind Heavy Equipment",
    callsign: "TECH-NORTH-09",
    tagline: "Hydraulics & Diesel Specialist",
  },
  {
    uid: "northwind_meera",
    name: "Meera Singh",
    role: "dispatcher",
    companyId: "northwind",
    companyName: "Northwind Heavy Equipment",
    callsign: "DISPATCH-NORTH-CENTRAL",
    tagline: "Central Yard Operations Lead",
  },
  {
    uid: "kestrel_dev",
    name: "Dev Sharma",
    role: "operator",
    companyId: "kestrel",
    companyName: "Kestrel Logistics",
    callsign: "OP-KESTREL-04",
    tagline: "Fleet Transport Operator",
  },
  {
    uid: "kestrel_sana",
    name: "Sana Mir",
    role: "mechanic",
    companyId: "kestrel",
    companyName: "Kestrel Logistics",
    callsign: "TECH-KESTREL-12",
    tagline: "Electrical & Powertrain Tech",
  },
  {
    uid: "kestrel_imran",
    name: "Imran Khan",
    role: "dispatcher",
    companyId: "kestrel",
    companyName: "Kestrel Logistics",
    callsign: "DISPATCH-KESTREL-MAIN",
    tagline: "Regional Logistics Controller",
  },
];

/**
 * Log in a demo user. If user does not exist on CometChat, provision them first.
 */
export async function loginOrProvisionUser(demoUser) {
  await initCometChat();
  const { AUTH_KEY } = COMETCHAT_CONFIG;
  if (!AUTH_KEY) {
    throw new Error("Missing VITE_COMETCHAT_AUTH_KEY in environment");
  }

  try {
    console.log(`[RescueRoom] Attempting login for ${demoUser.uid}...`);
    const loggedIn = await CometChat.login(demoUser.uid, AUTH_KEY);
    console.log(`[RescueRoom] Logged in successfully as:`, loggedIn.getName());
    return loggedIn;
  } catch (loginErr) {
    console.warn(`[RescueRoom] Login failed for ${demoUser.uid}, provisioning user...`, loginErr);
    
    // Create the user in CometChat with standard role and role in metadata
    try {
      const newUser = new CometChat.User(demoUser.uid);
      newUser.setName(demoUser.name);
      
      const metadata = {
        companyId: demoUser.companyId,
        companyName: demoUser.companyName,
        role: demoUser.role,
        callsign: demoUser.callsign,
      };
      newUser.setMetadata(metadata);

      await CometChat.createUser(newUser, AUTH_KEY);
      console.log(`[RescueRoom] Provisioned user ${demoUser.uid}. Retrying login...`);
      const loggedIn = await CometChat.login(demoUser.uid, AUTH_KEY);
      return loggedIn;
    } catch (provisionErr) {
      console.error(`[RescueRoom] Failed to provision user ${demoUser.uid}:`, provisionErr);
      throw provisionErr;
    }
  }
}

/**
 * Log out current user
 */
export async function logoutUser() {
  await initCometChat();
  return CometChat.logout();
}

export { CometChat };
