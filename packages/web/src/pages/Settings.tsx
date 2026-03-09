import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { PageHeader } from "../components/PageHeader";
import { useState, useEffect, useCallback, useRef } from "react";
import { PageSkeleton } from "../components/PageSkeleton";
import {
  RefreshCw, FolderOpen, Bot, Settings2, MonitorCog, PanelLeft,
  DollarSign, Download, Terminal, Sparkles,
} from "lucide-react";

// ── Toggle Switch ──
function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      className={`relative w-10 h-[22px] rounded-full transition-colors duration-200 ${
        checked ? "bg-[#60a5fa]" : "bg-[#475569]"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className={`absolute top-[3px] w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
          checked ? "left-[22px]" : "left-[3px]"
        }`}
      />
    </button>
  );
}

// ── Section Header ──
function SectionHeader({ icon: Icon, label }: { icon: React.ComponentType<any>; label: string }) {
  return (
    <h2 className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#64748b] mb-3">
      <Icon size={14} strokeWidth={1.5} />
      {label}
    </h2>
  );
}

// ── Debounced number input hook ──
function useDebouncedSave(key: string, initial: number, updateSetting: any, delay = 600) {
  const [value, setValue] = useState(initial);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setValue(initial); }, [initial]);

  const onChange = useCallback((v: number) => {
    setValue(v);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      updateSetting.mutate({ key, value: v });
    }, delay);
  }, [key, delay, updateSetting]);

  return [value, onChange] as const;
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["settings"], queryFn: api.settings });
  const { data: binaryData } = useQuery({ queryKey: ["claude-binary"], queryFn: api.claudeBinary });

  const updateSetting = useMutation({
    mutationFn: ({ key, value }: { key: string; value: unknown }) => api.updateSetting(key, value),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings"] }),
  });

  if (isLoading) return <PageSkeleton cards={0} />;

  const scanDirs: string[] = data?.scan_directories || [];
  const defaultModel: string = data?.default_model || "sonnet";
  const autoRefreshEnabled: boolean = data?.auto_refresh_enabled ?? true;
  const autoRefreshInterval: number = data?.auto_refresh_interval ?? 30;
  const dailyBudget: number = data?.daily_budget_limit ?? 0;
  const monthlyBudget: number = data?.monthly_budget_limit ?? 0;
  const alertThreshold: number = data?.alert_threshold ?? 80;
  const sidebarVisibility: Record<string, boolean> = data?.sidebar_visibility || {};
  const agentsEnabled: Record<string, boolean> = data?.agents_enabled || { claude_code: true };

  return (
    <div className="animate-fade-up">
      <PageHeader title="Settings" />

      {/* Rescan */}
      <div className="glass-card animate-fade-up stagger-1 rounded-xl px-5 py-4 mb-8 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <RefreshCw size={14} className="text-[#64748b]" />
          <span className="text-sm text-[#e2e8f0]">Rescan Workspace</span>
        </div>
        <button
          onClick={() => queryClient.invalidateQueries()}
          className="text-sm font-medium text-[#64748b] hover:text-[#e2e8f0] transition-colors"
        >
          Refresh all data
        </button>
      </div>

      {/* Scan Directories */}
      <div className="mb-8 animate-fade-up stagger-2">
        <SectionHeader icon={FolderOpen} label="Scan Directories" />
        <div className="glass-card rounded-xl p-5">
          <div className="space-y-2">
            {scanDirs.map((dir, i) => (
              <div key={i} className="flex items-center justify-between bg-[#0f1219] rounded-lg px-4 py-3">
                <div className="flex items-center gap-3">
                  <FolderOpen size={14} className="text-[#64748b]" />
                  <span className="font-mono text-sm text-[#e2e8f0]">
                    {dir.replace(/^\/Users\/[^/]+/, "~")}
                  </span>
                </div>
                <span className="w-2 h-2 rounded-full bg-[#34d399]/40" />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-3">
            <AddDirectoryButton
              onAdd={(dir) => {
                updateSetting.mutate({ key: "scan_directories", value: [...scanDirs, dir] });
              }}
            />
            <button
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ["repos"] });
              }}
              className="text-sm text-[#64748b] hover:text-[#e2e8f0] transition-colors"
            >
              Scan for New
            </button>
          </div>
          <p className="text-xs text-[#475569] mt-3">
            Scans up to 2 levels deep for git repos.
          </p>
        </div>
      </div>

      {/* ShipBox Assistant */}
      <div className="mb-8 animate-fade-up stagger-3">
        <SectionHeader icon={Bot} label="ShipBox Assistant" />
        <div className="glass-card rounded-xl p-5 space-y-4">
          {/* Claude Binary Detection */}
          <div className="flex items-center justify-between bg-[#0f1219] rounded-lg px-4 py-3">
            <div className="flex items-center gap-3">
              <Sparkles size={14} className="text-[#60a5fa]" />
              <div>
                <div className="text-sm text-[#e2e8f0] font-medium">Claude Code</div>
                <div className="text-xs text-[#475569] font-mono">
                  {binaryData?.found ? binaryData.path : "Not found"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {binaryData?.version && (
                <span className="text-xs text-[#475569] font-mono">{binaryData.version}</span>
              )}
              <span className={`w-2 h-2 rounded-full ${binaryData?.found ? "bg-[#34d399]" : "bg-[#f87171]"}`} />
            </div>
          </div>

          {/* Default Model */}
          <div className="px-1">
            <div className="text-xs text-[#64748b] mb-2">Model</div>
            <div className="flex gap-1">
              {(["haiku", "sonnet", "opus"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => updateSetting.mutate({ key: "default_model", value: m })}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                    defaultModel === m
                      ? "bg-[#60a5fa] text-[#0f1219]"
                      : "text-[#8b949e] hover:text-[#e2e8f0] hover:bg-[#1e2433]"
                  }`}
                >
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <p className="text-xs text-[#475569] px-1">
            ShipBox Assistant uses Claude Code CLI to chat with your dev environment.
            Tool use, file editing, and context are fully preserved.
          </p>
        </div>
      </div>

      {/* General */}
      <div className="mb-8 animate-fade-up stagger-4">
        <SectionHeader icon={Settings2} label="General" />
        <div className="glass-card rounded-xl p-5 space-y-2">
          {/* Auto-Refresh */}
          <div className="flex items-center justify-between bg-[#0f1219] rounded-lg px-4 py-3">
            <span className="text-sm text-[#e2e8f0]">Auto-refresh data</span>
            <Toggle
              checked={autoRefreshEnabled}
              onChange={(v) => updateSetting.mutate({ key: "auto_refresh_enabled", value: v })}
            />
          </div>

          {autoRefreshEnabled && (
            <div className="flex items-center justify-between bg-[#0f1219] rounded-lg px-4 py-3">
              <span className="text-sm text-[#e2e8f0]">Refresh interval</span>
              <div className="flex items-center gap-2">
                <IntervalInput
                  value={autoRefreshInterval}
                  updateSetting={updateSetting}
                />
                <span className="text-xs text-[#475569]">seconds</span>
              </div>
            </div>
          )}

          {/* Server Port */}
          <div className="flex items-center justify-between bg-[#0f1219] rounded-lg px-4 py-3">
            <span className="text-sm text-[#e2e8f0]">Server Port</span>
            <span className="font-mono text-sm text-[#64748b]">3141</span>
          </div>

          {/* Export */}
          <div className="flex items-center gap-4 pt-2 px-1">
            <button
              onClick={async () => {
                const data = await api.exportData();
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `shipbox-export-${new Date().toISOString().slice(0, 10)}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="flex items-center gap-1.5 text-sm text-[#64748b] hover:text-[#e2e8f0] transition-colors"
            >
              <Download size={13} />
              Export Data
            </button>
          </div>
        </div>
      </div>

      {/* Agents */}
      <div className="mb-8 animate-fade-up stagger-5">
        <SectionHeader icon={MonitorCog} label="Agents" />
        <div className="glass-card rounded-xl p-5 space-y-2">
          {/* Claude Code */}
          <div className="flex items-center justify-between bg-[#0f1219] rounded-lg px-4 py-3">
            <div className="flex items-center gap-3">
              <Sparkles size={14} className="text-[#60a5fa]" />
              <div>
                <div className="text-sm text-[#e2e8f0] font-medium">Claude Code</div>
                <div className="text-xs text-[#475569] font-mono">~/.claude</div>
              </div>
            </div>
            <Toggle
              checked={agentsEnabled.claude_code ?? true}
              onChange={(v) =>
                updateSetting.mutate({ key: "agents_enabled", value: { ...agentsEnabled, claude_code: v } })
              }
            />
          </div>

          {/* Codex */}
          <div className="flex items-center justify-between bg-[#0f1219] rounded-lg px-4 py-3 opacity-50">
            <div className="flex items-center gap-3">
              <Terminal size={14} className="text-[#475569]" />
              <div>
                <div className="text-sm text-[#8b949e]">Codex</div>
                <div className="text-xs text-[#475569]">Not installed</div>
              </div>
            </div>
            <Toggle checked={false} onChange={() => {}} disabled />
          </div>

          <p className="text-xs text-[#475569] px-1 pt-1">
            Enable or disable data sources. Disabled agents won't appear in sessions, costs, or the dashboard.
          </p>
        </div>
      </div>

      {/* Sidebar */}
      <div className="mb-8 animate-fade-up stagger-6">
        <SectionHeader icon={PanelLeft} label="Sidebar" />
        <SidebarCustomizer
          sidebarVisibility={sidebarVisibility}
          updateSetting={updateSetting}
        />
      </div>

      {/* Cost Budget */}
      <div className="mb-8 animate-fade-up stagger-7">
        <SectionHeader icon={DollarSign} label="Cost Budget" />
        <div className="glass-card rounded-xl p-5 space-y-4">
          <BudgetInputs
            dailyBudget={dailyBudget}
            monthlyBudget={monthlyBudget}
            alertThreshold={alertThreshold}
            updateSetting={updateSetting}
          />
          <p className="text-xs text-[#475569] px-1">
            Set to $0 to disable budget tracking.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 mb-6 text-center animate-fade-up">
        <span className="font-mono text-[10px] text-[#475569] tracking-wider uppercase">
          ShipBox v0.1.0 -- A web-based Claude Code dashboard
        </span>
      </div>
    </div>
  );
}

// ── Add Directory Button ──
function AddDirectoryButton({ onAdd }: { onAdd: (dir: string) => void }) {
  const [adding, setAdding] = useState(false);
  const [value, setValue] = useState("");

  if (!adding) {
    return (
      <button
        onClick={() => setAdding(true)}
        className="text-sm text-[#64748b] hover:text-[#e2e8f0] transition-colors flex items-center gap-1"
      >
        <span className="text-[#60a5fa]">+</span> Add Directory
      </button>
    );
  }

  return (
    <div className="flex gap-2 flex-1">
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && value.trim()) {
            onAdd(value.trim());
            setValue("");
            setAdding(false);
          }
          if (e.key === "Escape") setAdding(false);
        }}
        placeholder="/path/to/directory"
        className="flex-1 bg-[#0f1219] border border-[#1e293b] rounded-lg px-3 py-2 text-sm font-mono text-[#e2e8f0] outline-none transition-colors duration-200 focus:border-[#60a5fa] placeholder:text-[#475569]"
      />
      <button
        onClick={() => {
          if (value.trim()) {
            onAdd(value.trim());
            setValue("");
          }
          setAdding(false);
        }}
        className="text-sm px-4 py-2 bg-[#60a5fa] text-[#0f1219] font-semibold rounded-lg hover:brightness-110 transition-all"
      >
        Add
      </button>
    </div>
  );
}

// ── Interval Input (debounced) ──
function IntervalInput({ value: initial, updateSetting }: { value: number; updateSetting: any }) {
  const [val, setVal] = useDebouncedSave("auto_refresh_interval", initial, updateSetting);
  return (
    <input
      type="number"
      min={5}
      max={300}
      value={val}
      onChange={(e) => setVal(Math.max(5, Math.min(300, Number(e.target.value))))}
      className="w-16 bg-[#161b22] border border-[#1e293b] rounded-md px-2 py-1 text-sm font-mono text-[#e2e8f0] text-center outline-none focus:border-[#60a5fa] transition-colors"
    />
  );
}

// ── Budget Inputs ──
function BudgetInputs({
  dailyBudget, monthlyBudget, alertThreshold, updateSetting,
}: {
  dailyBudget: number; monthlyBudget: number; alertThreshold: number; updateSetting: any;
}) {
  const [daily, setDaily] = useDebouncedSave("daily_budget_limit", dailyBudget, updateSetting);
  const [monthly, setMonthly] = useDebouncedSave("monthly_budget_limit", monthlyBudget, updateSetting);
  const [alert, setAlert] = useDebouncedSave("alert_threshold", alertThreshold, updateSetting);

  return (
    <>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#e2e8f0]">Daily</span>
          <div className="flex items-center gap-1">
            <span className="text-sm text-[#64748b]">$</span>
            <input
              type="number"
              min={0}
              step={1}
              value={daily}
              onChange={(e) => setDaily(Math.max(0, Number(e.target.value)))}
              className="w-20 bg-[#0f1219] border border-[#1e293b] rounded-md px-2 py-1.5 text-sm font-mono text-[#e2e8f0] outline-none focus:border-[#60a5fa] transition-colors"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#e2e8f0]">Monthly</span>
          <div className="flex items-center gap-1">
            <span className="text-sm text-[#64748b]">$</span>
            <input
              type="number"
              min={0}
              step={1}
              value={monthly}
              onChange={(e) => setMonthly(Math.max(0, Number(e.target.value)))}
              className="w-20 bg-[#0f1219] border border-[#1e293b] rounded-md px-2 py-1.5 text-sm font-mono text-[#e2e8f0] outline-none focus:border-[#60a5fa] transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 px-1">
        <span className="text-sm text-[#e2e8f0]">Alert at</span>
        <span className="text-sm font-medium text-[#60a5fa] w-10 text-right">{alert}%</span>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={alert}
          onChange={(e) => setAlert(Number(e.target.value))}
          className="flex-1 h-1 accent-[#60a5fa] bg-[#1e293b] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer"
        />
      </div>
    </>
  );
}

// ── Sidebar Customizer ──
const SIDEBAR_ITEMS = [
  { to: "/", label: "ShipBox" },
  { to: "/assistant", label: "Assistant" },
  { to: "/live", label: "Live" },
  { to: "/sessions", label: "Sessions" },
  { to: "/transcripts", label: "Transcripts" },
  { to: "/tools", label: "Tools" },
  { to: "/costs", label: "Costs" },
  { to: "/setup", label: "Setup" },
  { to: "/ports", label: "Ports" },
  { to: "/repos", label: "Repos" },
  { to: "/work-graph", label: "Work Graph" },
  { to: "/repo-pulse", label: "Repo Pulse" },
  { to: "/timeline", label: "Timeline" },
  { to: "/diffs", label: "Diffs" },
  { to: "/snapshots", label: "Snapshots" },
  { to: "/skills", label: "Skills" },
  { to: "/agents", label: "Agents" },
  { to: "/memory", label: "Memory" },
  { to: "/hooks", label: "Hooks" },
  { to: "/hygiene", label: "Hygiene" },
  { to: "/deps", label: "Deps" },
  { to: "/worktrees", label: "Worktrees" },
  { to: "/env", label: "Env" },
  { to: "/lint", label: "Lint" },
];

function SidebarCustomizer({
  sidebarVisibility,
  updateSetting,
}: {
  sidebarVisibility: Record<string, boolean>;
  updateSetting: any;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="glass-card rounded-xl p-5">
      <p className="text-xs text-[#475569] mb-3">Show or hide sidebar items.</p>
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => setEditing(!editing)}
          className="flex items-center gap-1.5 text-sm text-[#64748b] hover:text-[#e2e8f0] transition-colors"
        >
          <PanelLeft size={13} />
          {editing ? "Done" : "Customize Sidebar"}
        </button>
        {Object.keys(sidebarVisibility).length > 0 && (
          <button
            onClick={() => updateSetting.mutate({ key: "sidebar_visibility", value: {} })}
            className="text-sm text-[#64748b] hover:text-[#e2e8f0] transition-colors"
          >
            Reset to Default
          </button>
        )}
      </div>

      {editing && (
        <div className="grid grid-cols-2 gap-1.5">
          {SIDEBAR_ITEMS.map((item) => {
            const visible = sidebarVisibility[item.to] !== false;
            return (
              <button
                key={item.to}
                onClick={() => {
                  const next = { ...sidebarVisibility };
                  if (visible) {
                    next[item.to] = false;
                  } else {
                    delete next[item.to];
                  }
                  updateSetting.mutate({ key: "sidebar_visibility", value: next });
                }}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${
                  visible
                    ? "bg-[#0f1219] text-[#e2e8f0]"
                    : "bg-[#0f1219]/50 text-[#475569] line-through"
                }`}
              >
                <span>{item.label}</span>
                <span className={`w-2 h-2 rounded-full ${visible ? "bg-[#60a5fa]" : "bg-[#475569]/40"}`} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
