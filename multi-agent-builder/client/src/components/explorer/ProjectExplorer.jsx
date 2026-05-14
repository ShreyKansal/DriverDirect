import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bot, ChevronDown, ChevronRight, Crown,
  FileInput, FileOutput, FolderOpen, Layers,
  Link2, Plus, Trash2
} from "lucide-react";
import { useWorkflowStore } from "../../store/workflowStore.js";
import ContextMenu from "./ContextMenu.jsx";

// ─── helpers ──────────────────────────────────────────────────────────────────

function nodeIcon(type, size = 15) {
  if (type === "orchestrator") return <Crown size={size} className="text-body" />;
  if (type === "user_input")   return <FileInput size={size} className="text-muted" />;
  if (type === "output")       return <FileOutput size={size} className="text-muted" />;
  return <Bot size={size} className="text-muted" />;
}

const NODE_TYPE_LABEL = {
  user_input:   "Input",
  orchestrator: "Orchestrator",
  agent:        "Agent",
  output:       "Output"
};

// CTA buttons for adding nodes — shown at the top of the active project
const ADD_CTALS = [
  { type: "agent",        Icon: Bot,        label: "Agent",        primary: true  },
  { type: "orchestrator", Icon: Crown,       label: "Orchestrator", primary: false },
  { type: "user_input",   Icon: FileInput,   label: "User Input",   primary: false },
  { type: "output",       Icon: FileOutput,  label: "Output",       primary: false },
];

// ─── rows ─────────────────────────────────────────────────────────────────────

function NodeRow({ node, isSelected, onContextMenu }) {
  const selectNode = useWorkflowStore((s) => s.selectNode);
  const focusNode  = useWorkflowStore((s) => s.focusNode);

  return (
    <div
      className={`group flex h-7 cursor-pointer items-center gap-2 rounded-sm px-2 text-[13px] transition-colors ${
        isSelected ? "bg-[#faf4ec] text-ink" : "text-body hover:bg-canvasSoft hover:text-ink"
      }`}
      onClick={(e) => { e.stopPropagation(); selectNode(node.id); focusNode(node.id); }}
      onContextMenu={(e) => { e.preventDefault(); onContextMenu(e, "node", node); }}
    >
      <span className="shrink-0">{nodeIcon(node.type)}</span>
      <span className="min-w-0 flex-1 truncate">{node.name}</span>
      <span className="shrink-0 text-[11px] text-muted opacity-0 transition group-hover:opacity-100">
        {NODE_TYPE_LABEL[node.type]}
      </span>
    </div>
  );
}

function EdgeRow({ edge, nodeById, onContextMenu }) {
  const src = nodeById.get(edge.source);
  const tgt = nodeById.get(edge.target);
  if (!src || !tgt) return null;
  return (
    <div
      className="flex h-7 cursor-default items-center gap-2 rounded-sm px-2 text-[12px] text-muted hover:bg-canvasSoft"
      onContextMenu={(e) => { e.preventDefault(); onContextMenu(e, "edge", edge); }}
    >
      <Link2 size={13} className="shrink-0" />
      <span className="truncate">{src.name} → {tgt.name}</span>
    </div>
  );
}

// ─── project row ──────────────────────────────────────────────────────────────

function AddNodeDropdown({ addAgent }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function close(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        className="flex h-6 w-6 items-center justify-center rounded-sm text-muted transition hover:bg-canvasSoft hover:text-ink"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        title="Add node"
      >
        <Plus size={15} className="shrink-0" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-md border border-hairline bg-panel py-1 shadow-lg">
          {ADD_CTALS.map(({ type, Icon, label }) => (
            <button
              key={type}
              className="flex h-8 w-full items-center gap-2 px-3 text-[13px] text-body transition-colors hover:bg-canvasSoft hover:text-ink"
              onClick={(e) => { e.stopPropagation(); addAgent(type); setOpen(false); }}
            >
              <Icon size={14} className="shrink-0 text-muted" />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectRow({ project, isActive, selectedNodeId, onContextMenu }) {
  const switchProject = useWorkflowStore((s) => s.switchProject);
  const addAgent      = useWorkflowStore((s) => s.addAgent);
  const [nodesOpen, setNodesOpen] = useState(true);
  const [edgesOpen, setEdgesOpen] = useState(false);

  const { workflow } = project;
  const nodes    = workflow?.nodes || [];
  const edges    = workflow?.edges || [];
  const nodeById = new Map(nodes.map((n) => [n.id, n]));

  return (
    <div>
      {/* Project header row */}
      <div
        className={`group flex h-7 cursor-pointer items-center gap-1.5 rounded-sm px-1 text-[13px] font-semibold transition-colors ${
          isActive ? "text-ink" : "text-body hover:bg-canvasSoft hover:text-ink"
        }`}
        onClick={(e) => { e.stopPropagation(); if (!isActive) switchProject(project.id); }}
        onContextMenu={(e) => { e.preventDefault(); onContextMenu(e, "project", project); }}
      >
        <ChevronDown size={14} className={`shrink-0 transition-transform ${isActive ? "" : "-rotate-90"}`} />
        <FolderOpen size={15} className="shrink-0 text-muted" />
        <span className="min-w-0 flex-1 truncate">{project.name}</span>
      </div>

      {/* Active project content */}
      {isActive && (
        <div className="ml-3 border-l border-hairline pl-2">

          {/* ── Nodes list ── */}
          <div className="group flex h-7 items-center">
            <button
              className="flex min-w-0 flex-1 items-center gap-1.5 text-left text-[11px] font-bold uppercase tracking-wider text-muted hover:text-ink"
              onClick={() => setNodesOpen((v) => !v)}
            >
              {nodesOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              Nodes ({nodes.length})
            </button>
            <AddNodeDropdown addAgent={addAgent} />
          </div>

          {nodesOpen && (
            <div className="space-y-0.5 py-0.5">
              {nodes.length === 0 ? (
                <p className="px-2 py-1.5 text-[12px] text-muted">No nodes yet.</p>
              ) : (
                nodes.map((node) => (
                  <NodeRow
                    key={node.id}
                    node={node}
                    isSelected={node.id === selectedNodeId}
                    onContextMenu={onContextMenu}
                  />
                ))
              )}
            </div>
          )}

          {/* ── Edges list ── */}
          {edges.length > 0 && (
            <>
              <button
                className="mt-1 flex h-7 w-full items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted hover:text-ink"
                onClick={() => setEdgesOpen((v) => !v)}
              >
                {edgesOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                Connections ({edges.length})
              </button>
              {edgesOpen && (
                <div className="space-y-0.5 py-0.5">
                  {edges.map((edge) => (
                    <EdgeRow key={edge.id} edge={edge} nodeById={nodeById} onContextMenu={onContextMenu} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-hairlineStrong bg-canvasSoft">
        <Layers size={21} className="text-muted" />
      </div>
      <div>
        <p className="text-[14px] font-semibold text-ink">No projects yet</p>
      </div>
    </div>
  );
}

// ─── main ─────────────────────────────────────────────────────────────────────

export default function ProjectExplorer() {
  const projects        = useWorkflowStore((s) => s.projects);
  const activeProjectId = useWorkflowStore((s) => s.activeProjectId);
  const selectedNodeId  = useWorkflowStore((s) => s.selectedNodeId);
  const createProject   = useWorkflowStore((s) => s.createProject);
  const deleteProject   = useWorkflowStore((s) => s.deleteProject);
  const renameProject   = useWorkflowStore((s) => s.renameProject);
  const switchProject   = useWorkflowStore((s) => s.switchProject);
  const duplicateNode   = useWorkflowStore((s) => s.duplicateNode);
  const deleteNode      = useWorkflowStore((s) => s.deleteNode);
  const selectNode      = useWorkflowStore((s) => s.selectNode);
  const focusNode       = useWorkflowStore((s) => s.focusNode);
  const removeEdge      = useWorkflowStore((s) => s.removeEdge);

  const [menu, setMenu] = useState(null);
  const closeMenu = useCallback(() => setMenu(null), []);

  function onContextMenu(e, type, target) {
    e.stopPropagation();
    let items = [];

    if (type === "project") {
      items = [
        { label: "Switch to Project", action: () => switchProject(target.id) },
        {
          label: "Rename",
          action: () => {
            const name = window.prompt("New project name:", target.name);
            if (name?.trim()) renameProject(target.id, name.trim());
          }
        },
        "---",
        {
          label: "Delete",
          danger: true,
          icon: <Trash2 size={11} />,
          action: () => {
            if (window.confirm(`Delete "${target.name}"?`)) deleteProject(target.id);
          }
        }
      ];
    }

    if (type === "node") {
      items = [
        { label: "Select on Canvas", action: () => { selectNode(target.id); focusNode(target.id); } },
        {
          label: "Rename",
          action: () => {
            const name = window.prompt("New node name:", target.name);
            if (name?.trim()) useWorkflowStore.getState().updateNode(target.id, { name: name.trim() });
          }
        },
        { label: "Duplicate", action: () => duplicateNode(target.id) },
        "---",
        { label: "Delete", danger: true, icon: <Trash2 size={11} />, action: () => deleteNode(target.id) }
      ];
    }

    if (type === "edge") {
      items = [
        { label: "Delete Connection", danger: true, icon: <Trash2 size={11} />, action: () => removeEdge(target.id) }
      ];
    }

    setMenu({ x: e.clientX, y: e.clientY, items });
  }

  return (
    <div className="flex h-full flex-col bg-panel">
      {/* Header */}
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-hairline px-3">
        <span className="text-[11px] font-medium uppercase tracking-wider text-ink">Explorer</span>
        <button
          className="flex h-7 w-7 items-center justify-center rounded-sm text-muted transition hover:bg-canvasSoft hover:text-ink"
          onClick={() => createProject("New Project")}
          title="New project"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Tree or empty state */}
      <div className="min-h-0 flex-1 overflow-auto">
        {projects.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-1 p-1">
            {projects.map((project) => (
              <ProjectRow
                key={project.id}
                project={project}
                isActive={project.id === activeProjectId}
                selectedNodeId={selectedNodeId}
                onContextMenu={onContextMenu}
              />
            ))}
          </div>
        )}
      </div>

      {menu && <ContextMenu x={menu.x} y={menu.y} items={menu.items} onClose={closeMenu} />}
    </div>
  );
}
