import { useCallback, useEffect, useRef, useState } from "react";
import { BookOpen, Bot, Code2, Crown, FileInput, FileJson, FileOutput, FileText, Maximize2, Minus, Play, Plus, Settings2, X, ZoomIn } from "lucide-react";
import ChatPanel from "../chat/ChatPanel.jsx";
import ProjectExplorer from "../explorer/ProjectExplorer.jsx";
import CanvasToolbar from "../flow/CanvasToolbar.jsx";
import FlowCanvas from "../flow/FlowCanvas.jsx";
import AgentDetailView from "../flow/AgentDetailView.jsx";
import OutputPanel from "../output/OutputPanel.jsx";
import NodePalette from "./NodePalette.jsx";
import RightPanel from "./RightPanel.jsx";
import UnifiedSettingsPanel from "../settings/UnifiedSettingsPanel.jsx";
import DocsPage from "../docs/DocsPage.jsx";
import { useWorkflowStore } from "../../store/workflowStore.js";

// WorkflowCodePanel (was in RightPanel, now a special tab)
import { useEffect as useEff, useRef as useR, useState as useS } from "react";
import hljs from "highlight.js/lib/core";
import json from "highlight.js/lib/languages/json";
import "highlight.js/styles/github.css";
import { Check } from "lucide-react";
import { localMermaidFromGraph } from "../../utils/mermaidUtils.js";
hljs.registerLanguage("json", json);

const CODE_TABS = [
  { id: "mermaid", label: "Mermaid" },
  { id: "json",    label: "JSON"    },
];

function WorkflowCodeView() {
  const workflow   = useWorkflowStore((s) => s.workflow);
  const [sub, setSub]       = useS("mermaid");
  const [copied, setCopied] = useS(false);
  const codeRef = useR(null);

  const mermaid = localMermaidFromGraph(workflow);
  const jsonStr = JSON.stringify(workflow, null, 2);
  const code    = sub === "mermaid" ? mermaid : jsonStr;
  const lang    = sub === "mermaid" ? "plaintext" : "json";

  useEff(() => {
    if (!codeRef.current) return;
    codeRef.current.removeAttribute("data-highlighted");
    codeRef.current.textContent = code;
    codeRef.current.className = `language-${lang} !bg-transparent font-mono`;
    if (lang === "json") hljs.highlightElement(codeRef.current);
  }, [code, lang]);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* unavailable */ }
  }

  return (
    <div className="flex h-full flex-col bg-canvas">
      <div className="flex shrink-0 items-center justify-between border-b border-hairline bg-panel px-4 py-2">
        <div className="flex gap-1">
          {CODE_TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setSub(id)}
              className={`rounded px-3 py-1 text-[12px] font-semibold transition ${sub === id ? "bg-canvasSoft text-ink" : "text-muted hover:text-ink"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          className="flex items-center gap-1.5 rounded-md border border-hairlineStrong bg-canvasSoft px-2.5 py-1.5 text-[12px] font-semibold text-muted transition hover:text-ink"
          onClick={copyCode}
        >
          {copied ? <><Check size={13} /> Copied</> : "Copy"}
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto bg-canvasSoft p-6">
        <pre className="m-0 bg-transparent p-0 text-[12.5px] leading-relaxed">
          <code ref={codeRef} className={`language-${lang} !bg-transparent font-mono`} />
        </pre>
      </div>
      <div className="shrink-0 border-t border-hairline bg-panel px-4 py-2">
        <span className="rounded-full border border-hairlineStrong bg-canvasSoft px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
          {workflow.builderTarget === "langchain" ? "LangChain" : "LangGraph"} · {workflow.nodes.length} nodes
        </span>
      </div>
    </div>
  );
}

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

function SpecialTab({ label, icon: Icon, active, onClick, onClose, italic = false }) {
  return (
    <div className="relative flex shrink-0">
      <button
        className={`group relative flex h-9 min-w-0 items-center gap-2 border-r border-hairline pr-7 pl-3 text-[12px] transition ${
          active ? "bg-canvas text-ink" : "bg-panel text-muted hover:bg-canvasSoft hover:text-ink"
        }`}
        onClick={onClick}
      >
        {Icon && <Icon size={13} className="shrink-0" />}
        <span className={italic ? "italic" : ""}>{label}</span>
        {active && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary" />}
      </button>
      <button
        className={`absolute right-1 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded text-muted transition hover:!opacity-100 hover:bg-surfaceStrong hover:text-ink ${active ? "opacity-70" : "opacity-0 group-hover:opacity-70"}`}
        onClick={(e) => { e.stopPropagation(); onClose(); }}
      >
        <X size={11} />
      </button>
    </div>
  );
}

function nodeTabIcon(type) {
  if (type === "orchestrator") return <Crown size={13} className="shrink-0" />;
  if (type === "user_input")   return <FileInput size={13} className="shrink-0" />;
  if (type === "output")       return <FileOutput size={13} className="shrink-0" />;
  return <Bot size={13} className="shrink-0" />;
}

function WorkspaceTabs({ openTabs, activeProjectId, onSwitchProject, onCloseTab, onNewProject }) {
  const activeWorkspaceTab = useWorkflowStore((s) => s.activeWorkspaceTab);
  const settingsTabOpen   = useWorkflowStore((s) => s.settingsTabOpen);
  const docsTabOpen       = useWorkflowStore((s) => s.docsTabOpen);
  const codeTabOpen       = useWorkflowStore((s) => s.codeTabOpen);
  const agentTabIds       = useWorkflowStore((s) => s.agentTabIds);
  const workflow          = useWorkflowStore((s) => s.workflow);
  const openSettings      = useWorkflowStore((s) => s.openSettings);
  const closeSettings     = useWorkflowStore((s) => s.closeSettings);
  const openDocsTab         = useWorkflowStore((s) => s.openDocsTab);
  const closeDocsTab        = useWorkflowStore((s) => s.closeDocsTab);
  const openCodeTab         = useWorkflowStore((s) => s.openCodeTab);
  const closeCodeTab        = useWorkflowStore((s) => s.closeCodeTab);
  const openAgentTab        = useWorkflowStore((s) => s.openAgentTab);
  const closeAgentTab       = useWorkflowStore((s) => s.closeAgentTab);

  const tabClass = (active) =>
    `group relative flex h-9 min-w-0 items-center gap-2 border-r border-hairline px-3 text-[12px] transition ${
      active ? "bg-canvas text-ink" : "bg-panel text-muted hover:bg-canvasSoft hover:text-ink"
    }`;

  return (
    <div className="flex h-9 shrink-0 items-stretch border-b border-hairline bg-panel">
      <div className="flex min-w-0 flex-1 items-stretch overflow-x-auto">
        {openTabs.map((proj) => {
          const active = proj.id === activeProjectId && activeWorkspaceTab === "workflow";
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
                className={`absolute right-1 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded text-muted transition hover:!opacity-100 hover:bg-surfaceStrong hover:text-ink ${active ? "opacity-70" : "opacity-0 group-hover:opacity-70"}`}
                onClick={(e) => { e.stopPropagation(); onCloseTab(proj.id); }}
                title="Close tab"
              >
                <X size={11} />
              </button>
            </div>
          );
        })}
        {settingsTabOpen && (
          <SpecialTab
            label="Settings"
            icon={Settings2}
            active={activeWorkspaceTab === "settings"}
            onClick={openSettings}
            onClose={closeSettings}
            italic
          />
        )}
        {docsTabOpen && (
          <SpecialTab
            label="Documentation"
            icon={BookOpen}
            active={activeWorkspaceTab === "docs"}
            onClick={openDocsTab}
            onClose={closeDocsTab}
            italic
          />
        )}
        {codeTabOpen && (
          <SpecialTab
            label="Workflow Code"
            icon={Code2}
            active={activeWorkspaceTab === "code"}
            onClick={openCodeTab}
            onClose={closeCodeTab}
          />
        )}
        {/* Agent detail tabs */}
        {agentTabIds.map((agentId) => {
          const agentNode = workflow.nodes.find((n) => n.id === agentId);
          if (!agentNode) return null;
          const tabActive = activeWorkspaceTab === `agent:${agentId}`;
          return (
            <div key={agentId} className="relative flex shrink-0">
              <button
                className={`${tabClass(tabActive)} pr-7`}
                onClick={() => openAgentTab(agentId)}
                title={agentNode.name}
              >
                {nodeTabIcon(agentNode.type)}
                <span className="max-w-[140px] truncate">{agentNode.name}</span>
                {tabActive && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary" />}
              </button>
              <button
                className={`absolute right-1 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded text-muted transition hover:!opacity-100 hover:bg-surfaceStrong hover:text-ink ${tabActive ? "opacity-70" : "opacity-0 group-hover:opacity-70"}`}
                onClick={(e) => { e.stopPropagation(); closeAgentTab(agentId); }}
                title="Close agent tab"
              >
                <X size={11} />
              </button>
            </div>
          );
        })}
        {/* New-project "+" tab button */}
        <button
          className="flex h-9 w-9 shrink-0 items-center justify-center text-muted transition hover:bg-canvasSoft hover:text-ink"
          onClick={onNewProject}
          title="New project (Ctrl+Shift+N)"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Zoom moved to CanvasToolbar */}
    </div>
  );
}

function EmptyWorkspace({ workflowName, hasActiveProject, running, onOpenWorkflow, onOpenSettings, onNewProject, onImportJson, onRun }) {
  const actions = [
    ...(hasActiveProject
      ? [
          { label: "Open Workflow", detail: workflowName || "Workflow canvas", Icon: FileText, action: onOpenWorkflow },
          { label: "Open Project Settings", detail: "Settings and plan options", Icon: Settings2, action: onOpenSettings },
          ...(!running ? [{ label: "Run Workflow", detail: "Execute current workflow", Icon: Play, action: onRun }] : [])
        ]
      : []),
    { label: "New Project", detail: "Create a fresh empty workflow", Icon: Plus, action: onNewProject },
    { label: "Import JSON", detail: "Load a workflow from file", Icon: FileJson, action: onImportJson },
  ];

  return (
    <div className="flex min-h-0 flex-1 items-center justify-center bg-canvas px-8">
      <div className="w-full max-w-lg -mt-12">
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
  const toggleActivePanel = useWorkflowStore((s) => s.toggleActivePanel);
  const setTerminalOpen = useWorkflowStore((s) => s.setTerminalOpen);
  const toggleTerminalOpen = useWorkflowStore((s) => s.toggleTerminalOpen);
  const closeSettings = useWorkflowStore((s) => s.closeSettings);
  const projects = useWorkflowStore((s) => s.projects);
  const activeProjectId = useWorkflowStore((s) => s.activeProjectId);
  const openTabIds = useWorkflowStore((s) => s.openTabIds);
  const createProject = useWorkflowStore((s) => s.createProject);
  const switchProject = useWorkflowStore((s) => s.switchProject);
  const closeTab = useWorkflowStore((s) => s.closeTab);
  const startRun = useWorkflowStore((s) => s.startRun);
  const openSettings         = useWorkflowStore((s) => s.openSettings);
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
      // Ctrl+, — Open Settings
      if (ctrl && !shift && e.key === ",") {
        e.preventDefault(); openSettings(); return;
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
      // Escape — Clear canvas selection (not in text field, not on settings/docs tab)
      if (e.key === "Escape" && !inInput() && activeWorkspaceTab === "workflow" && selectedNodeId) {
        selectNode("");
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    toggleTerminalOpen, running, startRun, openSettings,
    toggleActivePanel, openWorkflowTab, autoLayoutWorkflow,
    createProject, selectedNodeId, duplicateNode, deleteNode,
    selectNode, activeWorkspaceTab
  ]);

  const [explorerW, onExplorerDrag]  = useHorizResize(236, 160, 360);
  const [inspectorW, onInspectorDrag] = useHorizResize(320, 240, 480, true);
  const workspaceShellClass =
    activeWorkspaceTab === "settings" || activeWorkspaceTab === "docs"
      ? "bg-canvas"
      : "bg-canvas";

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
    <main className={`flex h-[calc(100vh-48px)] min-h-0 overflow-hidden ${workspaceShellClass}`}>
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
        settingsActive={activeWorkspaceTab === "settings"}
        onPanelToggle={toggleActivePanel}
        onSettings={openSettings}
      />

      {/* Explorer / Chat panel — hidden when activePanel is null */}
      {activePanel && (
        <>
          <div style={{ width: explorerW }} className="flex min-w-0 shrink-0 flex-col">
            {activePanel === "chat"
              ? <ChatPanel />
              : <ProjectExplorer />}
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
          onNewProject={() => createProject("New Project")}
        />
        {activeWorkspaceTab === "workflow" && activeProjectId && openTabIds.includes(activeProjectId) ? (
          <div className="flex min-h-0 flex-1">
            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              <CanvasToolbar />
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
              <RightPanel showProject={false} onProjectSettings={openSettings} />
            </div>
          </div>
        ) : activeWorkspaceTab === "settings" ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-canvas">
            <UnifiedSettingsPanel onClose={closeSettings} />
          </div>
        ) : activeWorkspaceTab === "docs" ? (
          <div className="flex min-h-0 flex-1 overflow-hidden bg-canvas">
            <DocsPage />
          </div>
        ) : activeWorkspaceTab === "code" ? (
          <div className="flex min-h-0 flex-1 overflow-hidden">
            <WorkflowCodeView />
          </div>
        ) : activeWorkspaceTab?.startsWith("agent:") ? (
          <div className="flex min-h-0 flex-1 overflow-hidden">
            <AgentDetailView
              agentId={activeWorkspaceTab.slice(6)}
              onClose={() => useWorkflowStore.getState().closeAgentTab(activeWorkspaceTab.slice(6))}
            />
          </div>
        ) : (
          <EmptyWorkspace
            workflowName={workflow.name}
            hasActiveProject={!!activeProjectId}
            running={running}
            onOpenWorkflow={openWorkflowTab}
            onOpenSettings={openSettings}
            onNewProject={() => createProject("New Project")}
            onImportJson={() => importInputRef.current?.click()}
            onRun={startRun}
          />
        )}
      </div>
    </main>
  );
}
