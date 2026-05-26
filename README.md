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

In production, replace `scripts/live-demo-updater.js` with your real scorer/admin panel/API writer. Keep the public website read-only.

## 4. Data Shape

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
- `upcomingMatches`: upcoming match list with teams, date, time, and venue.

## 5. GitHub Setup

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

## 6. Firebase Hosting Alternative

If you prefer Firebase Hosting instead of GitHub Pages:

```bash
npm run build
firebase deploy --only hosting
```
