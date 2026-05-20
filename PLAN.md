<!-- /autoplan restore point: /c/Users/Shrey/.gstack/projects/ShreyKansal-DriverDirect/main-autoplan-restore-20260520-102317.md -->

# DriverDirect: Agent Console Tab — Advanced Full-Page Agent View

**Branch:** main | **Date:** 2026-05-20
**Author:** Shrey Kansal
**Status:** Draft — pending autoplan review

---

## Problem Statement

When a user clicks "Open in new tab" on an agent node, `AgentDetailView` opens a full-page view. Currently this view is a thin wrapper: left sidebar with "Config" and "Connections", the right side just embeds the same `AgentConfigPanel` that appears in the compact right panel.

This means the expanded tab gives you no extra space, no extra information, and no extra power over what you already have in the right panel. It's a missed opportunity for a genuinely powerful per-agent workspace.

The user wants the agent tab to:
1. **Look like the Settings tab** — two-column layout with a left navigation sidebar (grouped sections, similar to `UnifiedSettingsPanel`) and a wide content area per section
2. **Be properly segregated** — Identity, Instructions, Model, Tools (further split: Built-in / Custom / Tool Nodes / Tool Behavior), Connections, Output
3. **Include a Dev Mode** — an advanced console for the agent: raw JSON state, live execution trace, token usage, prompt history, prompt-level debugging, and direct tool call testing

---

## Goal

**Dev Mode is the headline.** The Agent Console tab opens to Dev Mode by default — inspect state, test tools, run prompts, read traces. This is what "advanced console" means. The Configure sections (Identity, Instructions, Model, Tools, Connections, Output) are organized in a Settings-panel sidebar and fully functional, but they are secondary to execution.

Every field visible in the compact right panel is also here, with more space. But the reason you open this tab is to execute and observe, not to fill in more config fields.

---

## Scope

### In Scope

**1. Redesign `AgentDetailView.jsx`**  
Replace the current 2-item sidebar + embedded `AgentConfigPanel` with:
- Left navigation sidebar matching the Settings panel pattern (grouped sections, active indicator, smooth scroll-to-section or tab switching)
- Sidebar groups: **Configure** (Identity, Instructions, Model, Tools, Connections, Output), **Developer** (Dev Mode)
- Wide centered content area (max-width ~860px, same as Settings)
- Sticky section headers in the content area

**2. Identity section** (full-page, not cramped)
- Editable agent name (large, prominent)
- Role/purpose textarea (tall, with character count)
- Node type selector: pill buttons for Agent / Orchestrator / Input / Output
- Input Mode selector with plain-English labels
- Agent status badge (Active / Inactive — visual only, future hook)

**3. Instructions section**
- Full-height system prompt textarea with line numbers or monospace font option
- Character count + estimated token count
- Collapsible tips panel
- "Preview compiled prompt" button — shows the full prompt that will be sent (role + system prompt merged)

**4. Model section**
- Provider / Model selects (same as current)
- Temperature: labeled slider (Precise 0.0 → Balanced 0.75 → Creative 1.5)
- Max Tokens with plain-English description
- API key status indicator (green/red dot)
- Model capability badges (context window, supports tools, supports vision)

**5. Tools section** — split into 4 sub-sections with their own sidebar nav items or in-page headers

- **Tool Nodes** — canvas nodes connected to this agent. Show name, type icon, description. Edit link opens ToolConfigPanel in-place. Add new Tool Node button.
- **Built-in Tools** — searchable card grid (name, description, provider badge). Toggle to add/remove. Currently-active tools highlighted.
- **Custom Tools** — list of inline tools. Create new in Simple mode (name + description + trigger form) or Code mode (Python editor). Edit/delete per tool.
- **Tool Behavior** — Tool Mode selector (sequential / parallel / router), max tool calls setting, tool timeout setting

**6. Connections section**
- Receives From list with edge labels
- Sends To list with edge labels
- Add connection: dropdown + button
- Edge count summary badge
- Visual mini-graph preview (optional: simple ASCII-style or SVG showing this node's neighbors — can be a Phase 2 item, defer if complex)

**7. Output section**
- Output format selector (Markdown / JSON / Plain Text)
- Schema config button (opens `OutputConfigModal`)
- Output naming prefix field
- Intermediate output visibility toggle

**8. Dev Mode section** — the centerpiece, opens by default

Two-panel layout. Left = inspector. Right = actions. Both are real and functional on ship.

Left sub-panel (Inspector tabs):
- **State** — raw JSON of the agent's node data from the store (live, copy button). Updates reactively as user edits config.
- **Trace** — this agent's execution trace from last run: input received, each tool call (name, args, result), final output. Pulls from `runs[projectId]` store state. Shows "No run yet" empty state with a Run button.
- **Tokens** — prompt tokens, completion tokens, total. Estimate cost based on known model pricing. Show per-run history (last 5 runs).
- **Prompt Preview** — the full compiled prompt as it will be sent: role prepended + system prompt. Syntax-highlighted. Copy button. Character and token count.

Right sub-panel (Actions — all real, no "Coming Soon"):
- **Quick Run** — text input + Run button. Sends the user message to this agent's model call directly by constructing a minimal synthetic workflow (`{ nodes: [userInputNode, thisAgentNode], edges: [inputToAgent] }`) and POSTing to the existing `/api/run` endpoint. No new backend route needed. Response shown synchronously in the output area. This is the primary action — it's the first thing visible.
- **Test Tool Call** — select from tools attached to this agent. JSON args textarea. Click "Run Tool". **UI shows disabled state** if no tools are attached ("No tools attached to this agent"). Tool test endpoint (`/api/tools/test`) only supports Python custom tools today — for other tool types, show "Testing not available for this tool type" inline message. No endpoint changes needed.
- **Override Prompt** — textarea. "Active for next run only" checkbox. Injects additional instructions prepended to the system prompt for the next Quick Run only. Stored in component state, not persisted. Visible warning label: "Resets when this tab closes."

Dev Mode is the **default section** when the tab opens. The header also has a "Dev Mode" button (terminal icon) that jumps back to Dev Mode from any other section.

**9. Header update**
- Keep agent name + type badge + model badge + close button
- Add a "Dev Mode" toggle button in the header (terminal icon, toggles to Dev Mode section)
- Add a breadcrumb: "Workflow / {agent name}" in small text below the name

### Out of Scope

- Backend changes for Tool Call testing (that endpoint is deferred — UI scaffolding can exist with a "coming soon" state)
- Visual mini-graph preview in Connections (defer to Phase 2)
- Full streaming for Quick Run (backend streaming infrastructure needed — Quick Run ships with synchronous response initially)
- Changes to `AgentConfigPanel.jsx`, `ToolConfigPanel.jsx`, `CustomToolEditor.jsx` — those are owned by the separate Config Panel redesign plan. This plan only touches `AgentDetailView.jsx` and creates any new sub-components it needs.
- Store data model changes — read/write same fields as today

---

## Information Architecture

### Current (thin wrapper)

```
Header: [icon] [name] [model badge] [X]

Sidebar (228px):
  Config      ← active
  Connections

Content:
  <AgentConfigPanel embedded — same as right panel>
```

### New (Advanced Console)

```
Header (48px):
  [icon] [name] [type badge] | [model badge] [Dev Mode button] [X]
  breadcrumb: Workflow / {name}

Sidebar (220px):
  DEVELOPER             ← group first
    Dev Mode            ← default active section
  CONFIGURE
    Identity
    Instructions
    Model
    Tools
      ↳ Tool Nodes
      ↳ Built-in
      ↳ Custom
      ↳ Behavior
    Connections
    Output

Content (max-w-[860px], centered):
  <section content — full-width, well-spaced, Settings panel styling>
  <Dev Mode opens by default on tab open>
```

---

## Dev Mode Layout

```
Dev Mode (content area, max-w-[860px] content column, sidebar excluded):
┌────────────────────────────────────────────────────────────────────────┐
│ DEV MODE    [State] [Trace] [Tokens] [Prompt Preview]                  │
├─────────────────────────────────┬──────────────────────────────────────┤
│                                 │  ┌─ Quick Run (PRIMARY) ─────────┐  │
│  <inspector tab content>        │  │  [user message input........]  │  │
│                                 │  │  [Run ▶]                       │  │
│  State: raw JSON of agent node  │  │  ┌─ output area ──────────┐   │  │
│  Trace: tool calls + result     │  │  │ <response or empty>    │   │  │
│  Tokens: usage + cost estimate  │  │  └───────────────────────┘   │  │
│  Prompt: compiled role+system   │  └─────────────────────────────┘  │
│                                 │  ┌─ Test Tool Call ────────────┐  │
│                                 │  │  Tool: [searchable select]  │  │
│                                 │  │  Args: [json textarea]      │  │
│                                 │  │  [Run Tool] → result below  │  │
│                                 │  └─────────────────────────────┘  │
│                                 │  ┌─ Override Prompt ───────────┐  │
│                                 │  │  [textarea]                 │  │
│                                 │  │  ☐ Active for next run only │  │
│                                 │  │  ⚠ Resets on tab close      │  │
│                                 │  └─────────────────────────────┘  │
└─────────────────────────────────┴──────────────────────────────────────┘
```

---

## Files to Change

| File | Change | Risk |
|------|--------|------|
| `components/flow/AgentDetailView.jsx` | Full rewrite: new sidebar groups, section routing, Settings panel layout | Medium |
| `components/flow/AgentDevMode.jsx` | **New file**: Dev Mode section — State/Trace/Tokens/Prompt inspector + Actions panel | Low |
| `components/flow/AgentConsoleIdentity.jsx` | **New file**: Identity section (name, role, type, input mode) | Low |
| `components/flow/AgentConsoleInstructions.jsx` | **New file**: Instructions section (prompt textarea, preview, char/token count) | Low |
| `components/flow/AgentConsoleModel.jsx` | **New file**: Model section (provider/model/temp/tokens + capability badges) | Low |
| `components/flow/AgentConsoleTools.jsx` | **New file**: Tools section (4 sub-sections) | Low |
| `components/flow/AgentConsoleConnections.jsx` | **New file**: Connections section | Low |
| `components/flow/AgentConsoleOutput.jsx` | **New file**: Output section | Low |

No store changes. No backend changes. New files only add UI.

**Implementation notes (from engineering review):**
- `AgentDevMode.jsx` needs `const activeProjectId = useWorkflowStore(s => s.activeProjectId)` to read `runs[activeProjectId]`
- Trace data: filter `runs[activeProjectId]?.trace?.steps?.filter(s => s.agentId === agentId)` — per-agent steps already exist in store
- Token data: sum from `step.llmResponses` on each trace step (not a top-level field)
- State tab: use `useWorkflowStore(s => s.workflow.nodes.find(n => n.id === agentId))` as a granular selector, wrap content in `useMemo`, only render when tab is active — prevents performance issues during active runs
- Type-gating: hide or gray-out Model, Instructions, and Tools sections when `node.type === "output"` or `node.type === "user_input"` (these nodes have no model/prompt/tools)

---

## User Journey

### Before

1. Right-click node → Open in new tab
2. See Config / Connections sidebar
3. Same AgentConfigPanel as the right panel, slightly wider
4. Connections tab shows the same ConnectionsPanel

### After

1. Right-click node → Open in new tab → **Dev Mode opens by default**
2. Quick Run input is the first thing visible (top of right sub-panel) — type a test message, click Run
3. Execution trace appears in the left Trace tab immediately after run
4. Click Identity in the sidebar to fill in name and role
5. Click Tools → one page with 4 collapsible accordion sections
6. Header has a persistent "Run" button — click from any section to jump back to Dev Mode and Quick Run

---

## Acceptance Criteria

### Layout
- [ ] Left sidebar has DEVELOPER (first) and CONFIGURE groups, matching Settings panel visual style
- [ ] Content area max-width 860px (content column only, sidebar excluded), centered, with proper spacing
- [ ] Sidebar uses click-to-section with `activeSection` state (not scroll-spy)
- [ ] Dev Mode is the default active section on tab open
- [ ] Header has a persistent Run button (terminal icon) that jumps to Dev Mode + focuses Quick Run input
- [ ] Tools sidebar item navigates to a single Tools page with 4 internal accordion sections (no nested sidebar children)

### Identity
- [ ] Agent name is large, editable, prominent
- [ ] Role/purpose textarea is tall (min 4 rows)
- [ ] Node type selector uses pill buttons
- [ ] Input Mode selector has plain-English labels

### Instructions
- [ ] System prompt textarea is full-height, monospace font
- [ ] Character count visible
- [ ] Estimated token count visible (chars / 4 approximation)
- [ ] "Preview compiled prompt" shows merged role + system prompt

### Model
- [ ] Temperature uses labeled slider
- [ ] Max Tokens has plain-English hint
- [ ] Model capability badges shown (context window size)

### Tools
- [ ] Tool Nodes sub-section lists connected tool nodes with edit links
- [ ] Built-in tools shown as searchable card grid
- [ ] Custom tools listed with simple/code mode toggle
- [ ] Tool Behavior sub-section has Tool Mode, max calls, timeout

### Connections
- [ ] Receives From and Sends To lists
- [ ] Add connection form (dropdown + button)

### Output
- [ ] Output format selector
- [ ] Schema config button
- [ ] Output naming prefix

### Dev Mode
- [ ] Quick Run is the FIRST visible action in the right sub-panel (top)
- [ ] Quick Run: text input + Run button + output area; constructs synthetic single-node workflow + POSTs to `/api/run`; response shown synchronously
- [ ] Quick Run: loading spinner during request, error state on POST failure ("Run failed: {error}"), empty output area before first run
- [ ] State tab: `JSON.stringify(node, null, 2)` with granular selector (only re-renders on node change, not all store changes), copy button
- [ ] Trace tab: filters `runs[activeProjectId]?.trace?.steps` by `agentId`; shows input → tool calls → output per step; "No run yet" empty state with Run button; live update during active run
- [ ] Tokens tab: sums `step.llmResponses` prompt/completion tokens across agent's trace steps; shows cost estimate; "No run yet" empty state
- [ ] Prompt Preview tab: compiled prompt (role prepended + system prompt), syntax-highlighted, copy button, char + token count
- [ ] Test Tool Call: searchable tool selector, JSON textarea for args; disabled with "No tools attached" when agent has no tools; "Testing not available for this tool type" for non-Python tools
- [ ] Override Prompt: textarea, "Active for next run only" checkbox, visible warning "Resets when this tab closes"
- [ ] Inspector tabs have `role="tablist"` / `role="tab"` / `role="tabpanel"` / `aria-selected`
- [ ] Sidebar active item has `aria-current="page"`
- [ ] Model, Instructions, and Tools sections hidden/grayed when `node.type === "output"` or `node.type === "user_input"`

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Too many new files makes it hard to maintain | Low | Each file is a focused section component, follows existing patterns |
| Dev Mode "Test Tool Call" backend doesn't exist | Low | UI shows disabled state with "Coming soon" — no blocker |
| Sidebar navigation conflicts with section scroll | Low | Use click-to-section (activeSection state) not scroll spy — simpler, matches Settings panel |
| Rewriting AgentDetailView may break existing agent tabs | Low | Same props (agentId, onClose), store reads unchanged |
| Tools section complexity (4 sub-sections) | Medium | Each sub-section is a collapsible accordion within the Tools section, no separate routes needed |

---

## Decision Audit Trail

<!-- AUTONOMOUS DECISION LOG -->

| # | Phase | Decision | Classification | Principle | Rationale | Rejected |
|---|-------|----------|----------------|-----------|-----------|----------|
| 1 | CEO | VS Code Settings sidebar layout: kept for organization | TASTE | P5 (explicit) | User said "like settings tab design wise" — this is the right navigation metaphor for organization | Inline expand (Notion-style peek) — user explicitly wants full tab |
| 2 | CEO | Inline expand alternative | REJECTED | P6 (bias to action) | User explicitly chose full-page tab; feature already exists | N/A |
| 3 | CEO | Dev Mode upranked to headline + default section | USER DECISION | D1 | User chose Option A: execution-first, Dev Mode default | Keep plan as-is (Settings-panel-first) |
| 4 | CEO | Quick Run & Tool Test: real features, not stubs | AUTO (P1) | P1 (completeness) | User asked for "advanced console" — stubs deliver no value on ship | Coming Soon stubs |
| 5 | Design | Journey step 3 (Identity first) → Dev Mode first | AUTO (P5) | P5 (explicit) | Contradicted the stated default; fixed for consistency | Identity as default |
| 6 | Design | Dev Mode right panel order: Quick Run first | AUTO (P5) | P5 (explicit) | Text said Quick Run was primary; ASCII diagram had it last — text wins | Keep diagram order |
| 7 | Design | Tools sidebar: single page + 4 internal accordions | AUTO (P5) | P5 (simpler) | No nested sidebar children; reduces navigation complexity; matches Settings pattern | Nested sidebar sub-items for each tool category |
| 8 | Design | Persistent Run button in header | AUTO (P1) | P1 (completeness) | Quick Run would be hard to find without it; findability is a critical usability requirement | No header button (rely on sidebar) |
| 9 | Design | Content area = 860px content column (sidebar excluded) | AUTO (P5) | P5 (explicit) | Resolves implementer ambiguity; sidebar is fixed 220px separately | 860px total including sidebar |
| 10 | Design | Override Prompt: visible reset warning | AUTO (P1) | P1 (completeness) | Component state that resets on close without warning = user data loss surprise | No warning |
| 11 | Eng | Quick Run: synthetic workflow to `/api/run` | AUTO (P3/P5) | P3 (pragmatic) | Zero new backend code; reuses existing endpoint; achieves same result as new route | New `/api/run/agent` endpoint (backend change) |
| 12 | Eng | State tab: granular Zustand selector + useMemo | AUTO (P5) | P5 (explicit) | Prevents performance issues during active runs with high-frequency store updates | Coarse workflow selector |
| 13 | Eng | Type-gating: hide Model/Instructions/Tools for output/input nodes | AUTO (P1) | P1 (completeness) | Output/user_input nodes have no model/prompt/tools — rendering empty broken forms is incorrect | Always render all sections |
| 14 | Eng | Tool Test: disabled state for non-Python tools | AUTO (P5) | P5 (explicit) | `/api/tools/test` only supports Python; showing wrong state would mislead users | General tool test endpoint (needs backend work) |
