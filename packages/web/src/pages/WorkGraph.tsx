import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { PageHeader } from "../components/PageHeader";
import { StatCard } from "../components/StatCard";
import { EmptyState } from "../components/EmptyState";
import { BarChart3 } from "lucide-react";
import { clsx } from "clsx";

const statusDot: Record<string, string> = {
  active: "bg-[#34d399] shadow-[0_0_6px_rgba(52,211,153,0.4)]",
  idle: "bg-[#fbbf24] shadow-[0_0_6px_rgba(251,191,36,0.4)]",
  dormant: "bg-[#475569]",
};

const statusText: Record<string, string> = {
  active: "text-[#34d399]",
  idle: "text-[#fbbf24]",
  dormant: "text-[#475569]",
};

export default function WorkGraph() {
  const { data, isLoading } = useQuery({ queryKey: ["work-graph"], queryFn: api.workGraph });

  if (isLoading) return <div className="text-[#64748b]">Loading...</div>;
  if (!data) return null;

  const repos = data.repos || [];
  const stats = data.stats || { active: 0, idle: 0, dormant: 0, totalCommits: 0 };

  const grouped: Record<string, any[]> = { active: [], idle: [], dormant: [] };
  for (const repo of repos) {
    const s = repo.status as string;
    if (grouped[s]) grouped[s].push(repo);
    else grouped.dormant.push(repo);
  }

  return (
    <div className="space-y-8">
      <div className="animate-fade-up">
        <PageHeader title="Work Graph" count={repos.length} />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="animate-fade-up stagger-1">
          <StatCard value={stats.active} label="Active" color="green" />
        </div>
        <div className="animate-fade-up stagger-2">
          <StatCard value={stats.idle} label="Idle" color="yellow" />
        </div>
        <div className="animate-fade-up stagger-3">
          <StatCard value={stats.dormant} label="Dormant" color="blue" />
        </div>
        <div className="animate-fade-up stagger-4">
          <StatCard value={stats.totalCommits} label="Total Commits" color="green" />
        </div>
      </div>

      {repos.length === 0 ? (
        <EmptyState
          icon={<BarChart3 size={48} />}
          title="No repos found"
          description="Add scan directories in Settings to see repository activity."
        />
      ) : (
        <div className="space-y-6">
          {(["active", "idle", "dormant"] as const).map((status) => {
            const group = grouped[status];
            if (group.length === 0) return null;
            return (
              <section key={status} className="glass-card rounded-2xl p-5 animate-fade-up stagger-5">
                <h2 className="text-sm font-semibold text-[#e2e8f0] mb-4 flex items-center gap-2">
                  <span className={clsx("w-2 h-2 rounded-full", statusDot[status])} />
                  <span className="capitalize">{status}</span>
                  <span className="text-[#64748b] font-normal">{group.length} repos</span>
                </h2>
                <div className="space-y-2">
                  {group.map((repo: any) => (
                    <div
                      key={repo.path}
                      className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-[#1c2333] transition-colors duration-200"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-semibold text-sm text-[#e2e8f0]">
                          {repo.name}
                        </span>
                        <span className="font-mono text-xs text-[#64748b]">({repo.branch})</span>
                        {repo.dirty && (
                          <span className="font-mono text-[10px] uppercase tracking-wider rounded-md px-2 py-0.5 bg-[rgba(251,191,36,0.15)] text-[#fbbf24]">
                            dirty
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {repo.commitsToday > 0 && (
                          <span className="font-mono text-xs text-[#34d399]">
                            {repo.commitsToday} today
                          </span>
                        )}
                        <span className={clsx("font-mono text-xs uppercase", statusText[repo.status as string])}>
                          {repo.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
