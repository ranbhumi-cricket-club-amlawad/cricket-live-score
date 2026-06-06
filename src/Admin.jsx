import React, { useEffect, useMemo, useState } from "react";
import { CalendarPlus, LogOut, Minus, Plus, Save, ShieldCheck, Trophy, Zap } from "lucide-react";
import { fetchScoreboard, hasFirebaseConfig, updateScoreboard } from "./firebaseScoreboard";
import { sampleScoreboard } from "./sampleData";

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "Score@2026";
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
    .split(/[\n,]/)
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
    const role = index === 0 ? "Striker" : "Non-striker";
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

function normalizeScoreboard(value) {
  const source = value || {};
  const sample = sampleScoreboard;
  const currentMatch = source.currentMatch || {};
  const sampleMatch = sample.currentMatch;
  const sourceTeams = currentMatch.teams || {};
  const teams = {
    ...sampleMatch.teams,
    ...sourceTeams
  };
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

  const normalized = {
    tournament: {
      ...sample.tournament,
      ...(source.tournament || {})
    },
    currentMatch: {
      ...sampleMatch,
      ...currentMatch,
      score: {
        ...sampleMatch.score,
        ...(currentMatch.score || {})
      },
      teams,
      batters,
      battingScorecard: asArray(currentMatch.battingScorecard, sampleMatch.battingScorecard || batters),
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
    }))
  };

  if (normalized.currentMatch.batters.length < 2) {
    normalized.currentMatch.batters = [
      ...normalized.currentMatch.batters,
      ...sampleMatch.batters.slice(normalized.currentMatch.batters.length)
    ];
  }

  syncBattingScorecard(normalized.currentMatch);

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
  match.extras = normalizeExtras(match.extras);
  const matchOvers = decimalOvers(score.overs);
  const bowlerOvers = decimalOvers(match.bowler.overs);
  const remainingRuns = Math.max(0, toNumber(match.target) - toNumber(score.runs));
  const remainingOvers = Math.max(1, 20 - matchOvers);

  score.runRate = matchOvers > 0 ? (toNumber(score.runs) / matchOvers).toFixed(2) : "0.00";
  score.requiredRate = (remainingRuns / remainingOvers).toFixed(2);
  match.bowler.economy = bowlerOvers > 0 ? (toNumber(match.bowler.runs) / bowlerOvers).toFixed(2) : "0.00";
  match.lastUpdated = new Date().toISOString();
}

function switchStrike(match) {
  match.batters = [match.batters[1], match.batters[0]];
  match.batters[0].role = "Striker";
  match.batters[1].role = "Non-striker";
}

function shouldSwitchStrike(event) {
  const completedRuns = event.extraType === "wides" ? Math.max(0, toNumber(event.totalRuns) - 1) : toNumber(event.totalRuns);
  return completedRuns % 2 === 1;
}

function Field({ label, value, onChange, type = "text", min }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type={type} min={min} value={value ?? ""} onChange={(event) => onChange(event.target.value)} />
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

  function handleSubmit(event) {
    event.preventDefault();
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      window.sessionStorage.setItem("cricket-admin", "true");
      onLogin();
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

        <button className="primary-button" type="submit">
          <ShieldCheck size={17} />
          Login
        </button>
      </form>
    </main>
  );
}

export function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => window.sessionStorage.getItem("cricket-admin") === "true");
  const [scoreboard, setScoreboard] = useState(() => cloneScoreboard(sampleScoreboard));
  const [selectedUpcomingId, setSelectedUpcomingId] = useState("");
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

  if (!isLoggedIn) {
    return <AdminLogin onLogin={() => setIsLoggedIn(true)} />;
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

  function updateTeamPlayers(teamId, value) {
    updateDraft((draft) => {
      draft.currentMatch.teams[teamId].players = splitPlayers(value);
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
        strikeRate: calculateStrikeRate(toNumber(player.runs), toNumber(player.balls))
      };
    }, `${index === 0 ? "Striker" : "Non-striker"} updated.`);
  }

  function setBatterOnStrike(index) {
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
      const existingBowler = match.bowler?.name === playerName ? match.bowler : {};

      match.bowler = {
        name: playerName,
        team: bowlingTeam.name,
        overs: existingBowler.overs || "0.0",
        runs: toNumber(existingBowler.runs),
        wickets: toNumber(existingBowler.wickets),
        economy: existingBowler.economy || "0.00"
      };
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
      draft.currentMatch.bowler[field] = ["runs", "wickets"].includes(field) ? toNumber(value) : value;
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

  function updateUpcomingPlayers(index, teamKey, value) {
    updateDraft((draft) => {
      draft.upcomingMatches[index][teamKey].players = splitPlayers(value);
    });
  }

  function addUpcomingMatch() {
    const matchId = `match-${Date.now()}`;
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
    updateDraft((draft) => {
      draft.upcomingMatches.splice(index, 1);
    });
  }

  function makeUpcomingMatchLive(index) {
    return updateDraftAndSave((draft) => {
      const upcoming = draft.upcomingMatches[index];
      if (!upcoming) return;
      const teamAPlayers = normalizePlayerList(upcoming.teamA?.players, []);
      const teamBPlayers = normalizePlayerList(upcoming.teamB?.players, []);
      const teamAName = upcoming.teamA?.name || "Team A";
      const teamBName = upcoming.teamB?.name || "Team B";
      const striker = makePlayerStats(teamAPlayers[0] || `${teamAName} Player 1`, teamAName, "Striker");
      const nonStriker = makePlayerStats(teamAPlayers[1] || `${teamAName} Player 2`, teamAName, "Non-striker");
      draft.currentMatch = {
        id: upcoming.id,
        status: "LIVE",
        matchNo: upcoming.matchNo || `Match ${index + 1}`,
        date: upcoming.date || "",
        time: upcoming.time || "",
        venue: upcoming.venue || draft.tournament.venue,
        battingTeamId: "teamA",
        bowlingTeamId: "teamB",
        innings: `${teamAName} innings`,
        target: 0,
        score: { runs: 0, wickets: 0, overs: "0.0", runRate: "0.00", requiredRate: "0.00" },
        teams: {
          teamA: { ...upcoming.teamA, name: teamAName, shortName: upcoming.teamA?.shortName || "A", color: upcoming.teamA?.color || "#0f766e", players: teamAPlayers },
          teamB: { ...upcoming.teamB, name: teamBName, shortName: upcoming.teamB?.shortName || "B", color: upcoming.teamB?.color || "#b45309", players: teamBPlayers }
        },
        batters: [striker, nonStriker],
        battingScorecard: [striker, nonStriker],
        bowler: { name: teamBPlayers[0] || `${teamBName} Bowler`, team: teamBName, overs: "0.0", runs: 0, wickets: 0, economy: "0.00" },
        extras: { ...DEFAULT_EXTRAS },
        freeHit: false,
        recentBalls: [],
        ballHistory: [],
        lastUpdated: new Date().toISOString()
      };
      draft.upcomingMatches.splice(index, 1);
    }, `${scoreboard.upcomingMatches[index]?.matchNo || "Match"} is now live.`);
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

  function applyBall(eventOrLabel) {
    return updateDraftAndSave((draft) => {
      const event = typeof eventOrLabel === "string"
        ? BALL_EVENTS.find((item) => item.label === eventOrLabel)
        : eventOrLabel;
      if (!event) return;

      const match = draft.currentMatch;
      const score = match.score;
      const striker = match.batters[0];
      const bowler = match.bowler;
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

      score.runs = Math.max(0, toNumber(score.runs) + amount);
      striker.runs = Math.max(0, toNumber(striker.runs) + amount);
      bowler.runs = Math.max(0, toNumber(bowler.runs) + amount);
      striker.strikeRate = calculateStrikeRate(toNumber(striker.runs), toNumber(striker.balls));
    }, amount > 0 ? "Added 1 run." : "Removed 1 run.");
  }

  function addWicket() {
    return updateDraftAndSave((draft) => {
      const match = draft.currentMatch;
      const striker = match.batters[0];

      match.score.wickets = toNumber(match.score.wickets) + 1;
      match.bowler.wickets = toNumber(match.bowler.wickets) + 1;
      striker.balls = toNumber(striker.balls) + 1;
      striker.strikeRate = calculateStrikeRate(toNumber(striker.runs), toNumber(striker.balls));
      const overCompleted = addLegalBall(match);
      match.recentBalls = ["W", ...(match.recentBalls || [])].slice(0, 6);
      match.ballHistory = [{ label: "W", display: "Wicket", runs: 0, batterRuns: 0, striker: striker.name, legal: true, wicket: true, time: new Date().toISOString() }, ...(match.ballHistory || [])].slice(0, 30);
      if (overCompleted) {
        switchStrike(match);
      }
    }, "Added wicket.");
  }

  function removeWicket() {
    return updateDraftAndSave((draft) => {
      const match = draft.currentMatch;
      const striker = match.batters[0];

      match.score.wickets = Math.max(0, toNumber(match.score.wickets) - 1);
      match.bowler.wickets = Math.max(0, toNumber(match.bowler.wickets) - 1);

      if ((match.recentBalls || [])[0] === "W") {
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
      draft.currentMatch.status = nextStatus;
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
    window.sessionStorage.removeItem("cricket-admin");
    setIsLoggedIn(false);
  }

  const match = scoreboard.currentMatch;
  const teams = match.teams;
  const battingTeam = teams[match.battingTeamId];
  const bowlingTeam = teams[match.bowlingTeamId];
  const battingPlayers = normalizePlayerList(battingTeam?.players, match.batters.map((player) => player.name));
  const bowlingPlayers = normalizePlayerList(bowlingTeam?.players, [match.bowler.name]);
  const hasLiveMatch = String(match.status || "").toUpperCase() === "LIVE";

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
          <h2>Tournament</h2>
          <div className="form-grid">
            <Field label="Tournament name" value={scoreboard.tournament.name} onChange={(value) => updateTournament("name", value)} />
            <Field label="Season" value={scoreboard.tournament.season} onChange={(value) => updateTournament("season", value)} />
            <Field label="Venue" value={scoreboard.tournament.venue} onChange={(value) => updateTournament("venue", value)} />
          </div>
        </section>

        {hasLiveMatch ? <section className="admin-card">
          <h2>Live Match</h2>
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
            {["LIVE", "INNINGS BREAK", "COMPLETED", "UPCOMING"].map((nextStatus) => (
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
          </div>

          <div className="score-actions">
            <button type="button" onClick={() => adjustRun(1)} disabled={isAutoSaving}>
              <Plus size={16} />
              Add Run
            </button>
            <button type="button" onClick={() => adjustRun(-1)} disabled={isAutoSaving}>
              <Minus size={16} />
              Remove Run
            </button>
            <button type="button" className="danger-ball" onClick={addWicket} disabled={isAutoSaving}>
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
                      onClick={() => applyBall(eventLabel)}
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

        {hasLiveMatch ? <section className="admin-card">
          <h2>Teams</h2>
          <div className="team-edit-grid">
            {Object.entries(teams).map(([teamId, team]) => (
              <div className="mini-panel" key={teamId}>
                <h3>{teamId === match.battingTeamId ? "Batting Team" : "Bowling Team"}</h3>
                <Field label="Name" value={team.name} onChange={(value) => updateTeam(teamId, "name", value)} />
                <Field label="Short name" value={team.shortName} onChange={(value) => updateTeam(teamId, "shortName", value)} />
                <Field label="Color" type="color" value={team.color} onChange={(value) => updateTeam(teamId, "color", value)} />
                <TextAreaField
                  label="Players, comma or line separated"
                  value={normalizePlayerList(team.players, []).join("\n")}
                  onChange={(value) => updateTeamPlayers(teamId, value)}
                />
              </div>
            ))}
          </div>
        </section> : null}

        {hasLiveMatch ? <section className="admin-card">
          <h2>Players</h2>
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
                  {index === 0 ? <span className="strike-badge">On strike</span> : <button type="button" className="strike-button" onClick={() => setBatterOnStrike(index)} disabled={isAutoSaving}>Set on strike</button>}
                </div>
                <Field label="Name" value={batter.name} onChange={(value) => updateBatter(index, "name", value)} />
                <Field label="Team" value={batter.team} onChange={(value) => updateBatter(index, "team", value)} />
                <Field label="Runs" type="number" min="0" value={batter.runs} onChange={(value) => updateBatter(index, "runs", value)} />
                <Field label="Balls" type="number" min="0" value={batter.balls} onChange={(value) => updateBatter(index, "balls", value)} />
                <Field label="Fours" type="number" min="0" value={batter.fours} onChange={(value) => updateBatter(index, "fours", value)} />
                <Field label="Sixes" type="number" min="0" value={batter.sixes} onChange={(value) => updateBatter(index, "sixes", value)} />
              </div>
            ))}
            <div className="mini-panel">
              <h3>Bowler</h3>
              <Field label="Name" value={match.bowler.name} onChange={(value) => updateBowler("name", value)} />
              <Field label="Team" value={match.bowler.team} onChange={(value) => updateBowler("team", value)} />
              <Field label="Overs" value={match.bowler.overs} onChange={(value) => updateBowler("overs", value)} />
              <Field label="Runs" type="number" min="0" value={match.bowler.runs} onChange={(value) => updateBowler("runs", value)} />
              <Field label="Wickets" type="number" min="0" value={match.bowler.wickets} onChange={(value) => updateBowler("wickets", value)} />
              <Field label="Economy" value={match.bowler.economy} onChange={(value) => updateBowler("economy", value)} />
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
            <h2>Upcoming Matches</h2>
            <button type="button" className="secondary-button" onClick={addUpcomingMatch}>
              <CalendarPlus size={16} />
              Add Match
            </button>
          </div>
          <div className="upcoming-admin-list">
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
                    <span>{upcoming.teamA?.name || "Team A"} vs {upcoming.teamB?.name || "Team B"} · {upcoming.date || "Date pending"} {upcoming.time || ""}</span>
                  </button>
                  <div className="upcoming-admin-actions">
                    <button type="button" className="primary-button" onClick={() => makeUpcomingMatchLive(index)} disabled={isAutoSaving}>Make Live</button>
                    <button type="button" className="danger-button" onClick={() => removeUpcomingMatch(index)}>Remove</button>
                  </div>
                </div>
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
                    <TextAreaField label="Team A players" value={normalizePlayerList(upcoming.teamA.players, []).join("\n")} onChange={(value) => updateUpcomingPlayers(index, "teamA", value)} />
                    <TextAreaField label="Team B players" value={normalizePlayerList(upcoming.teamB.players, []).join("\n")} onChange={(value) => updateUpcomingPlayers(index, "teamB", value)} />
                  </div>
                </> : null}
              </div>
            ))}
          </div>
        </section>

        <div className="sticky-save">
          <button className="primary-button" type="submit">
            <Save size={17} />
            Save to Firebase
          </button>
          {hasLiveMatch ? <button className="secondary-button" type="button" onClick={() => applyBall("1")} disabled={isAutoSaving}>
            <Zap size={16} />
            Add 1 Run
          </button> : null}
        </div>
      </form>
    </main>
  );
}
