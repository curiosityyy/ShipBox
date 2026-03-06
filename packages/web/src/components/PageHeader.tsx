interface PageHeaderProps {
  title: string;
  count?: number;
}

export function PageHeader({ title, count }: PageHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3">
        <h1 className="font-display text-2xl font-bold tracking-tight text-[#e2e8f0]">
          {title}
        </h1>
        {count !== undefined && (
          <span className="rounded-md bg-[#34d399]/10 text-[#34d399] font-mono text-xs font-semibold px-2 py-0.5">
            {count}
          </span>
        )}
      </div>
      <div
        className="h-px mt-4"
        style={{
          background:
            "linear-gradient(90deg, #34d399/40 0%, transparent 60%)",
        }}
      />
    </div>
  );
}
