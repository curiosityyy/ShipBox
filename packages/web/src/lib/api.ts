const BASE = "/api";

async function fetcher<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function putJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function postJson<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function patchJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function deleteJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const api = {
  dashboard: () => fetcher<any>("/dashboard"),
  repos: () => fetcher<any>("/repos"),
  settings: () => fetcher<any>("/settings"),
  updateSetting: (key: string, value: unknown) => putJson(`/settings/${key}`, { value }),
  sessions: () => fetcher<any>("/sessions"),
  live: () => fetcher<any>("/live"),
  tools: () => fetcher<any>("/tools"),
  costs: () => fetcher<any>("/costs"),
  transcripts: (q?: string, time?: string) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (time) params.set("time", time);
    const qs = params.toString();
    return fetcher<any>(`/transcripts${qs ? `?${qs}` : ""}`);
  },
  skills: () => fetcher<any>("/skills"),
  agents: () => fetcher<any>("/agents"),
  memory: () => fetcher<any>("/memory"),
  hooks: () => fetcher<any>("/hooks"),
  ports: () => fetcher<any>("/ports"),
  history: () => fetcher<any>("/history"),
  setup: () => fetcher<any>("/setup"),
  workGraph: () => fetcher<any>("/work-graph"),
  timeline: () => fetcher<any>("/timeline"),
  diffs: () => fetcher<any>("/diffs"),
  snapshots: () => fetcher<any>("/snapshots"),
  saveSnapshot: () => postJson<any>("/snapshots/save"),
  hygiene: () => fetcher<any>("/hygiene"),
  deps: () => fetcher<any>("/deps"),
  worktrees: () => fetcher<any>("/worktrees"),
  envFiles: () => fetcher<any>("/env-files"),
  lintClaude: () => fetcher<any>("/lint-claude"),
  chatStream: (message: string, sessionId?: string, model?: string, cwd?: string) => {
    return fetch(`${BASE}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, sessionId, model, cwd }),
    });
  },
  claudeBinary: () => fetcher<any>("/settings/claude-binary"),
  exportData: () => fetcher<any>("/settings/export"),
  assistantSessions: () => fetcher<any>("/assistant/sessions"),
  assistantSessionMessages: (id: string) => fetcher<any>(`/assistant/sessions/${id}/messages`),
  renameAssistantSession: (id: string, title: string) => patchJson<any>(`/assistant/sessions/${id}`, { title }),
  deleteAssistantSession: (id: string) => deleteJson<any>(`/assistant/sessions/${id}`),
};
