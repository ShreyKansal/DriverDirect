# Changelog

## [Unreleased] — 2026-05-20

### Added

- **Agent Console Tab** — "Open in new tab" now opens a full-page per-agent IDE instead of a thin wrapper around the right panel.
  - **Dev Mode** (the default view): left inspector panel shows State (live JSON), Trace (per-agent execution steps), Tokens (usage), and Prompt Preview (compiled system prompt). Right actions panel has Quick Run (test the agent directly without running the full workflow), Test Tool Call, and Override Prompt.
  - **Quick Run** sends a synthetic single-node workflow to the existing `/api/run` endpoint — no new backend code required.
  - Configure sections: Identity, Instructions, Model, Tools (4 accordion sub-sections: Tool Nodes, Built-in, Custom, Behavior), Connections, Output.
  - Settings-panel-style left sidebar (DEVELOPER group first, then CONFIGURE) with click-to-section navigation.
  - Persistent terminal button in the header jumps to Dev Mode from any section.
  - Type-gating: Model, Instructions, and Tools sections hidden for Output and Input nodes.
  - ARIA roles on inspector tabs for accessibility.

### Changed

- `AgentDetailView.jsx` — fully rewritten to implement the Agent Console layout.

### Added (files)

- `AgentDevMode.jsx` — Dev Mode section (inspector + Quick Run + Test Tool Call + Override Prompt)
- `AgentConsoleIdentity.jsx` — Identity section (name, role, type, input mode)
- `AgentConsoleInstructions.jsx` — Instructions section (system prompt, token count, compiled preview)
- `AgentConsoleModel.jsx` — Model section (provider/model + temperature slider + max tokens)
- `AgentConsoleTools.jsx` — Tools section (4 accordion sub-sections)
- `AgentConsoleConnections.jsx` — Connections section (wraps existing ConnectionsPanel)
- `AgentConsoleOutput.jsx` — Output section (format, prefix, schema config)
