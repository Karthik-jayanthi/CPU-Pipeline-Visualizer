"use client";

import { useMemo } from "react";
import type { PipelineInstruction } from "@/types/pipeline";
import { getWriteRegister, getReadRegisters } from "@/lib/pipeline/parser";

interface Props {
  instructions: PipelineInstruction[];
}

interface GraphEdge {
  from: number;
  to: number;
  register: string;
  type: "RAW" | "WAR" | "WAW";
}

interface NodePosition {
  x: number;
  y: number;
  instr: PipelineInstruction;
}

const NODE_W = 130;
const NODE_H = 38;
const H_GAP = 50;
const V_GAP = 18;
const COLS = 3;

function buildEdges(instructions: PipelineInstruction[]): GraphEdge[] {
  const edges: GraphEdge[] = [];

  for (let i = 0; i < instructions.length; i++) {
    const curr = instructions[i];
    const currReads = getReadRegisters(curr.parsed);
    const currWrite = getWriteRegister(curr.parsed);

    for (let j = i + 1; j < instructions.length; j++) {
      const next = instructions[j];
      const nextReads = getReadRegisters(next.parsed);
      const nextWrite = getWriteRegister(next.parsed);

      // RAW: curr writes something next reads
      if (currWrite && nextReads.includes(currWrite)) {
        edges.push({ from: i, to: j, register: currWrite, type: "RAW" });
      }
      // WAR: curr reads something next writes
      if (nextWrite && currReads.includes(nextWrite)) {
        edges.push({ from: i, to: j, register: nextWrite, type: "WAR" });
      }
      // WAW: both write same register
      if (currWrite && nextWrite && currWrite === nextWrite) {
        edges.push({ from: i, to: j, register: currWrite, type: "WAW" });
      }
    }
  }

  return edges;
}

export function DependencyGraph({ instructions }: Props) {
  const { nodes, edges, svgW, svgH } = useMemo(() => {
    if (!instructions.length) return { nodes: [], edges: [], svgW: 0, svgH: 0 };

    const cols = Math.min(COLS, instructions.length);
    const rows = Math.ceil(instructions.length / cols);

    const nodes: NodePosition[] = instructions.map((instr, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      return {
        x: col * (NODE_W + H_GAP) + 20,
        y: row * (NODE_H + V_GAP) + 20,
        instr,
      };
    });

    const svgW = cols * (NODE_W + H_GAP) + 20;
    const svgH = rows * (NODE_H + V_GAP) + 20;
    const edges = buildEdges(instructions);

    return { nodes, edges, svgW, svgH };
  }, [instructions]);

  if (!instructions.length) {
    return (
      <div className="flex items-center justify-center h-full text-gray-600 text-xs font-mono">
        Run a simulation to see the dependency graph
      </div>
    );
  }

  const edgeColor = (type: GraphEdge["type"]) =>
    type === "RAW" ? "#f59e0b" : type === "WAR" ? "#8b5cf6" : "#ef4444";

  return (
    <div className="w-full h-full overflow-auto">
      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2 border-b border-white/5 shrink-0 flex-wrap">
        <span className="text-xs font-mono text-gray-500">Dependencies:</span>
        {(["RAW", "WAR", "WAW"] as const).map((t) => (
          <div key={t} className="flex items-center gap-1.5">
            <svg width="20" height="8">
              <line
                x1="0" y1="4" x2="20" y2="4"
                stroke={edgeColor(t)}
                strokeWidth="1.5"
                strokeDasharray={t === "WAR" ? "3,2" : t === "WAW" ? "1,2" : "none"}
              />
            </svg>
            <span className="text-xs font-mono" style={{ color: edgeColor(t) }}>
              {t}
            </span>
          </div>
        ))}
        <span className="text-xs text-gray-600 ml-2">
          {edges.filter(e => e.type === "RAW").length} RAW ·{" "}
          {edges.filter(e => e.type === "WAR").length} WAR ·{" "}
          {edges.filter(e => e.type === "WAW").length} WAW
        </span>
      </div>

      <svg
        width={svgW}
        height={svgH}
        className="block"
        style={{ minWidth: svgW }}
      >
        <defs>
          {(["RAW", "WAR", "WAW"] as const).map((t) => (
            <marker
              key={t}
              id={`arrow-${t}`}
              markerWidth="8"
              markerHeight="8"
              refX="6"
              refY="3"
              orient="auto"
            >
              <path d="M0,0 L0,6 L8,3 z" fill={edgeColor(t)} opacity={0.8} />
            </marker>
          ))}
        </defs>

        {/* Edges */}
        {edges.map((edge, i) => {
          const from = nodes[edge.from];
          const to = nodes[edge.to];
          if (!from || !to) return null;

          const x1 = from.x + NODE_W / 2;
          const y1 = from.y + NODE_H;
          const x2 = to.x + NODE_W / 2;
          const y2 = to.y;
          const midY = (y1 + y2) / 2;

          const color = edgeColor(edge.type);
          const dashArray =
            edge.type === "WAR" ? "4,3" : edge.type === "WAW" ? "2,3" : undefined;

          return (
            <g key={i}>
              <path
                d={`M${x1},${y1} C${x1},${midY} ${x2},${midY} ${x2},${y2}`}
                fill="none"
                stroke={color}
                strokeWidth="1.5"
                strokeDasharray={dashArray}
                opacity={0.7}
                markerEnd={`url(#arrow-${edge.type})`}
              />
              {/* Register label */}
              <text
                x={(x1 + x2) / 2}
                y={midY - 3}
                textAnchor="middle"
                fontSize="9"
                fill={color}
                opacity={0.9}
                fontFamily="JetBrains Mono, monospace"
              >
                {edge.register}
              </text>
            </g>
          );
        })}

        {/* Nodes */}
        {nodes.map(({ x, y, instr }) => {
          const hasHazard = instr.hazards.length > 0;
          const label = instr.parsed.raw.replace(/#.*$/, "").trim();
          const shortLabel = label.length > 18 ? label.slice(0, 17) + "…" : label;

          return (
            <g key={instr.id}>
              <rect
                x={x}
                y={y}
                width={NODE_W}
                height={NODE_H}
                rx={6}
                fill="rgba(17,24,39,0.9)"
                stroke={hasHazard ? "rgba(245,158,11,0.4)" : "rgba(255,255,255,0.1)"}
                strokeWidth="1"
              />
              <text
                x={x + 8}
                y={y + 14}
                fontSize="9"
                fill="#6b7280"
                fontFamily="JetBrains Mono, monospace"
              >
                #{instr.index + 1}
              </text>
              <text
                x={x + 8}
                y={y + 26}
                fontSize="10"
                fill={hasHazard ? "#fbbf24" : "#e5e7eb"}
                fontFamily="JetBrains Mono, monospace"
                fontWeight="500"
              >
                {shortLabel}
              </text>
              {hasHazard && (
                <circle
                  cx={x + NODE_W - 10}
                  cy={y + NODE_H / 2}
                  r="4"
                  fill="rgba(245,158,11,0.3)"
                  stroke="rgba(245,158,11,0.6)"
                  strokeWidth="1"
                />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
