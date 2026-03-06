import type { FastifyInstance } from "fastify";
import {
  listProjects,
  listSessionFiles,
  parseSessionSummary,
  getActiveSessionIds,
  getHistory,
  getToolCache,
  getCostCache,
} from "../services/claude-data.js";

export async function sessionRoutes(app: FastifyInstance) {
  app.get("/api/sessions", async () => {
    const projects = listProjects();
    const allSessions: any[] = [];
    for (const proj of projects) {
      const sessionIds = listSessionFiles(proj);
      for (const sid of sessionIds) {
        const info = parseSessionSummary(proj, sid);
        if (info) allSessions.push(info);
      }
    }
    allSessions.sort((a, b) => b.startedAt - a.startedAt);
    return { sessions: allSessions, total: allSessions.length };
  });

  app.get("/api/live", async () => {
    const activeIds = getActiveSessionIds();
    return {
      sessions: activeIds.length,
      generating: 0,
      activeSessionIds: activeIds,
    };
  });

  app.get("/api/history", async () => {
    return { history: getHistory() };
  });

  app.get("/api/tools", async () => {
    const toolCache = getToolCache();
    if (!toolCache) return { tools: {}, chains: {}, commands: {}, totalCalls: 0 };
    return toolCache;
  });

  app.get("/api/costs", async () => {
    const costCache = getCostCache();
    if (!costCache) return { days: {}, totalCost: 0 };
    return costCache;
  });
}
