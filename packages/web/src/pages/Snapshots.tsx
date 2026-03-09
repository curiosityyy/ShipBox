import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { PageHeader } from "../components/PageHeader";
import { StatCard } from "../components/StatCard";
import { EmptyState } from "../components/EmptyState";
import { Camera, GitBranch, Save } from "lucide-react";
import { clsx } from "clsx";
import { PageSkeleton } from "../components/PageSkeleton";

export default function Snapshots() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["snapshots"], queryFn: api.snapshots });

  const saveMutation = useMutation({
    mutationFn: api.saveSnapshot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["snapshots"] });
    },
  });

  if (isLoading) return <PageSkeleton cards={3} />;
  if (!data) return null;

  const snapshots = data.snapshots || [];
  const branches = [...new Set(snapshots.map((s: any) => s.branch))] as string[];
  const dirtyCount = snapshots.filter((s: any) => s.dirty).length;

  return (
    <div className="space-y-8">
      <div className="animate-fade-up flex items-center justify-between">
        <PageHeader title="Snapshots" count={snapshots.length} />
        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className={clsx(
            "flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-xs font-semibold transition-all duration-200",
            saveMutation.isPending
              ? "bg-[#1c2333] text-[#475569] cursor-wait"
              : "bg-[#34d399]/10 text-[#34d399] hover:bg-[#34d399]/20"
          )}
        >
          <Save size={14} />
          {saveMutation.isPending ? "Saving..." : "Save Snapshot"}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="animate-fade-up stagger-1">
          <StatCard value={snapshots.length} label="Repos" color="blue" />
        </div>
        <div className="animate-fade-up stagger-2">
          <StatCard value={branches.length} label="Branches" color="green" />
        </div>
        <div className="animate-fade-up stagger-3">
          <StatCard value={dirtyCount} label="Dirty" color="yellow" />
        </div>
      </div>

      {saveMutation.isSuccess && (
        <div className="animate-fade-up glass-card rounded-xl px-4 py-3 border border-[#34d399]/20">
          <span className="text-sm text-[#34d399]">
            Snapshot saved for {saveMutation.data?.total || 0} repos.
          </span>
        </div>
      )}

      {snapshots.length === 0 ? (
        <EmptyState
          icon={<Camera size={48} />}
          title="No repos found"
          description="Add scan directories in Settings to save and restore git snapshots."
        />
      ) : (
        <div className="space-y-3">
          {snapshots.map((snap: any, index: number) => (
            <div
              key={snap.path}
              className={`glass-card animate-fade-up stagger-${Math.min(index + 4, 8)} rounded-xl px-5 py-4 flex items-center justify-between hover:border-[#34d399]/30 transition-colors duration-200`}
            >
              <div>
                <div className="flex items-center gap-2.5">
                  <GitBranch size={14} className="text-[#64748b]" />
                  <span className="font-semibold text-base text-[#e2e8f0]">
                    {snap.repo}
                  </span>
                  <span className="font-mono text-xs text-[#64748b]">({snap.branch})</span>
                  {snap.dirty && (
                    <span className="font-mono text-[10px] uppercase tracking-wider rounded-md px-2 py-0.5 bg-[rgba(251,191,36,0.15)] text-[#fbbf24]">
                      dirty
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1.5 ml-[23px]">
                  <span className="font-mono text-[11px] text-[#475569]">{snap.hash.slice(0, 7)}</span>
                  {snap.lastCommit && (
                    <span className="text-xs text-[#64748b]">
                      {new Date(snap.lastCommit).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={clsx(
                    "w-2 h-2 rounded-full",
                    snap.dirty
                      ? "bg-[#fbbf24] shadow-[0_0_6px_rgba(251,191,36,0.4)]"
                      : "bg-[#34d399] shadow-[0_0_6px_rgba(52,211,153,0.4)]"
                  )}
                />
                <span className="font-mono text-xs text-[#64748b]">
                  {snap.dirty ? "uncommitted" : "clean"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
