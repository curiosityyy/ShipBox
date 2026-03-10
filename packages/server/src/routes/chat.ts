import type { FastifyInstance } from "fastify";
import { execSync, spawn } from "node:child_process";
import { db } from "../db/index.js";
import { assistantSessions, assistantMessages } from "../db/schema.js";
import { eq, desc } from "drizzle-orm";

// Resolve claude binary path and node binary path at startup
let claudePath = "claude";
let nodePath = "node";
try {
  claudePath = execSync("which claude", { encoding: "utf-8" }).trim();
} catch {
  // fallback
}
try {
  nodePath = execSync("which node", { encoding: "utf-8" }).trim();
} catch {
  // fallback
}

// Build a minimal clean env — only essentials, no CLAUDE* vars
function minimalEnv(): Record<string, string> {
  const home = process.env.HOME || "/";
  const nodeBinDir = nodePath.replace(/\/node$/, "");
  return {
    HOME: home,
    USER: process.env.USER || "nobody",
    PATH: `${nodeBinDir}:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`,
    SHELL: process.env.SHELL || "/bin/zsh",
    TERM: process.env.TERM || "xterm-256color",
    LANG: process.env.LANG || "en_US.UTF-8",
  };
}

export async function chatRoutes(app: FastifyInstance) {
  // ── List assistant sessions ──
  app.get("/api/assistant/sessions", async () => {
    const rows = await db
      .select()
      .from(assistantSessions)
      .orderBy(desc(assistantSessions.updatedAt));
    return { sessions: rows };
  });

  // ── Get messages for a session ──
  app.get("/api/assistant/sessions/:id/messages", async (req) => {
    const { id } = req.params as { id: string };
    const rows = db
      .select()
      .from(assistantMessages)
      .where(eq(assistantMessages.sessionId, id))
      .orderBy(assistantMessages.id)
      .all();

    const messages = rows.map((r) => ({
      role: r.role,
      content: r.content,
      thinking: r.thinking ? JSON.parse(r.thinking) : undefined,
      toolUses: r.toolUses ? JSON.parse(r.toolUses) : undefined,
      model: r.model || undefined,
      costUsd: r.costUsd || undefined,
      durationMs: r.durationMs || undefined,
    }));

    return { messages };
  });

  // ── Rename session ──
  app.patch("/api/assistant/sessions/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const { title } = req.body as { title: string };
    if (!title?.trim()) {
      reply.status(400).send({ error: "Title required" });
      return;
    }
    await db
      .update(assistantSessions)
      .set({ title: title.trim() })
      .where(eq(assistantSessions.id, id));
    return { ok: true };
  });

  // ── Delete session ──
  app.delete("/api/assistant/sessions/:id", async (req) => {
    const { id } = req.params as { id: string };
    // Delete messages first, then session
    db.delete(assistantMessages).where(eq(assistantMessages.sessionId, id)).run();
    db.delete(assistantSessions).where(eq(assistantSessions.id, id)).run();
    return { ok: true };
  });

  // ── Chat (SSE stream) ──
  app.post("/api/chat", (req, reply) => {
    const { message, sessionId, model, cwd } = req.body as {
      message: string;
      sessionId?: string;
      model?: string;
      cwd?: string;
    };

    if (!message) {
      reply.status(400).send({ error: "No message provided" });
      return;
    }

    const workDir = cwd || process.env.HOME || "/";

    const args = ["-p", "--output-format", "stream-json", "--verbose", "--dangerously-skip-permissions"];
    if (sessionId) args.push("--resume", sessionId);
    if (model) args.push("--model", model);
    args.push(message);

    // Hijack reply for SSE
    reply.hijack();
    const raw = reply.raw;
    raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
    });

    app.log.info({ nodePath, claudePath, cwd: workDir, argsCount: args.length }, "Spawning claude");

    // Use node directly to run the claude script with a minimal env
    const child = spawn(nodePath, [claudePath, ...args], {
      cwd: workDir,
      env: minimalEnv(),
      stdio: ["ignore", "pipe", "pipe"],
    });

    let buffer = "";
    let capturedSessionId: string | null = sessionId || null;
    let capturedModel: string = model || "";
    let totalCost = 0;
    let resultDuration = 0;

    // Accumulate assistant response for DB persistence
    let assistantText = "";
    let assistantTools: any[] = [];
    let assistantThinking: any[] = [];
    const toolIdMap = new Map<string, number>();
    let userMessageSaved = !!sessionId; // For existing sessions, save user msg on init

    child.stdout.on("data", (chunk: Buffer) => {
      buffer += chunk.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const event = JSON.parse(line);
          raw.write(`data: ${JSON.stringify(event)}\n\n`);

          // Capture session info — immediately create DB record on init
          if (event.type === "system" && event.subtype === "init" && event.session_id) {
            capturedSessionId = event.session_id;
            if (event.model) capturedModel = event.model;

            // Create session record immediately so it shows in sidebar
            try {
              const existing = db
                .select()
                .from(assistantSessions)
                .where(eq(assistantSessions.id, event.session_id))
                .get();
              if (!existing) {
                const now = Date.now();
                db.insert(assistantSessions)
                  .values({
                    id: event.session_id,
                    title: message.slice(0, 60).replace(/\n/g, " "),
                    model: capturedModel,
                    cwd: workDir,
                    createdAt: now,
                    updatedAt: now,
                    lastMessage: message.slice(0, 200),
                    messageCount: 1,
                    totalCostUsd: 0,
                  })
                  .run();
              }
            } catch (err: any) {
              app.log.error({ err: err.message }, "Failed to create session on init");
            }

            // Save user message to DB
            if (!userMessageSaved && capturedSessionId) {
              try {
                db.insert(assistantMessages)
                  .values({
                    sessionId: capturedSessionId,
                    role: "user",
                    content: message,
                    createdAt: Date.now(),
                  })
                  .run();
                userMessageSaved = true;
              } catch (err: any) {
                app.log.error({ err: err.message }, "Failed to save user message");
              }
            }
          }

          // For resumed sessions, save user message once we confirm session_id
          if (event.type === "system" && event.subtype === "init" && sessionId && !userMessageSaved) {
            // This case shouldn't happen since userMessageSaved is set above, but just in case
          }

          // Accumulate assistant content
          if (event.type === "assistant") {
            const msg = event.message;
            if (msg?.content) {
              for (const block of msg.content) {
                if (block.type === "text") {
                  assistantText += block.text;
                } else if (block.type === "thinking") {
                  assistantThinking.push({ text: block.thinking || block.text || "" });
                } else if (block.type === "tool_use") {
                  const idx = assistantTools.length;
                  assistantTools.push({ id: block.id, name: block.name, input: block.input });
                  if (block.id) toolIdMap.set(block.id, idx);
                }
              }
            }
          }

          // Accumulate tool results
          if (event.type === "tool_result") {
            const toolUseId = event.tool_use_id;
            const content = event.content;
            let resultText = "";
            if (typeof content === "string") resultText = content;
            else if (Array.isArray(content)) {
              resultText = content.map((c: any) => c.type === "text" ? c.text : `[${c.type}]`).join("\n");
            }
            if (toolUseId && toolIdMap.has(toolUseId)) {
              const idx = toolIdMap.get(toolUseId)!;
              assistantTools[idx] = { ...assistantTools[idx], result: resultText, isError: event.is_error === true };
            }
          }

          if (event.type === "result") {
            if (event.total_cost_usd) totalCost = event.total_cost_usd;
            if (event.duration_ms) resultDuration = event.duration_ms;
          }
        } catch {
          // non-JSON line
        }
      }
    });

    child.stderr.on("data", (_chunk: Buffer) => {
      // claude outputs same data to both stdout and stderr; ignore stderr
    });

    child.on("close", (code, signal) => {
      if (buffer.trim()) {
        try {
          const event = JSON.parse(buffer);
          raw.write(`data: ${JSON.stringify(event)}\n\n`);
          if (event.type === "result" && event.total_cost_usd) {
            totalCost = event.total_cost_usd;
          }
          if (event.type === "result" && event.duration_ms) {
            resultDuration = event.duration_ms;
          }
        } catch {}
      }
      app.log.info({ code, signal }, "claude process closed");
      raw.write(`data: ${JSON.stringify({ type: "close", code, signal })}\n\n`);
      raw.end();

      if (capturedSessionId) {
        const now = Date.now();

        // Save user message for resumed sessions (if not saved on init)
        if (!userMessageSaved) {
          try {
            db.insert(assistantMessages)
              .values({
                sessionId: capturedSessionId,
                role: "user",
                content: message,
                createdAt: now,
              })
              .run();
          } catch (err: any) {
            app.log.error({ err: err.message }, "Failed to save user message on close");
          }
        }

        // Save assistant response
        if (assistantText || assistantTools.length > 0 || assistantThinking.length > 0) {
          try {
            db.insert(assistantMessages)
              .values({
                sessionId: capturedSessionId,
                role: "assistant",
                content: assistantText,
                thinking: assistantThinking.length > 0 ? JSON.stringify(assistantThinking) : null,
                toolUses: assistantTools.length > 0 ? JSON.stringify(assistantTools) : null,
                model: capturedModel,
                costUsd: totalCost,
                durationMs: resultDuration,
                createdAt: now,
              })
              .run();
          } catch (err: any) {
            app.log.error({ err: err.message }, "Failed to save assistant message");
          }
        }

        // Update session metadata
        if (code === 0) {
          try {
            const existing = db
              .select()
              .from(assistantSessions)
              .where(eq(assistantSessions.id, capturedSessionId))
              .get();

            if (existing) {
              db.update(assistantSessions)
                .set({
                  updatedAt: now,
                  lastMessage: message.slice(0, 200),
                  messageCount: (existing.messageCount || 0) + 1,
                  totalCostUsd: (existing.totalCostUsd || 0) + totalCost,
                })
                .where(eq(assistantSessions.id, capturedSessionId))
                .run();
            }
          } catch (err: any) {
            app.log.error({ err: err.message }, "Failed to update assistant session");
          }
        }
      }
    });

    child.on("error", (err) => {
      app.log.error({ err: err.message }, "claude spawn error");
      raw.write(`data: ${JSON.stringify({ type: "error", error: err.message })}\n\n`);
      raw.end();
    });

    // Use the response socket close event (not req.raw which fires immediately after hijack)
    raw.on("close", () => {
      if (!child.killed) child.kill("SIGTERM");
    });
  });
}
