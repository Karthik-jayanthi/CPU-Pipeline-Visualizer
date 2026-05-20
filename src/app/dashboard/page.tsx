"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Trash2, Play, Clock, Cpu, BarChart3 } from "lucide-react";
import { SimulatorShell } from "@/components/layout/SimulatorShell";
import { loadSimulations, deleteSimulation } from "@/lib/supabase/simulations";
import type { SimulationRow } from "@/types/pipeline";

export default function DashboardPage() {
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

  return (
    <SimulatorShell>
      <div className="h-full overflow-y-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-xl font-bold text-white">
              Saved Simulations
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Your stored pipeline programs and results
            </p>
          </div>
          <Link
            href="/simulation"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/12 border border-accent/30 text-accent text-sm font-medium hover:bg-accent/20 transition-all"
          >
            <Plus size={15} />
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
            icon={BarChart3}
            label="Avg CPI"
            value={
              simulations.length
                ? (
                    simulations
                      .filter((s) => s.result_summary?.cpi != null)
                      .reduce((a, s) => a + (s.result_summary?.cpi ?? 0), 0) /
                    Math.max(
                      1,
                      simulations.filter((s) => s.result_summary?.cpi != null)
                        .length
                    )
                  ).toFixed(2)
                : "—"
            }
            color="#f59e0b"
          />
          <StatCard
            icon={Clock}
            label="Total Cycles Run"
            value={simulations
              .reduce(
                (a, s) => a + (s.result_summary?.totalCycles ?? 0),
                0
              )
              .toString()}
            color="#10b981"
          />
          <StatCard
            icon={Play}
            label="With Results"
            value={simulations
              .filter((s) => s.result_summary != null)
              .length.toString()}
            color="#8b5cf6"
          />
        </div>

        {/* Simulation list */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 rounded-xl shimmer glass-panel"
              />
            ))}
          </div>
        ) : simulations.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-2">
            {simulations.map((sim) => (
              <SimulationCard
                key={sim.id}
                sim={sim}
                onDelete={() => handleDelete(sim.id)}
              />
            ))}
          </div>
        )}
      </div>
    </SimulatorShell>
  );
}

function SimulationCard({
  sim,
  onDelete,
}: {
  sim: SimulationRow;
  onDelete: () => void;
}) {
  const date = new Date(sim.updated_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="glass-panel rounded-xl px-4 py-3 flex items-center gap-4 hover:border-white/10 transition-all group">
      <div className="w-8 h-8 rounded-lg bg-accent/8 border border-accent/20 flex items-center justify-center shrink-0">
        <Cpu size={14} className="text-accent/60" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-white truncate">{sim.name}</h3>
          {sim.result_summary && (
            <span className="text-xs font-mono text-green-400 bg-green-500/10 border border-green-500/20 px-1.5 py-0.5 rounded shrink-0">
              ran
            </span>
          )}
        </div>
        {sim.description && (
          <p className="text-xs text-gray-500 truncate mt-0.5">{sim.description}</p>
        )}
      </div>

      {/* Stats */}
      {sim.result_summary && (
        <div className="flex items-center gap-4 shrink-0">
          <Stat label="CPI" value={sim.result_summary.cpi.toFixed(2)} color="#f59e0b" />
          <Stat label="Cycles" value={sim.result_summary.totalCycles.toString()} color="#3b82f6" />
          <Stat label="Stalls" value={sim.result_summary.stallCycles.toString()} color="#ef4444" />
        </div>
      )}

      <div className="text-xs text-gray-600 font-mono shrink-0">{date}</div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Link
          href={`/simulation?load=${sim.id}`}
          className="p-1.5 rounded-lg text-gray-500 hover:text-accent hover:bg-accent/8 transition-all"
        >
          <Play size={13} />
        </Link>
        <button
          onClick={onDelete}
          className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/8 transition-all"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="text-center">
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
        <span className="text-xs text-gray-500 font-mono">{label}</span>
      </div>
      <div className="text-2xl font-bold font-mono" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-2xl bg-accent/8 border border-accent/20 flex items-center justify-center mb-4">
        <Cpu size={24} className="text-accent/40" />
      </div>
      <h3 className="font-display text-lg font-semibold text-white mb-1">
        No saved simulations
      </h3>
      <p className="text-sm text-gray-500 mb-5 max-w-xs">
        Sign in and save your simulation results to track performance across
        different programs.
      </p>
      <Link
        href="/simulation"
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent/12 border border-accent/30 text-accent text-sm font-medium hover:bg-accent/20 transition-all"
      >
        <Plus size={15} />
        Start a Simulation
      </Link>
    </div>
  );
}
