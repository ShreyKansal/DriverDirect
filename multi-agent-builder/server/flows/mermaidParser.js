import { nanoid } from "nanoid";

function parseNode(raw) {
  const match = raw.trim().match(/^([a-zA-Z0-9_ -]+)(?:\["(.+?)"\])?$/);
  if (!match) throw new Error(`Could not parse node: ${raw}`);
  const id = match[1].trim().replace(/\s+/g, "_");
  const name = match[2] || match[1].trim();
  return { id, name };
}

export function parseMermaid(mermaid) {
  if (!mermaid?.trim()) throw new Error("Mermaid text is empty.");
  const lines = mermaid.split("\n").map((line) => line.trim()).filter(Boolean);
  if (!lines[0]?.startsWith("graph")) throw new Error("Mermaid must start with a graph declaration, for example graph TD.");

  const nodeMap = new Map();
  const edges = [];

  lines.slice(1).forEach((line) => {
    const clean = line.replace(/;$/, "");
    if (!clean.includes("-->")) return;
    const [left, right] = clean.split("-->").map((part) => part.trim());
    const source = parseNode(left);
    const target = parseNode(right);
    if (!nodeMap.has(source.id)) nodeMap.set(source.id, source);
    if (!nodeMap.has(target.id)) nodeMap.set(target.id, target);
    edges.push({ id: `edge_${nanoid(8)}`, source: source.id, target: target.id });
  });

  if (!nodeMap.size) throw new Error("No Mermaid edges found. Use lines like: agent1[\"Agent 1\"] --> agent2[\"Agent 2\"].");

  const nodes = Array.from(nodeMap.values()).map((node, index) => ({
    id: node.id,
    name: node.name,
    type: /orchestrator/i.test(node.name) ? "orchestrator" : "agent",
    role: "",
    prompt: `You are ${node.name}. Complete your part of the workflow.`,
    model: "",
    temperature: 0.3,
    maxTokens: 1000,
    inputMode: "combined_context",
    outputFormat: "markdown",
    tools: [],
    position: { x: 120 + index * 180, y: 120 + index * 80 }
  }));

  return { nodes, edges };
}
