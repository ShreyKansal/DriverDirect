import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Bot, Check, Crown, FileInput, FileOutput, FolderOpen } from "lucide-react";
import { useWorkflowStore } from "../../store/workflowStore.js";
import ProjectExplorer from "./ProjectExplorer.jsx";

// ── vertical resize hook ──────────────────────────────────────────────────────

function useVertResize(initial, min, max) {
  const [size, setSize] = useState(initial);
  const dragging  = useRef(false);
  const startY    = useRef(0);
  const startSize = useRef(initial);

  const onMouseDown = useCallback((e) => {
    dragging.current  = true;
    startY.current    = e.clientY;
    startSize.current = size;
    e.preventDefault();
  }, [size]);

  useEffect(() => {
    const onMove = (e) => {
      if (!dragging.current) return;
      const delta = e.clientY - startY.current;
      setSize(Math.min(max, Math.max(min, startSize.current + delta)));
    };
    const onUp = () => { dragging.current = false; };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, [min, max]);

  return [size, onMouseDown];
}

// ── node icon helper ──────────────────────────────────────────────────────────

function nodeIcon(type, size = 14) {
  if (type === "orchestrator") return <Crown size={size} className="text-primary" />;
  if (type === "user_input")   return <FileInput size={size} className="text-muted" />;
  if (type === "output")       return <FileOutput size={size} className="text-muted" />;
  return <Bot size={size} className="text-muted" />;
}

const NODE_TYPE_LABEL = { user_input: "Input", orchestrator: "Orchestrator", agent: "Agent", output: "Output" };

// ── workspace row (draggable) ─────────────────────────────────────────────────

function WorkspaceRow({ project }) {
  const switchProject = useWorkflowStore((s) => s.switchProject);
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div
      className={`group flex h-7 cursor-grab items-center gap-1.5 rounded-sm px-2 text-[13px] transition-colors hover:bg-canvasSoft hover:text-ink active:cursor-grabbing ${
        isDragging ? "opacity-50" : "text-body"
      }`}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("workspaceProjectId", project.id);
        e.dataTransfer.effectAllowed = "copy";
        setIsDragging(true);
      }}
      onDragEnd={() => setIsDragging(false)}
    >
      <FolderOpen size={14} className="shrink-0 text-muted" />
      <span className="min-w-0 flex-1 truncate">{project.name}</span>
      <button
        className="shrink-0 text-[10px] text-primary opacity-0 transition group-hover:opacity-100 hover:underline"
        onClick={(e) => { e.stopPropagation(); switchProject(project.id); }}
        title="Open project"
      >
        Open
      </button>
    </div>
  );
}

// ── inline import panel ───────────────────────────────────────────────────────

function InlineImport({ project, onConfirm, onCancel }) {
  const nodes = (project.workflow?.nodes || []).filter((n) => n.type !== "tool");
  const edges = (project.workflow?.edges || []).filter((e) => e.type !== "tool");
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState(() => new Set(nodes.map((n) => n.id)));

  const allSelected = selected.size === nodes.length;

  function toggle(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(nodes.map((n) => n.id)));
  }

  return (
    <div className="flex h-full flex-col bg-panel">
      {/* Header */}
      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-hairline px-3">
        <button
          className="flex h-6 w-6 items-center justify-center rounded text-muted transition hover:bg-canvasSoft hover:text-ink"
          onClick={onCancel}
          title="Cancel import"
        >
          <ArrowLeft size={14} />
        </button>
        <span className="text-[12px] font-semibold text-ink">Import from "{project.name}"</span>
        {/* Step pills */}
        <div className="ml-auto flex items-center gap-1">
          {[1, 2].map((s) => (
            <button
              key={s}
              onClick={() => s < step || s === step + 1 ? setStep(s) : null}
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold transition ${
                step === s ? "bg-primary text-white" : step > s ? "bg-green-500 text-white" : "bg-canvasSoft text-muted"
              }`}
            >
              {step > s ? <Check size={9} /> : s}
            </button>
          ))}
        </div>
      </div>

      {/* Step 1 — Source info */}
      {step === 1 && (
        <div className="flex flex-1 flex-col overflow-auto p-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">Source Workspace</p>
          <p className="mt-1 text-[14px] font-semibold text-ink">{project.name}</p>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between rounded-md bg-canvasSoft px-3 py-2 text-[12px]">
              <span className="text-muted">Agents / Nodes</span>
              <span className="font-semibold text-ink">{nodes.length}</span>
            </div>
            <div className="flex items-center justify-between rounded-md bg-canvasSoft px-3 py-2 text-[12px]">
              <span className="text-muted">Connections</span>
              <span className="font-semibold text-ink">{edges.length}</span>
            </div>
            {project.workflow?.builderTarget && (
              <div className="flex items-center justify-between rounded-md bg-canvasSoft px-3 py-2 text-[12px]">
                <span className="text-muted">Framework</span>
                <span className="font-semibold text-ink capitalize">{project.workflow.builderTarget}</span>
              </div>
            )}
          </div>
          <div className="mt-auto pt-4">
            <button
              className="btn-primary w-full"
              disabled={nodes.length === 0}
              onClick={() => setStep(2)}
            >
              Select Agents →
            </button>
          </div>
        </div>
      )}

      {/* Step 2 — Agent selection */}
      {step === 2 && (
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex shrink-0 items-center justify-between border-b border-hairline px-3 py-2">
            <span className="text-[12px] text-muted">{selected.size} of {nodes.length} selected</span>
            <button className="text-[12px] font-medium text-primary hover:underline" onClick={toggleAll}>
              {allSelected ? "Deselect All" : "Select All"}
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto py-1">
            {nodes.map((node) => (
              <label
                key={node.id}
                className="flex cursor-pointer items-center gap-3 px-3 py-2 transition hover:bg-canvasSoft"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 shrink-0 rounded accent-primary"
                  checked={selected.has(node.id)}
                  onChange={() => toggle(node.id)}
                />
                <span className="shrink-0">{nodeIcon(node.type)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-ink">{node.name}</span>
                  {node.role && <span className="block truncate text-[11px] text-muted">{node.role}</span>}
                </span>
                <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted ring-1 ring-hairline">
                  {NODE_TYPE_LABEL[node.type] ?? node.type}
                </span>
              </label>
            ))}
          </div>
          <div className="flex shrink-0 items-center gap-2 border-t border-hairline px-3 py-3">
            <button className="btn flex-1" onClick={() => setStep(1)}>← Back</button>
            <button
              className="btn-primary flex-1"
              disabled={!selected.size}
              onClick={() => onConfirm([...selected])}
            >
              Import ({selected.size})
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export default function WorkspacesPanel() {
  const projects             = useWorkflowStore((s) => s.projects);
  const activeProjectId      = useWorkflowStore((s) => s.activeProjectId);
  const importNodesDirectly  = useWorkflowStore((s) => s.importNodesDirectly);

  const [isDragOver, setIsDragOver]   = useState(false);
  const [pendingImport, setPendingImport] = useState(null); // source project object
  const dragCounter = useRef(0);
  const [topH, onResizeDown] = useVertResize(80, 40, 400);

  const otherProjects = projects.filter((p) => p.id !== activeProjectId);

  // drag counter pattern: only truly "left" when counter reaches 0
  function handleDragEnter(e) {
    dragCounter.current++;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setIsDragOver(true);
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }

  function handleDragLeave() {
    dragCounter.current--;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragOver(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragOver(false);
    const projectId = e.dataTransfer.getData("workspaceProjectId");
    if (!projectId || projectId === activeProjectId) return;
    const source = projects.find((p) => p.id === projectId);
    if (source) setPendingImport(source);
  }

  function handleConfirmImport(selectedNodeIds) {
    if (pendingImport) importNodesDirectly(pendingImport.id, selectedNodeIds);
    setPendingImport(null);
  }

  // Show inline import view when a workspace is dropped
  if (pendingImport) {
    return (
      <InlineImport
        project={pendingImport}
        onConfirm={handleConfirmImport}
        onCancel={() => setPendingImport(null)}
      />
    );
  }

  return (
    <div className="flex h-full flex-col bg-panel">
      {/* ── Top: current project explorer (drop zone) ── */}
      <div
        style={{ height: topH }}
        className={`relative flex min-h-0 shrink-0 flex-col overflow-hidden transition-colors ${
          isDragOver ? "ring-2 ring-inset ring-primary/40" : ""
        }`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDragOver && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded bg-primary/5">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
              Drop to import workspace
            </span>
          </div>
        )}
        <ProjectExplorer />
      </div>

      {/* ── Resize handle ── */}
      <div
        className="group relative flex h-1 shrink-0 cursor-row-resize items-center justify-center bg-hairline hover:bg-primary/30 transition-colors"
        onMouseDown={onResizeDown}
      >
        <div className="h-0.5 w-6 rounded-full bg-hairlineStrong transition group-hover:bg-primary/60" />
      </div>

      {/* ── Bottom: all other workspaces ── */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex h-8 shrink-0 items-center border-b border-hairline px-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
            All Workspaces ({otherProjects.length})
          </span>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-1 py-0.5">
          {otherProjects.length === 0 ? (
            <p className="px-2 py-2 text-[12px] text-muted">No other workspaces yet.</p>
          ) : (
            otherProjects.map((p) => <WorkspaceRow key={p.id} project={p} />)
          )}
        </div>
      </div>
    </div>
  );
}
