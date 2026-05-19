import {
  AlignCenterHorizontal, AlignCenterVertical,
  AlignEndHorizontal, AlignEndVertical,
  AlignStartHorizontal, AlignStartVertical,
  AlignHorizontalSpaceAround, AlignVerticalSpaceAround,
  LayoutDashboard, Maximize2, Minus, ZoomIn
} from "lucide-react";
import { useWorkflowStore } from "../../store/workflowStore.js";

// ── alignment helpers ─────────────────────────────────────────────────────────

const NODE_W = (n) => n.type === "tool" ? 192 : 236;
const NODE_H = (n) => n.type === "tool" ? 92  : 124;

function alignNodes(nodes, ids, dir, updateNode) {
  const targets = nodes.filter((n) => ids.includes(n.id));
  if (targets.length < 2) return;
  const xs  = targets.map((n) => n.position?.x ?? 0);
  const ys  = targets.map((n) => n.position?.y ?? 0);
  const x2s = targets.map((n) => (n.position?.x ?? 0) + NODE_W(n));
  const y2s = targets.map((n) => (n.position?.y ?? 0) + NODE_H(n));
  targets.forEach((n) => {
    let x = n.position?.x ?? 0, y = n.position?.y ?? 0;
    if (dir === "left")   x = Math.min(...xs);
    if (dir === "right")  x = Math.max(...x2s) - NODE_W(n);
    if (dir === "center") x = (Math.min(...xs) + Math.max(...x2s)) / 2 - NODE_W(n) / 2;
    if (dir === "top")    y = Math.min(...ys);
    if (dir === "bottom") y = Math.max(...y2s) - NODE_H(n);
    if (dir === "middle") y = (Math.min(...ys) + Math.max(...y2s)) / 2 - NODE_H(n) / 2;
    updateNode(n.id, { position: { x, y } });
  });
}

function distributeNodes(nodes, ids, dir, updateNode) {
  const targets = nodes.filter((n) => ids.includes(n.id));
  if (targets.length < 3) return;
  if (dir === "h") {
    const sorted = [...targets].sort((a, b) => (a.position?.x ?? 0) - (b.position?.x ?? 0));
    const total  = sorted.reduce((s, n) => s + NODE_W(n), 0);
    const span   = (sorted.at(-1).position?.x ?? 0) + NODE_W(sorted.at(-1)) - (sorted[0].position?.x ?? 0);
    const gap    = (span - total) / (sorted.length - 1);
    let cur = sorted[0].position?.x ?? 0;
    sorted.forEach((n) => { updateNode(n.id, { position: { x: cur, y: n.position?.y ?? 0 } }); cur += NODE_W(n) + gap; });
  } else {
    const sorted = [...targets].sort((a, b) => (a.position?.y ?? 0) - (b.position?.y ?? 0));
    const total  = sorted.reduce((s, n) => s + NODE_H(n), 0);
    const span   = (sorted.at(-1).position?.y ?? 0) + NODE_H(sorted.at(-1)) - (sorted[0].position?.y ?? 0);
    const gap    = (span - total) / (sorted.length - 1);
    let cur = sorted[0].position?.y ?? 0;
    sorted.forEach((n) => { updateNode(n.id, { position: { x: n.position?.x ?? 0, y: cur } }); cur += NODE_H(n) + gap; });
  }
}

// ── toolbar button ────────────────────────────────────────────────────────────

function TBtn({ Icon, title, onClick, active = false, disabled = false, label }) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-8 items-center justify-center gap-1.5 rounded px-2 transition disabled:cursor-not-allowed disabled:opacity-30 ${
        active
          ? "bg-ink text-canvas"
          : "text-muted hover:bg-canvasSoft hover:text-ink"
      }`}
    >
      <Icon size={16} strokeWidth={1.8} />
      {label && <span className="text-[11px] font-semibold tabular-nums">{label}</span>}
    </button>
  );
}

function Divider() {
  return <div className="mx-1 h-5 w-px shrink-0 bg-hairline" />;
}

// ── main component ────────────────────────────────────────────────────────────

export default function CanvasToolbar() {
  const workflow           = useWorkflowStore((s) => s.workflow);
  const updateNode         = useWorkflowStore((s) => s.updateNode);
  const autoLayoutWorkflow = useWorkflowStore((s) => s.autoLayoutWorkflow);
  const selectedNodeIds    = useWorkflowStore((s) => s.canvasSelectedIds);
  const canvasZoom         = useWorkflowStore((s) => s.canvasZoom);
  const requestCanvasZoom  = useWorkflowStore((s) => s.requestCanvasZoom);

  const multi = selectedNodeIds.length >= 2;

  return (
    <div className="flex h-11 shrink-0 items-center border-b border-hairline bg-canvas px-3">

      {/* ── Align & Distribute — only when 2+ selected ── */}
      {multi && (
        <>
          <Divider />
          <div className="flex items-center gap-0.5">
            <TBtn Icon={AlignStartHorizontal}  title="Align left"   onClick={() => alignNodes(workflow.nodes, selectedNodeIds, "left",   updateNode)} />
            <TBtn Icon={AlignCenterHorizontal} title="Align center" onClick={() => alignNodes(workflow.nodes, selectedNodeIds, "center", updateNode)} />
            <TBtn Icon={AlignEndHorizontal}    title="Align right"  onClick={() => alignNodes(workflow.nodes, selectedNodeIds, "right",  updateNode)} />
          </div>
          <div className="flex items-center gap-0.5">
            <TBtn Icon={AlignStartVertical}  title="Align top"    onClick={() => alignNodes(workflow.nodes, selectedNodeIds, "top",    updateNode)} />
            <TBtn Icon={AlignCenterVertical} title="Align middle" onClick={() => alignNodes(workflow.nodes, selectedNodeIds, "middle", updateNode)} />
            <TBtn Icon={AlignEndVertical}    title="Align bottom" onClick={() => alignNodes(workflow.nodes, selectedNodeIds, "bottom", updateNode)} />
          </div>
          <Divider />
          <div className="flex items-center gap-0.5">
            <TBtn Icon={AlignHorizontalSpaceAround} title="Distribute horizontally" disabled={selectedNodeIds.length < 3} onClick={() => distributeNodes(workflow.nodes, selectedNodeIds, "h", updateNode)} />
            <TBtn Icon={AlignVerticalSpaceAround}   title="Distribute vertically"   disabled={selectedNodeIds.length < 3} onClick={() => distributeNodes(workflow.nodes, selectedNodeIds, "v", updateNode)} />
          </div>
        </>
      )}

      <div className="flex-1" />

      {/* ── Auto layout ── */}
      <TBtn Icon={LayoutDashboard} title="Auto layout (Ctrl+Shift+L)" onClick={autoLayoutWorkflow} />

      <Divider />

      {/* ── Zoom controls ── */}
      <div className="flex items-center gap-0.5">
        <TBtn Icon={Minus}    title="Zoom out"    onClick={() => requestCanvasZoom("out")} />
        <button
          className="flex h-8 min-w-[48px] items-center justify-center rounded px-1 text-[11px] font-semibold tabular-nums text-muted transition hover:bg-canvasSoft hover:text-ink"
          onClick={() => requestCanvasZoom("fit")}
          title="Click to fit view"
        >
          {Math.round(canvasZoom * 100)}%
        </button>
        <TBtn Icon={ZoomIn}   title="Zoom in"     onClick={() => requestCanvasZoom("in")} />
        <TBtn Icon={Maximize2} title="Fit to view" onClick={() => requestCanvasZoom("fit")} />
      </div>
    </div>
  );
}
