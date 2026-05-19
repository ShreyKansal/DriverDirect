import { useState } from "react";
import { Bot, Crown, FileInput, FileOutput, X } from "lucide-react";

function nodeIcon(type, size = 14) {
  if (type === "orchestrator") return <Crown size={size} className="text-primary" />;
  if (type === "user_input")   return <FileInput size={size} className="text-muted" />;
  if (type === "output")       return <FileOutput size={size} className="text-muted" />;
  return <Bot size={size} className="text-muted" />;
}

const NODE_TYPE_LABEL = {
  user_input:   "Input",
  orchestrator: "Orchestrator",
  agent:        "Agent",
  output:       "Output",
};

export default function ImportWorkflowModal({ imported, onImport, onClose }) {
  const nodes = (imported.nodes || []).filter((n) => n.type !== "tool");
  const [selected, setSelected] = useState(() => new Set(nodes.map((n) => n.id)));

  const allSelected = selected.size === nodes.length;

  function toggle(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(nodes.map((n) => n.id)));
  }

  function handleImport() {
    if (!selected.size) return;
    onImport([...selected]);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="flex w-full max-w-md flex-col rounded-lg border border-hairlineStrong bg-panel shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">Import workflow</p>
            <h2 className="mt-0.5 text-[16px] font-semibold text-ink">From: {imported.sourceName}</h2>
          </div>
          <button
            className="flex h-7 w-7 items-center justify-center rounded text-muted transition hover:bg-canvasSoft hover:text-ink"
            onClick={onClose}
          >
            <X size={15} />
          </button>
        </div>

        {/* Select all toggle */}
        <div className="flex items-center justify-between border-b border-hairline px-5 py-2.5">
          <span className="text-[12px] text-muted">{selected.size} of {nodes.length} selected</span>
          <button
            className="text-[12px] font-medium text-primary hover:underline"
            onClick={toggleAll}
          >
            {allSelected ? "Deselect All" : "Select All"}
          </button>
        </div>

        {/* Node list */}
        <div className="max-h-72 min-h-0 overflow-y-auto py-1">
          {nodes.length === 0 ? (
            <p className="px-5 py-4 text-[13px] text-muted">No importable nodes in this workflow.</p>
          ) : (
            nodes.map((node) => (
              <label
                key={node.id}
                className="flex cursor-pointer items-center gap-3 px-5 py-2.5 transition hover:bg-canvasSoft"
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
                  {node.role && (
                    <span className="block truncate text-[11px] text-muted">{node.role}</span>
                  )}
                </span>
                <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted ring-1 ring-hairline">
                  {NODE_TYPE_LABEL[node.type] ?? node.type}
                </span>
              </label>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-hairline px-5 py-4">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button
            className="btn-primary"
            disabled={!selected.size}
            onClick={handleImport}
          >
            Import Selected ({selected.size})
          </button>
        </div>
      </div>
    </div>
  );
}
