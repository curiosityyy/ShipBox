import type { FastifyInstance } from "fastify";
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, basename } from "node:path";
import { homedir } from "node:os";
import { execa } from "execa";

const CLAUDE_DIR = join(homedir(), ".claude");

export async function configRoutes(app: FastifyInstance) {
  // Skills
  app.get("/api/skills", async () => {
    const skills: Array<{ name: string; path: string; source: string }> = [];
    const globalSkillsDir = join(CLAUDE_DIR, "skills");
    if (existsSync(globalSkillsDir)) {
      for (const f of readdirSync(globalSkillsDir)) {
        skills.push({ name: f, path: join(globalSkillsDir, f), source: "global" });
      }
    }
    return { skills, total: skills.length };
  });

  // Agents
  app.get("/api/agents", async () => {
    const agents: Array<{ name: string; path: string }> = [];
    // Check if Claude Code is installed
    try {
      await execa("which", ["claude"]);
      agents.push({ name: "Claude Code", path: join(homedir(), ".claude") });
    } catch { /* not installed */ }
    return { agents, total: agents.length };
  });

  // Memory
  app.get("/api/memory", async () => {
    const projectDirs = join(CLAUDE_DIR, "projects");
    const memories: Array<{ project: string; content: string }> = [];
    if (existsSync(projectDirs)) {
      for (const proj of readdirSync(projectDirs)) {
        const memoryDir = join(projectDirs, proj, "memory");
        if (existsSync(memoryDir)) {
          const memoryFile = join(memoryDir, "MEMORY.md");
          if (existsSync(memoryFile)) {
            memories.push({
              project: proj.replace(/-/g, "/"),
              content: readFileSync(memoryFile, "utf-8"),
            });
          }
        }
      }
    }
    return { memories, total: memories.length };
  });

  // Hooks
  app.get("/api/hooks", async () => {
    const settingsPath = join(CLAUDE_DIR, "settings.json");
    if (!existsSync(settingsPath)) return { hooks: [], total: 0 };
    try {
      const data = JSON.parse(readFileSync(settingsPath, "utf-8"));
      const hooks = data.hooks || {};
      return { hooks, total: Object.keys(hooks).length };
    } catch {
      return { hooks: {}, total: 0 };
    }
  });

  // Ports
  app.get("/api/ports", async () => {
    try {
      let output: string;
      try {
        const result = await execa("lsof", ["-iTCP", "-sTCP:LISTEN", "-nP"], { timeout: 5000 });
        output = result.stdout;
      } catch {
        const result = await execa("ss", ["-tlnp"], { timeout: 5000 });
        output = result.stdout;
      }
      const lines = output.trim().split("\n").slice(1);
      const ports: Array<{ port: number; process: string; pid: number }> = [];

      for (const line of lines) {
        const parts = line.split(/\s+/);
        if (parts.length >= 9) {
          // lsof format
          const process = parts[0];
          const pid = parseInt(parts[1]) || 0;
          const addr = parts[8];
          const portMatch = addr.match(/:(\d+)$/);
          if (portMatch) {
            ports.push({ port: parseInt(portMatch[1]), process, pid });
          }
        }
      }

      // Deduplicate by port
      const unique = [...new Map(ports.map((p) => [p.port, p])).values()];
      return { ports: unique, total: unique.length };
    } catch {
      return { ports: [], total: 0 };
    }
  });
}
