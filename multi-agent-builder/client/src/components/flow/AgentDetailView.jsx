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
      <nav className="pb-6 pt-3">
        {SIDEBAR_GROUPS.map((group, gi) => (
          <div key={group.label} className={gi > 0 ? "mt-4" : ""}>
            <p className="px-4 pb-0.5 pt-1 text-[9.5px] font-bold uppercase tracking-[0.12em] text-muted/50">
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
                  className={`flex w-full items-center gap-1.5 py-[4px] text-left text-[13px] leading-[20px] select-none outline-none transition-colors ${
                    isActive ? "font-medium text-ink" : "font-normal text-muted hover:text-body"
                  }`}
                  style={
                    isActive
                      ? {
                          borderLeft: "2px solid rgb(var(--color-primary))",
                          paddingLeft: 14,
                          paddingRight: 12,
                        }
                      : {
                          borderLeft: "2px solid transparent",
                          paddingLeft: 14,
                          paddingRight: 12,
                        }
                  }
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
      <div className="flex h-11 shrink-0 items-center gap-2 border-b border-hairline bg-panel px-3">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center">
          {nodeIcon(node.type, 15)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[11px] text-muted">
            <span className="truncate max-w-[120px]">{node.name}</span>
          </div>
        </div>
        {node.model && (
          <span className="shrink-0 rounded-full border border-hairline bg-canvasSoft px-2 py-0.5 text-[10px] font-medium text-muted">
            {node.model}
          </span>
        )}
        <button
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded transition ${
            activeSection === "devMode"
              ? "text-primary"
              : "text-muted/60 hover:bg-canvasSoft hover:text-muted"
          }`}
          onClick={handleRunButton}
          title="Dev Mode (terminal)"
        >
          <Terminal size={13} />
        </button>
        <button
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted/50 transition hover:bg-canvasSoft hover:text-muted"
          onClick={onClose}
          title="Close tab"
        >
          <X size={13} />
        </button>
      </div>

      {/* Body */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Sidebar active={activeSection} onSelect={setActiveSection} />
        <div className="slim-scroll min-w-0 flex-1 overflow-auto">
          <div className="mx-auto h-full max-w-[760px] min-w-0 px-10 py-8">
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
