import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../db/index.js";
import { settings, sessions, dailyCosts, toolCalls } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { execSync } from "node:child_process";

const putSettingsParams = z.object({
  key: z.string().min(1),
});

const putSettingsBody = z.object({
  value: z.unknown(),
});

export async function settingsRoutes(app: FastifyInstance) {
  app.get("/api/settings", async () => {
    const rows = db.select().from(settings).all();
    const result: Record<string, unknown> = {};
    for (const row of rows) {
      try {
        result[row.key] = JSON.parse(row.value!);
      } catch {
        result[row.key] = row.value;
      }
    }
    return result;
  });

  app.put("/api/settings/:key", async (req, reply) => {
    const paramsResult = putSettingsParams.safeParse(req.params);
    if (!paramsResult.success) {
      return reply.status(400).send({ error: "Invalid params", details: paramsResult.error.issues });
    }
    const bodyResult = putSettingsBody.safeParse(req.body);
    if (!bodyResult.success) {
      return reply.status(400).send({ error: "Invalid body", details: bodyResult.error.issues });
    }
    const { key } = paramsResult.data;
    const { value } = bodyResult.data;
    const serialized = typeof value === "string" ? value : JSON.stringify(value);

    db.insert(settings)
      .values({ key, value: serialized })
      .onConflictDoUpdate({ target: settings.key, set: { value: serialized } })
      .run();

    return { ok: true };
  });

  // Detect Claude binary path
  app.get("/api/settings/claude-binary", async () => {
    try {
      const path = execSync("which claude", { encoding: "utf-8" }).trim();
      let version = "";
      try {
        version = execSync("claude --version", { encoding: "utf-8" }).trim();
      } catch {}
      return { found: true, path, version };
    } catch {
      return { found: false, path: null, version: null };
    }
  });

  // Export all data as JSON
  app.get("/api/settings/export", async () => {
    const allSettings = db.select().from(settings).all();
    const allSessions = db.select().from(sessions).all();
    const allCosts = db.select().from(dailyCosts).all();
    const allTools = db.select().from(toolCalls).all();
    return {
      exportedAt: new Date().toISOString(),
      settings: allSettings,
      sessions: allSessions,
      dailyCosts: allCosts,
      toolCalls: allTools,
    };
  });
}
