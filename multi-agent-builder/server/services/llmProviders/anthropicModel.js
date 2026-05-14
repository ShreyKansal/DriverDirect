import Anthropic from "@anthropic-ai/sdk";

export class AnthropicModel {
  constructor({ apiKey, model, temperature, maxTokens }) {
    this._client      = new Anthropic({ apiKey });
    this._model       = model;
    this._temperature = temperature;
    this._maxTokens   = maxTokens || 1024;
  }

  // Parse LangChain-style or plain messages into Anthropic format.
  // Returns { systemPrompt, messages }.
  _parseMessages(rawMessages) {
    let systemPrompt = "";
    const messages = [];

    for (const m of rawMessages) {
      const type = m?.getType?.() ?? m?._getType?.() ?? m?.role ?? "human";

      if (type === "system") {
        systemPrompt = String(m.content ?? "");
        continue;
      }

      if (type === "tool") {
        // Tool result — merge into a user message with tool_result content
        messages.push({
          role: "user",
          content: [{ type: "tool_result", tool_use_id: m.tool_call_id, content: String(m.content ?? "") }]
        });
        continue;
      }

      if (type === "human" || type === "user") {
        messages.push({ role: "user", content: String(m.content ?? "") });
        continue;
      }

      // assistant / ai
      if (m.tool_calls?.length) {
        const content = [];
        if (m.content) content.push({ type: "text", text: String(m.content) });
        for (const tc of m.tool_calls) {
          content.push({ type: "tool_use", id: tc.id, name: tc.name, input: tc.args ?? {} });
        }
        messages.push({ role: "assistant", content });
      } else {
        messages.push({ role: "assistant", content: String(m.content ?? "") });
      }
    }

    return { systemPrompt, messages };
  }

  _toAnthropicTools(toolSchemas) {
    return toolSchemas.map((t) => ({
      name:         t.function.name,
      description:  t.function.description,
      input_schema: t.function.parameters
    }));
  }

  async invoke(messages) {
    const { systemPrompt, messages: anthropicMessages } = this._parseMessages(messages);
    const response = await this._client.messages.create({
      model:       this._model,
      max_tokens:  this._maxTokens,
      temperature: this._temperature,
      ...(systemPrompt ? { system: systemPrompt } : {}),
      messages:    anthropicMessages
    });
    const textBlock = response.content.find((b) => b.type === "text");
    return { content: textBlock?.text || "" };
  }

  async invokeWithTools(messages, toolSchemas, onToolCall, maxIterations = 6) {
    const { systemPrompt, messages: anthropicMessages } = this._parseMessages(messages);
    const tools = this._toAnthropicTools(toolSchemas);

    for (let i = 0; i < maxIterations; i++) {
      const response = await this._client.messages.create({
        model:       this._model,
        max_tokens:  this._maxTokens,
        temperature: this._temperature,
        ...(systemPrompt ? { system: systemPrompt } : {}),
        messages:    anthropicMessages,
        tools
      });

      anthropicMessages.push({ role: "assistant", content: response.content });

      if (response.stop_reason === "end_turn") {
        const textBlock = response.content.find((b) => b.type === "text");
        return textBlock?.text || "";
      }

      const toolUseBlocks = response.content.filter((b) => b.type === "tool_use");
      if (toolUseBlocks.length === 0) {
        const textBlock = response.content.find((b) => b.type === "text");
        return textBlock?.text || "";
      }

      const toolResults = [];
      for (const tu of toolUseBlocks) {
        const input  = tu.input?.input ?? JSON.stringify(tu.input);
        const output = await onToolCall(tu.name, String(input), tu.id);
        toolResults.push({ type: "tool_result", tool_use_id: tu.id, content: output });
      }
      anthropicMessages.push({ role: "user", content: toolResults });
    }

    // Fallback: return last assistant text
    const last = [...anthropicMessages].reverse().find((m) => m.role === "assistant");
    if (last) {
      const c = last.content;
      if (typeof c === "string") return c;
      const textBlock = c.find?.((b) => b.type === "text");
      return textBlock?.text || "";
    }
    return "";
  }
}
