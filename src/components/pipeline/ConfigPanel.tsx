"use client";

import { Settings2 } from "lucide-react";
import type { SimulationConfig } from "@/types/pipeline";

interface Props {
  config: SimulationConfig;
  onChange: (c: SimulationConfig) => void;
}

export function ConfigPanel({ config, onChange }: Props) {
  function set<K extends keyof SimulationConfig>(key: K, val: SimulationConfig[K]) {
    onChange({ ...config, [key]: val });
  }

  return (
    <div className="glass-panel rounded-xl h-full flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/5 shrink-0">
        <Settings2 size={13} className="text-gray-500" />
        <span className="text-xs font-mono text-gray-400">CONFIG</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-4">
        {/* Forwarding toggle */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-gray-400 font-medium">
              Data Forwarding
            </label>
            <Toggle
              checked={config.enableForwarding}
              onChange={(v) => set("enableForwarding", v)}
            />
          </div>
          <p className="text-xs text-gray-600 leading-tight">
            EX→EX and MEM→EX paths eliminate most RAW stalls
          </p>
        </div>

        {/* Load-use stall */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-gray-400 font-medium">
              Load-Use Stall
            </label>
            <Toggle
              checked={config.stallOnLoad}
              onChange={(v) => set("stallOnLoad", v)}
              disabled={!config.enableForwarding}
            />
          </div>
          <p className="text-xs text-gray-600 leading-tight">
            1-cycle stall required after LW even with forwarding
          </p>
        </div>

        {/* Branch prediction */}
        <div>
          <label className="text-xs text-gray-400 font-medium block mb-2">
            Branch Prediction
          </label>
          <div className="flex flex-col gap-1">
            {(
              [
                ["none", "No prediction (stall)"],
                ["always-not-taken", "Always not taken"],
                ["always-taken", "Always taken"],
                ["dynamic", "Dynamic (1-bit)"],
              ] as [SimulationConfig["branchPrediction"], string][]
            ).map(([val, label]) => (
              <label
                key={val}
                className="flex items-center gap-2 cursor-pointer group"
              >
                <div
                  className="w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 transition-all"
                  style={{
                    borderColor:
                      config.branchPrediction === val
                        ? "#00d4ff"
                        : "#374151",
                    background:
                      config.branchPrediction === val
                        ? "rgba(0,212,255,0.2)"
                        : "transparent",
                  }}
                  onClick={() => set("branchPrediction", val)}
                >
                  {config.branchPrediction === val && (
                    <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                  )}
                </div>
                <span
                  className="text-xs transition-colors"
                  style={{
                    color:
                      config.branchPrediction === val ? "#e5e7eb" : "#6b7280",
                  }}
                >
                  {label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="mt-auto pt-2 border-t border-white/5">
          <p className="text-xs text-gray-700 leading-relaxed">
            Changes take effect on next simulation run
          </p>
        </div>
      </div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      className={`relative w-9 h-5 rounded-full transition-all shrink-0 ${
        disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"
      }`}
      style={{
        background: checked
          ? "rgba(0,212,255,0.3)"
          : "rgba(255,255,255,0.08)",
        border: `1px solid ${checked ? "rgba(0,212,255,0.5)" : "rgba(255,255,255,0.12)"}`,
      }}
    >
      <div
        className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
        style={{
          left: checked ? "calc(100% - 18px)" : "2px",
          background: checked ? "#00d4ff" : "#4b5563",
        }}
      />
    </button>
  );
}
