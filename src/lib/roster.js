/**
 * RescueRoom — Multi-Tenant Personnel Roster
 * Shared between client UI and secure authentication server
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
    accessPin: "1091",
  },
  {
    uid: "northwind_ravi",
    name: "Ravi Kumar",
    role: "mechanic",
    companyId: "northwind",
    companyName: "Northwind Heavy Equipment",
    callsign: "TECH-NORTH-09",
    tagline: "Hydraulics & Diesel Specialist",
    accessPin: "2044",
  },
  {
    uid: "northwind_meera",
    name: "Meera Singh",
    role: "dispatcher",
    companyId: "northwind",
    companyName: "Northwind Heavy Equipment",
    callsign: "DISPATCH-NORTH-CENTRAL",
    tagline: "Central Yard Operations Lead",
    accessPin: "3082",
  },
  {
    uid: "kestrel_dev",
    name: "Dev Sharma",
    role: "operator",
    companyId: "kestrel",
    companyName: "Kestrel Logistics",
    callsign: "OP-KESTREL-04",
    tagline: "Fleet Transport Operator",
    accessPin: "4110",
  },
  {
    uid: "kestrel_sana",
    name: "Sana Mir",
    role: "mechanic",
    companyId: "kestrel",
    companyName: "Kestrel Logistics",
    callsign: "TECH-KESTREL-12",
    tagline: "Electrical & Powertrain Tech",
    accessPin: "5221",
  },
  {
    uid: "kestrel_imran",
    name: "Imran Khan",
    role: "dispatcher",
    companyId: "kestrel",
    companyName: "Kestrel Logistics",
    callsign: "DISPATCH-KESTREL-MAIN",
    tagline: "Regional Logistics Controller",
    accessPin: "6335",
  },
];

export function findUserByUid(uid) {
  return DEMO_USERS.find((u) => u.uid === uid) || null;
}

export function verifyUserCredentials(uid, accessPin, companyId) {
  const user = findUserByUid(uid);
  if (!user) return { valid: false, error: 'User UID not recognized', code: 'USER_NOT_FOUND' };
  if (companyId && user.companyId !== companyId) {
    return { valid: false, error: 'Tenant mismatch: User does not belong to specified company', code: 'TENANT_MISMATCH' };
  }
  if (!accessPin || String(user.accessPin) !== String(accessPin)) {
    return { valid: false, error: 'Invalid access PIN / security credential', code: 'INVALID_CREDENTIALS' };
  }
  return { valid: true, user };
}

