import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { PageHeader } from "../components/PageHeader";
import { EmptyState } from "../components/EmptyState";
import { FolderGit2 } from "lucide-react";
import { clsx } from "clsx";

const statusColors = { active: "bg-[#3fb950]", idle: "bg-[#d29922]", dormant: "bg-[#8b949e]" };

export default function Repos() {
  const { data, isLoading } = useQuery({ queryKey: ["repos"], queryFn: api.repos });

  if (isLoading) return <div className="text-[#8b949e]">Loading...</div>;

  const repos = data?.repos || [];

  return (
    <div>
      <PageHeader title="Repos" count={repos.length} />
      {repos.length === 0 ? (
        <EmptyState
          icon={<FolderGit2 size={48} />}
          title="No repos found"
          description="ShipBox looks for git repos in your configured scan directories. Add directories in Settings."
        />
      ) : (
        <div className="space-y-2">
          {repos.map((repo: any) => (
            <div key={repo.path} className="bg-[#1c2333] rounded-lg p-4 border border-[#30363d] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <FolderGit2 size={16} className="text-[#8b949e]" />
                  <span className="font-semibold">{repo.name}</span>
                  <span className="text-xs text-[#8b949e] font-mono">({repo.branch})</span>
                  {repo.dirty && <span className="text-xs px-1.5 py-0.5 bg-[#d29922]/20 text-[#d29922] rounded">dirty</span>}
                </div>
                <div className="text-xs text-[#8b949e] mt-1 font-mono">{repo.path}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className={clsx("w-2 h-2 rounded-full", statusColors[repo.status as keyof typeof statusColors])} />
                <span className="text-sm text-[#8b949e] capitalize">{repo.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
