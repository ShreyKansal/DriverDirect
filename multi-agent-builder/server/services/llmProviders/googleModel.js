import { GoogleGenerativeAI } from "@google/generative-ai";

export class GoogleModel {
  constructor({ apiKey, model, temperature, maxTokens }) {
    this._genAI       = new GoogleGenerativeAI(apiKey);
    this._modelId     = model;
    this._temperature = temperature;
    this._maxTokens   = maxTokens || 1024;
  }

  _getModel(systemInstruction, tools) {
    const config = {
      model:            this._modelId,
      generationConfig: { temperature: this._temperature, maxOutputTokens: this._maxTokens }
    };
    if (systemInstruction) config.systemInstruction = systemInstruction;
    if (tools?.length) config.tools = [{ functionDeclarations: tools.map((t) => t.function) }];
    return this._genAI.getGenerativeModel(config);
  }

  // Returns { systemInstruction, history, lastParts }
  // history is the chat history (all but the last user turn),
  // lastParts is the parts array for the current message to send.
  _parseMessages(rawMessages) {
    let systemInstruction = "";
    const history = [];
    const turns = [];

    for (const m of rawMessages) {
      const type = m?.getType?.() ?? m?._getType?.() ?? m?.role ?? "human";

      if (type === "system") {
        systemInstruction = String(m.content ?? "");
        continue;
      }

      if (type === "human" || type === "user") {
        turns.push({ role: "user", parts: [{ text: String(m.content ?? "") }] });
        continue;
      }

      if (type === "tool") {
        // Tool result — attach as a function response in a user turn
        turns.push({
          role: "user",
          parts: [{ functionResponse: { name: m.name || "tool", response: { result: String(m.content ?? "") } } }]
        });
        continue;
      }

      // assistant / model
      if (m.tool_calls?.length) {
        turns.push({
          role:  "model",
          parts: m.tool_calls.map((tc) => ({ functionCall: { name: tc.name, args: tc.args ?? {} } }))
        });
      } else {
        turns.push({ role: "model", parts: [{ text: String(m.content ?? "") }] });
      }
    }

    // The last turn must be a user message; everything before it is history.
    const lastParts = turns.length ? turns[turns.length - 1].parts : [{ text: "" }];
    history.push(...turns.slice(0, turns.length - 1));

    return { systemInstruction, history, lastParts };
  }

  async invoke(messages) {
    const { systemInstruction, history, lastParts } = this._parseMessages(messages);
    const model = this._getModel(systemInstruction);
    const chat  = model.startChat({ history });
    const result = await chat.sendMessage(lastParts);
    return { content: result.response.text() };
  }

  async invokeWithTools(messages, toolSchemas, onToolCall, maxIterations = 6) {
    const { systemInstruction, history, lastParts } = this._parseMessages(messages);
    const model = this._getModel(systemInstruction, toolSchemas);
    const chat  = model.startChat({ history });

    let result = await chat.sendMessage(lastParts);

    for (let i = 0; i < maxIterations; i++) {
      const candidate = result.response.candidates?.[0];
      if (!candidate) break;

      const functionCalls = (candidate.content?.parts || []).filter((p) => p.functionCall);
      if (functionCalls.length === 0) return result.response.text();

      const responses = [];
      for (const fc of functionCalls) {
        const { name, args } = fc.functionCall;
        const input  = args?.input ?? JSON.stringify(args);
        const output = await onToolCall(name, String(input), `${name}_${i}`);
        responses.push({ functionResponse: { name, response: { result: output } } });
      }

      result = await chat.sendMessage(responses);
    }

    return result.response.text();
  }
}
