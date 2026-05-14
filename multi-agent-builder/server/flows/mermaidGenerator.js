function safeId(id) {
  return String(id).replace(/[^a-zA-Z0-9_]/g, "_");
}

function safeLabel(label) {
  return String(label || "")
    .replace(/"/g, "'")
    .replace(/[<>]/g, "")
    .slice(0, 80);
}

export function generateMermaid(workflow) {
  const nodes = workflow?.nodes || [];
  const edges = workflow?.edges || [];
  const lines = ["graph TD"];

  if (!nodes.length) return "graph TD";

  edges.forEach((edge) => {
    const source = nodes.find((node) => node.id === edge.source);
    const target = nodes.find((node) => node.id === edge.target);
    if (!source || !target) return;
    lines.push(`    ${safeId(source.id)}["${safeLabel(source.name)}"] --> ${safeId(target.id)}["${safeLabel(target.name)}"]`);
  });

  nodes
    .filter((node) => !edges.some((edge) => edge.source === node.id || edge.target === node.id))
    .forEach((node) => lines.push(`    ${safeId(node.id)}["${safeLabel(node.name)}"]`));

  return lines.join("\n");
}
