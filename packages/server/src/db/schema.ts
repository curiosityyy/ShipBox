import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  projectPath: text("project_path"),
  model: text("model"),
  startedAt: integer("started_at"),
  endedAt: integer("ended_at"),
  inputTokens: integer("input_tokens"),
  outputTokens: integer("output_tokens"),
  costUsd: real("cost_usd"),
  toolCalls: integer("tool_calls"),
  summary: text("summary"),
});

export const toolCalls = sqliteTable("tool_calls", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: text("session_id").references(() => sessions.id),
  toolName: text("tool_name"),
  timestamp: integer("timestamp"),
  filePath: text("file_path"),
  sequencePrev: text("sequence_prev"),
});

export const dailyCosts = sqliteTable("daily_costs", {
  date: text("date").primaryKey(),
  totalCost: real("total_cost"),
  byModel: text("by_model"),
});

export const repos = sqliteTable("repos", {
  path: text("path").primaryKey(),
  name: text("name"),
  lastCommitAt: integer("last_commit_at"),
  branch: text("branch"),
  status: text("status"),
  dirty: integer("dirty").default(0),
});

export const snapshots = sqliteTable("snapshots", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  repoPath: text("repo_path"),
  branch: text("branch"),
  commitHash: text("commit_hash"),
  createdAt: integer("created_at"),
  label: text("label"),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value"),
});
