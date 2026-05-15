import { useEffect, useRef, useState } from "react";
import {
  Bot, Check, ChevronDown, Code2, Copy, Crown,
  Download, FileInput, FileOutput, FileText, FolderOpen,
  LayoutDashboard, LogOut, MessageSquare, MousePointerClick,
  Play, Plus, RotateCcw, Search, Server, Settings2,
  Sidebar, Square, Trash2, Upload, User, Wrench, X
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import ProfileModal from "../profile/ProfileModal.jsx";
import { AnimatedThemeToggler } from "../ui/AnimatedThemeToggler.jsx";
import { getWorkflows } from "../../api/workflowApi.js";
import { useWorkflowStore } from "../../store/workflowStore.js";
import { BUILDER_TARGETS, NODE_TYPE_LABELS } from "../../utils/graphUtils.js";

function MenuItem({ item, onClose }) {
  if (item.type === "separator") {
    return <div className="my-1 h-px bg-hairline" />;
  }

  if (item.type === "label") {
    return (
      <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-widest text-muted">
        {item.label}
      </p>
    );
  }

  return (
    <button
      disabled={item.disabled}
      className={`flex h-8 w-full items-center gap-2 px-3 text-left text-[12px] transition disabled:cursor-not-allowed disabled:opacity-40 ${
        item.danger ? "text-error hover:bg-error/10" : "text-ink hover:bg-canvasSoft"
      }`}
      onClick={() => {
        if (item.disabled) return;
        item.action?.();
        onClose();
      }}
    >
      <span className="flex w-3 shrink-0 items-center justify-center">
        {item.checked && <Check size={11} className="text-primary" />}
      </span>
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {item.shortcut && <span className="ml-4 shrink-0 text-[11px] text-muted">{item.shortcut}</span>}
    </button>
  );
}

function AppMenuBar({ menus, openMenu, setOpenMenu, menuRef }) {
  return (
    <nav ref={menuRef} className="flex h-8 items-center gap-0.5">
      {menus.map((menu) => (
        <div key={menu.id} className="relative">
          <button
            className={`rounded px-2 py-1 text-[13px] text-body transition hover:bg-canvasSoft hover:text-ink ${
              openMenu === menu.id ? "bg-canvasSoft text-ink" : ""
            }`}
            onClick={() => setOpenMenu(openMenu === menu.id ? null : menu.id)}
            onMouseEnter={() => { if (openMenu) setOpenMenu(menu.id); }}
          >
            {menu.label}
          </button>
          {openMenu === menu.id && (
            <div className="absolute left-0 top-full z-50 mt-1 max-h-[70vh] w-64 overflow-auto rounded-md border border-hairline bg-panel py-1 shadow-xl">
              {menu.items.map((item, index) => (
                <MenuItem key={`${menu.id}-${index}-${item.label || item.type}`} item={item} onClose={() => setOpenMenu(null)} />
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  );
}

function CommandSearch({ actions }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const cleanQuery = query.trim().toLowerCase();
  const filteredActions = actions
    .filter((action) => {
      if (!cleanQuery) return true;
      const haystack = `${action.label} ${action.detail || ""} ${action.keywords || ""}`.toLowerCase();
      return haystack.includes(cleanQuery);
    })
    .slice(0, 12);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  function runAction(action) {
    action.action?.();
    setQuery("");
    setOpen(false);
  }

  function handleKeyDown(e) {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((index) => Math.min(filteredActions.length - 1, index + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((index) => Math.max(0, index - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredActions[activeIndex]) runAction(filteredActions[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
      e.currentTarget.blur();
    }
  }

  return (
    <div ref={ref} className="relative mx-3 hidden min-w-[260px] max-w-xl flex-1 lg:block">
      <div className="flex h-8 items-center gap-2 rounded-md border border-hairlineStrong bg-panel px-2.5 focus-within:border-primary">
        <Search size={13} className="shrink-0 text-muted" />
        <input
          id="command-search-input"
          className="h-full min-w-0 flex-1 bg-transparent text-[12px] text-ink outline-none placeholder:text-muted"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search actions, workflows, settings, plan options"
        />
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[70vh] overflow-auto rounded-md border border-hairline bg-panel py-1 shadow-xl">
          {filteredActions.length === 0 && (
            <p className="px-3 py-2 text-[12px] text-muted">No matching action.</p>
          )}
          {filteredActions.map((action, index) => (
            <button
              key={`${action.label}-${index}`}
              className={`flex h-9 w-full items-center gap-2 px-3 text-left text-[12px] transition ${
                index === activeIndex ? "bg-canvasSoft text-ink" : "text-body hover:bg-canvasSoft hover:text-ink"
              }`}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => runAction(action)}
            >
              <span className="flex h-4 w-4 shrink-0 items-center justify-center text-muted">
                {action.Icon && <action.Icon size={13} />}
              </span>
              <span className="min-w-0 flex-1 truncate">{action.label}</span>
              {action.shortcut && (
                <span className="shrink-0 rounded border border-hairline bg-canvasSoft px-1.5 py-0.5 font-mono text-[10px] text-muted">
                  {action.shortcut}
                </span>
              )}
              {action.detail && <span className="shrink-0 text-[11px] text-muted">{action.detail}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}


export default function Header() {
  const workflow = useWorkflowStore((state) => state.workflow);
  const setWorkflow = useWorkflowStore((state) => state.setWorkflow);
  const setStatusMessage = useWorkflowStore((state) => state.setStatusMessage);
  const running = useWorkflowStore((state) => state.runs[state.activeProjectId]?.running ?? false);
  const startRun = useWorkflowStore((state) => state.startRun);
  const trace = useWorkflowStore((state) => state.runs[state.activeProjectId]?.trace ?? null);
  const clearTrace = useWorkflowStore((state) => state.clearTrace);
  const selectedNodeId = useWorkflowStore((state) => state.selectedNodeId);
  const projects = useWorkflowStore((state) => state.projects);
  const activeProjectId = useWorkflowStore((state) => state.activeProjectId);
  const createProject = useWorkflowStore((state) => state.createProject);
  const switchProject = useWorkflowStore((state) => state.switchProject);
  const deleteProject = useWorkflowStore((state) => state.deleteProject);
  const saveCurrentToProject = useWorkflowStore((state) => state.saveCurrentToProject);
  const addAgent = useWorkflowStore((state) => state.addAgent);
  const duplicateNode = useWorkflowStore((state) => state.duplicateNode);
  const deleteNode = useWorkflowStore((state) => state.deleteNode);
  const resetWorkflow = useWorkflowStore((state) => state.resetWorkflow);
  const autoLayoutWorkflow = useWorkflowStore((state) => state.autoLayoutWorkflow);
  const selectNode = useWorkflowStore((state) => state.selectNode);
  const focusNode = useWorkflowStore((state) => state.focusNode);
  const activePanel = useWorkflowStore((state) => state.activePanel);
  const setActivePanel = useWorkflowStore((state) => state.setActivePanel);
  const terminalOpen = useWorkflowStore((state) => state.terminalOpen);
  const setTerminalOpen = useWorkflowStore((state) => state.setTerminalOpen);
  const activeWorkspaceTab = useWorkflowStore((state) => state.activeWorkspaceTab);
  const openProjectSettings = useWorkflowStore((state) => state.openProjectSettings);
  const openWorkflowTab = useWorkflowStore((state) => state.openWorkflowTab);
  const createProjectFromWorkflow = useWorkflowStore((state) => state.createProjectFromWorkflow);

  const { data: session } = useSession();

  const [projectOpen, setProjectOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const openDocsTab = useWorkflowStore((s) => s.openDocsTab);
  const [openMenu, setOpenMenu] = useState(null);
  const [serverTemplates, setServerTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const dropdownRef = useRef(null);
  const userMenuRef = useRef(null);
  const menuRef = useRef(null);
  const importInputRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProjectOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenu(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    function handleKeyDown(e) {
      const ctrl = e.ctrlKey || e.metaKey;

      if (e.key === "Escape") {
        setOpenMenu(null); setProfileOpen(false); setUserMenuOpen(false); return;
      }
      if (e.key === "F1") {
        e.preventDefault(); openDocsTab(); return;
      }
      // Ctrl+S — Save project
      if (ctrl && e.key.toLowerCase() === "s") {
        e.preventDefault(); saveCurrentToProject(); return;
      }
      // Ctrl+Shift+P — Focus command search
      if (ctrl && e.shiftKey && e.key.toLowerCase() === "p") {
        e.preventDefault();
        const input = document.getElementById("command-search-input");
        if (input) { input.focus(); input.select(); }
        return;
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [saveCurrentToProject]);

  useEffect(() => {
    if (!projectOpen) return;
    setLoadingTemplates(true);
    getWorkflows()
      .then((wfs) => setServerTemplates(wfs || []))
      .catch(() => setServerTemplates([]))
      .finally(() => setLoadingTemplates(false));
  }, [projectOpen]);

  // Auto-save 1.5 s after the last workflow change
  const autoSaveTimer = useRef(null);
  useEffect(() => {
    if (!activeProjectId) return;
    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      saveCurrentToProject();
    }, 1500);
    return () => clearTimeout(autoSaveTimer.current);
  }, [workflow]);

  function handleExport() {
    const blob = new Blob([JSON.stringify(workflow, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${workflow.name || "workflow"}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

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

  const updateWorkflow = useWorkflowStore((state) => state.updateWorkflow);
  const activeProject = projects.find((p) => p.id === activeProjectId);
  const displayName = activeProject?.name || workflow.name || "Untitled";

  function openImportDialog() {
    importInputRef.current?.click();
  }

  function selectAndFocusNode(id) {
    openWorkflowTab();
    selectNode(id);
    focusNode(id);
  }

  const menuDefinitions = [
    {
      id: "file",
      label: "File",
      items: [
        { label: "New Project", action: () => createProject("New Project") },
        { type: "separator" },
        { label: "Import JSON", action: openImportDialog },
        { label: "Export JSON", action: handleExport },
        ...(projects.length > 0 ? [
          { type: "separator" },
          { type: "label", label: "Projects" },
          ...projects.map((project) => ({
            label: project.name,
            checked: project.id === activeProjectId,
            action: () => switchProject(project.id)
          }))
        ] : []),
        ...(session?.user ? [
          { type: "separator" },
          { label: "Sign Out", action: () => signOut({ callbackUrl: "/login" }) }
        ] : [])
      ]
    },
    {
      id: "edit",
      label: "Edit",
      items: [
        { type: "label", label: "Add Node" },
        { label: "User Input", action: () => addAgent("user_input") },
        { label: "Agent", action: () => addAgent("agent") },
        { label: "Orchestrator", action: () => addAgent("orchestrator") },
        { label: "Final Output", action: () => addAgent("output") },
        { type: "separator" },
        { label: "Duplicate Selected Node", disabled: !selectedNodeId, action: () => duplicateNode(selectedNodeId) },
        { label: "Delete Selected Node", disabled: !selectedNodeId, danger: true, action: () => deleteNode(selectedNodeId) },
        { type: "separator" },
        { label: "Auto Layout", action: autoLayoutWorkflow },
        { label: "Reset Workflow", danger: true, action: resetWorkflow }
      ]
    },
    {
      id: "selection",
      label: "Selection",
      items: [
        { label: "Focus Selected Node", disabled: !selectedNodeId, action: () => focusNode(selectedNodeId) },
        { label: "Clear Selection", disabled: !selectedNodeId, action: () => selectNode("") },
        { type: "separator" },
        { type: "label", label: "Nodes" },
        ...(workflow.nodes.length > 0
          ? workflow.nodes.map((node) => ({
              label: `${node.name} (${NODE_TYPE_LABELS[node.type] || node.type})`,
              checked: node.id === selectedNodeId,
              action: () => selectAndFocusNode(node.id)
            }))
          : [{ type: "label", label: "No nodes" }])
      ]
    },
    {
      id: "view",
      label: "View",
      items: [
        {
          label: "Explorer",
          checked: activePanel === "explorer",
          action: () => setActivePanel(activePanel === "explorer" ? null : "explorer")
        },
        {
          label: "Chat",
          checked: activePanel === "chat",
          action: () => setActivePanel(activePanel === "chat" ? null : "chat")
        },
        {
          label: "Project Settings",
          checked: activeWorkspaceTab === "settings",
          action: openProjectSettings
        }
      ]
    },
    {
      id: "run",
      label: "Run",
      items: [
        { label: running ? "Workflow Running" : "Run Workflow", disabled: running, action: startRun },
        { label: "Clear Run Output", disabled: !trace, action: clearTrace },
        { type: "separator" },
        { type: "label", label: "Builder Target" },
        ...BUILDER_TARGETS.map((target) => ({
          label: target.label,
          checked: workflow.builderTarget === target.id,
          action: () => updateWorkflow({ builderTarget: target.id })
        })),
        ...(workflow.nodes.filter((n) => n.type === "agent" || n.type === "orchestrator").length > 0
          ? [
              { type: "separator" },
              { type: "label", label: "Agent Tools" },
              ...workflow.nodes
                .filter((n) => n.type === "agent" || n.type === "orchestrator")
                .map((node) => {
                  const tc = (node.builtinTools?.length || 0) + (node.customTools?.length || 0);
                  return {
                    label: node.name,
                    shortcut: tc > 0 ? `${tc} tool${tc !== 1 ? "s" : ""}` : "no tools",
                    action: () => selectAndFocusNode(node.id)
                  };
                })
            ]
          : [])
      ]
    },
    {
      id: "terminal",
      label: "Terminal",
      items: [
        {
          label: terminalOpen ? "Hide Terminal" : "Show Terminal",
          shortcut: "Ctrl+`",
          action: () => setTerminalOpen(!terminalOpen)
        },
        { label: "Clear Run Output", disabled: !trace, action: clearTrace }
      ]
    },
    {
      id: "help",
      label: "Help",
      items: [
        { label: "Open Docs",          action: openDocsTab },
        { label: "Getting Started",    action: openDocsTab },
        { label: "Node Types",         action: openDocsTab },
        { label: "AI Providers",       action: openDocsTab },
        { label: "Custom Providers",   action: openDocsTab },
        { label: "Tools",              action: openDocsTab },
        { type: "separator" },
        { label: "Keyboard Shortcuts", shortcut: "F1", action: openDocsTab }
      ]
    }
  ];

  const NODE_ICON = { orchestrator: Crown, agent: Bot, user_input: FileInput, output: FileOutput };

  const commandActions = [
    { label: "Open Workflow Tab",      detail: displayName,        Icon: FileText,    keywords: "workflow canvas graph", action: openWorkflowTab },
    { label: "Open Project Settings",  detail: "Settings",         Icon: Settings2,   shortcut: "Ctrl+K", keywords: "settings project target layout", action: openProjectSettings },
    { label: "Open Plan Options",      detail: "Project Settings", Icon: Settings2,   keywords: "plan constraints steps handoff synthesis parallel", action: openProjectSettings },
    { label: "New Project",            detail: "File",             Icon: Plus,        shortcut: "Ctrl+Shift+N", keywords: "create workflow", action: () => createProject("New Project") },
    { label: "Save Project",           detail: "File",             Icon: Download,    shortcut: "Ctrl+S", keywords: "save sync project", action: saveCurrentToProject },
    { label: "Import JSON",            detail: "File",             Icon: Upload,      keywords: "open workflow json", action: openImportDialog },
    { label: "Export JSON",            detail: "File",             Icon: Download,    keywords: "download workflow json", action: handleExport },
    ...(!running ? [{ label: "Run Workflow", detail: "Run", Icon: Play, shortcut: "Ctrl+Enter", keywords: "start execute", action: startRun }] : []),
    ...(trace ? [{ label: "Clear Run Output", detail: "Terminal", Icon: Square, keywords: "logs output trace", action: clearTrace }] : []),
    {
      label: terminalOpen ? "Hide Terminal" : "Show Terminal",
      detail: "Terminal", Icon: Code2, shortcut: "Ctrl+`",
      keywords: "console output logs",
      action: () => setTerminalOpen(!terminalOpen)
    },
    {
      label: activePanel === "explorer" ? "Hide Explorer" : "Show Explorer",
      detail: "View", Icon: Sidebar, shortcut: "Ctrl+B",
      keywords: "sidebar projects files",
      action: () => setActivePanel(activePanel === "explorer" ? null : "explorer")
    },
    {
      label: activePanel === "chat" ? "Hide Chat" : "Show Chat",
      detail: "View", Icon: MessageSquare, shortcut: "Ctrl+Shift+K",
      keywords: "quick chat workflow",
      action: () => setActivePanel(activePanel === "chat" ? null : "chat")
    },
    { label: "Add User Input Node",   detail: "Edit", Icon: FileInput,  keywords: "prompt input node",      action: () => { openWorkflowTab(); addAgent("user_input"); } },
    { label: "Add Agent Node",        detail: "Edit", Icon: Bot,        keywords: "agent node",              action: () => { openWorkflowTab(); addAgent("agent"); } },
    { label: "Add Orchestrator Node", detail: "Edit", Icon: Crown,      keywords: "orchestrator node",       action: () => { openWorkflowTab(); addAgent("orchestrator"); } },
    { label: "Add Final Output Node", detail: "Edit", Icon: FileOutput, keywords: "output node",             action: () => { openWorkflowTab(); addAgent("output"); } },
    ...(selectedNodeId ? [
      { label: "Duplicate Selected Node", detail: "Edit",      Icon: Copy,               shortcut: "Ctrl+D", keywords: "copy node",     action: () => { openWorkflowTab(); duplicateNode(selectedNodeId); } },
      { label: "Delete Selected Node",    detail: "Edit",      Icon: Trash2,             shortcut: "Del",    keywords: "remove node",   action: () => { openWorkflowTab(); deleteNode(selectedNodeId); } },
      { label: "Focus Selected Node",     detail: "Selection", Icon: MousePointerClick,  keywords: "jump node",     action: () => { openWorkflowTab(); focusNode(selectedNodeId); } },
      { label: "Clear Selection",         detail: "Selection", Icon: X,                  shortcut: "Esc",    keywords: "deselect node", action: () => selectNode("") }
    ] : []),
    { label: "Auto Layout Workflow", detail: "Edit", Icon: LayoutDashboard, shortcut: "Ctrl+Shift+L", keywords: "arrange graph canvas",  action: () => { openWorkflowTab(); autoLayoutWorkflow(); } },
    { label: "Reset Workflow",       detail: "Edit", Icon: RotateCcw,                                  keywords: "clear default workflow", action: () => { openWorkflowTab(); resetWorkflow(); } },
    ...BUILDER_TARGETS.map((target) => ({
      label: `Set Builder Target: ${target.label}`,
      detail: "Run", Icon: Server,
      keywords: `builder target ${target.id}`,
      action: () => updateWorkflow({ builderTarget: target.id })
    })),
    ...workflow.nodes
      .filter((n) => n.type === "agent" || n.type === "orchestrator")
      .map((node) => {
        const tc = (node.builtinTools?.length || 0) + (node.customTools?.length || 0);
        return {
          label: `Configure Tools: ${node.name}`,
          detail: tc > 0 ? `${tc} tool${tc !== 1 ? "s" : ""}` : "no tools",
          Icon: Wrench,
          keywords: "tools functions api agent",
          action: () => selectAndFocusNode(node.id)
        };
      }),
    ...projects.map((project) => ({
      label: `Open Project: ${project.name}`,
      detail: project.id === activeProjectId ? "Active" : "Project",
      Icon: FolderOpen,
      keywords: "switch project workflow",
      action: () => { switchProject(project.id); openWorkflowTab(); }
    })),
    ...workflow.nodes.map((node) => ({
      label: `Open Node: ${node.name}`,
      detail: NODE_TYPE_LABELS[node.type] || node.type,
      Icon: NODE_ICON[node.type] || Bot,
      keywords: "select focus node workflow",
      action: () => selectAndFocusNode(node.id)
    })),
    ...(session?.user ? [{ label: "Sign Out", detail: session.user.email, Icon: LogOut, keywords: "logout account", action: () => signOut({ callbackUrl: "/login" }) }] : [])
  ];

  return (
    <>
    <header className="flex h-12 items-center gap-0 border-b border-hairline bg-canvas px-4">
      <input
        ref={importInputRef}
        className="hidden"
        type="file"
        accept="application/json"
        onChange={handleImport}
      />
      <div className="flex shrink-0 items-center gap-5">
        <svg width="104" height="19" viewBox="0 0 65 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
          <path d="M4.56445 2.81836L1.66992 11.6777H0L3.94336 0.181641H6.2168L5.68945 11.6777H4.01367L4.56445 2.81836ZM9.99023 6.62109H12.3223L11.7715 9.44531C11.459 11.0547 10.5078 11.8613 8.91797 11.8652C7.33203 11.8652 6.69531 11.0586 7.00781 9.44531L8.37891 2.41406C8.69141 0.804687 9.64062 0 11.2266 0C12.8164 0 13.4551 0.804687 13.1426 2.41406L12.8379 3.96094H11.1797L11.4844 2.41406C11.582 1.89844 11.3906 1.63867 10.9102 1.63477H10.8984C10.4219 1.63477 10.1348 1.89453 10.0371 2.41406L8.66602 9.44531C8.56445 9.96484 8.75391 10.2246 9.23438 10.2246C9.71875 10.2246 10.0117 9.96484 10.1133 9.44531L10.3477 8.26172H9.67383L9.99023 6.62109ZM14.9824 0.181641H19.2832L18.9668 1.81641H16.3242L15.3867 6.63867H17.6602L17.3438 8.2793H15.0703L14.7246 10.043H17.3672L17.0508 11.6777H12.75L14.9824 0.181641ZM20.5137 0.181641H22.1719L22.4473 6.84961L23.7422 0.181641H25.2773L23.0449 11.6777H21.3867L21.1289 5.2207L19.875 11.6777H18.2812L20.5137 0.181641ZM31.1016 0.181641L30.7852 1.81641H29.2324L27.3164 11.6777H25.6582L27.5742 1.81641H26.0215L26.3379 0.181641H31.1016Z" fill="#E60000"/>
          <path d="M32.1621 0.181641H34.7168C36.1895 0.185547 36.7695 0.992187 36.457 2.60156L35.1621 9.26367C34.8496 10.8691 33.9219 11.6738 32.3789 11.6777H29.9297L32.1621 0.181641ZM33.5039 1.81641L31.9043 10.043H32.6309C33.1113 10.043 33.4023 9.7832 33.5039 9.26367L34.7988 2.60156C34.9004 2.07813 34.7109 1.81641 34.2305 1.81641H33.5039ZM38.3379 0.181641H40.752C42.2246 0.185547 42.8047 0.992187 42.4922 2.60156L41.8594 5.85938C41.6641 6.87109 41.0996 7.53711 40.166 7.85742L41.2852 11.6777H39.4688L38.6602 8.15039L38.4434 8.17969L37.7637 11.6777H36.1055L38.3379 0.181641ZM39.6797 1.81641L38.7422 6.63867H39.123C39.3535 6.63867 39.5156 6.62305 39.6094 6.5918C39.9336 6.4707 40.1309 6.22656 40.2012 5.85938L40.834 2.60156C40.9355 2.07813 40.7461 1.81641 40.2656 1.81641H39.6797ZM44.4844 0.181641H46.1426L43.9102 11.6777H42.252L44.4844 0.181641ZM48.9258 11.6777H46.6523L46.9219 4.24805L47.1738 0.181641H48.8496L48.293 9.04102L51.1875 0.181641H52.8633L51.5332 4.25977L48.9258 11.6777ZM53.8652 0.181641H58.166L57.8496 1.81641H55.207L54.2695 6.63867H56.543L56.2266 8.2793H53.9531L53.6074 10.043H56.25L55.9336 11.6777H51.6328L53.8652 0.181641ZM59.3965 0.181641H61.8105C63.2832 0.185547 63.8633 0.992187 63.5508 2.60156L62.918 5.85938C62.7227 6.87109 62.1582 7.53711 61.2246 7.85742L62.3438 11.6777H60.5273L59.7188 8.15039L59.502 8.17969L58.8223 11.6777H57.1641L59.3965 0.181641ZM60.7383 1.81641L59.8008 6.63867H60.1816C60.4121 6.63867 60.5742 6.62305 60.668 6.5918C60.9922 6.4707 61.1895 6.22656 61.2598 5.85938L61.8926 2.60156C61.9941 2.07813 61.8047 1.81641 61.3242 1.81641H60.7383Z" fill="currentColor"/>
        </svg>

        <AppMenuBar
          menus={menuDefinitions}
          openMenu={openMenu}
          setOpenMenu={(menuId) => {
            setProjectOpen(false);
            setUserMenuOpen(false);
            setOpenMenu(menuId);
          }}
          menuRef={menuRef}
        />

      </div>

      {/* Centered search */}
      <div className="flex flex-1 justify-center px-4">
        <CommandSearch actions={commandActions} />
      </div>

      <div className="flex shrink-0 items-center gap-2">

        {/* Project switcher — near Run */}
        <div className="relative" ref={dropdownRef}>
          <button
            className="flex items-center gap-1.5 rounded-md border border-hairlineStrong bg-panel px-3 py-1.5 text-[12px] font-medium text-ink transition hover:border-primary/40 hover:bg-canvasSoft"
            onClick={() => setProjectOpen(!projectOpen)}
          >
            <span className="max-w-[160px] truncate">{displayName}</span>
            <ChevronDown size={11} className="shrink-0 text-muted" />
          </button>

          {projectOpen && (
            <div className="absolute right-0 top-full z-50 mt-1.5 w-56 rounded-xl border border-hairline bg-panel shadow-xl">
              <div className="p-1">
                {projects.length === 0 && (
                  <p className="px-3 py-2 text-xs text-muted">No saved projects yet.</p>
                )}
                {projects.map((proj) => (
                  <div key={proj.id} className="group flex items-center rounded-lg px-2 py-1.5 hover:bg-canvasSoft">
                    <button
                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                      onClick={() => { switchProject(proj.id); setProjectOpen(false); }}
                    >
                      {proj.id === activeProjectId
                        ? <Check size={11} className="shrink-0 text-primary" />
                        : <span className="w-[11px] shrink-0" />
                      }
                      <span className="truncate text-xs text-ink">{proj.name}</span>
                    </button>
                    <button
                      className="ml-1 hidden shrink-0 text-muted transition hover:text-error group-hover:block"
                      onClick={() => deleteProject(proj.id)}
                      title="Delete project"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="border-t border-hairline p-1">
                <button className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-muted transition hover:bg-canvasSoft hover:text-ink"
                  onClick={() => { createProject("New Project"); setProjectOpen(false); }}>
                  <Plus size={11} /> New Project
                </button>
                <button className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-muted transition hover:bg-canvasSoft hover:text-ink"
                  onClick={() => { handleExport(); setProjectOpen(false); }}>
                  <Download size={11} /> Export JSON
                </button>
                <button className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-muted transition hover:bg-canvasSoft hover:text-ink"
                  onClick={() => { openImportDialog(); setProjectOpen(false); }}>
                  <Upload size={11} /> Import JSON
                </button>
              </div>
              {(loadingTemplates || serverTemplates.length > 0) && (
                <div className="border-t border-hairline p-1">
                  <p className="px-2 pb-1 pt-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted">Server Templates</p>
                  {loadingTemplates && <p className="px-3 py-1.5 text-xs text-muted">Loading…</p>}
                  {serverTemplates.map((tpl) => {
                    const alreadyLoaded = projects.some((p) => p.workflow?.id === tpl.id || p.name === tpl.name);
                    return (
                      <button key={tpl.id} disabled={alreadyLoaded}
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition hover:bg-canvasSoft disabled:cursor-not-allowed disabled:opacity-40"
                        onClick={() => { createProjectFromWorkflow(tpl); setProjectOpen(false); }}>
                        <Server size={11} className="shrink-0 text-muted" />
                        <span className="truncate text-ink">{tpl.name}</span>
                        {alreadyLoaded && <span className="ml-auto text-[10px] text-muted">loaded</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <AnimatedThemeToggler />

        <div className="h-5 w-px bg-hairlineStrong" />

        <button
          className="btn-primary h-8 px-4 text-xs"
          onClick={startRun}
          disabled={running}
          title="Run workflow"
        >
          {running
            ? <><Square size={11} fill="currentColor" /> Running…</>
            : <><Play size={11} fill="currentColor" /> Run</>
          }
        </button>

        {/* User avatar */}
        {session?.user && (
          <div className="relative ml-1" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen((o) => !o)}
              className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border border-hairlineStrong focus:outline-none"
              title={session.user.name || session.user.email}
            >
              {session.user.image
                ? <img src={session.user.image} alt={session.user.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                : <span className="text-[11px] font-semibold text-ink uppercase">{(session.user.name || session.user.email || "?")[0]}</span>
              }
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-full z-50 mt-1.5 w-56 rounded-xl border border-hairline bg-panel shadow-xl">
                {/* Identity */}
                <div className="flex items-center gap-3 px-3 py-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-hairlineStrong bg-primary text-[12px] font-bold text-white">
                    {session.user.image
                      ? <img src={session.user.image} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                      : (session.user.name || session.user.email || "?").trim().split(/\s+/).map((w) => w[0]).join("").toUpperCase().slice(0, 2)
                    }
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-semibold text-ink">{session.user.name}</p>
                    <p className="truncate text-[11px] text-muted">{session.user.email}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="border-t border-hairline p-1">
                  <button
                    onClick={() => { setProfileOpen(true); setUserMenuOpen(false); }}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[12px] text-body transition hover:bg-canvasSoft hover:text-ink"
                  >
                    <User size={13} /> View profile
                  </button>
                  <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[12px] text-error transition hover:bg-error/8"
                  >
                    <LogOut size={13} /> Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>

    {profileOpen && <ProfileModal onClose={() => setProfileOpen(false)} />}
</>
  );
}
