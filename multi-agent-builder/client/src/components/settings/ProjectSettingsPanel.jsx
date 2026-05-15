import { ArrowLeft, Check, Loader2, Plus, RotateCcw, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useWorkflowStore } from "../../store/workflowStore.js";
import { BUILDER_TARGETS, DEFAULT_PLAN_CONSTRAINTS } from "../../utils/graphUtils.js";
import { LAYOUT_PRESETS } from "../../utils/layoutUtils.js";
import Select from "../ui/Select.jsx";
import ProviderSettings from "./ProviderSettings.jsx";
import CustomProviderPage from "./CustomProviderPage.jsx";

/* ── Nav groups ──────────────────────────────────────────────────────────── */
const NAV_GROUPS = [
  {
    label: "General",
    items: [
      { id: "general",   label: "General" },
      { id: "metadata",  label: "Metadata" },
      { id: "execution", label: "Execution" }
    ]
  },
  {
    label: "Configuration",
    items: [
      { id: "providers", label: "Model Providers" },
      { id: "projects",  label: "Project Library" }
    ]
  }
];

const DANGER_ITEM = { id: "danger", label: "Danger Zone" };
const ALL_SECTIONS = [...NAV_GROUPS.flatMap((g) => g.items), DANGER_ITEM];

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function formatDate(value) {
  if (!value) return "Not saved yet";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Unknown";
  return new Intl.DateTimeFormat(undefined, {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit"
  }).format(d);
}

/* ── Reusable primitives ─────────────────────────────────────────────────── */
function SectionHeader({ title, description }) {
  return (
    <div className="mb-6">
      <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
      {description && <p className="mt-1 text-[12px] text-muted leading-relaxed">{description}</p>}
    </div>
  );
}

function Field({ label, help, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[12px] font-medium text-ink">{label}</label>
      {children}
      {help && <p className="text-[12px] text-muted leading-relaxed">{help}</p>}
    </div>
  );
}

function Toggle({ checked, onChange, label, description }) {
  return (
    <div className="flex items-start justify-between gap-6 py-3 border-b border-hairline/50 last:border-0">
      <div>
        <p className="text-[13px] font-medium text-ink">{label}</p>
        {description && <p className="mt-0.5 text-[12px] text-muted leading-relaxed">{description}</p>}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`shrink-0 relative mt-0.5 h-5 w-9 rounded-full border transition ${
          checked ? "border-primary bg-primary" : "border-hairlineStrong bg-surfaceStrong"
        }`}
      >
        <span className={`absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-panel transition-all ${
          checked ? "left-[18px]" : "left-[3px]"
        }`} />
      </button>
    </div>
  );
}

/* ── Sidebar ─────────────────────────────────────────────────────────────── */
function Sidebar({ activeSection, onNavigate }) {
  return (
    <aside className="hidden w-[200px] shrink-0 border-r border-hairline bg-canvas lg:flex lg:flex-col py-6">
      <nav className="flex-1 overflow-auto px-3 space-y-6">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted/60 px-3 mb-1">
              {group.label}
            </p>
            {group.items.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => onNavigate(id)}
                className={`w-full text-left px-3 py-1.5 rounded-md text-[13px] transition ${
                  activeSection === id
                    ? "font-medium text-ink bg-canvasSoft"
                    : "text-body hover:bg-canvasSoft hover:text-ink"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        ))}

        <div className="border-t border-hairline pt-4">
          <button
            onClick={() => onNavigate("danger")}
            className={`w-full text-left px-3 py-1.5 rounded-md text-[13px] transition ${
              activeSection === "danger" ? "font-medium text-error bg-error/5" : "text-error hover:bg-error/5"
            }`}
          >
            Danger Zone
          </button>
        </div>
      </nav>
    </aside>
  );
}

/* ── Mobile dropdown nav ─────────────────────────────────────────────────── */
function MobileNav({ activeSection, onNavigate }) {
  return (
    <div className="lg:hidden border-b border-hairline px-4 py-2 bg-canvas">
      <select
        className="w-full rounded-md border border-hairline bg-panel px-3 py-1.5 text-[13px] text-ink outline-none focus:border-primary"
        value={activeSection}
        onChange={(e) => onNavigate(e.target.value)}
      >
        {ALL_SECTIONS.map(({ id, label }) => (
          <option key={id} value={id}>{label}</option>
        ))}
      </select>
    </div>
  );
}

/* ── Project library row ─────────────────────────────────────────────────── */
function ProjectRow({ project, active, running, onSwitch, onDelete }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-hairline/60 last:border-0">
      <span className="w-4 shrink-0 text-primary">
        {running ? <Loader2 size={13} className="animate-spin text-muted" /> : active ? <Check size={13} /> : null}
      </span>
      <div className="min-w-0 flex-1">
        <p className={`text-[13px] font-medium truncate ${active ? "text-ink" : "text-body"}`}>
          {project.name || "Untitled project"}
        </p>
        <p className="mt-0.5 text-[11px] text-muted truncate">
          {project.description || formatDate(project.updatedAt)}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button className="btn h-7 px-2.5 text-[11px]" onClick={onSwitch} disabled={active}>
          {active ? "Active" : "Open"}
        </button>
        <button className="btn-danger h-7 w-7 p-0" onClick={onDelete} title="Delete">
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   Main component
══════════════════════════════════════════════════════════════════════════ */
export default function ProjectSettingsPanel({ onClose }) {
  const [activeSection, setActiveSection] = useState("general");
  const [view, setView]         = useState({ type: "settings" });
  const [refreshKey, setRefreshKey] = useState(0);

  const workflow        = useWorkflowStore((s) => s.workflow);
  const updateWorkflow  = useWorkflowStore((s) => s.updateWorkflow);
  const layoutPreset    = useWorkflowStore((s) => s.layoutPreset);
  const setLayoutPreset = useWorkflowStore((s) => s.setLayoutPreset);
  const projects        = useWorkflowStore((s) => s.projects);
  const activeProjectId = useWorkflowStore((s) => s.activeProjectId);
  const createProject   = useWorkflowStore((s) => s.createProject);
  const switchProject   = useWorkflowStore((s) => s.switchProject);
  const deleteProject   = useWorkflowStore((s) => s.deleteProject);
  const resetWorkflow   = useWorkflowStore((s) => s.resetWorkflow);
  const runs            = useWorkflowStore((s) => s.runs);

  const constraints      = { ...DEFAULT_PLAN_CONSTRAINTS, ...(workflow.planConstraints || {}) };
  const updateConstraint = (u) => updateWorkflow({ planConstraints: { ...constraints, ...u } });
  const activeProject    = projects.find((p) => p.id === activeProjectId);
  const keyProjectId     = workflow.id || activeProjectId;

  function navigate(id) {
    if (view.type !== "settings") {
      setView({ type: "settings" });
      setRefreshKey((k) => k + 1);
    }
    setActiveSection(id);
  }

  function openAddProvider()   { setView({ type: "provider-form", mode: "add",  provider: null }); setActiveSection("providers"); }
  function openEditProvider(p) { setView({ type: "provider-form", mode: "edit", provider: p    }); setActiveSection("providers"); }
  function goBack() {
    setView({ type: "settings" });
    setRefreshKey((k) => k + 1);
    setActiveSection("providers");
  }

  function confirmDelete(project) {
    if (!project) return;
    if (window.confirm(`Delete "${project.name}"? This cannot be undone.`)) deleteProject(project.id);
  }

  function confirmReset() {
    if (window.confirm("Reset the current workflow to the default template?")) resetWorkflow();
  }

  return (
    <div className="flex h-full min-w-0 flex-col bg-canvas">

      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-hairline px-5 py-3">
        {view.type === "settings" ? (
          <span className="text-[13px] font-medium text-ink">Settings</span>
        ) : (
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={goBack}
              className="flex shrink-0 items-center gap-1.5 rounded-md border border-hairline bg-panel px-2.5 py-1 text-[12px] text-body transition hover:bg-canvasSoft hover:text-ink"
            >
              <ArrowLeft size={12} /> Back
            </button>
            <span className="text-[12px] text-muted min-w-0 truncate">
              Settings / Model Providers / {view.mode === "add" ? "Add Custom Provider" : view.provider?.name}
            </span>
          </div>
        )}
        {onClose && (
          <button className="icon-btn h-7 w-7 shrink-0" onClick={onClose} title="Close settings">
            <X size={13} />
          </button>
        )}
      </div>

      {/* Mobile dropdown nav */}
      {view.type === "settings" && (
        <MobileNav activeSection={activeSection} onNavigate={navigate} />
      )}

      {/* ── Body ────────────────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Sidebar activeSection={activeSection} onNavigate={navigate} />

        {/* Sub-page: custom provider form */}
        {view.type === "provider-form" && (
          <div className="min-w-0 flex-1 overflow-auto bg-canvas">
            <CustomProviderPage
              projectId={keyProjectId}
              editProvider={view.provider}
              onSaved={goBack}
              onCancel={goBack}
            />
          </div>
        )}

        {/* One section at a time */}
        {view.type === "settings" && (
          <div className="min-w-0 flex-1 overflow-auto bg-canvas">
            <div className="mx-auto max-w-[560px] px-8 py-8">

              {/* ── General ─────────────────────────────────────────── */}
              {activeSection === "general" && (
                <>
                  <SectionHeader
                    title="General"
                    description="Project name, description, and workspace preferences."
                  />
                  <div className="space-y-6">
                    <Field label="Project name">
                      <input
                        className="input max-w-sm"
                        value={workflow.name || ""}
                        onChange={(e) => updateWorkflow({ name: e.target.value })}
                        placeholder="Untitled project"
                      />
                    </Field>

                    <Field label="Description" help="Describe the purpose of this workflow.">
                      <textarea
                        className="input w-full resize-y text-[13px] leading-relaxed"
                        style={{ minHeight: 80 }}
                        placeholder="What problem does this workflow solve?"
                        value={workflow.description || ""}
                        onChange={(e) => updateWorkflow({ description: e.target.value })}
                      />
                    </Field>

                    <Field label="Builder target" help="Framework used to generate and run the workflow code.">
                      <Select
                        className="max-w-xs"
                        value={workflow.builderTarget || "langgraph"}
                        onChange={(v) => updateWorkflow({ builderTarget: v })}
                        options={BUILDER_TARGETS.map((t) => ({ value: t.id, label: t.label }))}
                      />
                    </Field>

                    <Field label="Workspace layout" help="Controls which panels are shown and how canvas space is distributed.">
                      <Select
                        className="max-w-xs"
                        value={layoutPreset}
                        onChange={setLayoutPreset}
                        options={Object.entries(LAYOUT_PRESETS).map(([id, p]) => ({ value: id, label: p.label }))}
                      />
                    </Field>
                  </div>
                </>
              )}

              {/* ── Metadata ────────────────────────────────────────── */}
              {activeSection === "metadata" && (
                <>
                  <SectionHeader
                    title="Metadata"
                    description="Read-only identifiers and timestamps for this project."
                  />
                  <div className="rounded-md border border-hairline overflow-hidden">
                    {[
                      {
                        label: "Project ID",
                        value: activeProjectId ? (
                          <span className="font-mono text-[12px] text-ink">{activeProjectId}</span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <span className="text-[12px] text-muted">Not saved</span>
                            <button
                              className="text-[11px] text-primary underline underline-offset-2"
                              onClick={() => createProject(workflow.name || "New Project")}
                            >
                              Save as project
                            </button>
                          </span>
                        )
                      },
                      { label: "Workflow ID", value: <span className="font-mono text-[12px] text-ink">{keyProjectId || "—"}</span> },
                      { label: "Created",     value: <span className="text-[12px] text-ink">{formatDate(workflow.createdAt || activeProject?.createdAt)}</span> },
                      { label: "Updated",     value: <span className="text-[12px] text-ink">{formatDate(workflow.updatedAt || activeProject?.updatedAt)}</span> }
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center gap-4 border-b border-hairline px-4 py-2.5 last:border-0">
                        <span className="w-24 shrink-0 text-[12px] text-muted">{label}</span>
                        <span className="min-w-0 flex-1">{value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* ── Execution ───────────────────────────────────────── */}
              {activeSection === "execution" && (
                <>
                  <SectionHeader
                    title="Execution"
                    description="Limits and policies applied when the workflow runs."
                  />
                  <div className="space-y-6">
                    <Field label="Max agent steps" help="Prevents runaway loops. Set to the maximum number of agent nodes expected to execute.">
                      <input
                        className="input max-w-[100px]"
                        type="number" min="1" max="50"
                        value={constraints.maxAgentSteps}
                        onChange={(e) => updateConstraint({ maxAgentSteps: Number(e.target.value) })}
                      />
                    </Field>

                    <Field label="Handoff policy" help="Controls how strictly the runner follows the canvas wiring.">
                      <Select
                        className="max-w-xs"
                        value={constraints.handoffPolicy}
                        onChange={(v) => updateConstraint({ handoffPolicy: v })}
                        options={[
                          { value: "configured_edges",    label: "Configured edges" },
                          { value: "orchestrator_routes", label: "Orchestrator routes" },
                          { value: "manual_review",       label: "Manual review" }
                        ]}
                      />
                    </Field>

                    <div className="rounded-md border border-hairline divide-y divide-hairline/60">
                      <Toggle
                        checked={constraints.requireFinalSynthesis}
                        onChange={(v) => updateConstraint({ requireFinalSynthesis: v })}
                        label="Require final synthesis"
                        description="The orchestrator must merge all agent results into one final answer before completion."
                      />
                      <Toggle
                        checked={constraints.allowParallelBranches}
                        onChange={(v) => updateConstraint({ allowParallelBranches: v })}
                        label="Allow parallel branches"
                        description="Independent graph branches may run concurrently when their inputs are ready."
                      />
                    </div>
                  </div>
                </>
              )}

              {/* ── Model Providers ─────────────────────────────────── */}
              {activeSection === "providers" && (
                <>
                  <SectionHeader
                    title="Model Providers"
                    description="API keys are encrypted with AES-256-GCM and stored per project."
                  />
                  <ProviderSettings
                    projectId={keyProjectId}
                    refreshKey={refreshKey}
                    onAddProvider={openAddProvider}
                    onEditProvider={openEditProvider}
                  />
                </>
              )}

              {/* ── Project Library ─────────────────────────────────── */}
              {activeSection === "projects" && (
                <>
                  <div className="flex items-start justify-between mb-6 gap-4">
                    <SectionHeader
                      title="Project Library"
                      description="All saved projects in your workspace."
                    />
                    <button
                      className="btn-primary h-8 shrink-0 px-3 text-[12px]"
                      onClick={() => createProject("New Project")}
                    >
                      <Plus size={12} /> New project
                    </button>
                  </div>

                  {projects.length === 0 ? (
                    <p className="text-[13px] text-muted">No saved projects yet.</p>
                  ) : (
                    <div>
                      {projects.map((project) => (
                        <ProjectRow
                          key={project.id}
                          project={project}
                          active={project.id === activeProjectId}
                          running={!!runs[project.id]?.running}
                          onSwitch={() => switchProject(project.id)}
                          onDelete={() => confirmDelete(project)}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* ── Danger Zone ─────────────────────────────────────── */}
              {activeSection === "danger" && (
                <>
                  <h2 className="text-[15px] font-semibold text-error mb-1">Danger Zone</h2>
                  <p className="text-[12px] text-muted mb-6">These actions are irreversible.</p>

                  <div className="divide-y divide-hairline/60">
                    <div className="flex items-start justify-between gap-6 py-4 first:pt-0">
                      <div>
                        <p className="text-[13px] font-medium text-ink">Reset current workflow</p>
                        <p className="mt-0.5 text-[12px] text-muted">Replace the canvas with the default template. All node configuration will be lost.</p>
                      </div>
                      <button className="btn-danger h-8 shrink-0 px-3 text-[12px]" onClick={confirmReset}>
                        <RotateCcw size={12} /> Reset
                      </button>
                    </div>
                    <div className="flex items-start justify-between gap-6 py-4">
                      <div>
                        <p className="text-[13px] font-medium text-ink">Delete active project</p>
                        <p className="mt-0.5 text-[12px] text-muted">Remove this project from your library. Cannot be undone.</p>
                      </div>
                      <button
                        className="btn-danger h-8 shrink-0 px-3 text-[12px]"
                        onClick={() => confirmDelete(activeProject)}
                        disabled={!activeProject}
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </div>
                </>
              )}

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
