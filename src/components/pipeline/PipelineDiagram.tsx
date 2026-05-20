"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { CycleSnapshot, PipelineInstruction, PipelineStage } from "@/types/pipeline";

const STAGES: { id: PipelineStage; label: string; full: string; color: string; glow: string }[] = [
  { id: "IF",  label: "IF",  full: "Instruction Fetch",  color: "#3b82f6", glow: "rgba(59,130,246,0.3)" },
  { id: "ID",  label: "ID",  full: "Instruction Decode", color: "#8b5cf6", glow: "rgba(139,92,246,0.3)" },
  { id: "EX",  label: "EX",  full: "Execute",            color: "#f59e0b", glow: "rgba(245,158,11,0.3)" },
  { id: "MEM", label: "MEM", full: "Memory Access",      color: "#10b981", glow: "rgba(16,185,129,0.3)" },
  { id: "WB",  label: "WB",  full: "Write Back",         color: "#ef4444", glow: "rgba(239,68,68,0.3)" },
];

interface Props {
  snapshot: CycleSnapshot | null;
  instructions: PipelineInstruction[];
  selectedInstrId: string | null;
}

export function PipelineDiagram({ snapshot, instructions, selectedInstrId }: Props) {
  const instrMap = new Map(instructions.map((i) => [i.id, i]));

  return (
    <div className="glass-panel rounded-xl h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 shrink-0">
        <span className="text-xs font-mono text-gray-400">PIPELINE STATE</span>
        {snapshot && (
          <span className="text-xs font-mono text-accent">
            Cycle {snapshot.cycle}
          </span>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-center px-4 py-3 gap-3">
        {/* Stage boxes */}
        <div className="flex items-stretch gap-2">
          {STAGES.map((stage, idx) => {
            const instrId = snapshot?.stages[stage.id] ?? null;
            const instr = instrId ? instrMap.get(instrId) : null;
            const isActive = !!instr;
            const isStalled = snapshot?.activeStalls.includes(instrId ?? "") ?? false;
            const isSelected = instrId === selectedInstrId;

            return (
              <div key={stage.id} className="flex items-center gap-2 flex-1">
                <StageBox
                  stage={stage}
                  instr={instr ?? null}
                  isActive={isActive}
                  isStalled={isStalled}
                  isSelected={isSelected}
                />
                {idx < STAGES.length - 1 && (
                  <div className="shrink-0 flex items-center">
                    <ConnectorArrow active={isActive} color={stage.color} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Forwarding paths */}
        {snapshot && snapshot.forwardingPaths.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {snapshot.forwardingPaths.map((fp, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono"
                style={{
                  background: "rgba(0,212,255,0.08)",
                  border: "1px solid rgba(0,212,255,0.25)",
                  color: "#00d4ff",
                }}
              >
                <span className="opacity-60">{fp.from}</span>
                <span>→</span>
                <span className="opacity-60">{fp.to}</span>
                <span className="font-semibold">{fp.register}</span>
              </div>
            ))}
          </div>
        )}

        {/* Hazard indicators */}
        {snapshot && snapshot.activeHazards.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {snapshot.activeHazards.slice(0, 3).map((hz, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono"
                style={{
                  background:
                    hz.type === "data"
                      ? "rgba(245,158,11,0.1)"
                      : hz.type === "control"
                      ? "rgba(239,68,68,0.1)"
                      : "rgba(139,92,246,0.1)",
                  border: `1px solid ${
                    hz.type === "data"
                      ? "rgba(245,158,11,0.3)"
                      : hz.type === "control"
                      ? "rgba(239,68,68,0.3)"
                      : "rgba(139,92,246,0.3)"
                  }`,
                  color:
                    hz.type === "data"
                      ? "#f59e0b"
                      : hz.type === "control"
                      ? "#ef4444"
                      : "#8b5cf6",
                }}
              >
                ⚠ {hz.type.toUpperCase()} HAZARD
              </div>
            ))}
          </div>
        )}

        {!snapshot && (
          <div className="text-center text-gray-600 text-xs font-mono py-2">
            Write a program and press Run to start
          </div>
        )}
      </div>
    </div>
  );
}

function StageBox({
  stage,
  instr,
  isActive,
  isStalled,
  isSelected,
}: {
  stage: typeof STAGES[number];
  instr: PipelineInstruction | null;
  isActive: boolean;
  isStalled: boolean;
  isSelected: boolean;
}) {
  const instrText = instr?.parsed.raw.replace(/#.*$/, "").trim() ?? "";
  const shortText = instrText.length > 14 ? instrText.slice(0, 13) + "…" : instrText;

  return (
    <div
      className="flex-1 rounded-lg flex flex-col items-center justify-center py-3 px-2 relative overflow-hidden transition-all"
      style={{
        background: isActive
          ? `${stage.color}18`
          : "rgba(255,255,255,0.02)",
        border: isSelected
          ? `2px solid ${stage.color}`
          : isActive
          ? `1px solid ${stage.color}50`
          : "1px solid rgba(255,255,255,0.06)",
        boxShadow: isActive ? `0 0 16px ${stage.glow}` : "none",
        minHeight: 80,
      }}
    >
      {/* Stage label */}
      <span
        className="text-xl font-bold font-display tracking-tight"
        style={{ color: isActive ? stage.color : "#374151" }}
      >
        {stage.label}
      </span>

      {/* Instruction in stage */}
      <AnimatePresence mode="popLayout">
        {instr && (
          <motion.div
            key={instr.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="mt-1.5 text-center"
          >
            {isStalled ? (
              <span className="text-xs font-mono text-red-400 font-semibold">
                STALL
              </span>
            ) : (
              <span className="text-xs font-mono text-gray-300 leading-tight block">
                {shortText}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active glow overlay */}
      {isActive && (
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            background: `radial-gradient(circle at center, ${stage.color}, transparent)`,
          }}
        />
      )}
    </div>
  );
}

function ConnectorArrow({ active, color }: { active: boolean; color: string }) {
  return (
    <svg width="20" height="16" viewBox="0 0 20 16" fill="none">
      <path
        d="M2 8H16M16 8L10 3M16 8L10 13"
        stroke={active ? color : "#1f2937"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {active && (
        <motion.circle
          r="2.5"
          fill={color}
          opacity={0.8}
          animate={{ cx: [2, 16, 2] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          cy="8"
        />
      )}
    </svg>
  );
}
