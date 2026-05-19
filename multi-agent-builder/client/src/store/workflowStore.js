import { create } from "zustand";
import { addEdge, applyEdgeChanges, applyNodeChanges } from "@xyflow/react";
import {
  createAgentNode,
  createToolNode,
  defaultWorkflow,
  emptyWorkflow,
  personResearchWorkflow,
  startupPitchWorkflow,
  DEFAULT_PLAN_CONSTRAINTS,
} from "../utils/graphUtils.js";
import { makeId } from "../utils/idUtils.js";
import { runWorkflowStreaming } from "../api/workflowApi.js";
import { fetchProjects, upsertProject, removeProject } from "../api/projectApi.js";
import {
  applyExecutionSettingsToWorkflow,
  applyNodeDefaultsToWorkflow,
  normalizeProjectRecord,
  normalizeProjectSettings,
  projectExecutionDefaults,
} from "../utils/projectSettings.js";
import { currentUserKey } from "../utils/authHeaders.js";

// Strip ":latest" from model names so the server resolver can find the right tag
function fixModelTag(model) {
  if (!model) return model;
  return model.endsWith(":latest") ? model.slice(0, -7) : model;
}

function fixWorkflowModels(wf) {
  if (!wf) return wf;
  return { ...wf, nodes: (wf.nodes || []).map((n) => ({ ...n, model: fixModelTag(n.model) })) };
}

// T1: Migrate old format { workflow: {...} } → new format { workflows: [...], activeWorkflowId }
// Runs before fixWorkflowModels so we never process undefined.
function migrateProject(p) {
  if (!p.workflows) {
    const wf = fixWorkflowModels(p.workflow) || defaultWorkflow();
    const { workflow: _dropped, ...rest } = p;
    return normalizeProjectRecord({ ...rest, workflows: [wf], activeWorkflowId: wf.id });
  }
  return normalizeProjectRecord({ ...p, workflows: p.workflows.map(fixWorkflowModels) });
}

function loadProjectsFromStorage() {
  if (typeof window === "undefined") return [];
  try {
    const projects = JSON.parse(localStorage.getItem("builder-projects") || "[]");
    return projects.map(migrateProject);
  } catch {
    return [];
  }
}

function saveProjectsToStorage(projects) {
  if (typeof window !== "undefined") {
    localStorage.setItem("builder-projects", JSON.stringify(projects));
  }
}

function makeNextIndexedName(items, prefix) {
  const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`^${escapedPrefix} \\[(\\d+)\\]$`);
  const hasBaseName = items.some((item) => item?.name === prefix);
  const maxIndexedSuffix = items.reduce((highest, item) => {
    const match = item?.name?.match(pattern);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);

  if (!hasBaseName && maxIndexedSuffix === 0) {
    return prefix;
  }

  return `${prefix} [${maxIndexedSuffix + 1}]`;
}

function makeUntitledProjectName(projects) {
  return makeNextIndexedName(projects, "Untitled Project");
}

function makeUntitledWorkflowName(workflows, prefix = "Untitled Workflow") {
  return makeNextIndexedName(workflows, prefix);
}

function projectStarterWorkflowName(project) {
  return project?.settings?.general?.starterWorkflowName?.trim() || "Untitled Workflow";
}

function applyProjectDefaultsToNewNode(node, project, workflow) {
  const settings = project?.settings;
  if (!settings) return node;

  const next = { ...node };
  const style = settings.general?.nodeNamingStyle || "standard";
  const agentCount = (workflow?.nodes || []).filter((entry) => entry.type === "agent").length + (node.type === "agent" ? 1 : 0);

  if (style === "compact") {
    if (node.type === "user_input") next.name = "Input";
    if (node.type === "orchestrator") next.name = "Orchestrator";
    if (node.type === "agent") next.name = `Agent ${agentCount}`;
    if (node.type === "output") next.name = "Output";
  } else if (style === "role_based") {
    if (node.type === "user_input") next.name = "User Request";
    if (node.type === "orchestrator") next.name = "Lead Orchestrator";
    if (node.type === "agent") next.name = `Specialist ${agentCount}`;
    if (node.type === "output") next.name = "Deliverable";
  }

  if (node.type === "agent" || node.type === "orchestrator") {
    next.provider = settings.models?.defaultProvider || next.provider;
    next.model = settings.models?.defaultModel || next.model;
    next.outputFormat = settings.artifacts?.outputFormat || next.outputFormat;
  }

  if (node.type === "output") {
    next.outputFormat = settings.artifacts?.outputFormat || next.outputFormat;
  }

  return next;
}

function clearActiveProjectStorage() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("builder-active-project-id");
  }
}

const WORKFLOW_HISTORY_LIMIT = 80;

function pushWorkflowHistory(state) {
  const current = state.workflow;
  if (!current) return state.workflowHistoryPast || [];
  const past = state.workflowHistoryPast || [];
  if (past[past.length - 1] === current) return past;
  return [...past.slice(-(WORKFLOW_HISTORY_LIMIT - 1)), current];
}

function withWorkflowHistory(state, workflow, extra = {}) {
  return {
    workflow,
    workflowHistoryPast: pushWorkflowHistory(state),
    workflowHistoryFuture: [],
    ...extra,
  };
}

export const useWorkflowStore = create((set, get) => ({
  workflow: fixWorkflowModels(defaultWorkflow()),
  activeWorkflowId: null, // tracks which workflow within the active project is active
  workflowHistoryPast: [],
  workflowHistoryFuture: [],
  selectedNodeId: "orchestrator",
  mermaidText: "",
  savedWorkflows: [],
  statusMessage: "",
  focusNodeId: "orchestrator",
  focusVersion: 0,
  layoutPreset: "canvas_focus",
  theme: "light",
  activePanel: "explorer",
  terminalOpen: true,
  workflowTabOpen: true,
  activeWorkspaceTab: "workflow",
  settingsTabOpen: false,
  settingsActiveSection: "general", // last-visited section — restored on reopen
  settingsProjectId: null,          // which project is being viewed in per-project config
  docsTabOpen: false,
  canvasZoom: 1,
  canvasZoomRequest: null,  // "in" | "out" | "fit" | null
  canvasMode: "cursor",     // "cursor" | "pan" | "select"
  canvasSelectedIds: [],    // multi-selected node IDs (kept in sync from FlowCanvas)
  selectedEdgeId: null,     // edge highlighted on canvas or via ConnectionsPanel

  // Special workspace tabs
  codeTabOpen: false,
  agentTabIds: [],          // agent node IDs open as detail tabs

  // Current authenticated user — set from NextAuth session in App.jsx
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),

  // Architecture selection — shown as a modal when a new project is created
  needsArchitectureSelection: false,
  setArchitecture: (target) => {
    set((s) => {
      const updatedWorkflow = { ...s.workflow, builderTarget: target, updatedAt: new Date().toISOString() };
      const activeProject = s.projects.find((p) => p.id === s.activeProjectId);
      if (activeProject) {
        const nextSettings = normalizeProjectSettings({
          ...activeProject.settings,
          execution: { ...(activeProject.settings?.execution || {}), builderTarget: target },
        }, updatedWorkflow);
        const updatedWorkflows = (activeProject.workflows || []).map((wf) =>
          wf.id === s.activeWorkflowId ? updatedWorkflow : wf
        );
        const updatedProject = {
          ...activeProject,
          workflows: updatedWorkflows,
          settings: nextSettings,
          updatedAt: new Date().toISOString(),
        };
        const projects = s.projects.map((p) => (p.id === s.activeProjectId ? updatedProject : p));
        saveProjectsToStorage(projects);
        upsertProject(updatedProject, currentUserKey(s.currentUser)).catch(() => {});
        return { needsArchitectureSelection: false, workflow: updatedWorkflow, projects };
      }
      return { needsArchitectureSelection: false, workflow: updatedWorkflow };
    });
  },
  cancelArchitectureSelection: () => set({ needsArchitectureSelection: false }),

  // Runtime task — kept for backwards compat; UI uses user_input node prompt
  runtimeTask: "",
  setRuntimeTask: (runtimeTask) => set({ runtimeTask }),

  // Per-project run state: { [projectId]: { running, trace, executionError, bootstrapPhase, executionState } }
  runs: {},
  activeTerminalProjectId: null,

  setActiveTerminalProject: (projectId) => set({ activeTerminalProjectId: projectId }),

  startRun: async () => {
    const { workflow, activeProjectId, setStatusMessage, runs, currentUser } = get();
    if (!activeProjectId) return;
    if (runs[activeProjectId]?.running) return;

    const projectId = activeProjectId;
    const promptNode = workflow.nodes.find((n) => n.type === "user_input");
    const userTask = get().runtimeTask || promptNode?.prompt || "";

    // Strip tool nodes — merge their config into connected agents, then remove them.
    // Tool nodes are a canvas editing convenience; the backend expects plain agent nodes.
    const toolNodes = workflow.nodes.filter((n) => n.type === "tool");
    const toolEdges = workflow.edges.filter((e) => e.type === "tool");
    const agentToolMap = {};
    toolEdges.forEach((edge) => {
      const toolNode = toolNodes.find((n) => n.id === edge.target);
      if (!toolNode) return;
      (agentToolMap[edge.source] = agentToolMap[edge.source] || []).push(toolNode);
    });

    const runnableWorkflow = {
      ...workflow,
      edges: workflow.edges.filter((e) => e.type !== "tool"),
      nodes: workflow.nodes
        .filter((n) => n.type !== "tool")
        .map((agent) => {
          const attached = agentToolMap[agent.id] || [];
          if (!attached.length) return agent;
          const extraBuiltins = attached
            .filter((t) => t.toolType === "builtin" && t.builtinId)
            .map((t) => ({ id: t.builtinId, name: t.name, description: t.description }));
          const extraCustom = attached
            .filter((t) => t.toolType !== "builtin")
            .map((t) => ({
              id: t.id, name: t.name, description: t.description, type: t.toolType,
              ...(t.toolType === "http"    ? { endpoint: t.endpoint, method: t.method, authType: t.authType, authValue: t.authValue } : {}),
              ...(t.toolType === "mcp"    ? { mcpServer: t.mcpServer, mcpToolName: t.mcpToolName } : {}),
              ...(t.toolType === "custom" ? { code: t.customCode } : {})
            }));
          return {
            ...agent,
            builtinTools: [...(agent.builtinTools || []), ...extraBuiltins],
            customTools:  [...(agent.customTools  || []), ...extraCustom]
          };
        })
    };

    const patchRun = (updater) =>
      set((s) => ({
        runs: {
          ...s.runs,
          [projectId]: typeof updater === "function"
            ? updater(s.runs[projectId] || {})
            : { ...(s.runs[projectId] || {}), ...updater }
        }
      }));

    patchRun({ running: true, executionError: "", bootstrapPhase: null, executionState: {},
      trace: { status: "running", steps: [], finalOutput: "", errors: [] } });
    set({ activeTerminalProjectId: projectId });

    try {
      await runWorkflowStreaming(runnableWorkflow, userTask, {
        projectId,
        userId: currentUserKey(currentUser),
        onEvent(event) {
          if (event.type === "bootstrap_start") {
            patchRun({ bootstrapPhase: { status: "installing", packages: event.packages || [], installedCount: 0, totalCount: (event.packages || []).length, error: null } });
          } else if (event.type === "bootstrap_progress") {
            patchRun((r) => ({ ...r, bootstrapPhase: r.bootstrapPhase ? { ...r.bootstrapPhase, installedCount: (r.bootstrapPhase.installedCount || 0) + 1, currentPackage: event.package } : r.bootstrapPhase }));
          } else if (event.type === "bootstrap_complete") {
            patchRun((r) => ({ ...r, bootstrapPhase: r.bootstrapPhase ? { ...r.bootstrapPhase, status: "ready" } : r.bootstrapPhase }));
          } else if (event.type === "bootstrap_failed") {
            patchRun((r) => ({ ...r, bootstrapPhase: r.bootstrapPhase ? { ...r.bootstrapPhase, status: "failed", error: event.error } : r.bootstrapPhase, executionError: event.error, running: false }));
          } else if (event.type === "step_start") {
            patchRun((r) => ({
              ...r,
              executionState: { ...r.executionState, [event.agentId]: "running" },
              trace: { ...r.trace, steps: [...r.trace.steps, { agentId: event.agentId, agentName: event.agentName, input: event.input || "", output: "", toolCalls: [], startedAt: new Date().toISOString(), completedAt: "", status: "running" }] }
            }));
          } else if (event.type === "step_complete") {
            patchRun((r) => ({
              ...r,
              executionState: { ...r.executionState, [event.agentId]: "completed" },
              trace: { ...r.trace, steps: r.trace.steps.map((step) => step.agentId === event.agentId && step.status === "running" ? { ...step, output: event.output, status: "completed", completedAt: new Date().toISOString() } : step) }
            }));
          } else if (event.type === "step_failed") {
            patchRun((r) => ({
              ...r,
              executionState: { ...r.executionState, [event.agentId]: "failed" },
              trace: { ...r.trace, steps: r.trace.steps.map((step) => step.agentId === event.agentId && step.status === "running" ? { ...step, error: event.error, status: "failed", completedAt: new Date().toISOString() } : step) }
            }));
          } else if (event.type === "tool_call_start") {
            patchRun((r) => ({ ...r, trace: { ...r.trace, steps: r.trace.steps.map((step) => step.agentId === event.agentId ? { ...step, toolCalls: [...(step.toolCalls || []), { id: event.toolCallId, toolName: event.toolName, input: event.input, status: "running", startedAt: new Date().toISOString() }] } : step) } }));
          } else if (event.type === "tool_call_complete") {
            patchRun((r) => ({ ...r, trace: { ...r.trace, steps: r.trace.steps.map((step) => step.agentId === event.agentId ? { ...step, toolCalls: (step.toolCalls || []).map((tc) => tc.id === event.toolCallId ? { ...tc, output: event.output, status: "completed", completedAt: new Date().toISOString() } : tc) } : step) } }));
          } else if (event.type === "tool_call_failed") {
            patchRun((r) => ({ ...r, trace: { ...r.trace, steps: r.trace.steps.map((step) => step.agentId === event.agentId ? { ...step, toolCalls: (step.toolCalls || []).map((tc) => tc.id === event.toolCallId ? { ...tc, error: event.error, status: "failed", completedAt: new Date().toISOString() } : tc) } : step) } }));
          } else if (event.type === "workflow_complete") {
            patchRun((r) => ({ ...r, trace: { ...r.trace, status: "completed", finalOutput: event.finalOutput } }));
            setStatusMessage("Workflow completed.");
          } else if (event.type === "workflow_error") {
            setStatusMessage(event.message);
            patchRun((r) => ({ ...r, executionError: event.message, trace: event.trace ? { ...event.trace, status: "failed" } : { ...r.trace, status: "failed", errors: [...(r.trace.errors || []), event.message] } }));
          }
        }
      });
    } catch (err) {
      patchRun((r) => ({ ...r, executionError: err.message, trace: r.trace ? { ...r.trace, status: "failed", errors: [...(r.trace.errors || []), err.message] } : r.trace }));
      setStatusMessage(err.message);
    } finally {
      patchRun({ running: false });
    }
  },

  clearTrace: (projectId) =>
    set((s) => {
      const pid = projectId || s.activeProjectId;
      const { [pid]: _removed, ...rest } = s.runs;
      const activeTerminal = s.activeTerminalProjectId === pid
        ? Object.keys(rest)[0] || null
        : s.activeTerminalProjectId;
      return { runs: rest, activeTerminalProjectId: activeTerminal };
    }),

  // Execution state helpers (per active project — kept for external callers)
  setNodeExecutionState: (nodeId, status) =>
    set((s) => ({
      runs: { ...s.runs, [s.activeProjectId]: { ...(s.runs[s.activeProjectId] || {}), executionState: { ...((s.runs[s.activeProjectId] || {}).executionState || {}), [nodeId]: status } } }
    })),
  clearExecutionState: () =>
    set((s) => ({
      runs: { ...s.runs, [s.activeProjectId]: { ...(s.runs[s.activeProjectId] || {}), executionState: {} } }
    })),

  // Project spaces — initialized empty to avoid SSR/client hydration mismatch.
  // hydrateFromStorage() is called in App.jsx useEffect after mount.
  projects: [],
  activeProjectId: null,
  openTabIds: [], // ordered list of project IDs currently open as tabs

  hydrateFromStorage: async (userId) => {
    let projects;
    let fromApi = false;
    try {
      // Always fetch fresh from server first. Clear stale localStorage before
      // the call so stale cache can never shadow updated server data.
      if (typeof window !== "undefined") {
        localStorage.removeItem("builder-projects");
      }
      projects = (await fetchProjects(userId)).map(migrateProject);
      fromApi = true;
    } catch {
      projects = loadProjectsFromStorage(); // fall back to localStorage when server is unreachable
    }

    if (fromApi) {
      // When the API is reachable, Postgres is the source of truth. This must
      // include an empty project list after a deliberate delete-all operation.
      saveProjectsToStorage(projects);
    }

    if (!fromApi && projects.length === 0) {
      projects = [startupPitchWorkflow(), personResearchWorkflow()].map((wf, index) => ({
        id: index === 0 ? "seed_startup_pitch" : "seed_person_research",
        name: wf.name,
        description: wf.description,
        workflows: [wf],
        activeWorkflowId: wf.id,
        createdAt: wf.createdAt,
        updatedAt: wf.updatedAt,
      })).map(normalizeProjectRecord);
      saveProjectsToStorage(projects);
    }

    // Restore last active project from localStorage
    const lastActiveId = typeof window !== "undefined"
      ? localStorage.getItem("builder-active-project-id")
      : null;
    const toActivate = projects.find((p) => p.id === lastActiveId) || projects[0];
    if (toActivate) {
      const activeWfId = toActivate.activeWorkflowId || toActivate.workflows?.[0]?.id;
      const activeWf = toActivate.workflows?.find((w) => w.id === activeWfId) || toActivate.workflows?.[0];
      set((state) => {
        // Preserve the current tab if the user is on a special tab (settings, docs, code).
        // Only default to "workflow" on the very first load (when activeWorkspaceTab is null).
        const SPECIAL_TABS = ["settings", "docs", "code"];
        const preserveTab = state.activeWorkspaceTab && SPECIAL_TABS.includes(state.activeWorkspaceTab);
        return {
          projects,
          activeProjectId: toActivate.id,
          activeWorkflowId: activeWf?.id || null,
          openTabIds: [toActivate.id],
          workflow: activeWf || defaultWorkflow(),
          selectedNodeId: activeWf?.nodes?.[0]?.id || "",
          focusNodeId:    activeWf?.nodes?.[0]?.id || "",
          workflowHistoryPast: [],
          workflowHistoryFuture: [],
          workflowTabOpen: true,
          activeWorkspaceTab: preserveTab ? state.activeWorkspaceTab : "workflow",
          focusVersion: state.focusVersion + 1,
        };
      });
    } else {
      clearActiveProjectStorage();
      set((state) => ({
        projects: [],
        activeProjectId: null,
        activeWorkflowId: null,
        openTabIds: [],
        workflow: emptyWorkflow(),
        selectedNodeId: "",
        focusNodeId: "",
        workflowHistoryPast: [],
        workflowHistoryFuture: [],
        workflowTabOpen: false,
        activeWorkspaceTab: state.settingsTabOpen ? "settings" : null,
        agentTabIds: [],
        focusVersion: state.focusVersion + 1,
      }));
    }
  },

  setStatusMessage: (statusMessage) => set({ statusMessage }),
  setLayoutPreset: (layoutPreset) => set({ layoutPreset }),
  setTheme: (theme) => set({ theme }),
  setActivePanel: (activePanel) => set({ activePanel }),
  toggleActivePanel: (panel) =>
    set((state) => ({ activePanel: state.activePanel === panel ? null : panel })),
  setTerminalOpen: (terminalOpen) => set({ terminalOpen }),
  toggleTerminalOpen: () => set((state) => ({ terminalOpen: !state.terminalOpen })),
  setCanvasZoom: (canvasZoom) => set({ canvasZoom }),
  requestCanvasZoom: (type) => set({ canvasZoomRequest: type }),
  clearCanvasZoomRequest: () => set({ canvasZoomRequest: null }),
  setCanvasMode: (canvasMode) => set({ canvasMode }),
  setCanvasSelectedIds: (ids) => set({ canvasSelectedIds: ids }),
  selectEdge:       (edgeId) => set({ selectedEdgeId: edgeId }),
  clearSelectedEdge: ()      => set({ selectedEdgeId: null }),
  recordWorkflowHistory: () =>
    set((state) => ({
      workflowHistoryPast: pushWorkflowHistory(state),
      workflowHistoryFuture: [],
    })),
  undoWorkflow: () =>
    set((state) => {
      const past = state.workflowHistoryPast || [];
      const previous = past[past.length - 1];
      if (!previous) return { statusMessage: "Nothing to undo." };
      const previousNodeIds = new Set((previous.nodes || []).map((node) => node.id));
      const previousEdgeIds = new Set((previous.edges || []).map((edge) => edge.id));
      return {
        workflow: previous,
        workflowHistoryPast: past.slice(0, -1),
        workflowHistoryFuture: [state.workflow, ...(state.workflowHistoryFuture || [])].slice(0, WORKFLOW_HISTORY_LIMIT),
        selectedNodeId: previousNodeIds.has(state.selectedNodeId) ? state.selectedNodeId : previous.nodes?.[0]?.id || "",
        focusNodeId: previousNodeIds.has(state.focusNodeId) ? state.focusNodeId : previous.nodes?.[0]?.id || "",
        selectedEdgeId: previousEdgeIds.has(state.selectedEdgeId) ? state.selectedEdgeId : null,
        canvasSelectedIds: (state.canvasSelectedIds || []).filter((id) => previousNodeIds.has(id)),
        statusMessage: "Undid last canvas change.",
      };
    }),

  openCodeTab: () => set({ codeTabOpen: true, activeWorkspaceTab: "code" }),
  closeCodeTab: () =>
    set((s) => ({ codeTabOpen: false, activeWorkspaceTab: s.workflowTabOpen ? "workflow" : null })),

  openAgentTab: (agentId) =>
    set((s) => ({
      agentTabIds: s.agentTabIds.includes(agentId) ? s.agentTabIds : [...s.agentTabIds, agentId],
      activeWorkspaceTab: `agent:${agentId}`,
    })),
  closeAgentTab: (agentId) =>
    set((s) => {
      const remaining = s.agentTabIds.filter((id) => id !== agentId);
      const wasActive = s.activeWorkspaceTab === `agent:${agentId}`;
      return {
        agentTabIds: remaining,
        activeWorkspaceTab: wasActive
          ? (s.workflowTabOpen ? "workflow" : remaining.length ? `agent:${remaining[remaining.length - 1]}` : null)
          : s.activeWorkspaceTab,
      };
    }),
  openSettings: () =>
    set({ settingsTabOpen: true, activeWorkspaceTab: "settings", selectedNodeId: "" }),
  closeSettings: () =>
    set((s) => ({
      settingsTabOpen: false,
      activeWorkspaceTab: s.workflowTabOpen ? "workflow" : null,
    })),
  setSettingsProject: (id) => set({ settingsProjectId: id }),
  setSettingsActiveSection: (section) => set({ settingsActiveSection: section }),
  openDocsTab: () => set({ docsTabOpen: true, activeWorkspaceTab: "docs" }),
  closeDocsTab: () =>
    set((s) => ({ docsTabOpen: false, activeWorkspaceTab: s.workflowTabOpen ? "workflow" : null })),
  openWorkflowTab: () => set({ workflowTabOpen: true, activeWorkspaceTab: "workflow" }),
  closeWorkflowTab: () =>
    set((state) => ({
      workflowTabOpen: false,
      activeWorkspaceTab: state.activeWorkspaceTab === "workflow"
        ? state.settingsTabOpen ? "settings" : null
        : state.activeWorkspaceTab,
    })),
  closeSettingsTab: () =>
    set((state) => ({
      settingsTabOpen: false,
      activeWorkspaceTab: state.activeWorkspaceTab === "settings"
        ? state.workflowTabOpen ? "workflow" : null
        : state.activeWorkspaceTab,
    })),
  selectNode: (id) =>
    set((s) => {
      // Never yank the user away from settings/docs/code just because a node was selected.
      const STICKY_TABS = ["settings", "docs", "code"];
      const onStickyTab = s.activeWorkspaceTab && STICKY_TABS.includes(s.activeWorkspaceTab);
      return {
        selectedNodeId: id,
        workflowTabOpen: id ? true : s.workflowTabOpen,
        activeWorkspaceTab: (!id || onStickyTab)
          ? s.activeWorkspaceTab
          : s.activeWorkspaceTab?.startsWith("agent:") ? s.activeWorkspaceTab : "workflow",
      };
    }),
  updateWorkflow: (updates) =>
    set((state) => {
      const newWorkflow = { ...state.workflow, ...updates, updatedAt: new Date().toISOString() };
      const { activeProjectId, activeWorkflowId, projects } = state;
      if (activeProjectId && (updates.name !== undefined || updates.description !== undefined)) {
        const newProjects = projects.map((p) => {
          if (p.id !== activeProjectId) return p;
          const updatedWorkflows = (p.workflows || []).map((wf) =>
            wf.id === activeWorkflowId ? newWorkflow : wf
          );
          return { ...p, workflows: updatedWorkflows, updatedAt: newWorkflow.updatedAt };
        });
        saveProjectsToStorage(newProjects);
        return { workflow: newWorkflow, projects: newProjects };
      }
      return { workflow: newWorkflow };
    }),
  focusNode: (id = get().selectedNodeId) =>
    set((state) => {
      // Never yank the user away from settings/docs/code when a node receives focus.
      const STICKY_TABS = ["settings", "docs", "code"];
      const onStickyTab = state.activeWorkspaceTab && STICKY_TABS.includes(state.activeWorkspaceTab);
      return {
        selectedNodeId: id,
        focusNodeId: id,
        focusVersion: state.focusVersion + 1,
        workflowTabOpen: id ? true : state.workflowTabOpen,
        activeWorkspaceTab: (id && !onStickyTab) ? "workflow" : state.activeWorkspaceTab,
      };
    }),

  // Project management
  createProjectFromWorkflow: (workflow) => {
    const wf = { ...workflow, id: makeId("wf") };
    const project = normalizeProjectRecord({
      id: makeId("proj"),
      name: wf.name || "Imported Project",
      description: wf.description || "",
      workflows: [wf],
      activeWorkflowId: wf.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    const projects = [...get().projects, project];
    saveProjectsToStorage(projects);
    upsertProject(project, currentUserKey(get().currentUser)).catch(() => {});
    set((state) => ({
      projects,
      activeProjectId: project.id,
      activeWorkflowId: wf.id,
      openTabIds: state.openTabIds.includes(project.id) ? state.openTabIds : [...state.openTabIds, project.id],
      workflow: wf,
      selectedNodeId: wf.nodes[0]?.id || "",
      focusNodeId: wf.nodes[0]?.id || "",
      workflowHistoryPast: [],
      workflowHistoryFuture: [],
      workflowTabOpen: true,
      activeWorkspaceTab: "workflow",
      focusVersion: state.focusVersion + 1,
      statusMessage: `"${project.name}" loaded as project.`
    }));
  },

  createProject: (name = "New Project") => {
    const existingProjects = get().projects;
    const projectName = !name || name === "New Project"
      ? makeUntitledProjectName(existingProjects)
      : name;
    const workflowName = makeUntitledWorkflowName([]);
    const wf = { ...emptyWorkflow(), name: workflowName, id: makeId("wf"), builderTarget: "langgraph" };
    const project = normalizeProjectRecord({
      id: makeId("proj"),
      name: projectName,
      description: "",
      workflows: [wf],
      activeWorkflowId: wf.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    const projects = [...existingProjects, project];
    saveProjectsToStorage(projects);
    upsertProject(project, currentUserKey(get().currentUser)).catch(() => {});
    if (typeof window !== "undefined") localStorage.setItem("builder-active-project-id", project.id);
    set((state) => ({
      projects,
      activeProjectId: project.id,
      activeWorkflowId: wf.id,
      openTabIds: state.openTabIds.includes(project.id) ? state.openTabIds : [...state.openTabIds, project.id],
      workflow: wf,
      selectedNodeId: wf.nodes[0]?.id || "",
      focusNodeId: wf.nodes[0]?.id || "",
      workflowHistoryPast: [],
      workflowHistoryFuture: [],
      workflowTabOpen: true,
      activeWorkspaceTab: "workflow",
      focusVersion: state.focusVersion + 1,
      needsArchitectureSelection: true,
      statusMessage: `Project "${projectName}" created.`
    }));
  },

  switchProject: (id) => {
    const project = get().projects.find((p) => p.id === id);
    if (!project) return;
    const activeWfId = project.activeWorkflowId || project.workflows?.[0]?.id;
    const activeWf = project.workflows?.find((w) => w.id === activeWfId) || project.workflows?.[0];
    if (typeof window !== "undefined") localStorage.setItem("builder-active-project-id", id);
    set((state) => ({
      activeProjectId: id,
      activeWorkflowId: activeWf?.id || null,
      workflow: activeWf || defaultWorkflow(),
      selectedNodeId: activeWf?.nodes?.[0]?.id || "",
      focusNodeId: activeWf?.nodes?.[0]?.id || "",
      workflowHistoryPast: [],
      workflowHistoryFuture: [],
      workflowTabOpen: true,
      activeWorkspaceTab: "workflow",
      agentTabIds: [],
      focusVersion: state.focusVersion + 1,
      statusMessage: `Switched to "${project.name}".`,
      openTabIds: state.openTabIds.includes(id) ? state.openTabIds : [...state.openTabIds, id],
    }));
  },

  closeTab: (id) => {
    const { openTabIds, activeProjectId } = get();
    const remaining = openTabIds.filter((tid) => tid !== id);
    if (id !== activeProjectId) {
      set({ openTabIds: remaining });
      return;
    }
    // Closing the active tab — switch to neighbour
    const idx = openTabIds.indexOf(id);
    const nextId = remaining[idx] ?? remaining[idx - 1] ?? null;
    if (nextId) {
      get().switchProject(nextId);
      set({ openTabIds: remaining });
    } else {
      set({ openTabIds: remaining, activeProjectId: null, activeWorkspaceTab: null });
    }
  },

  deleteProject: (id) => {
    const projects = get().projects.filter((p) => p.id !== id);
    saveProjectsToStorage(projects);
    removeProject(id, currentUserKey(get().currentUser)).catch(() => {});
    const isActive = get().activeProjectId === id;

    if (isActive && projects.length > 0) {
      // Auto-switch to first remaining project
      const next = projects[0];
      const activeWfId = next.activeWorkflowId || next.workflows?.[0]?.id;
      const activeWf = next.workflows?.find((w) => w.id === activeWfId) || next.workflows?.[0];
      if (typeof window !== "undefined") localStorage.setItem("builder-active-project-id", next.id);
      set((state) => ({
        projects,
        activeProjectId: next.id,
        activeWorkflowId: activeWf?.id || null,
        openTabIds: [...state.openTabIds.filter((tid) => tid !== id), next.id].filter((v, i, a) => a.indexOf(v) === i),
        workflow: activeWf || defaultWorkflow(),
        selectedNodeId: activeWf?.nodes?.[0]?.id || "",
        focusNodeId: activeWf?.nodes?.[0]?.id || "",
        workflowHistoryPast: [],
        workflowHistoryFuture: [],
        workflowTabOpen: true,
        activeWorkspaceTab: "workflow",
        agentTabIds: [],
        settingsProjectId: state.settingsProjectId === id ? null : state.settingsProjectId,
        focusVersion: state.focusVersion + 1,
        statusMessage: `Switched to "${next.name}".`,
      }));
    } else {
      set((state) => ({
        projects,
        activeProjectId: isActive ? null : state.activeProjectId,
        openTabIds: state.openTabIds.filter((tid) => tid !== id),
        settingsProjectId: state.settingsProjectId === id ? null : state.settingsProjectId,
        ...(isActive
          ? { activeWorkflowId: null, workflow: defaultWorkflow(), selectedNodeId: "", focusNodeId: "", workflowTabOpen: false, activeWorkspaceTab: null, focusVersion: state.focusVersion + 1 }
          : {})
      }));
    }
  },

  renameProject: (id, name) => {
    const projects = get().projects.map((p) => (p.id === id ? { ...p, name } : p));
    saveProjectsToStorage(projects);
    const updated = projects.find((p) => p.id === id);
    if (updated) upsertProject(updated, currentUserKey(get().currentUser)).catch(() => {});
    set({ projects });
  },

  updateProjectMeta: (id, updates) => {
    const projects = get().projects.map((p) => (
      p.id === id
        ? { ...p, ...updates, updatedAt: new Date().toISOString() }
        : p
    ));
    saveProjectsToStorage(projects);
    const updated = projects.find((p) => p.id === id);
    if (updated) upsertProject(updated, currentUserKey(get().currentUser)).catch(() => {});
    set({ projects, ...(id === get().activeProjectId ? { statusMessage: "Project settings updated." } : {}) });
  },

  updateProjectSettings: (id, updates) => {
    const { activeProjectId, activeWorkflowId, workflowHistoryPast, workflowHistoryFuture } = get();
    let nextActiveWorkflow = null;
    const projects = get().projects.map((p) => {
      if (p.id !== id) return p;
      const settings = normalizeProjectSettings({
        ...p.settings,
        ...updates,
        general: { ...(p.settings?.general || {}), ...(updates.general || {}) },
        models: { ...(p.settings?.models || {}), ...(updates.models || {}) },
        execution: { ...(p.settings?.execution || {}), ...(updates.execution || {}) },
        artifacts: { ...(p.settings?.artifacts || {}), ...(updates.artifacts || {}) },
        collaboration: { ...(p.settings?.collaboration || {}), ...(updates.collaboration || {}) },
        appearance: { ...(p.settings?.appearance || {}), ...(updates.appearance || {}) },
      }, p.workflows?.[0]);
      let workflows = p.workflows || [];

      if (updates.execution) {
        workflows = workflows.map((entry) => applyExecutionSettingsToWorkflow(entry, settings.execution));
      }
      if (updates.models || updates.artifacts) {
        workflows = workflows.map((entry) => applyNodeDefaultsToWorkflow(entry, settings));
      }

      if (id === activeProjectId) {
        nextActiveWorkflow = workflows.find((entry) => entry.id === activeWorkflowId) || p.workflows?.[0] || null;
      }

      return {
        ...p,
        settings,
        workflows,
        updatedAt: new Date().toISOString(),
      };
    });
    saveProjectsToStorage(projects);
    const updated = projects.find((p) => p.id === id);
    if (updated) upsertProject(updated, currentUserKey(get().currentUser)).catch(() => {});
    set({
      projects,
      ...(id === activeProjectId && nextActiveWorkflow
        ? {
            workflow: nextActiveWorkflow,
            workflowHistoryPast,
            workflowHistoryFuture,
          }
        : {}),
      ...(id === activeProjectId ? { statusMessage: "Project settings updated." } : {}),
    });
  },

  saveCurrentToProject: () => {
    const { workflow, activeProjectId, activeWorkflowId, projects } = get();
    if (!activeProjectId) {
      const project = normalizeProjectRecord({
        id: makeId("proj"),
        name: workflow.name,
        description: workflow.description || "",
        workflows: [{ ...workflow }],
        activeWorkflowId: workflow.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      const newProjects = [...projects, project];
      saveProjectsToStorage(newProjects);
      upsertProject(project, currentUserKey(get().currentUser)).catch(() => {});
      set((state) => ({ projects: newProjects, activeProjectId: project.id, activeWorkflowId: workflow.id, openTabIds: state.openTabIds.includes(project.id) ? state.openTabIds : [...state.openTabIds, project.id], statusMessage: "Saved as new project." }));
    } else {
      const existing = projects.find((p) => p.id === activeProjectId);
      const updatedWorkflows = (existing.workflows || []).map((wf) =>
        wf.id === activeWorkflowId ? { ...workflow } : wf
      );
      const updated = { ...existing, workflows: updatedWorkflows, updatedAt: new Date().toISOString() };
      const newProjects = projects.map((p) => (p.id === activeProjectId ? updated : p));
      saveProjectsToStorage(newProjects);
      upsertProject(updated, currentUserKey(get().currentUser)).catch(() => {});
      set((state) => ({
        projects: newProjects,
        statusMessage: state.statusMessage === "Project saved." ? "" : state.statusMessage
      }));
    }
  },

  addAgent: (type = "agent") => {
    const workflow = get().workflow;
    const project = get().projects.find((entry) => entry.id === get().activeProjectId);
    if (type === "orchestrator" && workflow.nodes.some((node) => node.type === "orchestrator")) {
      const orchestrator = workflow.nodes.find((node) => node.type === "orchestrator");
      set((state) => ({
        selectedNodeId: orchestrator.id,
        focusNodeId: orchestrator.id,
        workflowTabOpen: true,
        activeWorkspaceTab: "workflow",
        focusVersion: state.focusVersion + 1,
        statusMessage: "Existing orchestrator selected. Only one orchestrator is allowed."
      }));
      return;
    }
    if (type === "user_input" && workflow.nodes.some((node) => node.type === "user_input")) {
      const inputNode = workflow.nodes.find((node) => node.type === "user_input");
      set((state) => ({
        selectedNodeId: inputNode.id,
        focusNodeId: inputNode.id,
        workflowTabOpen: true,
        activeWorkspaceTab: "workflow",
        focusVersion: state.focusVersion + 1,
        statusMessage: "Existing user prompt selected. This builder uses one runtime input node."
      }));
      return;
    }
    const selectedNode = workflow.nodes.find((node) => node.id === get().selectedNodeId);
    const node = applyProjectDefaultsToNewNode(
      createAgentNode(type, workflow.nodes.length + 1, selectedNode),
      project,
      workflow
    );
    const shouldConnect = selectedNode && selectedNode.id !== node.id;
    const edge = shouldConnect ? { id: makeId("edge"), source: selectedNode.id, target: node.id } : null;

    set((state) => withWorkflowHistory(state, {
        ...workflow,
        nodes: [...workflow.nodes, node],
        edges: edge ? [...workflow.edges, edge] : workflow.edges,
        updatedAt: new Date().toISOString()
      }, {
      selectedNodeId: node.id,
      focusNodeId: node.id,
      workflowTabOpen: true,
      activeWorkspaceTab: "workflow",
      focusVersion: state.focusVersion + 1,
      statusMessage: `${node.name} added to the graph.`
    }));
  },

  addTool: (parentAgentId) => {
    const workflow = get().workflow;
    const parent   = workflow.nodes.find((n) => n.id === parentAgentId);
    const toolNode = createToolNode(parent);
    const edge     = { id: makeId("te"), source: parentAgentId, target: toolNode.id, type: "tool" };
    set((state) => withWorkflowHistory(state, {
        ...workflow,
        nodes: [...workflow.nodes, toolNode],
        edges: [...workflow.edges, edge],
        updatedAt: new Date().toISOString()
      }, {
      selectedNodeId:     toolNode.id,
      focusNodeId:        toolNode.id,
      workflowTabOpen:    true,
      activeWorkspaceTab: "workflow",
      focusVersion:       state.focusVersion + 1,
      statusMessage:      "Tool node added. Configure it in the right panel."
    }));
  },

  saveSelectedAgent: () => {
    const selectedNodeId = get().selectedNodeId;
    if (!selectedNodeId) {
      set({ statusMessage: "Select an agent before saving." });
      return;
    }
    set((state) => ({
      focusNodeId: selectedNodeId,
      focusVersion: state.focusVersion + 1,
      statusMessage: "Agent applied and highlighted on the canvas."
    }));
  },

  autoLayoutWorkflow: () => {
    const workflow = get().workflow;
    const orchestrator = workflow.nodes.find((n) => n.type === "orchestrator");
    const inputNode    = workflow.nodes.find((n) => n.type === "user_input");
    const outputNodes  = workflow.nodes.filter((n) => n.type === "output");
    const normalAgents = workflow.nodes.filter((n) => n.type === "agent");

    const NODE_H   = 154;
    const COL_GAP  = 300;
    const COLS_PER_LAYER = 2;

    const agentColumns = Math.ceil(normalAgents.length / COLS_PER_LAYER) || 1;
    const totalRows    = Math.max(COLS_PER_LAYER, normalAgents.length > 0 ? Math.ceil(normalAgents.length / agentColumns) : 1);
    const canvasH      = totalRows * NODE_H;
    const midY         = canvasH / 2 - NODE_H / 2;

    const colX = (col) => 60 + col * COL_GAP;

    const positioned = [
      ...(inputNode ? [{ ...inputNode, position: { x: colX(0), y: midY } }] : []),
      ...(orchestrator ? [{ ...orchestrator, position: { x: colX(1), y: midY } }] : []),
      ...normalAgents.map((node, i) => {
        const col = 2 + Math.floor(i / COLS_PER_LAYER);
        const row = i % COLS_PER_LAYER;
        const rowCount = Math.min(COLS_PER_LAYER, normalAgents.length - Math.floor(i / COLS_PER_LAYER) * COLS_PER_LAYER);
        const startY = (canvasH - rowCount * NODE_H) / 2;
        return { ...node, position: { x: colX(col), y: startY + row * NODE_H } };
      }),
      ...outputNodes.map((node, i) => ({
        ...node,
        position: { x: colX(2 + agentColumns), y: midY + i * NODE_H }
      }))
    ];

    const orderedIds = new Set(positioned.map((n) => n.id));
    const remaining  = workflow.nodes.filter((n) => !orderedIds.has(n.id));
    set((state) => withWorkflowHistory(state, {
        ...workflow,
        nodes: [...positioned, ...remaining],
        updatedAt: new Date().toISOString()
      }, {
      focusNodeId: get().selectedNodeId || orchestrator?.id || positioned[0]?.id || "",
      focusVersion: state.focusVersion + 1,
      statusMessage: "Graph layout refreshed."
    }));
  },

  connectNodes: (sourceId, targetId, sourcePort = "right", targetPort = "left") => {
    const workflow = get().workflow;
    if (!sourceId || !targetId || sourceId === targetId) return;
    if (workflow.edges.some((edge) => edge.source === sourceId && edge.target === targetId)) {
      set({ statusMessage: "That graph link already exists." });
      return;
    }
    set((state) => withWorkflowHistory(state, {
        ...state.workflow,
        edges: [...state.workflow.edges, { id: makeId("edge"), source: sourceId, target: targetId, sourcePort, targetPort }],
        updatedAt: new Date().toISOString()
      }, {
      statusMessage: "Graph link added."
    }));
  },
  connectSelectedTo: (targetId) => get().connectNodes(get().selectedNodeId, targetId),

  removeEdge: (edgeId) =>
    set((state) => withWorkflowHistory(state, {
        ...state.workflow,
        edges: state.workflow.edges.filter((edge) => edge.id !== edgeId),
        updatedAt: new Date().toISOString()
      }, {
      statusMessage: "Graph link removed."
    })),

  setUserPrompt: (prompt) =>
    set((state) => {
      const inputNode = state.workflow.nodes.find((node) => node.type === "user_input");
      if (!inputNode) return state;
      return {
        workflow: {
          ...state.workflow,
          nodes: state.workflow.nodes.map((node) => (node.id === inputNode.id ? { ...node, prompt } : node)),
          updatedAt: new Date().toISOString()
        }
      };
    }),

  updateNode: (id, updates, options = {}) =>
    set((state) => {
      const workflow = {
        ...state.workflow,
        nodes: state.workflow.nodes.map((node) => (node.id === id ? { ...node, ...updates } : node)),
        updatedAt: new Date().toISOString()
      };
      if (options.skipHistory) return { workflow };
      return withWorkflowHistory(state, workflow);
    }),

  deleteNode: (id = get().selectedNodeId) =>
    set((state) => withWorkflowHistory(state, {
        ...state.workflow,
        nodes: state.workflow.nodes.filter((node) => node.id !== id),
        edges: state.workflow.edges.filter((edge) => edge.source !== id && edge.target !== id),
        groups: (state.workflow.groups || [])
          .map((g) => ({ ...g, nodeIds: g.nodeIds.filter((nid) => nid !== id) }))
          .filter((g) => g.nodeIds.length > 0),
        updatedAt: new Date().toISOString()
      }, {
      selectedNodeId: state.selectedNodeId === id ? "" : state.selectedNodeId
    })),

  duplicateNode: (id = get().selectedNodeId) => {
    const workflow = get().workflow;
    const node = workflow.nodes.find((item) => item.id === id);
    if (!node) return;
    const copy = {
      ...node,
      id: makeId("agent"),
      type: ["orchestrator", "user_input", "output"].includes(node.type) ? "agent" : node.type,
      name: `${node.name} Copy`,
      position: { x: (node.position?.x || 0) + 280, y: (node.position?.y || 0) + 48 }
    };
    const edge = { id: makeId("edge"), source: node.id, target: copy.id };
    set((state) => withWorkflowHistory(state,
      { ...workflow, nodes: [...workflow.nodes, copy], edges: [...workflow.edges, edge], updatedAt: new Date().toISOString() },
      {
      selectedNodeId: copy.id,
      focusNodeId: copy.id,
      workflowTabOpen: true,
      activeWorkspaceTab: "workflow",
      focusVersion: state.focusVersion + 1,
      statusMessage: `${copy.name} duplicated on the canvas.`
    }));
  },

  resetWorkflow: () =>
    set((state) => withWorkflowHistory(state, defaultWorkflow(), {
      selectedNodeId: "orchestrator",
      focusNodeId: "orchestrator",
      workflowTabOpen: true,
      activeWorkspaceTab: "workflow",
      focusVersion: state.focusVersion + 1,
      layoutPreset: "canvas_focus",
      mermaidText: ""
    })),

  onNodesChange: (changes) =>
    set((state) => {
      const flowNodes = state.workflow.nodes.map((node) => ({
        id: node.id,
        position: node.position || { x: 0, y: 0 },
        data: node
      }));
      const changed = applyNodeChanges(changes, flowNodes);
      const positions = new Map(changed.map((node) => [node.id, node.position]));
      return withWorkflowHistory(state, {
          ...state.workflow,
          nodes: state.workflow.nodes.map((node) => ({ ...node, position: positions.get(node.id) || node.position })),
          updatedAt: new Date().toISOString()
        });
    }),

  onEdgesChange: (changes) =>
    set((state) => {
      const changed = applyEdgeChanges(changes, state.workflow.edges);
      return withWorkflowHistory(state, { ...state.workflow, edges: changed, updatedAt: new Date().toISOString() });
    }),

  onConnect: (connection) =>
    set((state) => withWorkflowHistory(state, {
        ...state.workflow,
        edges: addEdge({ ...connection, id: makeId("edge") }, state.workflow.edges),
        updatedAt: new Date().toISOString()
      })),

  setWorkflow: (workflow) =>
    set((state) => withWorkflowHistory(state, workflow, {
      selectedNodeId: workflow.nodes[0]?.id || "",
      focusNodeId: workflow.nodes[0]?.id || "",
      workflowTabOpen: true,
      activeWorkspaceTab: "workflow",
      focusVersion: state.focusVersion + 1,
      mermaidText: workflow.mermaid || ""
    })),
  setMermaidText: (mermaidText) => set({ mermaidText }),

  // ── Workspace import (Feature 3) ──────────────────────────────────────────
  importWorkspaceToProject: (sourceProjectId) => {
    const { projects, activeProjectId, workflow } = get();
    const source = projects.find((p) => p.id === sourceProjectId);
    if (!source || sourceProjectId === activeProjectId || !activeProjectId) return;
    if ((workflow.importedWorkspaces || []).some((iw) => iw.sourceProjectId === sourceProjectId)) {
      set({ statusMessage: "This workspace is already imported." });
      return;
    }
    const entry = {
      id: makeId("imp"),
      sourceProjectId,
      sourceName: source.name,
      nodes: source.workflow.nodes.filter((n) => n.type !== "tool"),
      edges: source.workflow.edges.filter((e) => e.type !== "tool"),
    };
    const updatedWorkflow = {
      ...workflow,
      importedWorkspaces: [...(workflow.importedWorkspaces || []), entry],
      updatedAt: new Date().toISOString(),
    };
    const activeProject = projects.find((p) => p.id === activeProjectId);
    const updatedProject = { ...activeProject, workflow: updatedWorkflow, updatedAt: new Date().toISOString() };
    const updatedProjects = projects.map((p) => p.id === activeProjectId ? updatedProject : p);
    saveProjectsToStorage(updatedProjects);
    upsertProject(updatedProject, currentUserKey(get().currentUser)).catch(() => {});
    set((state) => withWorkflowHistory(state, updatedWorkflow, {
      projects: updatedProjects,
      statusMessage: `"${source.name}" added to imported workspaces.`,
    }));
  },

  removeImportedWorkspace: (importedId) => {
    const { workflow, projects, activeProjectId } = get();
    const updatedWorkflow = {
      ...workflow,
      importedWorkspaces: (workflow.importedWorkspaces || []).filter((iw) => iw.id !== importedId),
      updatedAt: new Date().toISOString(),
    };
    const activeProject = projects.find((p) => p.id === activeProjectId);
    const updatedProject = { ...activeProject, workflow: updatedWorkflow, updatedAt: new Date().toISOString() };
    const updatedProjects = projects.map((p) => p.id === activeProjectId ? updatedProject : p);
    saveProjectsToStorage(updatedProjects);
    upsertProject(updatedProject, currentUserKey(get().currentUser)).catch(() => {});
    set((state) => withWorkflowHistory(state, updatedWorkflow, { projects: updatedProjects }));
  },

  // Import selected nodes from an imported workspace into the active canvas (Feature 4 + 6)
  importNodesToWorkflow: (importedId, selectedNodeIds) => {
    const { workflow } = get();
    const imported = (workflow.importedWorkspaces || []).find((iw) => iw.id === importedId);
    if (!imported || !selectedNodeIds.length) return;
    const existingMaxX = workflow.nodes.reduce((mx, n) => Math.max(mx, (n.position?.x || 0) + 240), 100);
    const idMap = {};
    const newNodes = imported.nodes
      .filter((n) => selectedNodeIds.includes(n.id))
      .map((n) => {
        const nid = makeId("node");
        idMap[n.id] = nid;
        return { ...n, id: nid, position: { x: existingMaxX + (n.position?.x || 0) + 60, y: n.position?.y || 100 } };
      });
    const newEdges = imported.edges
      .filter((e) => selectedNodeIds.includes(e.source) && selectedNodeIds.includes(e.target))
      .map((e) => ({ ...e, id: makeId("edge"), source: idMap[e.source], target: idMap[e.target] }));
    const group = {
      id: makeId("grp"),
      name: `From: ${imported.sourceName}`,
      color: "#3b82f6",
      nodeIds: newNodes.map((n) => n.id),
    };
    set((state) => withWorkflowHistory(state, {
        ...state.workflow,
        nodes: [...state.workflow.nodes, ...newNodes],
        edges: [...state.workflow.edges, ...newEdges],
        groups: [...(state.workflow.groups || []), group],
        updatedAt: new Date().toISOString(),
      }, {
      statusMessage: `${newNodes.length} node(s) imported from "${imported.sourceName}".`,
    }));
  },

  // Import nodes directly from a source project (bypasses importedWorkspaces)
  importNodesDirectly: (sourceProjectId, selectedNodeIds) => {
    const { projects, workflow } = get();
    const source = projects.find((p) => p.id === sourceProjectId);
    if (!source || !selectedNodeIds.length) return;
    const existingMaxX = workflow.nodes.reduce((mx, n) => Math.max(mx, (n.position?.x || 0) + 240), 100);
    const idMap = {};
    const newNodes = source.workflow.nodes
      .filter((n) => n.type !== "tool" && selectedNodeIds.includes(n.id))
      .map((n) => {
        const nid = makeId("node");
        idMap[n.id] = nid;
        return { ...n, id: nid, position: { x: existingMaxX + (n.position?.x || 0) + 60, y: n.position?.y || 100 } };
      });
    const newEdges = source.workflow.edges
      .filter((e) => selectedNodeIds.includes(e.source) && selectedNodeIds.includes(e.target))
      .map((e) => ({ ...e, id: makeId("edge"), source: idMap[e.source], target: idMap[e.target] }));
    const group = {
      id: makeId("grp"),
      name: `From: ${source.name}`,
      color: "#3b82f6",
      nodeIds: newNodes.map((n) => n.id),
    };
    set((state) => withWorkflowHistory(state, {
        ...state.workflow,
        nodes: [...state.workflow.nodes, ...newNodes],
        edges: [...state.workflow.edges, ...newEdges],
        groups: [...(state.workflow.groups || []), group],
        updatedAt: new Date().toISOString(),
      }, {
      statusMessage: `${newNodes.length} node(s) imported from "${source.name}".`,
    }));
  },

  // ── Node groups (Feature 5) ───────────────────────────────────────────────
  createGroup: (nodeIds, name = "New Group", color = "#6366f1") => {
    const group = { id: makeId("grp"), name, color, nodeIds: [...nodeIds] };
    set((state) => withWorkflowHistory(state, {
        ...state.workflow,
        groups: [...(state.workflow.groups || []), group],
        updatedAt: new Date().toISOString(),
      }));
  },

  deleteGroup: (id) =>
    set((state) => withWorkflowHistory(state, {
        ...state.workflow,
        groups: (state.workflow.groups || []).filter((g) => g.id !== id),
        updatedAt: new Date().toISOString(),
      })),

  renameGroup: (id, name) =>
    set((state) => withWorkflowHistory(state, {
        ...state.workflow,
        groups: (state.workflow.groups || []).map((g) => g.id === id ? { ...g, name } : g),
        updatedAt: new Date().toISOString(),
      })),

  updateGroupColor: (id, color) =>
    set((state) => withWorkflowHistory(state, {
        ...state.workflow,
        groups: (state.workflow.groups || []).map((g) => g.id === id ? { ...g, color } : g),
        updatedAt: new Date().toISOString(),
      })),

  ungroupNodes: (id) =>
    set((state) => withWorkflowHistory(state, {
        ...state.workflow,
        groups: (state.workflow.groups || []).filter((g) => g.id !== id),
        updatedAt: new Date().toISOString(),
      })),

  // ── Multi-workflow management (Phase A) ───────────────────────────────────
  addWorkflow: (name) => {
    const { activeProjectId, projects } = get();
    const project = projects.find((p) => p.id === activeProjectId);
    if (!project) return;
    const workflowName = name || makeUntitledWorkflowName(project.workflows || [], projectStarterWorkflowName(project));
    const defaults = projectExecutionDefaults(project);
    const wf = {
      ...emptyWorkflow(),
      id: makeId("wf"),
      name: workflowName,
      builderTarget: defaults.builderTarget || "langgraph",
      planConstraints: { ...DEFAULT_PLAN_CONSTRAINTS, ...(defaults.planConstraints || {}) },
    };
    const updatedWorkflows = [...(project.workflows || []), wf];
    const updatedProject = { ...project, workflows: updatedWorkflows, activeWorkflowId: wf.id, updatedAt: new Date().toISOString() };
    const updatedProjects = projects.map((p) => (p.id === activeProjectId ? updatedProject : p));
    saveProjectsToStorage(updatedProjects);
    upsertProject(updatedProject, currentUserKey(get().currentUser)).catch(() => {});
    set((state) => ({
      projects: updatedProjects,
      activeWorkflowId: wf.id,
      workflow: wf,
      workflowHistoryPast: [],
      workflowHistoryFuture: [],
      selectedNodeId: "",
      focusNodeId: "",
      workflowTabOpen: true,
      activeWorkspaceTab: "workflow",
      agentTabIds: [],
      focusVersion: state.focusVersion + 1,
      statusMessage: `"${wf.name}" created.`,
    }));
    return wf.id;
  },

  removeWorkflow: (workflowId) => {
    const { activeProjectId, activeWorkflowId, projects } = get();
    const project = projects.find((p) => p.id === activeProjectId);
    if (!project || (project.workflows || []).length <= 1) {
      set({ statusMessage: "Can't delete the last workflow in a project." });
      return;
    }
    const remaining = (project.workflows || []).filter((w) => w.id !== workflowId);
    const newActiveId = workflowId === activeWorkflowId
      ? remaining[0]?.id
      : activeWorkflowId;
    const newActiveWf = remaining.find((w) => w.id === newActiveId) || remaining[0];
    const updatedProject = { ...project, workflows: remaining, activeWorkflowId: newActiveId, updatedAt: new Date().toISOString() };
    const updatedProjects = projects.map((p) => (p.id === activeProjectId ? updatedProject : p));
    saveProjectsToStorage(updatedProjects);
    upsertProject(updatedProject, currentUserKey(get().currentUser)).catch(() => {});
    const switchingActive = workflowId === activeWorkflowId;
    set((state) => ({
      projects: updatedProjects,
      ...(switchingActive ? {
        activeWorkflowId: newActiveWf?.id || null,
        workflow: newActiveWf || defaultWorkflow(),
        selectedNodeId: newActiveWf?.nodes?.[0]?.id || "",
        focusNodeId: newActiveWf?.nodes?.[0]?.id || "",
        workflowHistoryPast: [],
        workflowHistoryFuture: [],
        agentTabIds: [],
        focusVersion: state.focusVersion + 1,
      } : {}),
      statusMessage: "Workflow deleted.",
    }));
  },

  renameWorkflow: (workflowId, name) => {
    const { activeProjectId, activeWorkflowId, projects } = get();
    const project = projects.find((p) => p.id === activeProjectId);
    if (!project) return;
    const updatedWorkflows = (project.workflows || []).map((w) =>
      w.id === workflowId ? { ...w, name, updatedAt: new Date().toISOString() } : w
    );
    const updatedProject = { ...project, workflows: updatedWorkflows, updatedAt: new Date().toISOString() };
    const updatedProjects = projects.map((p) => (p.id === activeProjectId ? updatedProject : p));
    saveProjectsToStorage(updatedProjects);
    upsertProject(updatedProject, currentUserKey(get().currentUser)).catch(() => {});
    set((state) => ({
      projects: updatedProjects,
      ...(workflowId === activeWorkflowId ? { workflow: { ...state.workflow, name } } : {}),
    }));
  },

  duplicateWorkflow: (workflowId) => {
    const { activeProjectId, projects } = get();
    const project = projects.find((p) => p.id === activeProjectId);
    if (!project) return;
    const source = (project.workflows || []).find((w) => w.id === workflowId);
    if (!source) return;
    // Deep clone with new IDs for workflow + all nodes + edges
    const idMap = {};
    const newNodes = (source.nodes || []).map((n) => {
      const nid = makeId("node");
      idMap[n.id] = nid;
      return { ...n, id: nid };
    });
    const newEdges = (source.edges || []).map((e) => ({
      ...e,
      id: makeId("edge"),
      source: idMap[e.source] || e.source,
      target: idMap[e.target] || e.target,
    }));
    const copy = { ...source, id: makeId("wf"), name: `${source.name} Copy`, nodes: newNodes, edges: newEdges, groups: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    const updatedWorkflows = [...(project.workflows || []), copy];
    const updatedProject = { ...project, workflows: updatedWorkflows, updatedAt: new Date().toISOString() };
    const updatedProjects = projects.map((p) => (p.id === activeProjectId ? updatedProject : p));
    saveProjectsToStorage(updatedProjects);
    upsertProject(updatedProject, currentUserKey(get().currentUser)).catch(() => {});
    set({ projects: updatedProjects, statusMessage: `"${copy.name}" created.` });
    return copy.id;
  },

  setActiveWorkflow: (workflowId) => {
    const { activeProjectId, projects } = get();
    const project = projects.find((p) => p.id === activeProjectId);
    const wf = (project?.workflows || []).find((w) => w.id === workflowId);
    if (!wf) {
      // Guard: dangling ID — fall back to first workflow
      const fallback = project?.workflows?.[0];
      if (!fallback) return;
      set((state) => ({
        activeWorkflowId: fallback.id,
        workflow: fallback,
        workflowHistoryPast: [],
        workflowHistoryFuture: [],
        selectedNodeId: fallback.nodes?.[0]?.id || "",
        focusNodeId: fallback.nodes?.[0]?.id || "",
        workflowTabOpen: true,
        activeWorkspaceTab: "workflow",
        agentTabIds: [],
        focusVersion: state.focusVersion + 1,
      }));
      return;
    }
    const updatedProject = { ...project, activeWorkflowId: workflowId };
    const updatedProjects = projects.map((p) => (p.id === activeProjectId ? updatedProject : p));
    saveProjectsToStorage(updatedProjects);
    set((state) => ({
      projects: updatedProjects,
      activeWorkflowId: workflowId,
      workflow: wf,
      workflowHistoryPast: [],
      workflowHistoryFuture: [],
      selectedNodeId: wf.nodes?.[0]?.id || "",
      focusNodeId: wf.nodes?.[0]?.id || "",
      workflowTabOpen: true,
      activeWorkspaceTab: "workflow",
      agentTabIds: [],
      focusVersion: state.focusVersion + 1,
      statusMessage: `Switched to "${wf.name}".`,
    }));
  },

  // Expose active project's workflows list for UI consumption
  getWorkflows: () => {
    const { activeProjectId, projects } = get();
    const project = projects.find((p) => p.id === activeProjectId);
    return project?.workflows || [];
  },
}));

// ── Auto-persist workflow to localStorage ─────────────────────────────────────
// T3: Watches state.workflow (the active workflow alias). On change, writes the
// updated workflow back into the correct slot in projects[activeProjectId].workflows[].
let _autosaveTimer = null;
useWorkflowStore.subscribe((state, prev) => {
  if (state.workflow === prev.workflow) return;
  if (!state.activeProjectId || !state.projects.length) return;
  clearTimeout(_autosaveTimer);
  _autosaveTimer = setTimeout(() => {
    const { workflow, activeProjectId, activeWorkflowId, projects } = useWorkflowStore.getState();
    if (!activeProjectId || !workflow) return;
    const newProjects = projects.map((p) => {
      if (p.id !== activeProjectId) return p;
      const updatedWorkflows = (p.workflows || []).map((wf) =>
        wf.id === (activeWorkflowId || workflow.id) ? { ...workflow, updatedAt: workflow.updatedAt } : wf
      );
      return {
        ...p,
        workflows: updatedWorkflows,
        updatedAt: workflow.updatedAt,
      };
    });
    saveProjectsToStorage(newProjects);
  }, 1000);
});
