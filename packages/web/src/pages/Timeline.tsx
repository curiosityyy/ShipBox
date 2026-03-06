import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { PageHeader } from "../components/PageHeader";
import { StatCard } from "../components/StatCard";
import { EmptyState } from "../components/EmptyState";
import { CalendarDays } from "lucide-react";

const repoColors = ["#34d399", "#818cf8", "#fbbf24", "#fb923c", "#f87171", "#38bdf8", "#a78bfa"];

function timeAgo(dateStr: string): string {
  if (!dateStr) return "";
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function Timeline() {
  const { data, isLoading } = useQuery({ queryKey: ["timeline"], queryFn: api.timeline });

  if (isLoading) return <div className="text-[#64748b]">Loading...</div>;
  if (!data) return null;

  const commits = data.commits || [];
  const repos = [...new Set(commits.map((c: any) => c.repo))] as string[];
  const authors = [...new Set(commits.map((c: any) => c.author))] as string[];

  const repoColorMap: Record<string, string> = {};
  repos.forEach((r, i) => {
    repoColorMap[r] = repoColors[i % repoColors.length];
  });

  return (
    <div className="space-y-8">
      <div className="animate-fade-up">
        <PageHeader title="Timeline" count={data.total} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="animate-fade-up stagger-1">
          <StatCard value={commits.length} label="Commits" color="blue" />
        </div>
        <div className="animate-fade-up stagger-2">
          <StatCard value={repos.length} label="Repos" color="green" />
        </div>
        <div className="animate-fade-up stagger-3">
          <StatCard value={authors.length} label="Authors" color="yellow" />
        </div>
      </div>

      {commits.length === 0 ? (
        <EmptyState
          icon={<CalendarDays size={48} />}
          title="No commits found"
          description="Add repo directories in Settings to see git timelines."
        />
      ) : (
        <div className="glass-card rounded-2xl p-5 animate-fade-up stagger-4">
          <div className="relative">
            {/* Vertical timeline line */}
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-[#1e293b]" />

            <div className="space-y-1">
              {commits.map((commit: any, index: number) => (
                <div
                  key={`${commit.hash}-${index}`}
                  className="flex items-start gap-4 py-2.5 px-2 rounded-xl hover:bg-[#1c2333] transition-colors duration-200 relative"
                >
                  {/* Timeline dot */}
                  <div
                    className="w-[15px] h-[15px] rounded-full border-2 border-[#0f1219] shrink-0 mt-1 z-10"
                    style={{ backgroundColor: repoColorMap[commit.repo] || "#64748b" }}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="font-mono text-xs font-semibold rounded-md px-1.5 py-0.5"
                        style={{
                          color: repoColorMap[commit.repo] || "#64748b",
                          backgroundColor: `${repoColorMap[commit.repo] || "#64748b"}15`,
                        }}
                      >
                        {commit.repo}
                      </span>
                      <span className="font-mono text-[10px] text-[#475569]">
                        {commit.hash.slice(0, 7)}
                      </span>
                    </div>
                    <div className="text-sm text-[#e2e8f0] truncate">{commit.message}</div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-[#64748b]">
                      <span>{commit.author}</span>
                      <span>{timeAgo(commit.date)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
