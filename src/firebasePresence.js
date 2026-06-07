const databaseUrl = import.meta.env.VITE_FIREBASE_DATABASE_URL;
const liveUsersPath = import.meta.env.VITE_LIVE_USERS_PATH || "liveUsers";
const browserIdStorageKey = "cricket-live-score-browser-id";

export const presenceHeartbeatIntervalMs = 20000;
export const presenceCountIntervalMs = 10000;

function presenceUrl(path = "") {
  return `${databaseUrl.replace(/\/$/, "")}/${liveUsersPath}${path}.json`;
}

export function getBrowserPresenceId() {
  try {
    const existingId = window.localStorage.getItem(browserIdStorageKey);
    if (existingId) return existingId;
    const browserId = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(browserIdStorageKey, browserId);
    return browserId;
  } catch {
    return window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

export async function sendPresenceHeartbeat(browserId) {
  const response = await fetch(presenceUrl(`/${encodeURIComponent(browserId)}`), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lastSeen: { ".sv": "timestamp" } })
  });
  if (!response.ok) throw new Error(`Presence heartbeat failed: ${response.status}`);
}

export async function fetchLiveUserCount() {
  const response = await fetch(`${presenceUrl()}?ts=${Date.now()}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Presence request failed: ${response.status}`);
  const users = await response.json() || {};
  const now = Date.now();
  const entries = Object.entries(users);
  const staleIds = entries.filter(([, user]) => now - Number(user?.lastSeen || 0) > 300000).map(([browserId]) => browserId);
  if (staleIds.length > 0) Promise.allSettled(staleIds.map((browserId) => fetch(presenceUrl(`/${encodeURIComponent(browserId)}`), { method: "DELETE" })));
  return entries.filter(([, user]) => now - Number(user?.lastSeen || 0) <= 60000).length;
}
