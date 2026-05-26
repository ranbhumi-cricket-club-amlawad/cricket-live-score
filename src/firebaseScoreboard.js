const databaseUrl = import.meta.env.VITE_FIREBASE_DATABASE_URL;
const scoreboardPath = import.meta.env.VITE_SCOREBOARD_PATH || "scoreboard";

export const refreshIntervalMs = Number(import.meta.env.VITE_REFRESH_INTERVAL_MS || 3000);

export function hasFirebaseConfig() {
  return Boolean(databaseUrl && !databaseUrl.includes("YOUR_PROJECT_ID"));
}

export async function fetchScoreboard() {
  if (!hasFirebaseConfig()) {
    return null;
  }

  const baseUrl = databaseUrl.replace(/\/$/, "");
  const response = await fetch(`${baseUrl}/${scoreboardPath}.json?ts=${Date.now()}`, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Firebase request failed: ${response.status}`);
  }

  return response.json();
}

export async function updateScoreboard(scoreboard) {
  if (!hasFirebaseConfig()) {
    throw new Error("Firebase is not configured. Add VITE_FIREBASE_DATABASE_URL in .env.");
  }

  const baseUrl = databaseUrl.replace(/\/$/, "");
  const response = await fetch(`${baseUrl}/${scoreboardPath}.json`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(scoreboard)
  });

  if (!response.ok) {
    throw new Error(`Firebase update failed: ${response.status}`);
  }

  return response.json();
}
