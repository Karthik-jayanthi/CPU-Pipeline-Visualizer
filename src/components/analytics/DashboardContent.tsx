"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Plus, Trash2, Play, Clock, Cpu, BarChart3, TrendingUp } from "lucide-react";
import { loadSimulations, deleteSimulation } from "@/lib/supabase/simulations";
import type { SimulationRow } from "@/types/pipeline";

export function DashboardContent() {
  const [simulations, setSimulations] = useState<SimulationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSimulations().then((data) => {
      setSimulations(data);
      setLoading(false);
    });
  }, []);

  async function handleDelete(id: string) {
    const ok = await deleteSimulation(id);
    if (ok) setSimulations((s) => s.filter((sim) => sim.id !== id));
  }

  const withResults = simulations.filter((s) => s.result_summary != null);
  const avgCPI =
    withResults.length > 0
      ? withResults.reduce((a, s) => a + (s.result_summary?.cpi ?? 0), 0) /
        withResults.length
      : null;
  const totalCycles = simulations.reduce(
    (a, s) => a + (s.result_summary?.totalCycles ?? 0),
    0
  );

  const chartData = withResults.slice(0, 8).map((s) => ({
    name: s.name.slice(0, 12),
    cpi: parseFloat((s.result_summary?.cpi ?? 0).toFixed(2)),
    stalls: s.result_summary?.stallCycles ?? 0,
  }));

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-white tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Your simulation history and performance trends
          </p>
        </div>
        <Link
          href="/simulation"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/10 border border-accent/30 text-accent text-sm font-medium hover:bg-accent/20 transition-all"
        >
          <Plus size={14} />
          New Simulation
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <StatCard
          icon={Cpu}
          label="Total Simulations"
          value={simulations.length.toString()}
          color="#3b82f6"
        />
        <StatCard
          icon={TrendingUp}
          label="Avg CPI"
          value={avgCPI ? avgCPI.toFixed(2) : "—"}
          color={avgCPI && avgCPI <= 1.2 ? "#10b981" : "#f59e0b"}
        />
        <StatCard
          icon={Clock}
          label="Total Cycles"
          value={totalCycles.toLocaleString()}
          color="#8b5cf6"
        />
        <StatCard
          icon={BarChart3}
          label="Analyzed"
          value={withResults.length.toString()}
          color="#10b981"
        />
      </div>

      {/* CPI chart */}
      {chartData.length > 0 && (
        <div className="glass-panel rounded-xl mb-4 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
            <BarChart3 size={13} className="text-gray-500" />
            <span className="text-xs font-mono text-gray-400">CPI BY SIMULATION</span>
          </div>
          <div className="px-4 py-4" style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barSize={22}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "#6b7280", fontFamily: "JetBrains Mono" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#6b7280", fontFamily: "JetBrains Mono" }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, "auto"]}
                />
                <Tooltip
                  contentStyle={{
                    background: "#1f2937",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    fontSize: 11,
                    fontFamily: "JetBrains Mono",
                    color: "#e5e7eb",
                  }}
                  cursor={{ fill: "rgba(255,255,255,0.03)" }}
                />
                <Bar dataKey="cpi" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={
                        entry.cpi <= 1.2
                          ? "#10b981"
                          : entry.cpi <= 1.8
                          ? "#f59e0b"
                          : "#ef4444"
                      }
                      opacity={0.8}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Simulations list */}
      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
          <span className="text-xs font-mono text-gray-400">SAVED PROGRAMS</span>
          <span className="text-xs text-gray-600 font-mono">
            {simulations.length} total
          </span>
        </div>

        {loading ? (
          <div className="p-4 flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-lg shimmer bg-white/3" />
            ))}
          </div>
        ) : simulations.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-gray-600 text-sm mb-3">No simulations saved yet.</p>
            <Link href="/simulation" className="text-accent text-sm hover:underline">
              Run your first simulation →
            </Link>
          </div>
        ) : (
          <div>
            {simulations.map((sim, i) => (
              <SimRow
                key={sim.id}
                sim={sim}
                isLast={i === simulations.length - 1}
                onDelete={() => handleDelete(sim.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SimRow({
  sim,
  isLast,
  onDelete,
}: {
  sim: SimulationRow;
  isLast: boolean;
  onDelete: () => void;
}) {
  const date = new Date(sim.updated_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <div
      className={`flex items-center gap-4 px-4 py-3 group hover:bg-white/2 transition-colors ${
        !isLast ? "border-b border-white/5" : ""
      }`}
    >
      <div className="w-7 h-7 rounded-lg bg-accent/8 border border-accent/15 flex items-center justify-center shrink-0">
        <Cpu size={12} className="text-accent/50" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white truncate">{sim.name}</span>
          {sim.result_summary && (
            <span className="text-xs font-mono text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded shrink-0">
              ✓
            </span>
          )}
        </div>
        {sim.description && (
          <p className="text-xs text-gray-600 truncate">{sim.description}</p>
        )}
      </div>

      {sim.result_summary && (
        <div className="flex items-center gap-4 shrink-0">
          <MiniStat label="CPI" value={sim.result_summary.cpi.toFixed(2)} color="#f59e0b" />
          <MiniStat label="cycles" value={sim.result_summary.totalCycles.toString()} color="#3b82f6" />
        </div>
      )}

      <span className="text-xs text-gray-700 font-mono shrink-0">{date}</span>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <Link
          href={`/simulation?load=${sim.id}`}
          className="p-1.5 rounded text-gray-600 hover:text-accent transition-colors"
        >
          <Play size={12} />
        </Link>
        <button
          onClick={onDelete}
          className="p-1.5 rounded text-gray-600 hover:text-red-400 transition-colors"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="text-right">
      <div className="text-sm font-mono font-semibold" style={{ color }}>
        {value}
      </div>
      <div className="text-xs text-gray-600 font-mono">{label}</div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="glass-panel rounded-xl px-4 py-3">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={13} style={{ color }} />
        <span className="text-xs text-gray-500 font-mono truncate">{label}</span>
      </div>
      <div className="text-2xl font-bold font-mono" style={{ color }}>
        {value}
      </div>
    </div>
  );
}
