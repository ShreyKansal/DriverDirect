# DriverDirect — Claude Code Guide

## Project Overview
Visual multi-agent LLM workflow builder. React + Next.js 15 (App Router) frontend, Express.js backend, Zustand state, custom SVG canvas (no React Flow). Vodafone brand theme (red `#e60000`, pill buttons, Inter font).

## Dev Commands
All run from `multi-agent-builder/`:
```bash
npm --prefix client run dev       # Next.js frontend (port 3000)
npm --prefix server start         # Express backend
```

## Architecture
- **Frontend**: `multi-agent-builder/client/src/`
  - Canvas: `components/flow/FlowCanvas.jsx`
  - Layout: `components/layout/ThreePanelLayout.jsx`, `Header.jsx`
  - Store: `store/workflowStore.js` (Zustand, localStorage-persisted)
  - Config panel: `components/config/AgentConfigPanel.jsx`
  - Output: `components/output/OutputPanel.jsx`
  - Theme: `styles.css`, `tailwind.config.js`
- **Backend**: `multi-agent-builder/server/`
  - Providers: `config/providers.js` (Groq, OpenAI, Anthropic, Gemini)
  - LLM dispatch: `services/llmClient.js`
  - Key storage: `services/keyStore.js` (AES-256-GCM)
  - Docker sandbox: `services/sandboxManager.js` + `docker/tool-sandbox/`
- **DB**: SQLite with tables: `project_api_keys`, `custom_providers`

## Layout (3-panel)
- Left: activity bar (NodePalette, w-14) + Explorer/Chat/Workspaces panel
- Center: CanvasToolbar + FlowCanvas + OutputPanel (terminal below)
- Right: RightPanel with Config | Connections tabs
- Header: 48px, app menu, command search, project switcher, Run button
- Workspace tabs: Workflow, Code (Mermaid/JSON), Agent tabs (per-agent full-screen), Settings, Docs

## gstack
Use /browse from gstack for all web browsing. Never use mcp__claude-in-chrome__* tools.

Available skills: /autoplan /benchmark /benchmark-models /browse /canary /careful /codex /context-restore /context-save /cso /design-consultation /design-html /design-review /design-shotgun /devex-review /document-generate /document-release /freeze /gstack-upgrade /guard /health /investigate /land-and-deploy /landing-report /learn /make-pdf /office-hours /open-gstack-browser /pair-agent /plan-ceo-review /plan-design-review /plan-devex-review /plan-eng-review /plan-tune /qa /qa-only /retro /review /scrape /setup-browser-cookies /setup-deploy /setup-gbrain /ship /skillify /sync-gbrain /unfreeze
