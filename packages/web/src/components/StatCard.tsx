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
    <div className="glass-card rounded-xl px-4 py-4 text-center">
      <div className="text-2xl font-semibold text-[#e2e8f0] tracking-tight">
        {value}
      </div>
      <div className="flex items-center justify-center gap-1.5 mt-1.5">
        <span className={clsx("w-1.5 h-1.5 rounded-full", dotColors[color])} />
        <span className="text-[11px] text-[#64748b]">
          {label}
        </span>
      </div>
    </div>
  );
}
