import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { PageHeader } from "../components/PageHeader";
import { EmptyState } from "../components/EmptyState";
import { Users } from "lucide-react";
import { PageSkeleton } from "../components/PageSkeleton";

export default function Agents() {
  const { data, isLoading } = useQuery({ queryKey: ["agents"], queryFn: api.agents });

  if (isLoading) return <PageSkeleton cards={0} />;

  const agents = data?.agents || [];

  return (
    <div className="animate-fade-up">
      <PageHeader title="Agents" count={agents.length} />
      {agents.length === 0 ? (
        <EmptyState
          icon={<Users size={48} />}
          title="No agents found"
          description="Agents live in each repo's .claude/agents/ folder as .md files."
        />
      ) : (
        <div className="space-y-3">
          {agents.map((agent: any, index: number) => (
            <div
              key={agent.path}
              className={`glass-card animate-fade-up stagger-${Math.min(index + 1, 8)} rounded-xl px-5 py-4`}
            >
              <div className="flex items-center gap-3">
                <Users size={14} className="text-[#64748b]" />
                <span className="font-semibold text-sm text-[#e2e8f0]">
                  {agent.name}
                </span>
              </div>
              <div className="font-mono text-xs text-[#475569] mt-1.5 ml-[27px]">
                {agent.path}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
