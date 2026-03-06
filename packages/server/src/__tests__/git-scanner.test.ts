import { describe, it, expect } from "vitest";
import { scanDirectories } from "../services/git-scanner.js";
import { homedir } from "node:os";
import { join } from "node:path";

describe("git-scanner service", () => {
  it("should return empty array for non-existent directory", async () => {
    const repos = await scanDirectories(["/tmp/nonexistent-dir-12345"]);
    expect(repos).toEqual([]);
  });

  it("should scan project directory and find repos", async () => {
    const projectDir = join(homedir(), "project");
    const repos = await scanDirectories([projectDir]);
    expect(Array.isArray(repos)).toBe(true);
    if (repos.length > 0) {
      const repo = repos[0];
      expect(repo).toHaveProperty("path");
      expect(repo).toHaveProperty("name");
      expect(repo).toHaveProperty("branch");
      expect(repo).toHaveProperty("status");
      expect(["active", "idle", "dormant"]).toContain(repo.status);
    }
  });

  it("should detect repo dirty status", async () => {
    const projectDir = join(homedir(), "project");
    const repos = await scanDirectories([projectDir]);
    for (const repo of repos) {
      expect(typeof repo.dirty).toBe("boolean");
    }
  });
});
