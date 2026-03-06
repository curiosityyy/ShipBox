import type { FastifyInstance } from "fastify";
import { getDashboardData, getActiveSessionIds } from "../services/claude-data.js";
import { scanDirectories } from "../services/git-scanner.js";
import { db } from "../db/index.js";
import { settings } from "../db/schema.js";
import { eq } from "drizzle-orm";

export async function dashboardRoutes(app: FastifyInstance) {
  app.get("/api/dashboard", async () => {
    const data = getDashboardData();
    const activeSessions = getActiveSessionIds();

    // Get scan directories from settings
    const scanDirsRow = db.select().from(settings).where(eq(settings.key, "scan_directories")).get();
    const scanDirs: string[] = scanDirsRow ? JSON.parse(scanDirsRow.value!) : [];

    // Scan repos
    let repoCount = 0;
    let commitsToday = 0;
    try {
      const repos = await scanDirectories(scanDirs);
      repoCount = repos.length;
      commitsToday = repos.reduce((sum, r) => sum + r.commitsToday, 0);
    } catch {
      // ignore scan errors
    }

    return {
      greeting: getGreeting(),
      user: process.env.USER || "user",
      stats: {
        repos: repoCount,
        commitsToday,
        sessions: activeSessions.length,
        estCost: data.totalCost,
      },
      recentSessions: data.recentSessions,
      costByModel: data.costByModel,
      dailyCosts: data.dailyCosts,
      toolStats: data.toolStats,
    };
  });
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return "Night owl";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Night owl";
}
