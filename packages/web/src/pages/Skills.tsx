import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { PageHeader } from "../components/PageHeader";
import { EmptyState } from "../components/EmptyState";
import { Zap } from "lucide-react";
import { PageSkeleton } from "../components/PageSkeleton";

export default function Skills() {
  const { data, isLoading } = useQuery({ queryKey: ["skills"], queryFn: api.skills });

  if (isLoading) return <PageSkeleton cards={0} />;

  const skills = data?.skills || [];

  return (
    <div className="animate-fade-up">
      <PageHeader title="Skills" count={skills.length} />
      {skills.length === 0 ? (
        <EmptyState
          icon={<Zap size={48} />}
          title="No skills found"
          description="Skills live in ~/.claude/skills/ or in each repo's .claude/skills/ folder."
        />
      ) : (
        <div className="space-y-3">
          {skills.map((skill: any, index: number) => (
            <div
              key={skill.path}
              className={`glass-card animate-fade-up stagger-${Math.min(index + 1, 8)} rounded-xl px-5 py-4`}
            >
              <div className="flex items-center gap-3">
                <Zap size={14} className="text-[#64748b]" />
                <span className="font-semibold text-sm text-[#e2e8f0]">
                  {skill.name}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-wider rounded-md px-2 py-0.5 bg-[rgba(52,211,153,0.15)] text-[#34d399]">
                  {skill.source}
                </span>
              </div>
              <div className="font-mono text-xs text-[#475569] mt-1.5 ml-[27px]">
                {skill.path}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
