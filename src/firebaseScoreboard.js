const databaseUrl = import.meta.env.VITE_FIREBASE_DATABASE_URL;
const scoreboardPath = import.meta.env.VITE_SCOREBOARD_PATH || "scoreboard";

export const refreshIntervalMs = Number(import.meta.env.VITE_REFRESH_INTERVAL_MS || 8000);

export function hasFirebaseConfig() {
  return Boolean(databaseUrl && !databaseUrl.includes("YOUR_PROJECT_ID"));
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") return Object.values(value);
  return [];
}

function getDateGroupKey(match) {
  const source = String(match?.date || match?.completedAt || "").trim();
  const parsed = /^\d{4}-\d{2}-\d{2}/.test(source) ? source.slice(0, 10) : "";
  const fallbackDate = parsed ? null : new Date(source);
  return parsed || (!Number.isNaN(fallbackDate.getTime()) ? `${fallbackDate.getFullYear()}-${String(fallbackDate.getMonth() + 1).padStart(2, "0")}-${String(fallbackDate.getDate()).padStart(2, "0")}` : "date-not-set");
}

function getDateGroupLabel(key) {
  const parts = key.split("-");
  return key !== "date-not-set" && parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : "Date not set";
}

function groupMatchesByDate(matches) {
  const byDate = {};
  const dates = [];
  asArray(matches).forEach((match) => {
    const key = getDateGroupKey(match);
    if (!byDate[key]) {
      byDate[key] = [];
      dates.push({ key, label: getDateGroupLabel(key), count: 0 });
    }
    byDate[key].push(match);
    dates.find((group) => group.key === key).count += 1;
  });
  return { dates, byDate };
}

function buildPublicIndex(scoreboard) {
  const upcoming = groupMatchesByDate(scoreboard?.upcomingMatches);
  const completed = groupMatchesByDate(scoreboard?.completedMatches);
  return {
    upcomingDates: upcoming.dates,
    completedDates: completed.dates,
    upcomingByDate: upcoming.byDate,
    completedByDate: completed.byDate
  };
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

export async function fetchScoreboardSection(sectionPath) {
  if (!hasFirebaseConfig()) {
    return null;
  }

  const baseUrl = databaseUrl.replace(/\/$/, "");
  const response = await fetch(`${baseUrl}/${scoreboardPath}/${sectionPath}.json?ts=${Date.now()}`, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Firebase request failed: ${response.status}`);
  }

  return response.json();
}

export function fetchCurrentMatch() {
  return fetchScoreboardSection("currentMatch");
}

export function fetchTournament() {
  return fetchScoreboardSection("tournament");
}

export function fetchUpcomingMatches() {
  return fetchScoreboardSection("upcomingMatches");
}

export function fetchCompletedMatches() {
  return fetchScoreboardSection("completedMatches");
}

export function fetchUpcomingDateGroups() {
  return fetchScoreboardSection("publicIndex/upcomingDates");
}

export function fetchCompletedDateGroups() {
  return fetchScoreboardSection("publicIndex/completedDates");
}

export function fetchUpcomingMatchesByDate(dateKey) {
  return fetchScoreboardSection(`publicIndex/upcomingByDate/${dateKey}`);
}

export function fetchCompletedMatchesByDate(dateKey) {
  return fetchScoreboardSection(`publicIndex/completedByDate/${dateKey}`);
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

  const result = await response.json();
  const indexResponse = await fetch(`${baseUrl}/${scoreboardPath}/publicIndex.json`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(buildPublicIndex(scoreboard))
  });

  if (!indexResponse.ok) {
    throw new Error(`Firebase public index update failed: ${indexResponse.status}`);
  }

  return result;
}
