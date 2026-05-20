export interface SampleProgram {
  id: string;
  name: string;
  description: string;
  category: "basic" | "hazards" | "loops" | "advanced";
  source: string;
}

export const SAMPLE_PROGRAMS: SampleProgram[] = [
  {
    id: "basic-arithmetic",
    name: "Basic Arithmetic",
    description: "Simple register operations with no hazards",
    category: "basic",
    source: `# Basic arithmetic — no hazards
add $t0, $s0, $s1
sub $t1, $s2, $s3
and $t2, $s4, $s5
or  $t3, $s6, $s7
slt $t4, $t0, $t1`,
  },
  {
    id: "raw-hazard",
    name: "RAW Data Hazard",
    description: "Read-after-write hazard requiring forwarding or stalls",
    category: "hazards",
    source: `# RAW hazard chain
add $t0, $s0, $s1   # writes $t0
add $t1, $t0, $s2   # reads $t0 (RAW)
add $t2, $t1, $t0   # reads $t1, $t0 (RAW×2)
sub $t3, $t2, $s3
sw  $t3, 0($sp)`,
  },
  {
    id: "load-use",
    name: "Load-Use Hazard",
    description: "Load followed immediately by use — requires 1 stall cycle",
    category: "hazards",
    source: `# Load-use hazard (1 stall even with forwarding)
lw  $t0, 0($s0)     # load from memory
add $t1, $t0, $s1   # use $t0 immediately — STALL
lw  $t2, 4($s0)
sub $t3, $t2, $s2   # another load-use stall
and $t4, $t1, $t3`,
  },
  {
    id: "branch-hazard",
    name: "Control Hazard",
    description: "Branch instruction causing control hazard and pipeline flush",
    category: "hazards",
    source: `# Control hazard from branch
lw  $t0, 0($s0)
lw  $t1, 4($s0)
beq $t0, $t1, done  # branch — control hazard
add $t2, $t0, $t1   # possibly squashed
sub $t3, $t2, $s2   # possibly squashed
done:
add $t4, $t0, $t1`,
  },
  {
    id: "forwarding-chain",
    name: "Forwarding Chain",
    description: "Multiple forwarding paths — EX→EX and MEM→EX",
    category: "advanced",
    source: `# Forwarding resolves these without stalls
add $t0, $s0, $s1   # EX produces $t0
add $t1, $t0, $s2   # EX→EX forward of $t0
add $t2, $t0, $t1   # MEM→EX forward of $t0, EX→EX of $t1
lw  $t3, 0($s3)
add $t4, $t3, $t2   # MEM→EX forward of lw result (if no load-use)
sw  $t4, 8($s3)`,
  },
  {
    id: "fibonacci",
    name: "Fibonacci (n=8)",
    description: "Iterative Fibonacci — realistic loop with mixed hazards",
    category: "loops",
    source: `# Fibonacci: compute fib(8) iteratively
# $s0 = n=8, $t0 = fib_prev (a), $t1 = fib_curr (b), $t2 = temp
addi $t0, $0, 0     # a = 0
addi $t1, $0, 1     # b = 1
addi $s0, $0, 8     # counter = 8
addi $t5, $0, 1     # constant 1
loop:
add  $t2, $t0, $t1  # temp = a + b
add  $t0, $t1, $0   # a = b
add  $t1, $t2, $0   # b = temp
sub  $s0, $s0, $t5  # counter--
bne  $s0, $0, loop  # branch if counter != 0
sw   $t1, 0($sp)    # store result`,
  },
  {
    id: "array-sum",
    name: "Array Sum",
    description: "Sum 4 array elements — heavy load-use pattern",
    category: "loops",
    source: `# Sum array[0..3] into $v0
# $s0 = base address
addi $v0, $0,  0    # sum = 0
lw   $t0, 0($s0)    # load a[0]
lw   $t1, 4($s0)    # load a[1]
lw   $t2, 8($s0)    # load a[2]
lw   $t3, 12($s0)   # load a[3]
add  $t4, $t0, $t1  # partial sum
add  $t5, $t2, $t3  # partial sum
add  $v0, $t4, $t5  # final sum
sw   $v0, 0($sp)`,
  },
];
