import Link from "next/link";
import { ArrowRight, Cpu, Zap, GitBranch, BarChart3, Shield, Clock } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-void relative overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,212,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.04) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Radial glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] opacity-20 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0,212,255,0.3) 0%, rgba(59,130,246,0.1) 40%, transparent 70%)",
        }}
      />

      <div className="relative z-10">
        {/* Nav */}
        <nav className="flex items-center justify-between px-8 py-5 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center">
              <Cpu size={16} className="text-accent" />
            </div>
            <span className="font-display font-semibold text-white tracking-tight">
              PipelineViz
            </span>
            <span className="text-xs text-gray-600 font-mono ml-1">v0.1.0</span>
          </div>
          <div className="flex items-center gap-6">
            <a
              href="https://github.com"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              GitHub
            </a>
            <Link
              href="/auth"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/simulation"
              className="text-sm px-4 py-1.5 rounded-md bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 transition-all"
            >
              Launch →
            </Link>
          </div>
        </nav>

        {/* Hero */}
        <section className="max-w-5xl mx-auto px-8 pt-28 pb-20 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/20 bg-accent/5 text-accent text-xs font-mono mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            5-Stage MIPS Pipeline Simulator
          </div>

          <h1 className="font-display text-6xl font-bold text-white leading-[1.08] tracking-tight mb-6">
            Visualize CPU pipelines
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-blue-400 to-purple-400">
              cycle by cycle
            </span>
          </h1>

          <p className="text-gray-400 text-xl leading-relaxed max-w-2xl mx-auto mb-10">
            Interactive simulation of a 5-stage MIPS pipeline with real-time hazard
            detection, data forwarding paths, branch prediction, and performance
            analytics. Built for engineers and students serious about computer architecture.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link
              href="/simulation"
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-accent text-void font-semibold hover:bg-accent/90 transition-all shadow-glow-accent"
            >
              Open Simulator
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/auth"
              className="flex items-center gap-2 px-6 py-3 rounded-lg border border-white/10 text-gray-300 hover:border-white/20 hover:text-white transition-all"
            >
              Sign up free
            </Link>
          </div>
        </section>

        {/* Feature grid */}
        <section className="max-w-5xl mx-auto px-8 pb-24">
          <div className="grid grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </section>

        {/* Pipeline preview graphic */}
        <section className="max-w-5xl mx-auto px-8 pb-28">
          <PipelinePreview />
        </section>

        {/* Footer */}
        <footer className="border-t border-white/5 px-8 py-6 text-center text-xs text-gray-600 font-mono">
          PipelineViz · Built with Next.js 15, Supabase, Framer Motion
        </footer>
      </div>
    </main>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  color,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <div className="glass-panel rounded-xl p-5 group hover:border-white/10 transition-all">
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center mb-4"
        style={{ background: `${color}18`, border: `1px solid ${color}30` }}
      >
        <Icon size={16} style={{ color }} />
      </div>
      <h3 className="font-display font-semibold text-white text-sm mb-1.5">
        {title}
      </h3>
      <p className="text-gray-500 text-xs leading-relaxed">{description}</p>
    </div>
  );
}

function PipelinePreview() {
  const stages = [
    { label: "IF", name: "Instruction Fetch", color: "#3b82f6" },
    { label: "ID", name: "Instruction Decode", color: "#8b5cf6" },
    { label: "EX", name: "Execute", color: "#f59e0b" },
    { label: "MEM", name: "Memory Access", color: "#10b981" },
    { label: "WB", name: "Write Back", color: "#ef4444" },
  ];

  return (
    <div className="glass-panel rounded-2xl p-6 border-glow-accent">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
        <span className="text-xs font-mono text-accent">PIPELINE STAGES</span>
      </div>
      <div className="flex gap-2">
        {stages.map((s, i) => (
          <div key={s.label} className="flex-1 flex flex-col items-center">
            <div
              className="w-full h-14 rounded-lg flex flex-col items-center justify-center gap-1 text-white font-mono relative overflow-hidden"
              style={{
                background: `${s.color}22`,
                border: `1px solid ${s.color}44`,
                boxShadow: `0 0 20px ${s.color}18`,
              }}
            >
              <span className="text-lg font-bold" style={{ color: s.color }}>
                {s.label}
              </span>
            </div>
            <div className="mt-2 text-xs text-gray-500 text-center leading-tight">
              {s.name}
            </div>
            {i < stages.length - 1 && (
              <div
                className="absolute"
                style={{ left: `${(i + 1) * 20}%`, top: "calc(50% + 16px)" }}
              />
            )}
          </div>
        ))}
      </div>
      {/* Sample timing grid */}
      <div className="mt-6 overflow-x-auto">
        <div className="font-mono text-xs">
          <div className="grid grid-cols-10 gap-1 mb-2">
            <div className="text-gray-600 text-right pr-2">Cycle</div>
            {Array.from({ length: 9 }, (_, i) => (
              <div key={i} className="text-center text-gray-500">
                {i + 1}
              </div>
            ))}
          </div>
          {[
            { label: "add $t0,…", stages: ["IF", "ID", "EX", "MEM", "WB", "", "", "", ""] },
            { label: "add $t1,…", stages: ["", "IF", "ID", "EX", "MEM", "WB", "", "", ""] },
            { label: "lw $t2,…", stages: ["", "", "IF", "ID", "EX", "MEM", "WB", "", ""] },
            { label: "sub $t3,…", stages: ["", "", "", "IF", "stall", "ID", "EX", "MEM", "WB"] },
          ].map((row) => (
            <div key={row.label} className="grid grid-cols-10 gap-1 mb-1">
              <div className="text-gray-500 text-right pr-2 truncate">{row.label}</div>
              {row.stages.map((s, i) => (
                <div
                  key={i}
                  className="h-7 rounded flex items-center justify-center text-xs font-bold"
                  style={getCellStyle(s)}
                >
                  {s || ""}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function getCellStyle(stage: string) {
  const stageColors: Record<string, string> = {
    IF: "#3b82f6", ID: "#8b5cf6", EX: "#f59e0b", MEM: "#10b981", WB: "#ef4444",
  };
  if (stage === "stall") {
    return {
      background: "rgba(239,68,68,0.12)",
      border: "1px solid rgba(239,68,68,0.3)",
      color: "#ef4444",
    };
  }
  const c = stageColors[stage];
  if (!c) return { background: "transparent" };
  return {
    background: `${c}22`,
    border: `1px solid ${c}44`,
    color: c,
  };
}

const FEATURES = [
  {
    icon: Zap,
    title: "Real-time Simulation",
    description:
      "Cycle-by-cycle animation of instruction flow through all 5 pipeline stages with adjustable clock speed.",
    color: "#f59e0b",
  },
  {
    icon: Shield,
    title: "Hazard Detection",
    description:
      "Automatic detection of RAW data hazards, control hazards from branches, and load-use stalls.",
    color: "#ef4444",
  },
  {
    icon: GitBranch,
    title: "Data Forwarding",
    description:
      "Visual EX→EX and MEM→EX forwarding paths that eliminate unnecessary stalls.",
    color: "#3b82f6",
  },
  {
    icon: BarChart3,
    title: "Performance Analytics",
    description:
      "CPI calculation, stall cycle breakdown, hazard frequency analysis, and forwarding efficiency.",
    color: "#10b981",
  },
  {
    icon: Clock,
    title: "Timing Diagram",
    description:
      "Classic pipeline timing grid showing all instructions across cycles — exportable as SVG.",
    color: "#8b5cf6",
  },
  {
    icon: Cpu,
    title: "Save & Share",
    description:
      "Authenticated users can save, name, and reload simulation sessions with Supabase persistence.",
    color: "#00d4ff",
  },
];
