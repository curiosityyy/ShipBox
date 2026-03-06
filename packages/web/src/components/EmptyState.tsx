import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-[#8b949e] mb-4 text-4xl">{icon}</div>
      <h3 className="text-lg font-semibold text-[#e6edf3] mb-2">{title}</h3>
      <p className="text-sm text-[#8b949e] max-w-md">{description}</p>
    </div>
  );
}
