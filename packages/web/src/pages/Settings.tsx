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

  if (isLoading) return <div className="text-[#8b949e]">Loading...</div>;

  const scanDirs: string[] = data?.scan_directories || [];

  return (
    <div>
      <PageHeader title="Settings" />

      {/* Rescan */}
      <div className="bg-[#1c2333] rounded-lg p-4 border border-[#30363d] mb-6 flex items-center justify-between">
        <span className="text-sm">Rescan Workspace</span>
        <button
          onClick={() => queryClient.invalidateQueries()}
          className="text-sm text-[#8b949e] hover:text-[#e6edf3] transition-colors"
        >
          Refresh all data
        </button>
      </div>

      {/* Scan Directories */}
      <Section title="Scan Directories">
        <div className="space-y-2">
          {scanDirs.map((dir, i) => (
            <div key={i} className="flex items-center justify-between bg-[#0f1117] rounded-md px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">📁</span>
                <span className="text-sm font-mono">{dir}</span>
              </div>
              <button
                onClick={() => {
                  const newDirs = scanDirs.filter((_, j) => j !== i);
                  updateSetting.mutate({ key: "scan_directories", value: newDirs });
                }}
                className="text-xs text-[#f85149] hover:text-[#ff7b72]"
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
        <p className="text-xs text-[#8b949e] mt-2">Scans up to 2 levels deep for git repos.</p>
      </Section>

      {/* General */}
      <Section title="General">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Server Port</span>
            <span className="text-sm font-mono text-[#8b949e]">3141</span>
          </div>
        </div>
      </Section>

      {/* Footer */}
      <div className="mt-8 text-center text-xs text-[#8b949e]">
        ShipBox v0.1.0 · A web-based Claude Code dashboard
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold text-[#8b949e] mb-3 flex items-center gap-2">
        {title}
      </h2>
      <div className="bg-[#1c2333] rounded-lg p-4 border border-[#30363d]">{children}</div>
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
        className="mt-2 text-sm text-[#2f81f7] hover:text-[#58a6ff]"
      >
        + Add Directory
      </button>
    );
  }

  return (
    <div className="mt-2 flex gap-2">
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
        className="flex-1 bg-[#0f1117] border border-[#30363d] rounded-md px-3 py-1.5 text-sm outline-none focus:border-[#2f81f7]"
      />
      <button
        onClick={() => {
          if (value.trim()) {
            onAdd(value.trim());
            setValue("");
          }
          setAdding(false);
        }}
        className="text-sm px-3 py-1.5 bg-[#2f81f7] rounded-md hover:bg-[#388bfd]"
      >
        Add
      </button>
    </div>
  );
}
