import type { FastifyInstance } from "fastify";
import { scanDirectories } from "../services/git-scanner.js";
import { db } from "../db/index.js";
import { settings, snapshots } from "../db/schema.js";
import { eq } from "drizzle-orm";
import simpleGit from "simple-git";
import { basename } from "node:path";

function getScanDirs(): string[] {
  const row = db.select().from(settings).where(eq(settings.key, "scan_directories")).get();
  return row ? JSON.parse(row.value!) : [];
}

export async function workspaceRoutes(app: FastifyInstance) {
  // GET /api/work-graph - repo activity data
  app.get("/api/work-graph", async () => {
    const scanDirs = getScanDirs();
    const repos = await scanDirectories(scanDirs);

    const stats = {
      active: repos.filter((r) => r.status === "active").length,
      idle: repos.filter((r) => r.status === "idle").length,
      dormant: repos.filter((r) => r.status === "dormant").length,
      totalCommits: repos.reduce((sum, r) => sum + r.commitsToday, 0),
    };

    return { repos, stats };
  });

  // GET /api/timeline - git commit timeline across all repos
  app.get("/api/timeline", async () => {
    const scanDirs = getScanDirs();
    const repos = await scanDirectories(scanDirs);

    const commits: Array<{
      repo: string;
      message: string;
      hash: string;
      date: string;
      author: string;
    }> = [];

    for (const repo of repos) {
      try {
        const git = simpleGit(repo.path);
        const log = await git.log({ maxCount: 20 });
        for (const entry of log.all) {
          commits.push({
            repo: repo.name,
            message: entry.message,
            hash: entry.hash,
            date: entry.date,
            author: entry.author_name,
          });
        }
      } catch {
        // skip repos that fail
      }
    }

    // Sort by date descending
    commits.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return { commits: commits.slice(0, 100), total: commits.length };
  });

  // GET /api/diffs - recent file changes from git
  app.get("/api/diffs", async () => {
    const scanDirs = getScanDirs();
    const repos = await scanDirectories(scanDirs);

    const diffs: Array<{
      repo: string;
      file: string;
      additions: number;
      deletions: number;
      date: string;
    }> = [];

    for (const repo of repos) {
      try {
        const git = simpleGit(repo.path);
        const diffSummary = await git.diffSummary(["HEAD~5", "HEAD"]).catch(() => null);
        if (diffSummary) {
          const log = await git.log({ maxCount: 1 });
          const date = log.latest?.date || new Date().toISOString();
          for (const file of diffSummary.files) {
            const ins = "insertions" in file ? file.insertions : 0;
            const del = "deletions" in file ? file.deletions : 0;
            diffs.push({
              repo: repo.name,
              file: file.file,
              additions: ins,
              deletions: del,
              date,
            });
          }
        }
      } catch {
        // skip repos that fail
      }
    }

    return { diffs, total: diffs.length };
  });

  // GET /api/snapshots - list current branch states
  app.get("/api/snapshots", async () => {
    const scanDirs = getScanDirs();
    const repos = await scanDirectories(scanDirs);

    const snapshotList: Array<{
      repo: string;
      path: string;
      branch: string;
      hash: string;
      dirty: boolean;
      lastCommit: string;
    }> = [];

    for (const repo of repos) {
      try {
        const git = simpleGit(repo.path);
        const log = await git.log({ maxCount: 1 });
        snapshotList.push({
          repo: repo.name,
          path: repo.path,
          branch: repo.branch,
          hash: log.latest?.hash || "unknown",
          dirty: repo.dirty,
          lastCommit: log.latest?.date || "",
        });
      } catch {
        // skip
      }
    }

    return { snapshots: snapshotList, total: snapshotList.length };
  });

  // POST /api/snapshots/save - save a snapshot (stash + metadata)
  app.post("/api/snapshots/save", async () => {
    const scanDirs = getScanDirs();
    const repos = await scanDirectories(scanDirs);
    const saved: string[] = [];

    for (const repo of repos) {
      try {
        const git = simpleGit(repo.path);
        const log = await git.log({ maxCount: 1 });
        const hash = log.latest?.hash || "unknown";

        // Stash if dirty
        if (repo.dirty) {
          await git.stash(["push", "-m", `ShipBox snapshot ${new Date().toISOString()}`]);
        }

        // Save metadata to DB
        db.insert(snapshots)
          .values({
            repoPath: repo.path,
            branch: repo.branch,
            commitHash: hash,
            createdAt: Date.now(),
            label: `${basename(repo.path)}/${repo.branch}@${hash.slice(0, 7)}`,
          })
          .run();

        saved.push(repo.name);
      } catch {
        // skip
      }
    }

    return { ok: true, saved, total: saved.length };
  });
}
