import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { PageHeader } from "../components/PageHeader";
import { StatCard } from "../components/StatCard";
import { EmptyState } from "../components/EmptyState";
import { Server, Link2, ShieldCheck } from "lucide-react";
import { PageSkeleton } from "../components/PageSkeleton";

export default function Setup() {
  const { data, isLoading } = useQuery({ queryKey: ["setup"], queryFn: api.setup });

  if (isLoading) return <PageSkeleton cards={3} />;

  const mcpServers = data?.mcpServers || {};
  const hooks = data?.hooks || {};
  const permissions = data?.permissions || {};

  const mcpCount = Object.keys(mcpServers).length;
  const hooksCount = Object.keys(hooks).length;
  const permissionsCount = Object.keys(permissions).length;
  const totalCount = mcpCount + hooksCount + permissionsCount;

  return (
    <div className="animate-fade-up">
      <PageHeader title="Setup" count={totalCount} />

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="stagger-1">
          <StatCard value={mcpCount} label="MCP Servers" color="blue" />
        </div>
        <div className="stagger-2">
          <StatCard value={hooksCount} label="Hooks" color="green" />
        </div>
        <div className="stagger-3">
          <StatCard value={permissionsCount} label="Permissions" color="yellow" />
        </div>
      </div>

      {/* MCP Servers */}
      <div className="mb-8">
        <h2 className="text-sm uppercase tracking-wider font-medium text-[#64748b] mb-4">
          MCP Servers
        </h2>
        {mcpCount === 0 ? (
          <EmptyState
            icon={<Server size={48} />}
            title="No MCP servers"
            description="No MCP servers configured in ~/.claude/settings.json."
          />
        ) : (
          <div className="space-y-3">
            {Object.entries(mcpServers).map(([name, config]: [string, any], index: number) => (
              <div
                key={name}
                className={`glass-card animate-fade-up stagger-${Math.min(index + 4, 8)} rounded-xl px-5 py-4`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Server size={14} className="text-[#64748b]" />
                  <span className="font-mono text-sm font-semibold text-[#e2e8f0]">
                    {name}
                  </span>
                </div>
                <div className="space-y-1.5 ml-[27px]">
                  {config.command && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-[#64748b]">Command:</span>
                      <span className="font-mono text-[#34d399]">{config.command}</span>
                    </div>
                  )}
                  {config.args && config.args.length > 0 && (
                    <div className="flex items-start gap-2 text-sm">
                      <span className="text-[#64748b]">Args:</span>
                      <span className="font-mono text-[#94a3b8]">
                        {config.args.join(" ")}
                      </span>
                    </div>
                  )}
                  {config.url && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-[#64748b]">URL:</span>
                      <span className="font-mono text-[#94a3b8]">{config.url}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hooks */}
      <div className="mb-8">
        <h2 className="text-sm uppercase tracking-wider font-medium text-[#64748b] mb-4">
          Hooks
        </h2>
        {hooksCount === 0 ? (
          <EmptyState
            icon={<Link2 size={48} />}
            title="No hooks"
            description='No hooks configured in ~/.claude/settings.json under the "hooks" key.'
          />
        ) : (
          <div className="space-y-3">
            {Object.entries(hooks).map(([event, config]: [string, any], index: number) => (
              <div
                key={event}
                className={`glass-card animate-fade-up stagger-${Math.min(index + 4, 8)} rounded-xl px-5 py-4`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Link2 size={14} className="text-[#64748b]" />
                  <span className="font-mono text-sm font-semibold text-[#e2e8f0]">
                    {event}
                  </span>
                </div>
                <div className="ml-[27px]">
                  <pre className="text-xs font-mono text-[#94a3b8] whitespace-pre-wrap">
                    {typeof config === "string" ? config : JSON.stringify(config, null, 2)}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Permissions */}
      <div className="mb-8">
        <h2 className="text-sm uppercase tracking-wider font-medium text-[#64748b] mb-4">
          Permissions
        </h2>
        {permissionsCount === 0 ? (
          <EmptyState
            icon={<ShieldCheck size={48} />}
            title="No permissions"
            description="No permission rules configured in ~/.claude/settings.json."
          />
        ) : (
          <div className="space-y-3">
            {Object.entries(permissions).map(([rule, config]: [string, any], index: number) => (
              <div
                key={rule}
                className={`glass-card animate-fade-up stagger-${Math.min(index + 4, 8)} rounded-xl px-5 py-4`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <ShieldCheck size={14} className="text-[#64748b]" />
                  <span className="font-mono text-sm font-semibold text-[#e2e8f0]">
                    {rule}
                  </span>
                </div>
                <div className="ml-[27px]">
                  <pre className="text-xs font-mono text-[#94a3b8] whitespace-pre-wrap">
                    {typeof config === "string" ? config : JSON.stringify(config, null, 2)}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
