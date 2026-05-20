import type { ParsedInstruction, InstructionType } from "@/types/pipeline";

// Supported opcodes and their classifications
const OPCODE_MAP: Record<
  string,
  { type: InstructionType; reads: string[]; writes: string[] }
> = {
  add: { type: "R", reads: ["rs", "rt"], writes: ["rd"] },
  sub: { type: "R", reads: ["rs", "rt"], writes: ["rd"] },
  and: { type: "R", reads: ["rs", "rt"], writes: ["rd"] },
  or: { type: "R", reads: ["rs", "rt"], writes: ["rd"] },
  slt: { type: "R", reads: ["rs", "rt"], writes: ["rd"] },
  sll: { type: "R", reads: ["rt"], writes: ["rd"] },
  srl: { type: "R", reads: ["rt"], writes: ["rd"] },
  addi: { type: "I", reads: ["rs"], writes: ["rt"] },
  andi: { type: "I", reads: ["rs"], writes: ["rt"] },
  ori: { type: "I", reads: ["rs"], writes: ["rt"] },
  slti: { type: "I", reads: ["rs"], writes: ["rt"] },
  lw: { type: "LOAD", reads: ["rs"], writes: ["rt"] },
  sw: { type: "STORE", reads: ["rs", "rt"], writes: [] },
  beq: { type: "BRANCH", reads: ["rs", "rt"], writes: [] },
  bne: { type: "BRANCH", reads: ["rs", "rt"], writes: [] },
  j: { type: "J", reads: [], writes: [] },
  jal: { type: "J", reads: [], writes: ["$ra"] },
  jr: { type: "R", reads: ["rs"], writes: [] },
  nop: { type: "NOP", reads: [], writes: [] },
  move: { type: "R", reads: ["rs"], writes: ["rd"] },
  li: { type: "I", reads: [], writes: ["rt"] },
};

function normalizeRegister(reg: string): string {
  const r = reg.trim().replace(",", "");
  // Handle $0-$31, $zero, $at, $v0-$v1, $a0-$a3, $t0-$t9, $s0-$s7, $ra etc.
  const aliases: Record<string, string> = {
    $zero: "$0", $at: "$1",
    $v0: "$2", $v1: "$3",
    $a0: "$4", $a1: "$5", $a2: "$6", $a3: "$7",
    $t0: "$8", $t1: "$9", $t2: "$10", $t3: "$11",
    $t4: "$12", $t5: "$13", $t6: "$14", $t7: "$15",
    $s0: "$16", $s1: "$17", $s2: "$18", $s3: "$19",
    $s4: "$20", $s5: "$21", $s6: "$22", $s7: "$23",
    $t8: "$24", $t9: "$25",
    $k0: "$26", $k1: "$27",
    $gp: "$28", $sp: "$29", $fp: "$30", $ra: "$31",
  };
  return aliases[r] ?? r;
}

function parseMemoryOperand(operand: string): { reg: string; offset: number } {
  // e.g. "8($t1)" or "($s0)"
  const match = operand.match(/^(-?\d+)?\((\$\w+)\)$/);
  if (match) {
    return {
      offset: match[1] ? parseInt(match[1]) : 0,
      reg: normalizeRegister(match[2]),
    };
  }
  return { reg: operand, offset: 0 };
}

export function parseAssembly(source: string): ParsedInstruction[] {
  const lines = source
    .split("\n")
    .map((l) => l.replace(/#.*$/, "").trim()) // strip comments
    .filter((l) => l.length > 0);

  const instructions: ParsedInstruction[] = [];

  for (const line of lines) {
    // Strip label prefixes like "loop:"
    const withoutLabel = line.replace(/^\w+:\s*/, "");
    const label = line !== withoutLabel ? line.split(":")[0] : undefined;

    const parts = withoutLabel.split(/[\s,]+/).filter((p) => p.length > 0);
    if (!parts.length) continue;

    const op = parts[0].toLowerCase();
    const info = OPCODE_MAP[op];

    if (!info) {
      // Unknown opcode — treat as NOP to avoid crashing
      instructions.push({
        raw: line,
        type: "NOP",
        op,
        label,
      });
      continue;
    }

    const instr: ParsedInstruction = { raw: line, type: info.type, op, label };

    if (op === "nop") {
      instr.type = "NOP";
    } else if (info.type === "R") {
      instr.rd = normalizeRegister(parts[1] ?? "");
      instr.rs = normalizeRegister(parts[2] ?? "");
      instr.rt = normalizeRegister(parts[3] ?? "");
    } else if (info.type === "LOAD") {
      instr.rt = normalizeRegister(parts[1] ?? "");
      const mem = parseMemoryOperand(parts[2] ?? "");
      instr.rs = mem.reg;
      instr.imm = mem.offset;
    } else if (info.type === "STORE") {
      instr.rt = normalizeRegister(parts[1] ?? "");
      const mem = parseMemoryOperand(parts[2] ?? "");
      instr.rs = mem.reg;
      instr.imm = mem.offset;
    } else if (info.type === "BRANCH") {
      instr.rs = normalizeRegister(parts[1] ?? "");
      instr.rt = normalizeRegister(parts[2] ?? "");
      instr.label = parts[3];
    } else if (info.type === "J") {
      instr.label = parts[1];
    } else if (info.type === "I") {
      instr.rt = normalizeRegister(parts[1] ?? "");
      instr.rs = normalizeRegister(parts[2] ?? "");
      instr.imm = parseInt(parts[3] ?? "0");
    }

    instructions.push(instr);
  }

  return instructions;
}

export function getWriteRegister(instr: ParsedInstruction): string | null {
  if (instr.type === "R") return instr.rd ?? null;
  if (instr.type === "LOAD" || instr.type === "I") return instr.rt ?? null;
  if (instr.type === "J" && instr.op === "jal") return "$31";
  return null;
}

export function getReadRegisters(instr: ParsedInstruction): string[] {
  const regs: string[] = [];
  if (instr.rs) regs.push(instr.rs);
  if (instr.type !== "LOAD" && instr.type !== "I" && instr.rt) regs.push(instr.rt);
  if (instr.type === "STORE" && instr.rt) regs.push(instr.rt);
  return regs.filter((r) => r !== "$0" && r !== "$zero");
}
