import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { PageHeader } from "../components/PageHeader";
import { StatCard } from "../components/StatCard";
import { EmptyState } from "../components/EmptyState";
import { ShieldCheck } from "lucide-react";
import { clsx } from "clsx";

const severityColors: Record<string, { bg: string; text: string; dot: string }> = {
  critical: {
    bg: "bg-[rgba(248,113,113,0.1)]",
    text: "text-[#f87171]",
    dot: "bg-[#f87171] shadow-[0_0_6px_rgba(248,113,113,0.4)]",
  },
  warning: {
    bg: "bg-[rgba(251,191,36,0.1)]",
    text: "text-[#fbbf24]",
    dot: "bg-[#fbbf24] shadow-[0_0_6px_rgba(251,191,36,0.4)]",
  },
  info: {
    bg: "bg-[rgba(52,211,153,0.1)]",
    text: "text-[#34d399]",
    dot: "bg-[#34d399] shadow-[0_0_6px_rgba(52,211,153,0.4)]",
  },
};

export default function Hygiene() {
  const { data, isLoading } = useQuery({ queryKey: ["hygiene"], queryFn: api.hygiene });

  if (isLoading) return <div className="text-[#64748b]">Loading...</div>;

  const issues = data?.issues || [];
  const critical = issues.filter((i: any) => i.severity === "critical").length;
  const warnings = issues.filter((i: any) => i.severity === "warning").length;

  return (
    <div className="animate-fade-up">
      <PageHeader title="Hygiene" count={issues.length} />

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="stagger-1">
          <StatCard value={issues.length} label="Issues" color="blue" />
        </div>
        <div className="stagger-2">
          <StatCard value={critical} label="Critical" color="red" />
        </div>
        <div className="stagger-3">
          <StatCard value={warnings} label="Warnings" color="yellow" />
        </div>
      </div>

      {issues.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck size={48} />}
          title="All clear"
          description="No hygiene issues detected. Your system looks healthy."
        />
      ) : (
        <div className="space-y-3">
          {issues.map((issue: any, index: number) => {
            const colors = severityColors[issue.severity] || severityColors.info;
            return (
              <div
                key={index}
                className={`glass-card animate-fade-up stagger-${Math.min(index + 4, 8)} rounded-xl px-5 py-4`}
              >
                <div className="flex items-center gap-3">
                  <span className={clsx("w-2 h-2 rounded-full shrink-0", colors.dot)} />
                  <span className="font-display font-semibold text-sm text-[#e2e8f0]">
                    {issue.message}
                  </span>
                  <span className={clsx("font-mono text-[10px] uppercase tracking-wider rounded-md px-2 py-0.5", colors.bg, colors.text)}>
                    {issue.severity}
                  </span>
                </div>
                <div className="font-mono text-xs text-[#475569] mt-1.5 ml-[19px]">
                  {issue.detail}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
