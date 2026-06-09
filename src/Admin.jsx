import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeftRight, CalendarPlus, ChevronDown, LogOut, Minus, Plus, Save, ShieldCheck, Trophy, Undo2, Zap } from "lucide-react";
import { formatMatchSchedule } from "./dateFormat";
import { adminSessionCheckIntervalMs, adminSessionHeartbeatIntervalMs, claimAdminSession, createAdminSessionId, fetchAdminSession, heartbeatAdminSession, releaseAdminSession } from "./firebaseAdminSession";
import { fetchScoreboard, hasFirebaseConfig, updateScoreboard } from "./firebaseScoreboard";
import { sampleScoreboard } from "./sampleData";

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "Ranbhumi@2026#Admin";
const ADMIN_SESSION_STORAGE_KEY = "cricket-admin-session";
const DEFAULT_EXTRAS = {
  wides: 0,
  noBalls: 0,
  byes: 0,
  legByes: 0,
  penalty: 0,
  total: 0
};

const BALL_EVENTS = [
  { label: "0", display: "Dot", totalRuns: 0, batterRuns: 0, legal: true, strikerBall: true, bowlerRuns: 0 },
  { label: "1", display: "1 Run", totalRuns: 1, batterRuns: 1, legal: true, strikerBall: true, bowlerRuns: 1 },
  { label: "2", display: "2 Runs", totalRuns: 2, batterRuns: 2, legal: true, strikerBall: true, bowlerRuns: 2 },
  { label: "3", display: "3 Runs", totalRuns: 3, batterRuns: 3, legal: true, strikerBall: true, bowlerRuns: 3 },
  { label: "4", display: "4", totalRuns: 4, batterRuns: 4, legal: true, strikerBall: true, bowlerRuns: 4 },
  { label: "5", display: "5 Runs", totalRuns: 5, batterRuns: 5, legal: true, strikerBall: true, bowlerRuns: 5 },
  { label: "6", display: "6", totalRuns: 6, batterRuns: 6, legal: true, strikerBall: true, bowlerRuns: 6 },
  { label: "W", display: "Wicket", totalRuns: 0, batterRuns: 0, legal: true, strikerBall: true, bowlerRuns: 0, wicket: true, bowlerWicket: true },
  { label: "RO", display: "Run Out", totalRuns: 0, batterRuns: 0, legal: true, strikerBall: true, bowlerRuns: 0, wicket: true, bowlerWicket: false },
  { label: "Wd", display: "Wide", totalRuns: 1, batterRuns: 0, legal: false, strikerBall: false, bowlerRuns: 1, extraType: "wides", extraRuns: 1 },
  { label: "Wd+1", display: "Wide +1", totalRuns: 2, batterRuns: 0, legal: false, strikerBall: false, bowlerRuns: 2, extraType: "wides", extraRuns: 2 },
  { label: "Wd+2", display: "Wide +2", totalRuns: 3, batterRuns: 0, legal: false, strikerBall: false, bowlerRuns: 3, extraType: "wides", extraRuns: 3 },
  { label: "Wd+3", display: "Wide +3", totalRuns: 4, batterRuns: 0, legal: false, strikerBall: false, bowlerRuns: 4, extraType: "wides", extraRuns: 4 },
  { label: "Wd+4", display: "Wide +4", totalRuns: 5, batterRuns: 0, legal: false, strikerBall: false, bowlerRuns: 5, extraType: "wides", extraRuns: 5 },
  { label: "NB", display: "No Ball", totalRuns: 1, batterRuns: 0, legal: false, strikerBall: false, bowlerRuns: 1, extraType: "noBalls", extraRuns: 1, freeHit: true },
  { label: "NB+1", display: "No Ball +1", totalRuns: 2, batterRuns: 1, legal: false, strikerBall: false, bowlerRuns: 2, extraType: "noBalls", extraRuns: 1, freeHit: true },
  { label: "NB+2", display: "No Ball +2", totalRuns: 3, batterRuns: 2, legal: false, strikerBall: false, bowlerRuns: 3, extraType: "noBalls", extraRuns: 1, freeHit: true },
  { label: "NB+3", display: "No Ball +3", totalRuns: 4, batterRuns: 3, legal: false, strikerBall: false, bowlerRuns: 4, extraType: "noBalls", extraRuns: 1, freeHit: true },
  { label: "NB+4", display: "No Ball +4", totalRuns: 5, batterRuns: 4, legal: false, strikerBall: false, bowlerRuns: 5, extraType: "noBalls", extraRuns: 1, freeHit: true },
  { label: "NB+6", display: "No Ball +6", totalRuns: 7, batterRuns: 6, legal: false, strikerBall: false, bowlerRuns: 7, extraType: "noBalls", extraRuns: 1, freeHit: true },
  { label: "B1", display: "Bye 1", totalRuns: 1, batterRuns: 0, legal: true, strikerBall: true, bowlerRuns: 0, extraType: "byes", extraRuns: 1 },
  { label: "B2", display: "Bye 2", totalRuns: 2, batterRuns: 0, legal: true, strikerBall: true, bowlerRuns: 0, extraType: "byes", extraRuns: 2 },
  { label: "B3", display: "Bye 3", totalRuns: 3, batterRuns: 0, legal: true, strikerBall: true, bowlerRuns: 0, extraType: "byes", extraRuns: 3 },
  { label: "B4", display: "Bye 4", totalRuns: 4, batterRuns: 0, legal: true, strikerBall: true, bowlerRuns: 0, extraType: "byes", extraRuns: 4 },
  { label: "LB1", display: "Leg Bye 1", totalRuns: 1, batterRuns: 0, legal: true, strikerBall: true, bowlerRuns: 0, extraType: "legByes", extraRuns: 1 },
  { label: "LB2", display: "Leg Bye 2", totalRuns: 2, batterRuns: 0, legal: true, strikerBall: true, bowlerRuns: 0, extraType: "legByes", extraRuns: 2 },
  { label: "LB3", display: "Leg Bye 3", totalRuns: 3, batterRuns: 0, legal: true, strikerBall: true, bowlerRuns: 0, extraType: "legByes", extraRuns: 3 },
  { label: "LB4", display: "Leg Bye 4", totalRuns: 4, batterRuns: 0, legal: true, strikerBall: true, bowlerRuns: 0, extraType: "legByes", extraRuns: 4 },
  { label: "P5", display: "Penalty 5", totalRuns: 5, batterRuns: 0, legal: false, strikerBall: false, bowlerRuns: 0, extraType: "penalty", extraRuns: 5 }
];

function asArray(value, fallback = []) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") return Object.values(value);
  return fallback;
}

function normalizePlayerList(value, fallback = []) {
  return asArray(value, fallback)
    .map((player) => typeof player === "string" ? player : player?.name)
    .filter(Boolean);
}

function splitPlayers(value) {
  return String(value || "")
    .split(/[\r\n,]+/)
    .map((player) => player.trim())
    .filter(Boolean);
}

function normalizeExtras(value) {
  const extras = { ...DEFAULT_EXTRAS, ...(value || {}) };
  extras.total = toNumber(extras.wides) + toNumber(extras.noBalls) + toNumber(extras.byes) + toNumber(extras.legByes) + toNumber(extras.penalty);
  return extras;
}

function makePlayerStats(name, team, role = "Player") {
  return {
    name,
    role,
    team,
    runs: 0,
    balls: 0,
    fours: 0,
    sixes: 0,
    strikeRate: "0.00"
  };
}

function makeBowlerStats(name, team, overs = "0.0", runs = 0, wickets = 0, economy = "") {
  const decimal = decimalOvers(overs);
  const normalizedRuns = toNumber(runs);
  return { name, team, overs: overs || "0.0", runs: normalizedRuns, wickets: toNumber(wickets), economy: economy || (decimal > 0 ? (normalizedRuns / decimal).toFixed(2) : "0.00") };
}

function syncBattingScorecard(match) {
  const currentBatters = asArray(match.batters, []);
  const byName = new Map();

  asArray(match.battingScorecard, []).forEach((player) => {
    if (!player?.name) return;
    byName.set(player.name, {
      ...makePlayerStats(player.name, player.team, player.role || "Played"),
      ...player,
      runs: toNumber(player.runs),
      balls: toNumber(player.balls),
      fours: toNumber(player.fours),
      sixes: toNumber(player.sixes),
      strikeRate: calculateStrikeRate(toNumber(player.runs), toNumber(player.balls))
    });
  });

  currentBatters.forEach((player, index) => {
    if (!player?.name) return;
    const role = player.dismissed ? "Out" : index === 0 ? "Striker" : "Non-striker";
    const current = { ...makePlayerStats(player.name, player.team, role), ...(byName.get(player.name) || {}), ...player, role };
    current.runs = toNumber(current.runs);
    current.balls = toNumber(current.balls);
    current.fours = toNumber(current.fours);
    current.sixes = toNumber(current.sixes);
    current.strikeRate = calculateStrikeRate(current.runs, current.balls);
    byName.set(player.name, current);
    match.batters[index] = current;
  });

  match.battingScorecard = Array.from(byName.values()).filter((player) => player.name);
}

function syncBowlingScorecard(match) {
  const bowler = match.bowler || {};
  const byName = new Map();

  asArray(match.bowlingScorecard, []).forEach((player) => {
    if (!player?.name) return;
    byName.set(player.name, makeBowlerStats(player.name, player.team || bowler.team || "", player.overs || "0.0", player.runs, player.wickets, player.economy));
  });

  if (bowler.name) {
    const existing = byName.get(bowler.name) || {};
    const overs = bowler.overs || existing.overs || "0.0";
    const runs = toNumber(bowler.runs ?? existing.runs);
    const wickets = toNumber(bowler.wickets ?? existing.wickets);
    const normalized = { ...existing, ...bowler, ...makeBowlerStats(bowler.name, bowler.team || existing.team || "", overs, runs, wickets, bowler.economy || existing.economy) };
    byName.set(bowler.name, normalized);
    match.bowler = normalized;
  }

  match.bowlingScorecard = Array.from(byName.values()).filter((player) => player.name);
}

function normalizeScoreboard(value) {
  const source = value || {};
  const sample = sampleScoreboard;
  const currentMatch = source.currentMatch || {};
  const sampleMatch = sample.currentMatch;
  const sourceTeams = currentMatch.teams || {};
  const teams = Object.keys(sourceTeams).length > 0 ? { ...sourceTeams } : { ...sampleMatch.teams };
  const batters = asArray(currentMatch.batters, sampleMatch.batters);
  const bowler = {
    ...sampleMatch.bowler,
    ...(currentMatch.bowler || {})
  };

  Object.keys(teams).forEach((teamId) => {
    const team = teams[teamId];
    const samplePlayers = normalizePlayerList(sampleMatch.teams[teamId]?.players, []);
    const derivedPlayers = [
      ...batters.filter((player) => player.team === team.name).map((player) => player.name),
      bowler.team === team.name ? bowler.name : null
    ].filter(Boolean);
    team.players = normalizePlayerList(team.players, [...samplePlayers, ...derivedPlayers]);
  });

  const teamScores = { ...(currentMatch.teamScores || {}) };
  Object.keys(teams).forEach((teamId) => {
    const existingScore = teamScores[teamId] || {};
    const isBattingTeam = teamId === currentMatch.battingTeamId;
    teamScores[teamId] = {
      runs: isBattingTeam ? toNumber(currentMatch.score?.runs) : toNumber(existingScore.runs),
      wickets: isBattingTeam ? toNumber(currentMatch.score?.wickets) : toNumber(existingScore.wickets),
      overs: isBattingTeam ? currentMatch.score?.overs || "0.0" : existingScore.overs || "0.0"
    };
  });

  const normalized = {
    tournament: {
      ...sample.tournament,
      ...(source.tournament || {})
    },
    currentMatch: {
      ...sampleMatch,
      ...currentMatch,
      inningsNumber: toNumber(currentMatch.inningsNumber) || (String(currentMatch.status || "").toUpperCase() === "LIVE" && toNumber(currentMatch.target) > 0 ? 2 : 1),
      score: {
        ...sampleMatch.score,
        ...(currentMatch.score || {})
      },
      teams,
      teamScores,
      batters,
      battingScorecard: asArray(currentMatch.battingScorecard, sampleMatch.battingScorecard || batters),
      bowlingScorecard: asArray(currentMatch.bowlingScorecard, currentMatch.bowler?.name ? [bowler] : sampleMatch.bowlingScorecard || [bowler]),
      bowler,
      extras: normalizeExtras(currentMatch.extras || sampleMatch.extras),
      recentBalls: asArray(currentMatch.recentBalls, sampleMatch.recentBalls)
    },
    upcomingMatches: asArray(source.upcomingMatches, []).map((match, index) => ({
      ...match,
      id: match.id || `match-${index + 1}`,
      teamA: {
        ...(match.teamA || {}),
        players: normalizePlayerList(match.teamA?.players, [])
      },
      teamB: {
        ...(match.teamB || {}),
        players: normalizePlayerList(match.teamB?.players, [])
      }
    })),
    completedMatches: asArray(source.completedMatches, []).map((match, index) => {
      const completedTeamScores = { ...(match.teamScores || {}) };
      const inningsBowlingScorecards = { ...(match.inningsBowlingScorecards || {}) };
      Object.entries(match.inningsBowlers || {}).forEach(([teamId, bowlerRow]) => {
        if (!inningsBowlingScorecards[teamId]) inningsBowlingScorecards[teamId] = [bowlerRow];
      });
      if (match.battingTeamId && !completedTeamScores[match.battingTeamId] && match.score) completedTeamScores[match.battingTeamId] = { runs: toNumber(match.score.runs), wickets: toNumber(match.score.wickets), overs: match.score.overs || "0.0" };
      if (match.bowlingTeamId && !completedTeamScores[match.bowlingTeamId] && toNumber(match.target) > 0) completedTeamScores[match.bowlingTeamId] = { runs: Math.max(0, toNumber(match.target) - 1), wickets: "", overs: "" };
      return { ...match, id: match.id || `completed-${index + 1}`, teamScores: completedTeamScores, inningsBowlingScorecards };
    })
  };

  if (normalized.currentMatch.batters.length < 2) {
    normalized.currentMatch.batters = [
      ...normalized.currentMatch.batters,
      ...sampleMatch.batters.slice(normalized.currentMatch.batters.length)
    ];
  }

  syncBattingScorecard(normalized.currentMatch);
  syncBowlingScorecard(normalized.currentMatch);

  return normalized;
}

function cloneScoreboard(value) {
  return JSON.parse(JSON.stringify(normalizeScoreboard(value)));
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function calculateStrikeRate(runs, balls) {
  return balls > 0 ? ((runs / balls) * 100).toFixed(2) : "0.00";
}

function calculateOvers(currentOvers) {
  const [overs = 0, balls = 0] = String(currentOvers || "0.0").split(".").map(Number);
  const nextBall = balls + 1;
  return nextBall >= 6 ? `${overs + 1}.0` : `${overs}.${nextBall}`;
}

function subtractOvers(currentOvers) {
  const [overs = 0, balls = 0] = String(currentOvers || "0.0").split(".").map(Number);
  if (overs <= 0 && balls <= 0) return "0.0";
  if (balls > 0) return `${overs}.${balls - 1}`;
  return `${Math.max(0, overs - 1)}.5`;
}

function addLegalBall(match) {
  const beforeBalls = Number(String(match.score.overs || "0.0").split(".")[1] || 0);
  match.score.overs = calculateOvers(match.score.overs);
  match.bowler.overs = calculateOvers(match.bowler.overs);
  return beforeBalls === 5;
}

function removeLegalBall(match) {
  match.score.overs = subtractOvers(match.score.overs);
  match.bowler.overs = subtractOvers(match.bowler.overs);
}

function decimalOvers(oversValue) {
  const [overs = 0, balls = 0] = String(oversValue || "0.0").split(".").map(Number);
  return overs + balls / 6;
}

function recalculateMatch(match) {
  const score = match.score;
  syncBattingScorecard(match);
  syncBowlingScorecard(match);
  match.extras = normalizeExtras(match.extras);
  const matchOvers = decimalOvers(score.overs);
  const bowlerOvers = decimalOvers(match.bowler.overs);
  const remainingRuns = Math.max(0, toNumber(match.target) - toNumber(score.runs));
  const remainingOvers = Math.max(1, 20 - matchOvers);

  score.runRate = matchOvers > 0 ? (toNumber(score.runs) / matchOvers).toFixed(2) : "0.00";
  score.requiredRate = (remainingRuns / remainingOvers).toFixed(2);
  match.bowler.economy = bowlerOvers > 0 ? (toNumber(match.bowler.runs) / bowlerOvers).toFixed(2) : "0.00";
  syncBowlingScorecard(match);
  match.teamScores = { ...(match.teamScores || {}) };
  if (match.battingTeamId) match.teamScores[match.battingTeamId] = { ...(match.teamScores[match.battingTeamId] || {}), runs: toNumber(score.runs), wickets: toNumber(score.wickets), overs: score.overs || "0.0" };
  match.lastUpdated = new Date().toISOString();
}

function switchStrike(match) {
  match.batters = [match.batters[1], match.batters[0]];
  match.batters[0].role = match.batters[0].dismissed ? "Out" : "Striker";
  match.batters[1].role = match.batters[1].dismissed ? "Out" : "Non-striker";
}

function shouldSwitchStrike(event) {
  const completedRuns = event.extraType === "wides" ? Math.max(0, toNumber(event.totalRuns) - 1) : toNumber(event.totalRuns);
  return completedRuns % 2 === 1;
}

function Field({ label, value, onChange, onBlur, type = "text", min }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type={type} min={min} value={value ?? ""} onChange={(event) => onChange(event.target.value)} onBlur={onBlur} />
    </label>
  );
}

function TextAreaField({ label, value, onChange }) {
  return (
    <label className="field field-wide">
      <span>{label}</span>
      <textarea value={value ?? ""} onChange={(event) => onChange(event.target.value)} rows={3} />
    </label>
  );
}

function PlayerListField({ label, players, onCommit }) {
  const normalizedValue = normalizePlayerList(players, []).join("\n");
  const [value, setValue] = useState(normalizedValue);

  useEffect(() => {
    setValue(normalizedValue);
  }, [normalizedValue]);

  return (
    <div className="field field-wide player-list-editor">
      <span>{label}</span>
      <textarea aria-label={label} value={value} onChange={(event) => setValue(event.target.value)} onBlur={() => onCommit(splitPlayers(value))} rows={5} placeholder="Player One, Player Two or one player per line" />
      <button type="button" className="secondary-button apply-players-button" onClick={() => onCommit(splitPlayers(value))}>Apply Players</button>
    </div>
  );
}

function SelectField({ label, value, options, onChange }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value ?? ""} onChange={(event) => onChange(event.target.value)}>
        <option value="">Select player</option>
        {options.map((option) => (
          <option value={option} key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function AdminLogin({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      setIsLoggingIn(true);
      setError("");
      try {
        const sessionId = createAdminSessionId();
        await claimAdminSession(sessionId);
        window.sessionStorage.setItem(ADMIN_SESSION_STORAGE_KEY, sessionId);
        onLogin(sessionId);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoggingIn(false);
      }
      return;
    }
    setError("Invalid username or password.");
  }

  return (
    <main className="admin-shell">
      <form className="login-panel" onSubmit={handleSubmit}>
        <div className="admin-title">
          <span><ShieldCheck size={24} /></span>
          <div>
            <h1>Admin Login</h1>
            <p>Enter the hard-coded admin credentials.</p>
          </div>
        </div>

        {error ? <div className="alert">{error}</div> : null}

        <Field label="Username" value={username} onChange={setUsername} />
        <Field label="Password" type="password" value={password} onChange={setPassword} />

        <button className="primary-button" type="submit" disabled={isLoggingIn}>
          <ShieldCheck size={17} />
          {isLoggingIn ? "Logging in..." : "Login"}
        </button>
      </form>
    </main>
  );
}

export function AdminPage() {
  const [adminSessionId, setAdminSessionId] = useState(() => window.sessionStorage.getItem(ADMIN_SESSION_STORAGE_KEY) || "");
  const [isLoggedIn, setIsLoggedIn] = useState(() => Boolean(window.sessionStorage.getItem(ADMIN_SESSION_STORAGE_KEY)));
  const [scoreboard, setScoreboard] = useState(() => cloneScoreboard(sampleScoreboard));
  const [selectedUpcomingId, setSelectedUpcomingId] = useState("");
  const [pendingLiveMatchId, setPendingLiveMatchId] = useState("");
  const [pendingUpcomingAction, setPendingUpcomingAction] = useState(null);
  const [pendingWicketLabel, setPendingWicketLabel] = useState("");
  const [showUpcomingMatches, setShowUpcomingMatches] = useState(false);
  const [showCompletedMatches, setShowCompletedMatches] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const usingFirebase = useMemo(() => hasFirebaseConfig(), []);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const data = await fetchScoreboard();
        if (mounted && data) {
          setScoreboard(cloneScoreboard(data));
        }
      } catch (err) {
        if (mounted) {
          setError(err.message);
        }
      }
    }

    if (isLoggedIn) {
      load();
    }

    return () => {
      mounted = false;
    };
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn || !adminSessionId) return undefined;
    let mounted = true;

    async function verifySession() {
      try {
        const session = await fetchAdminSession();
        if (mounted && session?.sessionId !== adminSessionId) {
          window.sessionStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
          setAdminSessionId("");
          setIsLoggedIn(false);
        }
      } catch (err) {
        if (mounted) setError(err.message);
      }
    }

    async function heartbeatSession() {
      try {
        const active = await heartbeatAdminSession(adminSessionId);
        if (mounted && !active) {
          window.sessionStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
          setAdminSessionId("");
          setIsLoggedIn(false);
        }
      } catch (err) {
        if (mounted) setError(err.message);
      }
    }

    verifySession();
    const checkIntervalId = window.setInterval(verifySession, adminSessionCheckIntervalMs);
    const heartbeatIntervalId = window.setInterval(heartbeatSession, adminSessionHeartbeatIntervalMs);
    return () => {
      mounted = false;
      window.clearInterval(checkIntervalId);
      window.clearInterval(heartbeatIntervalId);
    };
  }, [adminSessionId, isLoggedIn]);

  if (!isLoggedIn) {
    return <AdminLogin onLogin={(sessionId) => { setAdminSessionId(sessionId); setIsLoggedIn(true); }} />;
  }

  function updateDraft(updater) {
    setScoreboard((current) => {
      const next = cloneScoreboard(current);
      updater(next);
      return next;
    });
  }

  function updateTournament(field, value) {
    updateDraft((draft) => {
      draft.tournament[field] = value;
    });
  }

  function updateMatch(field, value) {
    updateDraft((draft) => {
      draft.currentMatch[field] = value;
    });
  }

  function updateScore(field, value) {
    updateDraft((draft) => {
      draft.currentMatch.score[field] = field === "overs" || field.includes("Rate") ? value : toNumber(value);
    });
  }

  function updateTeam(teamId, field, value) {
    updateDraft((draft) => {
      draft.currentMatch.teams[teamId][field] = value;
    });
  }

  function updateTeamPlayers(teamId, players) {
    return updateDraftAndSave((draft) => {
      const match = draft.currentMatch;
      const team = match.teams[teamId];
      const normalizedPlayers = normalizePlayerList(players, []);
      team.players = normalizedPlayers;
      if (teamId === match.battingTeamId) {
        asArray(match.batters, []).forEach((batter, index) => {
          const replacementName = normalizedPlayers[index];
          const isPlaceholder = / Player [12]$/.test(String(batter?.name || ""));
          if (!replacementName || !isPlaceholder) return;
          const previousName = batter.name;
          batter.name = replacementName;
          batter.team = team.name;
          const scorecardPlayer = asArray(match.battingScorecard, []).find((player) => player.name === previousName);
          if (scorecardPlayer) Object.assign(scorecardPlayer, { name: replacementName, team: team.name });
        });
        syncBattingScorecard(match);
      }
      if (teamId === match.bowlingTeamId) {
        const replacementName = normalizedPlayers[0];
        const bowler = match.bowler || {};
        const isPlaceholder = / Bowler$/.test(String(bowler.name || ""));
        if (replacementName && isPlaceholder) {
          const previousName = bowler.name;
          bowler.name = replacementName;
          bowler.team = team.name;
          const scorecardBowler = asArray(match.bowlingScorecard, []).find((player) => player.name === previousName);
          if (scorecardBowler) Object.assign(scorecardBowler, { name: replacementName, team: team.name });
        }
        syncBowlingScorecard(match);
      }
    }, "Live team players updated.");
  }

  function updateTeamScore(teamId, field, value) {
    updateDraft((draft) => {
      const match = draft.currentMatch;
      match.teamScores = { ...(match.teamScores || {}) };
      match.teamScores[teamId] = { runs: 0, wickets: 0, overs: "0.0", ...(match.teamScores[teamId] || {}), [field]: field === "overs" ? value : toNumber(value) };
      if (teamId === match.battingTeamId) match.score[field] = field === "overs" ? value : toNumber(value);
    });
  }

  function getPlayerStats(name, team, role, existingPlayers = []) {
    return [...asArray(scoreboard.currentMatch.battingScorecard, []), ...existingPlayers].find((player) => player.name === name) || makePlayerStats(name, team, role);
  }

  function selectBatter(index, playerName) {
    if (!playerName) return;
    return updateDraftAndSave((draft) => {
      const match = draft.currentMatch;
      const battingTeam = match.teams[match.battingTeamId];
      const role = index === 0 ? "Striker" : "Non-striker";
      const player = getPlayerStats(playerName, battingTeam.name, role, match.batters);

      match.batters[index] = {
        ...player,
        name: playerName,
        team: battingTeam.name,
        role,
        dismissed: false,
        strikeRate: calculateStrikeRate(toNumber(player.runs), toNumber(player.balls))
      };
    }, `${index === 0 ? "Striker" : "Non-striker"} updated.`);
  }

  function setBatterOnStrike(index) {
    if (scoreboard.currentMatch.batters[index]?.dismissed) return;
    if (index === 0) return updateDraftAndSave((draft) => {
      draft.currentMatch.batters[0].role = "Striker";
      draft.currentMatch.batters[1].role = "Non-striker";
    }, "Striker confirmed.");
    return updateDraftAndSave((draft) => {
      const match = draft.currentMatch;
      const striker = match.batters[index];
      const nonStriker = match.batters[0];
      match.batters[0] = { ...striker, role: "Striker" };
      match.batters[index] = { ...nonStriker, role: "Non-striker" };
    }, `${scoreboard.currentMatch.batters[index]?.name || "Player"} is on strike.`);
  }

  function selectBowler(playerName) {
    if (!playerName) return;
    return updateDraftAndSave((draft) => {
      const match = draft.currentMatch;
      const bowlingTeam = match.teams[match.bowlingTeamId];
      syncBowlingScorecard(match);
      const existingBowler = asArray(match.bowlingScorecard, []).find((player) => player.name === playerName) || {};

      match.bowler = makeBowlerStats(playerName, bowlingTeam.name, existingBowler.overs || "0.0", existingBowler.runs, existingBowler.wickets, existingBowler.economy);
      syncBowlingScorecard(match);
    }, "Bowler updated.");
  }

  function updateBatter(index, field, value) {
    updateDraft((draft) => {
      const batter = draft.currentMatch.batters[index];
      const previousName = batter.name;
      batter[field] = ["runs", "balls", "fours", "sixes"].includes(field) ? toNumber(value) : value;
      batter.strikeRate = calculateStrikeRate(toNumber(batter.runs), toNumber(batter.balls));
      if (field === "name" && previousName && previousName !== value) {
        const scorecardPlayer = asArray(draft.currentMatch.battingScorecard, []).find((player) => player.name === previousName);
        if (scorecardPlayer) scorecardPlayer.name = value;
      }
      syncBattingScorecard(draft.currentMatch);
    });
  }

  function updateBowler(field, value) {
    updateDraft((draft) => {
      const previousName = draft.currentMatch.bowler.name;
      draft.currentMatch.bowler[field] = ["runs", "wickets"].includes(field) ? toNumber(value) : value;
      if (field === "name" && previousName && previousName !== value) {
        const scorecardBowler = asArray(draft.currentMatch.bowlingScorecard, []).find((player) => player.name === previousName);
        if (scorecardBowler) scorecardBowler.name = value;
      }
      syncBowlingScorecard(draft.currentMatch);
    });
  }

  function updateUpcoming(index, path, value) {
    updateDraft((draft) => {
      const match = draft.upcomingMatches[index];
      if (path.includes(".")) {
        const [parent, child] = path.split(".");
        match[parent] = match[parent] || {};
        match[parent][child] = value;
      } else {
        match[path] = value;
      }
    });
  }

  function updateUpcomingPlayers(index, teamKey, players) {
    updateDraft((draft) => {
      draft.upcomingMatches[index][teamKey].players = normalizePlayerList(players, []);
    });
  }

  function addUpcomingMatch() {
    const matchId = `match-${Date.now()}`;
    setShowUpcomingMatches(true);
    updateDraft((draft) => {
      draft.upcomingMatches.push({
        id: matchId,
        matchNo: `Match ${draft.upcomingMatches.length + 1}`,
        date: "",
        time: "",
        venue: "",
        teamA: { name: "", shortName: "", players: [] },
        teamB: { name: "", shortName: "", players: [] }
      });
    });
    setSelectedUpcomingId(matchId);
  }

  function removeUpcomingMatch(index) {
    return updateDraftAndSave((draft) => {
      draft.upcomingMatches.splice(index, 1);
    }, "Upcoming match removed.");
  }

  function cancelUpcomingMatch(index) {
    return updateDraftAndSave((draft) => {
      const upcoming = draft.upcomingMatches[index];
      if (!upcoming) return;
      draft.completedMatches = asArray(draft.completedMatches, []);
      draft.completedMatches.unshift({ ...upcoming, status: "CANCELLED", completedAt: new Date().toISOString() });
      draft.upcomingMatches.splice(index, 1);
    }, "Upcoming match cancelled.");
  }

  function makeUpcomingMatchLive(index, battingTeamId) {
    setPendingLiveMatchId("");
    setPendingUpcomingAction(null);
    return updateDraftAndSave((draft) => {
      const upcoming = draft.upcomingMatches[index];
      if (!upcoming) return;
      const teamAPlayers = normalizePlayerList(upcoming.teamA?.players, []);
      const teamBPlayers = normalizePlayerList(upcoming.teamB?.players, []);
      const teamAName = upcoming.teamA?.name || "Team A";
      const teamBName = upcoming.teamB?.name || "Team B";
      const firstBattingTeamId = battingTeamId === "teamB" ? "teamB" : "teamA";
      const firstBowlingTeamId = firstBattingTeamId === "teamA" ? "teamB" : "teamA";
      const firstBattingPlayers = firstBattingTeamId === "teamA" ? teamAPlayers : teamBPlayers;
      const firstBowlingPlayers = firstBowlingTeamId === "teamA" ? teamAPlayers : teamBPlayers;
      const firstBattingTeamName = firstBattingTeamId === "teamA" ? teamAName : teamBName;
      const firstBowlingTeamName = firstBowlingTeamId === "teamA" ? teamAName : teamBName;
      const striker = makePlayerStats(firstBattingPlayers[0] || `${firstBattingTeamName} Player 1`, firstBattingTeamName, "Striker");
      const nonStriker = makePlayerStats(firstBattingPlayers[1] || `${firstBattingTeamName} Player 2`, firstBattingTeamName, "Non-striker");
      const firstBowler = makeBowlerStats(firstBowlingPlayers[0] || `${firstBowlingTeamName} Bowler`, firstBowlingTeamName);
      draft.currentMatch = {
        id: upcoming.id,
        status: "LIVE",
        matchNo: upcoming.matchNo || `Match ${index + 1}`,
        date: upcoming.date || "",
        time: upcoming.time || "",
        venue: upcoming.venue || draft.tournament.venue,
        battingTeamId: firstBattingTeamId,
        bowlingTeamId: firstBowlingTeamId,
        inningsNumber: 1,
        innings: `${firstBattingTeamName} innings`,
        target: 0,
        score: { runs: 0, wickets: 0, overs: "0.0", runRate: "0.00", requiredRate: "0.00" },
        teams: {
          teamA: { ...upcoming.teamA, name: teamAName, shortName: upcoming.teamA?.shortName || "A", color: upcoming.teamA?.color || "#0f766e", players: teamAPlayers },
          teamB: { ...upcoming.teamB, name: teamBName, shortName: upcoming.teamB?.shortName || "B", color: upcoming.teamB?.color || "#b45309", players: teamBPlayers }
        },
        teamScores: {
          teamA: { runs: 0, wickets: 0, overs: "0.0" },
          teamB: { runs: 0, wickets: 0, overs: "0.0" }
        },
        batters: [striker, nonStriker],
        battingScorecard: [striker, nonStriker],
        bowler: firstBowler,
        bowlingScorecard: [firstBowler],
        extras: { ...DEFAULT_EXTRAS },
        freeHit: false,
        recentBalls: [],
        ballHistory: [],
        lastUpdated: new Date().toISOString()
      };
      draft.upcomingMatches.splice(index, 1);
    }, `${scoreboard.upcomingMatches[index]?.matchNo || "Match"} is live with ${battingTeamId === "teamB" ? scoreboard.upcomingMatches[index]?.teamB?.name || "Team B" : scoreboard.upcomingMatches[index]?.teamA?.name || "Team A"} batting.`);
  }

  function clearCurrentMatch(match) {
    match.id = "";
    match.status = "NONE";
    match.matchNo = "";
    match.score = { runs: 0, wickets: 0, overs: "0.0", runRate: "0.00", requiredRate: "0.00" };
    match.teamScores = {};
    match.recentBalls = [];
    match.ballHistory = [];
    match.lastUpdated = new Date().toISOString();
  }

  function removeCurrentMatch() {
    return updateDraftAndSave((draft) => {
      clearCurrentMatch(draft.currentMatch);
    }, "Current match removed.");
  }

  function removeCompletedMatch(index) {
    return updateDraftAndSave((draft) => {
      draft.completedMatches.splice(index, 1);
    }, "Completed match removed.");
  }

  function startSecondInnings() {
    return updateDraftAndSave((draft) => {
      const match = draft.currentMatch;
      if (toNumber(match.inningsNumber) >= 2) return;
      const firstBattingTeamId = match.battingTeamId;
      const firstBowlingTeamId = match.bowlingTeamId;
      const secondBattingTeamId = match.bowlingTeamId;
      const firstBattingTeam = match.teams[firstBattingTeamId];
      const secondBattingTeam = match.teams[secondBattingTeamId];
      const secondTeamPlayers = normalizePlayerList(secondBattingTeam?.players, []);
      const firstTeamPlayers = normalizePlayerList(firstBattingTeam?.players, []);
      const firstInningsScore = { runs: toNumber(match.score.runs), wickets: toNumber(match.score.wickets), overs: match.score.overs || "0.0" };
      const striker = makePlayerStats(secondTeamPlayers[0] || `${secondBattingTeam?.name || "Batting Team"} Player 1`, secondBattingTeam?.name || "Batting Team", "Striker");
      const nonStriker = makePlayerStats(secondTeamPlayers[1] || `${secondBattingTeam?.name || "Batting Team"} Player 2`, secondBattingTeam?.name || "Batting Team", "Non-striker");
      const secondInningsBowler = makeBowlerStats(firstTeamPlayers[0] || `${firstBattingTeam?.name || "Bowling Team"} Bowler`, firstBattingTeam?.name || "Bowling Team");
      syncBattingScorecard(match);
      syncBowlingScorecard(match);
      match.teamScores = { ...(match.teamScores || {}), [firstBattingTeamId]: firstInningsScore, [secondBattingTeamId]: { runs: 0, wickets: 0, overs: "0.0" } };
      match.inningsScorecards = { ...(match.inningsScorecards || {}), [firstBattingTeamId]: asArray(match.battingScorecard, []) };
      match.inningsBowlers = { ...(match.inningsBowlers || {}), [firstBowlingTeamId]: match.bowler };
      match.inningsBowlingScorecards = { ...(match.inningsBowlingScorecards || {}), [firstBowlingTeamId]: asArray(match.bowlingScorecard, []) };
      match.battingTeamId = secondBattingTeamId;
      match.bowlingTeamId = firstBattingTeamId;
      match.inningsNumber = 2;
      match.innings = `${secondBattingTeam?.name || "Batting Team"} innings`;
      match.target = firstInningsScore.runs + 1;
      match.score = { runs: 0, wickets: 0, overs: "0.0", runRate: "0.00", requiredRate: ((firstInningsScore.runs + 1) / 20).toFixed(2) };
      match.batters = [striker, nonStriker];
      match.battingScorecard = [striker, nonStriker];
      match.bowler = secondInningsBowler;
      match.bowlingScorecard = [secondInningsBowler];
      match.extras = { ...DEFAULT_EXTRAS };
      match.freeHit = false;
      match.recentBalls = [];
      match.ballHistory = [];
      match.status = "LIVE";
    }, "Second innings started. Teams and players have been switched.");
  }

  function updateCompletedTeamScore(index, teamId, field, value) {
    updateDraft((draft) => {
      const completed = draft.completedMatches[index];
      completed.teamScores = { ...(completed.teamScores || {}) };
      completed.teamScores[teamId] = { runs: 0, wickets: 0, overs: "0.0", ...(completed.teamScores[teamId] || {}), [field]: field === "overs" ? value : toNumber(value) };
    });
  }

  function updateCompletedWinner(index, winnerTeamId) {
    return updateDraftAndSave((draft) => {
      draft.completedMatches[index].winnerTeamId = winnerTeamId;
    }, winnerTeamId ? "Match winner updated." : "Match winner cleared.");
  }

  async function updateDraftAndSave(updater, successMessage = "Saved to Firebase.") {
    setStatus("Saving...");
    setError("");
    setIsAutoSaving(true);

    const next = cloneScoreboard(scoreboard);
    updater(next);
    recalculateMatch(next.currentMatch);
    setScoreboard(next);

    try {
      await updateScoreboard(next);
      setStatus(successMessage);
    } catch (err) {
      setError(err.message);
      setStatus("");
    } finally {
      setIsAutoSaving(false);
    }
  }

  function applyBall(eventOrLabel, dismissedPlayerName = "") {
    return updateDraftAndSave((draft) => {
      const event = typeof eventOrLabel === "string"
        ? BALL_EVENTS.find((item) => item.label === eventOrLabel)
        : eventOrLabel;
      if (!event) return;

      const match = draft.currentMatch;
      const score = match.score;
      const striker = match.batters[0];
      const bowler = match.bowler;
      const beforeState = JSON.parse(JSON.stringify({ score: match.score, batters: match.batters, battingScorecard: match.battingScorecard, bowler: match.bowler, bowlingScorecard: match.bowlingScorecard, extras: match.extras, freeHit: match.freeHit, recentBalls: match.recentBalls, teamScores: match.teamScores }));
      let overCompleted = false;

      score.runs = toNumber(score.runs) + toNumber(event.totalRuns);
      bowler.runs = Math.max(0, toNumber(bowler.runs) + toNumber(event.bowlerRuns));

      if (event.extraType) {
        match.extras = normalizeExtras(match.extras);
        match.extras[event.extraType] = toNumber(match.extras[event.extraType]) + toNumber(event.extraRuns);
      }

      if (event.batterRuns) {
        striker.runs = toNumber(striker.runs) + toNumber(event.batterRuns);
        if (event.batterRuns === 4) striker.fours = toNumber(striker.fours) + 1;
        if (event.batterRuns === 6) striker.sixes = toNumber(striker.sixes) + 1;
      }

      if (event.wicket) {
        score.wickets = toNumber(score.wickets) + 1;
        if (event.bowlerWicket) {
          bowler.wickets = toNumber(bowler.wickets) + 1;
        }
        const dismissedPlayer = match.batters.find((player) => player.name === dismissedPlayerName) || striker;
        dismissedPlayer.dismissed = true;
        dismissedPlayer.role = "Out";
      }

      if (event.strikerBall) {
        striker.balls = toNumber(striker.balls) + 1;
      }

      if (event.legal) {
        overCompleted = addLegalBall(match);
      }

      striker.strikeRate = calculateStrikeRate(toNumber(striker.runs), toNumber(striker.balls));
      match.freeHit = Boolean(event.freeHit);
      match.recentBalls = [event.label, ...(match.recentBalls || [])].slice(0, 6);
      match.ballHistory = [
        {
          label: event.label,
          display: event.display,
          runs: event.totalRuns,
          batterRuns: event.batterRuns,
          striker: striker.name,
          legal: event.legal,
          wicket: Boolean(event.wicket),
          dismissedPlayer: event.wicket ? dismissedPlayerName || striker.name : "",
          bowler: bowler.name,
          beforeState,
          time: new Date().toISOString()
        },
        ...(match.ballHistory || [])
      ].slice(0, 30);

      if (shouldSwitchStrike(event)) {
        switchStrike(match);
      }
      if (overCompleted) {
        switchStrike(match);
      }
    }, `Recorded ${typeof eventOrLabel === "string" ? eventOrLabel : eventOrLabel.label}.`);
  }

  function adjustRun(amount) {
    return updateDraftAndSave((draft) => {
      const match = draft.currentMatch;
      const score = match.score;
      const striker = match.batters[0];
      const bowler = match.bowler;
      const change = amount < 0 ? -Math.min(1, toNumber(score.runs), toNumber(striker.runs), toNumber(bowler.runs)) : amount;

      score.runs = Math.max(0, toNumber(score.runs) + change);
      striker.runs = Math.max(0, toNumber(striker.runs) + change);
      bowler.runs = Math.max(0, toNumber(bowler.runs) + change);
      striker.strikeRate = calculateStrikeRate(toNumber(striker.runs), toNumber(striker.balls));
    }, amount > 0 ? "Added 1 run." : "Removed 1 run.");
  }

  function recordWicket(playerName) {
    const label = pendingWicketLabel || "W";
    setPendingWicketLabel("");
    return applyBall(label, playerName);
  }

  function undoLastBall() {
    return updateDraftAndSave((draft) => {
      const match = draft.currentMatch;
      const lastAction = asArray(match.ballHistory, [])[0];
      if (!lastAction) return;
      if (lastAction.beforeState) {
        const before = lastAction.beforeState;
        match.score = before.score;
        match.batters = before.batters;
        match.battingScorecard = before.battingScorecard;
        match.bowler = before.bowler;
        match.bowlingScorecard = before.bowlingScorecard;
        match.extras = before.extras;
        match.freeHit = before.freeHit;
        match.recentBalls = before.recentBalls;
        match.teamScores = before.teamScores;
        match.ballHistory = asArray(match.ballHistory, []).slice(1);
        return;
      }
      const event = BALL_EVENTS.find((item) => item.label === lastAction.label);
      if (!event) return;
      const overCompleted = event.legal && String(match.score.overs || "0.0").split(".")[1] === "0" && match.score.overs !== "0.0";
      if (overCompleted) switchStrike(match);
      if (shouldSwitchStrike(event)) switchStrike(match);
      const striker = asArray(match.batters, []).find((player) => player.name === lastAction.striker) || match.batters[0];
      match.score.runs = Math.max(0, toNumber(match.score.runs) - toNumber(event.totalRuns));
      match.bowler.runs = Math.max(0, toNumber(match.bowler.runs) - toNumber(event.bowlerRuns));
      if (event.extraType) match.extras[event.extraType] = Math.max(0, toNumber(match.extras?.[event.extraType]) - toNumber(event.extraRuns));
      if (event.batterRuns) {
        striker.runs = Math.max(0, toNumber(striker.runs) - toNumber(event.batterRuns));
        if (event.batterRuns === 4) striker.fours = Math.max(0, toNumber(striker.fours) - 1);
        if (event.batterRuns === 6) striker.sixes = Math.max(0, toNumber(striker.sixes) - 1);
      }
      if (event.wicket) {
        match.score.wickets = Math.max(0, toNumber(match.score.wickets) - 1);
        if (event.bowlerWicket) match.bowler.wickets = Math.max(0, toNumber(match.bowler.wickets) - 1);
        const scorecardPlayer = asArray(match.battingScorecard, []).find((player) => player.name === lastAction.dismissedPlayer);
        const activePlayer = asArray(match.batters, []).find((player) => player.name === lastAction.dismissedPlayer);
        if (scorecardPlayer) Object.assign(scorecardPlayer, { dismissed: false, role: "Played" });
        if (activePlayer) Object.assign(activePlayer, { dismissed: false, role: activePlayer === match.batters[0] ? "Striker" : "Non-striker" });
      }
      if (event.strikerBall) striker.balls = Math.max(0, toNumber(striker.balls) - 1);
      if (event.legal) removeLegalBall(match);
      striker.strikeRate = calculateStrikeRate(toNumber(striker.runs), toNumber(striker.balls));
      match.freeHit = Boolean(BALL_EVENTS.find((item) => item.label === match.ballHistory?.[1]?.label)?.freeHit);
      match.recentBalls = asArray(match.recentBalls, []).slice(1);
      match.ballHistory = asArray(match.ballHistory, []).slice(1);
      syncBattingScorecard(match);
      syncBowlingScorecard(match);
    }, "Last ball undone.");
  }

  function removeWicket() {
    return updateDraftAndSave((draft) => {
      const match = draft.currentMatch;
      const striker = match.batters[0];

      match.score.wickets = Math.max(0, toNumber(match.score.wickets) - 1);

      if (match.ballHistory?.[0]?.wicket) {
        const dismissedName = match.ballHistory?.[0]?.dismissedPlayer;
        const scorecardPlayer = match.battingScorecard?.find((player) => player.name === dismissedName);
        const activePlayer = match.batters.find((player) => player.name === dismissedName);
        if (scorecardPlayer) Object.assign(scorecardPlayer, { dismissed: false, role: "Played" });
        if (activePlayer) Object.assign(activePlayer, { dismissed: false, role: activePlayer === match.batters[0] ? "Striker" : "Non-striker" });
        if (match.ballHistory[0].label === "W") match.bowler.wickets = Math.max(0, toNumber(match.bowler.wickets) - 1);
        match.recentBalls = match.recentBalls.slice(1);
        match.ballHistory = (match.ballHistory || []).slice(1);
        striker.balls = Math.max(0, toNumber(striker.balls) - 1);
        striker.strikeRate = calculateStrikeRate(toNumber(striker.runs), toNumber(striker.balls));
        removeLegalBall(match);
      }
    }, "Removed wicket.");
  }

  function updateMatchStatus(nextStatus) {
    return updateDraftAndSave((draft) => {
      const match = draft.currentMatch;
      if (nextStatus === "COMPLETED" || nextStatus === "CANCELLED") {
        draft.completedMatches = asArray(draft.completedMatches, []);
        syncBattingScorecard(match);
        syncBowlingScorecard(match);
        match.teamScores = { ...(match.teamScores || {}) };
        if (match.battingTeamId) match.teamScores[match.battingTeamId] = { ...(match.teamScores[match.battingTeamId] || {}), runs: toNumber(match.score.runs), wickets: toNumber(match.score.wickets), overs: match.score.overs || "0.0" };
        match.inningsScorecards = { ...(match.inningsScorecards || {}) };
        match.inningsBowlers = { ...(match.inningsBowlers || {}) };
        match.inningsBowlingScorecards = { ...(match.inningsBowlingScorecards || {}) };
        if (match.battingTeamId) match.inningsScorecards[match.battingTeamId] = asArray(match.battingScorecard, []);
        if (match.bowlingTeamId) match.inningsBowlers[match.bowlingTeamId] = match.bowler;
        if (match.bowlingTeamId) match.inningsBowlingScorecards[match.bowlingTeamId] = asArray(match.bowlingScorecard, []);
        const archived = { ...match, status: nextStatus, completedAt: new Date().toISOString() };
        const existingIndex = draft.completedMatches.findIndex((item) => item.id && item.id === archived.id);
        if (existingIndex >= 0) draft.completedMatches[existingIndex] = archived;
        if (existingIndex < 0) draft.completedMatches.unshift(archived);
        clearCurrentMatch(match);
        return;
      }
      match.status = nextStatus;
    }, `Status changed to ${nextStatus}.`);
  }

  async function saveScoreboard(event) {
    event?.preventDefault();
    setStatus("");
    setError("");

    try {
      const next = cloneScoreboard(scoreboard);
      recalculateMatch(next.currentMatch);
      await updateScoreboard(next);
      setScoreboard(next);
      setStatus("Saved to Firebase.");
    } catch (err) {
      setError(err.message);
    }
  }

  function logout() {
    releaseAdminSession(adminSessionId).catch(() => {});
    window.sessionStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
    setAdminSessionId("");
    setIsLoggedIn(false);
  }

  const match = scoreboard.currentMatch;
  const teams = match.teams;
  const battingTeam = teams[match.battingTeamId];
  const bowlingTeam = teams[match.bowlingTeamId];
  const dismissedPlayerNames = new Set(asArray(match.battingScorecard, []).filter((player) => player.dismissed).map((player) => player.name));
  const battingPlayers = normalizePlayerList(battingTeam?.players, match.batters.map((player) => player.name)).filter((playerName) => !dismissedPlayerNames.has(playerName));
  const bowlingPlayers = Array.from(new Set([...normalizePlayerList(bowlingTeam?.players, []), match.bowler.name, ...asArray(match.bowlingScorecard, []).map((player) => player.name)].filter(Boolean)));
  const wicketCandidates = match.batters.filter((player) => player?.name && !player.dismissed);
  const hasCurrentMatch = !["", "NONE", "UPCOMING"].includes(String(match.status || "").toUpperCase());
  const canRemoveOneRun = hasCurrentMatch && toNumber(match.score?.runs) > 0 && toNumber(match.batters[0]?.runs) > 0 && toNumber(match.bowler?.runs) > 0;
  const canUndoLastBall = hasCurrentMatch && asArray(match.ballHistory, []).length > 0;

  return (
    <main className="admin-shell">
      <header className="admin-topbar">
        <div className="admin-title">
          <span><Trophy size={24} /></span>
          <div>
            <h1>Scoreboard Admin</h1>
            <p>{usingFirebase ? "Connected to Firebase" : "Firebase config missing"}</p>
          </div>
        </div>
        <div className="admin-actions">
          <a className="secondary-button" href="./">View Scoreboard</a>
          <button className="secondary-button" type="button" onClick={logout}>
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </header>

      {status ? <div className="notice">{status}</div> : null}
      {error ? <div className="alert">{error}</div> : null}

      <form className="admin-grid" onSubmit={saveScoreboard}>
        <section className="admin-card tournament-admin-card">
          <h2>Tournament Settings</h2>
          <div className="form-grid">
            <Field label="Tournament name" value={scoreboard.tournament.name} onChange={(value) => updateTournament("name", value)} />
            <Field label="Season" value={scoreboard.tournament.season} onChange={(value) => updateTournament("season", value)} />
            <Field label="Venue" value={scoreboard.tournament.venue} onChange={(value) => updateTournament("venue", value)} />
          </div>
        </section>

        {hasCurrentMatch ? <section className="admin-card current-match-admin-card">
          <div className="card-heading-row">
            <h2>Live Match Controls</h2>
            <button type="button" className="danger-button" onClick={removeCurrentMatch} disabled={isAutoSaving}>Remove Match</button>
          </div>
          <div className="form-grid">
            <Field label="Status" value={match.status} onChange={(value) => updateMatch("status", value)} />
            <Field label="Match no" value={match.matchNo} onChange={(value) => updateMatch("matchNo", value)} />
            <Field label="Innings" value={match.innings} onChange={(value) => updateMatch("innings", value)} />
            <Field label="Target" type="number" min="0" value={match.target} onChange={(value) => updateMatch("target", toNumber(value))} />
            <Field label="Runs" type="number" min="0" value={match.score.runs} onChange={(value) => updateScore("runs", value)} />
            <Field label="Wickets" type="number" min="0" value={match.score.wickets} onChange={(value) => updateScore("wickets", value)} />
            <Field label="Overs" value={match.score.overs} onChange={(value) => updateScore("overs", value)} />
            <Field label="Run rate" value={match.score.runRate} onChange={(value) => updateScore("runRate", value)} />
            <Field label="Required rate" value={match.score.requiredRate} onChange={(value) => updateScore("requiredRate", value)} />
          </div>
          <div className="extras-strip">
            <span>Extras: {match.extras?.total || 0}</span>
            <span>Wd {match.extras?.wides || 0}</span>
            <span>NB {match.extras?.noBalls || 0}</span>
            <span>B {match.extras?.byes || 0}</span>
            <span>LB {match.extras?.legByes || 0}</span>
            <span>{match.freeHit ? "Free hit active" : "Free hit inactive"}</span>
          </div>

          <div className="status-controls">
            <span>Match status</span>
            {["PRE LIVE", "LIVE", "INNINGS BREAK", "COMPLETED", "CANCELLED"].map((nextStatus) => (
              <button
                type="button"
                key={nextStatus}
                onClick={() => updateMatchStatus(nextStatus)}
                className={match.status === nextStatus ? "active-status" : ""}
                disabled={isAutoSaving}
              >
                {nextStatus}
              </button>
            ))}
            <button type="button" className="second-innings-button" onClick={startSecondInnings} disabled={isAutoSaving || toNumber(match.inningsNumber) >= 2}>
              <ArrowLeftRight size={16} />
              {toNumber(match.inningsNumber) >= 2 ? "Second Innings Active" : "Start Second Innings"}
            </button>
          </div>

          <div className="score-actions">
            <button type="button" onClick={undoLastBall} disabled={isAutoSaving || !canUndoLastBall}>
              <Undo2 size={16} />
              Undo Last Ball
            </button>
            <button type="button" onClick={() => adjustRun(1)} disabled={isAutoSaving}>
              <Plus size={16} />
              Add 1 Run
            </button>
            <button type="button" onClick={() => adjustRun(-1)} disabled={isAutoSaving || !canRemoveOneRun}>
              <Minus size={16} />
              Remove 1 Run
            </button>
            <button type="button" className="danger-ball" onClick={() => setPendingWicketLabel("W")} disabled={isAutoSaving}>
              <Plus size={16} />
              Add Wicket
            </button>
            <button type="button" className="danger-ball" onClick={removeWicket} disabled={isAutoSaving}>
              <Minus size={16} />
              Remove Wicket
            </button>
            <button type="button" onClick={() => applyBall("Wd")} disabled={isAutoSaving}>
              <Zap size={16} />
              Add Wide Ball
            </button>
          </div>

          {pendingWicketLabel ? <div className="wicket-player-picker">
            <div>
              <strong>Select dismissed player</strong>
              <span>{pendingWicketLabel === "RO" ? "Run out" : "Wicket"}</span>
            </div>
            <div className="wicket-player-actions">
              {wicketCandidates.map((player) => <button type="button" className="danger-button" onClick={() => recordWicket(player.name)} disabled={isAutoSaving} key={player.name}>{player.name}</button>)}
              <button type="button" className="secondary-button" onClick={() => setPendingWicketLabel("")}>Cancel</button>
            </div>
          </div> : null}

          <div className="event-groups">
            {[
              ["Legal ball", ["0", "1", "2", "3", "4", "5", "6", "W", "RO"]],
              ["Wide", ["Wd", "Wd+1", "Wd+2", "Wd+3", "Wd+4"]],
              ["No ball", ["NB", "NB+1", "NB+2", "NB+3", "NB+4", "NB+6"]],
              ["Byes", ["B1", "B2", "B3", "B4"]],
              ["Leg byes", ["LB1", "LB2", "LB3", "LB4"]],
              ["Penalty", ["P5"]]
            ].map(([groupName, eventLabels]) => (
              <div className="quick-balls" key={groupName}>
                <span>{groupName}</span>
                {eventLabels.map((eventLabel) => {
                  const event = BALL_EVENTS.find((item) => item.label === eventLabel);
                  return (
                    <button
                      type="button"
                      key={eventLabel}
                      title={event?.display}
                      onClick={() => event?.wicket ? setPendingWicketLabel(eventLabel) : applyBall(eventLabel)}
                      className={event?.wicket ? "danger-ball" : ""}
                      disabled={isAutoSaving}
                    >
                      {eventLabel}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </section> : null}

        {hasCurrentMatch ? <section className="admin-card teams-admin-card">
          <h2>Team Details</h2>
          <div className="team-edit-grid">
            {Object.entries(teams).map(([teamId, team]) => (
              <div className="mini-panel" key={teamId}>
                <h3>{teamId === match.battingTeamId ? "Batting Team" : "Bowling Team"}</h3>
                <Field label="Name" value={team.name} onChange={(value) => updateTeam(teamId, "name", value)} />
                <Field label="Short name" value={team.shortName} onChange={(value) => updateTeam(teamId, "shortName", value)} />
                <Field label="Color" type="color" value={team.color} onChange={(value) => updateTeam(teamId, "color", value)} />
                <div className="team-score-editor">
                  <Field label="Innings runs" type="number" min="0" value={match.teamScores?.[teamId]?.runs ?? 0} onChange={(value) => updateTeamScore(teamId, "runs", value)} />
                  <Field label="Innings wickets" type="number" min="0" value={match.teamScores?.[teamId]?.wickets ?? 0} onChange={(value) => updateTeamScore(teamId, "wickets", value)} />
                  <Field label="Innings overs" value={match.teamScores?.[teamId]?.overs ?? "0.0"} onChange={(value) => updateTeamScore(teamId, "overs", value)} />
                </div>
                <PlayerListField
                  label="Players, comma or line separated"
                  players={team.players}
                  onCommit={(players) => updateTeamPlayers(teamId, players)}
                />
              </div>
            ))}
          </div>
        </section> : null}

        {hasCurrentMatch ? <section className="admin-card players-admin-card">
          <h2>Player Details</h2>
          <div className="form-grid player-select-grid">
            <SelectField
              label="Striker"
              value={match.batters[0]?.name}
              options={battingPlayers}
              onChange={(value) => selectBatter(0, value)}
            />
            <SelectField
              label="Non-striker"
              value={match.batters[1]?.name}
              options={battingPlayers}
              onChange={(value) => selectBatter(1, value)}
            />
            <SelectField
              label="Current bowler"
              value={match.bowler?.name}
              options={bowlingPlayers}
              onChange={selectBowler}
            />
          </div>
          <div className="team-edit-grid">
            {match.batters.map((batter, index) => (
              <div className={index === 0 ? "mini-panel striker-admin-panel" : "mini-panel"} key={`${batter.name}-${index}`}>
                <div className="mini-panel-title">
                  <h3>{index === 0 ? "Striker" : "Non-striker"}</h3>
                  {batter.dismissed ? <span className="out-badge">Out</span> : index === 0 ? <span className="strike-badge">On strike</span> : <button type="button" className="strike-button" onClick={() => setBatterOnStrike(index)} disabled={isAutoSaving}>Set on strike</button>}
                </div>
                <Field label="Name" value={batter.name} onChange={(value) => updateBatter(index, "name", value)} onBlur={saveScoreboard} />
                <Field label="Team" value={batter.team} onChange={(value) => updateBatter(index, "team", value)} onBlur={saveScoreboard} />
                <Field label="Runs" type="number" min="0" value={batter.runs} onChange={(value) => updateBatter(index, "runs", value)} onBlur={saveScoreboard} />
                <Field label="Balls" type="number" min="0" value={batter.balls} onChange={(value) => updateBatter(index, "balls", value)} onBlur={saveScoreboard} />
                <Field label="Fours" type="number" min="0" value={batter.fours} onChange={(value) => updateBatter(index, "fours", value)} onBlur={saveScoreboard} />
                <Field label="Sixes" type="number" min="0" value={batter.sixes} onChange={(value) => updateBatter(index, "sixes", value)} onBlur={saveScoreboard} />
              </div>
            ))}
            <div className="mini-panel">
              <h3>Bowler</h3>
              <Field label="Name" value={match.bowler.name} onChange={(value) => updateBowler("name", value)} onBlur={saveScoreboard} />
              <Field label="Team" value={match.bowler.team} onChange={(value) => updateBowler("team", value)} onBlur={saveScoreboard} />
              <Field label="Overs" value={match.bowler.overs} onChange={(value) => updateBowler("overs", value)} onBlur={saveScoreboard} />
              <Field label="Runs" type="number" min="0" value={match.bowler.runs} onChange={(value) => updateBowler("runs", value)} onBlur={saveScoreboard} />
              <Field label="Wickets" type="number" min="0" value={match.bowler.wickets} onChange={(value) => updateBowler("wickets", value)} onBlur={saveScoreboard} />
              <Field label="Economy" value={match.bowler.economy} onChange={(value) => updateBowler("economy", value)} onBlur={saveScoreboard} />
            </div>
          </div>
          <TextAreaField
            label="Recent balls, comma separated"
            value={(match.recentBalls || []).join(", ")}
            onChange={(value) => updateMatch("recentBalls", value.split(",").map((item) => item.trim()).filter(Boolean))}
          />
        </section> : null}

        <section className="admin-card admin-card-wide admin-upcoming-card">
          <div className="card-heading-row">
            <button type="button" className="admin-section-toggle" onClick={() => setShowUpcomingMatches((current) => !current)} aria-expanded={showUpcomingMatches}>
              <span>
                <strong>Upcoming Matches</strong>
                <small>{scoreboard.upcomingMatches.length} match{scoreboard.upcomingMatches.length === 1 ? "" : "es"}</small>
              </span>
              <ChevronDown size={19} />
            </button>
            <button type="button" className="secondary-button" onClick={addUpcomingMatch}>
              <CalendarPlus size={16} />
              Add Match
            </button>
          </div>
          {showUpcomingMatches ? <div className="upcoming-admin-list">
            {scoreboard.upcomingMatches.length === 0 ? (
              <div className="empty-state">
                No upcoming matches added.
              </div>
            ) : null}
            {scoreboard.upcomingMatches.map((upcoming, index) => (
              <div className={selectedUpcomingId === upcoming.id ? "mini-panel selected-upcoming-admin" : "mini-panel"} key={upcoming.id}>
                <div className="card-heading-row">
                  <button type="button" className="upcoming-select-button" onClick={() => setSelectedUpcomingId(selectedUpcomingId === upcoming.id ? "" : upcoming.id)}>
                    <strong>{upcoming.matchNo || `Match ${index + 1}`}</strong>
                    <span>{upcoming.teamA?.name || "Team A"} vs {upcoming.teamB?.name || "Team B"} · {formatMatchSchedule(upcoming.date, upcoming.time) || "Date pending"}</span>
                  </button>
                  <div className="upcoming-admin-actions">
                    <button type="button" className="primary-button" onClick={() => { setPendingLiveMatchId(""); setPendingUpcomingAction({ matchId: upcoming.id, action: "live", index }); }} disabled={isAutoSaving}>Make Live</button>
                    <button type="button" className="secondary-button" onClick={() => { setPendingLiveMatchId(""); setPendingUpcomingAction({ matchId: upcoming.id, action: "cancel", index }); }} disabled={isAutoSaving}>Cancel</button>
                    <button type="button" className="danger-button" onClick={() => { setPendingLiveMatchId(""); setPendingUpcomingAction({ matchId: upcoming.id, action: "remove", index }); }} disabled={isAutoSaving}>Remove</button>
                  </div>
                </div>
                {pendingUpcomingAction?.matchId === upcoming.id ? <div className={`upcoming-confirmation ${pendingUpcomingAction.action === "live" ? "confirm-live" : "confirm-danger"}`}>
                  <div>
                    <strong>Are you sure you want to {pendingUpcomingAction.action === "live" ? "make this match live" : `${pendingUpcomingAction.action} this match`}?</strong>
                    <span>{upcoming.matchNo || `Match ${index + 1}`} · {upcoming.teamA?.name || "Team A"} vs {upcoming.teamB?.name || "Team B"}</span>
                  </div>
                  <div>
                    <button type="button" className={pendingUpcomingAction.action === "remove" ? "danger-button" : "primary-button"} onClick={() => {
                      const action = pendingUpcomingAction.action;
                      setPendingUpcomingAction(null);
                      if (action === "live") setPendingLiveMatchId(upcoming.id);
                      if (action === "cancel") cancelUpcomingMatch(index);
                      if (action === "remove") removeUpcomingMatch(index);
                    }} disabled={isAutoSaving}>Yes, confirm</button>
                    <button type="button" className="secondary-button" onClick={() => setPendingUpcomingAction(null)} disabled={isAutoSaving}>No, keep match</button>
                  </div>
                </div> : null}
                {pendingLiveMatchId === upcoming.id ? <div className="batting-team-picker">
                  <div>
                    <strong>Which team will bat first?</strong>
                    <span>The other team will be selected for the second innings.</span>
                  </div>
                  <div>
                    <button type="button" className="primary-button" onClick={() => makeUpcomingMatchLive(index, "teamA")} disabled={isAutoSaving}>{upcoming.teamA?.name || "Team A"}</button>
                    <button type="button" className="primary-button" onClick={() => makeUpcomingMatchLive(index, "teamB")} disabled={isAutoSaving}>{upcoming.teamB?.name || "Team B"}</button>
                    <button type="button" className="secondary-button" onClick={() => setPendingLiveMatchId("")}>Close</button>
                  </div>
                </div> : null}
                {selectedUpcomingId === upcoming.id ? <>
                  <div className="form-grid">
                    <Field label="Match no" value={upcoming.matchNo} onChange={(value) => updateUpcoming(index, "matchNo", value)} />
                    <Field label="Date" type="date" value={upcoming.date} onChange={(value) => updateUpcoming(index, "date", value)} />
                    <Field label="Time" type="time" value={upcoming.time} onChange={(value) => updateUpcoming(index, "time", value)} />
                    <Field label="Venue" value={upcoming.venue} onChange={(value) => updateUpcoming(index, "venue", value)} />
                    <Field label="Team A" value={upcoming.teamA.name} onChange={(value) => updateUpcoming(index, "teamA.name", value)} />
                    <Field label="Team A short" value={upcoming.teamA.shortName} onChange={(value) => updateUpcoming(index, "teamA.shortName", value)} />
                    <Field label="Team B" value={upcoming.teamB.name} onChange={(value) => updateUpcoming(index, "teamB.name", value)} />
                    <Field label="Team B short" value={upcoming.teamB.shortName} onChange={(value) => updateUpcoming(index, "teamB.shortName", value)} />
                  </div>
                  <div className="team-edit-grid">
                    <PlayerListField label="Team A players" players={upcoming.teamA.players} onCommit={(players) => updateUpcomingPlayers(index, "teamA", players)} />
                    <PlayerListField label="Team B players" players={upcoming.teamB.players} onCommit={(players) => updateUpcomingPlayers(index, "teamB", players)} />
                  </div>
                </> : null}
              </div>
            ))}
          </div> : null}
        </section>

        <section className="admin-card admin-card-wide admin-completed-card">
          <div className="card-heading-row">
            <button type="button" className="admin-section-toggle" onClick={() => setShowCompletedMatches((current) => !current)} aria-expanded={showCompletedMatches}>
              <span>
                <strong>Completed / Cancelled Matches</strong>
                <small>{scoreboard.completedMatches.length} match{scoreboard.completedMatches.length === 1 ? "" : "es"}</small>
              </span>
              <ChevronDown size={19} />
            </button>
          </div>
          {showCompletedMatches ? <div className="completed-admin-list">
            {scoreboard.completedMatches.length === 0 ? <div className="empty-state">No completed or cancelled matches.</div> : null}
            {scoreboard.completedMatches.map((completed, index) => {
              const completedTeamIds = completed.teams ? Object.keys(completed.teams) : ["teamA", "teamB"].filter((teamId) => completed[teamId]);
              return (
              <div className="completed-admin-row completed-admin-score-row" key={completed.id || `${completed.matchNo}-${index}`}>
                <div className="completed-admin-summary">
                  <strong>{completed.matchNo || `Match ${index + 1}`}</strong>
                  <span>{completed.status} · {completed.teams ? `${completed.teams[completed.battingTeamId]?.name || "Team A"} vs ${completed.teams[completed.bowlingTeamId]?.name || "Team B"}` : `${completed.teamA?.name || "Team A"} vs ${completed.teamB?.name || "Team B"}`}</span>
                </div>
                {String(completed.status || "").toUpperCase() !== "CANCELLED" ? <div className="completed-score-editor">
                  {completedTeamIds.map((teamId) => <div className="completed-team-score-editor" key={teamId}>
                    <strong>{completed.teams?.[teamId]?.shortName || completed.teams?.[teamId]?.name || completed[teamId]?.shortName || completed[teamId]?.name || teamId}</strong>
                    <Field label="Runs" type="number" min="0" value={completed.teamScores?.[teamId]?.runs ?? ""} onChange={(value) => updateCompletedTeamScore(index, teamId, "runs", value)} />
                    <Field label="Wickets" type="number" min="0" value={completed.teamScores?.[teamId]?.wickets ?? ""} onChange={(value) => updateCompletedTeamScore(index, teamId, "wickets", value)} />
                    <Field label="Overs" value={completed.teamScores?.[teamId]?.overs ?? ""} onChange={(value) => updateCompletedTeamScore(index, teamId, "overs", value)} />
                  </div>)}
                  <label className="field completed-winner-field">
                    <span>Winner</span>
                    <select value={completed.winnerTeamId || ""} onChange={(event) => updateCompletedWinner(index, event.target.value)} disabled={isAutoSaving}>
                      <option value="">Not selected</option>
                      {completedTeamIds.map((teamId) => <option value={teamId} key={teamId}>{completed.teams?.[teamId]?.name || completed[teamId]?.name || teamId}</option>)}
                    </select>
                  </label>
                </div> : null}
                <button type="button" className="danger-button" onClick={() => removeCompletedMatch(index)} disabled={isAutoSaving}>Remove</button>
              </div>
              );
            })}
          </div> : null}
        </section>

        <div className="sticky-save">
          <button className="primary-button" type="submit">
            <Save size={17} />
            Save to Firebase
          </button>
          {hasCurrentMatch ? <button className="secondary-button" type="button" onClick={() => applyBall("1")} disabled={isAutoSaving}>
            <Zap size={16} />
            Add 1 Run
          </button> : null}
          {hasCurrentMatch ? <button className="danger-button" type="button" onClick={() => adjustRun(-1)} disabled={isAutoSaving || !canRemoveOneRun}>
            <Minus size={16} />
            Remove 1 Run
          </button> : null}
          {hasCurrentMatch ? <button className="secondary-button" type="button" onClick={undoLastBall} disabled={isAutoSaving || !canUndoLastBall}>
            <Undo2 size={16} />
            Undo Last Ball
          </button> : null}
        </div>
      </form>
    </main>
  );
}
