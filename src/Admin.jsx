import React, { useEffect, useMemo, useState } from "react";
import { CalendarPlus, LogOut, Save, ShieldCheck, Trophy, Zap } from "lucide-react";
import { fetchScoreboard, hasFirebaseConfig, updateScoreboard } from "./firebaseScoreboard";
import { sampleScoreboard } from "./sampleData";

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "Score@2026";

function cloneScoreboard(value) {
  return JSON.parse(JSON.stringify(value || sampleScoreboard));
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

function decimalOvers(oversValue) {
  const [overs = 0, balls = 0] = String(oversValue || "0.0").split(".").map(Number);
  return overs + balls / 6;
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
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
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

  function updateBatter(index, field, value) {
    updateDraft((draft) => {
      const batter = draft.currentMatch.batters[index];
      batter[field] = ["runs", "balls", "fours", "sixes"].includes(field) ? toNumber(value) : value;
      batter.strikeRate = calculateStrikeRate(toNumber(batter.runs), toNumber(batter.balls));
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
        match[parent][child] = value;
      } else {
        match[path] = value;
      }
    });
  }

  function addUpcomingMatch() {
    updateDraft((draft) => {
      draft.upcomingMatches.push({
        id: `match-${Date.now()}`,
        matchNo: `Match ${draft.upcomingMatches.length + 1}`,
        date: "",
        time: "",
        venue: "",
        teamA: { name: "", shortName: "" },
        teamB: { name: "", shortName: "" }
      });
    });
  }

  function removeUpcomingMatch(index) {
    updateDraft((draft) => {
      draft.upcomingMatches.splice(index, 1);
    });
  }

  function applyBall(ball) {
    updateDraft((draft) => {
      const match = draft.currentMatch;
      const score = match.score;
      const striker = match.batters[0];
      const bowler = match.bowler;

      if (ball === "W") {
        score.wickets = toNumber(score.wickets) + 1;
        bowler.wickets = toNumber(bowler.wickets) + 1;
      } else {
        const runs = toNumber(ball);
        score.runs = toNumber(score.runs) + runs;
        striker.runs = toNumber(striker.runs) + runs;
        bowler.runs = toNumber(bowler.runs) + runs;
        if (runs === 4) striker.fours = toNumber(striker.fours) + 1;
        if (runs === 6) striker.sixes = toNumber(striker.sixes) + 1;
      }

      striker.balls = toNumber(striker.balls) + 1;
      striker.strikeRate = calculateStrikeRate(toNumber(striker.runs), toNumber(striker.balls));
      score.overs = calculateOvers(score.overs);

      const overs = decimalOvers(score.overs);
      score.runRate = overs > 0 ? (toNumber(score.runs) / overs).toFixed(2) : "0.00";
      const remainingRuns = Math.max(0, toNumber(match.target) - toNumber(score.runs));
      const remainingOvers = Math.max(1, 20 - overs);
      score.requiredRate = (remainingRuns / remainingOvers).toFixed(2);
      bowler.economy = overs > 0 ? (toNumber(bowler.runs) / overs).toFixed(2) : "0.00";
      match.recentBalls = [ball, ...(match.recentBalls || [])].slice(0, 6);
      match.lastUpdated = new Date().toISOString();
    });
  }

  async function saveScoreboard(event) {
    event?.preventDefault();
    setStatus("");
    setError("");

    try {
      const next = cloneScoreboard(scoreboard);
      next.currentMatch.lastUpdated = new Date().toISOString();
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
        <section className="admin-card">
          <h2>Tournament</h2>
          <div className="form-grid">
            <Field label="Tournament name" value={scoreboard.tournament.name} onChange={(value) => updateTournament("name", value)} />
            <Field label="Season" value={scoreboard.tournament.season} onChange={(value) => updateTournament("season", value)} />
            <Field label="Venue" value={scoreboard.tournament.venue} onChange={(value) => updateTournament("venue", value)} />
          </div>
        </section>

        <section className="admin-card">
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
          <div className="quick-balls">
            <span>Quick ball</span>
            {["0", "1", "2", "3", "4", "6", "W"].map((ball) => (
              <button type="button" key={ball} onClick={() => applyBall(ball)} className={ball === "W" ? "danger-ball" : ""}>
                {ball}
              </button>
            ))}
          </div>
        </section>

        <section className="admin-card">
          <h2>Teams</h2>
          <div className="team-edit-grid">
            {Object.entries(teams).map(([teamId, team]) => (
              <div className="mini-panel" key={teamId}>
                <h3>{teamId === match.battingTeamId ? "Batting Team" : "Bowling Team"}</h3>
                <Field label="Name" value={team.name} onChange={(value) => updateTeam(teamId, "name", value)} />
                <Field label="Short name" value={team.shortName} onChange={(value) => updateTeam(teamId, "shortName", value)} />
                <Field label="Color" type="color" value={team.color} onChange={(value) => updateTeam(teamId, "color", value)} />
              </div>
            ))}
          </div>
        </section>

        <section className="admin-card">
          <h2>Players</h2>
          <div className="team-edit-grid">
            {match.batters.map((batter, index) => (
              <div className="mini-panel" key={`${batter.name}-${index}`}>
                <h3>{index === 0 ? "Striker" : "Non-striker"}</h3>
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
        </section>

        <section className="admin-card admin-card-wide">
          <div className="card-heading-row">
            <h2>Upcoming Matches</h2>
            <button type="button" className="secondary-button" onClick={addUpcomingMatch}>
              <CalendarPlus size={16} />
              Add Match
            </button>
          </div>
          <div className="upcoming-admin-list">
            {scoreboard.upcomingMatches.map((upcoming, index) => (
              <div className="mini-panel" key={upcoming.id}>
                <div className="card-heading-row">
                  <h3>{upcoming.matchNo || `Match ${index + 1}`}</h3>
                  <button type="button" className="danger-button" onClick={() => removeUpcomingMatch(index)}>Remove</button>
                </div>
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
              </div>
            ))}
          </div>
        </section>

        <div className="sticky-save">
          <button className="primary-button" type="submit">
            <Save size={17} />
            Save to Firebase
          </button>
          <button className="secondary-button" type="button" onClick={() => applyBall("1")}>
            <Zap size={16} />
            Add 1 Run
          </button>
        </div>
      </form>
    </main>
  );
}
