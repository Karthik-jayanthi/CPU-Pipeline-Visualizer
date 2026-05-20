"use client";

import { useState, useCallback, useRef } from "react";
import { SimulatorShell } from "@/components/layout/SimulatorShell";
import { InstructionEditor } from "@/components/editor/InstructionEditor";
import { PipelineGrid } from "@/components/pipeline/PipelineGrid";
import { PipelineDiagram } from "@/components/pipeline/PipelineDiagram";
import { HazardLog } from "@/components/hazards/HazardLog";
import { MetricsPanel } from "@/components/analytics/MetricsPanel";
import { PlaybackControls } from "@/components/pipeline/PlaybackControls";
import { ConfigPanel } from "@/components/pipeline/ConfigPanel";
import { simulate } from "@/lib/pipeline/simulator";
import type {
  SimulationResult,
  SimulationConfig,
  PlaybackState,
  DEFAULT_SIM_CONFIG,
} from "@/types/pipeline";
import { DEFAULT_SIM_CONFIG as DEF_CFG } from "@/types/pipeline";
import { SAMPLE_PROGRAMS } from "@/lib/pipeline/samples";

export default function SimulationPage() {
  const [source, setSource] = useState(SAMPLE_PROGRAMS[1].source);
  const [config, setConfig] = useState<SimulationConfig>(DEF_CFG);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [currentCycle, setCurrentCycle] = useState(1);
  const [playback, setPlayback] = useState<PlaybackState>("idle");
  const [clockSpeed, setClockSpeed] = useState(600);
  const [selectedInstrId, setSelectedInstrId] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  const playIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const runSimulation = useCallback(() => {
    try {
      setParseError(null);
      const r = simulate(source, config);
      setResult(r);
      setCurrentCycle(1);
      setPlayback("idle");
      setSelectedInstrId(null);
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "Parse error");
      setResult(null);
    }
  }, [source, config]);

  function startPlayback() {
    if (!result) return;
    if (currentCycle >= result.totalCycles) {
      setCurrentCycle(1);
    }
    setPlayback("playing");
    playIntervalRef.current = setInterval(() => {
      setCurrentCycle((c) => {
        if (c >= (result?.totalCycles ?? 1)) {
          clearInterval(playIntervalRef.current!);
          playIntervalRef.current = null;
          setPlayback("finished");
          return c;
        }
        return c + 1;
      });
    }, clockSpeed);
  }

  function pausePlayback() {
    if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current);
      playIntervalRef.current = null;
    }
    setPlayback("paused");
  }

  function resetPlayback() {
    if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current);
      playIntervalRef.current = null;
    }
    setCurrentCycle(1);
    setPlayback("idle");
  }

  function stepForward() {
    if (!result) return;
    setCurrentCycle((c) => Math.min(c + 1, result.totalCycles));
    setPlayback("paused");
  }

  function stepBackward() {
    setCurrentCycle((c) => Math.max(c - 1, 1));
    setPlayback("paused");
  }

  const currentSnapshot = result?.cycles[currentCycle - 1] ?? null;

  return (
    <SimulatorShell>
      <div className="flex flex-col h-full min-h-0">
        {/* Top row: Editor + Pipeline Diagram */}
        <div className="flex gap-3 h-72 shrink-0 p-3 pb-0">
          <div className="w-80 shrink-0">
            <InstructionEditor
              value={source}
              onChange={setSource}
              onRun={runSimulation}
              parseError={parseError}
            />
          </div>
          <div className="flex-1 min-w-0">
            <PipelineDiagram
              snapshot={currentSnapshot}
              instructions={result?.instructions ?? []}
              selectedInstrId={selectedInstrId}
            />
          </div>
          <div className="w-56 shrink-0">
            <ConfigPanel config={config} onChange={setConfig} />
          </div>
        </div>

        {/* Playback controls bar */}
        {result && (
          <div className="px-3 pt-2 shrink-0">
            <PlaybackControls
              playback={playback}
              currentCycle={currentCycle}
              totalCycles={result.totalCycles}
              clockSpeed={clockSpeed}
              onPlay={startPlayback}
              onPause={pausePlayback}
              onReset={resetPlayback}
              onStepForward={stepForward}
              onStepBackward={stepBackward}
              onSeek={(c) => { setCurrentCycle(c); setPlayback("paused"); }}
              onSpeedChange={(s) => {
                setClockSpeed(s);
                if (playback === "playing") {
                  pausePlayback();
                }
              }}
            />
          </div>
        )}

        {/* Bottom row: Pipeline grid + Hazard log + Metrics */}
        <div className="flex gap-3 flex-1 min-h-0 p-3 pt-2">
          <div className="flex-1 min-w-0 min-h-0">
            <PipelineGrid
              result={result}
              currentCycle={currentCycle}
              selectedInstrId={selectedInstrId}
              onSelectInstr={setSelectedInstrId}
              onSeekCycle={(c) => {
                setCurrentCycle(c);
                setPlayback("paused");
              }}
            />
          </div>
          <div className="w-72 shrink-0 flex flex-col gap-3 min-h-0">
            <div className="flex-1 min-h-0">
              <HazardLog
                result={result}
                currentCycle={currentCycle}
                selectedInstrId={selectedInstrId}
              />
            </div>
            <div className="h-52 shrink-0">
              <MetricsPanel result={result} />
            </div>
          </div>
        </div>
      </div>
    </SimulatorShell>
  );
}
