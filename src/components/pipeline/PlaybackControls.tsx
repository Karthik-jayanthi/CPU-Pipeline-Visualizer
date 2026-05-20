"use client";

import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { PlaybackState } from "@/types/pipeline";

interface Props {
  playback: PlaybackState;
  currentCycle: number;
  totalCycles: number;
  clockSpeed: number;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onSeek: (cycle: number) => void;
  onSpeedChange: (ms: number) => void;
}

const SPEED_PRESETS = [
  { label: "0.25×", ms: 2000 },
  { label: "0.5×",  ms: 1200 },
  { label: "1×",    ms: 600  },
  { label: "2×",    ms: 300  },
  { label: "4×",    ms: 150  },
];

export function PlaybackControls({
  playback,
  currentCycle,
  totalCycles,
  clockSpeed,
  onPlay,
  onPause,
  onReset,
  onStepForward,
  onStepBackward,
  onSeek,
  onSpeedChange,
}: Props) {
  const progress = totalCycles > 0 ? (currentCycle / totalCycles) * 100 : 0;
  const isPlaying = playback === "playing";
  const currentPreset = SPEED_PRESETS.find((p) => p.ms === clockSpeed);

  return (
    <div className="glass-panel rounded-xl px-4 py-2.5 flex items-center gap-4">
      {/* Transport controls */}
      <div className="flex items-center gap-1">
        <ControlBtn onClick={onReset} title="Reset">
          <RotateCcw size={13} />
        </ControlBtn>
        <ControlBtn onClick={onStepBackward} title="Step back" disabled={currentCycle <= 1}>
          <ChevronLeft size={14} />
        </ControlBtn>

        <button
          onClick={isPlaying ? onPause : onPlay}
          className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent/15 border border-accent/35 text-accent hover:bg-accent/25 transition-all"
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause size={14} className="fill-current" /> : <Play size={13} className="fill-current" />}
        </button>

        <ControlBtn onClick={onStepForward} title="Step forward" disabled={currentCycle >= totalCycles}>
          <ChevronRight size={14} />
        </ControlBtn>
      </div>

      {/* Cycle counter */}
      <div className="font-mono text-xs text-gray-400 shrink-0">
        <span className="text-white">{currentCycle}</span>
        <span className="text-gray-600"> / {totalCycles}</span>
        <span className="text-gray-600 ml-1">cycles</span>
      </div>

      {/* Scrubber */}
      <div className="flex-1 flex items-center gap-2">
        <input
          type="range"
          min={1}
          max={totalCycles}
          value={currentCycle}
          onChange={(e) => onSeek(Number(e.target.value))}
          className="flex-1 h-1 accent-accent cursor-pointer"
          style={{
            background: `linear-gradient(to right, #00d4ff ${progress}%, #1f2937 ${progress}%)`,
          }}
        />
      </div>

      {/* Speed presets */}
      <div className="flex items-center gap-1 shrink-0">
        {SPEED_PRESETS.map((preset) => (
          <button
            key={preset.ms}
            onClick={() => onSpeedChange(preset.ms)}
            className="px-2 py-1 rounded text-xs font-mono transition-all"
            style={{
              background:
                clockSpeed === preset.ms
                  ? "rgba(0,212,255,0.12)"
                  : "transparent",
              border:
                clockSpeed === preset.ms
                  ? "1px solid rgba(0,212,255,0.3)"
                  : "1px solid transparent",
              color: clockSpeed === preset.ms ? "#00d4ff" : "#6b7280",
            }}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Status badge */}
      <div
        className="shrink-0 px-2 py-1 rounded font-mono text-xs"
        style={{
          background:
            playback === "playing"
              ? "rgba(16,185,129,0.1)"
              : playback === "finished"
              ? "rgba(0,212,255,0.1)"
              : "rgba(255,255,255,0.04)",
          color:
            playback === "playing"
              ? "#34d399"
              : playback === "finished"
              ? "#00d4ff"
              : "#6b7280",
          border: `1px solid ${
            playback === "playing"
              ? "rgba(16,185,129,0.2)"
              : playback === "finished"
              ? "rgba(0,212,255,0.2)"
              : "rgba(255,255,255,0.06)"
          }`,
        }}
      >
        {playback === "playing"
          ? "▶ RUNNING"
          : playback === "paused"
          ? "⏸ PAUSED"
          : playback === "finished"
          ? "✓ DONE"
          : "● IDLE"}
      </div>
    </div>
  );
}

function ControlBtn({
  onClick,
  title,
  disabled,
  children,
}: {
  onClick: () => void;
  title?: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className="flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-white/6 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
}
