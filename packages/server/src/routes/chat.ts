import type { FastifyInstance } from "fastify";
import { execSync, spawn } from "node:child_process";

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
    // This avoids nested-session detection from inherited CLAUDE* env vars
    const child = spawn(nodePath, [claudePath, ...args], {
      cwd: workDir,
      env: minimalEnv(),
      stdio: ["ignore", "pipe", "pipe"],
    });

    let buffer = "";

    child.stdout.on("data", (chunk: Buffer) => {
      buffer += chunk.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const event = JSON.parse(line);
          raw.write(`data: ${JSON.stringify(event)}\n\n`);
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
        } catch {}
      }
      app.log.info({ code, signal }, "claude process closed");
      raw.write(`data: ${JSON.stringify({ type: "close", code, signal })}\n\n`);
      raw.end();
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
