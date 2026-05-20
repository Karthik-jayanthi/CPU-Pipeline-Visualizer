"use client";

import { useRef, useState } from "react";
import { Play, ChevronDown, AlertCircle, FileCode } from "lucide-react";
import { SAMPLE_PROGRAMS } from "@/lib/pipeline/samples";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onRun: () => void;
  parseError: string | null;
}

export function InstructionEditor({ value, onChange, onRun, parseError }: Props) {
  const [showSamples, setShowSamples] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Ctrl+Enter or Cmd+Enter to run
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      onRun();
    }
    // Tab inserts 4 spaces
    if (e.key === "Tab") {
      e.preventDefault();
      const el = e.currentTarget;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const newVal = value.substring(0, start) + "    " + value.substring(end);
      onChange(newVal);
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = start + 4;
      });
    }
  }

  const lineCount = value.split("\n").length;

  return (
    <div className="glass-panel rounded-xl flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-2">
          <FileCode size={13} className="text-gray-500" />
          <span className="text-xs font-mono text-gray-400">program.asm</span>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Sample programs dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSamples((s) => !s)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors px-2 py-1 rounded hover:bg-white/5"
            >
              Samples
              <ChevronDown size={11} />
            </button>
            {showSamples && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-panel border border-white/8 rounded-lg shadow-xl z-50 overflow-hidden">
                {SAMPLE_PROGRAMS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onChange(p.source);
                      setShowSamples(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                  >
                    <div className="text-xs text-white font-medium">{p.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5 leading-tight">
                      {p.description}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={onRun}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-accent/15 border border-accent/30 text-accent text-xs font-medium hover:bg-accent/25 transition-all"
          >
            <Play size={10} className="fill-current" />
            Run
          </button>
        </div>
      </div>

      {/* Editor area */}
      <div className="flex flex-1 min-h-0 overflow-hidden font-mono text-xs">
        {/* Line numbers */}
        <div className="text-right pr-3 pt-3 pb-3 pl-2 text-gray-700 select-none shrink-0 bg-black/20 leading-[1.7]">
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Textarea */}
        <div className="flex-1 min-w-0 relative overflow-auto">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="code-editor w-full h-full pt-3 pb-3 pr-3 text-gray-300 leading-[1.7] min-h-full"
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            autoComplete="off"
          />
        </div>
      </div>

      {/* Status / error bar */}
      <div className="px-3 py-1.5 border-t border-white/5 shrink-0 flex items-center justify-between">
        {parseError ? (
          <div className="flex items-center gap-1.5 text-red-400 text-xs">
            <AlertCircle size={11} />
            <span className="truncate">{parseError}</span>
          </div>
        ) : (
          <span className="text-xs text-gray-600 font-mono">
            {lineCount} lines · Ctrl+Enter to run
          </span>
        )}
        <span className="text-xs text-gray-700 font-mono">MIPS32</span>
      </div>
    </div>
  );
}
