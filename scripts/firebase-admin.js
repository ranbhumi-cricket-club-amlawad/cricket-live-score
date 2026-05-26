import admin from "firebase-admin";
import fs from "node:fs";

function loadEnvFile(path = ".env") {
  if (!fs.existsSync(path)) return;

  const lines = fs.readFileSync(path, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^["']|["']$/g, "");
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile();

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT || "./service-account.json";
const databaseURL = process.env.VITE_FIREBASE_DATABASE_URL || process.env.FIREBASE_DATABASE_URL;

if (!databaseURL) {
  throw new Error("Set VITE_FIREBASE_DATABASE_URL or FIREBASE_DATABASE_URL before running this script.");
}

if (!fs.existsSync(serviceAccountPath)) {
  throw new Error(`Firebase service account file not found: ${serviceAccountPath}`);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"))),
    databaseURL
  });
}

export const db = admin.database();
export const scoreboardPath = process.env.VITE_SCOREBOARD_PATH || "scoreboard";
