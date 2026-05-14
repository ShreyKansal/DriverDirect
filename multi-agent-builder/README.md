# Multi-Agent Builder

A JavaScript MVP for building and testing visual multi-agent workflows with Next.js, React Flow, Node.js, Express, and LangChain JS.

## What This App Does

Multi-Agent Builder is a no-code / low-code developer tool for creating AI agents, connecting them visually, configuring prompts, and running the graph through a backend orchestrator.

Users can:

- Add a user prompt node, normal agents, one orchestrator, and final output nodes.
- See every workflow item as a visual node on the canvas.
- Click a node and edit its configuration in the right panel.
- Connect nodes to pass context from Agent A to Agent B and back into the orchestrator.
- Enter the runtime prompt through the user prompt node or the left execution panel.
- Run the workflow through LangChain JS.
- See agent logs, individual outputs, final orchestrator output, and raw trace.
- Inspect a generated LangChain/LangGraph builder spec for the same graph.
- Save and load workflows from local JSON storage.

## Tech Stack

- Frontend: Next.js, React, JavaScript, React Flow, Tailwind CSS, Zustand, Axios.
- Backend: Node.js, Express.js, LangChain JS.
- Builder targets: LangChain pipeline and LangGraph-style StateGraph spec.
- LLM provider: OpenAI-compatible chat endpoints.
- Default model: `qwen2.5-coder`.
- Storage: local JSON file in `server/data/savedWorkflows.json`.

## Setup

```bash
cd multi-agent-builder
npm run install:all
cp .env.example .env
```

Edit `.env`:

```env
OPENAI_API_KEY=your_api_key_here
OPENAI_BASE_URL=http://localhost:1234/v1
DEFAULT_MODEL=qwen2.5-coder
PORT=4000
```

Use any OpenAI-compatible local or hosted endpoint. API keys stay in backend environment variables and are never exposed to the browser.

## Running Locally

Backend:

```bash
npm run server
```

Frontend:

```bash
npm run client
```

Or both:

```bash
npm run dev
```

Open `http://localhost:5173`.

## Layout

- Left panel: workflow execution, user task, logs, final output, raw trace.
- Center panel: React Flow visual canvas for selecting and connecting agent nodes.
- Right panel: selected agent configuration.

The UI follows the provided Cursor-style system: warm cream canvas, Cursor Orange CTAs, warm near-black ink text, white-on-cream cards, hairline-only depth, 12px graph cards, and 8px buttons.

## Workflow Execution

When the user clicks Run:

1. The frontend sends `{ workflow, userTask }` to `POST /api/run`.
2. The backend validates the graph.
3. It reads the user prompt node as the visible graph entry point.
4. It finds exactly one orchestrator.
5. It calculates execution order for normal agent nodes from the configured links.
6. Each agent runs with LangChain JS and the configured OpenAI-compatible model.
7. Prior outputs and direct incoming node outputs are preserved as context.
8. The orchestrator runs last and synthesizes the final answer.
9. Final output nodes receive the orchestrator response as display sinks.
10. The backend returns the full execution trace.

The app does not fake LLM output. If the API key, base URL, model, or provider call fails, execution returns a clear error.

## API Routes

- `GET /api/health`
- `GET /api/agents/defaults`
- `POST /api/flows`
- `GET /api/flows`
- `GET /api/flows/:id`
- `POST /api/flows/validate`
- `POST /api/flows/mermaid`
- `POST /api/flows/mermaid/parse`
- `POST /api/run`

Mermaid routes remain as backend utilities for future export/import work, but the frontend no longer shows a Mermaid editor.

## Known Limitations

- Local JSON storage only.
- No authentication.
- No database.
- Tool checkboxes are placeholders.
- No advanced branching.
- No true parallel execution.
- No streaming model output.

## Future Improvements

- User accounts.
- Database storage.
- Public workflow sharing.
- Agent marketplace.
- Real tool integrations.
- Web search and file upload tools.
- Parallel execution.
- Conditional routing.
- Version history.
- Team collaboration.
