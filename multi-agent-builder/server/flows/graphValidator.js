function detectCycle(nodes, edges) {
  const orchestratorIds = new Set(nodes.filter((node) => node.type === "orchestrator").map((node) => node.id));
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const executableEdges = edges.filter((edge) => {
    const source = nodeById.get(edge.source);
    const target = nodeById.get(edge.target);
    if (!source || !target) return false;
    if (orchestratorIds.has(edge.target)) return false;
    return source.type !== "output" && target.type !== "output" && target.type !== "user_input";
  });
  const visiting = new Set();
  const visited = new Set();
  const adjacency = new Map(nodes.map((node) => [node.id, []]));
  executableEdges.forEach((edge) => adjacency.get(edge.source)?.push(edge.target));

  function visit(nodeId) {
    if (visiting.has(nodeId)) return true;
    if (visited.has(nodeId)) return false;
    visiting.add(nodeId);
    for (const next of adjacency.get(nodeId) || []) {
      if (visit(next)) return true;
    }
    visiting.delete(nodeId);
    visited.add(nodeId);
    return false;
  }

  return nodes.some((node) => visit(node.id));
}

export function validateWorkflow(workflow, options = {}) {
  const errors = [];
  const warnings = [];

  if (!workflow || typeof workflow !== "object") {
    return { valid: false, errors: ["Missing workflow."], warnings };
  }

  const nodes = Array.isArray(workflow.nodes) ? workflow.nodes : [];
  const edges = Array.isArray(workflow.edges) ? workflow.edges : [];

  if (!nodes.length) errors.push("Add at least one agent node.");
  if (!edges.length && nodes.length > 1) errors.push("Connect agents with at least one edge.");

  const orchestrators = nodes.filter((node) => node.type === "orchestrator");
  const inputNodes = nodes.filter((node) => node.type === "user_input");
  const normalAgents = nodes.filter((node) => node.type === "agent");
  if (!orchestrators.length) errors.push("Add exactly one orchestrator.");
  if (orchestrators.length > 1) errors.push("Only one orchestrator is allowed.");
  if (!inputNodes.length) warnings.push("Add a user prompt node so the orchestrator has a visible graph entry point.");
  if (inputNodes.length > 1) errors.push("Only one user prompt node is allowed.");
  if (!normalAgents.length) errors.push("Add at least one normal agent.");

  const nodeIds = new Set(nodes.map((node) => node.id));
  const allowedTypes = new Set(["user_input", "orchestrator", "agent", "output"]);
  edges.forEach((edge) => {
    if (!edge.source || !edge.target) errors.push(`Edge ${edge.id || ""} is missing source or target.`);
    if (edge.source && !nodeIds.has(edge.source)) errors.push(`Edge ${edge.id || ""} points from a missing source node.`);
    if (edge.target && !nodeIds.has(edge.target)) errors.push(`Edge ${edge.id || ""} points to a missing target node.`);
  });

  nodes.forEach((node) => {
    if (!allowedTypes.has(node.type)) errors.push(`${node.name || node.id} has an unsupported node type.`);
    if (!node.name?.trim()) errors.push(`Node ${node.id} is missing a name.`);
    if ((node.type === "agent" || node.type === "orchestrator") && !node.prompt?.trim()) {
      errors.push(`${node.name || node.id} needs a custom system prompt.`);
    }
    if (node.type === "user_input" && options.requireTask && !options.userTask?.trim() && !node.prompt?.trim()) {
      errors.push(`${node.name || node.id} needs a prompt before running.`);
    }
    if (node.type === "user_input" || node.type === "output") return;

    const temperature = Number(node.temperature);
    const maxTokens = Number(node.maxTokens);
    if (Number.isNaN(temperature) || temperature < 0 || temperature > 2) {
      errors.push(`${node.name || node.id} temperature must be between 0 and 2.`);
    }
    if (!Number.isInteger(maxTokens) || maxTokens < 1) {
      errors.push(`${node.name || node.id} max tokens must be a positive integer.`);
    }
  });

  if (nodes.length && edges.length && detectCycle(nodes, edges)) {
    errors.push("Circular dependency detected. This MVP supports directed acyclic execution only.");
  }

  const orchestrator = orchestrators[0];
  const inputNode = inputNodes[0];
  if (orchestrator && inputNode && !edges.some((edge) => edge.source === inputNode.id && edge.target === orchestrator.id)) {
    warnings.push("Connect the user prompt node to the orchestrator to make the entry point explicit.");
  }
  if (orchestrator && normalAgents.length && !edges.some((edge) => edge.target === orchestrator.id && normalAgents.some((node) => node.id === edge.source))) {
    warnings.push("Connect at least one agent back into the orchestrator for final synthesis.");
  }

  const maxAgentSteps = Number(workflow.planConstraints?.maxAgentSteps ?? normalAgents.length);
  if (!Number.isInteger(maxAgentSteps) || maxAgentSteps < 1) {
    errors.push("Plan constraint maxAgentSteps must be a positive integer.");
  } else if (normalAgents.length > maxAgentSteps) {
    errors.push(`Plan constraint exceeded: ${normalAgents.length} agents configured, max is ${maxAgentSteps}.`);
  }

  if (options.requireTask && !options.userTask?.trim()) {
    errors.push("Enter a user task before running the workflow.");
  }

  return { valid: errors.length === 0, errors, warnings };
}
