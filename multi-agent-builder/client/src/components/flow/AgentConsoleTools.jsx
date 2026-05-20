import { useState } from "react";
import { ChevronDown, Edit2, Plus, Trash2, Wrench } from "lucide-react";
import { useWorkflowStore } from "../../store/workflowStore.js";
import ToolPicker from "../config/ToolPicker.jsx";
import CustomToolEditor from "../config/CustomToolEditor.jsx";
import { nodeIcon } from "../ui/entityIcons.jsx";

const TOOL_MODES = [
  { value: "auto",       label: "Auto",       desc: "Model decides when to use tools"    },
  { value: "sequential", label: "Sequential", desc: "One tool at a time, in order"       },
  { value: "parallel",   label: "Parallel",   desc: "Multiple tools can run at once"     },
];

function AccordionSection({ label, badge, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-[2px] border border-hairline">
      <button
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-canvasSoft"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-ink">{label}</span>
          {badge != null && (
            <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
              {badge}
            </span>
          )}
        </div>
        <ChevronDown
          size={12}
          className={`text-muted transition-transform duration-150 ${open ? "" : "-rotate-90"}`}
        />
      </button>
      {open && <div className="border-t border-hairline px-4 pb-5 pt-3">{children}</div>}
    </div>
  );
}

function ToolNodesSection({ agentId, workflow }) {
  const openAgentTab = useWorkflowStore((s) => s.openAgentTab);

  const attachedToolNodes = workflow.nodes.filter((n) =>
    n.type === "tool" &&
    workflow.edges.some((e) => e.source === agentId && e.target === n.id && e.type === "tool")
  );

  if (attachedToolNodes.length === 0) {
    return (
      <p className="text-[12px] text-muted">
        No Tool Nodes connected. Add a Tool Node on the canvas and connect it to this agent.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {attachedToolNodes.map((tn) => (
        <div
          key={tn.id}
          className="flex items-center gap-2 rounded-[2px] border border-hairline bg-canvasSoft px-3 py-2"
        >
          {nodeIcon(tn.type, 12)}
          <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-ink">{tn.name}</span>
          <button
            className="flex items-center gap-1 text-[11px] text-muted transition hover:text-ink"
            onClick={() => openAgentTab(tn.id)}
            title="Open tool node"
          >
            <Edit2 size={11} />
            Edit
          </button>
        </div>
      ))}
    </div>
  );
}

function BuiltinToolsSection({ node, update }) {
  return (
    <div>
      <ToolPicker
        selectedTools={node.builtinTools || []}
        onChange={(tools) => update({ builtinTools: tools })}
      />
      {(node.builtinTools || []).length > 0 && (
        <p className="mt-2 text-[11px] text-muted">
          {node.builtinTools.length} built-in tool{node.builtinTools.length !== 1 ? "s" : ""} active.
        </p>
      )}
    </div>
  );
}

function CustomToolsSection({ node, update, agentId }) {
  const addTool = useWorkflowStore((s) => s.addTool);
  const setStatusMessage = useWorkflowStore((s) => s.setStatusMessage);
  const [editing, setEditing] = useState(null);

  const customTools = node.customTools || [];

  function handleAdd() {
    const newTool = { name: "New Tool", description: "", code: "def run(input):\n    return input", trigger: "" };
    const updated = [...customTools, newTool];
    update({ customTools: updated });
    setEditing(updated.length - 1);
  }

  function handleUpdate(idx, updates) {
    const updated = customTools.map((t, i) => i === idx ? { ...t, ...updates } : t);
    update({ customTools: updated });
  }

  function handleDelete(idx) {
    update({ customTools: customTools.filter((_, i) => i !== idx) });
    if (editing === idx) setEditing(null);
  }

  if (editing !== null && customTools[editing]) {
    return (
      <div>
        <button
          className="mb-3 flex items-center gap-1 text-[11px] text-muted transition hover:text-ink"
          onClick={() => setEditing(null)}
        >
          ← Back to list
        </button>
        <CustomToolEditor
          tool={customTools[editing]}
          onUpdate={(updates) => handleUpdate(editing, updates)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {customTools.length === 0 && (
        <p className="text-[12px] text-muted">No custom tools yet.</p>
      )}
      {customTools.map((tool, idx) => (
        <div
          key={idx}
          className="flex items-center gap-2 rounded-[2px] border border-hairline bg-canvasSoft px-3 py-2"
        >
          <Wrench size={12} className="shrink-0 text-muted" />
          <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-ink">{tool.name || "Unnamed"}</span>
          <button
            className="text-[11px] text-muted transition hover:text-ink"
            onClick={() => setEditing(idx)}
          >
            <Edit2 size={11} />
          </button>
          <button
            className="text-[11px] text-muted transition hover:text-error"
            onClick={() => handleDelete(idx)}
          >
            <Trash2 size={11} />
          </button>
        </div>
      ))}
      <button
        className="flex h-8 w-full items-center justify-center gap-1.5 rounded-[2px] border border-dashed border-hairlineStrong text-[12px] text-muted transition hover:border-primary hover:text-primary"
        onClick={handleAdd}
      >
        <Plus size={12} />
        Add Custom Tool
      </button>
    </div>
  );
}

function ToolBehaviorSection({ node, update }) {
  const toolMode  = node.toolMode  || "auto";
  const maxCalls  = node.maxToolCalls  ?? 10;
  const timeout   = node.toolTimeout   ?? 30;

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-2 block text-[13px] font-semibold text-ink">Tool Mode</label>
        <div className="space-y-2">
          {TOOL_MODES.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => update({ toolMode: opt.value })}
              className={`flex w-full items-center gap-3 rounded-[2px] border px-3 py-2 text-left transition ${
                toolMode === opt.value
                  ? "border-primary bg-primary/8"
                  : "border-hairline bg-canvasSoft hover:border-hairlineStrong"
              }`}
            >
              <div className={`h-3.5 w-3.5 shrink-0 rounded-full border-2 ${
                toolMode === opt.value ? "border-primary bg-primary" : "border-muted"
              }`} />
              <div>
                <p className="text-[12px] font-medium text-ink">{opt.label}</p>
                <p className="text-[11px] text-muted">{opt.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-[13px] font-semibold text-ink">Max Tool Calls</label>
          <input
            className="h-[32px] w-full rounded-[2px] border border-hairline bg-surfaceStrong px-3 text-[13px] text-ink outline-none transition focus:border-primary"
            type="number"
            min="1"
            max="100"
            value={maxCalls}
            onChange={(e) => update({ maxToolCalls: Number(e.target.value) })}
          />
          <p className="mt-0.5 text-[10px] text-muted">Per run</p>
        </div>
        <div>
          <label className="mb-1 block text-[13px] font-semibold text-ink">Tool Timeout (s)</label>
          <input
            className="h-[32px] w-full rounded-[2px] border border-hairline bg-surfaceStrong px-3 text-[13px] text-ink outline-none transition focus:border-primary"
            type="number"
            min="1"
            max="300"
            value={timeout}
            onChange={(e) => update({ toolTimeout: Number(e.target.value) })}
          />
          <p className="mt-0.5 text-[10px] text-muted">Seconds per call</p>
        </div>
      </div>
    </div>
  );
}

export default function AgentConsoleTools({ node, update, workflow, agentId }) {
  const builtinCount  = (node.builtinTools || []).length;
  const customCount   = (node.customTools  || []).length;
  const toolNodeCount = workflow.nodes.filter((n) =>
    n.type === "tool" &&
    workflow.edges.some((e) => e.source === agentId && e.target === n.id && e.type === "tool")
  ).length;
  const totalCount = builtinCount + customCount + toolNodeCount;

  return (
    <div className="space-y-4">
      <div className="border-b border-hairline pb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted/50">Tools</p>
        <p className="mt-1.5 text-[12px] text-muted">
          {totalCount > 0 ? `${totalCount} tool${totalCount !== 1 ? "s" : ""} active.` : "No tools configured."} Expand a section to add or configure.
        </p>
      </div>

      <AccordionSection label="Tool Nodes" badge={toolNodeCount} defaultOpen={toolNodeCount > 0}>
        <ToolNodesSection agentId={agentId} workflow={workflow} />
      </AccordionSection>

      <AccordionSection label="Built-in Tools" badge={builtinCount} defaultOpen={builtinCount > 0}>
        <BuiltinToolsSection node={node} update={update} />
      </AccordionSection>

      <AccordionSection label="Custom Tools" badge={customCount} defaultOpen={customCount > 0}>
        <CustomToolsSection node={node} update={update} agentId={agentId} />
      </AccordionSection>

      <AccordionSection label="Tool Behavior">
        <ToolBehaviorSection node={node} update={update} />
      </AccordionSection>
    </div>
  );
}
