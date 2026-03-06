import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, basename } from "node:path";
import { homedir } from "node:os";

const CLAUDE_DIR = join(homedir(), ".claude");
const PROJECTS_DIR = join(CLAUDE_DIR, "projects");

export interface SessionInfo {
  id: string;
  projectPath: string;
  startedAt: number;
  model: string;
  messageCount: number;
  toolCallCount: number;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  costUsd: number;
  summary: string;
}

export interface CostData {
  version: number;
  lastFullScan: string;
  days: Record<string, Record<string, {
    input: number;
    cacheWrite: number;
    cacheRead: number;
    output: number;
  }>>;
}

export interface ToolData {
  totalCalls: number;
  sessionCount: number;
  tools: Record<string, number>;
  chains: Record<string, number>;
  commands: Record<string, number>;
  files: Record<string, number>;
  daily: Record<string, number>;
}

// Pricing per million tokens (approximate)
const PRICING: Record<string, { input: number; output: number; cacheRead: number; cacheWrite: number }> = {
  "claude-opus-4-6": { input: 15, output: 75, cacheRead: 1.5, cacheWrite: 18.75 },
  "claude-sonnet-4-6": { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
  "claude-haiku-4-5-20251001": { input: 0.8, output: 4, cacheRead: 0.08, cacheWrite: 1 },
};

function calculateCost(model: string, tokens: { input: number; output: number; cacheRead: number; cacheWrite: number }): number {
  const pricing = PRICING[model] || PRICING["claude-sonnet-4-6"];
  return (
    (tokens.input / 1_000_000) * pricing.input +
    (tokens.output / 1_000_000) * pricing.output +
    (tokens.cacheRead / 1_000_000) * pricing.cacheRead +
    (tokens.cacheWrite / 1_000_000) * pricing.cacheWrite
  );
}

export function getCostCache(): CostData | null {
  const cachePath = join(CLAUDE_DIR, "readout-cost-cache.json");
  if (!existsSync(cachePath)) return null;
  try {
    return JSON.parse(readFileSync(cachePath, "utf-8"));
  } catch {
    return null;
  }
}

export function getToolCache(): ToolData | null {
  const cachePath = join(CLAUDE_DIR, "readout-tool-cache.json");
  if (!existsSync(cachePath)) return null;
  try {
    return JSON.parse(readFileSync(cachePath, "utf-8"));
  } catch {
    return null;
  }
}

export function getSettings(): Record<string, unknown> {
  const settingsPath = join(CLAUDE_DIR, "settings.json");
  if (!existsSync(settingsPath)) return {};
  try {
    return JSON.parse(readFileSync(settingsPath, "utf-8"));
  } catch {
    return {};
  }
}

export function getHistory(): Array<{ display: string; timestamp: number; project: string; sessionId: string }> {
  const historyPath = join(CLAUDE_DIR, "history.jsonl");
  if (!existsSync(historyPath)) return [];
  try {
    const lines = readFileSync(historyPath, "utf-8").trim().split("\n");
    return lines
      .map((line) => {
        try { return JSON.parse(line); } catch { return null; }
      })
      .filter(Boolean)
      .reverse();
  } catch {
    return [];
  }
}

export function listProjects(): string[] {
  if (!existsSync(PROJECTS_DIR)) return [];
  return readdirSync(PROJECTS_DIR).filter((f) => {
    const p = join(PROJECTS_DIR, f);
    return statSync(p).isDirectory();
  });
}

export function listSessionFiles(projectDir: string): string[] {
  const fullPath = join(PROJECTS_DIR, projectDir);
  if (!existsSync(fullPath)) return [];
  return readdirSync(fullPath)
    .filter((f) => f.endsWith(".jsonl"))
    .map((f) => f.replace(".jsonl", ""));
}

export function parseSessionSummary(projectDir: string, sessionId: string): SessionInfo | null {
  const filePath = join(PROJECTS_DIR, projectDir, `${sessionId}.jsonl`);
  if (!existsSync(filePath)) return null;

  try {
    const content = readFileSync(filePath, "utf-8");
    const lines = content.trim().split("\n");

    let model = "unknown";
    let messageCount = 0;
    let toolCallCount = 0;
    let inputTokens = 0;
    let outputTokens = 0;
    let cacheReadTokens = 0;
    let cacheWriteTokens = 0;
    let firstTimestamp = 0;
    let summary = "";
    const projectPath = projectDir.replace(/-/g, "/");

    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        if (entry.type === "user" && !summary && entry.message?.content) {
          const content = entry.message.content;
          if (typeof content === "string") {
            summary = content.slice(0, 100);
          } else if (Array.isArray(content)) {
            const textBlock = content.find((b: any) => b.type === "text");
            if (textBlock) summary = textBlock.text?.slice(0, 100) || "";
          }
        }
        if (entry.type === "assistant") {
          messageCount++;
          const msg = entry.message;
          if (msg?.model) model = msg.model;
          if (msg?.usage) {
            inputTokens += msg.usage.input_tokens || 0;
            outputTokens += msg.usage.output_tokens || 0;
            cacheReadTokens += msg.usage.cache_read_input_tokens || 0;
            cacheWriteTokens += msg.usage.cache_creation_input_tokens || 0;
          }
          // Count tool use
          if (msg?.content && Array.isArray(msg.content)) {
            toolCallCount += msg.content.filter((b: any) => b.type === "tool_use").length;
          }
        }
        if (entry.timestamp && !firstTimestamp) {
          firstTimestamp = new Date(entry.timestamp).getTime();
        }
      } catch {
        // skip malformed lines
      }
    }

    const costUsd = calculateCost(model, {
      input: inputTokens,
      output: outputTokens,
      cacheRead: cacheReadTokens,
      cacheWrite: cacheWriteTokens,
    });

    return {
      id: sessionId,
      projectPath,
      startedAt: firstTimestamp,
      model,
      messageCount,
      toolCallCount,
      inputTokens,
      outputTokens,
      cacheReadTokens,
      cacheWriteTokens,
      costUsd,
      summary,
    };
  } catch {
    return null;
  }
}

export function getDashboardData() {
  const costCache = getCostCache();
  const toolCache = getToolCache();
  const history = getHistory();

  // Calculate total cost
  let totalCost = 0;
  const costByModel: Record<string, number> = {};
  const dailyCosts: Array<{ date: string; cost: number }> = [];

  if (costCache?.days) {
    for (const [date, models] of Object.entries(costCache.days)) {
      let dayCost = 0;
      for (const [model, tokens] of Object.entries(models)) {
        const cost = calculateCost(model, {
          input: tokens.input,
          output: tokens.output,
          cacheRead: tokens.cacheRead,
          cacheWrite: tokens.cacheWrite,
        });
        dayCost += cost;
        costByModel[model] = (costByModel[model] || 0) + cost;
      }
      totalCost += dayCost;
      dailyCosts.push({ date, cost: dayCost });
    }
  }

  // Recent sessions from history
  const recentSessions = history.slice(0, 10).map((h) => ({
    display: h.display?.slice(0, 80) || "untitled",
    timestamp: h.timestamp,
    project: h.project,
    sessionId: h.sessionId,
  }));

  // Today's date
  const today = new Date().toISOString().split("T")[0];
  const todayCost = dailyCosts.find((d) => d.date === today)?.cost || 0;

  return {
    totalCost: Math.round(totalCost * 100) / 100,
    todayCost: Math.round(todayCost * 100) / 100,
    costByModel,
    dailyCosts,
    recentSessions,
    toolStats: toolCache
      ? {
          totalCalls: toolCache.totalCalls,
          sessionCount: toolCache.sessionCount,
          tools: toolCache.tools,
          topCommands: toolCache.commands,
        }
      : null,
    sessionCount: toolCache?.sessionCount || 0,
  };
}

export function getActiveSessionIds(): string[] {
  // Check session-env directory for active sessions
  const sessionEnvDir = join(CLAUDE_DIR, "session-env");
  if (!existsSync(sessionEnvDir)) return [];
  try {
    return readdirSync(sessionEnvDir);
  } catch {
    return [];
  }
}
