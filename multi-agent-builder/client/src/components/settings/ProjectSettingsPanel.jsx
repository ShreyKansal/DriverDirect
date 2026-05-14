import {
  ArrowRight,
  Check,
  FileText,
  FolderOpen,
  Loader2,
  Play,
  Plus,
  RotateCcw,
  Search,
  Server,
  Settings2,
  Trash2,
  TriangleAlert,
  X
} from "lucide-react";
import { useState } from "react";
import { useWorkflowStore } from "../../store/workflowStore.js";
import { BUILDER_TARGETS, DEFAULT_PLAN_CONSTRAINTS } from "../../utils/graphUtils.js";
import { LAYOUT_PRESETS } from "../../utils/layoutUtils.js";
import Select from "../ui/Select.jsx";
import ProviderSettings from "./ProviderSettings.jsx";

const SETTINGS_GROUPS = [
  {
    label: "Project",
    items: [
      { id: "general",   label: "General",        Icon: Settings2 },
      { id: "metadata",  label: "Metadata",        Icon: FileText },
      { id: "execution", label: "Execution",       Icon: Play }
    ]
  },
  {
    label: "Configuration",
    items: [
      { id: "providers", label: "Model providers", Icon: Server },
      { id: "projects",  label: "Project library", Icon: FolderOpen }
    ]
  },
  {
    label: "Maintenance",
    items: [
      { id: "danger", label: "Danger zone", Icon: TriangleAlert, danger: true }
    ]
  }
];

const ALL_ITEMS = SETTINGS_GROUPS.flatMap((g) => g.items);

function formatDate(value) {
  if (!value) return "Not saved yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat(undefined, {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit"
  }).format(date);
}

function scrollToSection(id, setActiveSection) {
  setActiveSection(id);
  document.getElementById(`settings-${id}`)?.scrollIntoView({ block: "start", behavior: "smooth" });
}

/* ── Section wrapper ──────────────────────────────────────────────────────── */
function SettingSection({ id, title, description, children, action }) {
  return (
    <section id={`settings-${id}`} className="scroll-mt-8">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[20px] font-semibold text-ink">{title}</h2>
          {description && (
            <p className="mt-1 text-[13px] leading-relaxed text-muted">{description}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

/* ── Small helper text below a field ─────────────────────────────────────── */
function FieldHelp({ children }) {
  return <p className="mt-1.5 text-[11px] leading-relaxed text-muted">{children}</p>;
}

/* ── Individual setting row (label + description + control) ──────────────── */
function SettingRow({ label, description, children }) {
  return (
    <div className="grid gap-y-1.5 border-b border-hairline/60 pb-5 last:border-b-0 last:pb-0">
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-ink">{label}</p>
          {description && (
            <p className="mt-0.5 text-[12px] leading-relaxed text-muted">{description}</p>
          )}
        </div>
      </div>
      <div className="mt-1">{children}</div>
    </div>
  );
}

/* ── Toggle control (like VS Code checkbox setting) ──────────────────────── */
function ToggleRow({ checked, onChange, title, description }) {
  return (
    <div className="border-b border-hairline/60 pb-5 last:border-b-0 last:pb-0">
      <label className="flex cursor-pointer items-start gap-3">
        <span
          className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full border transition ${
            checked ? "border-primary bg-primary" : "border-hairlineStrong bg-surfaceStrong"
          }`}
        >
          <input
            type="checkbox"
            className="sr-only"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
          />
          <span
            className={`absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-panel transition ${
              checked ? "left-[18px]" : "left-[3px]"
            }`}
          />
        </span>
        <span>
          <span className="block text-[13px] font-semibold text-ink">{title}</span>
          <span className="mt-0.5 block text-[12px] leading-relaxed text-muted">{description}</span>
        </span>
      </label>
    </div>
  );
}

/* ── Sidebar ──────────────────────────────────────────────────────────────── */
function SettingsSidebar({ activeSection, setActiveSection }) {
  const [query, setQuery] = useState("");
  const clean = query.trim().toLowerCase();
  const filtered = clean
    ? ALL_ITEMS.filter((item) => item.label.toLowerCase().includes(clean))
    : null;

  return (
    <aside className="hidden w-60 shrink-0 border-r border-hairline bg-canvas lg:flex lg:flex-col">
      {/* Search */}
      <div className="shrink-0 px-3 py-3">
        <div className="flex h-8 items-center gap-2 rounded-md border border-hairlineStrong bg-panel px-2.5 focus-within:border-primary/60">
          <Search size={12} className="shrink-0 text-muted" />
          <input
            className="h-full min-w-0 flex-1 bg-transparent text-[12px] text-ink outline-none placeholder:text-muted"
            placeholder="Search settings"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-muted hover:text-ink">
              <X size={11} />
            </button>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="panel-scroll flex-1 overflow-auto px-2 pb-4">
        {filtered ? (
          <div className="space-y-0.5">
            {filtered.length === 0 && (
              <p className="px-3 py-2 text-[11px] text-muted">No results.</p>
            )}
            {filtered.map(({ id, label, Icon, danger }) => {
              const active = activeSection === id;
              return (
                <NavItem key={id} id={id} label={label} Icon={Icon} danger={danger}
                  active={active} onClick={() => scrollToSection(id, setActiveSection)} />
              );
            })}
          </div>
        ) : (
          SETTINGS_GROUPS.map((group) => (
            <div key={group.label} className="mb-6">
              <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-widest text-muted/70">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map(({ id, label, Icon, danger }) => {
                  const active = activeSection === id;
                  return (
                    <NavItem key={id} id={id} label={label} Icon={Icon} danger={danger}
                      active={active} onClick={() => scrollToSection(id, setActiveSection)} />
                  );
                })}
              </div>
            </div>
          ))
        )}
      </nav>
    </aside>
  );
}

function NavItem({ id, label, Icon, danger, active, onClick }) {
  return (
    <button
      key={id}
      className={`flex h-8 w-full items-center gap-2.5 rounded-sm px-2 text-left text-[13px] transition-colors ${
        active
          ? "bg-[#faf4ec] font-medium text-ink"
          : danger
            ? "text-error hover:bg-error/8"
            : "text-body hover:bg-canvasSoft hover:text-ink"
      }`}
      onClick={onClick}
    >
      <Icon size={14} className="shrink-0" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
    </button>
  );
}

/* ── Mobile tab bar ───────────────────────────────────────────────────────── */
function MobileSectionNav({ activeSection, setActiveSection }) {
  return (
    <div className="sticky top-0 z-20 -mx-5 mb-6 border-b border-hairline bg-canvas/95 px-5 py-2 backdrop-blur-sm lg:hidden">
      <div className="flex gap-1 overflow-x-auto">
        {ALL_ITEMS.map(({ id, label, Icon, danger }) => (
          <button
            key={id}
            className={`flex h-8 shrink-0 items-center gap-1.5 rounded-md border px-2.5 text-[12px] font-medium ${
              activeSection === id
                ? "border-primary bg-primary/5 text-primary"
                : danger
                  ? "border-error/20 text-error"
                  : "border-hairline bg-panel text-body"
            }`}
            onClick={() => scrollToSection(id, setActiveSection)}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Project library row ──────────────────────────────────────────────────── */
function ProjectRow({ project, active, running, onSwitch, onDelete }) {
  return (
    <div className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition ${
      active ? "border-primary/30 bg-primary/4" : "border-hairline bg-panel hover:border-hairlineStrong"
    }`}>
      <span className="flex h-4 w-4 shrink-0 items-center justify-center">
        {running
          ? <Loader2 size={13} className="animate-spin text-muted" />
          : active
            ? <Check size={13} className="text-primary" />
            : null
        }
      </span>
      <div className="min-w-0 flex-1">
        <p className={`truncate text-[13px] font-semibold ${active ? "text-primary" : "text-ink"}`}>
          {project.name || "Untitled project"}
        </p>
        <p className="mt-0.5 truncate text-[11px] text-muted">
          {project.description || "Updated " + formatDate(project.updatedAt)}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button className="btn h-7 px-2.5 text-[11px]" onClick={onSwitch} disabled={active}>
          <ArrowRight size={12} />{active ? "Active" : "Open"}
        </button>
        <button className="btn-danger h-7 px-2 text-[11px]" onClick={onDelete}>
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

/* ── Danger row ───────────────────────────────────────────────────────────── */
function DangerItem({ title, description, children }) {
  return (
    <div className="flex items-center justify-between gap-6 border-b border-hairline/60 pb-5 last:border-b-0 last:pb-0">
      <div>
        <p className="text-[13px] font-semibold text-ink">{title}</p>
        <p className="mt-0.5 text-[12px] leading-relaxed text-muted">{description}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Main component
═══════════════════════════════════════════════════════════════════════════ */
export default function ProjectSettingsPanel({ onClose }) {
  const [activeSection, setActiveSection] = useState("general");

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

  const constraints    = { ...DEFAULT_PLAN_CONSTRAINTS, ...(workflow.planConstraints || {}) };
  const updateConstraint = (u) => updateWorkflow({ planConstraints: { ...constraints, ...u } });

  const activeProject  = projects.find((p) => p.id === activeProjectId);
  const keyProjectId   = workflow.id || activeProjectId;

  function confirmDeleteProject(project) {
    if (!project) return;
    if (window.confirm(`Delete "${project.name}"? This cannot be undone.`)) deleteProject(project.id);
  }

  function confirmResetWorkflow() {
    if (window.confirm("Reset the current workflow back to the default template?")) resetWorkflow();
  }

  return (
    <div className="flex h-full min-w-0 flex-col bg-canvas">

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-hairline bg-canvas px-5 py-3">
        <div className="flex items-center gap-2 text-[13px] text-muted">
          <span className="font-medium text-ink">Settings</span>
          <span className="opacity-40">›</span>
          <span className="truncate max-w-[260px]">{workflow.name || "Untitled project"}</span>
        </div>
        {onClose && (
          <button className="icon-btn h-8 w-8 shrink-0" onClick={onClose} title="Close">
            <X size={14} />
          </button>
        )}
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <SettingsSidebar activeSection={activeSection} setActiveSection={setActiveSection} />

        <div className="panel-scroll min-w-0 flex-1 overflow-auto bg-canvas">
          <div className="mx-auto max-w-3xl px-8 py-8">
            <MobileSectionNav activeSection={activeSection} setActiveSection={setActiveSection} />

            <div className="space-y-12">

              {/* ── General ─────────────────────────────────────────────── */}
              <SettingSection id="general" title="General"
                description="Set the project name, description, builder target, and workspace layout.">

                <div className="space-y-6">
                  <SettingRow label="Project name">
                    <input
                      className="input max-w-sm"
                      value={workflow.name || ""}
                      onChange={(e) => updateWorkflow({ name: e.target.value })}
                    />
                  </SettingRow>

                  <SettingRow label="Description"
                    description="Use this for project intent, not graph diagnostics. Node wiring belongs on the canvas.">
                    <textarea
                      className="input w-full resize-y text-[13px] leading-relaxed"
                      style={{ minHeight: 88 }}
                      placeholder="What problem does this workflow solve?"
                      value={workflow.description || ""}
                      onChange={(e) => updateWorkflow({ description: e.target.value })}
                    />
                  </SettingRow>

                  <SettingRow label="Builder target"
                    description="The framework used to generate and run the workflow code.">
                    <Select
                      className="max-w-xs"
                      value={workflow.builderTarget || "langgraph"}
                      onChange={(v) => updateWorkflow({ builderTarget: v })}
                      options={BUILDER_TARGETS.map((t) => ({ value: t.id, label: t.label }))}
                    />
                  </SettingRow>

                  <SettingRow label="Workspace layout"
                    description="Adjusts which panels are visible and how canvas space is divided.">
                    <Select
                      className="max-w-xs"
                      value={layoutPreset}
                      onChange={setLayoutPreset}
                      options={Object.entries(LAYOUT_PRESETS).map(([id, p]) => ({ value: id, label: p.label }))}
                    />
                  </SettingRow>
                </div>
              </SettingSection>

              {/* ── Metadata ────────────────────────────────────────────── */}
              <SettingSection id="metadata" title="Metadata"
                description="Read-only identifiers and timestamps for this project.">
                <div className="rounded-lg border border-hairline bg-panel">
                  {[
                    {
                      label: "Project ID",
                      value: activeProjectId ? (
                        <span className="font-mono text-[12px] text-ink">{activeProjectId}</span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <span className="font-mono text-[12px] text-muted">Unsaved</span>
                          <button
                            className="h-5 rounded border border-primary/40 bg-primary/8 px-2 text-[10px] font-semibold text-primary transition hover:bg-primary/15"
                            onClick={() => createProject(workflow.name || "New Project")}
                          >
                            Save as project
                          </button>
                        </span>
                      )
                    },
                    { label: "Workflow ID", value: <span className="font-mono text-[12px] text-ink">{keyProjectId || "Unsaved"}</span> },
                    { label: "Created",     value: <span className="text-[12px] text-ink">{formatDate(workflow.createdAt || activeProject?.createdAt)}</span> },
                    { label: "Updated",     value: <span className="text-[12px] text-ink">{formatDate(workflow.updatedAt || activeProject?.updatedAt)}</span> }
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center gap-4 border-b border-hairline px-4 py-3 last:border-b-0">
                      <span className="w-28 shrink-0 text-[12px] text-muted">{label}</span>
                      <span className="min-w-0 flex-1">{value}</span>
                    </div>
                  ))}
                </div>
              </SettingSection>

              {/* ── Execution ───────────────────────────────────────────── */}
              <SettingSection id="execution" title="Execution"
                description="Control planner limits and handoff behavior used when the workflow runs.">

                <div className="space-y-6">
                  <SettingRow label="Max agent steps"
                    description="Caps runaway loops while keeping room for multi-agent runs.">
                    <input
                      className="input max-w-[120px]"
                      type="number" min="1" max="50"
                      value={constraints.maxAgentSteps}
                      onChange={(e) => updateConstraint({ maxAgentSteps: Number(e.target.value) })}
                    />
                  </SettingRow>

                  <SettingRow label="Handoff policy"
                    description="Choose how strictly the runner follows the canvas wiring.">
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
                  </SettingRow>

                  <ToggleRow
                    checked={constraints.requireFinalSynthesis}
                    onChange={(v) => updateConstraint({ requireFinalSynthesis: v })}
                    title="Require final synthesis"
                    description="The orchestrator must merge agent results into one final answer before completion."
                  />

                  <ToggleRow
                    checked={constraints.allowParallelBranches}
                    onChange={(v) => updateConstraint({ allowParallelBranches: v })}
                    title="Allow parallel branches"
                    description="Independent graph branches may run concurrently when their inputs are available."
                  />
                </div>
              </SettingSection>

              {/* ── Model providers ─────────────────────────────────────── */}
              <SettingSection id="providers" title="Model providers"
                description="Configure API keys for the model providers your agents use.">
                <ProviderSettings projectId={keyProjectId} />
              </SettingSection>

              {/* ── Project library ─────────────────────────────────────── */}
              <SettingSection id="projects" title="Project library"
                description="Switch between saved workflows, create new ones, or remove projects you no longer need."
                action={
                  <button className="btn-primary h-8 shrink-0 px-3 text-[12px]" onClick={() => createProject("New Project")}>
                    <Plus size={13} /> New project
                  </button>
                }>

                <div className="space-y-2">
                  {projects.map((project) => (
                    <ProjectRow
                      key={project.id}
                      project={project}
                      active={project.id === activeProjectId}
                      running={!!runs[project.id]?.running}
                      onSwitch={() => switchProject(project.id)}
                      onDelete={() => confirmDeleteProject(project)}
                    />
                  ))}
                  {projects.length === 0 && (
                    <div className="rounded-lg border border-dashed border-hairlineStrong px-6 py-10 text-center">
                      <FolderOpen size={24} className="mx-auto text-muted" />
                      <p className="mt-2 text-[13px] font-semibold text-ink">No saved projects yet</p>
                      <p className="mt-1 text-[12px] text-muted">Create a project to start building workflows.</p>
                    </div>
                  )}
                </div>
              </SettingSection>

              {/* ── Danger zone ─────────────────────────────────────────── */}
              <SettingSection id="danger" title="Danger zone"
                description="Destructive actions for the current workflow and active saved project.">

                <div className="rounded-lg border border-error/30 bg-error/3 px-5 py-1">
                  <div className="space-y-0 divide-y divide-error/15">
                    <DangerItem
                      title="Reset current workflow"
                      description="Replace the current canvas with the default template. Saved project metadata remains, but the workflow contents are reset.">
                      <button className="btn-danger h-8 px-3 text-[12px]" onClick={confirmResetWorkflow}>
                        <RotateCcw size={13} /> Reset workflow
                      </button>
                    </DangerItem>
                    <DangerItem
                      title="Delete active project"
                      description="Remove this project from the saved project library. This action cannot be undone.">
                      <button
                        className="btn-danger h-8 px-3 text-[12px]"
                        onClick={() => confirmDeleteProject(activeProject)}
                        disabled={!activeProject}
                      >
                        <Trash2 size={13} /> Delete project
                      </button>
                    </DangerItem>
                  </div>
                </div>
              </SettingSection>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
