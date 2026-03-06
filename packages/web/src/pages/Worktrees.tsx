import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { PageHeader } from "../components/PageHeader";
import { EmptyState } from "../components/EmptyState";
import { GitBranch } from "lucide-react";

export default function Worktrees() {
  const { data, isLoading } = useQuery({ queryKey: ["worktrees"], queryFn: api.worktrees });

  if (isLoading) return <div className="text-[#64748b]">Loading...</div>;

  const repos = data?.repos || [];

  return (
    <div className="animate-fade-up">
      <PageHeader title="Worktrees" count={repos.length} />
      {repos.length === 0 ? (
        <EmptyState
          icon={<GitBranch size={48} />}
          title="No multi-worktree repos"
          description="Only repos with multiple worktrees are shown here."
        />
      ) : (
        <div className="space-y-4">
          {repos.map((repo: any, index: number) => (
            <div
              key={repo.path}
              className={`glass-card animate-fade-up stagger-${Math.min(index + 1, 8)} rounded-xl px-5 py-4`}
            >
              <div className="flex items-center gap-3 mb-3">
                <GitBranch size={14} className="text-[#64748b]" />
                <span className="font-semibold text-sm text-[#e2e8f0]">
                  {repo.name}
                </span>
                <span className="font-mono text-[10px] text-[#475569] bg-[#151a25] rounded-md px-1.5 py-0.5">
                  {repo.worktrees.length} worktrees
                </span>
              </div>
              <div className="space-y-2 ml-[27px]">
                {repo.worktrees.map((wt: any) => (
                  <div
                    key={wt.path}
                    className="flex items-center gap-4 py-1.5 px-3 rounded-lg bg-[#0f1219]"
                  >
                    <span className="font-mono text-xs text-[#94a3b8] truncate flex-1">
                      {wt.path}
                    </span>
                    {wt.branch && (
                      <span className="font-mono text-xs text-[#34d399] shrink-0">
                        {wt.branch}
                      </span>
                    )}
                    {wt.head && (
                      <span className="font-mono text-[10px] text-[#475569] shrink-0">
                        {wt.head}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
