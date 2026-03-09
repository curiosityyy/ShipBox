import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { PageHeader } from "../components/PageHeader";
import { EmptyState } from "../components/EmptyState";
import { Key } from "lucide-react";
import { PageSkeleton } from "../components/PageSkeleton";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function Env() {
  const { data, isLoading } = useQuery({ queryKey: ["envFiles"], queryFn: api.envFiles });

  if (isLoading) return <PageSkeleton cards={0} />;

  const files = data?.files || [];

  return (
    <div className="animate-fade-up">
      <PageHeader title="Env" count={files.length} />
      {files.length === 0 ? (
        <EmptyState
          icon={<Key size={48} />}
          title="No .env files found"
          description="No .env files were detected across your scanned repositories."
        />
      ) : (
        <div className="space-y-3">
          {files.map((file: any, index: number) => (
            <div
              key={file.path}
              className={`glass-card animate-fade-up stagger-${Math.min(index + 1, 8)} rounded-xl px-5 py-4 flex items-center justify-between`}
            >
              <div>
                <div className="flex items-center gap-3">
                  <Key size={14} className="text-[#64748b]" />
                  <span className="font-semibold text-sm text-[#e2e8f0]">
                    {file.repo}
                  </span>
                </div>
                <div className="font-mono text-xs text-[#475569] mt-1.5 ml-[27px]">
                  {file.path}
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-sm text-[#e2e8f0]">{formatSize(file.size)}</div>
                <div className="text-[10px] uppercase tracking-wider text-[#64748b]">size</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
