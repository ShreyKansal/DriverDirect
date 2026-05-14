import OpenAI from "openai";

// Handles OpenAI and all OpenAI-compatible providers (Groq, etc.)
export class OpenAICompatModel {
  constructor({ apiKey, model, temperature, maxTokens, baseURL }) {
    this._client = new OpenAI({ apiKey, baseURL: baseURL || undefined });
    this._model       = model;
    this._temperature = temperature;
    this._maxTokens   = maxTokens;
  }

  _formatMessage(m) {
    if (m && typeof m === "object" && typeof m.role === "string") return m;

    const type = m?.getType?.() ?? m?._getType?.() ?? "human";

    if (type === "system") return { role: "system", content: String(m.content ?? "") };
    if (type === "human")  return { role: "user",   content: String(m.content ?? "") };
    if (type === "tool")   return { role: "tool",   content: String(m.content ?? ""), tool_call_id: m.tool_call_id };

    const msg = { role: "assistant", content: m.content ?? null };
    if (m.tool_calls?.length) {
      msg.tool_calls = m.tool_calls.map((tc) => ({
        id:   tc.id,
        type: "function",
        function: { name: tc.name, arguments: JSON.stringify(tc.args ?? {}) }
      }));
    }
    return msg;
  }

  async _call(messages, tools, retries = 3) {
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

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await this._client.chat.completions.create(body);
      } catch (err) {
        // Salvage text from failed_generation (Groq-specific malformed tool calls)
        if (err?.status === 400) {
          const apiErr = this._parseError(err);
          const failedGen = apiErr.failed_generation ?? err?.error?.failed_generation;
          if (failedGen) {
            const clean = failedGen.replace(/<function=[^>]+>[\s\S]*?<\/function>/g, "").trim()
              || "I was unable to complete the request with the available tools.";
            return { choices: [{ message: { role: "assistant", content: clean, tool_calls: [] } }] };
          }
        }
        if (attempt === retries) throw err;
        const isRateLimit = err?.status === 429 || (err?.message || "").includes("rate_limit");
        if (!isRateLimit) throw err;
        const retryMatch = (err.message || "").match(/try again in (\d+(?:\.\d+)?)s/i);
        const delay = retryMatch ? Math.ceil(parseFloat(retryMatch[1]) * 1000) + 200 : 2000;
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  _parseError(err) {
    try {
      return JSON.parse((err.message || "").replace(/^\d+\s+/, ""))?.error || {};
    } catch {
      return {};
    }
  }

  async invoke(messages) {
    const formatted = messages.map((m) => this._formatMessage(m));
    const res = await this._call(formatted);
    return { content: res.choices[0]?.message?.content || "" };
  }

  async invokeWithTools(messages, toolSchemas, onToolCall, maxIterations = 6) {
    const formatted = messages.map((m) => this._formatMessage(m));

    for (let i = 0; i < maxIterations; i++) {
      const res  = await this._call(formatted, toolSchemas);
      const msg  = res.choices[0]?.message;
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
