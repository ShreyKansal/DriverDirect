import { create } from "zustand";
import { addEdge, applyEdgeChanges, applyNodeChanges } from "@xyflow/react";
import { createAgentNode, createToolNode, defaultWorkflow, personResearchWorkflow } from "../utils/graphUtils.js";
import { makeId } from "../utils/idUtils.js";
import { runWorkflowStreaming } from "../api/workflowApi.js";
import { fetchProjects, upsertProject, removeProject } from "../api/projectApi.js";

// Strip ":latest" from model names so the server resolver can find the right tag
function fixModelTag(model) {
  if (!model) return model;
  return model.endsWith(":latest") ? model.slice(0, -7) : model;
}

function fixWorkflowModels(wf) {
  if (!wf) return wf;
  return { ...wf, nodes: (wf.nodes || []).map((n) => ({ ...n, model: fixModelTag(n.model) })) };
}

function loadProjectsFromStorage() {
  if (typeof window === "undefined") return [];
  try {
    const projects = JSON.parse(localStorage.getItem("builder-projects") || "[]");
    return projects.map((p) => ({ ...p, workflow: fixWorkflowModels(p.workflow) }));
  } catch {
    return [];
  }
}

function saveProjectsToStorage(projects) {
  if (typeof window !== "undefined") {
    localStorage.setItem("builder-projects", JSON.stringify(projects));
  }
}

export const useWorkflowStore = create((set, get) => ({
  workflow: fixWorkflowModels(defaultWorkflow()),
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
  showProjectSettings: false,
  workflowTabOpen: true,
  activeWorkspaceTab: "workflow",
  settingsTabOpen: false,
  settingsModalOpen: false,
  docsTabOpen: false,
  canvasZoom: 1,
  canvasZoomRequest: null,  // "in" | "out" | "fit" | null

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
        const updatedProject = { ...activeProject, workflow: updatedWorkflow, updatedAt: new Date().toISOString() };
        const projects = s.projects.map((p) => (p.id === s.activeProjectId ? updatedProject : p));
        saveProjectsToStorage(projects);
        upsertProject(updatedProject, s.currentUser?.email).catch(() => {});
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
    const { workflow, activeProjectId, setStatusMessage } = get();
    if (!activeProjectId) return;

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
      projects = await fetchProjects(userId);
      fromApi = true;
    } catch {
      projects = loadProjectsFromStorage(); // fall back to localStorage when server is unreachable
    }

    if (fromApi) {
      if (projects.length === 0) {
        // Fresh DB — migrate whatever is in localStorage so nothing is lost
        const localProjects = loadProjectsFromStorage();
        if (localProjects.length > 0) {
          projects = localProjects;
          localProjects.forEach((p) => upsertProject(p, userId).catch(() => {}));
        }
      } else {
        saveProjectsToStorage(projects); // keep localStorage in sync as cache
      }
    }

    // Seed the Person Research demo project once if it isn't saved yet
    const alreadySeeded = projects.some((p) => p.id === "seed_person_research");
    if (!alreadySeeded) {
      const wf = personResearchWorkflow();
      const seedProject = {
        id: "seed_person_research",
        name: wf.name,
        description: wf.description,
        workflow: wf,
        createdAt: wf.createdAt,
        updatedAt: wf.updatedAt
      };
      projects = [seedProject, ...projects];
      saveProjectsToStorage(projects);
      upsertProject(seedProject, userId).catch(() => {});

      set((state) => ({
        projects,
      activeProjectId: "seed_person_research",
      openTabIds: ["seed_person_research"],
      workflow: wf,
      selectedNodeId: wf.nodes[0]?.id || "",
      focusNodeId: wf.nodes[0]?.id || "",
      workflowTabOpen: true,
      activeWorkspaceTab: "workflow",
      focusVersion: state.focusVersion + 1,
        statusMessage: "Person Research project loaded."
      }));
      return;
    }

    set({ projects });
  },

  setStatusMessage: (statusMessage) => set({ statusMessage }),
  setLayoutPreset: (layoutPreset) => set({ layoutPreset }),
  setTheme: (theme) => set({ theme }),
  setActivePanel: (activePanel) => set({ activePanel }),
  toggleActivePanel: (panel) =>
    set((state) => ({ activePanel: state.activePanel === panel ? null : panel })),
  setTerminalOpen: (terminalOpen) => set({ terminalOpen }),
  toggleTerminalOpen: () => set((state) => ({ terminalOpen: !state.terminalOpen })),
  setShowProjectSettings: (showProjectSettings) => set({ showProjectSettings }),
  setCanvasZoom: (canvasZoom) => set({ canvasZoom }),
  requestCanvasZoom: (type) => set({ canvasZoomRequest: type }),
  clearCanvasZoomRequest: () => set({ canvasZoomRequest: null }),
  toggleProjectSettings: () =>
    set((state) => ({
      showProjectSettings: !state.showProjectSettings,
      settingsTabOpen: !state.showProjectSettings ? true : state.settingsTabOpen,
      activeWorkspaceTab: !state.showProjectSettings ? "settings" : state.workflowTabOpen ? "workflow" : null,
      selectedNodeId: !state.showProjectSettings ? "" : state.selectedNodeId
    })),
  openProjectSettings: () =>
    set({ settingsTabOpen: true, settingsModalOpen: false, activeWorkspaceTab: "settings", selectedNodeId: "" }),
  closeSettingsModal: () =>
    set((s) => ({
      settingsTabOpen: false,
      settingsModalOpen: false,
      activeWorkspaceTab: s.workflowTabOpen ? "workflow" : null
    })),
  openDocsTab: () => set({ docsTabOpen: true, activeWorkspaceTab: "docs" }),
  closeDocsTab: () =>
    set((s) => ({ docsTabOpen: false, activeWorkspaceTab: s.workflowTabOpen ? "workflow" : null })),
  openWorkflowTab: () => set({ workflowTabOpen: true, activeWorkspaceTab: "workflow", showProjectSettings: false, settingsModalOpen: false }),
  closeWorkflowTab: () =>
    set((state) => ({
      workflowTabOpen: false,
      activeWorkspaceTab: state.activeWorkspaceTab === "workflow"
        ? state.settingsTabOpen ? "settings" : null
        : state.activeWorkspaceTab,
      showProjectSettings: state.activeWorkspaceTab === "workflow" ? state.settingsTabOpen : state.showProjectSettings
    })),
  closeSettingsTab: () =>
    set((state) => ({
      settingsTabOpen: false,
      activeWorkspaceTab: state.activeWorkspaceTab === "settings"
        ? state.workflowTabOpen ? "workflow" : null
        : state.activeWorkspaceTab,
      showProjectSettings: false
    })),
  selectNode: (id) =>
    set({
      selectedNodeId: id,
      showProjectSettings: id ? false : get().showProjectSettings,
      workflowTabOpen: id ? true : get().workflowTabOpen,
      activeWorkspaceTab: id ? "workflow" : get().activeWorkspaceTab
    }),
  updateWorkflow: (updates) =>
    set((state) => ({
      workflow: {
        ...state.workflow,
        ...updates,
        updatedAt: new Date().toISOString()
      }
    })),
  focusNode: (id = get().selectedNodeId) =>
    set((state) => ({
      selectedNodeId: id,
      focusNodeId: id,
      focusVersion: state.focusVersion + 1,
      showProjectSettings: id ? false : state.showProjectSettings,
      workflowTabOpen: id ? true : state.workflowTabOpen,
      activeWorkspaceTab: id ? "workflow" : state.activeWorkspaceTab
    })),

  // Project management
  createProjectFromWorkflow: (workflow) => {
    const wf = { ...workflow, id: makeId("wf") };
    const project = {
      id: makeId("proj"),
      name: wf.name || "Imported Project",
      description: wf.description || "",
      workflow: wf,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const projects = [...get().projects, project];
    saveProjectsToStorage(projects);
    upsertProject(project, get().currentUser?.email).catch(() => {});
    set((state) => ({
      projects,
      activeProjectId: project.id,
      openTabIds: state.openTabIds.includes(project.id) ? state.openTabIds : [...state.openTabIds, project.id],
      workflow: wf,
      selectedNodeId: wf.nodes[0]?.id || "",
      focusNodeId: wf.nodes[0]?.id || "",
      workflowTabOpen: true,
      activeWorkspaceTab: "workflow",
      focusVersion: state.focusVersion + 1,
      statusMessage: `"${project.name}" loaded as project.`
    }));
  },

  createProject: (name = "New Project") => {
    const wf = { ...defaultWorkflow(), name, id: makeId("wf"), builderTarget: "" };
    const project = {
      id: makeId("proj"),
      name,
      description: "",
      workflow: wf,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const projects = [...get().projects, project];
    saveProjectsToStorage(projects);
    upsertProject(project, get().currentUser?.email).catch(() => {});
    set((state) => ({
      projects,
      activeProjectId: project.id,
      openTabIds: state.openTabIds.includes(project.id) ? state.openTabIds : [...state.openTabIds, project.id],
      workflow: wf,
      selectedNodeId: wf.nodes[0]?.id || "",
      focusNodeId: wf.nodes[0]?.id || "",
      workflowTabOpen: true,
      activeWorkspaceTab: "workflow",
      focusVersion: state.focusVersion + 1,
      needsArchitectureSelection: true,
      statusMessage: `Project "${name}" created.`
    }));
  },

  switchProject: (id) => {
    const project = get().projects.find((p) => p.id === id);
    if (!project) return;
    set((state) => ({
      activeProjectId: id,
      workflow: project.workflow,
      selectedNodeId: project.workflow.nodes[0]?.id || "",
      focusNodeId: project.workflow.nodes[0]?.id || "",
      workflowTabOpen: true,
      activeWorkspaceTab: "workflow",
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
    removeProject(id, get().currentUser?.email).catch(() => {});
    const isActive = get().activeProjectId === id;
    set((state) => ({
      projects,
      activeProjectId: isActive ? null : state.activeProjectId,
      ...(isActive
        ? { workflow: defaultWorkflow(), selectedNodeId: "orchestrator", focusNodeId: "orchestrator", workflowTabOpen: true, activeWorkspaceTab: "workflow", focusVersion: state.focusVersion + 1 }
        : {})
    }));
  },

  renameProject: (id, name) => {
    const projects = get().projects.map((p) => (p.id === id ? { ...p, name } : p));
    saveProjectsToStorage(projects);
    const updated = projects.find((p) => p.id === id);
    if (updated) upsertProject(updated, get().currentUser?.email).catch(() => {});
    set({ projects });
  },

  saveCurrentToProject: () => {
    const { workflow, activeProjectId, projects } = get();
    if (!activeProjectId) {
      const project = {
        id: makeId("proj"),
        name: workflow.name,
        description: workflow.description || "",
        workflow: { ...workflow },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const newProjects = [...projects, project];
      saveProjectsToStorage(newProjects);
      upsertProject(project, get().currentUser?.email).catch(() => {});
      set({ projects: newProjects, activeProjectId: project.id, statusMessage: "Saved as new project." });
    } else {
      const updated = { ...projects.find((p) => p.id === activeProjectId), workflow: { ...workflow }, updatedAt: new Date().toISOString() };
      const newProjects = projects.map((p) => (p.id === activeProjectId ? updated : p));
      saveProjectsToStorage(newProjects);
      upsertProject(updated, get().currentUser?.email).catch(() => {});
      set((state) => ({
        projects: newProjects,
        statusMessage: state.statusMessage === "Project saved." ? "" : state.statusMessage
      }));
    }
  },

  addAgent: (type = "agent") => {
    const workflow = get().workflow;
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
    const node = createAgentNode(type, workflow.nodes.length + 1, selectedNode);
    const shouldConnect = selectedNode && selectedNode.id !== node.id;
    const edge = shouldConnect ? { id: makeId("edge"), source: selectedNode.id, target: node.id } : null;

    set((state) => ({
      workflow: {
        ...workflow,
        nodes: [...workflow.nodes, node],
        edges: edge ? [...workflow.edges, edge] : workflow.edges,
        updatedAt: new Date().toISOString()
      },
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
    set((state) => ({
      workflow: {
        ...workflow,
        nodes: [...workflow.nodes, toolNode],
        edges: [...workflow.edges, edge],
        updatedAt: new Date().toISOString()
      },
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
    set((state) => ({
      workflow: {
        ...workflow,
        nodes: [...positioned, ...remaining],
        updatedAt: new Date().toISOString()
      },
      focusNodeId: get().selectedNodeId || orchestrator?.id || positioned[0]?.id || "",
      focusVersion: state.focusVersion + 1,
      statusMessage: "Graph layout refreshed."
    }));
  },

  connectNodes: (sourceId, targetId) => {
    const workflow = get().workflow;
    if (!sourceId || !targetId || sourceId === targetId) return;
    if (workflow.edges.some((edge) => edge.source === sourceId && edge.target === targetId)) {
      set({ statusMessage: "That graph link already exists." });
      return;
    }
    set({
      workflow: {
        ...workflow,
        edges: [...workflow.edges, { id: makeId("edge"), source: sourceId, target: targetId }],
        updatedAt: new Date().toISOString()
      },
      statusMessage: "Graph link added."
    });
  },
  connectSelectedTo: (targetId) => get().connectNodes(get().selectedNodeId, targetId),

  removeEdge: (edgeId) =>
    set((state) => ({
      workflow: {
        ...state.workflow,
        edges: state.workflow.edges.filter((edge) => edge.id !== edgeId),
        updatedAt: new Date().toISOString()
      },
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

  updateNode: (id, updates) =>
    set((state) => ({
      workflow: {
        ...state.workflow,
        nodes: state.workflow.nodes.map((node) => (node.id === id ? { ...node, ...updates } : node)),
        updatedAt: new Date().toISOString()
      }
    })),

  deleteNode: (id = get().selectedNodeId) =>
    set((state) => ({
      workflow: {
        ...state.workflow,
        nodes: state.workflow.nodes.filter((node) => node.id !== id),
        edges: state.workflow.edges.filter((edge) => edge.source !== id && edge.target !== id),
        updatedAt: new Date().toISOString()
      },
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
    set((state) => ({
      workflow: { ...workflow, nodes: [...workflow.nodes, copy], edges: [...workflow.edges, edge], updatedAt: new Date().toISOString() },
      selectedNodeId: copy.id,
      focusNodeId: copy.id,
      workflowTabOpen: true,
      activeWorkspaceTab: "workflow",
      focusVersion: state.focusVersion + 1,
      statusMessage: `${copy.name} duplicated on the canvas.`
    }));
  },

  resetWorkflow: () =>
    set((state) => ({
      workflow: defaultWorkflow(),
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
      return {
        workflow: {
          ...state.workflow,
          nodes: state.workflow.nodes.map((node) => ({ ...node, position: positions.get(node.id) || node.position })),
          updatedAt: new Date().toISOString()
        }
      };
    }),

  onEdgesChange: (changes) =>
    set((state) => {
      const changed = applyEdgeChanges(changes, state.workflow.edges);
      return { workflow: { ...state.workflow, edges: changed, updatedAt: new Date().toISOString() } };
    }),

  onConnect: (connection) =>
    set((state) => ({
      workflow: {
        ...state.workflow,
        edges: addEdge({ ...connection, id: makeId("edge") }, state.workflow.edges),
        updatedAt: new Date().toISOString()
      }
    })),

  setWorkflow: (workflow) =>
    set((state) => ({
      workflow,
      selectedNodeId: workflow.nodes[0]?.id || "",
      focusNodeId: workflow.nodes[0]?.id || "",
      workflowTabOpen: true,
      activeWorkspaceTab: "workflow",
      focusVersion: state.focusVersion + 1,
      mermaidText: workflow.mermaid || ""
    })),
  setMermaidText: (mermaidText) => set({ mermaidText })
}));
