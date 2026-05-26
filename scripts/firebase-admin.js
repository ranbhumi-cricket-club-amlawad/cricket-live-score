import admin from "firebase-admin";
import fs from "node:fs";

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
