import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../db/index.js";
import { settings } from "../db/schema.js";
import { eq } from "drizzle-orm";

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
}
