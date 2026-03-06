import { readdirSync, statSync, existsSync } from "node:fs";
import { join, basename } from "node:path";
import simpleGit from "simple-git";

export interface RepoInfo {
  path: string;
  name: string;
  branch: string;
  lastCommitAt: number;
  dirty: boolean;
  status: "active" | "idle" | "dormant";
  commitsToday: number;
}

export async function scanDirectories(dirs: string[]): Promise<RepoInfo[]> {
  const repos: RepoInfo[] = [];

  for (const dir of dirs) {
    if (!existsSync(dir)) continue;
    await scanDir(dir, 0, 2, repos);
  }

  return repos;
}

async function scanDir(dir: string, depth: number, maxDepth: number, repos: RepoInfo[]) {
  if (depth > maxDepth) return;

  // Check if this directory is a git repo
  const gitDir = join(dir, ".git");
  if (existsSync(gitDir)) {
    try {
      const info = await getRepoInfo(dir);
      if (info) repos.push(info);
    } catch {
      // skip repos that can't be read
    }
    return; // Don't recurse into git repos
  }

  // Recurse into subdirectories
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      if (entry.startsWith(".")) continue;
      const fullPath = join(dir, entry);
      try {
        if (statSync(fullPath).isDirectory()) {
          await scanDir(fullPath, depth + 1, maxDepth, repos);
        }
      } catch {
        // skip inaccessible dirs
      }
    }
  } catch {
    // skip unreadable dirs
  }
}

async function getRepoInfo(repoPath: string): Promise<RepoInfo | null> {
  const git = simpleGit(repoPath);

  try {
    const [branchResult, statusResult, logResult] = await Promise.all([
      git.branch(),
      git.status(),
      git.log({ maxCount: 1 }).catch(() => null),
    ]);

    const lastCommitDate = logResult?.latest?.date ? new Date(logResult.latest.date).getTime() : 0;
    const now = Date.now();
    const daysSinceCommit = (now - lastCommitDate) / (1000 * 60 * 60 * 24);

    let status: "active" | "idle" | "dormant" = "dormant";
    if (daysSinceCommit < 1) status = "active";
    else if (daysSinceCommit < 7) status = "idle";

    // Count today's commits
    const today = new Date().toISOString().split("T")[0];
    let commitsToday = 0;
    try {
      const todayLog = await git.log({ "--since": today });
      commitsToday = todayLog.total;
    } catch {
      // ignore
    }

    return {
      path: repoPath,
      name: basename(repoPath),
      branch: branchResult.current,
      lastCommitAt: lastCommitDate,
      dirty: !statusResult.isClean(),
      status,
      commitsToday,
    };
  } catch {
    return null;
  }
}
