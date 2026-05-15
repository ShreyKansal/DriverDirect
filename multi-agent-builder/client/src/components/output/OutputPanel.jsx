import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Package, X } from "lucide-react";
import { useWorkflowStore } from "../../store/workflowStore.js";
import AgentOutputCard from "./AgentOutputCard.jsx";

function PanelTab({ active, children, onClick }) {
  return (
    <button
      className={`relative flex h-9 items-center px-3 text-[12px] transition ${
        active
          ? "text-[var(--term-active-text)]"
          : "text-[var(--term-muted)] hover:text-[var(--term-text)]"
      }`}
      onClick={onClick}
    >
      {children}
      {active && <span className="absolute bottom-0 left-2 right-2 h-px bg-primary" />}
    </button>
  );
}

function EmptyTerminal({ hasRuns }) {
  return (
    <p className="font-mono text-[13px] text-[var(--term-muted)]">
      <span className="text-[var(--term-green)]">$</span>{" "}
      {hasRuns
        ? "Select a workflow tab above to view its output."
        : "Add a User Input node with a prompt, then click Run."}
    </p>
  );
}

function TerminalView({ trace, execError, running, copied, copyOutput, hasRuns }) {
  if (!trace && !execError) return <EmptyTerminal hasRuns={hasRuns} />;

  return (
    <div className="space-y-0.5">
      {running && (
        <p className="font-mono text-[13px] text-[var(--term-yellow)]">
          <span className="animate-pulse">...</span> Workflow running. Open TERMINAL for step-by-step execution.
        </p>
      )}

      {execError && (
        <p className="font-mono text-[13px] text-[var(--term-red)]">
          <span>x</span> {execError}
        </p>
      )}

      {trace?.userTask && (
        <div className="font-mono text-[13px]">
          <p className="text-[var(--term-muted)]">task</p>
          <pre className="mt-1 max-h-24 overflow-auto whitespace-pre-wrap text-[var(--term-text)]">
            {trace.userTask}
          </pre>
        </div>
      )}

      {trace?.finalOutput ? (
        <div className="border-t border-[var(--term-border)] pt-3">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="font-mono text-[13px] uppercase tracking-widest text-[var(--term-green)]">
              final output
            </span>
            <button
              className="font-mono text-[13px] text-[var(--term-muted)] hover:text-[var(--term-text)]"
              onClick={copyOutput}
            >
              {copied ? "copied" : "copy"}
            </button>
          </div>
          <pre className="whitespace-pre-wrap font-mono text-[13px] text-[var(--term-green)]">
            {trace.finalOutput}
          </pre>
        </div>
      ) : (
        trace && (
          <p className="font-mono text-[13px] text-[var(--term-muted)]">
            No final output yet. Open TERMINAL to inspect the current run.
          </p>
        )
      )}
    </div>
  );
}

function BootstrapLog({ bootstrapPhase }) {
  if (!bootstrapPhase) return null;

  return (
    <div className="font-mono text-[13px]">
      <div className="flex items-center gap-2 py-0.5">
        {bootstrapPhase.status === "installing" && (
          <Package size={14} className="shrink-0 animate-pulse text-[var(--term-yellow)]" />
        )}
        {bootstrapPhase.status === "ready" && (
          <CheckCircle2 size={14} className="shrink-0 text-[var(--term-green)]" />
        )}
        {bootstrapPhase.status === "failed" && (
          <AlertCircle size={14} className="shrink-0 text-[var(--term-red)]" />
        )}
        <span className={
          bootstrapPhase.status === "installing" ? "text-[var(--term-yellow)]"
          : bootstrapPhase.status === "ready"    ? "text-[var(--term-green)]"
          : "text-[var(--term-red)]"
        }>
          {bootstrapPhase.status === "installing"
            ? "Preparing environment..."
            : bootstrapPhase.status === "ready"
              ? "Environment ready"
              : "Environment setup failed"}
        </span>
      </div>

      {bootstrapPhase.packages.length > 0 && (
        <div className="ml-4 mt-1 border-l border-[var(--term-border)] pl-3">
          {bootstrapPhase.packages.map((pkg) => {
            const installed = bootstrapPhase.installedCount || 0;
            const idx = bootstrapPhase.packages.indexOf(pkg);
            const done = bootstrapPhase.status === "ready" || idx < installed;
            const active = !done && idx === installed;
            return (
              <div key={pkg} className="flex items-center gap-1.5 py-0.5 text-[13px]">
                <span className={done ? "text-[var(--term-green)]" : active ? "animate-pulse text-[var(--term-yellow)]" : "text-[var(--term-dim)]"}>
                  {done ? "ok" : active ? "..." : "-"}
                </span>
                <span className={done ? "text-[var(--term-text)]" : active ? "text-[var(--term-yellow)]" : "text-[var(--term-dim)]"}>
                  {pkg}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {bootstrapPhase.packages.length === 0 && bootstrapPhase.status === "ready" && (
        <p className="ml-4 text-[13px] text-[var(--term-muted)]">
          All dependencies already in base image - no installs needed.
        </p>
      )}

      {bootstrapPhase.status === "failed" && bootstrapPhase.error && (
        <p className="ml-4 mt-0.5 text-[13px] text-[var(--term-red)]">{bootstrapPhase.error}</p>
      )}
    </div>
  );
}

function LogsView({ trace, execError, bootstrapPhase, filteredSteps }) {
  if (!trace && !execError && !bootstrapPhase) {
    return (
      <p className="font-mono text-[13px] text-[var(--term-muted)]">
        No logs yet. Run a workflow to see execution details here.
      </p>
    );
  }

  return (
    <div className="space-y-0.5">
      {execError && (
        <p className="font-mono text-[13px] text-[var(--term-red)]">
          <span>x</span> {execError}
        </p>
      )}
      <BootstrapLog bootstrapPhase={bootstrapPhase} />
      {filteredSteps.map((step, index) => (
        <AgentOutputCard key={`${step.agentId}-${index}`} step={step} index={index} />
      ))}
    </div>
  );
}

export default function OutputPanel({ onClose }) {
  const runs = useWorkflowStore((s) => s.runs);
  const projects = useWorkflowStore((s) => s.projects);
  const activeTerminalProjectId = useWorkflowStore((s) => s.activeTerminalProjectId);
  const setActiveTerminalProject = useWorkflowStore((s) => s.setActiveTerminalProject);
  const clearTrace = useWorkflowStore((s) => s.clearTrace);

  const runProjectIds = Object.keys(runs);
  const [viewProjectId, setViewProjectId] = useState(activeTerminalProjectId || runProjectIds[0] || null);
  const [activeTab, setActiveTab] = useState("terminal");
  const [agentFilter, setAgentFilter] = useState("all");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (activeTerminalProjectId) setViewProjectId(activeTerminalProjectId);
  }, [activeTerminalProjectId]);

  useEffect(() => {
    if (viewProjectId && !runs[viewProjectId]) {
      setViewProjectId(Object.keys(runs)[0] || null);
    }
  }, [runs, viewProjectId]);

  useEffect(() => {
    setAgentFilter("all");
  }, [viewProjectId]);

  const currentRun = runs[viewProjectId] || null;
  const trace = currentRun?.trace ?? null;
  const execError = currentRun?.executionError ?? "";
  const bootstrapPhase = currentRun?.bootstrapPhase ?? null;
  const running = currentRun?.running ?? false;

  const [termH, setTermH] = useState(260);
  const dragging = useRef(false);
  const startY = useRef(0);
  const startH = useRef(260);

  const onResizeMouseDown = useCallback((e) => {
    dragging.current = true;
    startY.current = e.clientY;
    startH.current = termH;
    e.preventDefault();
  }, [termH]);

  useEffect(() => {
    const onMove = (e) => {
      if (!dragging.current) return;
      const delta = startY.current - e.clientY;
      setTermH(Math.min(520, Math.max(120, startH.current + delta)));
    };
    const onUp = () => { dragging.current = false; };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, []);

  const agentList = useMemo(() => {
    if (!trace?.steps?.length) return [];
    const seen = new Set();
    return trace.steps
      .filter((step) => {
        if (seen.has(step.agentId)) return false;
        seen.add(step.agentId);
        return true;
      })
      .map((step) => ({ id: step.agentId, name: step.agentName }));
  }, [trace?.steps]);

  const filteredSteps = useMemo(() => {
    if (!trace?.steps) return [];
    if (agentFilter === "all") return trace.steps;
    return trace.steps.filter((step) => step.agentId === agentFilter);
  }, [trace?.steps, agentFilter]);

  async function copyOutput() {
    if (!trace?.finalOutput) return;
    try {
      await navigator.clipboard.writeText(trace.finalOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  const statusLabel = running ? "Running..."
    : trace?.status ? trace.status.charAt(0).toUpperCase() + trace.status.slice(1)
    : "Idle";

  return (
    <div style={{ height: termH }} className="flex shrink-0 flex-col border-t border-[var(--term-border)]">
      <div
        className="h-1 shrink-0 cursor-row-resize bg-transparent transition-colors hover:bg-primary/40"
        onMouseDown={onResizeMouseDown}
      />

      {/* Tab bar */}
      <div className="flex h-9 shrink-0 items-center border-b border-[var(--term-border)] bg-[var(--term-bar)]">
        <div className="flex min-w-0 flex-1 items-center">
          <PanelTab active={activeTab === "terminal"} onClick={() => setActiveTab("terminal")}>
            TERMINAL
          </PanelTab>
          <PanelTab active={activeTab === "logs"} onClick={() => setActiveTab("logs")}>
            OUTPUT
            {trace?.steps?.length > 0 && (
              <span className="ml-2 rounded bg-[var(--term-border)] px-1.5 py-0.5 text-[10px] text-[var(--term-text)]">
                {trace.steps.length}
              </span>
            )}
          </PanelTab>
        </div>

        <div className="flex shrink-0 items-center gap-2 px-3">
          {running
            ? <Loader2      size={12} className="shrink-0 animate-spin text-[var(--term-yellow)]" />
            : trace?.status === "completed"
              ? <CheckCircle2 size={12} className="shrink-0 text-[var(--term-green)]" />
              : trace?.status === "failed"
                ? <X size={12} className="shrink-0 text-[var(--term-red)]" />
                : null
          }
          <span className="text-[12px] text-[var(--term-muted)]">{statusLabel}</span>
          <button
            className="flex h-7 w-7 items-center justify-center rounded text-[var(--term-muted)] transition-colors hover:bg-[var(--term-btn-hover)] hover:text-[var(--term-text)]"
            onClick={onClose}
            title="Close terminal (Ctrl+`)"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {activeTab === "terminal" && agentList.length > 1 && (
            <div className="flex shrink-0 items-center gap-2 border-b border-[var(--term-border)] bg-[var(--term-sidebar)] px-3 py-1.5">
              <span className="font-mono text-[12px] text-[var(--term-muted)]">filter</span>
              <select
                className="rounded border border-[var(--term-border)] bg-[var(--term-bar)] px-2 py-1 font-mono text-[12px] text-[var(--term-text)] outline-none"
                value={agentFilter}
                onChange={(e) => setAgentFilter(e.target.value)}
              >
                <option value="all">all agents ({trace.steps.length} steps)</option>
                {agentList.map((agent) => (
                  <option key={agent.id} value={agent.id}>{agent.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-auto bg-[var(--term-bg)] px-4 py-2">
            {activeTab === "terminal" ? (
              <LogsView
                trace={trace}
                execError={execError}
                bootstrapPhase={bootstrapPhase}
                filteredSteps={filteredSteps}
              />
            ) : (
              <TerminalView
                trace={trace}
                execError={execError}
                running={running}
                copied={copied}
                copyOutput={copyOutput}
                hasRuns={runProjectIds.length > 0}
              />
            )}
          </div>
        </div>

        {runProjectIds.length > 0 && (
          <div className="flex w-44 shrink-0 flex-col overflow-y-auto border-l border-[var(--term-border)] bg-[var(--term-sidebar)]">
            {runProjectIds.map((pid) => {
              const project = projects.find((p) => p.id === pid);
              const run = runs[pid];
              const isView = pid === viewProjectId;
              return (
                <button
                  key={pid}
                  onClick={() => { setViewProjectId(pid); setActiveTerminalProject(pid); }}
                  className={`group flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] transition ${
                    isView
                      ? "bg-[var(--term-active)] text-[var(--term-text)]"
                      : "text-[var(--term-muted)] hover:bg-[var(--term-hover)] hover:text-[var(--term-text)]"
                  }`}
                >
                  {run?.running
                    ? <Loader2      size={11} className="shrink-0 animate-spin text-[var(--term-yellow)]" />
                    : run?.trace?.status === "completed"
                      ? <CheckCircle2 size={11} className="shrink-0 text-[var(--term-green)]" />
                      : run?.trace?.status === "failed"
                        ? <X size={11} className="shrink-0 text-[var(--term-red)]" />
                        : null
                  }
                  <span className="min-w-0 flex-1 truncate">{project?.name || pid}</span>
                  <span
                    className="shrink-0 opacity-0 transition group-hover:opacity-100"
                    onClick={(e) => { e.stopPropagation(); clearTrace(pid); }}
                    title="Clear run"
                  >
                    <X size={11} />
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
