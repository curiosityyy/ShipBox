import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { PageHeader } from "../components/PageHeader";
import { StatCard } from "../components/StatCard";
import { EmptyState } from "../components/EmptyState";
import { DollarSign, TrendingUp, Calendar, Cpu } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const MODEL_COLORS: Record<string, string> = {
  "claude-opus-4-6": "#c084fc",
  "claude-sonnet-4-6": "#60a5fa",
  "claude-haiku-4-5-20251001": "#34d399",
};

// Pricing per million tokens
const PRICING: Record<string, { input: number; output: number; cacheRead: number; cacheWrite: number }> = {
  "claude-opus-4-6": { input: 15, output: 75, cacheRead: 1.5, cacheWrite: 18.75 },
  "claude-sonnet-4-6": { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
  "claude-haiku-4-5-20251001": { input: 0.8, output: 4, cacheRead: 0.08, cacheWrite: 1 },
};

function calculateCost(model: string, tokens: { input: number; output: number; cacheRead: number; cacheWrite: number }): number {
  const pricing = PRICING[model] || PRICING["claude-sonnet-4-6"];
  return (
    (tokens.input / 1_000_000) * pricing.input +
    (tokens.output / 1_000_000) * pricing.output +
    (tokens.cacheRead / 1_000_000) * pricing.cacheRead +
    (tokens.cacheWrite / 1_000_000) * pricing.cacheWrite
  );
}

export default function Costs() {
  const { data, isLoading } = useQuery({ queryKey: ["costs"], queryFn: api.costs });

  if (isLoading) return <div className="text-[#64748b]">Loading...</div>;

  const costData = data as any;
  if (!costData?.days || Object.keys(costData.days).length === 0) {
    return (
      <div className="space-y-8">
        <div className="animate-fade-up">
          <PageHeader title="Costs" />
        </div>
        <EmptyState
          icon={<DollarSign size={48} />}
          title="No cost data"
          description="Cost tracking requires session data. Start using Claude Code to see costs here."
        />
      </div>
    );
  }

  // Process daily costs with model breakdown
  const dailyEntries: Array<{ date: string; total: number; models: Record<string, number> }> = [];
  const modelTotals: Record<string, number> = {};
  let grandTotal = 0;
  let todayCost = 0;
  const today = new Date().toISOString().split("T")[0];

  for (const [date, models] of Object.entries(costData.days as Record<string, any>)) {
    let dayTotal = 0;
    const dayModels: Record<string, number> = {};

    for (const [model, tokens] of Object.entries(models as Record<string, any>)) {
      const cost = calculateCost(model, tokens);
      dayTotal += cost;
      dayModels[model] = cost;
      modelTotals[model] = (modelTotals[model] || 0) + cost;
    }

    grandTotal += dayTotal;
    if (date === today) todayCost = dayTotal;
    dailyEntries.push({ date, total: dayTotal, models: dayModels });
  }

  dailyEntries.sort((a, b) => a.date.localeCompare(b.date));

  // Chart data
  const chartData = dailyEntries.map((d) => ({
    date: d.date.slice(5), // MM-DD
    cost: Math.round(d.total * 100) / 100,
  }));

  // Model breakdown sorted by cost
  const modelEntries = Object.entries(modelTotals).sort(([, a], [, b]) => b - a);
  const maxModelCost = modelEntries.length > 0 ? modelEntries[0][1] : 1;

  // Average daily
  const avgDaily = dailyEntries.length > 0 ? grandTotal / dailyEntries.length : 0;

  return (
    <div className="space-y-8">
      <div className="animate-fade-up">
        <PageHeader title="Costs" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="animate-fade-up stagger-1">
          <StatCard value={`$${grandTotal.toFixed(2)}`} label="Total Cost" color="yellow" />
        </div>
        <div className="animate-fade-up stagger-2">
          <StatCard value={`$${todayCost.toFixed(2)}`} label="Today" color="green" />
        </div>
        <div className="animate-fade-up stagger-3">
          <StatCard value={`$${avgDaily.toFixed(2)}`} label="Avg/Day" color="blue" />
        </div>
        <div className="animate-fade-up stagger-4">
          <StatCard value={dailyEntries.length} label="Days Tracked" color="blue" />
        </div>
      </div>

      {/* Daily Cost Chart */}
      <section className="glass-card rounded-2xl p-5 animate-fade-up stagger-5">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp size={14} className="text-[#34d399]" />
          <span className="text-sm font-semibold text-[#e2e8f0]">Daily Costs</span>
          <span className="text-xs text-[#64748b]">{dailyEntries.length} days</span>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <XAxis
              dataKey="date"
              tick={{ fill: "#64748b", fontSize: 11 }}
              axisLine={{ stroke: "#1e293b" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#64748b", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${v}`}
            />
            <Tooltip
              contentStyle={{
                background: "#151a25",
                border: "1px solid #1e293b",
                borderRadius: 12,
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              }}
              labelStyle={{ color: "#64748b" }}
              itemStyle={{ color: "#34d399" }}
              cursor={{ fill: "rgba(52, 211, 153, 0.08)" }}
              formatter={(v: number) => [`$${v.toFixed(2)}`, "Cost"]}
            />
            <Bar dataKey="cost" fill="#34d399" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </section>

      {/* Cost by Model */}
      <section className="glass-card rounded-2xl p-5 animate-fade-up stagger-6">
        <div className="flex items-center gap-2 mb-5">
          <Cpu size={14} className="text-[#c084fc]" />
          <span className="text-sm font-semibold text-[#e2e8f0]">Cost by Model</span>
        </div>
        <div className="space-y-3">
          {modelEntries.map(([model, cost]) => {
            const pct = (cost / maxModelCost) * 100;
            const color = MODEL_COLORS[model] || "#64748b";
            return (
              <div key={model} className="flex items-center gap-3">
                <span className="text-xs text-[#e2e8f0] w-36 shrink-0 truncate">
                  {model.replace("claude-", "").replace(/-\d{8}$/, "").replace(/-/g, " ")}
                </span>
                <div className="flex-1 h-7 bg-[#0f1219] rounded-lg overflow-hidden">
                  <div
                    className="h-full rounded-lg transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      background: `linear-gradient(90deg, ${color}, ${color}80)`,
                    }}
                  />
                </div>
                <span className="font-mono text-xs text-[#64748b] w-16 text-right">
                  ${cost.toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Daily Breakdown Table */}
      <section className="glass-card rounded-2xl p-5 animate-fade-up stagger-7">
        <div className="flex items-center gap-2 mb-5">
          <Calendar size={14} className="text-[#60a5fa]" />
          <span className="text-sm font-semibold text-[#e2e8f0]">Daily Breakdown</span>
        </div>
        <div className="space-y-1">
          {[...dailyEntries].reverse().map((day) => (
            <div
              key={day.date}
              className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-[#1c2333]/40 transition-colors"
            >
              <span className="text-sm text-[#e2e8f0]">{day.date}</span>
              <div className="flex items-center gap-4">
                {Object.entries(day.models).map(([model, cost]) => (
                  <span key={model} className="text-xs font-mono" style={{ color: MODEL_COLORS[model] || "#64748b" }}>
                    {model.replace("claude-", "").replace(/-\d{8}$/, "").split("-")[0]}: ${cost.toFixed(2)}
                  </span>
                ))}
                <span className="font-mono text-sm text-[#e2e8f0] w-20 text-right font-semibold">
                  ${day.total.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
