import { useState } from "react";
import { ChevronDown, ChevronRight, Wrench } from "lucide-react";

const STATUS_COLOR = {
  completed: "text-[var(--term-green)]",
  running:   "text-[var(--term-yellow)]",
  failed:    "text-[var(--term-red)]"
};

const STATUS_SYMBOL = {
  completed: "ok",
  running:   "...",
  failed:    "x"
};

function ToolCallRow({ tc }) {
  const [open, setOpen] = useState(tc.status === "failed");
  const color = STATUS_COLOR[tc.status] || "text-[var(--term-text)]";
  const duration = tc.completedAt && tc.startedAt
    ? ((new Date(tc.completedAt) - new Date(tc.startedAt)) / 1000).toFixed(1) + "s"
    : null;

  return (
    <div className="mt-0.5 ml-1">
      <button
        className="flex w-full items-center gap-2 rounded py-0.5 text-left hover:bg-white/5"
        onClick={() => setOpen((v) => !v)}
      >
        <Wrench size={12} className={color} />
        <span className={color}>{tc.toolName}</span>
        {tc.status === "running" && (
          <span className="animate-pulse text-[var(--term-yellow)]">running...</span>
        )}
        {duration && <span className="text-[var(--term-dim)]">({duration})</span>}
        {tc.status === "failed" && tc.error && (
          <span className="ml-2 truncate text-[var(--term-red)] opacity-80">{tc.error.slice(0, 60)}</span>
        )}
        <span className="ml-auto shrink-0 text-[var(--term-dim)]">
          {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </span>
      </button>

      {open && (
        <div className="ml-3 mt-0.5 space-y-1 border-l border-[var(--term-border-sub)] pl-3">
          <div>
            <p className="text-[var(--term-muted)]">input</p>
            <pre className="max-h-16 overflow-auto whitespace-pre-wrap text-[var(--term-text)]">
              {tc.input || "(none)"}
            </pre>
          </div>
          {(tc.output || tc.error) && (
            <div>
              <p className={tc.status === "failed" ? "text-[var(--term-red)]" : "text-[var(--term-muted)]"}>
                {tc.status === "failed" ? "error" : "output"}
              </p>
              <pre className={`max-h-24 overflow-auto whitespace-pre-wrap ${
                tc.status === "failed" ? "text-[var(--term-red)]" : "text-[var(--term-green)]"
              }`}>
                {tc.output || tc.error}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AgentOutputCard({ step, index }) {
  const [open, setOpen] = useState(false);
  const color = STATUS_COLOR[step.status] || "text-[var(--term-text)]";
  const symbol = STATUS_SYMBOL[step.status] || "?";
  const toolCalls = step.toolCalls || [];

  const duration = step.completedAt && step.startedAt
    ? ((new Date(step.completedAt) - new Date(step.startedAt)) / 1000).toFixed(1) + "s"
    : null;

  return (
    <div className="font-mono text-[13px] leading-normal">
      <button
        className="flex w-full items-center gap-2 rounded py-0.5 text-left hover:bg-white/5"
        onClick={() => setOpen((v) => !v)}
      >
        <span className={`shrink-0 ${color}`}>{symbol}</span>
        <span className="text-[var(--term-muted)]">[{String(index + 1).padStart(2, "0")}]</span>
        <span className={color}>{step.agentName}</span>
        {toolCalls.length > 0 && (
          <span className="text-[var(--term-dim)]">
            {toolCalls.length} tool call{toolCalls.length !== 1 ? "s" : ""}
          </span>
        )}
        {duration && <span className="text-[var(--term-dim)]">({duration})</span>}
        <span className="ml-auto text-[var(--term-dim)]">
          {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </span>
      </button>

      {toolCalls.length > 0 && (
        <div className="ml-6 border-l border-[var(--term-border-sub)] pl-3">
          {toolCalls.map((tc) => (
            <ToolCallRow key={tc.id} tc={tc} />
          ))}
        </div>
      )}

      {open && (
        <div className="ml-4 mt-0.5 space-y-1 border-l border-[var(--term-border-sub)] pl-3">
          {step.systemPrompt && (
            <div>
              <p className="text-[var(--term-muted)]">system prompt</p>
              <pre className="mt-0.5 max-h-40 overflow-auto whitespace-pre-wrap text-[var(--term-text)]">
                {step.systemPrompt}
              </pre>
            </div>
          )}
          {step.userMessage && (
            <div>
              <p className="text-[var(--term-muted)]">input</p>
              <pre className="mt-0.5 max-h-40 overflow-auto whitespace-pre-wrap text-[var(--term-text)]">
                {step.userMessage}
              </pre>
            </div>
          )}
          {(step.output || step.error) && (
            <div>
              <p className={step.status === "failed" ? "text-[var(--term-red)]" : "text-[var(--term-muted)]"}>
                {step.status === "failed" ? "error" : "output"}
              </p>
              <pre className={`mt-0.5 max-h-56 overflow-auto whitespace-pre-wrap ${
                step.status === "failed" ? "text-[var(--term-red)]" : "text-[var(--term-green)]"
              }`}>
                {step.output || step.error}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
