import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { PageHeader } from "../components/PageHeader";
import { EmptyState } from "../components/EmptyState";
import { Brain } from "lucide-react";

export default function Memory() {
  const { data, isLoading } = useQuery({ queryKey: ["memory"], queryFn: api.memory });

  if (isLoading) return <div className="text-[#64748b]">Loading...</div>;

  const memories = data?.memories || [];

  return (
    <div className="animate-fade-up">
      <PageHeader title="Memory" count={memories.length} />
      {memories.length === 0 ? (
        <EmptyState
          icon={<Brain size={48} />}
          title="No memories found"
          description="Claude saves memories in MEMORY.md as you work together."
        />
      ) : (
        <div className="space-y-4">
          {memories.map((mem: any, index: number) => (
            <div
              key={mem.project}
              className={`glass-card animate-fade-up stagger-${Math.min(index + 1, 8)} rounded-xl px-5 py-4`}
            >
              <div className="flex items-center gap-3 mb-3">
                <Brain size={14} className="text-[#64748b]" />
                <span className="font-display font-semibold text-sm text-[#e2e8f0]">
                  {mem.project}
                </span>
              </div>
              <pre className="font-mono text-xs text-[#94a3b8] whitespace-pre-wrap leading-relaxed ml-[27px]">
                {mem.content}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
