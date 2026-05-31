import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { CalendarDays, Clock3, MapPin, Radio, Shield, Trophy } from "lucide-react";
import { AdminPage } from "./Admin";
import { fetchScoreboard, hasFirebaseConfig, refreshIntervalMs } from "./firebaseScoreboard";
import { sampleScoreboard } from "./sampleData";
import "./styles.css";

function formatDateTime(value) {
  if (!value) return "Waiting for update";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "medium"
  }).format(new Date(value));
}

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

function describeBallLabel(label) {
  if (label === "W") return "Wicket";
  if (label === "RO") return "Run out";
  if (label === "Wd") return "Wide, 1 run";
  if (label?.startsWith("Wd+")) return `Wide, ${Number(label.slice(3)) + 1} runs`;
  if (label === "NB") return "No ball, 1 run";
  if (label?.startsWith("NB+")) return `No ball, ${Number(label.slice(3)) + 1} runs`;
  if (label?.startsWith("LB")) return `Leg bye, ${label.slice(2)} run${label.slice(2) === "1" ? "" : "s"}`;
  if (label?.startsWith("B")) return `Bye, ${label.slice(1)} run${label.slice(1) === "1" ? "" : "s"}`;
  if (label === "P5") return "Penalty, 5 runs";
  return `${label} run${label === "1" ? "" : "s"}`;
}

function getCurrentOverEvents(match) {
  const history = asArray(match.ballHistory);
  if (history.length > 0) {
    const current = [];
    let legalBalls = 0;

    for (const event of history) {
      if (legalBalls >= 6) break;
      current.push(event);
      if (event.legal) legalBalls += 1;
    }

    return current.reverse();
  }

  return asArray(match.recentBalls)
    .slice(0, 8)
    .reverse()
    .map((label) => ({
      label,
      display: describeBallLabel(label),
      wicket: label === "W" || label === "RO"
    }));
}

function CurrentOver({ match }) {
  const events = getCurrentOverEvents(match);

  return (
    <div className="current-over-panel">
      <div className="current-over-title">
        <h3>Current Over</h3>
        <span>{events.length} event{events.length === 1 ? "" : "s"}</span>
      </div>
      <div className="current-over-list">
        {events.length === 0 ? (
          <div className="current-over-empty">No balls recorded.</div>
        ) : null}
        {events.map((event, index) => (
          <div className={event.wicket ? "current-ball wicket" : "current-ball"} key={`${event.label}-${index}`}>
            <strong>{event.label}</strong>
            <small>{event.display || describeBallLabel(event.label)}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

function LiveMatch({ match }) {
  const battingTeam = match.teams?.[match.battingTeamId];
  const bowlingTeam = match.teams?.[match.bowlingTeamId];
  const extras = match.extras || {};

  return (
    <section className="live-panel">
      <div className="live-header">
        <div>
          <div className="eyebrow">
            <Radio size={16} />
            {match.status || "LIVE"} · {match.matchNo}
          </div>
          <h1>{battingTeam?.name || "Batting Team"} vs {bowlingTeam?.name || "Bowling Team"}</h1>
          <p>{match.innings} · Target {match.target}</p>
        </div>
        <div className="score-block">
          <span>{match.score?.overs} ov</span>
          <strong>{match.score?.runs}/{match.score?.wickets}</strong>
        </div>
      </div>

      <div className="teams-row">
        <TeamPill team={battingTeam} />
        <span className="versus">vs</span>
        <TeamPill team={bowlingTeam} />
      </div>

      <div className="stats-grid">
        <Stat label="Run rate" value={match.score?.runRate} />
        <Stat label="Required" value={match.score?.requiredRate} />
        <Stat label="Venue" value={match.venue || "Tournament venue"} />
        <Stat label="Extras" value={extras.total || 0} />
        <Stat label="Free hit" value={match.freeHit ? "Yes" : "No"} />
        <Stat label="Scorecard" value="Live" />
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
            {match.batters?.map((player) => (
              <div className="table-row" key={player.name}>
                <span>
                  <strong>{player.name}</strong>
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
          <div className="recent-balls">
            {match.recentBalls?.map((ball, index) => (
              <span className={ball === "W" || ball === "RO" ? "wicket" : ""} key={`${ball}-${index}`}>{ball}</span>
            ))}
          </div>
          <CurrentOver match={match} />
        </div>
      </div>
    </section>
  );
}

function UpcomingMatches({ matches }) {
  const upcoming = Array.isArray(matches) ? matches : [];

  return (
    <section className="upcoming">
      <div className="section-title">
        <CalendarDays size={19} />
        <h2>Upcoming Matches</h2>
      </div>
      <div className="match-list">
        {upcoming.length === 0 ? (
          <div className="empty-state">
            No upcoming matches scheduled.
          </div>
        ) : null}
        {upcoming.map((match) => (
          <article className="match-card" key={match.id}>
            <div className="match-card-top">
              <span>{match.matchNo}</span>
              <strong>{match.teamA.shortName} vs {match.teamB.shortName}</strong>
            </div>
            <div className="fixture-teams">
              <span>{match.teamA.name}</span>
              <b>v</b>
              <span>{match.teamB.name}</span>
            </div>
            <div className="fixture-meta">
              <span><Clock3 size={15} /> {match.date} · {match.time}</span>
              <span><MapPin size={15} /> {match.venue}</span>
            </div>
            <PlayerList title={`${match.teamA.shortName || "Team A"} squad`} players={match.teamA.players} />
            <PlayerList title={`${match.teamB.shortName || "Team B"} squad`} players={match.teamB.players} />
          </article>
        ))}
      </div>
    </section>
  );
}

function App() {
  const [route, setRoute] = useState(() => window.location.hash);
  const [scoreboard, setScoreboard] = useState(sampleScoreboard);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [error, setError] = useState("");
  const usingFirebase = useMemo(() => hasFirebaseConfig(), []);

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

  const match = scoreboard.currentMatch || sampleScoreboard.currentMatch;
  const tournament = scoreboard.tournament || sampleScoreboard.tournament;
  const isAdminRoute = route === "#/admin" || window.location.pathname.replace(/\/$/, "").endsWith("/admin");

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
          <small>{lastRefresh ? formatDateTime(lastRefresh) : "Starting"}</small>
        </div>
      </header>

      {error ? <div className="alert">Firebase error: {error}</div> : null}
      {!usingFirebase ? (
        <div className="notice">
          <Shield size={17} />
          Add your Firebase Realtime Database URL in <code>.env</code> to show live data.
        </div>
      ) : null}

      <LiveMatch match={{ ...match, venue: tournament.venue }} />
      <UpcomingMatches matches={scoreboard.upcomingMatches || []} />
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
