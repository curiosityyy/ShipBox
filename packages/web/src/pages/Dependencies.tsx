import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { PageHeader } from "../components/PageHeader";
import { EmptyState } from "../components/EmptyState";
import { Package } from "lucide-react";

export default function Dependencies() {
  const { data, isLoading } = useQuery({ queryKey: ["deps"], queryFn: api.deps });

  if (isLoading) return <div className="text-[#64748b]">Loading...</div>;

  const repos = data?.repos || [];

  return (
    <div className="animate-fade-up">
      <PageHeader title="Dependencies" count={repos.length} />
      {repos.length === 0 ? (
        <EmptyState
          icon={<Package size={48} />}
          title="No repos with package.json"
          description="Add directories with Node.js projects in Settings to see dependency health."
        />
      ) : (
        <div className="space-y-3">
          {repos.map((repo: any, index: number) => (
            <div
              key={repo.path}
              className={`glass-card animate-fade-up stagger-${Math.min(index + 1, 8)} rounded-xl px-5 py-4 flex items-center justify-between`}
            >
              <div>
                <div className="flex items-center gap-3">
                  <Package size={14} className="text-[#64748b]" />
                  <span className="font-display font-semibold text-sm text-[#e2e8f0]">
                    {repo.name}
                  </span>
                  {repo.hasLockfile ? (
                    <span className="font-mono text-[10px] uppercase tracking-wider rounded-md px-2 py-0.5 bg-[rgba(52,211,153,0.15)] text-[#34d399]">
                      lockfile
                    </span>
                  ) : (
                    <span className="font-mono text-[10px] uppercase tracking-wider rounded-md px-2 py-0.5 bg-[rgba(251,191,36,0.15)] text-[#fbbf24]">
                      no lockfile
                    </span>
                  )}
                </div>
                <div className="font-mono text-xs text-[#475569] mt-1.5 ml-[27px]">
                  {repo.path}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="font-mono text-sm text-[#e2e8f0]">{repo.deps}</div>
                  <div className="text-[10px] uppercase tracking-wider text-[#64748b]">deps</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm text-[#e2e8f0]">{repo.devDeps}</div>
                  <div className="text-[10px] uppercase tracking-wider text-[#64748b]">dev</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
