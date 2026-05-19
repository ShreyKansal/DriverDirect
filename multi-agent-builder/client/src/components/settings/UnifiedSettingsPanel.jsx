import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight, Copy, RotateCcw, Search, Settings, X } from "lucide-react";
import { useWorkflowStore } from "../../store/workflowStore.js";
import { normalizeProjectSettings, PROJECT_SETTINGS_SCHEMA_VERSION } from "../../utils/projectSettings.js";
import { currentUserKey, userHeaders } from "../../utils/authHeaders.js";
import ProviderSettings from "./ProviderSettings.jsx";
import CustomProviderPage from "./CustomProviderPage.jsx";
import Select from "../ui/Select.jsx";

// ─── Section registry ──────────────────────────────────────────────────────────

const SECTION_DEFS = {
  general: {
    label: "General",
    description: "Basic project identity and metadata.",
    keywords: "project name description lifecycle tags business purpose metadata",
  },
  workflows: {
    label: "Workflows",
    description: "Naming defaults and workflow management.",
    keywords: "workflow naming starter active duplicate rename delete library",
  },
  models: {
    label: "Models & Providers",
    description: "Default AI model, provider, temperature, token limits, and system prompt.",
    keywords: "models providers default model provider api key custom provider ai temperature tokens system prompt",
  },
  execution: {
    label: "Execution",
    description: "Runtime behaviour: step limits, handoff, retry, timeout, and streaming.",
    keywords: "execution builder target max steps handoff final synthesis parallel timeout retry streaming error",
  },
  outputs: {
    label: "Outputs",
    description: "Format, visibility, and naming rules for workflow outputs.",
    keywords: "output format markdown json plain text artifacts intermediate timestamps prefix copy naming",
  },
  safety: {
    label: "Instructions & Safety",
    description: "Persistent project guidance, reviewer defaults, and safeguards.",
    keywords: "instructions conventions reviewer delete confirmation safety collaboration",
  },
  appearance: {
    label: "Appearance",
    description: "Canvas display: minimap, grid, node density, sidebar layout.",
    keywords: "appearance minimap grid node size canvas display density layout",
  },
  shortcuts: {
    label: "Keyboard Shortcuts",
    description: "Quick reference for all keyboard shortcuts.",
    keywords: "keyboard shortcuts hotkeys ctrl shift keybindings quick reference",
  },
  advanced: {
    label: "Advanced",
    description: "Read-only project metadata and raw settings payload.",
    keywords: "advanced raw json schema project id metadata",
  },
  danger: {
    label: "Danger Zone",
    description: "Reset or delete actions for the current project.",
    keywords: "danger reset delete destructive",
  },
};

const SIDEBAR_GROUPS = [
  { label: "Project", items: ["general", "workflows", "models", "execution", "outputs", "safety", "appearance"] },
  { label: "Reference", items: ["shortcuts"] },
  { label: "Maintenance", items: ["advanced", "danger"] },
];

// ─── Option lists ───────────────────────────────────────────────────────────────

const LIFECYCLE_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
];

const DEFAULT_PROVIDER_CATALOG = [
  {
    id: "groq",
    name: "Groq",
    models: [
      { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B Versatile" },
      { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B Instant" },
      { id: "llama3-70b-8192", name: "Llama 3 70B" },
    ],
  },
  {
    id: "openai",
    name: "OpenAI",
    models: [
      { id: "gpt-4o", name: "GPT-4o" },
      { id: "gpt-4o-mini", name: "GPT-4o Mini" },
      { id: "o3-mini", name: "o3-mini" },
    ],
  },
  {
    id: "anthropic",
    name: "Anthropic",
    models: [
      { id: "claude-opus-4-7", name: "Claude Opus 4.7" },
      { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6" },
      { id: "claude-haiku-4-5-20251001", name: "Claude Haiku 4.5" },
    ],
  },
  {
    id: "google",
    name: "Gemini",
    models: [
      { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash" },
      { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro" },
    ],
  },
];

const NAMING_STYLE_OPTIONS = [
  { value: "standard", label: "Standard" },
  { value: "compact", label: "Compact" },
  { value: "role_based", label: "Role-based" },
];

const BUILDER_OPTIONS = [
  { value: "langgraph", label: "LangGraph" },
  { value: "langchain", label: "LangChain" },
  { value: "python", label: "Python" },
];

const HANDOFF_OPTIONS = [
  { value: "configured_edges", label: "Configured edges" },
  { value: "orchestrator_routes", label: "Orchestrator routes" },
  { value: "manual_review", label: "Manual review" },
];

const OUTPUT_FORMAT_OPTIONS = [
  { value: "markdown", label: "Markdown" },
  { value: "plain_text", label: "Plain text" },
  { value: "json", label: "JSON" },
];

const ERROR_HANDLING_OPTIONS = [
  { value: "stop", label: "Stop — halt on first error" },
  { value: "continue", label: "Continue — skip failed nodes" },
  { value: "fallback", label: "Fallback — route to fallback node" },
];

const NODE_SIZE_OPTIONS = [
  { value: "compact", label: "Compact" },
  { value: "normal", label: "Normal" },
  { value: "expanded", label: "Expanded" },
];

const SIDEBAR_DENSITY_OPTIONS = [
  { value: "compact", label: "Compact" },
  { value: "comfortable", label: "Comfortable" },
];

// ─── Keyboard shortcut reference ────────────────────────────────────────────────

const SHORTCUT_GROUPS = [
  {
    label: "Workspace",
    shortcuts: [
      { keys: ["Ctrl", ","], description: "Open project settings" },
      { keys: ["Ctrl", "B"], description: "Toggle project explorer" },
      { keys: ["Ctrl", "Shift", "K"], description: "Toggle AI chat panel" },
      { keys: ["Ctrl", "Shift", "N"], description: "New project" },
      { keys: ["Ctrl", "`"], description: "Toggle output terminal" },
    ],
  },
  {
    label: "Canvas",
    shortcuts: [
      { keys: ["Ctrl", "Enter"], description: "Run workflow" },
      { keys: ["Ctrl", "Shift", "L"], description: "Auto-layout canvas" },
      { keys: ["Ctrl", "D"], description: "Duplicate selected node" },
      { keys: ["Delete"], description: "Delete selected node" },
      { keys: ["Escape"], description: "Deselect node" },
      { keys: ["Scroll"], description: "Zoom in / out" },
    ],
  },
  {
    label: "Node editor",
    shortcuts: [
      { keys: ["Tab"], description: "Move to next field" },
      { keys: ["Shift", "Tab"], description: "Move to previous field" },
    ],
  },
];

const SETTINGS_SIDEBAR_WIDTH_KEY = "builder-settings-sidebar-width";
const SETTINGS_SIDEBAR_MIN_WIDTH = 216;
const SETTINGS_SIDEBAR_MAX_WIDTH = 300;
const SETTINGS_SIDEBAR_DEFAULT_WIDTH = 228;

// ─── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(value, withTime = false) {
  if (!value) return "Not saved";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat(undefined, {
    month: "short", day: "numeric", year: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
  }).format(date);
}

function getValueAtPath(source, path) {
  return path.split(".").reduce((value, segment) => value?.[segment], source);
}

function buildPathUpdate(path, value) {
  return path
    .split(".")
    .reverse()
    .reduce((acc, segment) => ({ [segment]: acc }), value);
}

function buildProjectSettingMenu(project, updateProjectSettings, path, overrides = {}) {
  const defaultSettings = normalizeProjectSettings({}, project?.workflows?.[0]);
  const defaultValue = getValueAtPath(defaultSettings, path);

  return {
    id: overrides.id || path,
    title: overrides.title,
    value: overrides.value ?? getValueAtPath(project?.settings, path),
    onReset:
      overrides.onReset ||
      (() => {
        if (defaultValue === undefined) return;
        updateProjectSettings(project.id, buildPathUpdate(path, defaultValue));
      }),
  };
}

// ─── VS Code-style primitives ───────────────────────────────────────────────────

/*
  Sidebar — exact VS Code Light theme (from screenshot):
  - bg: #ffffff (white — NOT gray)
  - border-right: 1px #e5e5e5
  - Active item: full-width rect, bg #cce5ff, left border 3px #005fb8, bold
  - Hover: #e8e8e8
  - Text: 13px, #3c3c3c normal / #1a1a1a bold when active
*/
function Sidebar({ activeSection, onChange, visibleSectionIds, width }) {
  return (
    <aside
      className="slim-scroll shrink-0 overflow-y-auto border-r border-hairline bg-panel"
      style={{ width }}
    >
      <nav className="pb-6 pt-3">
        {SIDEBAR_GROUPS.map((group) => {
          const items = group.items.filter((id) => visibleSectionIds.includes(id));
          if (!items.length) return null;
          return (
            <div key={group.label}>
              {items.map((id) => {
                const active = activeSection === id;
                const isDanger = id === "danger";
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onChange(id)}
                    className={`flex w-full items-center gap-1.5 py-[2px] text-left text-[13px] leading-[22px] select-none outline-none ${
                      active
                        ? "font-semibold text-ink"
                        : isDanger
                          ? "font-normal text-error"
                          : "font-normal text-body"
                    }`}
                    style={
                      active
                        ? {
                            borderLeft: "3px solid rgb(var(--color-primary))",
                            paddingLeft: 14,
                            paddingRight: 12,
                            backgroundColor: "rgb(var(--color-canvas-soft))",
                          }
                        : { borderLeft: "3px solid transparent", paddingLeft: 14, paddingRight: 12 }
                    }
                    onMouseEnter={(e) => { if (!active) e.currentTarget.style.backgroundColor = "rgb(var(--color-canvas-soft))"; }}
                    onMouseLeave={(e) => { if (!active) e.currentTarget.style.backgroundColor = ""; }}
                  >
                    <ChevronRight
                      size={12}
                      strokeWidth={1.75}
                      className={active ? "text-body" : "text-muted"}
                    />
                    <span className="truncate">{SECTION_DEFS[id].label}</span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

/* Scope tabs — VS Code: underline tab bar */
function ScopeTabs({ activeScope, onScopeChange, project }) {
  const tabs = [
    { id: "account", label: "Account" },
    { id: "project", label: project?.name || "Project" },
  ];
  return (
    <div className="flex items-stretch">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onScopeChange(tab.id)}
          className={`relative px-4 py-1.5 text-[13px] ${
            activeScope === tab.id
              ? "font-semibold text-ink"
              : "font-normal text-body hover:text-ink"
          }`}
        >
          {tab.label}
          {activeScope === tab.id && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary" />
          )}
        </button>
      ))}
    </div>
  );
}

/* Section heading — VS Code: 24px font-normal, thin bottom rule */
function SectionHeading({ title, subtitle }) {
  return (
    <div className="mb-4 pb-2 border-b border-hairline">
      <h1 className="text-[24px] font-normal leading-tight text-ink">{title}</h1>
      {subtitle && <p className="mt-0.5 text-[13px] text-body">{subtitle}</p>}
    </div>
  );
}

/* Sub-section heading — VS Code style: slightly larger than body, no rule */
function SubHeading({ title }) {
  return (
    <h2 className="mt-5 mb-2 text-[14px] font-semibold text-ink">{title}</h2>
  );
}

/*
  SettingRow — exact VS Code layout:

  "input" type:
    Category: Bold Name          ← 13px, label in semibold
    Controls whether to...       ← 13px gray description (2px gap below label)
    [control]                    ← 8px gap below description

  "checkbox" type — matches VS Code "Preserve Input" row:
    Category: Bold Name          ← 13px semibold (the `label` prop, shown above)
    [□] Description text inline  ← checkbox + description on same line

  Adjacent setting rows should sit flush so hover panels touch, like VS Code.
*/
function SettingRow({ label, description, hint, children, type = "input", settingMenu = null }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const setStatusMessage = useWorkflowStore((s) => s.setStatusMessage);
  const actionLabel = settingMenu?.title || label || "Setting";

  useEffect(() => {
    if (!menuOpen) return undefined;

    function handlePointerDown(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  async function copySetting(text, message) {
    try {
      await navigator.clipboard.writeText(text);
      setStatusMessage(message);
    } catch {
      setStatusMessage("Couldn't copy to clipboard.");
    } finally {
      setMenuOpen(false);
    }
  }

  function resetSetting() {
    settingMenu?.onReset?.();
    setStatusMessage(`${actionLabel} reset to default.`);
    setMenuOpen(false);
  }

  function renderSettingMenu() {
    if (!settingMenu) return null;

    return (
      <div
        ref={menuRef}
        className={`absolute right-3 top-3 z-20 transition-opacity ${
          menuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
        }`}
      >
        <button
          type="button"
          aria-label={`More actions for ${actionLabel}`}
          onClick={(event) => {
            event.stopPropagation();
            setMenuOpen((open) => !open);
          }}
          className="flex h-6 w-6 items-center justify-center rounded-[4px] border border-transparent bg-panel/90 text-body shadow-[0_0_0_1px_rgba(128,128,128,0.3)] hover:bg-panel hover:text-ink"
        >
          <Settings className="h-[13px] w-[13px]" strokeWidth={1.8} />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-[calc(100%+6px)] min-w-[210px] overflow-hidden rounded-[6px] border border-hairline bg-panel py-1 shadow-[0_10px_24px_rgba(0,0,0,0.12)]">
            {settingMenu.onReset && (
              <button
                type="button"
                onClick={resetSetting}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] text-body hover:bg-canvasSoft"
              >
                <RotateCcw className="h-[13px] w-[13px]" strokeWidth={1.8} />
                <span>Reset Setting</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => copySetting(settingMenu.id, "Copied setting ID.")}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] text-body hover:bg-canvasSoft"
            >
              <Copy className="h-[13px] w-[13px]" strokeWidth={1.8} />
              <span>Copy Setting ID</span>
            </button>
            <button
              type="button"
              onClick={() =>
                copySetting(
                  JSON.stringify({ id: settingMenu.id, value: settingMenu.value }, null, 2),
                  "Copied setting as JSON."
                )
              }
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] text-body hover:bg-canvasSoft"
            >
              <Copy className="h-[13px] w-[13px]" strokeWidth={1.8} />
              <span>Copy Setting as JSON</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  if (type === "checkbox") {
    return (
      <div className="mb-0">
        <div className="group relative -mx-4 rounded-[2px] pl-4 pr-12 py-3 transition-colors hover:bg-canvasSoft">
          {renderSettingMenu()}
          {/* Bold setting name above the checkbox row (matches VS Code) */}
          {label && <p className="mb-1 text-[13px] font-semibold text-ink">{label}</p>}
          {children}
          {hint && <p className="ml-[20px] mt-1 text-[11px] text-muted">{hint}</p>}
        </div>
      </div>
    );
  }
  return (
    <div className="mb-0">
      <div className="group relative -mx-4 rounded-[2px] pl-4 pr-12 py-3 transition-colors hover:bg-canvasSoft">
        {renderSettingMenu()}
        <p className="text-[13px] font-semibold text-ink">{label}</p>
        {description && (
          <p className="mt-[3px] text-[13px] leading-[1.45] text-body">{description}</p>
        )}
        {/* max-w-[500px] matches VS Code's bounded control width without Tailwind class conflicts */}
        <div className="mt-[10px] max-w-[500px]">{children}</div>
        {hint && <p className="mt-1 text-[12px] text-muted">{hint}</p>}
      </div>
    </div>
  );
}

/*
  CheckboxControl — VS Code style:
  [□] or [✓] inline with description text.
  VS Code uses a 14×14 square with 1px gray border when unchecked,
  blue fill (#005fb8) when checked. We replicate this with a hidden
  native input + a custom div that mimics the VS Code look exactly.
*/
function CheckboxControl({ id, label, checked, onChange }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-[6px] select-none group">
      {/* Hidden native checkbox for accessibility */}
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      {/* Custom VS Code-style checkbox square */}
      <span
        aria-hidden="true"
        className={`mt-[1px] flex h-[14px] w-[14px] shrink-0 items-center justify-center rounded-[2px] border ${
          checked
            ? "border-primary bg-primary"
            : "border-hairlineStrong bg-panel group-hover:border-primary"
        }`}
      >
        {checked && (
          <svg viewBox="0 0 10 8" className="h-[7px] w-[9px] fill-none stroke-white stroke-[1.5]">
            <path d="M1 4l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className="text-[13px] leading-[1.4] text-ink">{label}</span>
    </label>
  );
}

/*
  VS Code control dimensions (measured from screenshot):
  - Select / text input:  roughly 32px tall with a light gray border and subtle inset highlight
  - Number input:         auto width (set via className), same chrome as other inputs
  - Textarea:             500px wide, resizable
  - Focus ring:           blue #0078d4 border (1px)
*/

function VsSelect({ value, onChange, options, className = "" }) {
  return (
    <Select
      value={value}
      onChange={onChange}
      options={options}
      className={`w-full ${className}`.trim()}
      variant="settings"
    />
  );
}

function VsInput({ value, onChange, onBlur, placeholder = "", type = "text", readOnly = false, className = "" }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      placeholder={placeholder}
      readOnly={readOnly}
      className={`h-[32px] w-full rounded-[2px] border border-hairline bg-surfaceStrong px-[10px] text-[13px] text-ink placeholder-muted transition focus:border-primary focus:outline-none read-only:opacity-60 read-only:cursor-default ${className}`}
    />
  );
}

function VsTextarea({ value, onChange, onBlur, placeholder = "", className = "" }) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      placeholder={placeholder}
      className={`w-full resize-y rounded-[2px] border border-hairline bg-surfaceStrong px-[10px] py-[7px] text-[13px] text-ink leading-[1.45] placeholder-muted transition focus:border-primary focus:outline-none ${className}`}
    />
  );
}

function VsNumberInput({ value, onChange, min, max, step = 1, className = "" }) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={onChange}
      className={`h-[32px] rounded-[2px] border border-hairline bg-surfaceStrong px-[10px] text-[13px] text-ink transition focus:border-primary focus:outline-none ${className}`}
    />
  );
}


/* Project picker bar */
function ProjectPickerBar({ project, projectOptions, onProjectChange, isActiveProject, onOpenProject }) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-2 border-b border-hairline pb-3">
      <VsSelect
        value={project?.id || ""}
        onChange={onProjectChange}
        options={projectOptions}
        className="max-w-[320px] min-w-[220px]"
      />
      {!isActiveProject && project && (
        <button
          onClick={() => onOpenProject(project.id)}
          className="flex h-[32px] items-center gap-1 rounded-[2px] border border-hairlineStrong bg-canvasSoft px-3 text-[13px] text-ink hover:bg-panel transition"
        >
          Open project
        </button>
      )}
    </div>
  );
}


/* Key badge for shortcuts */
function KeyBadge({ k }) {
  return (
    <kbd className="rounded-[3px] border border-hairline bg-canvasSoft px-1.5 py-0.5 font-mono text-[11px] text-ink">
      {k}
    </kbd>
  );
}

// ─── Workflow row ───────────────────────────────────────────────────────────────

function WorkflowRow({ workflow, active, onActivate, onDuplicate, onDelete, onRename, disableDelete }) {
  const [name, setName] = useState(workflow.name || "");

  useEffect(() => {
    setName(workflow.name || "");
  }, [workflow.id, workflow.name]);

  return (
    <div className={`border-b border-hairlineSoft px-3 py-2.5 last:border-b-0 ${active ? "bg-primary/5" : ""}`}>
      <div className="flex items-center gap-2">
        {/* Workflow name input — fills available width */}
        <input
          className="h-[32px] min-w-0 flex-1 rounded-[2px] border border-hairline bg-surfaceStrong px-[10px] text-[13px] text-ink transition focus:border-primary focus:outline-none"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => {
            const trimmed = name.trim() || "Untitled Workflow";
            if (trimmed !== workflow.name) onRename(workflow.id, trimmed);
          }}
        />
        {/* Action buttons — right-aligned */}
        <div className="flex shrink-0 items-center gap-1">
          {!active && (
            <button
              onClick={() => onActivate(workflow.id)}
              className="h-[24px] border border-hairline bg-canvasSoft px-2.5 text-[12px] text-body hover:bg-panel transition"
            >
              Make active
            </button>
          )}
          <button
            onClick={() => onDuplicate(workflow.id)}
            className="h-[24px] border border-hairline bg-canvasSoft px-2.5 text-[12px] text-body hover:bg-panel transition"
          >
            Duplicate
          </button>
          {/* Delete — text-only, no border (matches VS Code destructive link style) */}
          <button
            disabled={disableDelete}
            onClick={() => onDelete(workflow.id)}
            className="h-[24px] px-1.5 text-[12px] text-error hover:underline disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            Delete
          </button>
        </div>
      </div>
      <p className="mt-1 text-[11px] text-muted">
        {workflow.builderTarget || "langgraph"} · {workflow.nodes?.length || 0} nodes
        {active && " · active workflow"}
      </p>
    </div>
  );
}

// ─── Provider catalog hook ──────────────────────────────────────────────────────

function useProviderCatalog(projectId) {
  const [providers, setProviders] = useState([]);
  const currentUser = useWorkflowStore((s) => s.currentUser);
  const userId = currentUserKey(currentUser);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/agents/providers?projectId=${projectId}`, {
          headers: userHeaders(userId),
        });
        const json = await res.json();
        if (!cancelled) setProviders(json.providers || []);
      } catch { if (!cancelled) setProviders([]); }
    }
    if (projectId) load();
    return () => { cancelled = true; };
  }, [projectId, userId]);
  return providers;
}

// ─── Section components ─────────────────────────────────────────────────────────

function GeneralSection({ project, updateProjectMeta, updateProjectSettings }) {
  const [name, setName] = useState(project.name || "");
  const [description, setDescription] = useState(project.description || "");
  const [businessPurpose, setBusinessPurpose] = useState(project.settings.general.businessPurpose || "");
  const [tags, setTags] = useState((project.settings.general.tags || []).join(", "));
  const defaultSettings = normalizeProjectSettings({}, project.workflows?.[0]);
  const resetProjectName = () => {
    const nextName = "Untitled Project";
    setName(nextName);
    updateProjectMeta(project.id, { name: nextName });
  };
  const resetProjectDescription = () => {
    setDescription("");
    updateProjectMeta(project.id, { description: "" });
  };
  const resetBusinessPurpose = () => {
    const nextValue = defaultSettings.general.businessPurpose || "";
    setBusinessPurpose(nextValue);
    updateProjectSettings(project.id, { general: { businessPurpose: nextValue } });
  };
  const resetTags = () => {
    const nextTags = defaultSettings.general.tags || [];
    setTags(nextTags.join(", "));
    updateProjectSettings(project.id, { general: { tags: nextTags } });
  };

  useEffect(() => {
    setName(project.name || "");
    setDescription(project.description || "");
    setBusinessPurpose(project.settings.general.businessPurpose || "");
    setTags((project.settings.general.tags || []).join(", "));
  }, [project.id, project.name, project.description, project.settings.general.businessPurpose, project.settings.general.tags]);

  return (
    <>
      <SectionHeading title="General" subtitle="Basic project identity and metadata." />

      <SubHeading title="Identity" />
        <SettingRow
          label="Project name"
          description="Shown in the explorer, tabs, project picker, and settings pages."
          settingMenu={{ id: "project.name", value: name, title: "Project name", onReset: resetProjectName }}
        >
          <VsInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => updateProjectMeta(project.id, { name: name.trim() || "Untitled Project" })}
            className="max-w-[400px]"
          />
        </SettingRow>
        <SettingRow
          label="Description"
          description="A short internal summary of what this project is for."
          settingMenu={{
            id: "project.description",
            value: description,
            title: "Description",
            onReset: resetProjectDescription,
          }}
        >
          <VsTextarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => updateProjectMeta(project.id, { description })}
            placeholder="What this project builds, coordinates, or automates."
            className="min-h-[72px] max-w-[520px]"
          />
        </SettingRow>
        <SettingRow
          label="Business purpose"
          description="A business-facing explanation for the team using this project."
          settingMenu={{
            ...buildProjectSettingMenu(project, updateProjectSettings, "general.businessPurpose", {
              value: businessPurpose,
              title: "Business purpose",
            }),
            onReset: resetBusinessPurpose,
          }}
        >
          <VsTextarea
            value={businessPurpose}
            onChange={(e) => setBusinessPurpose(e.target.value)}
            onBlur={() => updateProjectSettings(project.id, { general: { businessPurpose } })}
            placeholder="Example: Qualify inbound opportunities and draft a response pack."
          className="min-h-[60px] max-w-[520px]"
        />
      </SettingRow>

      <SubHeading title="Classification" />
        <SettingRow
          label="Lifecycle state"
          description="Track whether the project is draft, actively used, or archived."
          settingMenu={buildProjectSettingMenu(project, updateProjectSettings, "general.lifecycleState", {
            title: "Lifecycle state",
          })}
        >
          <VsSelect
            value={project.settings.general.lifecycleState}
            onChange={(value) => updateProjectSettings(project.id, { general: { lifecycleState: value } })}
            options={LIFECYCLE_OPTIONS}
            className="min-w-[160px]"
          />
        </SettingRow>
        <SettingRow
          label="Tags"
          description="Comma-separated tags for organizing projects."
          settingMenu={{
            ...buildProjectSettingMenu(project, updateProjectSettings, "general.tags", {
              value: project.settings.general.tags || [],
              title: "Tags",
            }),
            onReset: resetTags,
          }}
        >
          <VsInput
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            onBlur={() =>
              updateProjectSettings(project.id, {
              general: {
                tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
              },
            })
          }
          placeholder="sales, research, support"
          className="max-w-[400px]"
        />
      </SettingRow>
    </>
  );
}

function WorkflowsSection({ project, onAddWorkflow, onActivateWorkflow, onDuplicateWorkflow, onDeleteWorkflow, onRenameWorkflow, updateProjectSettings }) {
  const [starterName, setStarterName] = useState(project.settings.general.starterWorkflowName || "");
  const defaultSettings = normalizeProjectSettings({}, project.workflows?.[0]);
  const resetStarterWorkflowName = () => {
    const nextValue = defaultSettings.general.starterWorkflowName || "Untitled Workflow";
    setStarterName(nextValue);
    updateProjectSettings(project.id, { general: { starterWorkflowName: nextValue } });
  };

  useEffect(() => {
    setStarterName(project.settings.general.starterWorkflowName || "");
  }, [project.id, project.settings.general.starterWorkflowName]);

  return (
    <>
      <SectionHeading title="Workflows" subtitle="Naming defaults and workflow management." />

      <SubHeading title="Defaults" />
        <SettingRow
          label="New workflow base name"
          description="Used when creating additional workflows. Numbering is added when names collide."
          settingMenu={{
            ...buildProjectSettingMenu(project, updateProjectSettings, "general.starterWorkflowName", {
              value: starterName,
              title: "New workflow base name",
            }),
            onReset: resetStarterWorkflowName,
          }}
        >
          <VsInput
            value={starterName}
            onChange={(e) => setStarterName(e.target.value)}
            onBlur={() =>
              updateProjectSettings(project.id, { general: { starterWorkflowName: starterName.trim() || "Untitled Workflow" } })
            }
            className="max-w-[300px]"
          />
        </SettingRow>
        <SettingRow
          label="Node naming style"
          description="Used for newly inserted nodes so the project follows one naming convention."
          settingMenu={buildProjectSettingMenu(project, updateProjectSettings, "general.nodeNamingStyle", {
            title: "Node naming style",
          })}
        >
          <VsSelect
            value={project.settings.general.nodeNamingStyle}
            onChange={(value) => updateProjectSettings(project.id, { general: { nodeNamingStyle: value } })}
            options={NAMING_STYLE_OPTIONS}
          className="min-w-[160px]"
        />
      </SettingRow>

      <SubHeading title="Workflow library" />
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[12px] text-body">
          {(project.workflows || []).length} workflow{(project.workflows || []).length !== 1 ? "s" : ""} in this project
        </p>
        <button
          onClick={onAddWorkflow}
          className="flex h-[26px] items-center gap-1.5 rounded-[2px] border border-hairline bg-canvasSoft px-3 text-[12px] text-ink hover:bg-panel transition"
        >
          + New workflow
        </button>
      </div>
      <div className="rounded-[2px] border border-hairline overflow-hidden">
        {(project.workflows || []).map((workflow) => (
          <WorkflowRow
            key={workflow.id}
            workflow={workflow}
            active={workflow.id === project.activeWorkflowId}
            onActivate={onActivateWorkflow}
            onDuplicate={onDuplicateWorkflow}
            onDelete={onDeleteWorkflow}
            onRename={onRenameWorkflow}
            disableDelete={(project.workflows || []).length <= 1}
          />
        ))}
      </div>
    </>
  );
}

function ModelsSection({ project, updateProjectSettings, refreshKey, onAddProvider, onEditProvider }) {
  const [systemPrompt, setSystemPrompt] = useState(project.settings.models.systemPromptPrefix || "");
  const providers = useProviderCatalog(project.id);
  const providerCatalog = providers.length ? providers : DEFAULT_PROVIDER_CATALOG;
  const selectedProvider = project.settings.models.defaultProvider;
  const selectedProviderRecord = providerCatalog.find((p) => p.id === selectedProvider);
  const providerOptions = providerCatalog.map((p) => ({ value: p.id, label: p.name }));
  const currentModelValue = project.settings.models.defaultModel || "";
  const providerModelOptions = selectedProviderRecord?.models?.map((model, index) => ({
    value: model.id,
    label: model.name || model.id,
    meta: index === 0 ? "default" : undefined,
  })) || [];
  const modelOptions = providerModelOptions.some((model) => model.value === currentModelValue)
    ? providerModelOptions
    : currentModelValue
      ? [{ value: currentModelValue, label: currentModelValue, meta: "current" }, ...providerModelOptions]
      : providerModelOptions;
  const defaultSettings = normalizeProjectSettings({}, project.workflows?.[0]);

  const resetDefaultProvider = () => {
    const nextProvider = defaultSettings.models.defaultProvider;
    const provider = providerCatalog.find((item) => item.id === nextProvider);
    const nextModel = provider?.models?.[0]?.id || defaultSettings.models.defaultModel;
    updateProjectSettings(project.id, { models: { defaultProvider: nextProvider, defaultModel: nextModel } });
  };

  const resetDefaultModel = () => {
    const provider = providerCatalog.find((item) => item.id === selectedProvider);
    const nextModel = provider?.models?.[0]?.id || defaultSettings.models.defaultModel;
    updateProjectSettings(project.id, { models: { defaultModel: nextModel } });
  };

  const resetSystemPrompt = () => {
    const nextValue = defaultSettings.models.systemPromptPrefix || "";
    setSystemPrompt(nextValue);
    updateProjectSettings(project.id, { models: { systemPromptPrefix: nextValue } });
  };

  useEffect(() => {
    setSystemPrompt(project.settings.models.systemPromptPrefix || "");
  }, [project.id, project.settings.models.systemPromptPrefix]);

  return (
    <>
      <SectionHeading title="Models & Providers" subtitle="Default AI model, provider, and generation parameters." />

      <SubHeading title="Default model" />
        <SettingRow
          label="Default provider"
          description="Used as the starting provider for AI nodes in this project."
          settingMenu={{
            ...buildProjectSettingMenu(project, updateProjectSettings, "models.defaultProvider", {
              value: selectedProvider,
              title: "Default provider",
            }),
            onReset: resetDefaultProvider,
          }}
        >
          <VsSelect
            value={selectedProvider}
            onChange={(value) => {
              const provider = providerCatalog.find((p) => p.id === value);
              const model = provider?.models?.[0]?.id || project.settings.models.defaultModel;
            updateProjectSettings(project.id, { models: { defaultProvider: value, defaultModel: model } });
          }}
          options={providerOptions}
          className="min-w-[180px]"
        />
      </SettingRow>
        <SettingRow
          label="Default model"
          description="Choose the default model from the selected provider's available model list."
          settingMenu={{
            ...buildProjectSettingMenu(project, updateProjectSettings, "models.defaultModel", {
              value: currentModelValue,
              title: "Default model",
            }),
            onReset: resetDefaultModel,
          }}
        >
          <VsSelect
            value={currentModelValue}
            onChange={(value) => updateProjectSettings(project.id, { models: { defaultModel: value } })}
            options={modelOptions}
          className="max-w-[420px]"
        />
      </SettingRow>

      <SubHeading title="Generation parameters" />
        <SettingRow
          label="Temperature"
          description="Controls response randomness. Enter a value between 0.0 and 2.0."
          hint="0.0 = fully deterministic  ·  0.7 = balanced default  ·  2.0 = highly creative"
          settingMenu={buildProjectSettingMenu(project, updateProjectSettings, "models.temperature", {
            title: "Temperature",
          })}
        >
          <VsNumberInput
            value={project.settings.models.temperature ?? 0.7}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
            if (!Number.isNaN(v) && v >= 0 && v <= 2)
              updateProjectSettings(project.id, { models: { temperature: parseFloat(v.toFixed(2)) } });
          }}
          min={0}
          max={2}
          step={0.05}
          className="w-[100px]"
        />
      </SettingRow>
        <SettingRow
          label="Max output tokens"
          description="Hard upper bound on tokens per model call. Set to 0 to use the provider default."
          hint="Typical ranges: 512–4096 for fast tasks · 8192+ for long-form synthesis"
          settingMenu={buildProjectSettingMenu(project, updateProjectSettings, "models.maxTokens", {
            title: "Max output tokens",
          })}
        >
          <div className="flex items-center gap-2">
            <VsNumberInput
              value={project.settings.models.maxTokens ?? 2048}
            onChange={(e) =>
              updateProjectSettings(project.id, { models: { maxTokens: Math.max(0, Number(e.target.value) || 0) } })
            }
            min={0}
            max={128000}
            step={256}
            className="w-[120px]"
          />
          {(project.settings.models.maxTokens ?? 2048) === 0 && (
            <span className="text-[12px] text-muted">Provider default</span>
          )}
        </div>
      </SettingRow>

      <SubHeading title="System prompt" />
        <SettingRow
          label="System prompt prefix"
          description="Prepended to every agent's system prompt in this project. Leave blank to use each agent's own prompt."
          settingMenu={{
            ...buildProjectSettingMenu(project, updateProjectSettings, "models.systemPromptPrefix", {
              value: systemPrompt,
              title: "System prompt prefix",
            }),
            onReset: resetSystemPrompt,
          }}
        >
          <VsTextarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
          onBlur={() => updateProjectSettings(project.id, { models: { systemPromptPrefix: systemPrompt } })}
          placeholder="You are a helpful assistant. Always respond in plain English..."
          className="min-h-[90px] max-w-[520px] font-mono text-[12px]"
        />
      </SettingRow>

      <SubHeading title="Provider configuration" />
      <p className="mb-2 text-[12px] text-body">
        API keys configured here apply only to this project. Project keys override account-level keys.
      </p>
      <div className="rounded-[2px] border border-hairline overflow-hidden">
        <ProviderSettings
          projectId={project.id}
          global={false}
          refreshKey={refreshKey}
          onAddProvider={onAddProvider}
          onEditProvider={onEditProvider}
          tableMode
        />
      </div>
    </>
  );
}

function ExecutionSection({ project, updateProjectSettings }) {
  const execution = project.settings.execution;

  return (
    <>
      <SectionHeading title="Execution" subtitle="Runtime behaviour: step limits, handoff, retry, timeout, and streaming." />

      <SubHeading title="Runtime framework" />
        <SettingRow
          label="Builder target"
          description="The code-generation target for workflows exported or run from this project."
          settingMenu={buildProjectSettingMenu(project, updateProjectSettings, "execution.builderTarget", {
            title: "Builder target",
          })}
        >
          <VsSelect
            value={execution.builderTarget}
            onChange={(value) => updateProjectSettings(project.id, { execution: { builderTarget: value } })}
            options={BUILDER_OPTIONS}
            className="min-w-[160px]"
        />
      </SettingRow>

      <SubHeading title="Graph constraints" />
        <SettingRow
          label="Max agent steps"
          description="A hard guardrail against runaway loops. If an agent exceeds this step count the run is terminated."
          settingMenu={buildProjectSettingMenu(project, updateProjectSettings, "execution.maxAgentSteps", {
            title: "Max agent steps",
          })}
        >
          <div className="flex items-center gap-2">
            <VsNumberInput
            value={execution.maxAgentSteps}
            onChange={(e) =>
              updateProjectSettings(project.id, { execution: { maxAgentSteps: Math.max(1, Number(e.target.value) || 1) } })
            }
            min={1}
            max={200}
            className="w-[80px]"
          />
          <span className="text-[12px] text-body">steps maximum</span>
        </div>
      </SettingRow>
        <SettingRow
          label="Handoff policy"
          description="Controls whether graph edges or orchestrator decisions have the stronger say."
          settingMenu={buildProjectSettingMenu(project, updateProjectSettings, "execution.handoffPolicy", {
            title: "Handoff policy",
          })}
        >
          <VsSelect
            value={execution.handoffPolicy}
            onChange={(value) => updateProjectSettings(project.id, { execution: { handoffPolicy: value } })}
            options={HANDOFF_OPTIONS}
            className="min-w-[240px]"
          />
        </SettingRow>
        <SettingRow
          type="checkbox"
          settingMenu={buildProjectSettingMenu(project, updateProjectSettings, "execution.requireFinalSynthesis", {
            title: "Require final synthesis",
          })}
        >
          <CheckboxControl
            id="requireFinalSynthesis"
            label="Require final synthesis"
            checked={execution.requireFinalSynthesis}
            onChange={(value) => updateProjectSettings(project.id, { execution: { requireFinalSynthesis: value } })}
        />
        <p className="mt-1 ml-[20px] text-[13px] leading-[1.4] text-body">
          Keep the orchestrator responsible for producing one final merged answer before completion.
        </p>
      </SettingRow>
        <SettingRow
          type="checkbox"
          settingMenu={buildProjectSettingMenu(project, updateProjectSettings, "execution.allowParallelBranches", {
            title: "Allow parallel branches",
          })}
        >
          <CheckboxControl
            id="allowParallelBranches"
            label="Allow parallel branches"
            checked={execution.allowParallelBranches}
            onChange={(value) => updateProjectSettings(project.id, { execution: { allowParallelBranches: value } })}
        />
        <p className="mt-1 ml-[20px] text-[13px] leading-[1.4] text-body">
          Allow independent branches to run concurrently when the graph structure supports it.
        </p>
      </SettingRow>

      <SubHeading title="Timeout & retries" />
        <SettingRow
          label="Run timeout"
          description="Maximum total time for a single workflow run before it is automatically cancelled."
          settingMenu={buildProjectSettingMenu(project, updateProjectSettings, "execution.timeoutSeconds", {
            title: "Run timeout",
          })}
        >
          <div className="flex items-center gap-2">
            <VsNumberInput
            value={execution.timeoutSeconds ?? 60}
            onChange={(e) =>
              updateProjectSettings(project.id, { execution: { timeoutSeconds: Math.max(5, Number(e.target.value) || 60) } })
            }
            min={5}
            max={3600}
            step={5}
            className="w-[80px]"
          />
          <span className="text-[12px] text-body">seconds</span>
        </div>
      </SettingRow>
        <SettingRow
          type="checkbox"
          settingMenu={buildProjectSettingMenu(project, updateProjectSettings, "execution.retryOnError", {
            title: "Retry on error",
          })}
        >
          <CheckboxControl
            id="retryOnError"
            label="Retry on error"
            checked={execution.retryOnError ?? false}
          onChange={(value) => updateProjectSettings(project.id, { execution: { retryOnError: value } })}
        />
        <p className="mt-1 ml-[20px] text-[13px] leading-[1.4] text-body">
          Automatically retry a failed node call before escalating to the error handling policy.
        </p>
      </SettingRow>
      {(execution.retryOnError ?? false) && (
        <SettingRow
          label="Retry count"
          description="How many additional attempts to make before giving up on a failing node."
          settingMenu={buildProjectSettingMenu(project, updateProjectSettings, "execution.retryCount", {
            title: "Retry count",
          })}
        >
          <div className="flex items-center gap-2">
            <VsNumberInput
              value={execution.retryCount ?? 2}
              onChange={(e) =>
                updateProjectSettings(project.id, { execution: { retryCount: Math.max(1, Math.min(10, Number(e.target.value) || 1)) } })
              }
              min={1}
              max={10}
              className="w-[60px]"
            />
            <span className="text-[12px] text-body">attempt{(execution.retryCount ?? 2) === 1 ? "" : "s"}</span>
          </div>
        </SettingRow>
      )}
      <SettingRow
        label="Error handling mode"
        description="What happens when a node fails after all retry attempts are exhausted."
        settingMenu={buildProjectSettingMenu(project, updateProjectSettings, "execution.errorHandlingMode", {
          title: "Error handling mode",
        })}
      >
        <VsSelect
          value={execution.errorHandlingMode ?? "stop"}
          onChange={(value) => updateProjectSettings(project.id, { execution: { errorHandlingMode: value } })}
          options={ERROR_HANDLING_OPTIONS}
          className="min-w-[260px]"
        />
      </SettingRow>

      <SubHeading title="Output streaming" />
      <SettingRow
        type="checkbox"
        settingMenu={buildProjectSettingMenu(project, updateProjectSettings, "execution.streamOutput", {
          title: "Stream output in real time",
        })}
      >
        <CheckboxControl
          id="streamOutput"
          label="Stream output in real time"
          checked={execution.streamOutput ?? true}
          onChange={(value) => updateProjectSettings(project.id, { execution: { streamOutput: value } })}
        />
        <p className="mt-1 ml-[20px] text-[13px] leading-[1.4] text-body">
          Show agent tokens as they arrive instead of waiting for the full response. Disable for cleaner batch output.
        </p>
      </SettingRow>
    </>
  );
}

function OutputsSection({ project, updateProjectSettings }) {
  const [artifactPrefix, setArtifactPrefix] = useState(project.settings.artifacts.artifactPrefix || "");
  const artifacts = project.settings.artifacts;
  const defaultSettings = normalizeProjectSettings({}, project.workflows?.[0]);
  const resetArtifactPrefix = () => {
    const nextValue = defaultSettings.artifacts.artifactPrefix || "";
    setArtifactPrefix(nextValue);
    updateProjectSettings(project.id, { artifacts: { artifactPrefix: nextValue } });
  };

  useEffect(() => {
    setArtifactPrefix(project.settings.artifacts.artifactPrefix || "");
  }, [project.id, project.settings.artifacts.artifactPrefix]);

  return (
    <>
      <SectionHeading title="Outputs" subtitle="Format, visibility, and naming rules for workflow outputs." />

      <SubHeading title="Format" />
        <SettingRow
          label="Output format"
          description="The default format for agent, orchestrator, and output nodes in this project."
          settingMenu={buildProjectSettingMenu(project, updateProjectSettings, "artifacts.outputFormat", {
            title: "Output format",
          })}
        >
          <VsSelect
            value={artifacts.outputFormat}
            onChange={(value) => updateProjectSettings(project.id, { artifacts: { outputFormat: value } })}
            options={OUTPUT_FORMAT_OPTIONS}
            className="min-w-[160px]"
          />
        </SettingRow>

        <SubHeading title="Visibility" />
        <SettingRow
          type="checkbox"
          settingMenu={buildProjectSettingMenu(project, updateProjectSettings, "artifacts.showIntermediateSteps", {
            title: "Show intermediate steps",
          })}
        >
          <CheckboxControl
            id="showIntermediateSteps"
            label="Show intermediate steps"
            checked={artifacts.showIntermediateSteps ?? true}
          onChange={(value) => updateProjectSettings(project.id, { artifacts: { showIntermediateSteps: value } })}
        />
        <p className="mt-1 ml-[20px] text-[13px] leading-[1.4] text-body">
          Display each agent's output as the workflow progresses, not just the final answer.
        </p>
      </SettingRow>
        <SettingRow
          type="checkbox"
          settingMenu={buildProjectSettingMenu(project, updateProjectSettings, "artifacts.includeTimestamps", {
            title: "Include timestamps",
          })}
        >
          <CheckboxControl
            id="includeTimestamps"
            label="Include timestamps"
            checked={artifacts.includeTimestamps ?? false}
          onChange={(value) => updateProjectSettings(project.id, { artifacts: { includeTimestamps: value } })}
        />
        <p className="mt-1 ml-[20px] text-[13px] leading-[1.4] text-body">
          Prefix each output entry with the time it was produced. Useful for long-running workflows.
        </p>
      </SettingRow>
        <SettingRow
          label="Max output length"
          description="Truncate any single agent response to this many characters. Set to 0 for no limit."
          hint="Use this to prevent long outputs from overwhelming the panel."
          settingMenu={buildProjectSettingMenu(project, updateProjectSettings, "artifacts.maxOutputLength", {
            title: "Max output length",
          })}
        >
          <div className="flex items-center gap-2">
            <VsNumberInput
            value={artifacts.maxOutputLength ?? 0}
            onChange={(e) =>
              updateProjectSettings(project.id, { artifacts: { maxOutputLength: Math.max(0, Number(e.target.value) || 0) } })
            }
            min={0}
            max={100000}
            step={500}
            className="w-[100px]"
          />
          {(artifacts.maxOutputLength ?? 0) === 0 && (
            <span className="text-[12px] text-muted">No limit</span>
          )}
        </div>
      </SettingRow>

      <SubHeading title="Naming & post-processing" />
        <SettingRow
          label="Artifact name prefix"
          description="A string prepended to every saved artifact name for this project. Leave blank to use the workflow name."
          settingMenu={{
            ...buildProjectSettingMenu(project, updateProjectSettings, "artifacts.artifactPrefix", {
              value: artifactPrefix,
              title: "Artifact name prefix",
            }),
            onReset: resetArtifactPrefix,
          }}
        >
          <VsInput
            value={artifactPrefix}
            onChange={(e) => setArtifactPrefix(e.target.value)}
            onBlur={() => updateProjectSettings(project.id, { artifacts: { artifactPrefix: artifactPrefix.trim() } })}
            placeholder="my-project"
            className="max-w-[260px]"
          />
        </SettingRow>
        <SettingRow
          type="checkbox"
          settingMenu={buildProjectSettingMenu(project, updateProjectSettings, "artifacts.copyOnComplete", {
            title: "Copy to clipboard on complete",
          })}
        >
          <CheckboxControl
            id="copyOnComplete"
            label="Copy to clipboard on complete"
            checked={artifacts.copyOnComplete ?? false}
          onChange={(value) => updateProjectSettings(project.id, { artifacts: { copyOnComplete: value } })}
        />
        <p className="mt-1 ml-[20px] text-[13px] leading-[1.4] text-body">
          Automatically copy the final output to the clipboard when a run finishes successfully.
        </p>
      </SettingRow>
    </>
  );
}

function SafetySection({ project, updateProjectSettings }) {
  const [instructions, setInstructions] = useState(project.settings.collaboration.projectInstructions || "");
  const [conventions, setConventions] = useState(project.settings.collaboration.sharedConventions || "");
  const [reviewer, setReviewer] = useState(project.settings.collaboration.defaultReviewer || "");
  const defaultSettings = normalizeProjectSettings({}, project.workflows?.[0]);
  const resetProjectInstructions = () => {
    const nextValue = defaultSettings.collaboration.projectInstructions || "";
    setInstructions(nextValue);
    updateProjectSettings(project.id, { collaboration: { projectInstructions: nextValue } });
  };
  const resetSharedConventions = () => {
    const nextValue = defaultSettings.collaboration.sharedConventions || "";
    setConventions(nextValue);
    updateProjectSettings(project.id, { collaboration: { sharedConventions: nextValue } });
  };
  const resetDefaultReviewer = () => {
    const nextValue = defaultSettings.collaboration.defaultReviewer || "Reviewer";
    setReviewer(nextValue);
    updateProjectSettings(project.id, { collaboration: { defaultReviewer: nextValue } });
  };

  useEffect(() => {
    setInstructions(project.settings.collaboration.projectInstructions || "");
    setConventions(project.settings.collaboration.sharedConventions || "");
    setReviewer(project.settings.collaboration.defaultReviewer || "");
  }, [
    project.id,
    project.settings.collaboration.projectInstructions,
    project.settings.collaboration.sharedConventions,
    project.settings.collaboration.defaultReviewer,
  ]);

  return (
    <>
      <SectionHeading title="Instructions & Safety" subtitle="Persistent project guidance, reviewer defaults, and safeguards." />

      <SubHeading title="Team guidance" />
        <SettingRow
          label="Project instructions"
          description="High-level guidance for how this project should be handled."
          settingMenu={{
            ...buildProjectSettingMenu(project, updateProjectSettings, "collaboration.projectInstructions", {
              value: instructions,
              title: "Project instructions",
            }),
            onReset: resetProjectInstructions,
          }}
        >
          <VsTextarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            onBlur={() => updateProjectSettings(project.id, { collaboration: { projectInstructions: instructions } })}
            placeholder="How this project should be handled, what to optimize for, and what to avoid."
            className="min-h-[90px] max-w-[520px]"
          />
        </SettingRow>
        <SettingRow
          label="Shared conventions"
          description="Naming, formatting, and output expectations across workflows."
          settingMenu={{
            ...buildProjectSettingMenu(project, updateProjectSettings, "collaboration.sharedConventions", {
              value: conventions,
              title: "Shared conventions",
            }),
            onReset: resetSharedConventions,
          }}
        >
          <VsTextarea
            value={conventions}
            onChange={(e) => setConventions(e.target.value)}
            onBlur={() => updateProjectSettings(project.id, { collaboration: { sharedConventions: conventions } })}
            placeholder="Examples: naming style, output structure, escalation rules."
            className="min-h-[76px] max-w-[520px]"
          />
        </SettingRow>
        <SettingRow
          label="Default reviewer"
          description="Saved with the project as the default reviewer identity."
          settingMenu={{
            ...buildProjectSettingMenu(project, updateProjectSettings, "collaboration.defaultReviewer", {
              value: reviewer,
              title: "Default reviewer",
            }),
            onReset: resetDefaultReviewer,
          }}
        >
          <VsInput
            value={reviewer}
            onChange={(e) => setReviewer(e.target.value)}
            onBlur={() => updateProjectSettings(project.id, { collaboration: { defaultReviewer: reviewer || "Reviewer" } })}
            placeholder="Reviewer"
            className="max-w-[260px]"
          />
        </SettingRow>

        <SubHeading title="Destructive action safeguards" />
        <SettingRow
          type="checkbox"
          settingMenu={buildProjectSettingMenu(project, updateProjectSettings, "collaboration.requireReviewBeforeDelete", {
            title: "Require typed confirmation before delete",
          })}
        >
          <CheckboxControl
            id="requireReviewBeforeDelete"
            label="Require typed confirmation before delete"
            checked={project.settings.collaboration.requireReviewBeforeDelete}
          onChange={(value) => updateProjectSettings(project.id, { collaboration: { requireReviewBeforeDelete: value } })}
        />
        <p className="mt-1 ml-[20px] text-[13px] leading-[1.4] text-body">
          When enabled, deleting the project requires typing the project name instead of using a simple confirm action.
        </p>
      </SettingRow>
    </>
  );
}

function AppearanceSection({ project, updateProjectSettings }) {
  const appearance = project.settings.appearance || {};
  return (
    <>
      <SectionHeading title="Appearance" subtitle="Canvas display options: minimap, grid, node density, and sidebar layout." />

      <SubHeading title="Canvas" />
      <SettingRow
        type="checkbox"
        settingMenu={buildProjectSettingMenu(project, updateProjectSettings, "appearance.showMinimap", {
          title: "Show minimap",
        })}
      >
        <CheckboxControl
          id="showMinimap"
          label="Show minimap"
          checked={appearance.showMinimap ?? true}
          onChange={(value) => updateProjectSettings(project.id, { appearance: { showMinimap: value } })}
        />
        <p className="mt-1 ml-[20px] text-[13px] leading-[1.4] text-body">
          Display a small overview map in the bottom-right corner of the canvas for large workflows.
        </p>
      </SettingRow>
      <SettingRow
        type="checkbox"
        settingMenu={buildProjectSettingMenu(project, updateProjectSettings, "appearance.showGridLines", {
          title: "Show grid lines",
        })}
      >
        <CheckboxControl
          id="showGridLines"
          label="Show grid lines"
          checked={appearance.showGridLines ?? false}
          onChange={(value) => updateProjectSettings(project.id, { appearance: { showGridLines: value } })}
        />
        <p className="mt-1 ml-[20px] text-[13px] leading-[1.4] text-body">
          Draw a subtle background grid on the canvas to help align nodes manually.
        </p>
      </SettingRow>
      <SettingRow
        label="Node detail level"
        description="How much information is shown inside each node on the canvas."
        settingMenu={buildProjectSettingMenu(project, updateProjectSettings, "appearance.nodeSize", {
          title: "Node detail level",
        })}
      >
        <VsSelect
          value={appearance.nodeSize ?? "normal"}
          onChange={(value) => updateProjectSettings(project.id, { appearance: { nodeSize: value } })}
          options={NODE_SIZE_OPTIONS}
          className="min-w-[140px]"
        />
      </SettingRow>

      <SubHeading title="Sidebar" />
      <SettingRow
        label="Sidebar density"
        description="Controls the spacing and density of the left sidebar panels."
        settingMenu={buildProjectSettingMenu(project, updateProjectSettings, "appearance.sidebarDensity", {
          title: "Sidebar density",
        })}
      >
        <VsSelect
          value={appearance.sidebarDensity ?? "comfortable"}
          onChange={(value) => updateProjectSettings(project.id, { appearance: { sidebarDensity: value } })}
          options={SIDEBAR_DENSITY_OPTIONS}
          className="min-w-[140px]"
        />
      </SettingRow>
    </>
  );
}

function ShortcutsSection() {
  return (
    <>
      <SectionHeading title="Keyboard Shortcuts" subtitle="Quick reference for all keyboard shortcuts in the application." />
      {SHORTCUT_GROUPS.map((group) => (
        <div key={group.label}>
          <SubHeading title={group.label} />
          {group.shortcuts.map((s, i) => (
            <div
              key={i}
              className="flex items-center justify-between border-b border-hairlineSoft py-1.5 last:border-b-0"
            >
              <span className="text-[13px] text-ink">{s.description}</span>
              <div className="flex items-center gap-1">
                {s.keys.map((k, j) => (
                  <span key={j} className="flex items-center gap-1">
                    <KeyBadge k={k} />
                    {j < s.keys.length - 1 && <span className="text-[11px] text-muted">+</span>}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
      <p className="mt-6 text-[12px] text-muted">
        Shortcuts are fixed and cannot be customized in this version. Canvas pan and zoom also work with trackpad gestures.
      </p>
    </>
  );
}

function AdvancedSection({ project }) {
  const snapshot = {
    projectId: project.id,
    activeWorkflowId: project.activeWorkflowId,
    workflowCount: project.workflows?.length || 0,
    schemaVersion: project.settings.schemaVersion || PROJECT_SETTINGS_SCHEMA_VERSION,
    settings: project.settings,
  };

  const rows = [
    { label: "Project ID", value: project.id, mono: true },
    { label: "Active workflow ID", value: project.activeWorkflowId || "—", mono: true },
    { label: "Schema version", value: String(project.settings.schemaVersion || PROJECT_SETTINGS_SCHEMA_VERSION), mono: true },
    { label: "Created", value: formatDate(project.createdAt, true) },
    { label: "Last updated", value: formatDate(project.updatedAt, true) },
    { label: "Workflow count", value: String(project.workflows?.length || 0) },
    { label: "Total nodes", value: String((project.workflows || []).reduce((sum, wf) => sum + (wf.nodes?.length || 0), 0)) },
  ];

  return (
    <>
      <SectionHeading title="Advanced" subtitle="Read-only project metadata and raw settings payload." />

      <SubHeading title="Project metadata" />
      <table className="w-full border-collapse rounded-[2px] border border-hairline overflow-hidden">
        <tbody>
          {rows.map(({ label, value, mono }) => (
            <tr key={label} className="border-b border-hairlineSoft last:border-b-0 hover:bg-canvasSoft">
              <td className="w-[200px] py-2 pl-3 pr-4 text-[12px] font-medium text-body">{label}</td>
              <td className={`py-2 pl-0 pr-3 text-[12px] text-ink ${mono ? "font-mono" : ""}`}>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <SubHeading title="Saved settings JSON" />
      <textarea
        readOnly
        value={JSON.stringify(snapshot, null, 2)}
        className="mt-2 min-h-[240px] w-full resize-y rounded-[2px] border border-hairline bg-canvasSoft px-3 py-2 font-mono text-[11px] text-body leading-relaxed focus:outline-none"
      />
    </>
  );
}

function DangerSection({ project, onResetWorkflow, onDeleteProject }) {
  const [deletingConfirm, setDeletingConfirm] = useState(false);
  const [typedName, setTypedName] = useState("");
  const requiresTyped = project.settings.collaboration.requireReviewBeforeDelete;
  const canDelete = !requiresTyped || typedName.trim() === (project.name || "Untitled Project");

  return (
    <>
      <SectionHeading title="Danger Zone" subtitle="Reset or delete actions for the current project." />

      <SubHeading title="Reset" />
      <SettingRow
        label="Reset active workflow"
        description="Replace the current active workflow canvas with its default template. Configuration in that workflow will be lost."
      >
        <button
          onClick={onResetWorkflow}
          className="h-[26px] rounded-[2px] border border-error/40 bg-panel px-3 text-[12px] text-error hover:bg-error/5 transition"
        >
          Reset active workflow
        </button>
      </SettingRow>

      <SubHeading title="Delete project" />
      <SettingRow
        label="Delete this project"
        description="Delete the project and every workflow saved inside it. This cannot be undone."
      >
        <div className="space-y-3">
          {!deletingConfirm ? (
            <button
              onClick={() => setDeletingConfirm(true)}
              className="h-[26px] rounded-[2px] border border-error/40 bg-panel px-3 text-[12px] text-error hover:bg-error/5 transition"
            >
              Delete project…
            </button>
          ) : (
            <>
              {requiresTyped && (
                <div className="space-y-1.5">
                  <p className="text-[12px] text-body">
                    Type <span className="font-mono text-ink">{project.name || "Untitled Project"}</span> to confirm.
                  </p>
                  <VsInput
                    value={typedName}
                    onChange={(e) => setTypedName(e.target.value)}
                    className="max-w-[280px] font-mono"
                  />
                </div>
              )}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setDeletingConfirm(false); setTypedName(""); }}
                  className="h-[26px] rounded-[2px] border border-hairline bg-canvasSoft px-3 text-[12px] text-ink hover:bg-panel transition"
                >
                  Cancel
                </button>
                <button
                  disabled={!canDelete}
                  onClick={() => onDeleteProject(project.id)}
                  className="h-[26px] rounded-[2px] border border-error bg-error px-3 text-[12px] text-white hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Confirm delete
                </button>
              </div>
            </>
          )}
        </div>
      </SettingRow>
    </>
  );
}

function AccountSection({ refreshKey }) {
  return (
    <>
      <SectionHeading
        title="Account"
        subtitle="Global API keys shared across all projects on this machine."
      />

      {/* Key precedence banner */}
      <div className="mb-4 flex items-start gap-3 rounded-[2px] border border-hairline bg-primary/5 px-3 py-2.5">
        <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white">i</div>
        <p className="text-[12px] text-body leading-relaxed">
          <span className="font-semibold">Key precedence:</span>{" "}
          Project key <span className="mx-1 text-muted">›</span> Account key (this page){" "}
          <span className="mx-1 text-muted">›</span> Environment variable
          <span className="ml-1 text-body">(GROQ_API_KEY, OPENAI_API_KEY, etc.)</span>
        </p>
      </div>

      <div className="rounded-[2px] border border-hairline overflow-hidden">
        <ProviderSettings global refreshKey={refreshKey} tableMode />
      </div>
    </>
  );
}

function EmptyState({ onCreateProject }) {
  return (
    <div className="flex h-full items-center justify-center px-8">
      <div className="max-w-md text-center">
        <h2 className="text-[18px] font-normal text-ink">No project selected</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-body">
          Create a project first, then this page becomes the place for project defaults and saved configuration.
        </p>
        <button
          onClick={() => onCreateProject()}
          className="mt-5 h-[28px] rounded-[2px] border border-hairline bg-canvasSoft px-4 text-[12px] text-ink hover:bg-panel transition"
        >
          Create project
        </button>
      </div>
    </div>
  );
}

// ─── Main export ────────────────────────────────────────────────────────────────

export default function UnifiedSettingsPanel({ onClose }) {
  const projects = useWorkflowStore((s) => s.projects);
  const activeProjectId = useWorkflowStore((s) => s.activeProjectId);
  const switchProject = useWorkflowStore((s) => s.switchProject);
  const createProject = useWorkflowStore((s) => s.createProject);
  const addWorkflow = useWorkflowStore((s) => s.addWorkflow);
  const removeWorkflow = useWorkflowStore((s) => s.removeWorkflow);
  const renameWorkflow = useWorkflowStore((s) => s.renameWorkflow);
  const duplicateWorkflow = useWorkflowStore((s) => s.duplicateWorkflow);
  const setActiveWorkflow = useWorkflowStore((s) => s.setActiveWorkflow);
  const deleteProject = useWorkflowStore((s) => s.deleteProject);
  const resetWorkflow = useWorkflowStore((s) => s.resetWorkflow);
  const closeSettings = useWorkflowStore((s) => s.closeSettings);
  const settingsProjectId = useWorkflowStore((s) => s.settingsProjectId);
  const setSettingsProject = useWorkflowStore((s) => s.setSettingsProject);
  const settingsActiveSection = useWorkflowStore((s) => s.settingsActiveSection);
  const setSettingsActiveSection = useWorkflowStore((s) => s.setSettingsActiveSection);
  const updateProjectMeta = useWorkflowStore((s) => s.updateProjectMeta);
  const updateProjectSettings = useWorkflowStore((s) => s.updateProjectSettings);
  const projectLayoutRef = useRef(null);

  const [search, setSearch] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [subPage, setSubPage] = useState(null);
  const [activeScope, setActiveScope] = useState("project");
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    if (typeof window === "undefined") return SETTINGS_SIDEBAR_DEFAULT_WIDTH;
    const stored = Number(window.localStorage.getItem(SETTINGS_SIDEBAR_WIDTH_KEY));
    return Number.isFinite(stored)
      ? Math.min(SETTINGS_SIDEBAR_MAX_WIDTH, Math.max(SETTINGS_SIDEBAR_MIN_WIDTH, stored))
      : SETTINGS_SIDEBAR_DEFAULT_WIDTH;
  });

  const selectedProjectId = settingsProjectId || activeProjectId || projects[0]?.id || null;
  const selectedProject = selectedProjectId ? projects.find((p) => p.id === selectedProjectId) : null;
  const searchQuery = search.trim().toLowerCase();

  const visibleSectionIds = useMemo(() => {
    if (!searchQuery) return Object.keys(SECTION_DEFS);
    return Object.entries(SECTION_DEFS)
      .filter(([, meta]) => `${meta.label} ${meta.description} ${meta.keywords}`.toLowerCase().includes(searchQuery))
      .map(([id]) => id);
  }, [searchQuery]);

  const activeSection = visibleSectionIds.includes(settingsActiveSection)
    ? settingsActiveSection
    : visibleSectionIds[0] || "general";

  const projectOptions = projects.map((p) => ({ value: p.id, label: p.name || "Untitled Project" }));

  useEffect(() => {
    if (selectedProjectId && settingsProjectId !== selectedProjectId) setSettingsProject(selectedProjectId);
  }, [selectedProjectId, settingsProjectId, setSettingsProject]);

  useEffect(() => {
    if (!visibleSectionIds.includes(settingsActiveSection) && visibleSectionIds[0]) {
      setSettingsActiveSection(visibleSectionIds[0]);
    }
  }, [visibleSectionIds, settingsActiveSection, setSettingsActiveSection]);

  useEffect(() => {
    if (selectedProjectId && !projects.find((p) => p.id === selectedProjectId)) {
      setSettingsProject(activeProjectId || projects[0]?.id || null);
    }
  }, [projects, selectedProjectId, activeProjectId, setSettingsProject]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SETTINGS_SIDEBAR_WIDTH_KEY, String(sidebarWidth));
    }
  }, [sidebarWidth]);

  useEffect(() => {
    if (!isResizingSidebar) return;

    function handleMouseMove(event) {
      const containerRect = projectLayoutRef.current?.getBoundingClientRect();
      if (!containerRect) return;

      const nextWidth = event.clientX - containerRect.left;
      setSidebarWidth(
        Math.min(
          SETTINGS_SIDEBAR_MAX_WIDTH,
          Math.max(SETTINGS_SIDEBAR_MIN_WIDTH, nextWidth)
        )
      );
    }

    function handleMouseUp() {
      setIsResizingSidebar(false);
    }

    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizingSidebar]);

  function ensureCtx(projectId, action) {
    if (!projectId) return;
    if (projectId !== activeProjectId) switchProject(projectId);
    action();
  }

  function renderSection(sectionId, project) {
    const wf = {
      onAddWorkflow: () => ensureCtx(project.id, () => addWorkflow()),
      onActivateWorkflow: (id) => ensureCtx(project.id, () => setActiveWorkflow(id)),
      onDuplicateWorkflow: (id) => ensureCtx(project.id, () => duplicateWorkflow(id)),
      onDeleteWorkflow: (id) => ensureCtx(project.id, () => removeWorkflow(id)),
      onRenameWorkflow: (id, name) => ensureCtx(project.id, () => renameWorkflow(id, name)),
    };
    switch (sectionId) {
      case "general":
        return <GeneralSection project={project} updateProjectMeta={updateProjectMeta} updateProjectSettings={updateProjectSettings} />;
      case "workflows":
        return <WorkflowsSection project={project} updateProjectSettings={updateProjectSettings} {...wf} />;
      case "models":
        return (
          <ModelsSection
            project={project}
            updateProjectSettings={updateProjectSettings}
            refreshKey={refreshKey}
            onAddProvider={() => setSubPage({ type: "custom-provider-form", editProvider: null })}
            onEditProvider={(provider) => setSubPage({ type: "custom-provider-form", editProvider: provider })}
          />
        );
      case "execution":
        return <ExecutionSection project={project} updateProjectSettings={updateProjectSettings} />;
      case "outputs":
        return <OutputsSection project={project} updateProjectSettings={updateProjectSettings} />;
      case "safety":
        return <SafetySection project={project} updateProjectSettings={updateProjectSettings} />;
      case "appearance":
        return <AppearanceSection project={project} updateProjectSettings={updateProjectSettings} />;
      case "shortcuts":
        return <ShortcutsSection />;
      case "advanced":
        return <AdvancedSection project={project} />;
      case "danger":
        return (
          <DangerSection
            project={project}
            onResetWorkflow={() => ensureCtx(project.id, () => resetWorkflow())}
            onDeleteProject={(id) => { deleteProject(id); closeSettings(); }}
          />
        );
      default:
        return <GeneralSection project={project} updateProjectMeta={updateProjectMeta} updateProjectSettings={updateProjectSettings} />;
    }
  }

  function renderContent(project) {
    // Custom provider sub-page
    if (subPage?.type === "custom-provider-form") {
      return (
        <>
          <SectionHeading
            title={subPage.editProvider ? "Edit Custom Provider" : "Add Custom Provider"}
            subtitle="Configure a custom OpenAI-compatible or local provider for this project."
          />
          <button
            onClick={() => setSubPage(null)}
            className="mb-4 flex items-center gap-1 text-[12px] text-primary hover:underline"
          >
            ← Back to Models &amp; Providers
          </button>
          <CustomProviderPage
            projectId={project.id}
            editProvider={subPage.editProvider}
            onCancel={() => setSubPage(null)}
            onSaved={() => { setSubPage(null); setRefreshKey((k) => k + 1); }}
          />
        </>
      );
    }

    // Search results
    if (searchQuery) {
      if (!visibleSectionIds.length) {
        return (
          <div className="py-12 text-center">
            <p className="text-[14px] font-normal text-ink">No results for "{searchQuery}"</p>
            <p className="mt-1 text-[12px] text-body">Try: workflow, provider, execution, output, shortcuts, danger</p>
          </div>
        );
      }
      return visibleSectionIds.map((id, i) => (
        <div key={id} className={i === 0 ? "" : "mt-8 border-t border-hairline pt-6"}>
          {renderSection(id, project)}
        </div>
      ));
    }

    // Normal navigation
    return renderSection(activeSection, project);
  }

  // Header bar — VS Code style: full-width flat search, underline scope tabs
  const header = (
    <div className="bg-panel" style={{ borderBottom: "1px solid rgb(var(--color-hairline-soft))" }}>
      <div className="flex items-center gap-0">
        <div className="relative flex-1">
          <Search size={12} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            className="h-[35px] w-full border-0 bg-panel pl-9 pr-3 text-[13px] text-ink placeholder-muted focus:outline-none focus:ring-0"
            placeholder="Search settings"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {onClose && (
          <button
            onClick={onClose}
            title="Close settings"
            className="flex h-[35px] w-[35px] shrink-0 items-center justify-center text-body hover:bg-canvasSoft hover:text-ink transition"
          >
            <X size={14} />
          </button>
        )}
      </div>
      <div style={{ borderTop: "1px solid rgb(var(--color-hairline-soft))" }}>
        <ScopeTabs activeScope={activeScope} onScopeChange={(s) => { setActiveScope(s); setSubPage(null); }} project={selectedProject} />
      </div>
    </div>
  );

  // Account scope
  if (activeScope === "account") {
    return (
      <div className="flex h-full min-w-0 flex-col bg-canvas">
        {header}
        <div className="slim-scroll min-h-0 flex-1 overflow-auto bg-canvas">
          <div className="mx-auto max-w-[740px] px-6 py-4">
            <AccountSection refreshKey={refreshKey} />
          </div>
        </div>
      </div>
    );
  }

  // Project scope
  return (
    <div className="flex h-full min-w-0 flex-col bg-canvas">
      {header}
      <div ref={projectLayoutRef} className="flex min-h-0 flex-1 overflow-hidden">
        <Sidebar
          activeSection={activeSection}
          onChange={(id) => { setSettingsActiveSection(id); setSubPage(null); }}
          visibleSectionIds={visibleSectionIds}
          width={sidebarWidth}
        />
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize settings sidebar"
          onMouseDown={(event) => {
            event.preventDefault();
            setIsResizingSidebar(true);
          }}
          className={`group relative w-[6px] shrink-0 cursor-col-resize bg-transparent transition ${
            isResizingSidebar ? "bg-primary/10" : ""
          }`}
        >
          <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-transparent transition group-hover:bg-primary/30" />
        </div>
        <div className="slim-scroll min-w-0 flex-1 overflow-auto bg-canvas">
          {!selectedProject ? (
            <EmptyState onCreateProject={createProject} />
          ) : (
            <div className="mx-auto max-w-[740px] px-6 py-4">
              <ProjectPickerBar
                project={selectedProject}
                projectOptions={projectOptions}
                onProjectChange={(id) => { setSettingsProject(id); setSubPage(null); }}
                isActiveProject={selectedProject.id === activeProjectId}
                onOpenProject={switchProject}
              />
              {renderContent(selectedProject)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
