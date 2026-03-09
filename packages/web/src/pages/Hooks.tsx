import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { PageHeader } from "../components/PageHeader";
import { EmptyState } from "../components/EmptyState";
import { Link2 } from "lucide-react";
import { PageSkeleton } from "../components/PageSkeleton";

export default function Hooks() {
  const { data, isLoading } = useQuery({ queryKey: ["hooks"], queryFn: api.hooks });

  if (isLoading) return <PageSkeleton cards={0} />;

  const hooks = data?.hooks || {};
  const hookEntries = Object.entries(hooks);

  return (
    <div className="animate-fade-up">
      <PageHeader title="Hooks" count={data?.total || 0} />
      {hookEntries.length === 0 ? (
        <EmptyState
          icon={<Link2 size={48} />}
          title="No hooks configured"
          description='Hooks are defined in ~/.claude/settings.json under the "hooks" key.'
        />
      ) : (
        <div className="space-y-4">
          {hookEntries.map(([event, configs]: [string, any], index: number) => (
            <div
              key={event}
              className={`glass-card animate-fade-up stagger-${Math.min(index + 1, 8)} rounded-xl px-5 py-4`}
            >
              <div className="flex items-center gap-3 mb-3">
                <Link2 size={14} className="text-[#64748b]" />
                <span className="font-semibold text-sm text-[#e2e8f0]">
                  {event}
                </span>
                <span className="font-mono text-[10px] text-[#475569] bg-[#151a25] rounded-md px-1.5 py-0.5">
                  {Array.isArray(configs) ? configs.length : 1} hook{Array.isArray(configs) && configs.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="space-y-2 ml-[27px]">
                {(Array.isArray(configs) ? configs : [configs]).map((config: any, ci: number) => (
                  <pre
                    key={ci}
                    className="font-mono text-xs text-[#94a3b8] bg-[#0f1219] rounded-lg p-3 whitespace-pre-wrap"
                  >
                    {typeof config === "string" ? config : JSON.stringify(config, null, 2)}
                  </pre>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
