import { clsx } from "clsx";

interface StatCardProps {
  value: string | number;
  label: string;
  color?: "blue" | "green" | "yellow" | "red";
}

const dotColors = {
  blue: "bg-[#2f81f7]",
  green: "bg-[#3fb950]",
  yellow: "bg-[#d29922]",
  red: "bg-[#f85149]",
};

export function StatCard({ value, label, color = "blue" }: StatCardProps) {
  return (
    <div className="bg-[#1c2333] rounded-lg p-5 border border-[#30363d]">
      <div className="text-2xl font-bold text-[#e6edf3]">{value}</div>
      <div className="flex items-center gap-1.5 mt-1">
        <span className={clsx("w-2 h-2 rounded-full", dotColors[color])} />
        <span className="text-sm text-[#8b949e]">{label}</span>
      </div>
    </div>
  );
}
