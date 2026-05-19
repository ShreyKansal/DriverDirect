import { useRef, useState, useEffect } from "react";
import { Bot, Crown, FileInput, FileOutput, Link2, Plus, X } from "lucide-react";
import { useWorkflowStore } from "../../store/workflowStore.js";
import { NODE_TYPE_LABELS } from "../../utils/graphUtils.js";

function nodeIcon(type, size = 13) {
  if (type === "orchestrator") return <Crown size={size} className="text-primary" />;
  if (type === "user_input")   return <FileInput size={size} className="text-muted" />;
  if (type === "output")       return <FileOutput size={size} className="text-muted" />;
  return <Bot size={size} className="text-muted" />;
}

function NodePicker({ nodes, exclude, onPick, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [onClose]);

  const options = nodes.filter((n) => !exclude.includes(n.id) && n.type !== "tool");

  return (
    <div
      ref={ref}
      className="absolute left-3 right-3 top-full z-50 mt-1 max-h-52 overflow-y-auto rounded-[2px] border border-hairline bg-panel py-1 shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
    >
      {options.length === 0 ? (
        <p className="px-3 py-2 text-[12px] text-muted">No other nodes to connect to.</p>
      ) : (
        options.map((n) => (
          <button
            key={n.id}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] text-body transition hover:bg-canvasSoft hover:text-ink"
            onClick={() => { onPick(n.id); onClose(); }}
          >
            {nodeIcon(n.type)}
            <span className="min-w-0 flex-1 truncate">{n.name}</span>
            <span className="shrink-0 text-[10px] text-muted">{NODE_TYPE_LABELS[n.type] ?? n.type}</span>
          </button>
        ))
      )}
    </div>
  );
}

function ConnectionRow({ node, edgeId, direction, onRemove, onSelect }) {
  return (
    <div className="group flex items-center gap-2 rounded-[2px] px-3 py-1.5 transition hover:bg-canvasSoft">
      <span className={`shrink-0 text-[11px] font-bold ${direction === "in" ? "text-primary" : "text-muted"}`}>
        {direction === "in" ? "◀" : "▶"}
      </span>
      <button
        className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
        onClick={onSelect}
        title="Go to node"
      >
        {nodeIcon(node.type)}
        <span className="truncate text-[12px] font-medium text-ink">{node.name}</span>
        <span className="text-[10px] text-muted">{NODE_TYPE_LABELS[node.type] ?? node.type}</span>
      </button>
      <button
        className="shrink-0 rounded-[2px] p-0.5 text-muted opacity-0 transition hover:bg-error/10 hover:text-error group-hover:opacity-100"
        onClick={() => onRemove(edgeId)}
        title="Remove connection"
      >
        <X size={12} />
      </button>
    </div>
  );
}

export default function ConnectionsPanel() {
  const workflow        = useWorkflowStore((s) => s.workflow);
  const selectedNodeId  = useWorkflowStore((s) => s.selectedNodeId);
  const selectNode      = useWorkflowStore((s) => s.selectNode);
  const focusNode       = useWorkflowStore((s) => s.focusNode);
  const connectNodes    = useWorkflowStore((s) => s.connectNodes);
  const removeEdge      = useWorkflowStore((s) => s.removeEdge);
  const selectEdge      = useWorkflowStore((s) => s.selectEdge);
  const clearSelectedEdge = useWorkflowStore((s) => s.clearSelectedEdge);

  const [pickerMode, setPickerMode] = useState(null);
  const addBtnRef = useRef(null);

  const node    = workflow.nodes.find((n) => n.id === selectedNodeId);
  const nodeById = new Map(workflow.nodes.map((n) => [n.id, n]));

  if (!node) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center bg-canvas">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-hairline bg-canvasSoft">
          <Link2 size={18} className="text-muted" />
        </div>
        <p className="text-[13px] font-semibold text-ink">Select a node</p>
        <p className="text-[12px] text-body">Click any node on the canvas to view its connections.</p>
      </div>
    );
  }

  const flowEdges = workflow.edges.filter((e) => e.type !== "tool");
  const incoming  = flowEdges.filter((e) => e.target === selectedNodeId);
  const outgoing  = flowEdges.filter((e) => e.source === selectedNodeId);

  const alreadyConnected = [
    ...incoming.map((e) => e.source),
    ...outgoing.map((e) => e.target),
    selectedNodeId,
  ];

  function goTo(id) {
    selectNode(id);
    focusNode(id);
  }

  return (
    <div className="flex h-full flex-col bg-canvas">
      {/* Node summary */}
      <div className="shrink-0 border-b border-hairline px-4 py-3">
        <div className="flex items-center gap-2">
          {nodeIcon(node.type, 14)}
          <span className="truncate text-[13px] font-semibold text-ink">{node.name}</span>
        </div>
        <p className="mt-0.5 text-[11px] text-muted">
          {incoming.length} incoming · {outgoing.length} outgoing
        </p>
      </div>

      <div className="slim-scroll min-h-0 flex-1 overflow-y-auto">
        {/* Incoming */}
        <div className="border-b border-hairline px-4 pt-3 pb-3">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted">
            Incoming ({incoming.length})
          </p>
          {incoming.length === 0 ? (
            <p className="py-1 text-[12px] text-muted">No incoming connections.</p>
          ) : (
            incoming.map((e) => {
              const src = nodeById.get(e.source);
              if (!src) return null;
              return (
                <ConnectionRow
                  key={e.id}
                  node={src}
                  edgeId={e.id}
                  direction="in"
                  onRemove={(id) => { removeEdge(id); clearSelectedEdge(); }}
                  onSelect={() => { goTo(src.id); selectEdge(e.id); }}
                />
              );
            })
          )}
        </div>

        {/* Outgoing */}
        <div className="px-4 pt-3 pb-3">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted">
            Outgoing ({outgoing.length})
          </p>
          {outgoing.length === 0 ? (
            <p className="py-1 text-[12px] text-muted">No outgoing connections.</p>
          ) : (
            outgoing.map((e) => {
              const tgt = nodeById.get(e.target);
              if (!tgt) return null;
              return (
                <ConnectionRow
                  key={e.id}
                  node={tgt}
                  edgeId={e.id}
                  direction="out"
                  onRemove={(id) => { removeEdge(id); clearSelectedEdge(); }}
                  onSelect={() => { goTo(tgt.id); selectEdge(e.id); }}
                />
              );
            })
          )}
        </div>
      </div>

      {/* Add connection */}
      <div className="relative shrink-0 border-t border-hairline p-3">
        <button
          ref={addBtnRef}
          className="flex h-8 w-full items-center justify-center gap-1.5 rounded-[2px] border border-hairline bg-surfaceStrong text-[12px] font-medium text-body transition hover:brightness-110"
          onClick={() => setPickerMode(pickerMode ? null : "add")}
        >
          <Plus size={13} />
          Add Connection…
        </button>
        {pickerMode === "add" && (
          <NodePicker
            nodes={workflow.nodes}
            exclude={alreadyConnected}
            onPick={(targetId) => connectNodes(selectedNodeId, targetId)}
            onClose={() => setPickerMode(null)}
          />
        )}
      </div>
    </div>
  );
}
