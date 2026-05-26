import fs from "node:fs/promises";
import { db, scoreboardPath } from "./firebase-admin.js";

const scoreboard = JSON.parse(await fs.readFile(new URL("./sample-scoreboard.json", import.meta.url), "utf8"));
scoreboard.currentMatch.lastUpdated = new Date().toISOString();

await db.ref(scoreboardPath).set(scoreboard);
console.log(`Seeded Firebase Realtime Database at /${scoreboardPath}`);
process.exit(0);
