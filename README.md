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

The included rule allows public reads at `/scoreboard` and authenticated writes.

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
Password: Score@2026
```

The admin page can update:

- Tournament name, season, and venue
- Upcoming matches appear first; use `Make Live`, then select which team bats first
- Use `Start Second Innings` after the first innings to preserve its score, swap batting/fielding teams, set the target, and initialize the other team's players
- Completed and cancelled matches are retained until an admin removes them
- Live match status, target, score, wickets, overs, and rates
- Batting and bowling team details
- Batter and bowler player details
- Recent balls
- Upcoming matches
- Current striker, non-striker, and bowler from team squads
- Upcoming match player lists
- Ball events: legal runs, wicket, run out, wide, no-ball, byes, leg byes, penalty runs, and free-hit state
- Wicket and run-out actions require selecting the dismissed player; dismissed players are marked out and removed from striker selection

Important: this hard-coded login is only a simple frontend gate. It is not real security because browser code can be inspected. The included `database.rules.json` allows public writes to `/scoreboard` so this demo admin panel can save directly from GitHub Pages. For a production tournament, use Firebase Authentication or a backend API before sharing the admin URL publicly.

The public scorecard is shown only while `currentMatch.status` is exactly `LIVE`. Upcoming and completed/cancelled matches have separate sections. Select an upcoming match card to view both team squads.

## 5. Data Shape

Firebase path:

```text
/scoreboard
```

Example data lives in:

```text
scripts/sample-scoreboard.json
```

Main fields:

- `tournament`: tournament name, season, and venue.
- `currentMatch`: live match score, teams, batters, bowler, recent balls.
- `currentMatch.battingScorecard`: every batter who has played, including previous and current batters.
- `upcomingMatches`: upcoming match list with teams, date, time, and venue.
- `completedMatches`: completed and cancelled match history.

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
```

3. Repository Settings > Pages > Source: GitHub Actions.
4. Push to `main`; `.github/workflows/deploy-github-pages.yml` builds and publishes the site.

## 7. Firebase Hosting Alternative

If you prefer Firebase Hosting instead of GitHub Pages:

```bash
npm run build
firebase deploy --only hosting
```
