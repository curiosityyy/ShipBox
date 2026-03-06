import { describe, it, expect } from "vitest";
import { getDashboardData, getCostCache, getToolCache, getHistory } from "../services/claude-data.js";

describe("claude-data service", () => {
  it("should return dashboard data without errors", () => {
    const data = getDashboardData();
    expect(data).toBeDefined();
    expect(typeof data.totalCost).toBe("number");
    expect(typeof data.sessionCount).toBe("number");
    expect(Array.isArray(data.recentSessions)).toBe(true);
    expect(Array.isArray(data.dailyCosts)).toBe(true);
  });

  it("should parse cost cache if it exists", () => {
    const cache = getCostCache();
    // May be null if file doesn't exist, but should not throw
    if (cache) {
      expect(cache).toHaveProperty("days");
      expect(typeof cache.version).toBe("number");
    }
  });

  it("should parse tool cache if it exists", () => {
    const cache = getToolCache();
    if (cache) {
      expect(typeof cache.totalCalls).toBe("number");
      expect(typeof cache.tools).toBe("object");
    }
  });

  it("should return history as an array", () => {
    const history = getHistory();
    expect(Array.isArray(history)).toBe(true);
    if (history.length > 0) {
      expect(history[0]).toHaveProperty("timestamp");
      expect(history[0]).toHaveProperty("sessionId");
    }
  });

  it("should calculate costs as non-negative", () => {
    const data = getDashboardData();
    expect(data.totalCost).toBeGreaterThanOrEqual(0);
  });
});
