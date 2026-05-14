import { useCallback, useEffect, useRef, useState } from "react";
import { FileJson, FileText, Maximize2, Minus, Play, Plus, Settings2, X, ZoomIn } from "lucide-react";
import ChatPanel from "../chat/ChatPanel.jsx";
import ProjectExplorer from "../explorer/ProjectExplorer.jsx";
import FlowCanvas from "../flow/FlowCanvas.jsx";
import OutputPanel from "../output/OutputPanel.jsx";
import NodePalette from "./NodePalette.jsx";
import RightPanel from "./RightPanel.jsx";
import ProjectSettingsPanel from "../settings/ProjectSettingsPanel.jsx";
import { useWorkflowStore } from "../../store/workflowStore.js";

function useHorizResize(initial, min, max, inverted = false) {
  const [size, setSize] = useState(initial);
  const dragging  = useRef(false);
  const startX    = useRef(0);
  const startSize = useRef(initial);

  const onMouseDown = useCallback((e) => {
    dragging.current  = true;
    startX.current    = e.clientX;
    startSize.current = size;
    e.preventDefault();
  }, [size]);

  useEffect(() => {
    const onMove = (e) => {
      if (!dragging.current) return;
      const delta = (e.clientX - startX.current) * (inverted ? -1 : 1);
      setSize(Math.min(max, Math.max(min, startSize.current + delta)));
    };
    const onUp = () => { dragging.current = false; };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, [inverted, min, max]);

  return [size, onMouseDown];
}

function ResizeHandle({ onMouseDown, vertical = false }) {
  return (
    <div
      className={`group relative shrink-0 ${vertical ? "h-1 cursor-row-resize" : "w-1 cursor-col-resize"}`}
      onMouseDown={onMouseDown}
    >
      <div className={`absolute inset-0 ${vertical ? "h-px top-0" : "w-px left-0"} bg-hairline transition-colors group-hover:bg-primary/50`} />
    </div>
  );
}

function WorkspaceTabs({ openTabs, activeProjectId, onSwitchProject, onCloseTab, showZoom }) {
  const canvasZoom        = useWorkflowStore((s) => s.canvasZoom);
  const requestCanvasZoom = useWorkflowStore((s) => s.requestCanvasZoom);

  const tabClass = (active) =>
    `group relative flex h-9 min-w-0 items-center gap-2 border-r border-hairline px-3 text-[12px] transition ${
      active ? "bg-canvas text-ink" : "bg-panel text-muted hover:bg-canvasSoft hover:text-ink"
    }`;

  return (
    <div className="flex h-9 shrink-0 items-stretch border-b border-hairline bg-panel">
      <div className="flex min-w-0 flex-1 overflow-x-auto">
        {openTabs.map((proj) => {
          const active = proj.id === activeProjectId;
          return (
            <div key={proj.id} className="relative flex shrink-0">
              <button
                className={`${tabClass(active)} pr-7`}
                onClick={() => onSwitchProject(proj.id)}
                title={proj.name}
              >
                <FileText size={13} className="shrink-0" />
                <span className="max-w-[160px] truncate">{proj.name || "Untitled"}</span>
                {active && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary" />}
              </button>
              <button
                className="absolute right-1 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded text-muted opacity-0 transition group-hover:opacity-70 hover:!opacity-100 hover:bg-surfaceStrong hover:text-ink"
                onClick={(e) => { e.stopPropagation(); onCloseTab(proj.id); }}
                title="Close tab"
              >
                <X size={11} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Zoom controls — shown only when canvas is active */}
      {showZoom && (
        <div className="flex shrink-0 items-center gap-1 border-l border-hairline px-2">
          <button
            className="flex h-6 w-6 items-center justify-center rounded text-muted transition hover:bg-canvasSoft hover:text-ink"
            onClick={() => requestCanvasZoom("out")}
            title="Zoom out"
          >
            <Minus size={12} />
          </button>
          <span className="w-10 text-center text-[11px] font-semibold tabular-nums text-muted">
            {Math.round(canvasZoom * 100)}%
          </span>
          <button
            className="flex h-6 w-6 items-center justify-center rounded text-muted transition hover:bg-canvasSoft hover:text-ink"
            onClick={() => requestCanvasZoom("in")}
            title="Zoom in"
          >
            <ZoomIn size={12} />
          </button>
          <div className="mx-1 h-4 w-px bg-hairline" />
          <button
            className="flex h-6 w-6 items-center justify-center rounded text-muted transition hover:bg-canvasSoft hover:text-ink"
            onClick={() => requestCanvasZoom("fit")}
            title="Fit to view"
          >
            <Maximize2 size={11} />
          </button>
        </div>
      )}
    </div>
  );
}

function EmptyWorkspace({ workflowName, running, onOpenWorkflow, onOpenSettings, onNewProject, onImportJson, onRun }) {
  const actions = [
    { label: "Open Workflow", detail: workflowName || "Workflow canvas", Icon: FileText, action: onOpenWorkflow },
    { label: "Open Project Settings", detail: "Settings and plan options", Icon: Settings2, action: onOpenSettings },
    { label: "New Project", detail: "Create a fresh workflow", Icon: Plus, action: onNewProject },
    { label: "Import JSON", detail: "Load a workflow file", Icon: FileJson, action: onImportJson },
    ...(!running ? [{ label: "Run Workflow", detail: "Execute current workflow", Icon: Play, action: onRun }] : [])
  ];

  return (
    <div className="flex min-h-0 flex-1 items-start justify-center bg-canvas px-8 py-12">
      <div className="w-full max-w-2xl">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">No Open Tabs</p>
        <h2 className="mt-2 text-[22px] font-semibold text-ink">Agent Driver</h2>
        <div className="mt-6 overflow-hidden rounded-md border border-hairline bg-panel">
          {actions.map(({ label, detail, Icon, action }) => (
            <button
              key={label}
              className="flex w-full items-center gap-3 border-b border-hairline px-4 py-3 text-left transition last:border-b-0 hover:bg-canvasSoft"
              onClick={action}
            >
              <Icon size={15} className="shrink-0 text-muted" />
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-medium text-ink">{label}</span>
                <span className="block text-[11px] text-muted">{detail}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AppLayout() {
  const workflow = useWorkflowStore((s) => s.workflow);
  const setWorkflow = useWorkflowStore((s) => s.setWorkflow);
  const setStatusMessage = useWorkflowStore((s) => s.setStatusMessage);
  const selectedNodeId = useWorkflowStore((s) => s.selectedNodeId);
  const terminalOpen = useWorkflowStore((s) => s.terminalOpen);
  // "explorer" | "chat" — clicking the active panel again collapses it
  const activePanel = useWorkflowStore((s) => s.activePanel);
  const workflowTabOpen = useWorkflowStore((s) => s.workflowTabOpen);
  const activeWorkspaceTab = useWorkflowStore((s) => s.activeWorkspaceTab);
  const settingsModalOpen = useWorkflowStore((s) => s.settingsModalOpen);
  const toggleActivePanel = useWorkflowStore((s) => s.toggleActivePanel);
  const setTerminalOpen = useWorkflowStore((s) => s.setTerminalOpen);
  const toggleTerminalOpen = useWorkflowStore((s) => s.toggleTerminalOpen);
  const closeSettingsModal = useWorkflowStore((s) => s.closeSettingsModal);
  const projects = useWorkflowStore((s) => s.projects);
  const activeProjectId = useWorkflowStore((s) => s.activeProjectId);
  const openTabIds = useWorkflowStore((s) => s.openTabIds);
  const createProject = useWorkflowStore((s) => s.createProject);
  const switchProject = useWorkflowStore((s) => s.switchProject);
  const closeTab = useWorkflowStore((s) => s.closeTab);
  const startRun = useWorkflowStore((s) => s.startRun);
  const openProjectSettings  = useWorkflowStore((s) => s.openProjectSettings);
  const openWorkflowTab      = useWorkflowStore((s) => s.openWorkflowTab);
  const autoLayoutWorkflow   = useWorkflowStore((s) => s.autoLayoutWorkflow);
  const duplicateNode        = useWorkflowStore((s) => s.duplicateNode);
  const deleteNode           = useWorkflowStore((s) => s.deleteNode);
  const selectNode           = useWorkflowStore((s) => s.selectNode);
  const running = useWorkflowStore((s) => s.runs[s.activeProjectId]?.running ?? false);
  const importInputRef = useRef(null);

  useEffect(() => {
    const inInput = () => {
      const tag = document.activeElement?.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || document.activeElement?.isContentEditable;
    };

    const onKey = (e) => {
      const ctrl  = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;
      const key   = e.key.toLowerCase();

      // Ctrl+` — Toggle Terminal
      if (ctrl && e.key === "`") {
        e.preventDefault(); toggleTerminalOpen(); return;
      }
      // Ctrl+Enter — Run Workflow
      if (ctrl && e.key === "Enter") {
        e.preventDefault(); if (!running) startRun(); return;
      }
      // Ctrl+, or Ctrl+K — Open Project Settings
      if (ctrl && !shift && (key === "k" || e.key === ",")) {
        e.preventDefault(); openProjectSettings(); return;
      }
      // Ctrl+B — Toggle Explorer
      if (ctrl && !shift && key === "b") {
        e.preventDefault(); toggleActivePanel("explorer"); return;
      }
      // Ctrl+Shift+K — Toggle Chat
      if (ctrl && shift && key === "k") {
        e.preventDefault(); toggleActivePanel("chat"); return;
      }
      // Ctrl+Shift+L — Auto Layout canvas
      if (ctrl && shift && key === "l") {
        e.preventDefault(); openWorkflowTab(); autoLayoutWorkflow(); return;
      }
      // Ctrl+Shift+N — New Project
      if (ctrl && shift && key === "n") {
        e.preventDefault(); createProject("New Project"); return;
      }
      // Ctrl+D — Duplicate selected node
      if (ctrl && !shift && key === "d") {
        e.preventDefault();
        if (selectedNodeId) { openWorkflowTab(); duplicateNode(selectedNodeId); }
        return;
      }
      // Delete — Delete selected node (not in text field)
      if (e.key === "Delete" && !inInput() && selectedNodeId) {
        e.preventDefault(); deleteNode(selectedNodeId); return;
      }
      // Escape — Clear canvas selection (not in modal, not in text field)
      if (e.key === "Escape" && !inInput() && !settingsModalOpen && selectedNodeId) {
        selectNode("");
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    toggleTerminalOpen, running, startRun, openProjectSettings,
    toggleActivePanel, openWorkflowTab, autoLayoutWorkflow,
    createProject, selectedNodeId, duplicateNode, deleteNode,
    selectNode, settingsModalOpen
  ]);

  useEffect(() => {
    if (!settingsModalOpen) return;
    const handler = (e) => { if (e.key === "Escape") closeSettingsModal(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [settingsModalOpen, closeSettingsModal]);

  const [explorerW, onExplorerDrag]  = useHorizResize(224, 160, 360);
  const [inspectorW, onInspectorDrag] = useHorizResize(320, 240, 480, true);

  function handleImport(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";
    const reader = new FileReader();
    reader.onload = () => {
      try {
        setWorkflow(JSON.parse(reader.result));
        setStatusMessage("Workflow imported.");
      } catch {
        setStatusMessage("Import failed. JSON is invalid.");
      }
    };
    reader.readAsText(file);
  }

  return (
    <main className="flex h-[calc(100vh-48px)] min-h-0 overflow-hidden bg-canvas">
      <input
        ref={importInputRef}
        className="hidden"
        type="file"
        accept="application/json"
        onChange={handleImport}
      />
      {/* Activity bar */}
      <NodePalette
        activePanel={activePanel}
        projectSettingsActive={settingsModalOpen}
        onPanelToggle={toggleActivePanel}
        onProjectSettings={openProjectSettings}
      />

      {/* Explorer / Chat panel — hidden when activePanel is null */}
      {activePanel && (
        <>
          <div style={{ width: explorerW }} className="flex min-w-0 shrink-0 flex-col">
            {activePanel === "chat" ? <ChatPanel /> : <ProjectExplorer />}
          </div>
          <ResizeHandle onMouseDown={onExplorerDrag} />
        </>
      )}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <WorkspaceTabs
          openTabs={openTabIds.map((id) => projects.find((p) => p.id === id)).filter(Boolean)}
          activeProjectId={activeProjectId}
          onSwitchProject={switchProject}
          onCloseTab={closeTab}
          showZoom={activeWorkspaceTab === "workflow"}
        />
        {activeWorkspaceTab !== "workflow" ? (
          <EmptyWorkspace
            workflowName={workflow.name}
            running={running}
            onOpenWorkflow={openWorkflowTab}
            onOpenSettings={openProjectSettings}
            onNewProject={() => createProject("New Project")}
            onImportJson={() => importInputRef.current?.click()}
            onRun={startRun}
          />
        ) : (
          <div className="flex min-h-0 flex-1">
            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              <div className="relative min-h-0 flex-1 overflow-hidden">
                <FlowCanvas />
                {!terminalOpen && (
                  <button
                    className="absolute bottom-3 right-3 z-30 rounded-md border border-hairlineStrong bg-panel/90 px-2.5 py-1 text-[10px] font-semibold text-muted backdrop-blur-sm transition hover:text-ink"
                    onClick={() => setTerminalOpen(true)}
                    title="Open terminal"
                  >
                    Ctrl+`
                  </button>
                )}
              </div>
              {terminalOpen && <OutputPanel onClose={() => setTerminalOpen(false)} />}
            </div>

            <ResizeHandle onMouseDown={onInspectorDrag} />

            <div style={{ width: inspectorW }} className="flex shrink-0 flex-col">
              <RightPanel
                showProject={false}
                onProjectSettings={openProjectSettings}
              />
            </div>
          </div>
        )}
      </div>
      {settingsModalOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]"
            onClick={closeSettingsModal}
          />
          <div className="fixed left-1/2 top-1/2 z-50 flex h-[min(740px,90vh)] w-[min(1080px,92vw)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-hairline bg-canvas shadow-2xl">
            <ProjectSettingsPanel onClose={closeSettingsModal} />
          </div>
        </>
      )}
    </main>
  );
}
