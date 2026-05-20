"use client";

import { BarChart3, TrendingUp, Clock, Zap } from "lucide-react";
import type { SimulationResult } from "@/types/pipeline";

interface Props {
  result: SimulationResult | null;
}

export function MetricsPanel({ result }: Props) {
  if (!result) {
    return (
      <div className="glass-panel rounded-xl h-full flex items-center justify-center">
        <div className="text-xs text-gray-600 font-mono text-center">
          PERFORMANCE METRICS
          <br />
          <span className="text-gray-700">Run simulation first</span>
        </div>
      </div>
    );
  }

  const efficiency = result.totalInstructions > 0
    ? ((result.totalInstructions / result.totalCycles) * 100).toFixed(0)
    : "0";

  const stallPct = result.totalCycles > 0
    ? ((result.stallCycles / result.totalCycles) * 100).toFixed(1)
    : "0";

  return (
    <div className="glass-panel rounded-xl h-full flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5 shrink-0">
        <BarChart3 size={13} className="text-gray-500" />
        <span className="text-xs font-mono text-gray-400">PERFORMANCE</span>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-px bg-white/4 overflow-hidden">
        <Metric
          icon={TrendingUp}
          label="CPI"
          value={result.cpi.toFixed(2)}
          sub={result.cpi <= 1.1 ? "Ideal" : result.cpi <= 1.5 ? "Good" : "High"}
          color={result.cpi <= 1.1 ? "#10b981" : result.cpi <= 1.5 ? "#f59e0b" : "#ef4444"}
        />
        <Metric
          icon={Clock}
          label="Cycles"
          value={result.totalCycles.toString()}
          sub={`${result.totalInstructions} instrs`}
          color="#3b82f6"
        />
        <Metric
          icon={Zap}
          label="Efficiency"
          value={`${efficiency}%`}
          sub="IPC ratio"
          color="#8b5cf6"
        />
        <Metric
          icon={BarChart3}
          label="Stall%"
          value={`${stallPct}%`}
          sub={`${result.stallCycles} cycles`}
          color="#f59e0b"
        />
      </div>

      {/* Hazard breakdown bar */}
      <div className="px-3 py-2 border-t border-white/5 shrink-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-600 font-mono">Hazard breakdown</span>
          <span className="text-xs text-gray-600 font-mono">
            {result.hazardCount.data + result.hazardCount.control + result.hazardCount.structural} total
          </span>
        </div>
        <HazardBar
          data={result.hazardCount.data}
          control={result.hazardCount.control}
          structural={result.hazardCount.structural}
        />
      </div>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <div className="bg-black/20 px-3 py-2.5 flex flex-col justify-between">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon size={11} style={{ color }} />
        <span className="text-xs text-gray-500 font-mono">{label}</span>
      </div>
      <div>
        <div className="text-xl font-bold font-mono" style={{ color }}>
          {value}
        </div>
        <div className="text-xs text-gray-600 font-mono mt-0.5">{sub}</div>
      </div>
    </div>
  );
}

function HazardBar({
  data,
  control,
  structural,
}: {
  data: number;
  control: number;
  structural: number;
}) {
  const total = data + control + structural;
  if (total === 0) {
    return (
      <div className="h-2 rounded-full bg-green-500/20 border border-green-500/20 flex items-center justify-center">
        <span className="text-xs text-green-400 font-mono">No hazards</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <div className="flex-1 flex rounded-full overflow-hidden h-1.5 gap-px bg-white/5">
        {data > 0 && (
          <div
            className="rounded-l-full"
            style={{
              width: `${(data / total) * 100}%`,
              background: "#f59e0b",
            }}
          />
        )}
        {control > 0 && (
          <div
            style={{
              width: `${(control / total) * 100}%`,
              background: "#ef4444",
            }}
          />
        )}
        {structural > 0 && (
          <div
            className="rounded-r-full"
            style={{
              width: `${(structural / total) * 100}%`,
              background: "#8b5cf6",
            }}
          />
        )}
      </div>
      <div className="flex items-center gap-2 text-xs font-mono shrink-0">
        {data > 0 && <span style={{ color: "#f59e0b" }}>{data}D</span>}
        {control > 0 && <span style={{ color: "#ef4444" }}>{control}C</span>}
        {structural > 0 && <span style={{ color: "#8b5cf6" }}>{structural}S</span>}
      </div>
    </div>
  );
}
