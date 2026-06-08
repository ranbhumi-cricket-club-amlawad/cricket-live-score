import fs from "node:fs/promises";
import { db, scoreboardPath } from "./firebase-admin.js";

const balls = ["0", "1", "1", "2", "3", "4", "6", "W"];
const scoreboard = JSON.parse(await fs.readFile(new URL("./sample-scoreboard.json", import.meta.url), "utf8"));

function nextBall() {
  const ball = balls[Math.floor(Math.random() * balls.length)];
  const score = scoreboard.currentMatch.score;
  const striker = scoreboard.currentMatch.batters[0];
  const bowler = scoreboard.currentMatch.bowler;

  if (ball === "W") {
    score.wickets += 1;
    bowler.wickets += 1;
  } else {
    const runs = Number(ball);
    score.runs += runs;
    striker.runs += runs;
    bowler.runs += runs;
    if (runs === 4) striker.fours += 1;
    if (runs === 6) striker.sixes += 1;
  }

  striker.balls += 1;
  striker.strikeRate = ((striker.runs / striker.balls) * 100).toFixed(2);
  scoreboard.currentMatch.battingScorecard = scoreboard.currentMatch.battingScorecard || [...scoreboard.currentMatch.batters];
  const strikerScore = scoreboard.currentMatch.battingScorecard.find((player) => player.name === striker.name);
  if (strikerScore) Object.assign(strikerScore, striker);
  if (!strikerScore) scoreboard.currentMatch.battingScorecard.unshift({ ...striker });
  scoreboard.currentMatch.bowlingScorecard = scoreboard.currentMatch.bowlingScorecard || [bowler];
  const bowlerScore = scoreboard.currentMatch.bowlingScorecard.find((player) => player.name === bowler.name);
  if (bowlerScore) Object.assign(bowlerScore, bowler);
  if (!bowlerScore) scoreboard.currentMatch.bowlingScorecard.unshift({ ...bowler });

  const [wholeOvers, ballsInOver] = String(score.overs).split(".").map(Number);
  const nextBalls = ballsInOver + 1;
  score.overs = nextBalls >= 6 ? `${wholeOvers + 1}.0` : `${wholeOvers}.${nextBalls}`;
  score.runRate = (score.runs / (wholeOvers + nextBalls / 6 || 1)).toFixed(2);
  score.requiredRate = Math.max(0, ((scoreboard.currentMatch.target - score.runs) / 3).toFixed(2));
  bowler.economy = (bowler.runs / Math.max(1, wholeOvers + nextBalls / 6)).toFixed(2);
  if (bowlerScore) Object.assign(bowlerScore, bowler);
  scoreboard.currentMatch.recentBalls = [ball, ...scoreboard.currentMatch.recentBalls].slice(0, 6);
  scoreboard.currentMatch.lastUpdated = new Date().toISOString();
}

async function publish() {
  nextBall();
  await db.ref(scoreboardPath).set(scoreboard);
  console.log(`${scoreboard.currentMatch.score.runs}/${scoreboard.currentMatch.score.wickets} in ${scoreboard.currentMatch.score.overs}`);
}

await publish();
setInterval(publish, 3000);
