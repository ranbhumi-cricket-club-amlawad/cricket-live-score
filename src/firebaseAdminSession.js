const databaseUrl = import.meta.env.VITE_FIREBASE_DATABASE_URL;
const adminSessionPath = import.meta.env.VITE_ADMIN_SESSION_PATH || "adminSession";

export const adminSessionCheckIntervalMs = 4000;
export const adminSessionHeartbeatIntervalMs = 15000;

function adminSessionUrl() {
  return `${databaseUrl.replace(/\/$/, "")}/${adminSessionPath}.json`;
}

export function createAdminSessionId() {
  return window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function claimAdminSession(sessionId) {
  const response = await fetch(adminSessionUrl(), { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId, lastSeen: { ".sv": "timestamp" } }) });
  if (!response.ok) throw new Error(`Admin session login failed: ${response.status}`);
}

export async function fetchAdminSession() {
  const response = await fetch(`${adminSessionUrl()}?ts=${Date.now()}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Admin session request failed: ${response.status}`);
  return response.json();
}

export async function heartbeatAdminSession(sessionId) {
  const session = await fetchAdminSession();
  if (session?.sessionId !== sessionId) return false;
  const response = await fetch(adminSessionUrl(), { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lastSeen: { ".sv": "timestamp" } }) });
  if (!response.ok) throw new Error(`Admin session heartbeat failed: ${response.status}`);
  return true;
}

export async function releaseAdminSession(sessionId) {
  const session = await fetchAdminSession();
  if (session?.sessionId !== sessionId) return;
  await fetch(adminSessionUrl(), { method: "DELETE" });
}
