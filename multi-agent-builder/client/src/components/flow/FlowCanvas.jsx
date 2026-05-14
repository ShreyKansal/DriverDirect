import { useRef, useState, useEffect } from "react";
import { Bot, CheckCircle2, Crown, FileInput, FileOutput, Wrench, X } from "lucide-react";
import { useWorkflowStore } from "../../store/workflowStore.js";
import { NODE_TYPE_LABELS } from "../../utils/graphUtils.js";

const EMPTY_EXEC_STATE = {};

const NODE_WIDTH       = 236;
const NODE_HEIGHT      = 124;
const TOOL_NODE_WIDTH  = 192;
const TOOL_NODE_HEIGHT = 92;
const ZOOM_MIN    = 0.15;
const ZOOM_MAX    = 2.0;
const ZOOM_FACTOR = 0.12;

// ─── small helpers ────────────────────────────────────────────────────────────

function nodeW(node) { return node.type === "tool" ? TOOL_NODE_WIDTH  : NODE_WIDTH;  }
function nodeH(node) { return node.type === "tool" ? TOOL_NODE_HEIGHT : NODE_HEIGHT; }

function edgePoint(node, side) {
  const { x = 0, y = 0 } = node.position || {};
  return { x: x + (side === "right" ? nodeW(node) : 0), y: y + nodeH(node) / 2 };
}

function nodeIcon(type, size = 15) {
  if (type === "orchestrator") return <Crown size={size} />;
  if (type === "user_input")   return <FileInput size={size} />;
  if (type === "output")       return <FileOutput size={size} />;
  return <Bot size={size} />;
}

function nodeAccent(type) {
  if (type === "orchestrator") return "bg-primary text-white";
  if (type === "user_input")   return "bg-surfaceStrong text-ink";
  if (type === "output")       return "bg-ink text-canvas";
  return "bg-canvasSoft text-ink";
}

function nodeSummary(node) {
  if (node.type === "user_input") return node.prompt || "Prompt entered at runtime";
  if (node.type === "output")     return node.outputFormat || "markdown";
  return node.role;
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// ─── component ────────────────────────────────────────────────────────────────

export default function FlowCanvas() {
  const workflow              = useWorkflowStore((s) => s.workflow);
  const selectedNodeId        = useWorkflowStore((s) => s.selectedNodeId);
  const executionState        = useWorkflowStore((s) => s.runs[s.activeProjectId]?.executionState ?? EMPTY_EXEC_STATE);
  const selectNode            = useWorkflowStore((s) => s.selectNode);
  const focusNode             = useWorkflowStore((s) => s.focusNode);
  const updateNode            = useWorkflowStore((s) => s.updateNode);
  const deleteNode            = useWorkflowStore((s) => s.deleteNode);
  const setCanvasZoom         = useWorkflowStore((s) => s.setCanvasZoom);
  const canvasZoomRequest     = useWorkflowStore((s) => s.canvasZoomRequest);
  const clearCanvasZoomRequest = useWorkflowStore((s) => s.clearCanvasZoomRequest);

  // ── transform state ─────────────────────────────────────────────────────────
  const [zoom, setZoom]             = useState(1);
  const [pan,  setPan]              = useState({ x: 60, y: 60 });
  const [isPanning, setIsPanning]   = useState(false);
  const [hoveredNodeId, setHoveredId] = useState(null);

  // Refs so wheel / drag handlers always read fresh values without stale closures
  const zoomRef      = useRef(zoom);
  const panRef       = useRef(pan);
  const containerRef = useRef(null);
  const dragRef      = useRef(null);
  zoomRef.current = zoom;
  panRef.current  = pan;

  // ── wheel zoom toward cursor (non-passive) ──────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      const rect  = el.getBoundingClientRect();
      const mx    = e.clientX - rect.left;
      const my    = e.clientY - rect.top;
      const cz    = zoomRef.current;
      const cp    = panRef.current;
      const nz    = clamp(cz * (e.deltaY < 0 ? 1 + ZOOM_FACTOR : 1 - ZOOM_FACTOR), ZOOM_MIN, ZOOM_MAX);
      const scale = nz / cz;
      setZoom(nz);
      setPan({ x: mx - (mx - cp.x) * scale, y: my - (my - cp.y) * scale });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // Sync zoom to store so WorkspaceTabs can display it
  useEffect(() => { setCanvasZoom(zoom); }, [zoom, setCanvasZoom]);

  // Handle zoom requests from WorkspaceTabs
  useEffect(() => {
    if (!canvasZoomRequest) return;
    if (canvasZoomRequest === "in")  zoomBy(1 + ZOOM_FACTOR);
    if (canvasZoomRequest === "out") zoomBy(1 - ZOOM_FACTOR);
    if (canvasZoomRequest === "fit") fitView();
    clearCanvasZoomRequest();
  });

  // ── fit all nodes into view ──────────────────────────────────────────────────
  function fitView() {
    const nodes = workflow.nodes;
    const el    = containerRef.current;
    if (!nodes.length || !el) { setZoom(1); setPan({ x: 60, y: 60 }); return; }
    const rect  = el.getBoundingClientRect();
    const xs    = nodes.map((n) => n.position?.x ?? 0);
    const ys    = nodes.map((n) => n.position?.y ?? 0);
    const minX  = Math.min(...xs);
    const minY  = Math.min(...ys);
    const maxX  = Math.max(...nodes.map((n) => (n.position?.x ?? 0) + nodeW(n)));
    const maxY  = Math.max(...nodes.map((n) => (n.position?.y ?? 0) + nodeH(n)));
    const pad   = 80;
    const nz    = clamp(
      Math.min((rect.width - pad * 2) / (maxX - minX || 1), (rect.height - pad * 2) / (maxY - minY || 1)),
      ZOOM_MIN, 1 // never zoom-in beyond 100 % on fit
    );
    setZoom(nz);
    setPan({
      x: (rect.width  - (maxX - minX) * nz) / 2 - minX * nz,
      y: (rect.height - (maxY - minY) * nz) / 2 - minY * nz
    });
  }

  // ── zoom buttons ──────────────────────────────────────────────────────────────
  function zoomBy(factor) {
    const cz   = zoomRef.current;
    const cp   = panRef.current;
    const el   = containerRef.current;
    const nz   = clamp(cz * factor, ZOOM_MIN, ZOOM_MAX);
    const scale = nz / cz;
    if (el) {
      const rect = el.getBoundingClientRect();
      const cx   = rect.width  / 2;
      const cy   = rect.height / 2;
      setPan({ x: cx - (cx - cp.x) * scale, y: cy - (cy - cp.y) * scale });
    }
    setZoom(nz);
  }

  // ── background pan (pointer drag) ────────────────────────────────────────────
  function onBackgroundDown(e) {
    if (e.button !== 0) return;
    const startX   = e.clientX;
    const startY   = e.clientY;
    const originPan = { ...panRef.current };
    setIsPanning(true);

    const move = (ev) => {
      setPan({ x: originPan.x + ev.clientX - startX, y: originPan.y + ev.clientY - startY });
    };
    const stop = () => {
      setIsPanning(false);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup",   stop);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup",   stop);
  }

  // ── node drag ─────────────────────────────────────────────────────────────────
  function startDrag(e, node) {
    e.preventDefault();
    e.stopPropagation();
    focusNode(node.id);
    dragRef.current = {
      nodeId:  node.id,
      startX:  e.clientX,
      startY:  e.clientY,
      originX: node.position?.x ?? 0,
      originY: node.position?.y ?? 0
    };

    const move = (ev) => {
      const d  = dragRef.current;
      if (!d) return;
      const cz = zoomRef.current; // always fresh — no stale closure
      updateNode(d.nodeId, {
        position: {
          x: Math.max(0, d.originX + (ev.clientX - d.startX) / cz),
          y: Math.max(0, d.originY + (ev.clientY - d.startY) / cz)
        }
      });
    };
    const stop = () => {
      dragRef.current = null;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup",   stop);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup",   stop);
  }

  // ── derived ───────────────────────────────────────────────────────────────────
  const nodeById        = new Map(workflow.nodes.map((n) => [n.id, n]));
  const highlightNodeId = selectedNodeId || hoveredNodeId;

  // ── Edge routing — all edges right→left, fan at shared ports ────────────────
  const flowEdges = workflow.edges.filter((e) => e.type !== "tool");

  const edgeOffsets = (() => {
    const offsets    = {};
    const MAX_SPREAD = 30;

    function fan(edgeId, nodeId, role) {
      // role: "src" = all outgoing from nodeId, "tgt" = all incoming to nodeId
      const siblings = flowEdges
        .filter((e) => role === "src" ? e.source === nodeId : e.target === nodeId)
        .sort((a, b) => {
          const ya = (nodeById.get(role === "src" ? a.target : a.source)?.position?.y ?? 0);
          const yb = (nodeById.get(role === "src" ? b.target : b.source)?.position?.y ?? 0);
          return ya - yb;
        });
      if (siblings.length <= 1) return 0;
      const idx    = siblings.findIndex((e) => e.id === edgeId);
      const spread = Math.min(MAX_SPREAD, 12 * (siblings.length - 1));
      return idx * (spread / (siblings.length - 1)) - spread / 2;
    }

    flowEdges.forEach((edge) => {
      offsets[edge.id] = {
        src: fan(edge.id, edge.source, "src"),
        tgt: fan(edge.id, edge.target, "tgt")
      };
    });
    return offsets;
  })();

  // ── render ────────────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden"
      style={{
        cursor: isPanning ? "grabbing" : "default",
        backgroundColor: "rgb(var(--color-canvas))",
        backgroundImage: "radial-gradient(rgb(var(--color-hairline-strong)) 1px, transparent 1px)",
        backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
        backgroundPosition: `${pan.x % (20 * zoom)}px ${pan.y % (20 * zoom)}px`
      }}
      onClick={() => selectNode("")}
    >

      {/* ── Framework label — fixed to viewport ── */}
      <div className="pointer-events-none absolute left-4 top-3 z-20 rounded-full border border-hairline bg-panel/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted backdrop-blur-sm">
        {workflow.builderTarget === "langchain" ? "LangChain" : workflow.builderTarget === "python" ? "Python" : "LangGraph"}
      </div>

      {workflow.nodes.length === 0 && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center text-sm text-muted">
          No nodes yet — use the palette on the left to add agents.
        </div>
      )}

      {/* ── Canvas world — panned & zoomed ── */}
      <div
        style={{
          position: "absolute",
          top: 0, left: 0,
          width: 8000, height: 6000,
          transformOrigin: "0 0",
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
        }}
        // Background click/drag starts pan; node clicks stopPropagation before here
        onPointerDown={onBackgroundDown}
      >
        {/* ── SVG edges ── */}
        <svg
          className="pointer-events-none absolute inset-0 z-0 overflow-visible"
          width={8000}
          height={6000}
        >
          <defs>
            <marker id="arr-default" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L7,3 z" fill="#e60000" />
            </marker>
            <marker id="arr-active" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L7,3 z" fill="#f59e0b" />
            </marker>
            <marker id="arr-done" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L7,3 z" fill="#22c55e" />
            </marker>
            <marker id="arr-tool" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
              <circle cx="2.5" cy="2.5" r="2" fill="rgb(var(--color-hairline-strong))" />
            </marker>
          </defs>

          {workflow.edges.map((edge) => {
            const src = nodeById.get(edge.source);
            const tgt = nodeById.get(edge.target);
            if (!src || !tgt) return null;

            const isTool = edge.type === "tool";
            const off    = !isTool ? (edgeOffsets[edge.id] ?? { src: 0, tgt: 0 }) : { src: 0, tgt: 0 };
            const sBase  = edgePoint(src, "right");
            const eBase  = edgePoint(tgt, "left");
            const s      = { x: sBase.x, y: sBase.y + off.src };
            const e      = { x: eBase.x, y: eBase.y + off.tgt };
            const eAdj   = { x: e.x - (isTool ? 4 : 7), y: e.y };

            // Build path: forward edges = horizontal bezier; backward edges = arc above
            let d;
            if (eAdj.x >= s.x) {
              // Forward (left→right): standard horizontal bezier
              const ctrl = Math.max(60, Math.abs(eAdj.x - s.x) * 0.5);
              d = `M ${s.x} ${s.y} C ${s.x + ctrl} ${s.y}, ${eAdj.x - ctrl} ${eAdj.y}, ${eAdj.x} ${eAdj.y}`;
            } else {
              // Backward (right→left): arc upward to avoid crossing forward edges.
              // Arc height proportional to horizontal gap, fanned siblings get extra offset.
              const hGap   = s.x - eAdj.x;
              const vGap   = Math.abs(s.y - eAdj.y);
              const arcH   = -(Math.min(110, hGap * 0.22 + vGap * 0.15 + 40) + Math.abs(off.src) * 2);
              d = `M ${s.x} ${s.y} C ${s.x} ${s.y + arcH}, ${eAdj.x} ${eAdj.y + arcH}, ${eAdj.x} ${eAdj.y}`;
            }

            if (isTool) {
              const isHit    = !!highlightNodeId && (edge.source === highlightNodeId || edge.target === highlightNodeId);
              const isDimmed = !!highlightNodeId && !isHit;
              return (
                <g key={edge.id} style={{ opacity: isDimmed ? 0.07 : isHit ? 0.9 : 0.35 }}>
                  <path d={d} fill="none" stroke="transparent" strokeWidth="12" />
                  <path d={d} fill="none" stroke="rgb(var(--color-hairline-strong))"
                    strokeWidth="1.5" strokeDasharray="5 4" markerEnd="url(#arr-tool)" />
                </g>
              );
            }

            const srcSt    = executionState[edge.source];
            const tgtSt    = executionState[edge.target];
            const isActive = srcSt === "completed" && tgtSt === "running";
            const isDone   = srcSt === "completed" && (tgtSt === "completed" || tgtSt === "failed");
            const isHit    = !!highlightNodeId && (edge.source === highlightNodeId || edge.target === highlightNodeId);
            const isDimmed = !!highlightNodeId && !isHit;

            const stroke  = isActive ? "#f59e0b" : isDone ? "#22c55e" : "#e60000";
            const marker  = isActive ? "arr-active" : isDone ? "arr-done" : "arr-default";
            const opacity = isDimmed ? 0.08 : isHit ? 1 : 0.4;
            const width   = isHit || isActive ? 2.5 : 1.5;

            return (
              <g key={edge.id} style={{ opacity }}>
                <path d={d} fill="none" stroke="transparent" strokeWidth="12" />
                <path d={d} fill="none" stroke={stroke} strokeWidth={width}
                  markerEnd={`url(#${marker})`}
                  {...(isActive ? { strokeDasharray: "6 3", className: "edge-flow" } : {})}
                />
              </g>
            );
          })}
        </svg>

        {/* ── Node cards ── */}
        {workflow.nodes.map((node) => {
          const isSelected  = node.id === selectedNodeId;
          const pos         = node.position || { x: 0, y: 0 };
          const incoming    = workflow.edges.filter((e) => e.target === node.id).length;
          const outgoing    = workflow.edges.filter((e) => e.source === node.id).length;
          const exStatus    = executionState[node.id];
          const toolCount   = ((node.builtinTools || []).length + (node.customTools || []).length);

          // ── Tool node ─────────────────────────────────────────────────────
          if (node.type === "tool") {
            const toolBorder = isSelected
              ? "border-primary ring-2 ring-primary/15"
              : "border-dashed border-hairlineStrong";
            const dimStyle = !!highlightNodeId && node.id !== highlightNodeId ? { opacity: 0.4 } : {};
            return (
              <div
                key={node.id}
                className={`absolute z-10 cursor-grab select-none rounded-md border bg-panel px-3 py-2.5 shadow-soft transition-opacity active:cursor-grabbing ${toolBorder}`}
                style={{ left: pos.x, top: pos.y, width: TOOL_NODE_WIDTH, minHeight: TOOL_NODE_HEIGHT, ...dimStyle }}
                onPointerDown={(e) => startDrag(e, node)}
                onMouseEnter={() => setHoveredId(node.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={(e) => { e.stopPropagation(); selectNode(node.id); }}
                role="button"
                tabIndex={0}
              >
                {/* Ports — same primary color as agent nodes */}
                <span className="absolute -left-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-panel bg-primary" />
                <span className="absolute -right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-panel bg-primary" />

                <div className="flex items-start gap-2">
                  <div className="mt-0.5 rounded-md bg-surfaceStrong p-1.5 text-ink">
                    <Wrench size={13} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-semibold text-ink">{node.name}</div>
                    <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
                      {node.toolType === "builtin" ? "Builtin" : node.toolType === "mcp" ? "MCP" : node.toolType === "custom" ? "Custom" : "HTTP API"}
                    </div>
                  </div>
                  {/* Permanent delete button */}
                  <button
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted transition hover:bg-error/10 hover:text-error"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); deleteNode(node.id); }}
                    title="Remove tool"
                  >
                    <X size={12} />
                  </button>
                </div>

                <div className="mt-2 truncate text-[11px] text-muted">
                  {node.toolType === "http" && node.endpoint
                    ? node.endpoint
                    : node.toolType === "builtin" && node.builtinId
                      ? node.builtinId
                      : node.description || "Not configured yet"}
                </div>
              </div>
            );
          }

          let borderClass =
            exStatus === "running"   ? "border-yellow-400 ring-2 ring-yellow-400/30" :
            exStatus === "completed" ? "border-green-500  ring-2 ring-green-500/20"  :
            exStatus === "failed"    ? "border-red-500    ring-2 ring-red-500/20"    :
            isSelected               ? "border-primary    ring-2 ring-primary/15"    :
                                       "border-hairlineStrong";

          // Dim nodes that are not hovered/selected when something IS highlighted
          const nodeDim = !!highlightNodeId && node.id !== highlightNodeId
            ? { opacity: 0.45 }
            : {};

          return (
            <div key={node.id} className="absolute z-10" style={{ left: pos.x, top: pos.y }}>
              {/* Port dots — always full opacity, outside the dim wrapper */}
              <span className="absolute -left-1.5 top-1/2 z-20 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-panel bg-primary" />
              <span className="absolute -right-1.5 top-1/2 z-20 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-panel bg-primary" style={{ left: NODE_WIDTH - 6 }} />
            <div
              className={`cursor-grab select-none rounded-md border bg-panel px-4 py-3 shadow-soft transition-opacity active:cursor-grabbing ${borderClass}`}
              style={{ width: NODE_WIDTH, minHeight: NODE_HEIGHT, ...nodeDim }}
              onPointerDown={(e) => startDrag(e, node)}
              onMouseEnter={() => setHoveredId(node.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={(e) => { e.stopPropagation(); selectNode(node.id); }}
              role="button"
              tabIndex={0}
            >
              {/* Execution badge */}
              {exStatus === "running" && (
                <span className="absolute -right-1.5 -top-1.5 h-4 w-4 rounded-full bg-yellow-400 ring-2 ring-panel animate-pulse" />
              )}
              {exStatus === "completed" && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-green-500 ring-2 ring-panel text-[8px] font-bold text-white">✓</span>
              )}
              {exStatus === "failed" && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 ring-2 ring-panel text-[8px] font-bold text-white">✗</span>
              )}


              <div className="flex items-start gap-2">
                <div className={`mt-0.5 rounded-md p-1.5 ${nodeAccent(node.type)}`}>
                  {nodeIcon(node.type)}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[15px] font-semibold leading-snug text-ink">{node.name}</div>
                  <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
                    {NODE_TYPE_LABELS[node.type] || node.type}
                  </div>
                </div>
              </div>

              {toolCount > 0 && (
                <div className="mt-2 flex items-center gap-1">
                  <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/8 px-2 py-0.5 text-[10px] font-medium text-primary">
                    <Wrench size={9} />
                    {toolCount} tool{toolCount !== 1 ? "s" : ""}
                  </span>
                </div>
              )}

              <div className="mt-2 line-clamp-2 min-h-[28px] text-[12px] leading-snug text-body">
                {nodeSummary(node)}
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-hairline pt-2 text-[11px] text-muted">
                <span className="truncate">
                  {node.type === "user_input" ? "runtime input" : node.type === "output" ? "output sink" : node.model || "no model"}
                </span>
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2 size={11} />
                  {incoming}↓ {outgoing}↑
                </span>
              </div>
            </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
