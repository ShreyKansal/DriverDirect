import axios from "axios";
import { userHeaders } from "../utils/authHeaders.js";

const api = axios.create({ baseURL: "/api" });

function message(error) {
  const d = error.response?.data;
  if (d?.message) return d.message;
  if (Array.isArray(d?.errors) && d.errors.length) return d.errors.join(" ");
  if (d?.validation?.errors?.length) return d.validation.errors.join(" ");
  if (error.message) return error.message;
  return "Unknown error";
}

export async function saveWorkflow(workflow) {
  try {
    const { data } = await api.post("/flows", { workflow });
    return data.workflow;
  } catch (error) {
    throw new Error(message(error));
  }
}

export async function getWorkflows() {
  try {
    const { data } = await api.get("/flows");
    return data.workflows;
  } catch (error) {
    throw new Error(message(error));
  }
}

export async function generateMermaid(workflow) {
  try {
    const { data } = await api.post("/flows/mermaid", { workflow });
    return data.mermaid;
  } catch (error) {
    throw new Error(message(error));
  }
}

export async function parseMermaid(mermaid) {
  try {
    const { data } = await api.post("/flows/mermaid/parse", { mermaid });
    return data.graph;
  } catch (error) {
    throw new Error(message(error));
  }
}

export async function runWorkflow(workflow, userTask, { projectId, userId } = {}) {
  try {
    const { data } = await api.post(
      "/run",
      { workflow, userTask, projectId },
      { headers: userHeaders(userId) }
    );
    return data;
  } catch (error) {
    throw new Error(message(error));
  }
}

export async function runWorkflowStreaming(workflow, userTask, { onEvent, projectId, userId } = {}) {
  let response;
  try {
    response = await fetch("/api/run", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        ...userHeaders(userId),
      },
      body: JSON.stringify({ workflow, userTask, projectId })
    });
  } catch (networkErr) {
    // Server unreachable / CORS / etc. — route through onEvent so the log shows it
    onEvent?.({ type: "workflow_error", message: networkErr.message || "Could not reach server." });
    return;
  }

  // Non-2xx (validation 400, server 500, …) — read the JSON body and emit as error event
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const msg = data.message || data.errors?.join(" ") || `HTTP ${response.status}`;
    onEvent?.({ type: "workflow_error", message: msg, trace: data.trace });
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let terminated = false;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const json = line.slice(6).trim();
        if (!json) continue;
        try {
          const event = JSON.parse(json);
          if (event.type === "workflow_complete" || event.type === "workflow_error") {
            terminated = true;
          }
          onEvent?.(event);
        } catch {
          // malformed SSE chunk — skip
        }
      }
    }
  } catch (streamErr) {
    onEvent?.({ type: "workflow_error", message: streamErr.message || "Stream read error." });
    return;
  } finally {
    reader.releaseLock();
  }

  // Stream closed without a terminal event — server likely crashed mid-flight
  if (!terminated) {
    onEvent?.({ type: "workflow_error", message: "Server disconnected before workflow completed." });
  }
}
