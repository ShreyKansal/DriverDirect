<!-- /autoplan restore point: /c/Users/Shrey/.gstack/projects/ShreyKansal-DriverDirect/main-autoplan-restore-20260518-201111.md -->

# DriverDirect: Config Panel UX Redesign

**Branch:** main | **Date:** 2026-05-18
**Author:** Shrey Kansal
**Status:** Draft - pending autoplan review

---

## Problem Statement

When a user clicks a node on the canvas, the Config Panel opens on the right. This panel is the primary interface for building agents, but it is confusing for non-technical users:

1. **Two-tab layout hides critical features.** The Settings gear icon is tiny and non-obvious. Connections (how agents link together) and Output configuration are buried inside it -- most users never find them.

2. **Tool section is three completely different things crammed together.** Tool Nodes (canvas nodes), Built-in tools (LangGraph/LangChain dropdown search), and Custom inline tools (raw Python code) are all in one section with no explanation of what any of them do or how they differ.

3. **Role/Description is backward priority.** The agent description (its purpose in the workflow) is in the hidden Settings tab. The system prompt (its internal instructions) is on the main tab. These are flipped.

4. **Jargon everywhere.** Input Mode, Tool Mode, MCP, Built-in tool, Custom inline tool, Orchestrator, User Input node -- none mean anything to someone new to multi-agent systems.

5. **Custom tool creation requires Python.** No way for a non-developer to create a tool without writing code.

### User Persona: Primary Target

A product manager, marketer, or operations person who wants to build an AI workflow without writing code. They understand what they want the agent to do but do not know LangGraph, LangChain, or Python.

---

## Goal

**Anyone can configure an agent in under 2 minutes.** No jargon. No hidden features. Clear mental model.

The config panel should feel like setting up a team member, not programming a robot.

---

## Scope

### In Scope

**1. Redesign AgentConfigPanel.jsx**
- Replace hidden gear icon + 2-tab pattern with a visible 5-tab strip
- Tabs (in order): Identity | Instructions | Model | Tools | Connections
- Each tab uses plain-English labels and helper text
- Remove current activeTab main/settings split entirely

**2. New tab: Identity** (was: Role/Description in hidden Settings tab)
- "Who is this agent?" heading
- Role description textarea (agent.role) as the PRIMARY and first field
- Node type selector as friendly labeled pill buttons: Agent / Orchestrator / Input / Output
- Input Mode as a friendly 3-way selector with plain-English descriptions

**3. New tab: Instructions** (was: System Prompt in Prompt section)
- "Write instructions for your agent" heading
- Big textarea with better placeholder
- Character count
- Collapsible tips: "Good instructions tell the agent its role, the format of its output, and how to handle edge cases."

**4. Improve tab: Model** (was: Model section)
- Same provider/model dropdowns
- Temperature: replace raw number input with a labeled slider (Precise 0.0 to Creative 1.5)
- Max Tokens: plain-English hint "How many words the agent can write per response"
- Keep existing API key warning banner

**5. Redesign tab: Tools** (was: Tools section)
- "What can this agent do?" heading
- Built-in tools as searchable cards with descriptions, not a bare dropdown
- Tool Nodes shown with Edit link
- Custom tools: Simple mode form by default (name, description, trigger), Python hidden behind "Switch to code"
- Python auto-generated from form fields (collapsible preview)
- Tool Mode renamed to plain English

**6. New tab: Connections** (was: Connections in hidden Settings tab)
- "How does this agent connect to others?" heading
- Receives from and Sends to lists
- Add connection with a select + button
- Edge count badge on tab
- Output format and schema config moved here

**7. Update ToolConfigPanel.jsx** (Tool Node panel)
- Replace type dropdown with visual type selector cards:
  - Web API: "Call any website or service"
  - Built-in: "Use a pre-built tool like web search"
  - MCP Server: "Connect to a running tool server"
  - Python: "Write custom logic in Python"
- Reorganize: Type -> Name -> Description -> Type-specific config -> Test
- JSON Schemas in Advanced accordion (collapsed by default)
- Contextual guidance text per type

**8. Update CustomToolEditor.jsx**
- Simple mode default: name + description + trigger form, Python hidden
- "Switch to code" button opens existing raw editor
- Better code templates with inline comments

### Out of Scope

- New agent types or workflow features
- Backend API or tool execution changes
- Settings panel (already redesigned in previous plan)
- Canvas or FlowCanvas changes
- OutputConfigModal internal changes
- Store data model changes (agent.role, agent.prompt etc. unchanged)

---

## Information Architecture Change

### Current (confusing)

```
Header: [icon] [name] [type badge] [gear icon - hidden]

Main Tab:
  PROMPT section
    system prompt textarea
    input mode select (jargon)
  MODEL section
    provider / model / temp / tokens
  TOOLS section
    Tool Nodes + add button
    Built-in tools (bare dropdown search)
    Custom inline tools (Python editor)
    Tool Mode select (jargon)

Settings Tab (gear - hidden):
  ROLE / DESCRIPTION section
    role textarea (buried!)
  CONNECTIONS section
    link select + add
    outgoing/incoming edge lists
  OUTPUT section
    format select
    schema config button
```

### New (clear)

```
Header: [icon] [name editable] [type badge]

Tab strip (always visible):
Identity | Instructions | Model | Tools | Connections

Identity Tab:
  Role description (prominent, first)
  Type pill selector (Agent / Orchestrator / Input / Output)
  Input source selector (User / Previous / Both)

Instructions Tab:
  System prompt textarea (full height)
  Tips (collapsible)
  Character count

Model Tab:
  Provider / Model selects
  Temperature slider (Precise to Creative)
  Max tokens with description
  API key warning

Tools Tab:
  Connected Tool Nodes (with edit links)
  Built-in tool cards (searchable grid)
  Custom tools (Simple mode form)
  Tool behavior (renamed options)

Connections Tab:
  Receives from list
  Sends to list
  Add connection form
  Output format + schema config
```

---

## Files to Change

| File | Change | Risk |
|------|--------|------|
| components/config/AgentConfigPanel.jsx | Full rewrite: 5-tab strip replaces 2-tab hidden-gear | Medium |
| components/config/ToolConfigPanel.jsx | Visual type cards, field reorder, Advanced accordion for schemas | Medium |
| components/config/CustomToolEditor.jsx | Add Simple mode vs code mode toggle | Low |
| components/config/ToolPicker.jsx | Render as card grid, not bare dropdown | Low |
| components/config/ModelSettings.jsx | Replace temperature number input with labeled slider | Low |

No new files. No store changes. No backend changes.

---

## User Journey Comparison

### Before: 10+ steps, confusing

1. Click node, panel opens on Prompt tab
2. Write system prompt
3. Cannot find role description anywhere
4. Discover tiny gear icon, click it
5. Find Role/Description, write it
6. Back to main tab, scroll to Tools
7. See 3 tool sections with no explanation
8. Try Built-in tools, see a bare dropdown
9. Want to connect agents, back to gear tab
10. Find Connections buried below Role and Output

### After: 5 steps, linear

1. Click node, Identity tab opens
2. Write role description in the first field
3. Click Instructions tab, write system prompt
4. Click Tools tab, click a card to add Web Search
5. Click Connections tab, select next agent, click Connect

---

## Acceptance Criteria

- [ ] Tab strip always visible, no gear icon
- [ ] Tabs: Identity, Instructions, Model, Tools, Connections
- [ ] Identity tab: role description is first and most prominent
- [ ] Identity tab: type selector uses pill buttons with helper text per type
- [ ] Identity tab: input source uses plain-English 3-way selector
- [ ] Instructions tab: system prompt textarea with collapsible tips and char count
- [ ] Model tab: temperature is a labeled slider (Precise to Creative)
- [ ] Model tab: max tokens has plain-English description
- [ ] Tools tab: built-in tools shown as searchable cards
- [ ] Tools tab: custom tools show Simple mode form by default (no code visible)
- [ ] Tools tab: connected Tool Nodes shown with Edit link
- [ ] Connections tab: Receives from and Sends to lists visible
- [ ] Connections tab: output format and schema config located here
- [ ] ToolConfigPanel: type selector is visual cards, not a dropdown
- [ ] ToolConfigPanel: JSON schemas in Advanced accordion, collapsed by default
- [ ] No jargon in tab headings or field labels
- [ ] All helper text passes a non-developer readability test

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Python auto-generated from simple form is incorrect | Medium | Template-based; show editable preview before saving |
| Tab strip too wide for narrow right panel | Low | Short labels, horizontal scroll on overflow |
| AgentConfigPanel prop interface changes | None | showProject and onSettings props unchanged |
| Built-in tool card grid breaks at small width | Low | Single-column at narrow widths |
| Temperature slider confuses power users | Low | Tooltip shows exact value, keyboard-editable |
