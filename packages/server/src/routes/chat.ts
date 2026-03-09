import type { FastifyInstance } from "fastify";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "../db/index.js";
import { settings } from "../db/schema.js";
import { eq } from "drizzle-orm";

function getApiKey(): string | null {
  const row = db.select().from(settings).where(eq(settings.key, "anthropic_api_key")).get();
  if (!row?.value) return null;
  try {
    return JSON.parse(row.value);
  } catch {
    return row.value;
  }
}

export async function chatRoutes(app: FastifyInstance) {
  // Save API key
  app.put("/api/chat/key", async (req, reply) => {
    const { key } = req.body as { key: string };
    if (!key) return reply.status(400).send({ error: "Missing key" });

    db.insert(settings)
      .values({ key: "anthropic_api_key", value: JSON.stringify(key) })
      .onConflictDoUpdate({ target: settings.key, set: { value: JSON.stringify(key) } })
      .run();

    return { ok: true };
  });

  // Check if API key is configured
  app.get("/api/chat/status", async () => {
    const key = getApiKey();
    return { hasKey: !!key };
  });

  // Streaming chat endpoint
  app.post("/api/chat", async (req, reply) => {
    const apiKey = getApiKey();
    if (!apiKey) {
      return reply.status(400).send({ error: "No API key configured. Go to Settings to add one." });
    }

    const { messages, model } = req.body as {
      messages: Array<{ role: "user" | "assistant"; content: string }>;
      model?: string;
    };

    if (!messages || messages.length === 0) {
      return reply.status(400).send({ error: "No messages provided" });
    }

    const client = new Anthropic({ apiKey });

    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
    });

    try {
      const stream = client.messages.stream({
        model: model || "claude-opus-4-6",
        max_tokens: 8192,
        messages,
      });

      for await (const event of stream) {
        if (event.type === "content_block_delta") {
          const delta = event.delta as any;
          if (delta.type === "text_delta") {
            reply.raw.write(`data: ${JSON.stringify({ type: "text", text: delta.text })}\n\n`);
          }
        } else if (event.type === "message_stop") {
          reply.raw.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
        } else if (event.type === "message_start") {
          const usage = (event as any).message?.usage;
          if (usage) {
            reply.raw.write(`data: ${JSON.stringify({ type: "usage", usage })}\n\n`);
          }
        }
      }
    } catch (err: any) {
      reply.raw.write(`data: ${JSON.stringify({ type: "error", error: err.message || "Unknown error" })}\n\n`);
    }

    reply.raw.end();
  });
}
