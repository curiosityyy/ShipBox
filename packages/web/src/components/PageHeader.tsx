interface PageHeaderProps {
  title: string;
  count?: number;
  subtitle?: string;
}

export function PageHeader({ title, count, subtitle }: PageHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2.5">
        <h1 className="text-xl font-bold tracking-tight text-[#e2e8f0]">
          {title}
        </h1>
        {count !== undefined && (
          <span className="rounded-md bg-[#1e2433] text-[#8b949e] font-mono text-xs px-1.5 py-0.5">
            {count}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="text-sm text-[#64748b] mt-1">{subtitle}</p>
      )}
    </div>
  );
}
