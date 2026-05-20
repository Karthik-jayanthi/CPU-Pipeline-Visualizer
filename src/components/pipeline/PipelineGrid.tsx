"use client";

import { useRef, useEffect } from "react";
import type { SimulationResult } from "@/types/pipeline";

const STAGE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  IF:    { bg: "rgba(59,130,246,0.2)",  border: "rgba(59,130,246,0.5)",  text: "#60a5fa" },
  ID:    { bg: "rgba(139,92,246,0.2)",  border: "rgba(139,92,246,0.5)",  text: "#a78bfa" },
  EX:    { bg: "rgba(245,158,11,0.2)",  border: "rgba(245,158,11,0.5)",  text: "#fbbf24" },
  MEM:   { bg: "rgba(16,185,129,0.2)",  border: "rgba(16,185,129,0.5)",  text: "#34d399" },
  WB:    { bg: "rgba(239,68,68,0.2)",   border: "rgba(239,68,68,0.5)",   text: "#f87171" },
  stall: { bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.3)",   text: "#ef4444" },
};

interface Props {
  result: SimulationResult | null;
  currentCycle: number;
  selectedInstrId: string | null;
  onSelectInstr: (id: string | null) => void;
  onSeekCycle: (cycle: number) => void;
}

export function PipelineGrid({
  result,
  currentCycle,
  selectedInstrId,
  onSelectInstr,
  onSeekCycle,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to keep current cycle column visible
  useEffect(() => {
    if (!scrollRef.current || !result) return;
    const cellW = 40;
    const headerW = 160;
    const targetX = headerW + (currentCycle - 1) * cellW - 200;
    scrollRef.current.scrollLeft = Math.max(0, targetX);
  }, [currentCycle, result]);

  if (!result) {
    return (
      <div className="glass-panel rounded-xl h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 text-xs font-mono mb-1">
            PIPELINE TIMING DIAGRAM
          </div>
          <div className="text-gray-700 text-xs">
            Run a simulation to see the timing grid
          </div>
        </div>
      </div>
    );
  }

  const { instructions, cycles, totalCycles } = result;

  // Build a lookup: instrId + cycle -> stage label (or "stall")
  const cellMap = new Map<string, string>();
  for (const instr of instructions) {
    for (const [stage, cycle] of Object.entries(instr.stages)) {
      cellMap.set(`${instr.id}:${cycle}`, stage);
    }
    // Mark stall cycles
    const ifCycle = instr.stages["IF"] ?? 0;
    const expectedIf = instr.index + 1; // ideal no-stall start
    for (let sc = expectedIf; sc < ifCycle; sc++) {
      cellMap.set(`${instr.id}:${sc}`, "stall");
    }
  }

  const cycleNums = Array.from({ length: totalCycles }, (_, i) => i + 1);

  return (
    <div className="glass-panel rounded-xl h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 shrink-0">
        <span className="text-xs font-mono text-gray-400">TIMING DIAGRAM</span>
        <div className="flex items-center gap-4">
          <LegendItem color={STAGE_COLORS.IF.text} label="IF" />
          <LegendItem color={STAGE_COLORS.ID.text} label="ID" />
          <LegendItem color={STAGE_COLORS.EX.text} label="EX" />
          <LegendItem color={STAGE_COLORS.MEM.text} label="MEM" />
          <LegendItem color={STAGE_COLORS.WB.text} label="WB" />
          <LegendItem color={STAGE_COLORS.stall.text} label="stall" />
        </div>
      </div>

      {/* Scrollable grid */}
      <div ref={scrollRef} className="flex-1 overflow-auto min-h-0">
        <table className="border-collapse" style={{ minWidth: "max-content" }}>
          <thead>
            <tr>
              {/* Instruction column header */}
              <th
                className="sticky left-0 z-20 bg-panel text-left px-3 py-2 text-xs font-mono text-gray-500 border-b border-white/5 border-r border-white/5"
                style={{ minWidth: 160 }}
              >
                Instruction
              </th>
              {cycleNums.map((c) => (
                <th
                  key={c}
                  onClick={() => onSeekCycle(c)}
                  className="px-1 py-2 text-center text-xs font-mono border-b border-white/5 cursor-pointer transition-colors hover:bg-white/3"
                  style={{
                    width: 40,
                    minWidth: 40,
                    color: c === currentCycle ? "#00d4ff" : "#4b5563",
                    background:
                      c === currentCycle
                        ? "rgba(0,212,255,0.06)"
                        : "transparent",
                  }}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {instructions.map((instr, rowIdx) => {
              const isSelected = instr.id === selectedInstrId;
              const hasHazard = instr.hazards.length > 0;
              const label = instr.parsed.raw.replace(/#.*$/, "").trim();
              const shortLabel = label.length > 22 ? label.slice(0, 21) + "…" : label;

              return (
                <tr
                  key={instr.id}
                  onClick={() =>
                    onSelectInstr(isSelected ? null : instr.id)
                  }
                  className="cursor-pointer transition-colors hover:bg-white/2 group"
                  style={{
                    background: isSelected
                      ? "rgba(0,212,255,0.04)"
                      : rowIdx % 2 === 0
                      ? "transparent"
                      : "rgba(255,255,255,0.01)",
                  }}
                >
                  {/* Instruction label */}
                  <td
                    className="sticky left-0 z-10 bg-panel px-3 py-1.5 border-r border-white/5 border-b border-white/4"
                    style={{
                      background: isSelected
                        ? "rgba(0,212,255,0.08)"
                        : rowIdx % 2 === 0
                        ? "#111827"
                        : "#0f1623",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 text-xs font-mono w-5 text-right shrink-0">
                        {instr.index + 1}
                      </span>
                      <span
                        className="text-xs font-mono truncate"
                        style={{ color: isSelected ? "#00d4ff" : "#9ca3af" }}
                      >
                        {shortLabel}
                      </span>
                      {hasHazard && (
                        <span className="text-amber-500 text-xs leading-none shrink-0">⚠</span>
                      )}
                    </div>
                  </td>

                  {/* Cycle cells */}
                  {cycleNums.map((c) => {
                    const cellKey = `${instr.id}:${c}`;
                    const stageLabel = cellMap.get(cellKey);
                    const style = stageLabel
                      ? STAGE_COLORS[stageLabel] ?? STAGE_COLORS.IF
                      : null;
                    const isCurrentCol = c === currentCycle;

                    return (
                      <td
                        key={c}
                        className="p-0.5 border-b border-white/4 text-center"
                        style={{
                          background: isCurrentCol
                            ? "rgba(0,212,255,0.04)"
                            : "transparent",
                        }}
                      >
                        {style && stageLabel ? (
                          <div
                            className="rounded text-xs font-mono font-semibold flex items-center justify-center"
                            style={{
                              background: style.bg,
                              border: `1px solid ${style.border}`,
                              color: style.text,
                              height: 24,
                              fontSize: stageLabel === "stall" ? 9 : 10,
                            }}
                          >
                            {stageLabel === "stall" ? "—" : stageLabel}
                          </div>
                        ) : (
                          <div className="h-6" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <div
        className="w-2.5 h-2.5 rounded-sm"
        style={{ background: color, opacity: 0.8 }}
      />
      <span className="text-xs font-mono text-gray-500">{label}</span>
    </div>
  );
}
