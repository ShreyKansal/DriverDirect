import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bot,
  ChevronDown,
  ChevronRight,
  Crown,
  FileInput,
  FileOutput,
  FolderOpen,
  GitBranch,
  GripVertical,
  Layers,
  Link2,
  MoreHorizontal,
  Plus,
  Trash2,
} from "lucide-react";
import { useWorkflowStore } from "../../store/workflowStore.js";
import ContextMenu from "./ContextMenu.jsx";

function nodeIcon(type, size = 15) {
  if (type === "orchestrator") return <Crown size={size} className="text-body" />;
  if (type === "user_input") return <FileInput size={size} className="text-muted" />;
  if (type === "output") return <FileOutput size={size} className="text-muted" />;
  return <Bot size={size} className="text-muted" />;
}

const NODE_TYPE_LABEL = {
  user_input: "Input",
  orchestrator: "Orchestrator",
  agent: "Agent",
  output: "Output",
};

const ADD_CTA = [
  { type: "agent", Icon: Bot, label: "Agent", primary: true },
  { type: "orchestrator", Icon: Crown, label: "Orchestrator", primary: false },
  { type: "user_input", Icon: FileInput, label: "User Input", primary: false },
  { type: "output", Icon: FileOutput, label: "Output", primary: false },
];

function NodeRow({ node, isSelected, onContextMenu }) {
  const selectNode = useWorkflowStore((s) => s.selectNode);
  const focusNode = useWorkflowStore((s) => s.focusNode);

  return (
    <div
      className={`group flex h-7 cursor-pointer items-center gap-2 rounded-sm px-2 text-[13px] transition-colors ${
        isSelected ? "bg-primary/10 text-ink" : "text-body hover:bg-canvasSoft hover:text-ink"
      }`}
      onClick={(event) => {
        event.stopPropagation();
        selectNode(node.id);
        focusNode(node.id);
      }}
      onContextMenu={(event) => {
        event.preventDefault();
        onContextMenu(event, "node", node);
      }}
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
  const sourceNode = nodeById.get(edge.source);
  const targetNode = nodeById.get(edge.target);
  if (!sourceNode || !targetNode) return null;

  return (
    <div
      className="flex h-7 cursor-default items-center gap-2 rounded-sm px-2 text-[12px] text-muted hover:bg-canvasSoft"
      onContextMenu={(event) => {
        event.preventDefault();
        onContextMenu(event, "edge", edge);
      }}
    >
      <Link2 size={13} className="shrink-0" />
      <span className="truncate">
        {sourceNode.name} {"->"} {targetNode.name}
      </span>
    </div>
  );
}

function WorkflowRow({ workflow, isActive, onRename, onDelete, onDuplicate, onActivate }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(workflow.name);
  const inputRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  useEffect(() => {
    if (!menuOpen) return undefined;

    function close(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  function commitRename() {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== workflow.name) onRename(workflow.id, trimmed);
    else setEditName(workflow.name);
    setEditing(false);
  }

  const nodeCount = (workflow.nodes || []).filter((node) => node.type !== "tool").length;

  return (
    <div
      className={`group flex h-7 cursor-pointer items-center gap-2 rounded-sm px-2 text-[13px] transition-colors ${
        isActive ? "bg-canvasSoft font-medium text-ink" : "text-body hover:bg-canvasSoft hover:text-ink"
      }`}
      onClick={() => {
        if (!editing) onActivate(workflow.id);
      }}
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData("workflow_ref_id", workflow.id);
        event.dataTransfer.setData("workflow_ref_name", workflow.name);
        event.dataTransfer.effectAllowed = "copy";
      }}
      title="Drag onto canvas to create a Call Workflow node"
    >
      <GripVertical size={12} className="shrink-0 text-muted opacity-0 transition group-hover:opacity-60" />
      <GitBranch size={13} className={`shrink-0 ${isActive ? "text-ink" : "text-muted"}`} />

      {editing ? (
        <input
          ref={inputRef}
          className="min-w-0 flex-1 rounded border border-primary bg-transparent px-1 text-[13px] text-ink outline-none"
          value={editName}
          onChange={(event) => setEditName(event.target.value)}
          onBlur={commitRename}
          onKeyDown={(event) => {
            if (event.key === "Enter") commitRename();
            if (event.key === "Escape") {
              setEditName(workflow.name);
              setEditing(false);
            }
          }}
          onClick={(event) => event.stopPropagation()}
        />
      ) : (
        <span
          className="min-w-0 flex-1 truncate"
          onDoubleClick={(event) => {
            event.stopPropagation();
            setEditing(true);
          }}
        >
          {workflow.name}
        </span>
      )}

      <span className="shrink-0 text-[11px] text-muted opacity-60">{nodeCount}</span>

      <div className="relative shrink-0" ref={menuRef}>
        <button
          className="flex h-5 w-5 items-center justify-center rounded-sm text-muted opacity-0 transition hover:bg-canvasSoft hover:text-ink group-hover:opacity-100"
          onClick={(event) => {
            event.stopPropagation();
            setMenuOpen((value) => !value);
          }}
          title="Workflow options"
        >
          <MoreHorizontal size={12} />
        </button>
        {menuOpen ? (
          <div className="absolute right-0 top-full z-50 mt-0.5 w-36 rounded-md border border-hairline bg-panel py-1 shadow-lg">
            <button
              className="flex h-7 w-full items-center px-3 text-[12px] text-body hover:bg-canvasSoft"
              onClick={(event) => {
                event.stopPropagation();
                setMenuOpen(false);
                setEditing(true);
              }}
            >
              Rename
            </button>
            <button
              className="flex h-7 w-full items-center px-3 text-[12px] text-body hover:bg-canvasSoft"
              onClick={(event) => {
                event.stopPropagation();
                setMenuOpen(false);
                onDuplicate(workflow.id);
              }}
            >
              Duplicate
            </button>
            <div className="my-0.5 border-t border-hairline" />
            <button
              className="flex h-7 w-full items-center px-3 text-[12px] text-red-500 hover:bg-red-50"
              onClick={(event) => {
                event.stopPropagation();
                setMenuOpen(false);
                onDelete(workflow.id);
              }}
            >
              Delete
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function WorkflowList({ workflows, activeWorkflowId, onActivate, onAdd, onRename, onDelete, onDuplicate }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="mt-0.5">
      <div className="flex h-7 items-center">
        <button
          className="flex min-w-0 flex-1 items-center gap-1.5 text-left text-[11px] font-bold uppercase tracking-wider text-muted hover:text-ink"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          Workflows ({workflows.length})
        </button>
        <button
          className="flex h-6 w-6 items-center justify-center rounded-sm text-muted transition hover:bg-canvasSoft hover:text-ink"
          onClick={onAdd}
          title="Add workflow"
        >
          <Plus size={15} />
        </button>
      </div>

      {open ? (
        <div className="space-y-0.5 py-0.5">
          {workflows.map((workflow) => (
            <WorkflowRow
              key={workflow.id}
              workflow={workflow}
              isActive={workflow.id === activeWorkflowId}
              onActivate={onActivate}
              onRename={onRename}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function AddNodeDropdown({ addAgent }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    function close(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        className="flex h-6 w-6 items-center justify-center rounded-sm text-muted transition hover:bg-canvasSoft hover:text-ink"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
        title="Add node"
      >
        <Plus size={15} className="shrink-0" />
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-md border border-hairline bg-panel py-1 shadow-lg">
          {ADD_CTA.map(({ type, Icon, label }) => (
            <button
              key={type}
              className="flex h-8 w-full items-center gap-2 px-3 text-[13px] text-body transition-colors hover:bg-canvasSoft hover:text-ink"
              onClick={(event) => {
                event.stopPropagation();
                addAgent(type);
                setOpen(false);
              }}
            >
              <Icon size={14} className="shrink-0 text-muted" />
              {label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ProjectRow({ project, isActive, selectedNodeId, onContextMenu }) {
  const switchProject = useWorkflowStore((s) => s.switchProject);
  const addAgent = useWorkflowStore((s) => s.addAgent);
  const addWorkflow = useWorkflowStore((s) => s.addWorkflow);
  const removeWorkflow = useWorkflowStore((s) => s.removeWorkflow);
  const renameWorkflow = useWorkflowStore((s) => s.renameWorkflow);
  const duplicateWorkflow = useWorkflowStore((s) => s.duplicateWorkflow);
  const setActiveWorkflow = useWorkflowStore((s) => s.setActiveWorkflow);
  const activeWorkflowId = useWorkflowStore((s) => s.activeWorkflowId);
  const workflow = useWorkflowStore((s) => s.workflow);
  const [nodesOpen, setNodesOpen] = useState(true);
  const [edgesOpen, setEdgesOpen] = useState(false);

  const workflows = project.workflows || [];
  const nodes = isActive ? workflow?.nodes || [] : [];
  const edges = isActive ? workflow?.edges || [] : [];
  const nodeById = new Map(nodes.map((node) => [node.id, node]));

  function handleDeleteWorkflow(workflowId) {
    if (workflows.length <= 1) return;
    const selectedWorkflow = workflows.find((entry) => entry.id === workflowId);
    const nodeCount = (selectedWorkflow?.nodes || []).filter((node) => node.type !== "tool").length;
    if (
      nodeCount > 0 &&
      !window.confirm(`Delete "${selectedWorkflow?.name}"? This workflow has ${nodeCount} node(s) and cannot be recovered.`)
    ) {
      return;
    }
    removeWorkflow(workflowId);
  }

  return (
    <div>
      <div
        className={`group flex h-7 cursor-pointer items-center gap-1.5 rounded-sm px-1 text-[13px] font-semibold transition-colors ${
          isActive ? "text-ink" : "text-body hover:bg-canvasSoft hover:text-ink"
        }`}
        onClick={(event) => {
          event.stopPropagation();
          if (!isActive) switchProject(project.id);
        }}
        onContextMenu={(event) => {
          event.preventDefault();
          onContextMenu(event, "project", project);
        }}
      >
        <ChevronDown size={14} className={`shrink-0 transition-transform ${isActive ? "" : "-rotate-90"}`} />
        <FolderOpen size={15} className="shrink-0 text-muted" />
        <span className="min-w-0 flex-1 truncate">{project.name}</span>
      </div>

      {isActive ? (
        <div className="ml-3 border-l border-hairline pl-2">
          <WorkflowList
            workflows={workflows}
            activeWorkflowId={activeWorkflowId}
            onActivate={setActiveWorkflow}
            onAdd={() => addWorkflow()}
            onRename={renameWorkflow}
            onDelete={handleDeleteWorkflow}
            onDuplicate={duplicateWorkflow}
          />

          <div className="mt-1 group flex h-7 items-center">
            <button
              className="flex min-w-0 flex-1 items-center gap-1.5 text-left text-[11px] font-bold uppercase tracking-wider text-muted hover:text-ink"
              onClick={() => setNodesOpen((value) => !value)}
            >
              {nodesOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              Nodes ({nodes.filter((node) => node.type !== "tool").length})
            </button>
            <AddNodeDropdown addAgent={addAgent} />
          </div>

          {nodesOpen ? (
            <div className="space-y-0.5 py-0.5">
              {nodes.filter((node) => node.type !== "tool").length === 0 ? (
                <p className="px-2 py-2 text-[12px] text-muted">Start building. Add your first node.</p>
              ) : (
                nodes
                  .filter((node) => node.type !== "tool")
                  .map((node) => (
                    <NodeRow
                      key={node.id}
                      node={node}
                      isSelected={node.id === selectedNodeId}
                      onContextMenu={onContextMenu}
                    />
                  ))
              )}
            </div>
          ) : null}

          {edges.length > 0 ? (
            <>
              <button
                className="mt-1 flex h-7 w-full items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted hover:text-ink"
                onClick={() => setEdgesOpen((value) => !value)}
              >
                {edgesOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                Connections ({edges.filter((edge) => edge.type !== "tool").length})
              </button>
              {edgesOpen ? (
                <div className="space-y-0.5 py-0.5">
                  {edges
                    .filter((edge) => edge.type !== "tool")
                    .map((edge) => (
                      <EdgeRow key={edge.id} edge={edge} nodeById={nodeById} onContextMenu={onContextMenu} />
                    ))}
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function EmptyState({ onCreate }) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 pt-12 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-hairlineStrong bg-canvasSoft">
        <Layers size={18} className="text-muted" />
      </div>
      <div>
        <p className="text-[13px] font-semibold text-ink">No projects yet</p>
        <p className="mt-0.5 text-[11px] text-muted">Create one to get started</p>
      </div>
      <button
        className="mt-1 flex items-center gap-1.5 rounded-md border border-hairlineStrong bg-canvasSoft px-3 py-1.5 text-[12px] font-medium text-ink transition hover:bg-panel"
        onClick={onCreate}
      >
        <Plus size={13} /> New Project
      </button>
    </div>
  );
}

function StaleState({ projects, onSelect }) {
  return (
    <div className="flex flex-col px-2 pt-3">
      <p className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted">Projects</p>
      {projects.map((project) => (
        <button
          key={project.id}
          className="flex h-8 w-full items-center gap-2 rounded-sm px-2 text-left text-[13px] text-body transition hover:bg-canvasSoft hover:text-ink"
          onClick={() => onSelect(project.id)}
        >
          <FolderOpen size={13} className="shrink-0 text-muted" />
          <span className="truncate">{project.name}</span>
        </button>
      ))}
    </div>
  );
}

export default function ProjectExplorer() {
  const projects = useWorkflowStore((s) => s.projects);
  const activeProjectId = useWorkflowStore((s) => s.activeProjectId);
  const selectedNodeId = useWorkflowStore((s) => s.selectedNodeId);
  const createProject = useWorkflowStore((s) => s.createProject);
  const deleteProject = useWorkflowStore((s) => s.deleteProject);
  const renameProject = useWorkflowStore((s) => s.renameProject);
  const switchProject = useWorkflowStore((s) => s.switchProject);
  const duplicateNode = useWorkflowStore((s) => s.duplicateNode);
  const deleteNode = useWorkflowStore((s) => s.deleteNode);
  const selectNode = useWorkflowStore((s) => s.selectNode);
  const focusNode = useWorkflowStore((s) => s.focusNode);
  const removeEdge = useWorkflowStore((s) => s.removeEdge);

  const [menu, setMenu] = useState(null);
  const closeMenu = useCallback(() => setMenu(null), []);

  function onContextMenu(event, type, target) {
    event.stopPropagation();
    let items = [];

    if (type === "project") {
      items = [
        { label: "Switch to Project", action: () => switchProject(target.id) },
        {
          label: "Rename",
          action: () => {
            const name = window.prompt("New project name:", target.name);
            if (name?.trim()) renameProject(target.id, name.trim());
          },
        },
        "---",
        {
          label: "Delete",
          danger: true,
          icon: <Trash2 size={11} />,
          action: () => {
            if (window.confirm(`Delete "${target.name}"?`)) deleteProject(target.id);
          },
        },
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
          },
        },
        { label: "Duplicate", action: () => duplicateNode(target.id) },
        "---",
        { label: "Delete", danger: true, icon: <Trash2 size={11} />, action: () => deleteNode(target.id) },
      ];
    }

    if (type === "edge") {
      items = [
        { label: "Delete Connection", danger: true, icon: <Trash2 size={11} />, action: () => removeEdge(target.id) },
      ];
    }

    setMenu({ x: event.clientX, y: event.clientY, items });
  }

  const activeProject = projects.find((project) => project.id === activeProjectId);

  return (
    <div className="flex h-full flex-col bg-panel">
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

      <div className="min-h-0 flex-1 overflow-auto">
        {activeProject ? (
          <div className="p-1">
            <ProjectRow
              project={activeProject}
              isActive
              selectedNodeId={selectedNodeId}
              onContextMenu={onContextMenu}
            />
          </div>
        ) : projects.length > 0 ? (
          <StaleState projects={projects} onSelect={switchProject} />
        ) : (
          <EmptyState onCreate={() => createProject("New Project")} />
        )}
      </div>

      {menu ? <ContextMenu x={menu.x} y={menu.y} items={menu.items} onClose={closeMenu} /> : null}
    </div>
  );
}
