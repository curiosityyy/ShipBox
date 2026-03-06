interface PageHeaderProps {
  title: string;
  count?: number;
}

export function PageHeader({ title, count }: PageHeaderProps) {
  return (
    <div className="flex items-center gap-2 mb-6">
      <h1 className="text-2xl font-bold">{title}</h1>
      {count !== undefined && (
        <span className="text-sm text-[#8b949e] bg-[#30363d] px-2 py-0.5 rounded-full">
          {count}
        </span>
      )}
    </div>
  );
}
