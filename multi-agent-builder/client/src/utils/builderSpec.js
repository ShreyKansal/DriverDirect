function labelFor(node) {
  return {
    id: node.id,
    name: node.name,
    type: node.type,
    role: node.role || "",
    outputFormat: node.outputFormat || "markdown"
  };
}

function agentOrder(workflow) {
  const nodes = workflow.nodes || [];
  const edges = workflow.edges || [];
  const orchestrator = nodes.find((node) => node.type === "orchestrator");
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const executableEdges = edges.filter((edge) => {
    const target = nodeById.get(edge.target);
    return target?.type === "agent" && edge.target !== orchestrator?.id;
  });
  const adjacency = new Map(nodes.map((node) => [node.id, []]));
  const indegree = new Map(nodes.map((node) => [node.id, 0]));

  executableEdges.forEach((edge) => {
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

  return ordered.map((id) => nodeById.get(id)).filter((node) => node?.type === "agent").map(labelFor);
}

export function createBuilderSpec(workflow) {
  const nodes = workflow.nodes || [];
  const edges = workflow.edges || [];
  const inputNode = nodes.find((node) => node.type === "user_input");
  const orchestrator = nodes.find((node) => node.type === "orchestrator");
  const outputNode = nodes.find((node) => node.type === "output");

  return {
    target: workflow.builderTarget || "langgraph",
    langGraph: {
      runtime: "@langchain/langgraph StateGraph",
      stateKeys: ["messages", "userPrompt", "agentOutputs", "finalOutput"],
      entryPoint: inputNode?.id || orchestrator?.id || "",
      orchestrator: orchestrator ? labelFor(orchestrator) : null,
      nodes: nodes.map(labelFor),
      edges: edges.map((edge) => ({ source: edge.source, target: edge.target })),
      finishPoint: outputNode?.id || orchestrator?.id || "",
      constraints: workflow.planConstraints || {}
    },
    langChain: {
      runtime: "LangChain JS chat model pipeline",
      promptSource: inputNode?.id || "execution_panel",
      runnableOrder: agentOrder(workflow),
      finalSynthesizer: orchestrator ? labelFor(orchestrator) : null
    }
  };
}
