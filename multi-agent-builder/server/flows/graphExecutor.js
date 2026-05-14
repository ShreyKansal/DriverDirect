import { nanoid } from "nanoid";
import { LangChainAgent } from "../agents/langchainAgent.js";
import { OrchestratorAgent } from "../agents/orchestratorAgent.js";
import { validateWorkflow } from "./graphValidator.js";
import { createStep, completeStep, failStep } from "../services/executionLogger.js";
import { collectDependencies } from "../services/dependencyCollector.js";
import { startSandbox, bootstrap, stopSandbox } from "../services/sandboxManager.js";
import { getProjectKeys } from "../services/keyStore.js";

function workflowNeedsDocker(workflow) {
  return workflow.nodes.some((n) =>
    (n.builtinTools || []).length > 0 || (n.customTools || []).length > 0
  );
}

function getExecutionOrder(workflow, orchestratorId) {
  const nodes = workflow.nodes;
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const edges = workflow.edges.filter((edge) => {
    const target = nodeById.get(edge.target);
    return edge.target !== orchestratorId && target?.type !== "output" && target?.type !== "user_input";
  });
  const adjacency = new Map(nodes.map((node) => [node.id, []]));
  const indegree = new Map(nodes.map((node) => [node.id, 0]));

  edges.forEach((edge) => {
    adjacency.get(edge.source)?.push(edge.target);
    indegree.set(edge.target, (indegree.get(edge.target) || 0) + 1);
  });

  const queue = nodes.filter((node) => (indegree.get(node.id) || 0) === 0).map((node) => node.id);
  const ordered = [];
  while (queue.length) {
    const current = queue.shift();
    ordered.push(current);
    for (const next of adjacency.get(current) || []) {
      indegree.set(next, indegree.get(next) - 1);
      if (indegree.get(next) === 0) queue.push(next);
    }
  }

  return ordered
    .map((id) => nodes.find((node) => node.id === id))
    .filter((node) => node?.type === "agent");
}

function incomingOutputsFor(node, workflow, outputsByAgent, userTask) {
  const nodeById = new Map(workflow.nodes.map((item) => [item.id, item]));

  return workflow.edges
    .filter((edge) => edge.target === node.id)
    .map((edge) => {
      const source = nodeById.get(edge.source);
      const existingOutput = outputsByAgent.get(edge.source);
      if (existingOutput) return existingOutput;
      if (source?.type === "orchestrator") {
        return {
          agentId: source.id,
          agentName: source.name,
          output: `Orchestrator route based on the original prompt:\n${userTask}`
        };
      }
      return null;
    })
    .filter(Boolean);
}

function inputPreview(userTask, incomingOutputs) {
  if (!incomingOutputs.length) return userTask;
  return `${userTask}\n\nIncoming context:\n${incomingOutputs.map((item) => `${item.agentName}: ${item.output}`).join("\n\n")}`;
}

export async function executeWorkflow({ workflow, userTask, onEvent = () => {} }) {
  const validation = validateWorkflow(workflow, { requireTask: true, userTask });
  if (!validation.valid) {
    const error = new Error(validation.errors.join(" "));
    error.validation = validation;
    throw error;
  }

  // Load project-level API keys (falls back to env vars inside createChatModel)
  const projectKeys = workflow.id ? await getProjectKeys(workflow.id).catch(() => ({})) : {};

  const runId = `run_${nanoid(8)}`;
  const needsDocker = workflowNeedsDocker(workflow);
  let sandboxStarted = false;

  const orchestrator = workflow.nodes.find((node) => node.type === "orchestrator");
  const executionOrder = getExecutionOrder(workflow, orchestrator.id);
  const maxAgentSteps = Number(workflow.planConstraints?.maxAgentSteps || executionOrder.length || 1);
  const trace = {
    workflowId: workflow.id || `workflow_${nanoid(8)}`,
    userTask,
    builderTarget: workflow.builderTarget || "langgraph",
    status: "running",
    steps: [],
    finalOutput: "",
    errors: []
  };
  const previousOutputs = [];
  const outputsByAgent = new Map();

  try {
    // ── Docker sandbox bootstrap ────────────────────────────────────────────────
    if (needsDocker) {
      const { toInstall, all } = collectDependencies(workflow);

      onEvent({ type: "bootstrap_start", packages: toInstall, allPackages: all });

      await startSandbox(runId);
      sandboxStarted = true;

      if (toInstall.length > 0) {
        await bootstrap(runId, toInstall, (progressEvent) => {
          if (progressEvent.type === "bootstrap_progress") {
            onEvent({ type: "bootstrap_progress", package: progressEvent.package });
          }
        });
      }

      onEvent({ type: "bootstrap_complete", packages: toInstall });
    }

    // ── User input nodes — immediate pass-through ───────────────────────────────
    const inputNodes = workflow.nodes.filter((node) => node.type === "user_input");
    for (const node of inputNodes) {
      onEvent({ type: "step_start", agentId: node.id, agentName: node.name, input: userTask });
      const step = createStep(node, userTask);
      const completed = completeStep(step, userTask);
      trace.steps.push(completed);
      onEvent({ type: "step_complete", agentId: node.id, agentName: node.name, output: userTask });
      outputsByAgent.set(node.id, { agentId: node.id, agentName: node.name, output: userTask });
    }

    if (executionOrder.length > maxAgentSteps) {
      throw new Error(`Plan constraint exceeded: ${executionOrder.length} agent steps configured, max is ${maxAgentSteps}.`);
    }

    // ── Agent nodes in topological order ───────────────────────────────────────
    for (const node of executionOrder) {
      const incomingOutputs = incomingOutputsFor(node, workflow, outputsByAgent, userTask);
      const input = inputPreview(userTask, incomingOutputs);
      onEvent({ type: "step_start", agentId: node.id, agentName: node.name, input });
      const step = createStep(node, input);
      trace.steps.push(step);

      try {
        const agent = new LangChainAgent(node);
        const output = await agent.run({
          userTask,
          previousOutputs,
          workflowContext: { ...workflow, incomingOutputs, projectKeys },
          runId,
          onEvent
        });
        const completed = completeStep(step, output);
        trace.steps[trace.steps.length - 1] = completed;
        onEvent({ type: "step_complete", agentId: node.id, agentName: node.name, output });
        const outputItem = { agentId: node.id, agentName: node.name, output };
        outputsByAgent.set(node.id, outputItem);
        previousOutputs.push(outputItem);
      } catch (agentErr) {
        trace.steps[trace.steps.length - 1] = failStep(step, agentErr);
        onEvent({ type: "step_failed", agentId: node.id, agentName: node.name, error: agentErr.message });
        throw agentErr;
      }
    }

    // ── Orchestrator ────────────────────────────────────────────────────────────
    const orchInputs = incomingOutputsFor(orchestrator, workflow, outputsByAgent, userTask);
    const orchInput = inputPreview(userTask, orchInputs);
    onEvent({ type: "step_start", agentId: orchestrator.id, agentName: orchestrator.name, input: orchInput });
    const orchStep = createStep(orchestrator, orchInput);
    trace.steps.push(orchStep);

    let finalOutput;
    try {
      finalOutput = await new OrchestratorAgent(orchestrator).run({
        userTask,
        previousOutputs,
        workflowContext: { ...workflow, incomingOutputs: orchInputs, projectKeys },
        runId,
        onEvent
      });
    } catch (orchErr) {
      trace.steps[trace.steps.length - 1] = failStep(orchStep, orchErr);
      onEvent({ type: "step_failed", agentId: orchestrator.id, agentName: orchestrator.name, error: orchErr.message });
      throw orchErr;
    }

    trace.finalOutput = finalOutput;
    trace.steps[trace.steps.length - 1] = completeStep(orchStep, finalOutput);
    onEvent({ type: "step_complete", agentId: orchestrator.id, agentName: orchestrator.name, output: finalOutput });
    outputsByAgent.set(orchestrator.id, { agentId: orchestrator.id, agentName: orchestrator.name, output: finalOutput });

    // ── Output nodes — immediate pass-through ───────────────────────────────────
    const outputNodes = workflow.nodes.filter((node) => node.type === "output");
    for (const node of outputNodes) {
      const incomingOutputs = incomingOutputsFor(node, workflow, outputsByAgent, userTask);
      const input = inputPreview(finalOutput, incomingOutputs);
      onEvent({ type: "step_start", agentId: node.id, agentName: node.name, input });
      const outputStep = createStep(node, input);
      trace.steps.push(completeStep(outputStep, finalOutput));
      onEvent({ type: "step_complete", agentId: node.id, agentName: node.name, output: finalOutput });
      outputsByAgent.set(node.id, { agentId: node.id, agentName: node.name, output: finalOutput });
    }

    trace.status = "completed";
    return trace;

  } catch (error) {
    const runningIdx = trace.steps.findIndex((s) => s.status === "running");
    if (runningIdx !== -1) trace.steps[runningIdx] = failStep(trace.steps[runningIdx], error);
    trace.status = "failed";
    trace.errors.push(error.message);
    throw Object.assign(error, { trace });

  } finally {
    // Always destroy the sandbox container — success or failure
    if (sandboxStarted) {
      stopSandbox(runId).catch(() => {});
    }
  }
}
