export function localMermaidFromGraph(workflow) {
  const lines = ["graph TD"];
  const byId = new Map(workflow.nodes.map((node) => [node.id, node]));
  workflow.edges.forEach((edge) => {
    const source = byId.get(edge.source);
    const target = byId.get(edge.target);
    if (!source || !target) return;
    lines.push(`    ${source.id}["${source.name.replace(/"/g, "'")}"] --> ${target.id}["${target.name.replace(/"/g, "'")}"]`);
  });
  return lines.join("\n");
}
