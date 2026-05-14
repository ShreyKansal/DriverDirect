function safeId(id) {
  return String(id).replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
}

function providerImport(provider, model) {
  const p = (provider || "groq").toLowerCase();
  if (p === "openai")    return `from langchain_openai import ChatOpenAI`;
  if (p === "anthropic") return `from langchain_anthropic import ChatAnthropic`;
  if (p === "ollama")    return `from langchain_ollama import ChatOllama`;
  return `from langchain_groq import ChatGroq`;
}

function providerClass(provider) {
  const p = (provider || "groq").toLowerCase();
  if (p === "openai")    return "ChatOpenAI";
  if (p === "anthropic") return "ChatAnthropic";
  if (p === "ollama")    return "ChatOllama";
  return "ChatGroq";
}

// ─── LangGraph ────────────────────────────────────────────────────────────────

function lgUserInput(node) {
  const prompt = (node.prompt || "User task at runtime").replace(/"""/g, "'''");
  return `# ── User Input ── entry point
from langchain_core.messages import HumanMessage

def create_initial_state(user_task: str = None) -> dict:
    """Creates the initial workflow state."""
    task = user_task or """${prompt}"""
    return {"messages": [HumanMessage(content=task)]}`;
}

function lgOutput(node) {
  return `# ── Output Node ── terminal sink
def output_node(state: dict) -> dict:
    """${(node.role || "Renders the final workflow output.").replace(/"""/g, "'''")}"""
    final = state["messages"][-1]
    return {"final_output": final.content}`;
}

function lgAgent(node) {
  const nid    = safeId(node.id);
  const imp    = providerImport(node.provider);
  const cls    = providerClass(node.provider);
  const model  = node.model  || "llama-3.1-8b-instant";
  const temp   = node.temperature ?? 0.3;
  const tokens = node.maxTokens   ?? 512;
  const prompt = (node.prompt || "").replace(/"""/g, "'''");
  const role   = (node.role   || "").replace(/"""/g, "'''");
  const tools  = node.tools?.length ? `\n# Tools: ${node.tools.join(", ")}` : "";

  return `# ── ${node.name} ──
${imp}
from langchain_core.messages import SystemMessage
${tools}
${nid}_llm = ${cls}(
    model="${model}",
    temperature=${temp},
    max_tokens=${tokens},
)

${nid.toUpperCase()}_PROMPT = """${prompt}"""

def ${nid}_node(state: dict) -> dict:
    """${role}"""
    messages = [SystemMessage(content=${nid.toUpperCase()}_PROMPT)] + state["messages"]
    response = ${nid}_llm.invoke(messages)
    return {"messages": state["messages"] + [response]}`;
}

function generateLangGraph(node) {
  if (node.type === "user_input")   return lgUserInput(node);
  if (node.type === "output")       return lgOutput(node);
  return lgAgent(node); // agent + orchestrator
}

// ─── LangChain ────────────────────────────────────────────────────────────────

function lcUserInput(node) {
  const prompt = (node.prompt || "User task at runtime").replace(/"""/g, "'''");
  return `# ── User Input ── entry point
# Pass this string as the "input" variable to your chain.
user_task = """${prompt}"""`;
}

function lcOutput(node) {
  return `# ── Output Node ── display sink
# The final chain output is printed / returned here.
def display_output(result: str) -> None:
    """${(node.role || "Renders the final output.").replace(/"""/g, "'''")}"""
    print(result)`;
}

function lcAgent(node) {
  const nid    = safeId(node.id);
  const imp    = providerImport(node.provider);
  const cls    = providerClass(node.provider);
  const model  = node.model  || "llama-3.1-8b-instant";
  const temp   = node.temperature ?? 0.3;
  const tokens = node.maxTokens   ?? 512;
  const prompt = (node.prompt || "").replace(/"""/g, "'''");
  const role   = (node.role   || "").replace(/"""/g, "'''");

  return `# ── ${node.name} ──
${imp}
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

${nid}_llm = ${cls}(
    model="${model}",
    temperature=${temp},
    max_tokens=${tokens},
)

${nid}_prompt = ChatPromptTemplate.from_messages([
    ("system", """${prompt}"""),
    ("human", "{input}"),
])

# ${role}
${nid}_chain = ${nid}_prompt | ${nid}_llm | StrOutputParser()

# Usage:
# result = ${nid}_chain.invoke({"input": user_task})`;
}

function generateLangChain(node) {
  if (node.type === "user_input") return lcUserInput(node);
  if (node.type === "output")     return lcOutput(node);
  return lcAgent(node);
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function generateNodeCode(node, builderTarget) {
  if (!node) return "";
  if (builderTarget === "langchain") return generateLangChain(node);
  return generateLangGraph(node);
}
