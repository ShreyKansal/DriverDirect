import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Terminal, X } from "lucide-react";
import { useWorkflowStore } from "../../store/workflowStore.js";
import { NODE_TYPE_LABELS } from "../../utils/graphUtils.js";
import { nodeIcon } from "../ui/entityIcons.jsx";
import AgentDevMode from "./AgentDevMode.jsx";
import AgentConsoleIdentity from "./AgentConsoleIdentity.jsx";
import AgentConsoleInstructions from "./AgentConsoleInstructions.jsx";
import AgentConsoleModel from "./AgentConsoleModel.jsx";
import AgentConsoleTools from "./AgentConsoleTools.jsx";
import AgentConsoleConnections from "./AgentConsoleConnections.jsx";
import AgentConsoleOutput from "./AgentConsoleOutput.jsx";

const SIDEBAR_GROUPS = [
  {
    label: "DEVELOPER",
    items: [{ id: "devMode", label: "Dev Mode" }],
  },
  {
    label: "CONFIGURE",
    items: [
      { id: "identity",     label: "Identity"     },
      { id: "instructions", label: "Instructions" },
      { id: "model",        label: "Model"         },
      { id: "tools",        label: "Tools"         },
      { id: "connections",  label: "Connections"  },
      { id: "output",       label: "Output"        },
    ],
  },
];

function Sidebar({ active, onSelect }) {
  return (
    <aside
      className="slim-scroll shrink-0 overflow-y-auto border-r border-hairline bg-panel"
      style={{ width: 220 }}
    >
      <nav className="pb-6 pt-2">
        {SIDEBAR_GROUPS.map((group) => (
          <div key={group.label} className="mb-1">
            <p className="px-4 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-widest text-muted">
              {group.label}
            </p>
            {group.items.map((item) => {
              const isActive = active === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => onSelect(item.id)}
                  className={`flex w-full items-center gap-1.5 py-[3px] text-left text-[13px] leading-[22px] select-none outline-none ${
                    isActive ? "font-semibold text-ink" : "font-normal text-body hover:text-ink"
                  }`}
                  style={
                    isActive
                      ? {
                          borderLeft: "3px solid rgb(var(--color-primary))",
                          paddingLeft: 13,
                          paddingRight: 12,
                          backgroundColor: "rgb(var(--color-canvas-soft))",
                        }
                      : {
                          borderLeft: "3px solid transparent",
                          paddingLeft: 13,
                          paddingRight: 12,
                        }
                  }
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = "rgb(var(--color-canvas-soft))";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = "";
                  }}
                >
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}

function EmptyNode({ onClose }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-muted">
      <p className="text-[13px]">Node not found.</p>
      <button className="btn text-[12px]" onClick={onClose}>Close</button>
    </div>
  );
}

export default function AgentDetailView({ agentId, onClose }) {
  const workflow   = useWorkflowStore((s) => s.workflow);
  const selectNode = useWorkflowStore((s) => s.selectNode);
  const updateNode = useWorkflowStore((s) => s.updateNode);

  const [activeSection, setActiveSection] = useState("devMode");
  const devModeRunRef = useRef(null);

  const node = useWorkflowStore(
    useCallback((s) => s.workflow.nodes.find((n) => n.id === agentId) || null, [agentId])
  );

  const nodeTypeLabel = useMemo(
    () => (node ? (NODE_TYPE_LABELS[node.type] ?? node.type) : "Node"),
    [node]
  );

  useEffect(() => {
    selectNode(agentId);
  }, [agentId, selectNode]);

  useEffect(() => {
    setActiveSection("devMode");
  }, [agentId]);

  if (!node) return <EmptyNode onClose={onClose} />;

  const update = (updates) => updateNode(node.id, updates);

  const isExecutable = node.type === "agent" || node.type === "orchestrator";
  const isInput      = node.type === "user_input";
  const isOutput     = node.type === "output";
  const showConfigSections = !isInput && !isOutput;

  function handleRunButton() {
    setActiveSection("devMode");
    setTimeout(() => devModeRunRef.current?.focus(), 80);
  }

  function renderSection() {
    switch (activeSection) {
      case "devMode":
        return (
          <AgentDevMode
            agentId={agentId}
            node={node}
            workflow={workflow}
            runInputRef={devModeRunRef}
          />
        );
      case "identity":
        return <AgentConsoleIdentity node={node} update={update} />;
      case "instructions":
        return (
          <AgentConsoleInstructions
            node={node}
            update={update}
            isInput={isInput}
            isOutput={isOutput}
          />
        );
      case "model":
        if (!showConfigSections) return <SectionGated type={node.type} section="Model" />;
        return <AgentConsoleModel node={node} update={update} />;
      case "tools":
        if (!showConfigSections) return <SectionGated type={node.type} section="Tools" />;
        return <AgentConsoleTools node={node} update={update} workflow={workflow} agentId={agentId} />;
      case "connections":
        return <AgentConsoleConnections agentId={agentId} />;
      case "output":
        return <AgentConsoleOutput node={node} update={update} agentId={agentId} />;
      default:
        return null;
    }
  }

  return (
    <div className="flex h-full min-w-0 flex-col bg-canvas">
      {/* Header */}
      <div className="flex h-12 shrink-0 items-center gap-3 border-b border-hairline bg-panel px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center">
          {nodeIcon(node.type, 18)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold text-ink">{node.name}</p>
          <p className="text-[11px] text-muted">Workflow / {node.name}</p>
        </div>
        {node.model && (
          <span className="shrink-0 rounded-full border border-hairlineStrong bg-canvasSoft px-2.5 py-0.5 text-[11px] font-semibold text-muted">
            {node.model}
          </span>
        )}
        <button
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded transition hover:bg-canvasSoft ${
            activeSection === "devMode" ? "text-primary" : "text-muted hover:text-ink"
          }`}
          onClick={handleRunButton}
          title="Dev Mode"
        >
          <Terminal size={15} />
        </button>
        <button
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-muted transition hover:bg-canvasSoft hover:text-ink"
          onClick={onClose}
          title="Close tab"
        >
          <X size={15} />
        </button>
      </div>

      {/* Body */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Sidebar active={activeSection} onSelect={setActiveSection} />
        <div className="slim-scroll min-w-0 flex-1 overflow-auto">
          <div className="mx-auto h-full max-w-[860px] min-w-0 px-8 py-6">
            {renderSection()}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionGated({ type, section }) {
  const label = NODE_TYPE_LABELS[type] ?? type;
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <p className="text-[13px] font-semibold text-ink">{section} not available</p>
      <p className="max-w-xs text-[12px] text-muted">
        {label} nodes do not have {section.toLowerCase()} configuration.
      </p>
    </div>
  );
}
