import type { FastifyInstance } from "fastify";
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, basename } from "node:path";
import { homedir } from "node:os";
import { execa } from "execa";
import simpleGit from "simple-git";
import { db } from "../db/index.js";
import { settings } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { scanDirectories } from "../services/git-scanner.js";

const CLAUDE_DIR = join(homedir(), ".claude");

function getScanDirs(): string[] {
  const row = db.select().from(settings).where(eq(settings.key, "scan_directories")).get();
  return row ? JSON.parse(row.value!) : [];
}

export async function healthRoutes(app: FastifyInstance) {
  // Hygiene - system health checks
  app.get("/api/hygiene", async () => {
    const issues: Array<{ type: string; severity: string; message: string; detail: string }> = [];

    // Check for zombie claude processes
    try {
      const { stdout } = await execa("ps", ["aux"], { timeout: 5000 });
      const lines = stdout.split("\n").filter((l) => l.toLowerCase().includes("claude") && !l.includes("grep"));
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[1];
        const cpu = parts[2];
        const mem = parts[3];
        const command = parts.slice(10).join(" ");
        if (command && !command.includes("shipbox")) {
          issues.push({
            type: "zombie_process",
            severity: parseFloat(cpu) > 50 ? "critical" : "info",
            message: `Claude process (PID ${pid})`,
            detail: `CPU: ${cpu}%, MEM: ${mem}%, CMD: ${command}`,
          });
        }
      }
    } catch {
      // ps not available or errored
    }

    // Check for large log files
    try {
      const logsDir = join(CLAUDE_DIR, "logs");
      if (existsSync(logsDir)) {
        for (const f of readdirSync(logsDir)) {
          try {
            const s = statSync(join(logsDir, f));
            if (s.size > 50 * 1024 * 1024) {
              issues.push({
                type: "large_log",
                severity: "warning",
                message: `Large log file: ${f}`,
                detail: `Size: ${Math.round(s.size / 1024 / 1024)}MB`,
              });
            }
          } catch {
            // skip
          }
        }
      }
    } catch {
      // ignore
    }

    // Check for stale sessions
    try {
      const projectsDir = join(CLAUDE_DIR, "projects");
      if (existsSync(projectsDir)) {
        for (const proj of readdirSync(projectsDir)) {
          const sessionsDir = join(projectsDir, proj, "sessions");
          if (existsSync(sessionsDir)) {
            try {
              const sessions = readdirSync(sessionsDir);
              const stale = sessions.filter((s) => {
                try {
                  const st = statSync(join(sessionsDir, s));
                  const daysSince = (Date.now() - st.mtimeMs) / (1000 * 60 * 60 * 24);
                  return daysSince > 30;
                } catch {
                  return false;
                }
              });
              if (stale.length > 10) {
                issues.push({
                  type: "stale_sessions",
                  severity: "info",
                  message: `${stale.length} stale sessions in ${proj.replace(/-/g, "/")}`,
                  detail: `Sessions older than 30 days`,
                });
              }
            } catch {
              // skip
            }
          }
        }
      }
    } catch {
      // ignore
    }

    return { issues, total: issues.length };
  });

  // Dependencies
  app.get("/api/deps", async () => {
    const scanDirs = getScanDirs();
    const repos: Array<{ name: string; path: string; deps: number; devDeps: number; hasLockfile: boolean }> = [];

    try {
      const scannedRepos = await scanDirectories(scanDirs);
      for (const repo of scannedRepos) {
        const pkgPath = join(repo.path, "package.json");
        if (existsSync(pkgPath)) {
          try {
            const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
            const hasLockfile =
              existsSync(join(repo.path, "package-lock.json")) ||
              existsSync(join(repo.path, "pnpm-lock.yaml")) ||
              existsSync(join(repo.path, "yarn.lock"));
            repos.push({
              name: repo.name,
              path: repo.path,
              deps: Object.keys(pkg.dependencies || {}).length,
              devDeps: Object.keys(pkg.devDependencies || {}).length,
              hasLockfile,
            });
          } catch {
            // skip invalid package.json
          }
        }
      }
    } catch {
      // ignore scan errors
    }

    return { repos, total: repos.length };
  });

  // Worktrees
  app.get("/api/worktrees", async () => {
    const scanDirs = getScanDirs();
    const repos: Array<{ name: string; path: string; worktrees: Array<{ path: string; branch: string; head: string }> }> = [];

    try {
      const scannedRepos = await scanDirectories(scanDirs);
      for (const repo of scannedRepos) {
        try {
          const git = simpleGit(repo.path);
          const { stdout } = await execa("git", ["worktree", "list", "--porcelain"], { cwd: repo.path, timeout: 5000 });
          const worktrees: Array<{ path: string; branch: string; head: string }> = [];
          let current: { path: string; branch: string; head: string } = { path: "", branch: "", head: "" };

          for (const line of stdout.split("\n")) {
            if (line.startsWith("worktree ")) {
              if (current.path) worktrees.push(current);
              current = { path: line.replace("worktree ", ""), branch: "", head: "" };
            } else if (line.startsWith("HEAD ")) {
              current.head = line.replace("HEAD ", "").substring(0, 8);
            } else if (line.startsWith("branch ")) {
              current.branch = line.replace("branch refs/heads/", "");
            }
          }
          if (current.path) worktrees.push(current);

          // Only include repos with multiple worktrees
          if (worktrees.length > 1) {
            repos.push({ name: repo.name, path: repo.path, worktrees });
          }
        } catch {
          // skip repos where worktree list fails
        }
      }
    } catch {
      // ignore scan errors
    }

    return { repos, total: repos.length };
  });

  // Env files
  app.get("/api/env-files", async () => {
    const scanDirs = getScanDirs();
    const files: Array<{ path: string; repo: string; size: number }> = [];

    try {
      const scannedRepos = await scanDirectories(scanDirs);
      for (const repo of scannedRepos) {
        try {
          const entries = readdirSync(repo.path);
          for (const entry of entries) {
            if (entry.startsWith(".env")) {
              try {
                const fullPath = join(repo.path, entry);
                const s = statSync(fullPath);
                if (s.isFile()) {
                  files.push({ path: fullPath, repo: repo.name, size: s.size });
                }
              } catch {
                // skip
              }
            }
          }
        } catch {
          // skip unreadable repos
        }
      }
    } catch {
      // ignore scan errors
    }

    return { files, total: files.length };
  });

  // Lint - find CLAUDE.md files
  app.get("/api/lint-claude", async () => {
    const scanDirs = getScanDirs();
    const files: Array<{ path: string; project: string; size: number; lines: number }> = [];

    // Check global ~/.claude/CLAUDE.md
    const globalClaude = join(CLAUDE_DIR, "CLAUDE.md");
    if (existsSync(globalClaude)) {
      try {
        const content = readFileSync(globalClaude, "utf-8");
        const s = statSync(globalClaude);
        files.push({
          path: globalClaude,
          project: "~/.claude (global)",
          size: s.size,
          lines: content.split("\n").length,
        });
      } catch {
        // skip
      }
    }

    // Check repos
    try {
      const scannedRepos = await scanDirectories(scanDirs);
      for (const repo of scannedRepos) {
        const claudePaths = [
          join(repo.path, "CLAUDE.md"),
          join(repo.path, ".claude", "CLAUDE.md"),
        ];
        for (const cp of claudePaths) {
          if (existsSync(cp)) {
            try {
              const content = readFileSync(cp, "utf-8");
              const s = statSync(cp);
              files.push({
                path: cp,
                project: repo.name,
                size: s.size,
                lines: content.split("\n").length,
              });
            } catch {
              // skip
            }
          }
        }
      }
    } catch {
      // ignore scan errors
    }

    return { files, total: files.length };
  });
}
