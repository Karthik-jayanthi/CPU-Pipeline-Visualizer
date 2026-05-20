export default function SimulationLoading() {
  return (
    <div className="flex h-full items-center justify-center bg-void">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-xl border border-accent/30 flex items-center justify-center relative">
          <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
        <span className="text-xs font-mono text-gray-600">Loading simulator…</span>
      </div>
    </div>
  );
}
