import { clsx } from "clsx";

interface StatCardProps {
  value: string | number;
  label: string;
  color?: "blue" | "green" | "yellow" | "red";
}

const dotColors = {
  blue: "bg-[#64748b]",
  green: "bg-[#34d399] shadow-[0_0_6px_rgba(52,211,153,0.4)]",
  yellow: "bg-[#fbbf24] shadow-[0_0_6px_rgba(251,191,36,0.4)]",
  red: "bg-[#f87171] shadow-[0_0_6px_rgba(248,113,113,0.4)]",
};

export function StatCard({ value, label, color = "blue" }: StatCardProps) {
  return (
    <div className="glass-card glow-top animate-fade-up rounded-xl p-5">
      <div className="font-display text-3xl font-bold text-[#e2e8f0] tracking-tight">
        {value}
      </div>
      <div className="flex items-center gap-2 mt-2">
        <span className={clsx("w-1.5 h-1.5 rounded-full", dotColors[color])} />
        <span className="text-xs uppercase tracking-wider font-medium text-[#64748b]">
          {label}
        </span>
      </div>
    </div>
  );
}
