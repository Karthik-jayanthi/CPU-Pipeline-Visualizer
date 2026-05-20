import type { SimulationResult, SimulationConfig } from "@/types/pipeline";

const STAGE_COLORS: Record<string, string> = {
  IF: "#3b82f6",
  ID: "#8b5cf6",
  EX: "#f59e0b",
  MEM: "#10b981",
  WB: "#ef4444",
  stall: "#ef4444",
};

/**
 * Generates a self-contained SVG timing diagram of the simulation.
 * Returns an SVG string that can be saved to file or opened inline.
 */
export function exportTimingDiagramSVG(result: SimulationResult): string {
  const CELL_W = 44;
  const CELL_H = 26;
  const LABEL_W = 180;
  const HEADER_H = 30;
  const ROW_GAP = 2;
  const PADDING = 12;

  const { instructions, totalCycles } = result;
  const rowCount = instructions.length;

  const svgW = LABEL_W + totalCycles * CELL_W + PADDING * 2;
  const svgH = HEADER_H + rowCount * (CELL_H + ROW_GAP) + PADDING * 2;

  // Build cell map
  const cellMap = new Map<string, string>();
  for (const instr of instructions) {
    for (const [stage, cycle] of Object.entries(instr.stages)) {
      cellMap.set(`${instr.id}:${cycle}`, stage);
    }
    const ifCycle = instr.stages["IF"] ?? 0;
    const expectedIf = instr.index + 1;
    for (let sc = expectedIf; sc < ifCycle; sc++) {
      cellMap.set(`${instr.id}:${sc}`, "stall");
    }
  }

  const rows: string[] = [];

  // Background
  rows.push(
    `<rect width="${svgW}" height="${svgH}" fill="#060810"/>`
  );

  // Grid header row
  rows.push(
    `<rect x="${PADDING}" y="${PADDING}" width="${LABEL_W}" height="${HEADER_H}" fill="#111827"/>`
  );
  rows.push(
    `<text x="${PADDING + LABEL_W / 2}" y="${PADDING + 20}" text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="11" fill="#6b7280">Instruction</text>`
  );

  for (let c = 1; c <= totalCycles; c++) {
    const cx = PADDING + LABEL_W + (c - 1) * CELL_W;
    rows.push(
      `<rect x="${cx}" y="${PADDING}" width="${CELL_W - 1}" height="${HEADER_H}" fill="#111827"/>`
    );
    rows.push(
      `<text x="${cx + CELL_W / 2}" y="${PADDING + 20}" text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="11" fill="#4b5563">${c}</text>`
    );
  }

  // Instruction rows
  for (let r = 0; r < rowCount; r++) {
    const instr = instructions[r];
    const rowY = PADDING + HEADER_H + r * (CELL_H + ROW_GAP);
    const bgFill = r % 2 === 0 ? "#0d1117" : "#0a0f17";
    const label = instr.parsed.raw.replace(/#.*$/, "").trim();
    const shortLabel = label.length > 26 ? label.slice(0, 25) + "…" : label;

    // Label cell
    rows.push(
      `<rect x="${PADDING}" y="${rowY}" width="${LABEL_W}" height="${CELL_H}" fill="${bgFill}"/>`
    );
    rows.push(
      `<text x="${PADDING + 8}" y="${rowY + 17}" font-family="JetBrains Mono,monospace" font-size="10" fill="#9ca3af">${r + 1}. ${shortLabel}</text>`
    );

    // Stage cells
    for (let c = 1; c <= totalCycles; c++) {
      const cx = PADDING + LABEL_W + (c - 1) * CELL_W;
      const stageKey = `${instr.id}:${c}`;
      const stage = cellMap.get(stageKey);
      const color = stage ? STAGE_COLORS[stage] : null;

      rows.push(
        `<rect x="${cx}" y="${rowY}" width="${CELL_W - 1}" height="${CELL_H}" fill="${bgFill}"/>`
      );

      if (color && stage) {
        const alpha = stage === "stall" ? "18" : "22";
        rows.push(
          `<rect x="${cx + 1}" y="${rowY + 1}" width="${CELL_W - 3}" height="${CELL_H - 2}" rx="4" fill="${color}${alpha}" stroke="${color}66" stroke-width="1"/>`
        );
        rows.push(
          `<text x="${cx + (CELL_W - 1) / 2}" y="${rowY + 17}" text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="9" font-weight="600" fill="${color}">${stage === "stall" ? "—" : stage}</text>`
        );
      }
    }
  }

  // Legend
  const legendY = svgH - 20;
  const stages = [
    ["IF", "#3b82f6"],
    ["ID", "#8b5cf6"],
    ["EX", "#f59e0b"],
    ["MEM", "#10b981"],
    ["WB", "#ef4444"],
    ["stall", "#ef4444"],
  ];
  let legendX = PADDING;
  for (const [name, color] of stages) {
    rows.push(
      `<rect x="${legendX}" y="${legendY - 8}" width="8" height="8" rx="2" fill="${color}" opacity="0.7"/>`
    );
    rows.push(
      `<text x="${legendX + 11}" y="${legendY}" font-family="JetBrains Mono,monospace" font-size="9" fill="#4b5563">${name}</text>`
    );
    legendX += name === "stall" ? 60 : 46;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}">
  ${rows.join("\n  ")}
</svg>`;
}

/**
 * Export full simulation data as a structured JSON report.
 */
export function exportReportJSON(
  result: SimulationResult,
  config: SimulationConfig,
  programText: string
): string {
  const report = {
    exported_at: new Date().toISOString(),
    program: programText.trim(),
    config,
    summary: {
      total_instructions: result.totalInstructions,
      total_cycles: result.totalCycles,
      cpi: parseFloat(result.cpi.toFixed(4)),
      stall_cycles: result.stallCycles,
      forwarding_count: result.forwardingCount,
      hazards: result.hazardCount,
      efficiency_pct: parseFloat(
        ((result.totalInstructions / result.totalCycles) * 100).toFixed(2)
      ),
    },
    instructions: result.instructions.map((instr) => ({
      index: instr.index + 1,
      raw: instr.parsed.raw.trim(),
      type: instr.parsed.type,
      stalls: instr.stalls,
      stages: instr.stages,
      hazards: instr.hazards,
    })),
  };

  return JSON.stringify(report, null, 2);
}

export function triggerDownload(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
