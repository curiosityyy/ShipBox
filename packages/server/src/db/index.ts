import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema.js";
import { sql } from "drizzle-orm";
import { join } from "node:path";
import { homedir } from "node:os";
import { mkdirSync } from "node:fs";

const dataDir = join(homedir(), ".shipbox");
mkdirSync(dataDir, { recursive: true });

const sqlite = new Database(join(dataDir, "shipbox.db"));
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, { schema });

// Create tables if they don't exist
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    project_path TEXT,
    model TEXT,
    started_at INTEGER,
    ended_at INTEGER,
    input_tokens INTEGER,
    output_tokens INTEGER,
    cost_usd REAL,
    tool_calls INTEGER,
    summary TEXT
  );
  CREATE TABLE IF NOT EXISTS tool_calls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT REFERENCES sessions(id),
    tool_name TEXT,
    timestamp INTEGER,
    file_path TEXT,
    sequence_prev TEXT
  );
  CREATE TABLE IF NOT EXISTS daily_costs (
    date TEXT PRIMARY KEY,
    total_cost REAL,
    by_model TEXT
  );
  CREATE TABLE IF NOT EXISTS repos (
    path TEXT PRIMARY KEY,
    name TEXT,
    last_commit_at INTEGER,
    branch TEXT,
    status TEXT,
    dirty INTEGER DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    repo_path TEXT,
    branch TEXT,
    commit_hash TEXT,
    created_at INTEGER,
    label TEXT
  );
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
  CREATE TABLE IF NOT EXISTS assistant_sessions (
    id TEXT PRIMARY KEY,
    title TEXT,
    model TEXT,
    cwd TEXT,
    created_at INTEGER,
    updated_at INTEGER,
    last_message TEXT,
    message_count INTEGER DEFAULT 0,
    total_cost_usd REAL DEFAULT 0
  );
`);

// Initialize default settings
const defaultSettings = [
  { key: "scan_directories", value: JSON.stringify([join(homedir(), "project")]) },
  { key: "default_model", value: JSON.stringify("sonnet") },
  { key: "auto_refresh_enabled", value: JSON.stringify(true) },
  { key: "auto_refresh_interval", value: JSON.stringify(30) },
  { key: "daily_budget_limit", value: JSON.stringify(0) },
  { key: "monthly_budget_limit", value: JSON.stringify(0) },
  { key: "alert_threshold", value: JSON.stringify(80) },
  { key: "sidebar_visibility", value: JSON.stringify({}) },
  { key: "agents_enabled", value: JSON.stringify({ claude_code: true }) },
];
for (const s of defaultSettings) {
  sqlite.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)").run(s.key, s.value);
}
