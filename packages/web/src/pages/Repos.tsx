import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { PageHeader } from "../components/PageHeader";
import { EmptyState } from "../components/EmptyState";
import { FolderGit2 } from "lucide-react";
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

export default function Repos() {
  const { data, isLoading } = useQuery({ queryKey: ["repos"], queryFn: api.repos });

  if (isLoading) return <div className="text-[#64748b]">Loading...</div>;

  const repos = data?.repos || [];

  return (
    <div className="animate-fade-up">
      <PageHeader title="Repos" count={repos.length} />
      {repos.length === 0 ? (
        <EmptyState
          icon={<FolderGit2 size={48} />}
          title="No repos found"
          description="ShipBox looks for git repos in your configured scan directories. Add directories in Settings."
        />
      ) : (
        <div className="space-y-3">
          {repos.map((repo: any, index: number) => (
            <div
              key={repo.path}
              className={`glass-card animate-fade-up stagger-${Math.min(index + 1, 8)} rounded-xl px-5 py-4 flex items-center justify-between transition-colors duration-200 hover:border-[#34d399]/30`}
            >
              <div>
                <div className="flex items-center gap-2.5">
                  <FolderGit2 size={15} className="text-[#64748b]" />
                  <span className="font-display font-semibold text-base text-[#e2e8f0]">
                    {repo.name}
                  </span>
                  <span className="font-mono text-xs text-[#64748b]">
                    ({repo.branch})
                  </span>
                  {repo.dirty && (
                    <span className="font-mono text-[10px] uppercase tracking-wider rounded-md px-2 py-0.5 bg-[rgba(251,191,36,0.15)] text-[#fbbf24]">
                      dirty
                    </span>
                  )}
                </div>
                <div className="font-mono text-xs text-[#475569] mt-1.5 ml-[27px]">
                  {repo.path}
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <span
                  className={clsx(
                    "w-2 h-2 rounded-full",
                    statusDot[repo.status as string] || statusDot.dormant
                  )}
                />
                <span
                  className={clsx(
                    "font-mono text-xs uppercase",
                    statusText[repo.status as string] || statusText.dormant
                  )}
                >
                  {repo.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
