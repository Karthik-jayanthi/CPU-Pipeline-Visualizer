"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function SimulationError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Simulation page error:", error);
  }, [error]);

  return (
    <div className="flex h-full items-center justify-center bg-void">
      <div className="glass-panel rounded-2xl p-8 text-center max-w-sm mx-4">
        <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={20} className="text-red-400" />
        </div>
        <h2 className="font-display text-lg font-semibold text-white mb-2">
          Something went wrong
        </h2>
        <p className="text-sm text-gray-500 mb-5 leading-relaxed">
          {error.message || "The simulator encountered an unexpected error."}
        </p>
        <button
          onClick={reset}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/12 border border-accent/30 text-accent text-sm font-medium hover:bg-accent/20 transition-all mx-auto"
        >
          <RotateCcw size={14} />
          Try again
        </button>
      </div>
    </div>
  );
}
