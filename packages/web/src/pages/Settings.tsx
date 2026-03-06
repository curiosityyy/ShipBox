import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { PageHeader } from "../components/PageHeader";
import { useState } from "react";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["settings"], queryFn: api.settings });

  const updateSetting = useMutation({
    mutationFn: ({ key, value }: { key: string; value: unknown }) => api.updateSetting(key, value),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings"] }),
  });

  if (isLoading) return <div className="text-[#64748b]">Loading...</div>;

  const scanDirs: string[] = data?.scan_directories || [];

  return (
    <div className="animate-fade-up">
      <PageHeader title="Settings" />

      {/* Rescan */}
      <div className="glass-card animate-fade-up stagger-1 rounded-xl px-5 py-4 mb-8 flex items-center justify-between">
        <span className="text-sm text-[#e2e8f0]">Rescan Workspace</span>
        <button
          onClick={() => queryClient.invalidateQueries()}
          className="text-sm font-medium text-[#34d399] transition-all duration-200 hover:brightness-125 hover:shadow-[0_0_12px_rgba(52,211,153,0.15)]"
        >
          Refresh all data
        </button>
      </div>

      {/* Scan Directories */}
      <div className="mb-8 animate-fade-up stagger-2">
        <h2 className="text-xs uppercase tracking-[0.2em] text-[#64748b] mb-3">
          Scan Directories
        </h2>
        <div className="glass-card rounded-xl p-5">
          <div className="space-y-2">
            {scanDirs.map((dir, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-[#0f1219] rounded-lg px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-sm bg-[#34d399]/30" />
                  <span className="font-mono text-sm text-[#e2e8f0]">{dir}</span>
                </div>
                <button
                  onClick={() => {
                    const newDirs = scanDirs.filter((_, j) => j !== i);
                    updateSetting.mutate({ key: "scan_directories", value: newDirs });
                  }}
                  className="text-xs text-[#f87171] hover:opacity-70 transition-opacity font-mono"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <AddDirectoryButton
            onAdd={(dir) => {
              updateSetting.mutate({ key: "scan_directories", value: [...scanDirs, dir] });
            }}
          />
          <p className="text-xs text-[#475569] mt-3 font-mono">
            Scans up to 2 levels deep for git repos.
          </p>
        </div>
      </div>

      {/* General */}
      <div className="mb-8 animate-fade-up stagger-3">
        <h2 className="text-xs uppercase tracking-[0.2em] text-[#64748b] mb-3">
          General
        </h2>
        <div className="glass-card rounded-xl p-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-[#0f1219] rounded-lg px-4 py-3">
              <span className="text-sm text-[#e2e8f0]">Server Port</span>
              <span className="font-mono text-sm text-[#64748b]">3141</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 text-center animate-fade-up stagger-4">
        <span className="font-mono text-[10px] text-[#475569] tracking-wider uppercase">
          ShipBox v0.1.0 -- A web-based Claude Code dashboard
        </span>
      </div>
    </div>
  );
}

function AddDirectoryButton({ onAdd }: { onAdd: (dir: string) => void }) {
  const [adding, setAdding] = useState(false);
  const [value, setValue] = useState("");

  if (!adding) {
    return (
      <button
        onClick={() => setAdding(true)}
        className="mt-3 text-sm text-[#34d399] font-medium hover:underline transition-all"
      >
        + Add Directory
      </button>
    );
  }

  return (
    <div className="mt-3 flex gap-2">
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
        className="flex-1 bg-[#0f1219] border border-[#1e293b] rounded-lg px-3 py-2 text-sm font-mono text-[#e2e8f0] outline-none transition-colors duration-200 focus:border-[#34d399] placeholder:text-[#475569]"
      />
      <button
        onClick={() => {
          if (value.trim()) {
            onAdd(value.trim());
            setValue("");
          }
          setAdding(false);
        }}
        className="text-sm px-4 py-2 bg-[#34d399] text-[#08090d] font-semibold rounded-lg hover:brightness-110 transition-all"
      >
        Add
      </button>
    </div>
  );
}
