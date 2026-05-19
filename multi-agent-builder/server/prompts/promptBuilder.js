import { orchestratorPrompt } from "./orchestratorPrompt.js";

// Hard cap on any single text chunk sent to the model.
// 1 token ≈ 4 chars; llama-3.1-8b-instant free tier ≈ 6 000 TPM.
// With 6 agents each using ~800 tokens we stay comfortably under.
const MAX_OUTPUT_CHARS = 500;   // per previous-agent output
const MAX_PREV_AGENTS  = 3;     // only pass the last N previous outputs
const MAX_INCOMING_CHARS = 800; // incoming direct context total
const MAX_TASK_CHARS = 600;     // user task

function trunc(text, max) {
  if (!text || text.length <= max) return text;
  return text.slice(0, max) + "…";
}

export function buildSystemPrompt(agentConfig, workflowContext = {}) {
  if (agentConfig.type === "orchestrator") return orchestratorPrompt.trim();

  return [agentConfig.role, agentConfig.prompt]
    .filter(Boolean)
    .join("\n\n");
}

export function buildUserMessage({ agentConfig, userTask, previousOutputs = [], workflowContext = {} }) {
  const task = trunc(userTask, MAX_TASK_CHARS);
  const inputMode = agentConfig.inputMode || "combined_context";

  // Trim incoming direct context
  const rawIncoming = workflowContext.incomingOutputs?.length
    ? workflowContext.incomingOutputs
        .map((item) => `${item.agentName}:\n${trunc(item.output, MAX_OUTPUT_CHARS)}`)
        .join("\n\n")
    : "";
  const incoming = trunc(rawIncoming, MAX_INCOMING_CHARS);

  // Keep only the last N previous outputs, each truncated
  const recentPrev = previousOutputs.slice(-MAX_PREV_AGENTS);
  const previousText = recentPrev.length
    ? recentPrev
        .map((item, i) => `${i + 1}. ${item.agentName}:\n${trunc(item.output, MAX_OUTPUT_CHARS)}`)
        .join("\n\n")
    : "";

  const sections = [`Task:\n${task}`];

  if (inputMode === "previous_agent_output" || inputMode === "combined_context") {
    if (incoming) sections.push(`Direct context:\n${incoming}`);
  }
  if (inputMode === "combined_context" && previousText) {
    sections.push(`Recent agent outputs:\n${previousText}`);
  }

  return `${sections.join("\n\n")}\n\nRespond as ${agentConfig.name}.`;
}
