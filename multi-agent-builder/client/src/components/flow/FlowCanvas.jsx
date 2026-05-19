import { useRef, useState, useEffect, useCallback } from "react";
import { Bot, CheckCircle2, Copy, Crown, ExternalLink, FileInput, FileOutput, GitBranch, Link2, Trash2, Wrench, X } from "lucide-react";
import { useWorkflowStore } from "../../store/workflowStore.js";
import { NODE_TYPE_LABELS, createWorkflowRefNode } from "../../utils/graphUtils.js";

const EMPTY_EXEC_STATE = {};

const NODE_WIDTH       = 236;
const NODE_HEIGHT      = 124;
const TOOL_NODE_WIDTH  = 192;
const TOOL_NODE_HEIGHT = 92;
const ZOOM_MIN    = 0.15;
const ZOOM_MAX    = 2.0;
const ZOOM_FACTOR = 0.12;
const PORT_SIDES = ["left", "right", "top", "bottom"];
const PORT_SIZE = 10;
const PORT_HIT_RADIUS = 18;
const EDGE_PORT_GAP = 7;
const CONNECT_ACCENT = "#8ecbff";

// Column gap wide enough that bezier curves between adjacent columns
// never intersect nodes that sit in those columns.
const LAYOUT_COL_GAP = 120;
const LAYOUT_ROW_GAP = 50;

// ─── DAG auto-layout ──────────────────────────────────────────────────────────
// Places non-tool nodes in left-to-right columns based on longest-path
// topological depth, then runs 3 barycenter passes to pull each column's nodes
// toward their neighbours, minimising edge crossings.

function computeDagLayout(nodes, edges) {
  const mainNodes = nodes.filter(n => n.type !== "tool");
  if (!mainNodes.length) return {};
  const flowEdges = edges.filter(e => e.type !== "tool");

  const childrenOf = Object.fromEntries(mainNodes.map(n => [n.id, []]));
  const parentsOf  = Object.fromEntries(mainNodes.map(n => [n.id, []]));
  flowEdges.forEach(e => {
    if (childrenOf[e.source] !== undefined) childrenOf[e.source].push(e.target);
    if (parentsOf[e.target]  !== undefined) parentsOf[e.target].push(e.source);
  });

  // Longest-path pass: col[id] = depth from any root
  const col   = Object.fromEntries(mainNodes.map(n => [n.id, 0]));
  const inDeg = Object.fromEntries(mainNodes.map(n => [n.id, parentsOf[n.id].length]));
  const queue = mainNodes.filter(n => inDeg[n.id] === 0).map(n => n.id);
  while (queue.length) {
    const id = queue.shift();
    (childrenOf[id] || []).forEach(cid => {
      col[cid] = Math.max(col[cid], col[id] + 1);
      if (--inDeg[cid] <= 0) queue.push(cid);
    });
  }

  const byCol = {};
  mainNodes.forEach(n => { const c = col[n.id] ?? 0; (byCol[c] = byCol[c] || []).push(n); });
  const colKeys = Object.keys(byCol).sort((a, b) => +a - +b);

  const positions = {};
  function placeCol(c) {
    const colNodes = byCol[c];
    const x      = +c * (NODE_WIDTH + LAYOUT_COL_GAP) + 40;
    const totalH = colNodes.length * NODE_HEIGHT + (colNodes.length - 1) * LAYOUT_ROW_GAP;
    const startY = Math.max(40, 300 - totalH / 2);
    colNodes.forEach((n, i) => {
      positions[n.id] = { x, y: startY + i * (NODE_HEIGHT + LAYOUT_ROW_GAP) };
    });
  }

  colKeys.forEach(c => placeCol(c));

  // Barycenter passes: sort each column by avg-y of neighbours → fewer crossings
  for (let pass = 0; pass < 3; pass++) {
    colKeys.forEach(c => {
      const colNodes = byCol[c];
      if (colNodes.length <= 1) return;
      colNodes.sort((a, b) => {
        const bary = id => {
          const nbrs = [...(childrenOf[id] || []), ...(parentsOf[id] || [])]
            .map(nid => positions[nid]?.y ?? 0);
          return nbrs.length ? nbrs.reduce((s, y) => s + y, 0) / nbrs.length : 0;
        };
        return bary(a.id) - bary(b.id);
      });
      placeCol(c);
    });
  }

  return positions;
}

// ─── small helpers ────────────────────────────────────────────────────────────

function nodeW(node) { return node.type === "tool" ? TOOL_NODE_WIDTH  : NODE_WIDTH;  }
function nodeH(node) { return node.type === "tool" ? TOOL_NODE_HEIGHT : NODE_HEIGHT; }

function portStyle(width, height, side) {
  const half = PORT_SIZE / 2;
  if (side === "left") return { left: -half, top: "50%", transform: "translateY(-50%)" };
  if (side === "right") return { left: width - half, top: "50%", transform: "translateY(-50%)" };
  if (side === "top") return { top: -half, left: "50%", transform: "translateX(-50%)" };
  if (side === "bottom") return { bottom: -half, left: "50%", transform: "translateX(-50%)" };
  return {};
}

// Port position on any of the 4 sides (center of that edge)
function portPos(node, side) {
  const { x = 0, y = 0 } = node.position || {};
  const w = nodeW(node), h = nodeH(node);
  if (side === "right")  return { x: x + w,   y: y + h / 2 };
  if (side === "left")   return { x: x,        y: y + h / 2 };
  if (side === "top")    return { x: x + w / 2, y: y         };
  if (side === "bottom") return { x: x + w / 2, y: y + h     };
  return { x: x + w, y: y + h / 2 };
}

// Bezier control-point offset: exits perpendicular to the port side
function ctrlDelta(side, dist) {
  if (side === "right")  return { x:  dist, y: 0     };
  if (side === "left")   return { x: -dist, y: 0     };
  if (side === "top")    return { x: 0,     y: -dist };
  if (side === "bottom") return { x: 0,     y:  dist };
  return { x: dist, y: 0 };
}

function sideVector(side) {
  if (side === "left") return { x: -1, y: 0 };
  if (side === "right") return { x: 1, y: 0 };
  if (side === "top") return { x: 0, y: -1 };
  if (side === "bottom") return { x: 0, y: 1 };
  return { x: 1, y: 0 };
}

function offsetFromSide(point, side, amount) {
  const v = sideVector(side);
  return { x: point.x + v.x * amount, y: point.y + v.y * amount };
}

// Which side of a node is the cursor nearest to?
function nearestSide(point, node) {
  const { x = 0, y = 0 } = node.position || {};
  const w = nodeW(node), h = nodeH(node);
  const dx = point.x - (x + w / 2);
  const dy = point.y - (y + h / 2);
  return Math.abs(dx / w) > Math.abs(dy / h)
    ? (dx > 0 ? "right" : "left")
    : (dy > 0 ? "bottom" : "top");
}

function pointInNode(point, node, pad = 0) {
  const pos = node.position || { x: 0, y: 0 };
  const w = nodeW(node), h = nodeH(node);
  return point.x >= pos.x - pad && point.x <= pos.x + w + pad &&
    point.y >= pos.y - pad && point.y <= pos.y + h + pad;
}

function findConnectionTarget(point, nodes, sourceNodeId, hitRadius) {
  let best = null;
  for (const node of nodes) {
    if (node.id === sourceNodeId) continue;
    for (const side of PORT_SIDES) {
      const port = portPos(node, side);
      const distance = Math.hypot(point.x - port.x, point.y - port.y);
      if (distance <= hitRadius && (!best || distance < best.distance)) {
        best = { nodeId: node.id, port: side, distance };
      }
    }
  }
  if (best) return best;

  for (const node of nodes) {
    if (node.id === sourceNodeId) continue;
    if (pointInNode(point, node, hitRadius * 0.35)) {
      return { nodeId: node.id, port: nearestSide(point, node), distance: 0 };
    }
  }
  return null;
}

function edgePoint(node, side) {
  return portPos(node, side === "right" ? "right" : "left");
}

function nodeIcon(type, size = 15) {
  if (type === "orchestrator") return <Crown size={size} />;
  if (type === "user_input")   return <FileInput size={size} />;
  if (type === "output")       return <FileOutput size={size} />;
  if (type === "workflow_ref") return <GitBranch size={size} />;
  return <Bot size={size} />;
}

function nodeAccent(type) {
  if (type === "orchestrator") return "bg-primary text-white";
  if (type === "user_input")   return "bg-surfaceStrong text-ink";
  if (type === "output")       return "bg-ink text-canvas";
  if (type === "workflow_ref") return "bg-[#00BCD4] text-white";
  return "bg-canvasSoft text-ink";
}

function nodeSummary(node) {
  if (node.type === "user_input") return node.prompt || "Prompt entered at runtime";
  if (node.type === "output")     return node.outputFormat || "markdown";
  return node.role;
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// ─── group helpers ────────────────────────────────────────────────────────────

const GROUP_COLORS = ["#3b82f6", "#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

function groupBounds(group, nodes, pad = 24) {
  const members = nodes.filter((n) => group.nodeIds.includes(n.id));
  if (!members.length) return null;
  const xs  = members.map((n) => n.position?.x ?? 0);
  const ys  = members.map((n) => n.position?.y ?? 0);
  const x2s = members.map((n) => (n.position?.x ?? 0) + nodeW(n));
  const y2s = members.map((n) => (n.position?.y ?? 0) + nodeH(n));
  return {
    x: Math.min(...xs) - pad,
    y: Math.min(...ys) - pad - 16,
    w: Math.max(...x2s) - Math.min(...xs) + pad * 2,
    h: Math.max(...y2s) - Math.min(...ys) + pad * 2 + 16,
  };
}

// ─── component ────────────────────────────────────────────────────────────────

export default function FlowCanvas() {
  const workflow              = useWorkflowStore((s) => s.workflow);
  const selectedNodeId        = useWorkflowStore((s) => s.selectedNodeId);
  const executionState        = useWorkflowStore((s) => s.runs[s.activeProjectId]?.executionState ?? EMPTY_EXEC_STATE);
  const selectNode            = useWorkflowStore((s) => s.selectNode);
  const focusNode             = useWorkflowStore((s) => s.focusNode);
  const updateNode            = useWorkflowStore((s) => s.updateNode);
  const deleteNode            = useWorkflowStore((s) => s.deleteNode);
  const setCanvasZoom          = useWorkflowStore((s) => s.setCanvasZoom);
  const canvasZoomRequest      = useWorkflowStore((s) => s.canvasZoomRequest);
  const clearCanvasZoomRequest = useWorkflowStore((s) => s.clearCanvasZoomRequest);
  const createGroup            = useWorkflowStore((s) => s.createGroup);
  const deleteGroup            = useWorkflowStore((s) => s.deleteGroup);
  const renameGroup            = useWorkflowStore((s) => s.renameGroup);
  const updateGroupColor       = useWorkflowStore((s) => s.updateGroupColor);
  const ungroupNodes           = useWorkflowStore((s) => s.ungroupNodes);
  const setCanvasSelectedIds   = useWorkflowStore((s) => s.setCanvasSelectedIds);
  const connectNodes           = useWorkflowStore((s) => s.connectNodes);
  const removeEdge             = useWorkflowStore((s) => s.removeEdge);
  const selectedEdgeId         = useWorkflowStore((s) => s.selectedEdgeId);
  const selectEdge             = useWorkflowStore((s) => s.selectEdge);
  const clearSelectedEdge      = useWorkflowStore((s) => s.clearSelectedEdge);
  const duplicateNode          = useWorkflowStore((s) => s.duplicateNode);
  const openAgentTab           = useWorkflowStore((s) => s.openAgentTab);
  const setActiveWorkflow      = useWorkflowStore((s) => s.setActiveWorkflow);

  // ── transform state ─────────────────────────────────────────────────────────
  const [zoom, setZoom]             = useState(1);
  const [pan,  setPan]              = useState({ x: 60, y: 60 });
  const [isPanning, setIsPanning]   = useState(false);
  const [hoveredNodeId, setHoveredId] = useState(null);
  const [hoveredEdgeId, setHoveredEdgeId]   = useState(null);
  const [dropTarget, setDropTarget]         = useState(null);
  const [dropTargetPort, setDropTargetPort] = useState(null);

  // ── multi-select & groups state ─────────────────────────────────────────────
  const [selectedNodeIds, setSelectedNodeIdsRaw] = useState([]);
  const setSelectedNodeIds = useCallback((idsOrFn) => {
    setSelectedNodeIdsRaw((prev) => {
      const next = typeof idsOrFn === "function" ? idsOrFn(prev) : idsOrFn;
      setCanvasSelectedIds(next);
      return next;
    });
  }, [setCanvasSelectedIds]);
  const [groupMenu, setGroupMenu]             = useState(null); // { type: "canvas"|"group", x, y, groupId? }
  const [nodeMenu, setNodeMenu]               = useState(null); // { nodeId, x, y }

  // ── port connection dragging ─────────────────────────────────────────────────
  const [connectingFrom, setConnectingFrom]   = useState(null); // { nodeId }
  const [ghostPoint, setGhostPoint]           = useState(null); // { x, y } canvas coords
  const connectingRef                         = useRef(null);

  // Refs so wheel / drag handlers always read fresh values without stale closures
  const zoomRef      = useRef(zoom);
  const panRef       = useRef(pan);
  const containerRef = useRef(null);
  const dragRef      = useRef(null);
  const spaceRef     = useRef(false); // Space held → temporary pan regardless of mode
  zoomRef.current = zoom;
  panRef.current  = pan;

  // ── wheel zoom toward cursor (non-passive) ──────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      const rect  = el.getBoundingClientRect();
      const mx    = e.clientX - rect.left;
      const my    = e.clientY - rect.top;
      const cz    = zoomRef.current;
      const cp    = panRef.current;
      const nz    = clamp(cz * (e.deltaY < 0 ? 1 + ZOOM_FACTOR : 1 - ZOOM_FACTOR), ZOOM_MIN, ZOOM_MAX);
      const scale = nz / cz;
      setZoom(nz);
      setPan({ x: mx - (mx - cp.x) * scale, y: my - (my - cp.y) * scale });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // Sync zoom to store so WorkspaceTabs can display it
  useEffect(() => { setCanvasZoom(zoom); }, [zoom, setCanvasZoom]);

  // ── keyboard shortcuts for canvas tool modes + Space=temp-pan ───────────────
  useEffect(() => {
    const onDown = (e) => {
      const tag = document.activeElement?.tagName;
      const inInput = tag === "INPUT" || tag === "TEXTAREA" || document.activeElement?.isContentEditable;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey && !inInput) {
        e.preventDefault();
        useWorkflowStore.getState().undoWorkflow();
        return;
      }
      if (e.code === "Space" && !inInput) { e.preventDefault(); spaceRef.current = true; }
      // Delete / Backspace removes the selected edge
      if ((e.key === "Delete" || e.key === "Backspace") && !inInput) {
        const edgeId = useWorkflowStore.getState().selectedEdgeId;
        if (edgeId) {
          e.preventDefault();
          useWorkflowStore.getState().removeEdge(edgeId);
          useWorkflowStore.getState().clearSelectedEdge();
        }
      }
    };
    const onUp = (e) => { if (e.code === "Space") spaceRef.current = false; };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup",   onUp);
    return () => { window.removeEventListener("keydown", onDown); window.removeEventListener("keyup", onUp); };
  }, []);

  // Handle zoom requests from WorkspaceTabs
  useEffect(() => {
    if (!canvasZoomRequest) return;
    if (canvasZoomRequest === "in")  zoomBy(1 + ZOOM_FACTOR);
    if (canvasZoomRequest === "out") zoomBy(1 - ZOOM_FACTOR);
    if (canvasZoomRequest === "fit") fitView();
    clearCanvasZoomRequest();
  });

  // ── Auto-layout ───────────────────────────────────────────────────────────────
  // Re-runs only when the set of node IDs changes (node added/removed).
  // Edges are intentionally excluded — connecting nodes must not shift positions.
  // If every main node already has a saved position (from storage or prior layout),
  // the effect is a no-op, which preserves user-arranged layouts across reloads.
  const nodeIdKey = workflow.nodes
    .filter(n => n.type !== "tool")
    .map(n => n.id)
    .join("|");

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!workflow.nodes.length) return;
    const mainNodes = workflow.nodes.filter(n => n.type !== "tool");
    // Skip if every node already has a position (loaded from storage or manually placed)
    if (mainNodes.every(n => n.position?.x != null)) return;
    const positions = computeDagLayout(workflow.nodes, workflow.edges);
    Object.entries(positions).forEach(([id, pos]) => updateNode(id, { position: pos }, { skipHistory: true }));
    setTimeout(fitView, 60);
  }, [nodeIdKey]);

  // ── fit all nodes into view ──────────────────────────────────────────────────
  function fitView() {
    const nodes = workflow.nodes;
    const el    = containerRef.current;
    if (!nodes.length || !el) { setZoom(1); setPan({ x: 60, y: 60 }); return; }
    const rect  = el.getBoundingClientRect();
    const xs    = nodes.map((n) => n.position?.x ?? 0);
    const ys    = nodes.map((n) => n.position?.y ?? 0);
    const minX  = Math.min(...xs);
    const minY  = Math.min(...ys);
    const maxX  = Math.max(...nodes.map((n) => (n.position?.x ?? 0) + nodeW(n)));
    const maxY  = Math.max(...nodes.map((n) => (n.position?.y ?? 0) + nodeH(n)));
    const pad   = 80;
    const nz    = clamp(
      Math.min((rect.width - pad * 2) / (maxX - minX || 1), (rect.height - pad * 2) / (maxY - minY || 1)),
      ZOOM_MIN, 1 // never zoom-in beyond 100 % on fit
    );
    setZoom(nz);
    setPan({
      x: (rect.width  - (maxX - minX) * nz) / 2 - minX * nz,
      y: (rect.height - (maxY - minY) * nz) / 2 - minY * nz
    });
  }

  // ── zoom buttons ──────────────────────────────────────────────────────────────
  function zoomBy(factor) {
    const cz   = zoomRef.current;
    const cp   = panRef.current;
    const el   = containerRef.current;
    const nz   = clamp(cz * factor, ZOOM_MIN, ZOOM_MAX);
    const scale = nz / cz;
    if (el) {
      const rect = el.getBoundingClientRect();
      const cx   = rect.width  / 2;
      const cy   = rect.height / 2;
      setPan({ x: cx - (cx - cp.x) * scale, y: cy - (cy - cp.y) * scale });
    }
    setZoom(nz);
  }

  // ── background: drag pans, click clears selection ────────────────────────
  function onBackgroundDown(e) {
    if (e.button !== 0) return;

    setGroupMenu(null);
    setNodeMenu(null);

    if (connectingRef.current) {
      connectingRef.current = null;
      setConnectingFrom(null);
      setGhostPoint(null);
      return;
    }

    const startX    = e.clientX;
    const startY    = e.clientY;
    const originPan = { ...panRef.current };
    let   dragged   = false;

    const move = (ev) => {
      if (!dragged && (Math.abs(ev.clientX - startX) > 3 || Math.abs(ev.clientY - startY) > 3)) {
        dragged = true;
        setIsPanning(true);
      }
      if (dragged) {
        setPan({ x: originPan.x + ev.clientX - startX, y: originPan.y + ev.clientY - startY });
      }
    };
    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup",   stop);
      if (!dragged) {
        // Plain click on empty canvas → clear selection
        setSelectedNodeIds([]);
        selectNode("");
      }
      setIsPanning(false);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup",   stop);
  }

  // ── node drag ─────────────────────────────────────────────────────────────────
  function startDrag(e, node) {
    e.preventDefault();
    e.stopPropagation();
    focusNode(node.id);
    dragRef.current = {
      nodeId:  node.id,
      startX:  e.clientX,
      startY:  e.clientY,
      originX: node.position?.x ?? 0,
      originY: node.position?.y ?? 0,
      capturedHistory: false
    };

    const move = (ev) => {
      const d  = dragRef.current;
      if (!d) return;
      const cz = zoomRef.current; // always fresh — no stale closure
      const nextPosition = {
        x: Math.max(0, d.originX + (ev.clientX - d.startX) / cz),
        y: Math.max(0, d.originY + (ev.clientY - d.startY) / cz)
      };
      if (!d.capturedHistory && (nextPosition.x !== d.originX || nextPosition.y !== d.originY)) {
        useWorkflowStore.getState().recordWorkflowHistory();
        d.capturedHistory = true;
      }
      updateNode(d.nodeId, { position: nextPosition }, { skipHistory: true });
    };
    const stop = () => {
      dragRef.current = null;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup",   stop);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup",   stop);
  }

  // ── port connection drag ─────────────────────────────────────────────────────
  const hoveredTargetRef     = useRef(null);
  const hoveredTargetPortRef = useRef(null);   // which side of target node
  const sourcePortRef        = useRef("right"); // which side drag started from

  function toCanvasCoords(clientX, clientY) {
    const el   = containerRef.current;
    if (!el) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    return {
      x: (clientX - rect.left - panRef.current.x) / zoomRef.current,
      y: (clientY - rect.top  - panRef.current.y) / zoomRef.current,
    };
  }

  function startPortDrag(e, sourceNodeId, side = "right") {
    e.preventDefault();
    e.stopPropagation();

    connectingRef.current         = sourceNodeId;
    sourcePortRef.current         = side;
    hoveredTargetRef.current      = null;
    hoveredTargetPortRef.current  = null;
    setConnectingFrom({ nodeId: sourceNodeId, port: side });
    setGhostPoint(toCanvasCoords(e.clientX, e.clientY));

    const move = (ev) => {
      const point = toCanvasCoords(ev.clientX, ev.clientY);
      setGhostPoint(point);

      const target = findConnectionTarget(
        point,
        workflow.nodes,
        connectingRef.current,
        PORT_HIT_RADIUS / zoomRef.current
      );
      hoveredTargetRef.current = target?.nodeId || null;
      hoveredTargetPortRef.current = target?.port || null;
      setDropTarget(target?.nodeId || null);
      setDropTargetPort(target?.port || null);
    };

    const stop = (ev) => {
      if (ev) {
        const finalTarget = findConnectionTarget(
          toCanvasCoords(ev.clientX, ev.clientY),
          workflow.nodes,
          connectingRef.current,
          PORT_HIT_RADIUS / zoomRef.current
        );
        if (finalTarget) {
          hoveredTargetRef.current = finalTarget.nodeId;
          hoveredTargetPortRef.current = finalTarget.port;
        }
      }
      const src = connectingRef.current;
      const tgt = hoveredTargetRef.current;
      const sp  = sourcePortRef.current        || "right";
      const tp  = hoveredTargetPortRef.current || "left";
      if (src && tgt && src !== tgt) connectNodes(src, tgt, sp, tp);
      connectingRef.current         = null;
      hoveredTargetRef.current      = null;
      hoveredTargetPortRef.current  = null;
      sourcePortRef.current         = "right";
      setConnectingFrom(null);
      setGhostPoint(null);
      setDropTarget(null);
      setDropTargetPort(null);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup",   stop);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup",   stop);
  }

  // ── derived ───────────────────────────────────────────────────────────────────
  const nodeById        = new Map(workflow.nodes.map((n) => [n.id, n]));
  const highlightNodeId = selectedNodeId || hoveredNodeId;

  // ── Edge routing — fan shared ports ─────────────────────────────────────────
  const flowEdges = workflow.edges.filter((e) => e.type !== "tool");

  const edgeOffsets = (() => {
    const offsets    = {};
    const MAX_SPREAD = 30;

    function fan(edgeId, nodeId, role) {
      const siblings = flowEdges
        .filter((e) => role === "src" ? e.source === nodeId : e.target === nodeId)
        .sort((a, b) => {
          const ya = (nodeById.get(role === "src" ? a.target : a.source)?.position?.y ?? 0);
          const yb = (nodeById.get(role === "src" ? b.target : b.source)?.position?.y ?? 0);
          return ya - yb;
        });
      if (siblings.length <= 1) return 0;
      const idx    = siblings.findIndex((e) => e.id === edgeId);
      const spread = Math.min(MAX_SPREAD, 12 * (siblings.length - 1));
      return idx * (spread / (siblings.length - 1)) - spread / 2;
    }

    flowEdges.forEach((edge) => {
      offsets[edge.id] = {
        src: fan(edge.id, edge.source, "src"),
        tgt: fan(edge.id, edge.target, "tgt")
      };
    });
    return offsets;
  })();

  // ── render ────────────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden"
      style={{
        cursor: isPanning ? "grabbing" : connectingFrom ? "crosshair" : "default",
        backgroundColor: "rgb(var(--color-canvas))",
        backgroundImage: "radial-gradient(rgb(var(--color-hairline-strong) / 0.45) 1px, transparent 1px)",
        backgroundSize: "20px 20px",
        backgroundPosition: `${pan.x % 20}px ${pan.y % 20}px`
      }}
      onClick={() => { selectNode(""); setSelectedNodeIds([]); setGroupMenu(null); clearSelectedEdge(); }}
      onContextMenu={(e) => {
        if (selectedNodeIds.length > 1) {
          e.preventDefault();
          setGroupMenu({ type: "canvas", x: e.clientX, y: e.clientY });
        }
      }}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes("workflow_ref_id")) {
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
        }
      }}
      onDrop={(e) => {
        const wfId = e.dataTransfer.getData("workflow_ref_id");
        const wfName = e.dataTransfer.getData("workflow_ref_name");
        if (!wfId) return;
        e.preventDefault();
        const pos = toCanvasCoords(e.clientX, e.clientY);
        const node = createWorkflowRefNode(wfId, wfName, pos);
        const { workflow: wf } = useWorkflowStore.getState();
        useWorkflowStore.getState().setWorkflow({
          ...wf,
          nodes: [...wf.nodes, node],
          updatedAt: new Date().toISOString()
        });
      }}
    >

      {/* ── Framework label — fixed to viewport ── */}
      <div className="pointer-events-none absolute left-4 top-3 z-20 rounded-full border border-hairline bg-panel/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted backdrop-blur-sm">
        {workflow.builderTarget === "langchain" ? "LangChain" : workflow.builderTarget === "python" ? "Python" : "LangGraph"}
      </div>

      {workflow.nodes.length === 0 && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center text-sm text-muted">
          Start building. Add your first node or drag a workflow from the left panel.
        </div>
      )}

      {/* ── Canvas world — panned & zoomed ── */}
      <div
        style={{
          position: "absolute",
          top: 0, left: 0,
          width: 8000, height: 6000,
          transformOrigin: "0 0",
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
        }}
        // Background click/drag starts pan; node clicks stopPropagation before here
        onPointerDown={onBackgroundDown}
      >
        {/* ── Group rectangles (below nodes) ── */}
        {(workflow.groups || []).map((group) => {
          const b = groupBounds(group, workflow.nodes);
          if (!b) return null;
          return (
            <div
              key={group.id}
              style={{
                position: "absolute",
                left: b.x,
                top: b.y,
                width: b.w,
                height: b.h,
                border: `2px dashed ${group.color}`,
                borderRadius: 10,
                pointerEvents: "none",
                zIndex: 1,
              }}
            >
              {/* Title label — pointer-events restored so it can be interacted with */}
              <div
                style={{
                  position: "absolute",
                  top: 2,
                  left: 8,
                  pointerEvents: "auto",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  userSelect: "none",
                }}
              >
                <span
                  style={{
                    background: `${group.color}22`,
                    border: `1px solid ${group.color}55`,
                    borderRadius: 4,
                    padding: "1px 7px",
                    fontSize: 11,
                    fontWeight: 600,
                    color: group.color,
                    cursor: "default",
                    letterSpacing: "0.03em",
                    maxWidth: 180,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    const name = window.prompt("Rename group:", group.name);
                    if (name?.trim()) renameGroup(group.id, name.trim());
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setGroupMenu({ type: "group", x: e.clientX, y: e.clientY, groupId: group.id, color: group.color });
                  }}
                  title="Double-click to rename · Right-click for options"
                >
                  {group.name}
                </span>
              </div>
            </div>
          );
        })}

        {/* ── SVG edges ── */}
        <svg
          className="pointer-events-none absolute inset-0 z-0 overflow-visible"
          width={8000}
          height={6000}
        >
          <defs>
            <marker id="arr-default" viewBox="0 0 10 10" markerWidth="7" markerHeight="7" refX="9" refY="5" orient="auto">
              <path d="M0,0 L10,5 L0,10 z" fill={CONNECT_ACCENT} />
            </marker>
            <marker id="arr-active" viewBox="0 0 10 10" markerWidth="7" markerHeight="7" refX="9" refY="5" orient="auto">
              <path d="M0,0 L10,5 L0,10 z" fill="#f59e0b" />
            </marker>
            <marker id="arr-done" viewBox="0 0 10 10" markerWidth="7" markerHeight="7" refX="9" refY="5" orient="auto">
              <path d="M0,0 L10,5 L0,10 z" fill="#22c55e" />
            </marker>
            <marker id="arr-selected" viewBox="0 0 10 10" markerWidth="7" markerHeight="7" refX="9" refY="5" orient="auto">
              <path d="M0,0 L10,5 L0,10 z" fill="#3b82f6" />
            </marker>
            <marker id="arr-tool" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
              <circle cx="2.5" cy="2.5" r="2" fill="rgb(var(--color-hairline-strong))" />
            </marker>
          </defs>

          {/* ── Ghost edge while connecting ports ── */}
          {connectingFrom && ghostPoint && (() => {
            const srcNode = nodeById.get(connectingFrom.nodeId);
            if (!srcNode) return null;
            const side = connectingFrom.port || "right";
            const sp   = offsetFromSide(portPos(srcNode, side), side, EDGE_PORT_GAP);
            const dist = Math.max(60, Math.hypot(ghostPoint.x - sp.x, ghostPoint.y - sp.y) * 0.45);
            const cd   = ctrlDelta(side, dist);
            const d    = `M ${sp.x} ${sp.y} C ${sp.x + cd.x} ${sp.y + cd.y}, ${ghostPoint.x} ${ghostPoint.y}, ${ghostPoint.x} ${ghostPoint.y}`;
            return (
              <g key="ghost">
                <path d={d} fill="none" stroke={CONNECT_ACCENT} strokeWidth="2" strokeDasharray="6 4" opacity="0.9" />
                <circle cx={ghostPoint.x} cy={ghostPoint.y} r="4" fill={CONNECT_ACCENT} opacity="0.9" />
              </g>
            );
          })()}

          {workflow.edges.map((edge) => {
            const src = nodeById.get(edge.source);
            const tgt = nodeById.get(edge.target);
            if (!src || !tgt) return null;

            const isTool = edge.type === "tool";
            // Resolve port sides — default to right→left for backward compat
            const sp = edge.sourcePort || "right";
            const tp = edge.targetPort || "left";

            // Port positions
            const sBase = portPos(src, sp);
            const eBase = portPos(tgt, tp);
            // Fan offset for edges sharing the same source port (vertical for h-ports, horizontal for v-ports)
            const off = !isTool ? (edgeOffsets[edge.id] ?? { src: 0, tgt: 0 }) : { src: 0, tgt: 0 };
            const isVPort = (side) => side === "top" || side === "bottom";
            const sPort = isVPort(sp)
              ? { x: sBase.x + off.src, y: sBase.y }
              : { x: sBase.x, y: sBase.y + off.src };
            const ePort = isVPort(tp)
              ? { x: eBase.x + off.tgt, y: eBase.y }
              : { x: eBase.x, y: eBase.y + off.tgt };
            const s = offsetFromSide(sPort, sp, EDGE_PORT_GAP);
            const e = offsetFromSide(ePort, tp, EDGE_PORT_GAP);

            // Control point distance scales with the straight-line distance
            const dist = Math.max(60, Math.hypot(e.x - s.x, e.y - s.y) * 0.45);
            const cd1  = ctrlDelta(sp, dist);
            const cd2  = ctrlDelta(tp, dist);

            // Unified bezier — works for all directions including same-side and backward
            const d = `M ${s.x} ${s.y} C ${s.x + cd1.x} ${s.y + cd1.y}, ${e.x + cd2.x} ${e.y + cd2.y}, ${e.x} ${e.y}`;

            if (isTool) {
              const isEdgeSelected = edge.id === selectedEdgeId;
              const isEdgeHovered  = edge.id === hoveredEdgeId;
              const isHit    = !!highlightNodeId && (edge.source === highlightNodeId || edge.target === highlightNodeId);
              const isDimmed = !!highlightNodeId && !isHit;
              const toolOpacity = isEdgeSelected ? 1 : isDimmed ? 0.07 : isEdgeHovered ? 0.85 : isHit ? 0.9 : 0.35;
              const toolStroke = isEdgeSelected ? "#3b82f6" : "rgb(var(--color-hairline-strong))";
              return (
                <g key={edge.id} style={{ opacity: toolOpacity }}>
                  <path
                    d={d} fill="none" stroke="transparent" strokeWidth="14"
                    style={{ pointerEvents: "all", cursor: "pointer" }}
                    onMouseEnter={() => setHoveredEdgeId(edge.id)}
                    onMouseLeave={() => setHoveredEdgeId(null)}
                    onClick={(ev) => { ev.stopPropagation(); selectEdge(edge.id); selectNode(""); }}
                  />
                  <path d={d} fill="none" stroke={toolStroke}
                    strokeWidth={isEdgeSelected || isEdgeHovered ? 2 : 1.5}
                    strokeDasharray="5 4"
                    markerEnd={isEdgeSelected ? "url(#arr-selected)" : "url(#arr-tool)"}
                    style={{ pointerEvents: "none" }}
                  />
                </g>
              );
            }

            const srcSt         = executionState[edge.source];
            const tgtSt         = executionState[edge.target];
            const isActive      = srcSt === "completed" && tgtSt === "running";
            const isDone        = srcSt === "completed" && (tgtSt === "completed" || tgtSt === "failed");
            const isHit         = !!highlightNodeId && (edge.source === highlightNodeId || edge.target === highlightNodeId);
            const isDimmed      = !!highlightNodeId && !isHit;
            const isEdgeSelected = edge.id === selectedEdgeId;
            const isEdgeHovered  = edge.id === hoveredEdgeId;

            const stroke  = isEdgeSelected ? "#3b82f6" : isActive ? "#f59e0b" : isDone ? "#22c55e" : CONNECT_ACCENT;
            const marker  = isEdgeSelected ? "arr-selected" : isActive ? "arr-active" : isDone ? "arr-done" : "arr-default";
            const opacity = isEdgeSelected ? 1 : isDimmed ? 0.08 : isEdgeHovered ? 0.9 : isHit ? 1 : 0.4;
            const width   = isEdgeSelected || isEdgeHovered ? 3 : isHit || isActive ? 2.5 : 1.5;

            return (
              <g key={edge.id} style={{ opacity }}>
                <path
                  d={d} fill="none" stroke="transparent" strokeWidth="14"
                  style={{ pointerEvents: "all", cursor: "pointer" }}
                  onMouseEnter={() => setHoveredEdgeId(edge.id)}
                  onMouseLeave={() => setHoveredEdgeId(null)}
                  onClick={(ev) => { ev.stopPropagation(); selectEdge(edge.id); selectNode(""); }}
                />
                <path d={d} fill="none" stroke={stroke} strokeWidth={width}
                  markerEnd={`url(#${marker})`}
                  style={{ pointerEvents: "none" }}
                  {...(isActive ? { strokeDasharray: "6 3", className: "edge-flow" } : {})}
                />
              </g>
            );
          })}
        </svg>

        {/* ── Node cards ── */}
        {workflow.nodes.map((node) => {
          const isSelected  = node.id === selectedNodeId;
          const pos         = node.position || { x: 0, y: 0 };
          const incoming    = workflow.edges.filter((e) => e.target === node.id).length;
          const outgoing    = workflow.edges.filter((e) => e.source === node.id).length;
          const exStatus    = executionState[node.id];
          const toolCount   = ((node.builtinTools || []).length + (node.customTools || []).length);

          // ── Tool node ─────────────────────────────────────────────────────
          if (node.type === "tool") {
            const toolBorder = isSelected
              ? "border-primary ring-2 ring-primary/15"
              : "border-dashed border-hairlineStrong";
            const dimStyle = !!highlightNodeId && node.id !== highlightNodeId ? { opacity: 0.4 } : {};
            return (
              <div
                key={node.id}
                className={`group absolute z-10 cursor-grab select-none rounded-md border bg-panel px-3 py-2.5 shadow-soft transition-opacity active:cursor-grabbing ${toolBorder}`}
                style={{ left: pos.x, top: pos.y, width: TOOL_NODE_WIDTH, minHeight: TOOL_NODE_HEIGHT, ...dimStyle }}
                onPointerDown={(e) => startDrag(e, node)}
                onMouseEnter={() => setHoveredId(node.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={(e) => { e.stopPropagation(); selectNode(node.id); }}
                role="button"
                tabIndex={0}
              >
                {/* Tool node — left + right ports only */}
                {PORT_SIDES.map((side) => {
                  const isActiveDrop = dropTarget === node.id && dropTargetPort === side;
                  const isAnyDrop = dropTarget === node.id;
                  return (
                    <span
                      key={side}
                      style={portStyle(TOOL_NODE_WIDTH, TOOL_NODE_HEIGHT, side)}
                      className={`absolute z-20 h-2.5 w-2.5 cursor-crosshair rounded-full border border-panel transition-all ${
                        isActiveDrop
                          ? "bg-sky-300 ring-2 ring-sky-300/70 scale-150 opacity-100"
                          : isAnyDrop
                            ? "bg-primary opacity-60 scale-110"
                            : connectingFrom
                              ? "bg-primary opacity-50"
                              : "opacity-0 group-hover:opacity-100 bg-primary hover:bg-sky-300 hover:scale-125"
                      }`}
                      onPointerDown={(e) => startPortDrag(e, node.id, side)}
                      title={`Connect from ${side}`}
                    />
                  );
                })}

                <div className="flex items-start gap-2">
                  <div className="mt-0.5 rounded-md bg-surfaceStrong p-1.5 text-ink">
                    <Wrench size={13} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-semibold text-ink">{node.name}</div>
                    <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
                      {node.toolType === "builtin" ? "Builtin" : node.toolType === "mcp" ? "MCP" : node.toolType === "custom" ? "Custom" : "HTTP API"}
                    </div>
                  </div>
                  {/* Permanent delete button */}
                  <button
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted transition hover:bg-error/10 hover:text-error"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); deleteNode(node.id); }}
                    title="Remove tool"
                  >
                    <X size={12} />
                  </button>
                </div>

                <div className="mt-2 truncate text-[11px] text-muted">
                  {node.toolType === "http" && node.endpoint
                    ? node.endpoint
                    : node.toolType === "builtin" && node.builtinId
                      ? node.builtinId
                      : node.description || "Not configured yet"}
                </div>
              </div>
            );
          }

          const isBoxSelected = selectedNodeIds.includes(node.id);
          let borderClass =
            exStatus === "running"   ? "border-yellow-400 ring-2 ring-yellow-400/30" :
            exStatus === "completed" ? "border-green-500  ring-2 ring-green-500/20"  :
            exStatus === "failed"    ? "border-red-500    ring-2 ring-red-500/20"    :
            isSelected               ? "border-primary    ring-2 ring-primary/15"    :
            isBoxSelected            ? "border-blue-500   ring-2 ring-blue-400/25"   :
                                       "border-hairlineStrong";

          // Dim nodes that are not hovered/selected when something IS highlighted
          const nodeDim = !!highlightNodeId && node.id !== highlightNodeId
            ? { opacity: 0.45 }
            : {};

          const isDropTarget = dropTarget === node.id;

          return (
            <div key={node.id} className="group absolute z-10" style={{ left: pos.x, top: pos.y }}>
              {/* 4 ports — one per side. All are drag sources AND drop targets. */}
              {[
                { side: "left",   style: { left: -5,             top: "50%",  transform: "translateY(-50%)" } },
                { side: "right",  style: { left: NODE_WIDTH - 5, top: "50%",  transform: "translateY(-50%)" } },
                { side: "top",    style: { top: -5,              left: "50%", transform: "translateX(-50%)" } },
                { side: "bottom", style: { bottom: -5,           left: "50%", transform: "translateX(-50%)" } },
              ].map(({ side, style }) => {
                const isActiveDrop = dropTarget === node.id && dropTargetPort === side;
                const isAnyDrop    = dropTarget === node.id;
                return (
                  <span
                    key={side}
                    style={style}
                    className={`absolute z-20 h-2.5 w-2.5 cursor-crosshair rounded-full border border-panel transition-all ${
                      isActiveDrop
                        ? "bg-sky-300 ring-2 ring-sky-300/70 scale-150 opacity-100"
                        : isAnyDrop
                          ? "bg-primary opacity-60 scale-110"
                          : connectingFrom
                            ? "bg-primary opacity-50"
                            : "opacity-0 group-hover:opacity-100 bg-primary hover:bg-sky-300 hover:scale-125"
                    }`}
                    onPointerDown={(e) => startPortDrag(e, node.id, side)}
                    title={`Connect from ${side}`}
                  />
                );
              })}
            <div
              className={`cursor-grab select-none rounded-md border bg-panel px-4 py-3 shadow-soft transition-opacity active:cursor-grabbing ${borderClass}`}
              style={{ width: NODE_WIDTH, minHeight: NODE_HEIGHT, ...nodeDim }}
              onPointerDown={(e) => startDrag(e, node)}
              onMouseEnter={() => setHoveredId(node.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={(e) => {
                e.stopPropagation();
                if (e.shiftKey) {
                  setSelectedNodeIds((prev) =>
                    prev.includes(node.id) ? prev.filter((id) => id !== node.id) : [...prev, node.id]
                  );
                } else {
                  selectNode(node.id);
                  setSelectedNodeIds([]);
                }
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                // WorkflowRef: double-click navigates to the target workflow
                if (node.type === "workflow_ref" && node.targetWorkflowId) {
                  setActiveWorkflow(node.targetWorkflowId);
                }
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (selectedNodeIds.length > 1 && selectedNodeIds.includes(node.id)) {
                  setGroupMenu({ type: "canvas", x: e.clientX, y: e.clientY });
                } else {
                  selectNode(node.id);
                  setSelectedNodeIds([]);
                  setNodeMenu({ nodeId: node.id, x: e.clientX, y: e.clientY });
                }
              }}
              role="button"
              tabIndex={0}
            >
              {/* Execution badge */}
              {exStatus === "running" && (
                <span className="absolute -right-1.5 -top-1.5 h-4 w-4 rounded-full bg-yellow-400 ring-2 ring-panel animate-pulse" />
              )}
              {exStatus === "completed" && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-green-500 ring-2 ring-panel text-[8px] font-bold text-white">✓</span>
              )}
              {exStatus === "failed" && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 ring-2 ring-panel text-[8px] font-bold text-white">✗</span>
              )}


              <div className="flex items-start gap-2">
                <div className={`mt-0.5 rounded-md p-1.5 ${nodeAccent(node.type)}`}>
                  {nodeIcon(node.type)}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[15px] font-semibold leading-snug text-ink">{node.name}</div>
                  <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
                    {NODE_TYPE_LABELS[node.type] || node.type}
                  </div>
                </div>
              </div>

              {toolCount > 0 && (
                <div className="mt-2 flex items-center gap-1">
                  <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/8 px-2 py-0.5 text-[10px] font-medium text-primary">
                    <Wrench size={9} />
                    {toolCount} tool{toolCount !== 1 ? "s" : ""}
                  </span>
                </div>
              )}

              <div className="mt-2 line-clamp-2 min-h-[28px] text-[12px] leading-snug text-body">
                {nodeSummary(node)}
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-hairline pt-2 text-[11px] text-muted">
                <span className="truncate">
                  {node.type === "user_input" ? "runtime input" : node.type === "output" ? "output sink" : node.type === "workflow_ref" ? "double-click to open" : node.model || "no model"}
                </span>
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2 size={11} />
                  {incoming}↓ {outgoing}↑
                </span>
              </div>
            </div>
            </div>
          );
        })}
      </div>

      {/* ── Group / multi-select context menu ── */}
      {groupMenu && (
        <GroupContextMenu
          menu={groupMenu}
          selectedNodeIds={selectedNodeIds}
          onCreateGroup={(name, color) => {
            createGroup(selectedNodeIds, name, color);
            setSelectedNodeIds([]);
            setGroupMenu(null);
          }}
          onRenameGroup={(id) => {
            const g = (workflow.groups || []).find((g) => g.id === id);
            const name = window.prompt("Rename group:", g?.name || "");
            if (name?.trim()) renameGroup(id, name.trim());
            setGroupMenu(null);
          }}
          onColorGroup={(id, color) => { updateGroupColor(id, color); setGroupMenu(null); }}
          onDeleteGroup={(id) => { deleteGroup(id); setGroupMenu(null); }}
          onUngroup={(id) => { ungroupNodes(id); setGroupMenu(null); }}
          onClose={() => setGroupMenu(null)}
        />
      )}

      {/* ── Per-node context menu ── */}
      {nodeMenu && (
        <NodeContextMenu
          nodeId={nodeMenu.nodeId}
          x={nodeMenu.x}
          y={nodeMenu.y}
          workflow={workflow}
          onClose={() => setNodeMenu(null)}
          onOpenInTab={(id) => { openAgentTab(id); setNodeMenu(null); }}
          onRename={(id) => {
            const n = workflow.nodes.find((x) => x.id === id);
            const name = window.prompt("Rename agent:", n?.name || "");
            if (name?.trim()) updateNode(id, { name: name.trim() });
            setNodeMenu(null);
          }}
          onDuplicate={(id) => { duplicateNode(id); setNodeMenu(null); }}
          onConnect={(id) => {
            selectNode(id);
            setNodeMenu(null);
            setConnectingFrom({ nodeId: id });
            connectingRef.current = id;
          }}
          onDelete={(id) => { deleteNode(id); setNodeMenu(null); }}
          onConfigureTools={(id) => { selectNode(id); setNodeMenu(null); }}
        />
      )}

      {/* ── Multi-select hint ── */}
      {selectedNodeIds.length > 1 && (
        <div className="pointer-events-none absolute bottom-12 left-1/2 z-30 -translate-x-1/2 rounded-full border border-blue-400/30 bg-blue-50/90 px-3 py-1 text-[11px] font-medium text-blue-700 shadow-sm backdrop-blur-sm">
          {selectedNodeIds.length} nodes selected — right-click to group
        </div>
      )}
    </div>
  );
}

// ── Per-node context menu ─────────────────────────────────────────────────────

function NodeContextMenu({ nodeId, x, y, workflow, onClose, onOpenInTab, onRename, onDuplicate, onConnect, onDelete, onConfigureTools }) {
  const ref = useRef(null);
  const node = workflow.nodes.find((n) => n.id === nodeId);

  useEffect(() => {
    const onKey  = (e) => { if (e.key === "Escape") onClose(); };
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [onClose]);

  if (!node) return null;

  const isAgent = node.type === "agent" || node.type === "orchestrator";

  return (
    <div
      ref={ref}
      className="fixed z-[9999] w-52 overflow-hidden rounded-lg border border-hairlineStrong bg-panel py-1 shadow-2xl"
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="border-b border-hairline px-3 py-2">
        <p className="truncate text-[12px] font-semibold text-ink">{node.name}</p>
        <p className="text-[10px] text-muted">{NODE_TYPE_LABELS[node.type] ?? node.type}</p>
      </div>

      <button
        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] text-body transition hover:bg-canvasSoft hover:text-ink"
        onClick={() => onOpenInTab(nodeId)}
      >
        <ExternalLink size={12} className="shrink-0 text-muted" />
        Open Agent in New Tab
      </button>

      <div className="my-1 border-t border-hairline" />

      <button
        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] text-body transition hover:bg-canvasSoft hover:text-ink"
        onClick={() => onRename(nodeId)}
      >
        Rename
      </button>
      <button
        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] text-body transition hover:bg-canvasSoft hover:text-ink"
        onClick={() => onDuplicate(nodeId)}
      >
        <Copy size={12} className="shrink-0 text-muted" />
        Duplicate
        <span className="ml-auto text-[11px] text-muted">Ctrl+D</span>
      </button>

      <div className="my-1 border-t border-hairline" />

      <button
        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] text-body transition hover:bg-canvasSoft hover:text-ink"
        onClick={() => onConnect(nodeId)}
      >
        <Link2 size={12} className="shrink-0 text-muted" />
        Add Connection…
      </button>

      {isAgent && (
        <>
          <div className="my-1 border-t border-hairline" />
          <p className="px-3 pt-1 text-[10px] font-semibold uppercase tracking-widest text-muted">Developer</p>
          <button
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] text-body transition hover:bg-canvasSoft hover:text-ink"
            onClick={() => onConfigureTools(nodeId)}
          >
            <Wrench size={12} className="shrink-0 text-muted" />
            Configure Tools
          </button>
          <button
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] text-body transition hover:bg-canvasSoft hover:text-ink"
            onClick={() => {
              const blob = new Blob([JSON.stringify(node, null, 2)], { type: "application/json" });
              const url  = URL.createObjectURL(blob);
              const a    = document.createElement("a");
              a.href = url; a.download = `${node.name}.json`; a.click();
              URL.revokeObjectURL(url);
              onClose();
            }}
          >
            Export Agent JSON
          </button>
        </>
      )}

      <div className="my-1 border-t border-hairline" />

      <button
        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] text-red-500 transition hover:bg-red-50"
        onClick={() => onDelete(nodeId)}
      >
        <Trash2 size={12} className="shrink-0" />
        Delete
        <span className="ml-auto text-[11px] text-muted/70">Del</span>
      </button>
    </div>
  );
}

// ── Group context menu component ───────────────────────────────────────────────

function GroupContextMenu({ menu, selectedNodeIds, onCreateGroup, onRenameGroup, onColorGroup, onDeleteGroup, onUngroup, onClose }) {
  const [step, setStep] = useState(menu.type === "canvas" ? "main" : "group");
  const [groupName, setGroupName] = useState("New Group");
  const inputRef = useRef(null);

  useEffect(() => {
    if (step === "name") inputRef.current?.focus();
  }, [step]);

  useEffect(() => {
    const close = (e) => {
      if (!e.target.closest("[data-group-menu]")) onClose();
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [onClose]);

  return (
    <div
      data-group-menu
      className="fixed z-50 min-w-[180px] overflow-hidden rounded-lg border border-hairlineStrong bg-panel shadow-2xl"
      style={{ left: menu.x, top: menu.y }}
      onClick={(e) => e.stopPropagation()}
    >
      {menu.type === "canvas" && step === "main" && (
        <>
          <div className="border-b border-hairline px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
              {selectedNodeIds.length} nodes selected
            </p>
          </div>
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-[13px] text-body transition hover:bg-canvasSoft hover:text-ink"
            onClick={() => setStep("name")}
          >
            Group selection
          </button>
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-[13px] text-muted transition hover:bg-canvasSoft hover:text-ink"
            onClick={onClose}
          >
            Cancel
          </button>
        </>
      )}

      {step === "name" && (
        <div className="p-3">
          <p className="mb-2 text-[11px] font-semibold text-muted">Group name</p>
          <input
            ref={inputRef}
            className="w-full rounded border border-hairlineStrong bg-canvas px-2 py-1.5 text-[13px] text-ink outline-none focus:border-primary"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") setStep("color"); }}
            placeholder="New Group"
          />
          <p className="mt-2 mb-2 text-[11px] font-semibold text-muted">Color</p>
          <div className="flex gap-1.5">
            {GROUP_COLORS.map((c) => (
              <button
                key={c}
                className="h-5 w-5 rounded-full ring-offset-1 transition hover:ring-2"
                style={{ background: c, ringColor: c }}
                onClick={() => onCreateGroup(groupName || "New Group", c)}
              />
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <button className="btn flex-1 text-[12px]" onClick={onClose}>Cancel</button>
            <button
              className="btn-primary flex-1 text-[12px]"
              onClick={() => onCreateGroup(groupName || "New Group", GROUP_COLORS[0])}
            >
              Create
            </button>
          </div>
        </div>
      )}

      {menu.type === "group" && step === "group" && (
        <>
          <div className="border-b border-hairline px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Group</p>
          </div>
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-[13px] text-body transition hover:bg-canvasSoft hover:text-ink"
            onClick={() => onRenameGroup(menu.groupId)}
          >
            Rename
          </button>
          <div className="border-t border-hairline px-3 py-2">
            <p className="mb-1.5 text-[10px] font-semibold text-muted">Color</p>
            <div className="flex gap-1.5">
              {GROUP_COLORS.map((c) => (
                <button
                  key={c}
                  className={`h-5 w-5 rounded-full transition hover:ring-2 ring-offset-1 ${menu.color === c ? "ring-2 ring-offset-1" : ""}`}
                  style={{ background: c }}
                  onClick={() => onColorGroup(menu.groupId, c)}
                />
              ))}
            </div>
          </div>
          <div className="border-t border-hairline">
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-[13px] text-muted transition hover:bg-canvasSoft hover:text-ink"
              onClick={() => onUngroup(menu.groupId)}
            >
              Ungroup
            </button>
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-[13px] text-red-500 transition hover:bg-red-50"
              onClick={() => onDeleteGroup(menu.groupId)}
            >
              Delete group
            </button>
          </div>
        </>
      )}
    </div>
  );
}
