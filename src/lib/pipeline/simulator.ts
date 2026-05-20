import { parseAssembly, getWriteRegister, getReadRegisters } from "./parser";
import type {
  PipelineInstruction,
  CycleSnapshot,
  SimulationResult,
  SimulationConfig,
  HazardRecord,
  ForwardingPath,
  PipelineStage,
} from "@/types/pipeline";

const STAGES: PipelineStage[] = ["IF", "ID", "EX", "MEM", "WB"];

export function simulate(
  source: string,
  config: SimulationConfig
): SimulationResult {
  const parsed = parseAssembly(source);
  if (!parsed.length) {
    return emptyResult();
  }

  const instrCount = parsed.length;
  // Build instruction objects
  const instructions: PipelineInstruction[] = parsed.map((p, i) => ({
    id: `instr-${i}`,
    index: i,
    parsed: p,
    stages: {},
    stalls: 0,
    hazards: [],
    isSquashed: false,
    isNop: p.type === "NOP",
  }));

  // Simulate cycle by cycle
  // Each instruction progresses through 5 stages.
  // We track when each instruction enters each stage.

  // instrCycle[i] = the cycle in which instruction i enters IF
  const instrStartCycle: number[] = new Array(instrCount).fill(0);

  // Compute start cycles considering hazards / stalls
  for (let i = 0; i < instrCount; i++) {
    if (i === 0) {
      instrStartCycle[i] = 1;
      continue;
    }

    // Earliest possible start: previous instruction + 1
    let earliest = instrStartCycle[i - 1] + 1;

    const curr = instructions[i];
    const currReads = getReadRegisters(curr.parsed);

    // Check data hazards against previous instructions
    for (let j = Math.max(0, i - 4); j < i; j++) {
      const prev = instructions[j];
      const prevWrite = getWriteRegister(prev.parsed);
      if (!prevWrite) continue;

      const gap = i - j; // instruction distance
      const prevStart = instrStartCycle[j];

      // Prev instruction's EX stage: prevStart + 2
      // Curr instruction's ID stage: earliest + 1
      // For forwarding: EX->EX forward available if prevEX <= currEX
      // Without forwarding: WB must complete before ID reads

      const prevExCycle = prevStart + 2;
      const prevMemCycle = prevStart + 3;
      const prevWbCycle = prevStart + 4;

      if (currReads.includes(prevWrite)) {
        if (!config.enableForwarding) {
          // Need WB (cycle prevStart+4) to complete before ID (earliest+1)
          // So: earliest + 1 > prevStart + 4 => earliest >= prevStart + 4
          const needed = prevWbCycle; // ID at prevWbCycle means IF at prevWbCycle-1
          if (earliest < needed) {
            const stallsNeeded = needed - earliest;
            curr.stalls += stallsNeeded;
            const hazard: HazardRecord = {
              type: "data",
              cycle: earliest + 1,
              sourceInstrIdx: j,
              targetInstrIdx: i,
              description: `RAW hazard on ${prevWrite}: instr ${j + 1} → instr ${i + 1}`,
              resolvedBy: "stall",
            };
            curr.hazards.push(hazard);
            earliest = needed;
          }
        } else {
          // With forwarding:
          // EX->EX: prev EX result available at end of EX (prevStart+2), usable by curr EX (earliest+2)
          // MEM->EX: prev MEM result available at end of MEM (prevStart+3), usable by curr EX
          // Load-use: LOAD writes at end of MEM, so need curr ID to wait 1 cycle

          if (prev.parsed.type === "LOAD" && config.stallOnLoad) {
            // Load-use hazard: 1 mandatory stall
            const needed = prevStart + 2; // curr IF must be at prevStart+1, ID at prevStart+2
            if (earliest <= prevStart) {
              const stallsNeeded = prevStart + 1 - earliest;
              if (stallsNeeded > 0) {
                curr.stalls += stallsNeeded;
                earliest = prevStart + 1;
              }
              const hazard: HazardRecord = {
                type: "data",
                cycle: earliest + 1,
                sourceInstrIdx: j,
                targetInstrIdx: i,
                description: `Load-use hazard on ${prevWrite}: lw instr ${j + 1} → instr ${i + 1} (1 stall)`,
                resolvedBy: "stall",
              };
              curr.hazards.push(hazard);
            } else {
              // Forwarding resolves it
              const hazard: HazardRecord = {
                type: "data",
                cycle: prevExCycle,
                sourceInstrIdx: j,
                targetInstrIdx: i,
                description: `Data hazard on ${prevWrite} resolved by MEM→EX forwarding`,
                resolvedBy: "forwarding",
              };
              curr.hazards.push(hazard);
            }
          } else {
            // Normal forwarding: EX->EX or MEM->EX
            // Check if we need a stall (gap is too tight for forwarding)
            // Forwarding from EX: prev EX done at prevStart+2, curr EX starts at earliest+2
            // If gap >= 1, EX->EX forwarding works for most cases
            const currExCycle = earliest + 2;
            if (currExCycle < prevExCycle) {
              // Need to stall until forwarding is possible
              const needed = prevExCycle - 2; // curr IF cycle
              const stallsNeeded = needed - earliest;
              if (stallsNeeded > 0) {
                curr.stalls += stallsNeeded;
                earliest = needed;
              }
            }
            if (curr.hazards.every((h) => h.sourceInstrIdx !== j)) {
              const hazard: HazardRecord = {
                type: "data",
                cycle: prevExCycle,
                sourceInstrIdx: j,
                targetInstrIdx: i,
                description: `Data hazard on ${prevWrite} resolved by EX→EX forwarding`,
                resolvedBy: "forwarding",
              };
              curr.hazards.push(hazard);
            }
          }
        }
      }
    }

    // Control hazards from branches
    if (i > 0) {
      const prevInstr = instructions[i - 1];
      if (
        prevInstr.parsed.type === "BRANCH" ||
        prevInstr.parsed.type === "J"
      ) {
        const branchStart = instrStartCycle[i - 1];
        // Branch resolved at end of EX: branchStart+2
        // With "always not taken": speculative fetch, flush on taken
        if (config.branchPrediction === "none") {
          // Stall until branch resolves (2 cycles)
          const needed = branchStart + 3;
          if (earliest < needed) {
            const stallsNeeded = needed - earliest;
            curr.stalls += stallsNeeded;
            const hazard: HazardRecord = {
              type: "control",
              cycle: branchStart + 1,
              sourceInstrIdx: i - 1,
              targetInstrIdx: i,
              description: `Control hazard: branch at instr ${i} causes ${stallsNeeded} stall(s)`,
              resolvedBy: "stall",
            };
            curr.hazards.push(hazard);
            earliest = needed;
          }
        }
        // For "always-not-taken" we speculatively execute but may flush
        // For simulation purposes we show 1 stall penalty on average
      }
    }

    instrStartCycle[i] = earliest;
  }

  // Assign stage cycles
  for (let i = 0; i < instrCount; i++) {
    const start = instrStartCycle[i];
    STAGES.forEach((stage, si) => {
      instructions[i].stages[stage] = start + si;
    });
  }

  const totalCycles =
    instrStartCycle[instrCount - 1] + STAGES.length - 1;

  // Build cycle snapshots
  const cycles: CycleSnapshot[] = [];
  for (let c = 1; c <= totalCycles; c++) {
    const stageOccupancy: Record<PipelineStage, string | null> = {
      IF: null, ID: null, EX: null, MEM: null, WB: null,
    };
    const activeHazards: HazardRecord[] = [];
    const forwardingPaths: ForwardingPath[] = [];
    const activeStalls: string[] = [];

    for (const instr of instructions) {
      for (const stage of STAGES) {
        if (instr.stages[stage] === c) {
          stageOccupancy[stage] = instr.id;
        }
      }
      // Mark stall cycles
      const ifCycle = instr.stages["IF"] ?? 0;
      const expectedIf = instr.index === 0 ? 1 : instrStartCycle[instr.index - 1] + 1;
      if (instr.stalls > 0 && c >= expectedIf && c < ifCycle) {
        activeStalls.push(instr.id);
      }
      // Collect hazards for this cycle
      for (const hz of instr.hazards) {
        if (Math.abs(hz.cycle - c) <= 1) {
          activeHazards.push(hz);
        }
        if (hz.resolvedBy === "forwarding" && hz.cycle === c) {
          const srcInstr = instructions[hz.sourceInstrIdx];
          const dstInstr = instructions[hz.targetInstrIdx];
          // Determine forwarding path
          const srcStage = Object.entries(srcInstr.stages).find(
            ([, cyc]) => cyc === c
          )?.[0] as PipelineStage | undefined;
          const dstStage = Object.entries(dstInstr.stages).find(
            ([, cyc]) => cyc === c
          )?.[0] as PipelineStage | undefined;
          if (srcStage && dstStage) {
            const wr = getWriteRegister(srcInstr.parsed);
            if (wr) {
              forwardingPaths.push({
                from: srcStage,
                to: dstStage,
                instrId: srcInstr.id,
                register: wr,
              });
            }
          }
        }
      }
    }

    cycles.push({
      cycle: c,
      stages: stageOccupancy,
      activeStalls,
      activeHazards,
      forwardingPaths,
    });
  }

  // Aggregate stats
  const totalStalls = instructions.reduce((s, i) => s + i.stalls, 0);
  const hazardCount = { data: 0, control: 0, structural: 0 };
  let forwardingCount = 0;

  for (const instr of instructions) {
    for (const hz of instr.hazards) {
      if (hz.type === "data") hazardCount.data++;
      else if (hz.type === "control") hazardCount.control++;
      else if (hz.type === "structural") hazardCount.structural++;
      if (hz.resolvedBy === "forwarding") forwardingCount++;
    }
  }

  return {
    instructions,
    cycles,
    totalCycles,
    totalInstructions: instrCount,
    cpi: totalCycles / instrCount,
    hazardCount,
    stallCycles: totalStalls,
    forwardingCount,
    branchMispredictions: 0,
  };
}

function emptyResult(): SimulationResult {
  return {
    instructions: [],
    cycles: [],
    totalCycles: 0,
    totalInstructions: 0,
    cpi: 0,
    hazardCount: { data: 0, control: 0, structural: 0 },
    stallCycles: 0,
    forwardingCount: 0,
    branchMispredictions: 0,
  };
}
