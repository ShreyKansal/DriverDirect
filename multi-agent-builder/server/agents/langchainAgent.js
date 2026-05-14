import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { BaseAgent } from "./baseAgent.js";
import { createChatModel } from "../services/llmClient.js";
import { buildSystemPrompt, buildUserMessage } from "../prompts/promptBuilder.js";
import { callTool } from "../services/sandboxManager.js";
import { getToolById } from "../tools/builtinRegistry.js";
import { nanoid } from "nanoid";

function hasTools(config) {
  return (config.builtinTools || []).length > 0 || (config.customTools || []).length > 0;
}

// OpenAI-format tool schemas — accepted by Groq's tools API
function buildToolSchemas(config) {
  const schemas = [];

  for (const t of config.builtinTools || []) {
    schemas.push({
      type: "function",
      function: {
        name:        t.name,
        description: t.description || `Use the ${t.name} tool`,
        parameters: {
          type:       "object",
          properties: { input: { type: "string", description: "The input query or data for the tool" } },
          required:   ["input"]
        }
      }
    });
  }

  for (const t of config.customTools || []) {
    schemas.push({
      type: "function",
      function: {
        name:        t.name,
        description: `Custom tool: ${t.name}`,
        parameters: {
          type:       "object",
          properties: { input: { type: "string", description: "The input for the tool" } },
          required:   ["input"]
        }
      }
    });
  }

  return schemas;
}

async function executeSingleTool(toolName, toolInput, toolCallId, config, runId, onEvent) {
  const builtinTool = (config.builtinTools || []).find((t) => t.name === toolName);
  const customTool  = (config.customTools  || []).find((t) => t.name === toolName);
  const eventId     = toolCallId || nanoid(8);

  onEvent?.({ type: "tool_call_start", agentId: config.id, agentName: config.name, toolCallId: eventId, toolName, input: toolInput });

  try {
    let result;
    if (builtinTool) {
      // Always use the live registry definition — ignore stale snapshots in saved workflows.
      const def = getToolById(builtinTool.name) || builtinTool;
      let code;
      if (def.fullCode) {
        // Tools with custom Python logic (e.g. Calculator, JsonGetValueTool)
        code = def.fullCode;
      } else {
        const setup = def.setupCode ? `${def.setupCode}\n` : "";
        const args  = def.constructorArgs || "";
        code = `${setup}from ${def.module} import ${def.name}\ndef _run_builtin(input: str):\n    t = ${def.name}(${args})\n    return t.run(input)\n`;
      }
      result = await callTool(runId, { toolCallId: eventId, code, functionName: "_run_builtin", input: toolInput });
    } else if (customTool) {
      result = await callTool(runId, { toolCallId: eventId, code: customTool.code, functionName: customTool.name, input: toolInput });
    } else {
      result = { output: `Unknown tool: ${toolName}`, error: null };
    }

    if (result.error) {
      onEvent?.({ type: "tool_call_failed", agentId: config.id, agentName: config.name, toolCallId: eventId, toolName, error: result.error });
      return `Tool error: ${result.error}`;
    }
    const output = result.output || "";
    onEvent?.({ type: "tool_call_complete", agentId: config.id, agentName: config.name, toolCallId: eventId, toolName, output });
    return output;
  } catch (err) {
    onEvent?.({ type: "tool_call_failed", agentId: config.id, agentName: config.name, toolCallId: eventId, toolName, error: err.message });
    return `Tool error: ${err.message}`;
  }
}

export class LangChainAgent extends BaseAgent {
  async run({ userTask, previousOutputs = [], workflowContext = {}, runId, onEvent }) {
    try {
      const model        = createChatModel(this.config, workflowContext.projectKeys || {});
      const systemPrompt = buildSystemPrompt(this.config, workflowContext);
      const userMessage  = buildUserMessage({ agentConfig: this.config, userTask, previousOutputs, workflowContext });

      if (hasTools(this.config) && runId) {
        const toolSchemas = buildToolSchemas(this.config);

        return await model.invokeWithTools(
          [new SystemMessage(systemPrompt), new HumanMessage(userMessage)],
          toolSchemas,
          // Tool execution callback — called by llmClient for each tool_call in the response
          async (toolName, toolInput, groqToolCallId) => {
            return await executeSingleTool(toolName, toolInput, groqToolCallId, this.config, runId, onEvent);
          }
        );
      }

      // No tools — original plain invocation
      const response = await model.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(userMessage)
      ]);
      return typeof response.content === "string" ? response.content : JSON.stringify(response.content);

    } catch (error) {
      let msg = error.message || String(error);
      try {
        const parsed = JSON.parse(msg.replace(/^\d+\s+/, ""));
        msg = parsed?.error?.message || msg;
      } catch { /* not JSON — use as-is */ }
      throw new Error(`${this.config.name} failed: ${msg}`);
    }
  }
}
