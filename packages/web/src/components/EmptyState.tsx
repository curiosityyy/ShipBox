import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-up">
      <div className="stagger-1 w-16 h-16 rounded-full glass-card border border-[#34d399]/15 flex items-center justify-center mb-5 shadow-[0_0_20px_rgba(52,211,153,0.06)]">
        <div className="text-[#64748b] text-2xl">{icon}</div>
      </div>
      <h3 className="stagger-2 text-lg font-semibold text-[#e2e8f0] mb-2">
        {title}
      </h3>
      <p className="stagger-3 text-sm text-[#64748b] max-w-sm leading-relaxed">
        {description}
      </p>
    </div>
  );
}
