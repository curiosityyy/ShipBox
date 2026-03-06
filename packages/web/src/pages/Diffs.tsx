import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { PageHeader } from "../components/PageHeader";
import { StatCard } from "../components/StatCard";
import { EmptyState } from "../components/EmptyState";
import { GitCompare } from "lucide-react";

export default function Diffs() {
  const { data, isLoading } = useQuery({ queryKey: ["diffs"], queryFn: api.diffs });

  if (isLoading) return <div className="text-[#64748b]">Loading...</div>;
  if (!data) return null;

  const diffs = data.diffs || [];
  const repos = [...new Set(diffs.map((d: any) => d.repo))] as string[];
  const totalAdditions = diffs.reduce((sum: number, d: any) => sum + (d.additions || 0), 0);
  const totalDeletions = diffs.reduce((sum: number, d: any) => sum + (d.deletions || 0), 0);

  // Group diffs by repo
  const grouped: Record<string, any[]> = {};
  for (const diff of diffs) {
    if (!grouped[diff.repo]) grouped[diff.repo] = [];
    grouped[diff.repo].push(diff);
  }

  return (
    <div className="space-y-8">
      <div className="animate-fade-up">
        <PageHeader title="Diffs" count={data.total} />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="animate-fade-up stagger-1">
          <StatCard value={diffs.length} label="Files Changed" color="blue" />
        </div>
        <div className="animate-fade-up stagger-2">
          <StatCard value={repos.length} label="Repos" color="green" />
        </div>
        <div className="animate-fade-up stagger-3">
          <StatCard value={totalAdditions} label="Additions" color="green" />
        </div>
        <div className="animate-fade-up stagger-4">
          <StatCard value={totalDeletions} label="Deletions" color="red" />
        </div>
      </div>

      {diffs.length === 0 ? (
        <EmptyState
          icon={<GitCompare size={48} />}
          title="No diffs found"
          description="No recent file changes detected across your repos."
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([repo, files], groupIndex) => (
            <section
              key={repo}
              className={`glass-card rounded-2xl p-5 animate-fade-up stagger-${Math.min(groupIndex + 5, 8)}`}
            >
              <h2 className="font-display text-sm font-semibold text-[#e2e8f0] mb-4 flex items-center gap-2">
                <GitCompare size={14} className="text-[#64748b]" />
                {repo}
                <span className="text-[#64748b] font-normal">{files.length} files</span>
              </h2>
              <div className="space-y-1.5">
                {files.map((diff: any, i: number) => (
                  <div
                    key={`${diff.file}-${i}`}
                    className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-[#1c2333] transition-colors duration-200"
                  >
                    <span className="font-mono text-xs text-[#64748b] truncate flex-1 mr-4">
                      {diff.file}
                    </span>
                    <div className="flex items-center gap-3 shrink-0">
                      {diff.additions > 0 && (
                        <span className="font-mono text-xs text-[#34d399]">+{diff.additions}</span>
                      )}
                      {diff.deletions > 0 && (
                        <span className="font-mono text-xs text-[#f87171]">-{diff.deletions}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
