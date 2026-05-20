// Core domain types for CPU pipeline simulation

export type PipelineStage = "IF" | "ID" | "EX" | "MEM" | "WB";

export type HazardType = "data" | "control" | "structural" | "none";

export type InstructionType =
  | "R" // Register-register (add, sub, and, or, slt)
  | "I" // Immediate (addi, lw, sw, beq, bne)
  | "J" // Jump
  | "LOAD"
  | "STORE"
  | "BRANCH"
  | "NOP";

export interface ParsedInstruction {
  raw: string;
  type: InstructionType;
  op: string;
  rd?: string;
  rs?: string;
  rt?: string;
  imm?: number;
  label?: string;
}

export interface PipelineInstruction {
  id: string;
  index: number;
  parsed: ParsedInstruction;
  stages: Partial<Record<PipelineStage, number>>; // stage -> cycle it executes in
  stalls: number; // number of stall cycles inserted before this instruction
  hazards: HazardRecord[];
  isSquashed: boolean; // branch misprediction flush
  isNop: boolean;
}

export interface HazardRecord {
  type: HazardType;
  cycle: number;
  sourceInstrIdx: number;
  targetInstrIdx: number;
  description: string;
  resolvedBy: "forwarding" | "stall" | "flush" | "none";
}

export interface CycleSnapshot {
  cycle: number;
  stages: Record<PipelineStage, string | null>; // stage -> instruction id or null
  activeStalls: string[]; // instruction ids stalled this cycle
  activeHazards: HazardRecord[];
  forwardingPaths: ForwardingPath[];
  branchResolved?: boolean;
}

export interface ForwardingPath {
  from: PipelineStage;
  to: PipelineStage;
  instrId: string;
  register: string;
}

export interface SimulationResult {
  instructions: PipelineInstruction[];
  cycles: CycleSnapshot[];
  totalCycles: number;
  totalInstructions: number;
  cpi: number;
  hazardCount: {
    data: number;
    control: number;
    structural: number;
  };
  stallCycles: number;
  forwardingCount: number;
  branchMispredictions: number;
}

export interface SimulationConfig {
  enableForwarding: boolean;
  branchPrediction: "none" | "always-not-taken" | "always-taken" | "dynamic";
  stallOnLoad: boolean; // load-use hazard requires 1 stall even with forwarding
}

export const DEFAULT_SIM_CONFIG: SimulationConfig = {
  enableForwarding: true,
  branchPrediction: "always-not-taken",
  stallOnLoad: true,
};

// Supabase DB row shapes
export interface SimulationRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  program_text: string;
  config: SimulationConfig;
  result_summary: {
    totalCycles: number;
    cpi: number;
    stallCycles: number;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

// UI state types
export type PlaybackState = "idle" | "playing" | "paused" | "finished";

export interface SimulatorUIState {
  currentCycle: number;
  playback: PlaybackState;
  clockSpeed: number; // ms per cycle
  selectedInstrId: string | null;
  highlightedHazard: HazardRecord | null;
  showForwarding: boolean;
  showDependencyGraph: boolean;
}
