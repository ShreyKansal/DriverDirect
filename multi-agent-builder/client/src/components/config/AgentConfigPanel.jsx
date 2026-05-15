import { useState, useEffect } from "react";
import {
  ArrowRight, Bot, Check, ChevronDown, ChevronRight, Copy,
  Crown, FileInput, FileOutput, MousePointerClick, Plus, Settings2,
  Trash2, Unlink, Wrench
} from "lucide-react";
import { useWorkflowStore } from "../../store/workflowStore.js";
import { BUILDER_TARGETS, DEFAULT_PLAN_CONSTRAINTS, NODE_TYPE_LABELS, NODE_TYPES } from "../../utils/graphUtils.js";
import { LAYOUT_PRESETS } from "../../utils/layoutUtils.js";
import OutputConfigModal from "../modals/OutputConfigModal.jsx";
import ModelSettings from "./ModelSettings.jsx";
import ToolPicker from "./ToolPicker.jsx";
import CustomToolEditor from "./CustomToolEditor.jsx";
import ToolConfigPanel from "./ToolConfigPanel.jsx";
import ProjectSettingsPanel from "../settings/ProjectSettingsPanel.jsx";
import Select from "../ui/Select.jsx";

function nodeIcon(type, size = 13) {
  if (type === "orchestrator") return <Crown size={size} />;
  if (type === "user_input")   return <FileInput size={size} />;
  if (type === "output")       return <FileOutput size={size} />;
  return <Bot size={size} />;
}

// Collapsible section — lightweight accordion
function Section({ label, children, defaultOpen = true, badge }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-hairline">
      <button
        className="flex w-full items-center justify-between px-4 py-2 text-left transition-colors hover:bg-canvasSoft/60"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</span>
        <div className="flex items-center gap-2">
          {badge != null && (
            <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
              {badge}
            </span>
          )}
          <ChevronDown
            size={12}
            className={`text-muted/60 transition-transform duration-150 ${open ? "" : "-rotate-90"}`}
          />
        </div>
      </button>
      {open && <div className="space-y-2 px-4 pb-3">{children}</div>}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-hairlineStrong bg-canvasSoft">
        <MousePointerClick size={20} className="text-muted" />
      </div>
      <div>
        <p className="text-[14px] font-semibold text-ink">Select a node</p>
        <p className="mt-1 text-[12px] leading-relaxed text-muted">
          Click any node on the canvas to configure it here.
        </p>
      </div>
    </div>
  );
}

// ─── Project settings view ────────────────────────────────────────────────────
function ProjectView({ onBack }) {
  const workflow        = useWorkflowStore((s) => s.workflow);
  const updateWorkflow  = useWorkflowStore((s) => s.updateWorkflow);
  const layoutPreset    = useWorkflowStore((s) => s.layoutPreset);
  const setLayoutPreset = useWorkflowStore((s) => s.setLayoutPreset);
  const projects        = useWorkflowStore((s) => s.projects);
  const activeProjectId = useWorkflowStore((s) => s.activeProjectId);
  const createProject   = useWorkflowStore((s) => s.createProject);
  const switchProject   = useWorkflowStore((s) => s.switchProject);
  const deleteProject   = useWorkflowStore((s) => s.deleteProject);

  const [constraintsOpen, setConstraintsOpen] = useState(false);
  const constraints    = { ...DEFAULT_PLAN_CONSTRAINTS, ...(workflow.planConstraints || {}) };
  const updateConstraint = (u) => updateWorkflow({ planConstraints: { ...constraints, ...u } });

  return (
    <div className="flex h-full flex-col bg-panel">
      <div className="flex items-center gap-2 border-b border-hairline px-4 py-3">
        <button className="icon-btn h-7 w-7" onClick={onBack} title="Back">
          <ArrowRight size={13} className="rotate-180" />
        </button>
        <p className="text-[13px] font-semibold text-ink">Project Settings</p>
      </div>

      <div className="panel-scroll flex-1 overflow-auto">
        <div className="space-y-3 px-4 py-4">
          <label className="field">
            <span>Project Name</span>
            <input className="input" value={workflow.name || ""} onChange={(e) => updateWorkflow({ name: e.target.value })} />
          </label>
          <label className="field">
            <span>Description</span>
            <textarea className="input min-h-14 resize-y" value={workflow.description || ""} onChange={(e) => updateWorkflow({ description: e.target.value })} />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="field">
              <span>Target</span>
              <Select
                value={workflow.builderTarget || "langgraph"}
                onChange={(v) => updateWorkflow({ builderTarget: v })}
                options={BUILDER_TARGETS.map((t) => ({ value: t.id, label: t.label }))}
              />
            </label>
            <label className="field">
              <span>Layout</span>
              <Select
                value={layoutPreset}
                onChange={(v) => setLayoutPreset(v)}
                options={Object.entries(LAYOUT_PRESETS).map(([id, p]) => ({ value: id, label: p.label }))}
              />
            </label>
          </div>
        </div>

        <Section label="Plan Constraints">
          <button className="flex w-full items-center justify-between text-xs text-body" onClick={() => setConstraintsOpen(!constraintsOpen)}>
            <span>Advanced constraints</span>
            <ChevronRight size={12} className={`transition-transform ${constraintsOpen ? "rotate-90" : ""}`} />
          </button>
          {constraintsOpen && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <label className="field">
                  <span>Max Steps</span>
                  <input className="input" type="number" min="1" value={constraints.maxAgentSteps} onChange={(e) => updateConstraint({ maxAgentSteps: Number(e.target.value) })} />
                </label>
                <label className="field">
                  <span>Handoff</span>
                  <Select
                    value={constraints.handoffPolicy}
                    onChange={(v) => updateConstraint({ handoffPolicy: v })}
                    options={[
                      { value: "configured_edges", label: "Edges" },
                      { value: "orchestrator_routes", label: "Orchestrator" },
                      { value: "manual_review", label: "Manual" }
                    ]}
                  />
                </label>
              </div>
              <label className="flex cursor-pointer items-center gap-2 rounded-md border border-hairline bg-canvasSoft px-3 py-2 text-xs text-body">
                <input type="checkbox" checked={constraints.requireFinalSynthesis} onChange={(e) => updateConstraint({ requireFinalSynthesis: e.target.checked })} />
                Require final synthesis
              </label>
              <label className="flex cursor-pointer items-center gap-2 rounded-md border border-hairline bg-canvasSoft px-3 py-2 text-xs text-body">
                <input type="checkbox" checked={constraints.allowParallelBranches} onChange={(e) => updateConstraint({ allowParallelBranches: e.target.checked })} />
                Allow parallel branches
              </label>
            </div>
          )}
        </Section>

        <Section label={`Projects`} badge={projects.length}>
          <button className="btn-primary h-9 w-full text-[12px]" onClick={() => createProject("New Project")}>
            <Plus size={14} /> New Project
          </button>
          <div className="space-y-1.5">
            {projects.map((proj) => (
              <div key={proj.id} className={`flex items-center justify-between rounded-lg border px-3 py-2 transition ${proj.id === activeProjectId ? "border-primary bg-primary/5" : "border-hairline bg-canvas"}`}>
                <button className="min-w-0 flex-1 text-left" onClick={() => switchProject(proj.id)}>
                  <p className={`truncate text-[12px] font-medium ${proj.id === activeProjectId ? "text-primary" : "text-ink"}`}>{proj.name}</p>
                  <p className="text-[10px] text-muted">{new Date(proj.updatedAt).toLocaleDateString()}</p>
                </button>
                <button className="ml-2 shrink-0 text-muted transition hover:text-error" onClick={() => deleteProject(proj.id)} title="Delete">
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
            {projects.length === 0 && (
              <p className="rounded-md border border-dashed border-hairlineStrong p-3 text-[11px] text-muted">No saved projects yet.</p>
            )}
          </div>
        </Section>
        <div className="h-4" />
      </div>
    </div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────
export default function AgentConfigPanel({ showProject, onProjectSettings }) {
  const workflow          = useWorkflowStore((s) => s.workflow);
  const selectedNodeId    = useWorkflowStore((s) => s.selectedNodeId);
  const updateNode        = useWorkflowStore((s) => s.updateNode);
  const duplicateNode     = useWorkflowStore((s) => s.duplicateNode);
  const deleteNode        = useWorkflowStore((s) => s.deleteNode);
  const saveSelectedAgent = useWorkflowStore((s) => s.saveSelectedAgent);
  const addTool           = useWorkflowStore((s) => s.addTool);
  const setStatusMessage  = useWorkflowStore((s) => s.setStatusMessage);
  const connectNodes      = useWorkflowStore((s) => s.connectNodes);
  const removeEdge        = useWorkflowStore((s) => s.removeEdge);

  const [showOutputModal, setShowOutputModal] = useState(false);
  const [linkTargetId, setLinkTargetId]       = useState("");
  const [activeTab, setActiveTab]             = useState("main");

  // Reset to main tab whenever the selected node changes
  useEffect(() => { setActiveTab("main"); }, [selectedNodeId]);

  const agent = workflow.nodes.find((n) => n.id === selectedNodeId);

  if (!agent) {
    return showProject
      ? <ProjectSettingsPanel onClose={onProjectSettings} />
      : <EmptyState onProjectSettings={onProjectSettings} />;
  }

  // Route tool nodes to dedicated focused panel
  if (agent.type === "tool") {
    return <ToolConfigPanel tool={agent} />;
  }

  const update = (updates) => updateNode(agent.id, updates);

  const updateType = (type) => {
    const existingOrch  = workflow.nodes.find((n) => n.type === "orchestrator" && n.id !== agent.id);
    const existingInput = workflow.nodes.find((n) => n.type === "user_input"   && n.id !== agent.id);
    if (type === "orchestrator" && existingOrch)  { setStatusMessage("Only one orchestrator allowed."); return; }
    if (type === "user_input"   && existingInput) { setStatusMessage("Only one user prompt node allowed."); return; }
    update({ type });
  };

  const isExecutable = agent.type === "agent" || agent.type === "orchestrator";
  const isInput      = agent.type === "user_input";
  const isOutput     = agent.type === "output";

  const nodesById        = new Map(workflow.nodes.map((n) => [n.id, n]));
  const availableTargets = workflow.nodes.filter((n) => n.id !== agent.id);
  const outgoing         = workflow.edges.filter((e) => e.source === agent.id);
  const incoming         = workflow.edges.filter((e) => e.target === agent.id);
  const selectedLinkTarget = linkTargetId || availableTargets[0]?.id || "";

  const toolCount = (agent.builtinTools?.length || 0) + (agent.customTools?.length || 0);
  const connCount = outgoing.length + incoming.length;

  return (
    <>
      <div className="flex h-full flex-col bg-panel">

        {/* ── Header: editable name + type badge + settings toggle ── */}
        <div className="flex items-center gap-2 border-b border-hairline px-4 py-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-surfaceStrong text-muted">
            {nodeIcon(agent.type, 13)}
          </span>
          <input
            className="min-w-0 flex-1 bg-transparent text-[13px] font-semibold text-ink outline-none placeholder:text-muted"
            value={agent.name}
            onChange={(e) => update({ name: e.target.value })}
          />
          <span className="shrink-0 rounded bg-canvasSoft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
            {NODE_TYPE_LABELS[agent.type] || agent.type}
          </span>
          <button
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition ${
              activeTab === "settings" ? "bg-primary/10 text-primary" : "text-muted hover:bg-canvasSoft"
            }`}
            onClick={() => setActiveTab((t) => (t === "settings" ? "main" : "settings"))}
            title="Settings"
          >
            <Settings2 size={13} />
          </button>
        </div>

        {/* ── Scrollable body ─────────────────────────────────────────────── */}
        <div className="panel-scroll flex-1 overflow-auto">

          {/* ── MAIN TAB: Prompt → Model → Tools ── */}
          {activeTab === "main" && (
            <>
              {/* Prompt */}
              {!isOutput && (
                <Section label="Prompt" defaultOpen={true}>
                  <label className="field">
                    <span>{isInput ? "Prompt to Orchestrator" : "System Prompt"}</span>
                    <textarea
                      className="input min-h-[140px] resize-y"
                      value={agent.prompt}
                      onChange={(e) => update({ prompt: e.target.value })}
                      placeholder={isInput
                        ? "Write the runtime prompt the orchestrator receives."
                        : "Describe exactly how this agent should behave."}
                    />
                  </label>
                  {!isInput && (
                    <label className="field">
                      <span>Input Mode</span>
                      <Select
                        value={agent.inputMode}
                        onChange={(v) => update({ inputMode: v })}
                        options={[
                          { value: "user_input",            label: "User Input" },
                          { value: "previous_agent_output", label: "Previous Agent Output" },
                          { value: "combined_context",      label: "Combined Context" }
                        ]}
                      />
                    </label>
                  )}
                </Section>
              )}

              {/* Output node info */}
              {isOutput && (
                <Section label="Output Node" defaultOpen={true}>
                  <p className="rounded-md border border-hairline bg-canvasSoft p-3 text-[12px] leading-relaxed text-body">
                    Output nodes render whatever the orchestrator returns — no model call, no tools.
                  </p>
                </Section>
              )}

              {/* Model */}
              {isExecutable && (
                <Section label="Model" defaultOpen={true}>
                  <ModelSettings agent={agent} update={update} />
                </Section>
              )}

              {/* Tools */}
              {isExecutable && (() => {
                const attachedTools = workflow.nodes.filter((n) =>
                  n.type === "tool" && workflow.edges.some((e) => e.source === agent.id && e.target === n.id && e.type === "tool")
                );
                return (
                  <Section label="Tools" defaultOpen={attachedTools.length > 0 || toolCount > 0} badge={(attachedTools.length + toolCount) || null}>

                    {attachedTools.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Tool Nodes</p>
                        {attachedTools.map((t) => (
                          <button
                            key={t.id}
                            className="flex w-full items-center gap-2 rounded-md border border-hairline bg-canvasSoft px-3 py-2 text-left transition hover:border-hairlineStrong hover:bg-surfaceStrong"
                            onClick={() => { useWorkflowStore.getState().selectNode(t.id); useWorkflowStore.getState().focusNode(t.id); }}
                          >
                            <Wrench size={12} className="shrink-0 text-body" />
                            <span className="min-w-0 flex-1 truncate text-[12px] font-semibold text-ink">{t.name}</span>
                            <span className="rounded border border-hairline bg-panel px-1.5 py-0.5 text-[10px] text-muted">
                              {t.toolType === "builtin" ? "Builtin" : t.toolType === "mcp" ? "MCP" : t.toolType === "custom" ? "Custom" : "HTTP"}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    <button
                      className="flex w-full items-center justify-center gap-1.5 rounded-md border border-ink bg-ink py-2 text-[12px] font-medium text-white transition hover:bg-ink/85"
                      onClick={() => addTool(agent.id)}
                    >
                      <Plus size={13} /> Add Tool Node
                    </button>

                    {(workflow.builderTarget === "langgraph" || workflow.builderTarget === "langchain") && (
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                          Built-in tools
                          <span className="ml-1.5 font-mono normal-case text-muted/70">
                            ({workflow.builderTarget === "langchain" ? "LangChain" : "LangGraph"})
                          </span>
                        </p>
                        <ToolPicker
                          selectedTools={agent.builtinTools || []}
                          onChange={(tools) => update({ builtinTools: tools })}
                        />
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Custom inline tools</p>
                      <CustomToolEditor
                        customTools={agent.customTools || []}
                        architecture={workflow.builderTarget || "python"}
                        onChange={(tools) => update({ customTools: tools })}
                      />
                    </div>

                    {toolCount > 0 && (
                      <label className="field">
                        <span>Tool mode</span>
                        <Select
                          value={agent.toolMode || "auto"}
                          onChange={(v) => update({ toolMode: v })}
                          options={[
                            { value: "auto",  label: "Auto — agent picks the right tool" },
                            { value: "force", label: "Force — call all tools every step" }
                          ]}
                        />
                      </label>
                    )}
                  </Section>
                );
              })()}
            </>
          )}

          {/* ── SETTINGS TAB: Role → Connections → Output ── */}
          {activeTab === "settings" && (
            <>
              {/* Role / Description */}
              <Section label="Role / Description" defaultOpen={true}>
                <textarea
                  className="input min-h-[72px] resize-y"
                  value={agent.role}
                  onChange={(e) => update({ role: e.target.value })}
                  placeholder={isInput ? "Describe this input node…" : "Describe this agent's role…"}
                />
              </Section>

              {/* Connections */}
              <Section label="Connections" defaultOpen={true} badge={connCount || null}>
                <div className="flex gap-2">
                  <Select
                    className="flex-1"
                    value={selectedLinkTarget}
                    onChange={(v) => setLinkTargetId(v)}
                    options={availableTargets.map((n) => ({ value: n.id, label: n.name }))}
                  />
                  <button
                    className="icon-btn h-9 w-9 shrink-0"
                    onClick={() => connectNodes(agent.id, selectedLinkTarget)}
                    disabled={!selectedLinkTarget}
                    title="Add link"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {outgoing.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Out</p>
                    {outgoing.map((edge) => {
                      const target = nodesById.get(edge.target);
                      return (
                        <div key={edge.id} className="flex items-center justify-between rounded border border-hairline bg-canvasSoft px-2.5 py-1.5">
                          <span className="flex min-w-0 items-center gap-1.5 text-[12px] text-ink">
                            <ArrowRight size={11} className="shrink-0 text-primary" />
                            <span className="truncate">{target?.name || edge.target}</span>
                          </span>
                          <button className="ml-2 shrink-0 text-muted/60 transition hover:text-error" onClick={() => removeEdge(edge.id)} title="Remove">
                            <Unlink size={11} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {incoming.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">In</p>
                    {incoming.map((edge) => {
                      const source = nodesById.get(edge.source);
                      return (
                        <div key={edge.id} className="flex items-center gap-1.5 rounded border border-hairline bg-canvasSoft px-2.5 py-1.5 text-[12px] text-body">
                          <ArrowRight size={11} className="shrink-0 text-primary" />
                          <span className="truncate">{source?.name || edge.source}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {connCount === 0 && (
                  <p className="rounded border border-dashed border-hairlineStrong p-2.5 text-[11px] text-muted">
                    No connections yet.
                  </p>
                )}
              </Section>

              {/* Output format (agents + orchestrators only) */}
              {isExecutable && (
                <Section label="Output" defaultOpen={true}>
                  <label className="field">
                    <span>Format</span>
                    <Select
                      value={agent.outputFormat}
                      onChange={(v) => update({ outputFormat: v })}
                      options={[
                        { value: "plain_text", label: "Plain Text" },
                        { value: "markdown",   label: "Markdown" },
                        { value: "json",       label: "JSON" }
                      ]}
                    />
                  </label>
                  <button className="btn h-9 w-full justify-between text-[12px]" onClick={() => setShowOutputModal(true)}>
                    Configure Output Schema <ChevronRight size={13} />
                  </button>
                </Section>
              )}
            </>
          )}

          <div className="h-3" />
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div className="shrink-0 border-t border-hairline bg-panel px-4 py-3">
          <button className="btn-primary mb-2 h-9 w-full text-[12px]" onClick={saveSelectedAgent}>
            <Check size={13} /> Apply Changes
          </button>
          <div className="flex gap-2">
            <button className="btn h-8 flex-1 text-[12px]" onClick={() => duplicateNode(agent.id)}>
              <Copy size={13} /> Duplicate
            </button>
            <button className="btn-danger h-8 flex-1 text-[12px]" onClick={() => deleteNode(agent.id)}>
              <Trash2 size={13} /> Delete
            </button>
          </div>
        </div>
      </div>

      {showOutputModal && (
        <OutputConfigModal
          agent={agent}
          onSave={(updates) => { update(updates); setShowOutputModal(false); }}
          onClose={() => setShowOutputModal(false)}
        />
      )}
    </>
  );
}
