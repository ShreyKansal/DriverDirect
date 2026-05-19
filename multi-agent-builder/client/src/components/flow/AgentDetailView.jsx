import { Bot, Crown, FileInput, FileOutput, Link2, X } from "lucide-react";
import { useWorkflowStore } from "../../store/workflowStore.js";
import { NODE_TYPE_LABELS } from "../../utils/graphUtils.js";
import AgentConfigPanel from "../config/AgentConfigPanel.jsx";
import ConnectionsPanel from "./ConnectionsPanel.jsx";
import { useEffect, useState } from "react";

function nodeAccentColor(type) {
  if (type === "orchestrator") return "bg-primary text-white";
  if (type === "user_input")   return "bg-surfaceStrong text-ink";
  if (type === "output")       return "bg-ink text-canvas";
  return "bg-canvasSoft text-ink";
}

function NodeIcon({ type, size = 16 }) {
  if (type === "orchestrator") return <Crown size={size} />;
  if (type === "user_input")   return <FileInput size={size} />;
  if (type === "output")       return <FileOutput size={size} />;
  return <Bot size={size} />;
}

const TABS = [
  { id: "config",      label: "Config"      },
  { id: "connections", label: "Connections" },
];

export default function AgentDetailView({ agentId, onClose }) {
  const workflow   = useWorkflowStore((s) => s.workflow);
  const selectNode = useWorkflowStore((s) => s.selectNode);
  const [tab, setTab] = useState("config");

  const node = workflow.nodes.find((n) => n.id === agentId);

  useEffect(() => {
    selectNode(agentId);
  }, [agentId, selectNode]);

  if (!node) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-muted">
        <p className="text-[13px]">Agent not found.</p>
        <button className="btn text-[12px]" onClick={onClose}>Close</button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-canvas">
      {/* Agent header */}
      <div className="flex h-12 shrink-0 items-center gap-3 border-b border-hairline bg-panel px-4">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${nodeAccentColor(node.type)}`}>
          <NodeIcon type={node.type} size={15} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold text-ink">{node.name}</p>
          <p className="text-[11px] text-muted">{NODE_TYPE_LABELS[node.type] ?? node.type}</p>
        </div>
        {node.model && (
          <span className="shrink-0 rounded-full border border-hairlineStrong bg-canvasSoft px-2.5 py-0.5 text-[11px] font-semibold text-muted">
            {node.model}
          </span>
        )}
        <button
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-muted transition hover:bg-canvasSoft hover:text-ink"
          onClick={onClose}
          title="Close agent tab"
        >
          <X size={15} />
        </button>
      </div>

      {/* Sub-tabs */}
      <div className="flex h-9 shrink-0 items-stretch border-b border-hairline bg-canvasSoft">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`relative flex items-center justify-center px-5 text-[12px] font-semibold transition ${
              tab === id ? "text-ink" : "text-muted hover:text-ink"
            }`}
          >
            {label}
            {tab === id && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary" />}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-0 flex-1 overflow-hidden">
        {tab === "config" && (
          <AgentConfigPanel showProject={false} onProjectSettings={() => {}} />
        )}
        {tab === "connections" && (
          <ConnectionsPanel />
        )}
      </div>
    </div>
  );
}
