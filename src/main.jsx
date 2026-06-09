import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { CalendarDays, CheckCircle2, ChevronDown, Clock3, MapPin, Radio, Shield, Trophy, Users } from "lucide-react";
import { AdminPage } from "./Admin";
import { formatDisplayDateTime, formatMatchSchedule } from "./dateFormat";
import { fetchLiveUserCount, getBrowserPresenceId, presenceCountIntervalMs, presenceHeartbeatIntervalMs, sendPresenceHeartbeat } from "./firebasePresence";
import { fetchScoreboard, hasFirebaseConfig, refreshIntervalMs } from "./firebaseScoreboard";
import { sampleScoreboard } from "./sampleData";
import "./styles.css";

function TeamPill({ team }) {
  return (
    <span className="team-pill" style={{ "--team-color": team?.color || "#334155" }}>
      <span className="team-badge">{team?.shortName || "TM"}</span>
      {team?.name || "Team"}
    </span>
  );
}

function Stat({ label, value }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") return Object.values(value);
  return [];
}

function getMatchDateGroups(matches) {
  const groups = [];
  const byKey = new Map();
  asArray(matches).forEach((match, index) => {
    const source = String(match?.date || match?.completedAt || "").trim();
    const parsed = /^\d{4}-\d{2}-\d{2}/.test(source) ? source.slice(0, 10) : "";
    const fallbackDate = parsed ? null : new Date(source);
    const key = parsed || (!Number.isNaN(fallbackDate.getTime()) ? `${fallbackDate.getFullYear()}-${String(fallbackDate.getMonth() + 1).padStart(2, "0")}-${String(fallbackDate.getDate()).padStart(2, "0")}` : "date-not-set");
    const parts = key.split("-");
    const label = key !== "date-not-set" && parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : "Date not set";
    if (!byKey.has(key)) {
      byKey.set(key, { key, label, matches: [] });
      groups.push(byKey.get(key));
    }
    byKey.get(key).matches.push({ match, index });
  });
  return groups;
}

function PlayerList({ title, players }) {
  const list = asArray(players)
    .map((player) => typeof player === "string" ? player : player?.name)
    .filter(Boolean);

  if (list.length === 0) return null;

  return (
    <div className="player-list">
      <span>{title}</span>
      <p>{list.join(", ")}</p>
    </div>
  );
}

function getCurrentOverEvents(match) {
  const history = asArray(match.ballHistory);
  const toScoreLabel = (event) => {
    const label = String(event?.label ?? event ?? "");
    if (event?.wicket || label === "W" || label === "RO") return { label: "W", wicket: true };
    if (event?.runs !== undefined) return { label: String(event.runs), wicket: false };
    if (label === "Wd" || label === "NB") return { label: "1", wicket: false };
    if (label.startsWith("Wd+")) return { label: String(Number(label.slice(3)) + 1), wicket: false };
    if (label.startsWith("NB+")) return { label: String(Number(label.slice(3)) + 1), wicket: false };
    if (label.startsWith("LB")) return { label: label.slice(2), wicket: false };
    if (label.startsWith("B")) return { label: label.slice(1), wicket: false };
    if (label === "P5") return { label: "5", wicket: false };
    return { label, wicket: false };
  };

  if (history.length > 0) {
    const current = [];
    const currentLegalBalls = Number(String(match.score?.overs || "0.0").split(".")[1] || 0);
    const targetLegalBalls = currentLegalBalls === 0 ? 6 : currentLegalBalls;
    let legalBalls = 0;

    if (currentLegalBalls === 0 && history[0]?.legal === false) {
      for (const event of history) {
        if (event.legal) break;
        current.push(event);
      }
    } else {
      for (const event of history) {
        if (legalBalls >= targetLegalBalls && event.legal) break;
        current.push(event);
        if (event.legal) legalBalls += 1;
      }
    }

    return current.reverse().map(toScoreLabel);
  }

  return asArray(match.recentBalls)
    .slice(0, 8)
    .reverse()
    .map((label) => toScoreLabel({ label, wicket: label === "W" || label === "RO" }));
}

function CurrentOver({ match }) {
  const events = getCurrentOverEvents(match);

  return (
    <div className="current-over-panel">
      <div className="current-over-title">
        <h3>Current Over</h3>
        <span>{match.score?.overs || "0.0"} ov</span>
      </div>
      <div className="current-over-list">
        {events.length === 0 ? (
          <div className="current-over-empty">No balls</div>
        ) : null}
        {events.map((event, index) => (
          <span className={event.wicket ? "current-ball wicket" : "current-ball"} key={`${event.label}-${index}`}>{event.label}</span>
        ))}
      </div>
    </div>
  );
}

function getBattingRows(match) {
  const currentBatters = asArray(match.batters);
  const currentNames = new Set(currentBatters.map((player) => player?.name).filter(Boolean));
  const scorecardRows = asArray(match.battingScorecard).filter((player) => player?.name && !currentNames.has(player.name));
  const normalizeRow = (player, index = -1) => {
    const runs = Number(player.runs) || 0;
    const balls = Number(player.balls) || 0;
    const role = player.dismissed ? "Out" : index === 0 ? "Striker" : index === 1 ? "Non-striker" : player.role || "Played";
    return { ...player, role, runs, balls, fours: Number(player.fours) || 0, sixes: Number(player.sixes) || 0, strikeRate: player.strikeRate || (balls > 0 ? ((runs / balls) * 100).toFixed(2) : "0.00"), isStriker: index === 0 && !player.dismissed, isCurrent: index >= 0 };
  };

  return [
    ...currentBatters.map((player, index) => normalizeRow(player, index)),
    ...scorecardRows.map((player) => normalizeRow(player))
  ];
}

function LiveMatch({ match }) {
  const battingTeam = match.teams?.[match.battingTeamId];
  const bowlingTeam = match.teams?.[match.bowlingTeamId];
  const previousInningsScore = Number(match.inningsNumber) >= 2 ? match.teamScores?.[match.bowlingTeamId] : null;
  const isInningsBreak = String(match.status || "").toUpperCase() === "INNINGS BREAK";
  const extras = match.extras || {};
  const battingRows = getBattingRows(match);

  return (
    <section className={isInningsBreak ? "live-panel innings-break-panel" : "live-panel"}>
      <div className="live-header">
        <div>
          <div className="eyebrow">
            <Radio size={16} />
            {match.status || "LIVE"} · {match.matchNo}
          </div>
          <h1>{battingTeam?.name || "Batting Team"} vs {bowlingTeam?.name || "Bowling Team"}</h1>
          <p>{match.innings}{Number(match.target) > 0 ? ` · Target ${match.target}` : ""}</p>
        </div>
        <div className="score-block">
          <span>{match.score?.overs} ov</span>
          <strong>{match.score?.runs}/{match.score?.wickets}</strong>
        </div>
      </div>

      {isInningsBreak ? <div className="innings-break-banner">
        <div>
          <strong>Innings Break</strong>
          <span>{battingTeam?.name || "Batting Team"} finished on {match.score?.runs || 0}/{match.score?.wickets || 0} after {match.score?.overs || "0.0"} overs</span>
        </div>
        <span>Waiting for second innings</span>
      </div> : null}

      <div className="teams-row">
        <TeamPill team={battingTeam} />
        <span className="versus">vs</span>
        <TeamPill team={bowlingTeam} />
      </div>

      {previousInningsScore ? <div className="previous-innings-summary">
        <span>First innings</span>
        <strong>{bowlingTeam?.name || "Team"} {previousInningsScore.runs ?? 0}/{previousInningsScore.wickets ?? 0}</strong>
        <small>{previousInningsScore.overs || "0.0"} ov</small>
      </div> : null}

      <div className="stats-grid">
        <Stat label="Run rate" value={match.score?.runRate} />
        <Stat label="Required" value={match.score?.requiredRate} />
        <Stat label="Venue" value={match.venue || "Tournament venue"} />
        <Stat label="Extras" value={extras.total || 0} />
        <Stat label="Free hit" value={match.freeHit ? "Yes" : "No"} />
        <Stat label="Scorecard" value={isInningsBreak ? "Innings Break" : "Live"} />
      </div>

      <div className="players-grid">
        <div className="table-panel">
          <h2>Batting</h2>
          <div className="score-table">
            <div className="table-head">
              <span>Player</span>
              <span>R</span>
              <span>B</span>
              <span>4s</span>
              <span>6s</span>
              <span>SR</span>
            </div>
            {battingRows.map((player, index) => (
              <div className={player.isStriker ? "table-row active-striker-row" : player.dismissed ? "table-row dismissed-player-row" : "table-row"} key={`${player.name}-${index}`}>
                <span>
                  <strong>{player.name}{player.isStriker ? <span className="strike-indicator">On strike</span> : null}{player.dismissed ? <span className="out-indicator">Out</span> : null}</strong>
                  <small>{player.role} · {player.team}</small>
                </span>
                <span>{player.runs}</span>
                <span>{player.balls}</span>
                <span>{player.fours}</span>
                <span>{player.sixes}</span>
                <span>{player.strikeRate}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="table-panel">
          <h2>Bowling</h2>
          <div className="bowler-card">
            <div>
              <strong>{match.bowler?.name}</strong>
              <span>{match.bowler?.team}</span>
            </div>
            <div className="bowler-stats">
              <Stat label="Overs" value={match.bowler?.overs} />
              <Stat label="Runs" value={match.bowler?.runs} />
              <Stat label="Wkts" value={match.bowler?.wickets} />
              <Stat label="Econ" value={match.bowler?.economy} />
            </div>
          </div>
          <CurrentOver match={match} />
        </div>
      </div>
    </section>
  );
}

function UpcomingMatches({ matches }) {
  const upcoming = Array.isArray(matches) ? matches : [];
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [selectedDateKey, setSelectedDateKey] = useState("");
  const dateGroups = getMatchDateGroups(upcoming);
  const activeGroup = dateGroups.find((group) => group.key === selectedDateKey) || dateGroups[0];

  return (
    <section className="upcoming">
      <div className="section-title">
        <CalendarDays size={19} />
        <h2>Upcoming Matches</h2>
      </div>
      {dateGroups.length > 0 ? <div className="date-group-list">
        {dateGroups.map((group) => (
          <button type="button" className={(activeGroup?.key || "") === group.key ? "date-group-button active-date-group" : "date-group-button"} onClick={() => { setSelectedDateKey(group.key); setSelectedMatchId(""); }} key={group.key}>
            <strong>{group.label}</strong>
            <span>{group.matches.length} match{group.matches.length === 1 ? "" : "es"}</span>
          </button>
        ))}
      </div> : null}
      <div className="match-list">
        {upcoming.length === 0 ? (
          <div className="empty-state">
            No upcoming matches scheduled.
          </div>
        ) : null}
        {activeGroup?.matches.map(({ match, index }) => (
          <article className={selectedMatchId === (match.id || `${match.matchNo}-${index}`) ? "match-card expanded-match-card" : "match-card"} key={match.id || `${match.matchNo}-${index}`}>
            <button type="button" className="match-card-button" onClick={() => setSelectedMatchId(selectedMatchId === (match.id || `${match.matchNo}-${index}`) ? "" : (match.id || `${match.matchNo}-${index}`))} aria-expanded={selectedMatchId === (match.id || `${match.matchNo}-${index}`)}>
              <div className="match-card-top">
                <span>{match.matchNo}</span>
                <strong className={String(match.status || "").toUpperCase() === "PRE LIVE" ? "pre-live-status" : ""}>{String(match.status || "").toUpperCase() === "PRE LIVE" ? "Pre live" : `${match.teamA.shortName} vs ${match.teamB.shortName}`}</strong>
              </div>
              <div className="fixture-teams">
                <span>{match.teamA.name}</span>
                <b>v</b>
                <span>{match.teamB.name}</span>
              </div>
              <div className="fixture-meta">
                <span><Clock3 size={15} /> {formatMatchSchedule(match.date, match.time) || "Date not set"}</span>
                <span><MapPin size={15} /> {match.venue}</span>
              </div>
              <ChevronDown className="match-card-chevron" size={18} />
            </button>
            {selectedMatchId === (match.id || `${match.matchNo}-${index}`) ? <div className="match-card-details">
              <PlayerList title={`${match.teamA.shortName || "Team A"} squad`} players={match.teamA.players} />
              <PlayerList title={`${match.teamB.shortName || "Team B"} squad`} players={match.teamB.players} />
            </div> : null}
          </article>
        ))}
      </div>
    </section>
  );
}

function CompletedMatches({ matches }) {
  const completed = asArray(matches);
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [selectedDateKey, setSelectedDateKey] = useState("");
  const dateGroups = getMatchDateGroups(completed);
  const activeGroup = dateGroups.find((group) => group.key === selectedDateKey) || dateGroups[0];

  return (
    <section className="completed">
      <div className="section-title">
        <CheckCircle2 size={19} />
        <h2>Completed Matches</h2>
      </div>
      {dateGroups.length > 0 ? <div className="date-group-list">
        {dateGroups.map((group) => (
          <button type="button" className={(activeGroup?.key || "") === group.key ? "date-group-button active-date-group" : "date-group-button"} onClick={() => { setSelectedDateKey(group.key); setSelectedMatchId(""); }} key={group.key}>
            <strong>{group.label}</strong>
            <span>{group.matches.length} match{group.matches.length === 1 ? "" : "es"}</span>
          </button>
        ))}
      </div> : null}
      <div className="match-list">
        {completed.length === 0 ? <div className="empty-state">No completed matches.</div> : null}
        {activeGroup?.matches.map(({ match, index }) => {
          const matchKey = match.id || `${match.matchNo}-${index}`;
          const teamAId = match.battingTeamId || "teamA";
          const teamBId = match.bowlingTeamId || "teamB";
          const teamA = match.teams?.[teamAId] || match.teamA || {};
          const teamB = match.teams?.[teamBId] || match.teamB || {};
          const teamAScore = match.teamScores?.[teamAId] || match.score || null;
          const teamBScore = match.teamScores?.[teamBId] || (Number(match.target) > 0 ? { runs: Math.max(0, Number(match.target) - 1), wickets: "", overs: "" } : null);
          const cancelled = String(match.status || "").toUpperCase() === "CANCELLED";
          const selected = selectedMatchId === matchKey;
          return (
            <article className={selected ? "match-card completed-match-card expanded-match-card" : "match-card completed-match-card"} key={matchKey}>
              <div className="match-card-top">
                <span>{match.matchNo || `Match ${index + 1}`}</span>
                <strong className={cancelled ? "cancelled-status" : "completed-status"}>{cancelled ? "Cancelled" : "Completed"}</strong>
              </div>
              <div className="fixture-teams">
                <span>{teamA.name || "Team A"}</span>
                <b>v</b>
                <span>{teamB.name || "Team B"}</span>
              </div>
              {!cancelled ? <div className="completed-team-scores">
                <div>
                  <strong>{teamA.shortName || teamA.name || "Team A"}</strong>
                  <span>{teamAScore ? `${teamAScore.runs ?? 0}/${teamAScore.wickets === "" || teamAScore.wickets == null ? "-" : teamAScore.wickets}` : "Score not entered"} {teamAScore?.overs ? <small>({teamAScore.overs} ov)</small> : null}</span>
                </div>
                <div>
                  <strong>{teamB.shortName || teamB.name || "Team B"}</strong>
                  <span>{teamBScore ? `${teamBScore.runs ?? 0}/${teamBScore.wickets === "" || teamBScore.wickets == null ? "-" : teamBScore.wickets}` : "Score not entered"} {teamBScore?.overs ? <small>({teamBScore.overs} ov)</small> : null}</span>
                </div>
              </div> : null}
              <div className="fixture-meta">
                <span><Clock3 size={15} /> {formatMatchSchedule(match.date, match.time) || "Date not set"}</span>
                <span><MapPin size={15} /> {match.venue || "Venue not set"}</span>
              </div>
              {!cancelled ? <button type="button" className="completed-details-toggle" onClick={() => setSelectedMatchId(selected ? "" : matchKey)} aria-expanded={selected}>
                Scorecard details
                <ChevronDown className="match-card-chevron-inline" size={18} />
              </button> : null}
              {selected && !cancelled ? <CompletedMatchDetails match={match} teamAId={teamAId} teamBId={teamBId} teamA={teamA} teamB={teamB} /> : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function CompletedMatchDetails({ match, teamAId, teamBId, teamA, teamB }) {
  const innings = [
    { teamId: teamAId, opponentId: teamBId, team: teamA, opponent: teamB },
    { teamId: teamBId, opponentId: teamAId, team: teamB, opponent: teamA }
  ];

  return (
    <div className="completed-match-details">
      {innings.map(({ teamId, opponentId, team, opponent }) => {
        const score = match.teamScores?.[teamId] || (teamId === match.battingTeamId ? match.score : null);
        const battingRows = asArray(match.inningsScorecards?.[teamId] || (teamId === match.battingTeamId ? match.battingScorecard : [])).filter((player) => player?.name);
        const bowlingRows = asArray(match.inningsBowlingScorecards?.[opponentId] || (match.inningsBowlers?.[opponentId] ? [match.inningsBowlers[opponentId]] : opponentId === match.bowlingTeamId && match.bowler ? [match.bowler] : [])).filter((bowler) => bowler?.name);
        return (
          <div className="completed-innings-detail" key={teamId}>
            <div className="completed-innings-title">
              <strong>{team?.name || "Team"} batting</strong>
              {score ? <span>{score.runs ?? 0}/{score.wickets === "" || score.wickets == null ? "-" : score.wickets} {score.overs ? `(${score.overs} ov)` : ""}</span> : null}
            </div>
            <strong className="completed-detail-label">Batting</strong>
            {battingRows.length > 0 ? <div className="completed-player-table">
              <div className="completed-player-row completed-player-head">
                <span>Player</span>
                <span>R</span>
                <span>B</span>
                <span>4s</span>
                <span>6s</span>
              </div>
              {battingRows.map((player, index) => <div className="completed-player-row" key={`${teamId}-${player.name}-${index}`}>
                <span><strong>{player.name}</strong>{player.dismissed ? <small>Out</small> : null}</span>
                <span>{player.runs ?? 0}</span>
                <span>{player.balls ?? 0}</span>
                <span>{player.fours ?? 0}</span>
                <span>{player.sixes ?? 0}</span>
              </div>)}
            </div> : <div className="completed-detail-empty">Player scorecard not available.</div>}
            <strong className="completed-detail-label">{opponent?.shortName || opponent?.name || "Bowling"} bowling</strong>
            {bowlingRows.length > 0 ? <div className="completed-player-table completed-bowling-table">
              <div className="completed-player-row completed-player-head">
                <span>Bowler</span>
                <span>Ov</span>
                <span>R</span>
                <span>W</span>
                <span>Econ</span>
              </div>
              {bowlingRows.map((bowler, index) => <div className="completed-player-row" key={`${opponentId}-${bowler.name}-${index}`}>
                <span><strong>{bowler.name}</strong></span>
                <span>{bowler.overs || "0.0"}</span>
                <span>{bowler.runs ?? 0}</span>
                <span>{bowler.wickets ?? 0}</span>
                <span>{bowler.economy || "0.00"}</span>
              </div>)}
            </div> : <div className="completed-detail-empty">Bowling scorecard not available.</div>}
          </div>
        );
      })}
    </div>
  );
}

function App() {
  const [route, setRoute] = useState(() => window.location.hash);
  const [scoreboard, setScoreboard] = useState(sampleScoreboard);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [liveViewerCount, setLiveViewerCount] = useState(null);
  const [error, setError] = useState("");
  const usingFirebase = useMemo(() => hasFirebaseConfig(), []);
  const isAdminRoute = route === "#/admin" || window.location.pathname.replace(/\/$/, "").endsWith("/admin");

  useEffect(() => {
    function handleRouteChange() {
      setRoute(window.location.hash);
    }

    window.addEventListener("hashchange", handleRouteChange);
    return () => window.removeEventListener("hashchange", handleRouteChange);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadScoreboard() {
      try {
        const data = await fetchScoreboard();
        if (!mounted) return;
        if (data) {
          setScoreboard(data);
        }
        setLastRefresh(new Date().toISOString());
        setError("");
      } catch (err) {
        if (mounted) {
          setError(err.message);
          setLastRefresh(new Date().toISOString());
        }
      }
    }

    loadScoreboard();
    const intervalId = window.setInterval(loadScoreboard, refreshIntervalMs);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (!usingFirebase || isAdminRoute) {
      setLiveViewerCount(null);
      return undefined;
    }

    let mounted = true;
    const browserId = getBrowserPresenceId();

    async function sendHeartbeat() {
      if (document.visibilityState !== "visible") return;
      try {
        await sendPresenceHeartbeat(browserId);
      } catch {
        return;
      }
    }

    async function loadLiveViewerCount() {
      try {
        const count = await fetchLiveUserCount();
        if (mounted) setLiveViewerCount(count);
      } catch {
        if (mounted) setLiveViewerCount("--");
      }
    }

    async function activatePresence() {
      await sendHeartbeat();
      await loadLiveViewerCount();
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") activatePresence();
    }

    activatePresence();
    const heartbeatIntervalId = window.setInterval(sendHeartbeat, presenceHeartbeatIntervalMs);
    const countIntervalId = window.setInterval(loadLiveViewerCount, presenceCountIntervalMs);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      mounted = false;
      window.clearInterval(heartbeatIntervalId);
      window.clearInterval(countIntervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isAdminRoute, usingFirebase]);

  const match = scoreboard.currentMatch || sampleScoreboard.currentMatch;
  const tournament = scoreboard.tournament || sampleScoreboard.tournament;
  const matchStatus = String(match.status || "").toUpperCase();
  const hasLiveMatch = ["LIVE", "INNINGS BREAK"].includes(matchStatus);
  const upcomingMatches = asArray(scoreboard.upcomingMatches);
  const preLiveTeamIds = Object.keys(match.teams || {});
  const preLiveTeamA = match.teams?.teamA || match.teams?.[preLiveTeamIds[0]] || {};
  const preLiveTeamB = match.teams?.teamB || match.teams?.[preLiveTeamIds[1]] || {};
  const visibleUpcomingMatches = matchStatus === "PRE LIVE" && match.id && !upcomingMatches.some((item) => item.id && item.id === match.id) ? [{ id: match.id, status: "PRE LIVE", matchNo: match.matchNo, date: match.date, time: match.time, venue: match.venue || tournament.venue, teamA: preLiveTeamA, teamB: preLiveTeamB }, ...upcomingMatches] : upcomingMatches;
  const completedMatches = asArray(scoreboard.completedMatches);
  const visibleCompletedMatches = ["COMPLETED", "CANCELLED"].includes(matchStatus) && !completedMatches.some((item) => item.id && item.id === match.id) ? [match, ...completedMatches] : completedMatches;
  if (isAdminRoute) {
    return <AdminPage />;
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span><Trophy size={22} /></span>
          <div>
            <strong>{tournament.name}</strong>
            <small>{tournament.season} · {tournament.venue}</small>
          </div>
        </div>
        <div className="sync-state">
          {usingFirebase ? <span className="viewer-count" aria-label={`${liveViewerCount ?? "--"} live viewers`}>
            <Users size={16} />
            <strong>{liveViewerCount ?? "--"}</strong>
            <small>live</small>
          </span> : null}
          <small>{lastRefresh ? formatDisplayDateTime(lastRefresh) : "Starting"}</small>
        </div>
      </header>

      {error ? <div className="alert">Firebase error: {error}</div> : null}
      {!usingFirebase ? (
        <div className="notice">
          <Shield size={17} />
          Add your Firebase Realtime Database URL in <code>.env</code> to show live data.
        </div>
      ) : null}

      {hasLiveMatch ? <LiveMatch match={{ ...match, venue: match.venue || tournament.venue }} /> : null}
      <UpcomingMatches matches={visibleUpcomingMatches} />
      <CompletedMatches matches={visibleCompletedMatches} />
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
