"use client";

import { AlertTriangle, GitMerge, Zap } from "lucide-react";
import type { SimulationResult, HazardRecord } from "@/types/pipeline";

interface Props {
  result: SimulationResult | null;
  currentCycle: number;
  selectedInstrId: string | null;
}

export function HazardLog({ result, currentCycle, selectedInstrId }: Props) {
  if (!result) {
    return (
      <div className="glass-panel rounded-xl h-full flex items-center justify-center">
        <div className="text-xs text-gray-600 font-mono text-center">
          HAZARD LOG
          <br />
          <span className="text-gray-700">No simulation running</span>
        </div>
      </div>
    );
  }

  // Collect all hazards, annotated with which instruction they belong to
  const allHazards: Array<HazardRecord & { instrIdx: number; instrRaw: string }> = [];
  for (const instr of result.instructions) {
    for (const hz of instr.hazards) {
      allHazards.push({
        ...hz,
        instrIdx: instr.index,
        instrRaw: instr.parsed.raw.replace(/#.*$/, "").trim(),
      });
    }
  }

  // Filter to relevant hazards if an instruction is selected
  const displayHazards = selectedInstrId
    ? allHazards.filter((hz) => {
        const instrId = `instr-${hz.instrIdx}`;
        const srcId = `instr-${hz.sourceInstrIdx}`;
        return instrId === selectedInstrId || srcId === selectedInstrId;
      })
    : allHazards;

  const dataCount = allHazards.filter((h) => h.type === "data").length;
  const controlCount = allHazards.filter((h) => h.type === "control").length;
  const forwardedCount = allHazards.filter((h) => h.resolvedBy === "forwarding").length;

  return (
    <div className="glass-panel rounded-xl h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/5 shrink-0">
        <span className="text-xs font-mono text-gray-400">HAZARD LOG</span>
        <div className="flex items-center gap-2">
          {dataCount > 0 && (
            <Badge color="#f59e0b" count={dataCount} label="DATA" />
          )}
          {controlCount > 0 && (
            <Badge color="#ef4444" count={controlCount} label="CTRL" />
          )}
        </div>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-px bg-white/5 border-b border-white/5 shrink-0">
        <StatCell label="Total" value={allHazards.length} color="#f59e0b" />
        <StatCell label="Stalls" value={result.stallCycles} color="#ef4444" />
        <StatCell label="Fwd" value={forwardedCount} color="#00d4ff" />
      </div>

      {/* Hazard list */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {displayHazards.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-8 h-8 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-2">
                <span className="text-green-400 text-sm">✓</span>
              </div>
              <p className="text-xs text-gray-600">
                {selectedInstrId ? "No hazards for selected instruction" : "No hazards detected"}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-2 flex flex-col gap-1.5">
            {displayHazards.map((hz, i) => (
              <HazardEntry key={i} hazard={hz} currentCycle={currentCycle} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function HazardEntry({
  hazard,
  currentCycle,
}: {
  hazard: HazardRecord & { instrIdx: number; instrRaw: string };
  currentCycle: number;
}) {
  const isPast = hazard.cycle < currentCycle;
  const isCurrent = Math.abs(hazard.cycle - currentCycle) <= 1;

  const typeColor =
    hazard.type === "data"
      ? "#f59e0b"
      : hazard.type === "control"
      ? "#ef4444"
      : "#8b5cf6";

  const resolveIcon =
    hazard.resolvedBy === "forwarding" ? (
      <Zap size={10} className="text-accent shrink-0" />
    ) : hazard.resolvedBy === "stall" ? (
      <AlertTriangle size={10} className="text-red-400 shrink-0" />
    ) : (
      <GitMerge size={10} className="text-purple-400 shrink-0" />
    );

  return (
    <div
      className="rounded-lg px-2.5 py-2 transition-all"
      style={{
        background: isCurrent
          ? `${typeColor}12`
          : isPast
          ? "rgba(255,255,255,0.02)"
          : "rgba(255,255,255,0.03)",
        border: `1px solid ${isCurrent ? `${typeColor}30` : "rgba(255,255,255,0.05)"}`,
        opacity: isPast ? 0.5 : 1,
      }}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <span
            className="text-xs font-mono font-semibold uppercase"
            style={{ color: typeColor }}
          >
            {hazard.type}
          </span>
          <span className="text-gray-600 text-xs font-mono">
            C{hazard.cycle}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {resolveIcon}
          <span
            className="text-xs font-mono"
            style={{
              color:
                hazard.resolvedBy === "forwarding"
                  ? "#00d4ff"
                  : hazard.resolvedBy === "stall"
                  ? "#ef4444"
                  : "#8b5cf6",
            }}
          >
            {hazard.resolvedBy}
          </span>
        </div>
      </div>
      <p className="text-xs text-gray-500 leading-snug">{hazard.description}</p>
    </div>
  );
}

function StatCell({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="px-3 py-2 bg-black/20 flex flex-col items-center">
      <span className="text-base font-mono font-bold" style={{ color }}>
        {value}
      </span>
      <span className="text-xs text-gray-600 font-mono">{label}</span>
    </div>
  );
}

function Badge({
  color,
  count,
  label,
}: {
  color: string;
  count: number;
  label: string;
}) {
  return (
    <div
      className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-mono"
      style={{
        background: `${color}18`,
        border: `1px solid ${color}30`,
        color,
      }}
    >
      {count} {label}
    </div>
  );
}
