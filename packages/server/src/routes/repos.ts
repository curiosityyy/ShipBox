import type { FastifyInstance } from "fastify";
import { scanDirectories } from "../services/git-scanner.js";
import { db } from "../db/index.js";
import { settings } from "../db/schema.js";
import { eq } from "drizzle-orm";

export async function repoRoutes(app: FastifyInstance) {
  app.get("/api/repos", async () => {
    const scanDirsRow = db.select().from(settings).where(eq(settings.key, "scan_directories")).get();
    const scanDirs: string[] = scanDirsRow ? JSON.parse(scanDirsRow.value!) : [];
    const repos = await scanDirectories(scanDirs);
    return { repos, total: repos.length };
  });
}
