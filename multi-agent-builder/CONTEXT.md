# Project Context: Multi-Agent Builder

## Purpose

This project is a visual multi-agent workflow builder. Users create AI agents, configure prompts, connect agents in a directed graph, and execute the workflow through a LangChain JS backend.

## Product Vision

The long-term goal is an internet-facing platform where people can test and build multi-agent systems without writing code.

The current UI direction follows the provided Cursor-style design brief: warm cream canvas, Cursor Orange CTAs, warm near-black ink text, white-on-cream cards, hairline-only depth, 12px graph cards, 8px buttons, and JetBrains Mono-style code surfaces.

## Current MVP Scope

- Next.js frontend.
- Express backend.
- React Flow visual agent canvas in the center.
- Execution panel on the left.
- Selected node configuration on the right.
- Add Prompt, Agent, Orchestrator, and Output node actions.
- Node selection updates the right configuration panel.
- Node linking controls pass context between selected nodes.
- User prompt nodes feed the orchestrator at runtime.
- Orchestrator plan constraints control handoff policy and max agent steps.
- Builder target can be switched between LangGraph-style StateGraph and LangChain pipeline views.
- Node duplication, deletion, and workflow reset.
- LangChain JS execution with OpenAI-compatible chat models.
- Default model set to `qwen2.5-coder`.
- Local JSON workflow save/load.
- Backend Mermaid utility routes remain, but no Mermaid editor appears in the UI.

## Architecture Decisions

- React Flow is used because the product is a node-and-edge workflow builder.
- Next.js is used for the frontend app shell.
- Express remains the backend execution API.
- The JSON graph is the source of truth.
- Mermaid is backend-only utility support for now.
- Prompts stay in `server/prompts`.
- Agent implementations stay in `server/agents`.
- Graph validation and execution stay in `server/flows`.
- The orchestrator is a special agent that synthesizes final output.
- API keys stay in backend `.env` variables.
- The frontend must not expose provider credentials.

## Important Folders

- `server/agents`: base agent, LangChain agent, orchestrator agent.
- `server/prompts`: default agent prompt, orchestrator prompt, prompt builder.
- `server/flows`: graph validation, execution, Mermaid utility code.
- `server/routes`: API routes for agents, flows, and execution.
- `server/services`: LLM client, logging helpers, local workflow store.
- `client/src/app`: Next.js app-router entry.
- `client/src/components/flow`: React Flow canvas and visible agent nodes.
- `client/src/components/config`: right-side selected agent configuration.
- `client/src/components/output`: left-side execution panel.
- `client/src/store`: Zustand workflow graph state.

## Data Model

Workflow:

- `id`, `name`, `description`, `nodes`, `edges`, `mermaid`, `createdAt`, `updatedAt`.

Agent node:

- `id`, `name`, `type`, `role`, `prompt`, `model`, `temperature`, `maxTokens`, `inputMode`, `outputFormat`, `tools`, `position`.

Supported node types:

- `user_input`: visible runtime prompt entry point.
- `agent`: executable LangChain model call.
- `orchestrator`: final synthesis model call and graph coordinator.
- `output`: non-executable display sink for final response.

Edge:

- `id`, `source`, `target`.

Execution trace:

- `workflowId`, `userTask`, `status`, `steps`, `finalOutput`, `errors`.

## Execution Flow

1. User enters task in the left panel.
2. User clicks Run Workflow.
3. Frontend sends workflow JSON and task to `POST /api/run`.
4. Backend validates nodes, edges, orchestrator count, prompts, model settings, and cycles.
5. Backend records the user prompt node as the entry point.
6. Backend finds normal agent execution order from the configured links.
7. Each normal agent runs through `LangChainAgent`.
8. Outputs are captured as direct and previous context.
9. The orchestrator runs last through `OrchestratorAgent`.
10. Output nodes receive the final response as non-executable sinks.
11. Backend returns trace and final output.
12. Left panel renders logs, final answer, raw trace, and builder spec.

## Prompt Strategy

`promptBuilder.js` combines:

- Default prompt for normal agents or orchestrator.
- Agent name, type, role, input mode, and output format.
- Available agents.
- Custom system prompt.
- User task.
- Direct incoming context.
- Full previous workflow outputs.

## Current Limitations

- Local JSON storage only.
- No authentication.
- No database.
- Tools are placeholders.
- No advanced branching.
- No true parallel execution.
- No streaming output.
- Basic Mermaid utility parser remains backend-only.

## Future AI Coding Agent Instructions

- Do not rewrite the entire app unnecessarily.
- Preserve the folder structure.
- Keep prompts in `server/prompts`.
- Keep agents in `server/agents`.
- Keep graph execution in `server/flows`.
- Keep the UI as three panels: execution left, graph center, selected config right.
- JSON graph remains the source of truth.
- Do not re-add a Mermaid editor unless explicitly requested.
- Do not fake LLM output.
- Do not expose API keys in frontend.
- Preserve the Cursor-inspired cream, orange, hairline, and editorial visual direction.
- Improve incrementally.
