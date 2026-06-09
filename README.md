# Cricket Live Score

A GitHub Pages-ready cricket tournament scoreboard. It shows the current live score, player details, team details, and upcoming matches. The page fetches data from Firebase Realtime Database every 3 seconds.

## 1. Install

```bash
npm install
cp .env.example .env
```

Edit `.env`:

```bash
VITE_FIREBASE_DATABASE_URL=https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com
VITE_SCOREBOARD_PATH=scoreboard
VITE_REFRESH_INTERVAL_MS=3000
FIREBASE_SERVICE_ACCOUNT=./service-account.json
```

Run locally:

```bash
npm run dev
```

## 2. Firebase Setup

1. Go to Firebase Console and create a project.
2. Build > Realtime Database > Create Database.
3. Copy the database URL into `.env`.
4. Project Settings > Service accounts > Generate new private key.
5. Save that downloaded JSON as `service-account.json` in this project folder.
6. Deploy database rules:

```bash
npm install -g firebase-tools
firebase login
firebase use YOUR_PROJECT_ID
firebase deploy --only database
```

The included rules allow the demo admin to update `/scoreboard`, coordinate the active browser under `/adminSession`, and allow anonymous public presence heartbeats under `/liveUsers`. Deploy the database rules whenever the admin-session or presence configuration changes.

## 3. Add Demo Data

Seed Firebase once:

```bash
npm run seed
```

Run a demo updater that changes the score every 3 seconds:

```bash
npm run live-demo
```

Use `scripts/live-demo-updater.js` only for testing. For real scoring, use the admin screen below.

## 4. Admin Screen

Open the admin screen:

```text
http://127.0.0.1:5173/#/admin
```

If Vite starts on another port, use that port instead.

Hard-coded login:

```text
Username: admin
Password: Ranbhumi@2026#Admin
```

The admin page can update:

- Tournament name, season, and venue
- Upcoming matches appear first; use `Make Live`, then select which team bats first
- Upcoming matches include an explicit `Edit` button for changing match and squad details
- Upcoming match `Make Live`, `Cancel`, and `Remove` actions require confirmation before continuing
- Use `Start Second Innings` after the first innings to preserve its score, swap batting/fielding teams, set the target, and initialize the other team's players
- Completed and cancelled matches are retained until an admin removes them
- Completed matches can also be added manually with match details, team names, scores, and winner
- Upcoming and completed admin sections are collapsed by default and open when their section heading is selected
- Completed matches can save a winning team, which is highlighted on the public scoreboard
- Select a completed match to edit it, remove it, or make it live again. A first-innings match is restored at innings break so the remaining team can start the second innings.
- Live match status, target, score, wickets, overs, and rates
- Batting and bowling team details
- Batter and bowler player details
- Applying live team player lists immediately saves to Firebase and replaces generated player placeholders while keeping their existing score
- Recent balls
- Upcoming matches
- Current striker, non-striker, and bowler from team squads
- Upcoming match player lists
- Ball events: legal runs, wicket, run out, wide, no-ball, byes, leg byes, penalty runs, and free-hit state
- `Undo Last Ball` restores the score, over, batters, bowler, extras, wickets, strike, and calculated rates from before the most recent recorded ball
- Wicket and run-out actions require selecting the dismissed player; dismissed players are marked out and removed from striker selection

Only the most recently logged-in admin session remains active. A new admin login replaces the Firebase `/adminSession` token, and previously logged-in admin pages automatically return to the login screen. Important: this hard-coded login is only a simple frontend gate. It is not real security because browser code and the public session record can be inspected. The included `database.rules.json` allows public writes to `/scoreboard` and `/adminSession` so this demo admin panel can operate directly from GitHub Pages. For a production tournament, use Firebase Authentication or a backend API before sharing the admin URL publicly.

The public scorecard is shown while `currentMatch.status` is `LIVE` or `INNINGS BREAK`. Live team roster changes appear in the Playing Squads section after the regular Firebase refresh; the batting scorecard continues to show only current and previously played batters. Set a prepared current match to `PRE LIVE` to hide its live scorecard and show it again in the Upcoming Matches section without losing admin setup or score data. During an innings break it keeps the full scorecard visible with a clear break banner. Upcoming and completed/cancelled matches have separate sections. Select an upcoming match card to view both team squads, or open a completed match to view player run details and bowler over details.

The public top bar shows an approximate live viewer count. Each browser stores one anonymous ID in `localStorage`, sends a heartbeat every 20 seconds while a public scoreboard tab is visible, and stops being counted after 60 seconds without a heartbeat. Admin pages do not count as viewers.

## 5. Data Shape

Firebase path:

```text
/scoreboard
/adminSession
/liveUsers/{anonymousBrowserId}
```

Example data lives in:

```text
scripts/sample-scoreboard.json
```

Main fields:

- `tournament`: tournament name, season, and venue.
- `currentMatch`: live match score, teams, batters, bowler, recent balls.
- `currentMatch.battingScorecard`: every batter who has played, including previous and current batters.
- `currentMatch.bowlingScorecard`: every bowler used in the current innings, including overs, runs, wickets, and economy.
- `currentMatch.inningsScorecards`: archived batting scorecards for completed innings.
- `currentMatch.inningsBowlingScorecards`: archived bowling scorecards for completed innings.
- `upcomingMatches`: upcoming match list with teams, date, time, and venue.
- `completedMatches`: completed and cancelled match history.
- `completedMatches[].winnerTeamId`: optional winning team identifier displayed on completed match cards.
- `liveUsers`: anonymous presence records containing only a Firebase server-generated `lastSeen` timestamp.
- `adminSession`: active admin browser session ID and Firebase server-generated `lastSeen` timestamp.

## 6. GitHub Setup

Create a repository, then run:

```bash
git init
git add .
git commit -m "Create cricket live score app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

In GitHub:

1. Repository Settings > Secrets and variables > Actions.
2. Add repository secret:

```text
VITE_FIREBASE_DATABASE_URL=https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com
VITE_LIVE_USERS_PATH=liveUsers
VITE_ADMIN_SESSION_PATH=adminSession
```

3. Repository Settings > Pages > Source: GitHub Actions.
4. Push to `main`; `.github/workflows/deploy-github-pages.yml` builds and publishes the site.

## 7. Firebase Hosting Alternative

If you prefer Firebase Hosting instead of GitHub Pages:

```bash
npm run build
firebase deploy --only hosting
```
