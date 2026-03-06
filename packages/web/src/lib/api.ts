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

export const api = {
  dashboard: () => fetcher<any>("/dashboard"),
  repos: () => fetcher<any>("/repos"),
  settings: () => fetcher<any>("/settings"),
  updateSetting: (key: string, value: unknown) => putJson(`/settings/${key}`, { value }),
  sessions: () => fetcher<any>("/sessions"),
  live: () => fetcher<any>("/live"),
  tools: () => fetcher<any>("/tools"),
  costs: () => fetcher<any>("/costs"),
  skills: () => fetcher<any>("/skills"),
  agents: () => fetcher<any>("/agents"),
  memory: () => fetcher<any>("/memory"),
  hooks: () => fetcher<any>("/hooks"),
  ports: () => fetcher<any>("/ports"),
  history: () => fetcher<any>("/history"),
};
