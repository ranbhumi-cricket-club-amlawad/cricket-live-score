import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { CalendarDays, Clock3, MapPin, Radio, RefreshCw, Settings, Shield, Trophy } from "lucide-react";
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

function LiveMatch({ match }) {
  const battingTeam = match.teams?.[match.battingTeamId];
  const bowlingTeam = match.teams?.[match.bowlingTeamId];

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
              <span className={ball === "W" ? "wicket" : ""} key={`${ball}-${index}`}>{ball}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function UpcomingMatches({ matches }) {
  return (
    <section className="upcoming">
      <div className="section-title">
        <CalendarDays size={19} />
        <h2>Upcoming Matches</h2>
      </div>
      <div className="match-list">
        {matches?.map((match) => (
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
          <RefreshCw size={16} />
          <span>{usingFirebase ? "Firebase sync" : "Demo data"}</span>
          <small>{lastRefresh ? formatDateTime(lastRefresh) : "Starting"}</small>
          <a className="admin-link" href="#/admin">
            <Settings size={15} />
            Admin
          </a>
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
