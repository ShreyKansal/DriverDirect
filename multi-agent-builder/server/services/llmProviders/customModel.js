import OpenAI from "openai";

// Resolves a dot-notation path like "choices.0.message.content" into a nested value
function resolvePath(obj, path) {
  return path.split(".").reduce((acc, key) => acc?.[key], obj);
}

// Template substitution: replaces {{messages}}, {{model}}, {{maxTokens}}, {{temperature}}
function renderTemplate(template, { messages, model, maxTokens, temperature }) {
  return template
    .replace(/"?{{messages}}"?/g, JSON.stringify(messages))
    .replace(/"?{{model}}"?/g, JSON.stringify(model))
    .replace(/"?{{maxTokens}}"?/g, String(maxTokens))
    .replace(/"?{{temperature}}"?/g, String(temperature));
}

// Handles openai-compat and local providers (OpenAI SDK with configurable baseURL)
export class CustomOpenAICompatModel {
  constructor({ apiKey, model, temperature, maxTokens, baseURL }) {
    this._client = new OpenAI({
      apiKey: apiKey || "no-key",
      baseURL: baseURL || undefined
    });
    this._model       = model;
    this._temperature = temperature;
    this._maxTokens   = maxTokens;
  }

  _formatMessage(m) {
    if (m && typeof m === "object" && typeof m.role === "string") return m;
    const type = m?.getType?.() ?? m?._getType?.() ?? "human";
    if (type === "system") return { role: "system",    content: String(m.content ?? "") };
    if (type === "human")  return { role: "user",      content: String(m.content ?? "") };
    if (type === "tool")   return { role: "tool",      content: String(m.content ?? ""), tool_call_id: m.tool_call_id };
    const msg = { role: "assistant", content: m.content ?? null };
    if (m.tool_calls?.length) {
      msg.tool_calls = m.tool_calls.map((tc) => ({
        id: tc.id,
        type: "function",
        function: { name: tc.name, arguments: JSON.stringify(tc.args ?? {}) }
      }));
    }
    return msg;
  }

  async _call(messages, tools) {
    const body = {
      model:       this._model,
      messages,
      temperature: this._temperature,
      max_tokens:  this._maxTokens,
      stream:      false
    };
    if (tools?.length) {
      body.tools       = tools;
      body.tool_choice = "auto";
    }
    return this._client.chat.completions.create(body);
  }

  async invoke(messages) {
    const formatted = messages.map((m) => this._formatMessage(m));
    const res = await this._call(formatted);
    return { content: res.choices[0]?.message?.content || "" };
  }

  async invokeWithTools(messages, toolSchemas, onToolCall, maxIterations = 6) {
    const formatted = messages.map((m) => this._formatMessage(m));

    for (let i = 0; i < maxIterations; i++) {
      const res = await this._call(formatted, toolSchemas);
      const msg = res.choices[0]?.message;
      if (!msg) break;

      formatted.push(msg);

      const toolCalls = msg.tool_calls || [];
      if (toolCalls.length === 0) return msg.content || "";

      for (const tc of toolCalls) {
        let args;
        try { args = JSON.parse(tc.function?.arguments || "{}"); } catch { args = {}; }
        const input  = args.input ?? JSON.stringify(args);
        const output = await onToolCall(tc.function?.name ?? "", String(input), tc.id);
        formatted.push({ role: "tool", tool_call_id: tc.id, content: output });
      }
    }

    const last = [...formatted].reverse().find((m) => m.role === "assistant");
    return last?.content || "";
  }
}

// Handles custom-http providers — raw fetch with configurable request/response format
export class CustomHTTPModel {
  constructor({ apiKey, model, temperature, maxTokens, baseURL, authHeaderName, requestTemplate, responsePath }) {
    this._apiKey          = apiKey || "";
    this._model           = model;
    this._temperature     = temperature;
    this._maxTokens       = maxTokens;
    this._baseURL         = baseURL;
    this._authHeaderName  = authHeaderName || "Authorization";
    this._requestTemplate = requestTemplate || JSON.stringify({
      model:       "{{model}}",
      messages:    "{{messages}}",
      max_tokens:  "{{maxTokens}}",
      temperature: "{{temperature}}"
    });
    this._responsePath = responsePath || "choices.0.message.content";
  }

  _buildMessages(messages) {
    return messages.map((m) => {
      if (m && typeof m === "object" && typeof m.role === "string") {
        return { role: m.role, content: String(m.content ?? "") };
      }
      const type = m?.getType?.() ?? m?._getType?.() ?? "human";
      if (type === "system") return { role: "system",    content: String(m.content ?? "") };
      if (type === "human")  return { role: "user",      content: String(m.content ?? "") };
      return { role: "assistant", content: String(m.content ?? "") };
    });
  }

  async _call(messages) {
    const body = renderTemplate(this._requestTemplate, {
      messages,
      model:       this._model,
      maxTokens:   this._maxTokens,
      temperature: this._temperature
    });

    const headers = { "Content-Type": "application/json" };
    if (this._apiKey) {
      headers[this._authHeaderName] = this._authHeaderName.toLowerCase() === "authorization"
        ? `Bearer ${this._apiKey}`
        : this._apiKey;
    }

    const res = await fetch(this._baseURL, { method: "POST", headers, body });
    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      throw new Error(`Custom HTTP provider responded ${res.status}: ${text}`);
    }
    return res.json();
  }

  async invoke(messages) {
    const formatted = this._buildMessages(messages);
    const json = await this._call(formatted);
    const content = resolvePath(json, this._responsePath);
    if (content == null) {
      throw new Error(
        `Custom HTTP: response path "${this._responsePath}" not found in response. ` +
        `Got: ${JSON.stringify(json).slice(0, 200)}`
      );
    }
    return { content: String(content) };
  }

  // Custom-http providers typically don't support native function calling —
  // append tool schemas to the system prompt and do best-effort text parsing.
  async invokeWithTools(messages, toolSchemas, onToolCall, maxIterations = 6) {
    const toolsDescription = toolSchemas.length
      ? `\n\nAvailable tools (respond with JSON when calling a tool):\n${JSON.stringify(toolSchemas, null, 2)}\n\nTo call a tool respond with: {"tool_call": {"name": "<tool>", "arguments": {"input": "<value>"}}}`
      : "";

    const enriched = messages.map((m, idx) => {
      if (idx === 0) {
        const base = m && typeof m === "object" && typeof m.role === "string" ? m : { role: "system", content: String(m?.content ?? "") };
        return { ...base, content: (base.content || "") + toolsDescription };
      }
      return m;
    });

    const formatted = this._buildMessages(enriched);

    for (let i = 0; i < maxIterations; i++) {
      const json = await this._call(formatted);
      const content = String(resolvePath(json, this._responsePath) ?? "");

      // Try to extract a tool_call JSON blob from the response
      let toolCallMatch = null;
      try {
        const jsonMatch = content.match(/\{[\s\S]*"tool_call"[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.tool_call?.name) toolCallMatch = parsed.tool_call;
        }
      } catch { /* not a tool call */ }

      if (!toolCallMatch) return content;

      formatted.push({ role: "assistant", content });
      const toolOutput = await onToolCall(toolCallMatch.name, String(toolCallMatch.arguments?.input ?? ""), null);
      formatted.push({ role: "user", content: `Tool result for ${toolCallMatch.name}: ${toolOutput}` });
    }

    const last = [...formatted].reverse().find((m) => m.role === "assistant");
    return last?.content || "";
  }
}
