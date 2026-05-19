import { makeId } from "./idUtils.js";

export const NODE_TYPES = ["user_input", "orchestrator", "agent", "output", "tool", "workflow_ref"];

export const BUILDER_TARGETS = [
  { id: "langgraph", label: "LangGraph", description: "Stateful graph with conditional edges, cycles, and memory" },
  { id: "langchain", label: "LangChain", description: "Linear chains and sequential agent pipelines" },
  { id: "python",    label: "Python",    description: "Raw Python functions, no framework abstractions" }
];

export const NODE_TYPE_LABELS = {
  user_input:    "User Input",
  orchestrator:  "Orchestrator",
  agent:         "Agent",
  output:        "Final Output",
  tool:          "Tool",
  workflow_ref:  "Call Workflow"
};

// Create a WorkflowRef node pointing to another workflow in the same project
export function createWorkflowRefNode(targetWorkflowId, targetWorkflowName, position = { x: 300, y: 200 }) {
  return {
    id: makeId("wfref"),
    type: "workflow_ref",
    name: targetWorkflowName || "Call Workflow",
    targetWorkflowId,
    position
  };
}

export const BUILTIN_TOOLS = [
  // LangGraph + LangChain compatible
  { id: "web_search",     name: "Web Search",     description: "Search the web via DuckDuckGo",       module: "langchain_community.tools", package: "duckduckgo-search", targets: ["langgraph", "langchain"] },
  { id: "wikipedia",      name: "Wikipedia",       description: "Query Wikipedia articles",             module: "langchain_community.tools", package: "wikipedia",         targets: ["langgraph", "langchain"] },
  { id: "calculator",     name: "Calculator",      description: "Perform mathematical calculations",   module: "langchain.tools",           package: "",                  targets: ["langgraph", "langchain"] },
  { id: "python_repl",    name: "Python REPL",     description: "Execute Python code in a sandbox",   module: "langchain_experimental.tools", package: "langchain-experimental", targets: ["langgraph", "langchain"] },
  { id: "arxiv",          name: "ArXiv Search",    description: "Search academic papers on ArXiv",    module: "langchain_community.tools", package: "arxiv",             targets: ["langgraph", "langchain"] },
  { id: "openweathermap", name: "Weather",         description: "Fetch current weather data",          module: "langchain_community.tools", package: "pyowm",             targets: ["langgraph", "langchain"] },
  { id: "requests_get",   name: "HTTP GET",        description: "Perform HTTP GET requests",           module: "langchain_community.tools", package: "requests",          targets: ["langgraph", "langchain"] },
  { id: "file_read",      name: "File Read",       description: "Read files from the filesystem",     module: "langchain_community.tools", package: "",                  targets: ["langgraph", "langchain"] },
  // Python-only tools
  { id: "py_requests",    name: "requests",        description: "Make HTTP requests (GET/POST/etc.)",  module: "requests",                  package: "requests",          targets: ["python"] },
  { id: "py_file_io",     name: "File I/O",        description: "Read and write local files",         module: "builtins",                  package: "",                  targets: ["python"] },
  { id: "py_json",        name: "JSON",            description: "Parse and serialize JSON data",       module: "json",                      package: "",                  targets: ["python"] },
  { id: "py_subprocess",  name: "subprocess",      description: "Run shell commands and scripts",     module: "subprocess",                package: "",                  targets: ["python"] },
  { id: "py_env",         name: "Environment",     description: "Read environment variables",         module: "os",                        package: "",                  targets: ["python"] }
];

export function createToolNode(parentNode = null) {
  const id = makeId("tool");
  const pos = parentNode?.position ?? { x: 300, y: 300 };
  return {
    id,
    type:        "tool",
    name:        "New Tool",
    toolType:    "http",        // "http" | "builtin" | "mcp" | "custom"
    // HTTP
    endpoint:    "",
    method:      "POST",
    authType:    "none",        // "none" | "bearer" | "api_key" | "basic"
    authValue:   "",
    // Builtin
    builtinId:   "",
    // MCP
    mcpServer:   "",
    mcpToolName: "",
    // Custom
    customCode:  "def tool_fn(input: str) -> str:\n    # your code here\n    return input",
    // Common
    description:  "",
    inputSchema:  '{\n  "query": "string"\n}',
    outputSchema: '{\n  "result": "string"\n}',
    position: { x: pos.x + 300, y: pos.y + 80 }
  };
}

export const DEFAULT_PLAN_CONSTRAINTS = {
  maxAgentSteps: 8,
  handoffPolicy: "configured_edges",
  requireFinalSynthesis: true,
  allowParallelBranches: false
};

export function createAgentNode(type = "agent", index = 1, anchorNode = null) {
  const isOrchestrator = type === "orchestrator";
  const isInput = type === "user_input";
  const isOutput = type === "output";
  const id = makeId(isOrchestrator ? "orchestrator" : isInput ? "input" : isOutput ? "output" : "agent");
  const fallbackPosition = { x: 80 + ((index - 1) % 2) * 290, y: 90 + Math.floor((index - 1) / 2) * 170 };
  const anchoredPosition = anchorNode?.position
    ? { x: anchorNode.position.x + 280, y: anchorNode.position.y + 48 }
    : fallbackPosition;

  return {
    id,
    name: isOrchestrator ? "Orchestrator" : isInput ? "User Prompt" : isOutput ? "Final Output" : `Agent ${index}`,
    type,
    role: isOrchestrator
      ? "Receives the user prompt, routes work across agents, and creates the final output."
      : isInput
        ? "Runtime prompt that starts the workflow."
        : isOutput
          ? "Displays the orchestrator's final response."
          : "Completes a focused part of the user task.",
    prompt: isOrchestrator
      ? "Use the configured graph links to coordinate the agents. Synthesize their outputs into a useful final response."
      : isInput
        ? ""
        : isOutput
          ? "Render the orchestrator response as the final answer."
          : "Analyze the task and produce a useful contribution for the next agent.",
    model: "llama-3.1-8b-instant",
    provider: "groq",
    temperature: 0.3,
    maxTokens: 512,
    inputMode: "combined_context",
    outputFormat: "markdown",
    builtinTools: [],
    customTools: [],
    toolMode: "auto",
    position: anchoredPosition
  };
}

export function emptyWorkflow() {
  const now = new Date().toISOString();
  return {
    id: makeId("wf"),
    name: "Untitled Workflow",
    description: "",
    builderTarget: "langgraph",
    planConstraints: { ...DEFAULT_PLAN_CONSTRAINTS, maxAgentSteps: 8 },
    nodes: [],
    edges: [],
    mermaid: "",
    groups: [],
    importedWorkspaces: [],
    createdAt: now,
    updatedAt: now
  };
}

export function defaultWorkflow() {
  const now = new Date().toISOString();
  const MODEL = "llama-3.1-8b-instant";
  const nodes = [
    {
      id: "user_input",
      name: "User Prompt",
      type: "user_input",
      role: "The task that kicks off the pipeline.",
      prompt: "Write a Python function that reads a CSV file and returns the top 5 rows sorted by a given column name. Include type hints and a docstring.",
      model: "",
      provider: "groq",
      temperature: 0.3,
      maxTokens: 512,
      inputMode: "user_input",
      outputFormat: "plain_text",
      builtinTools: [],
      customTools: [],
      toolMode: "auto",
      position: { x: 60, y: 160 }
    },
    {
      id: "orchestrator",
      name: "Orchestrator",
      type: "orchestrator",
      role: "Routes the task, collects agent outputs, and writes the final synthesised response.",
      prompt: "You coordinate a code-review pipeline. Pass the user task to the agents in order, then synthesise their outputs into one final, polished answer. Do not repeat yourself — produce a single cohesive response.",
      model: MODEL,
      provider: "groq",
      temperature: 0.2,
      maxTokens: 512,
      inputMode: "combined_context",
      outputFormat: "markdown",
      builtinTools: [],
      customTools: [],
      toolMode: "auto",
      position: { x: 340, y: 160 }
    },
    {
      id: "coder_agent",
      name: "Coder",
      type: "agent",
      role: "Writes the initial code implementation based on the user request.",
      prompt: "You are an expert Python developer. Write clean, correct, well-commented code that exactly satisfies the user request. Output only the code block with a short explanation below it.",
      model: MODEL,
      provider: "groq",
      temperature: 0.25,
      maxTokens: 512,
      inputMode: "user_input",
      outputFormat: "markdown",
      builtinTools: [],
      customTools: [],
      toolMode: "auto",
      position: { x: 660, y: 80 }
    },
    {
      id: "reviewer_agent",
      name: "Reviewer",
      type: "agent",
      role: "Reviews the code for bugs, edge cases, and improvements.",
      prompt: "You are a senior code reviewer. Given the code from the Coder agent, identify bugs, edge cases, missing error handling, and style issues. Output a numbered list of concrete improvements. Be specific.",
      model: MODEL,
      provider: "groq",
      temperature: 0.2,
      maxTokens: 512,
      inputMode: "previous_agent_output",
      outputFormat: "markdown",
      builtinTools: [],
      customTools: [],
      toolMode: "auto",
      position: { x: 660, y: 260 }
    },
    {
      id: "final_output",
      name: "Final Output",
      type: "output",
      role: "Displays the orchestrator's final polished answer.",
      prompt: "",
      model: "",
      provider: "groq",
      temperature: 0.3,
      maxTokens: 512,
      inputMode: "combined_context",
      outputFormat: "markdown",
      builtinTools: [],
      customTools: [],
      toolMode: "auto",
      position: { x: 340, y: 340 }
    }
  ];
  return {
    id: "workflow_default",
    name: "Code Review Pipeline",
    description: "Coder writes an implementation, Reviewer critiques it, Orchestrator synthesises the final answer.",
    builderTarget: "langgraph",
    planConstraints: { ...DEFAULT_PLAN_CONSTRAINTS, maxAgentSteps: 8 },
    nodes,
    edges: [
      { id: "e_input_orch",    source: "user_input",      target: "orchestrator" },
      { id: "e_orch_coder",    source: "orchestrator",    target: "coder_agent" },
      { id: "e_coder_review",  source: "coder_agent",     target: "reviewer_agent" },
      { id: "e_review_orch",   source: "reviewer_agent",  target: "orchestrator" },
      { id: "e_orch_out",      source: "orchestrator",    target: "final_output" }
    ],
    mermaid: "",
    groups: [],
    importedWorkspaces: [],
    createdAt: now,
    updatedAt: now
  };
}

export function personResearchWorkflow() {
  const now   = new Date().toISOString();
  const MODEL = "llama-3.1-8b-instant";

  const nodes = [
    {
      id: "pr_input",
      name: "Person Name",
      type: "user_input",
      role: "Enter the full name of the person you want to research.",
      prompt: "Elon Musk",
      model: "",
      provider: "groq",
      temperature: 0.3,
      maxTokens: 512,
      inputMode: "user_input",
      outputFormat: "plain_text",
      builtinTools: [],
      customTools: [],
      toolMode: "auto",
      position: { x: 60, y: 210 }
    },
    {
      id: "pr_orchestrator",
      name: "Research Coordinator",
      type: "orchestrator",
      role: "Delegates to Wikipedia and News agents, then synthesises a complete profile.",
      prompt: "You coordinate a person-research pipeline. The Wikipedia agent fetches biographical info; the News agent fetches recent news. Synthesise both into a well-structured markdown report with two clear sections:\n\n## Biography\n(from Wikipedia agent)\n\n## Latest News\n(top 3 news items from News agent)",
      model: MODEL,
      provider: "groq",
      temperature: 0.2,
      maxTokens: 1024,
      inputMode: "combined_context",
      outputFormat: "markdown",
      builtinTools: [],
      customTools: [],
      toolMode: "auto",
      position: { x: 350, y: 210 }
    },
    {
      id: "pr_wiki",
      name: "Wikipedia Researcher",
      type: "agent",
      role: "Fetches biographical information about the person from Wikipedia.",
      prompt: "You are a research agent. Use the WikipediaQueryRun tool to search for the person provided in the task. Return a comprehensive summary covering their background, career, and notable achievements. If the tool returns no result, say so clearly.",
      model: MODEL,
      provider: "groq",
      temperature: 0.2,
      maxTokens: 512,
      inputMode: "user_input",
      outputFormat: "markdown",
      builtinTools: [
        { id: "WikipediaQueryRun", name: "WikipediaQueryRun", module: "langchain_community.tools", package: "wikipedia", description: "Query Wikipedia articles", setupCode: "import wikipedia as _wp; _wp.set_user_agent('DriverDirect/1.0')" }
      ],
      customTools: [],
      toolMode: "auto",
      position: { x: 660, y: 100 }
    },
    {
      id: "pr_news",
      name: "News Researcher",
      type: "agent",
      role: "Finds the latest top 3 news articles about the person.",
      prompt: "You are a news research agent. Use the DuckDuckGoSearchRun tool to search for the latest news about the person. Pick the top 3 most recent and relevant results. Format your output as a numbered list — each item must include: the article title, a one-sentence summary, and the approximate date if available.",
      model: MODEL,
      provider: "groq",
      temperature: 0.3,
      maxTokens: 512,
      inputMode: "user_input",
      outputFormat: "markdown",
      builtinTools: [
        { id: "DuckDuckGoSearchRun", name: "DuckDuckGoSearchRun", module: "langchain_community.tools", package: "ddgs", description: "Web search via DuckDuckGo" }
      ],
      customTools: [],
      toolMode: "auto",
      position: { x: 660, y: 320 }
    },
    {
      id: "pr_output",
      name: "Research Report",
      type: "output",
      role: "Displays the full person research report.",
      prompt: "",
      model: "",
      provider: "groq",
      temperature: 0.3,
      maxTokens: 512,
      inputMode: "combined_context",
      outputFormat: "markdown",
      builtinTools: [],
      customTools: [],
      toolMode: "auto",
      position: { x: 350, y: 390 }
    }
  ];

  return {
    id: "workflow_person_research",
    name: "Person Research",
    description: "Enter any person's name to get their Wikipedia biography and latest top 3 news via DuckDuckGo.",
    builderTarget: "langgraph",
    planConstraints: { ...DEFAULT_PLAN_CONSTRAINTS, maxAgentSteps: 8 },
    nodes,
    edges: [
      { id: "e_pr_input_orch",  source: "pr_input",        target: "pr_orchestrator" },
      { id: "e_pr_orch_wiki",   source: "pr_orchestrator", target: "pr_wiki" },
      { id: "e_pr_orch_news",   source: "pr_orchestrator", target: "pr_news" },
      { id: "e_pr_wiki_orch",   source: "pr_wiki",         target: "pr_orchestrator" },
      { id: "e_pr_news_orch",   source: "pr_news",         target: "pr_orchestrator" },
      { id: "e_pr_orch_out",    source: "pr_orchestrator", target: "pr_output" }
    ],
    mermaid: "",
    groups: [],
    importedWorkspaces: [],
    createdAt: now,
    updatedAt: now
  };
}

export function startupPitchWorkflow() {
  const now   = new Date().toISOString();
  const MODEL = "llama-3.1-8b-instant";

  const nodes = [
    {
      id: "sp_input",
      name: "Startup Idea",
      type: "user_input",
      role: "Describe the startup idea to be evaluated.",
      prompt: "A B2B SaaS platform that uses AI to automatically generate personalised outbound sales emails by analysing a prospect's LinkedIn profile, recent company news, and job postings. Pricing: $99/seat/month. Target: SDRs at Series A–C startups.",
      model: "",
      provider: "groq",
      temperature: 0.3,
      maxTokens: 512,
      inputMode: "user_input",
      outputFormat: "plain_text",
      builtinTools: [],
      customTools: [],
      toolMode: "auto",
      position: { x: 60, y: 240 }
    },
    {
      id: "sp_orchestrator",
      name: "Pitch Coordinator",
      type: "orchestrator",
      role: "Dispatches the idea to three specialist analysts, then synthesises a final investor-grade verdict.",
      prompt: `You are a senior venture analyst coordinating a startup pitch review. You receive a startup idea from the user and orchestrate three specialist agents — Market Analyst, Tech Evaluator, and Business Model Analyst — to produce independent assessments.

Once all three agents respond, synthesise their findings into a concise but comprehensive investor-grade report using this structure:

## Executive Summary
2–3 sentences capturing the opportunity and biggest risk.

## Market Analysis
Key findings from the Market Analyst.

## Technical Assessment
Key findings from the Tech Evaluator.

## Business Model Review
Key findings from the Business Model Analyst.

## Overall Verdict
Score each dimension 1–10. Give a final recommendation: PASS, WATCH, or PASS WITH CONDITIONS.

Be direct, rigorous, and actionable. Avoid filler.`,
      model: MODEL,
      provider: "groq",
      temperature: 0.2,
      maxTokens: 1500,
      inputMode: "combined_context",
      outputFormat: "markdown",
      builtinTools: [],
      customTools: [],
      toolMode: "auto",
      position: { x: 360, y: 240 }
    },
    {
      id: "sp_market",
      name: "Market Analyst",
      type: "agent",
      role: "Evaluates market size, competitive landscape, and timing.",
      prompt: `You are a specialist market analyst. Analyse the startup idea provided and produce a structured market assessment covering:

1. **TAM / SAM / SOM** — Estimate the total addressable market and realistic serviceable market in dollars. Be specific, not vague.
2. **Competitive Landscape** — Name 3–5 direct competitors and explain how this startup differentiates. Is the differentiation durable?
3. **Market Timing** — Is the market ready now? What macro or technology trends support (or undermine) the timing?
4. **Customer Pain** — How acute is the problem? Is there evidence of desperate customers paying for inferior solutions today?
5. **Red Flags** — Identify the 2 biggest market-level risks.

Be analytical and precise. Do not pad the response.`,
      model: MODEL,
      provider: "groq",
      temperature: 0.3,
      maxTokens: 700,
      inputMode: "user_input",
      outputFormat: "markdown",
      builtinTools: [],
      customTools: [],
      toolMode: "auto",
      position: { x: 680, y: 60 }
    },
    {
      id: "sp_tech",
      name: "Tech Evaluator",
      type: "agent",
      role: "Assesses technical feasibility, moat, and execution risk.",
      prompt: `You are a specialist technical evaluator with deep experience in AI/ML systems and SaaS infrastructure. Analyse the startup idea and produce a focused technical assessment covering:

1. **Feasibility** — Can this be built with today's technology? What are the hardest engineering problems?
2. **AI/ML Risk** — If AI is core to the product, assess: hallucination risk, latency, fine-tuning needs, model dependency (e.g., reliance on OpenAI).
3. **Technical Moat** — Does the product build proprietary data or compounding technical advantages over time, or is it easily replicated?
4. **Build vs Buy** — What must be built from scratch vs. stitched from APIs? Does a heavy API dependency create fragility?
5. **Scalability** — Any foreseeable bottlenecks at 100x usage?
6. **Team Requirements** — What senior technical hires are non-negotiable in the first 12 months?

Be specific. Avoid generic statements like "AI is improving rapidly".`,
      model: MODEL,
      provider: "groq",
      temperature: 0.2,
      maxTokens: 700,
      inputMode: "user_input",
      outputFormat: "markdown",
      builtinTools: [],
      customTools: [],
      toolMode: "auto",
      position: { x: 680, y: 260 }
    },
    {
      id: "sp_biz",
      name: "Business Model Analyst",
      type: "agent",
      role: "Evaluates revenue model, unit economics, and go-to-market strategy.",
      prompt: `You are a specialist business model analyst. Analyse the startup idea and produce a rigorous assessment covering:

1. **Revenue Model** — Evaluate the pricing strategy. Is $X/seat/month defensible against competitors and alternatives? Is there expansion revenue potential (upsell, usage-based tiers)?
2. **Unit Economics** — Estimate LTV:CAC ratio qualitatively. What does the sales cycle likely look like? Is this a self-serve or enterprise motion?
3. **Go-to-Market** — What is the most realistic first-customer acquisition strategy? Is the ICP (ideal customer profile) tightly defined and reachable?
4. **Payback Period** — Given typical SaaS churn, estimate how many months to recover CAC. Does the business model require significant up-front capital?
5. **Monetisation Risks** — What could prevent the company from charging what it wants (e.g., commoditisation, procurement friction, free alternatives)?
6. **Quick Wins** — Name 2 tactical moves the founders could take in the next 90 days to validate the model.

Be quantitative where possible.`,
      model: MODEL,
      provider: "groq",
      temperature: 0.3,
      maxTokens: 700,
      inputMode: "user_input",
      outputFormat: "markdown",
      builtinTools: [],
      customTools: [],
      toolMode: "auto",
      position: { x: 680, y: 460 }
    },
    {
      id: "sp_output",
      name: "Pitch Analysis Report",
      type: "output",
      role: "Displays the final investor-grade startup analysis.",
      prompt: "",
      model: "",
      provider: "groq",
      temperature: 0.3,
      maxTokens: 512,
      inputMode: "combined_context",
      outputFormat: "markdown",
      builtinTools: [],
      customTools: [],
      toolMode: "auto",
      position: { x: 360, y: 460 }
    }
  ];

  return {
    id: "workflow_startup_pitch",
    name: "Startup Pitch Analyzer",
    description: "Three specialist agents — market, tech, and business model — independently evaluate a startup idea, then an orchestrator synthesises a final investor-grade verdict.",
    builderTarget: "langgraph",
    planConstraints: { ...DEFAULT_PLAN_CONSTRAINTS, maxAgentSteps: 12 },
    nodes,
    edges: [
      { id: "e_sp_in_orch",     source: "sp_input",        target: "sp_orchestrator" },
      { id: "e_sp_orch_market", source: "sp_orchestrator", target: "sp_market" },
      { id: "e_sp_orch_tech",   source: "sp_orchestrator", target: "sp_tech" },
      { id: "e_sp_orch_biz",    source: "sp_orchestrator", target: "sp_biz" },
      { id: "e_sp_market_orch", source: "sp_market",       target: "sp_orchestrator" },
      { id: "e_sp_tech_orch",   source: "sp_tech",         target: "sp_orchestrator" },
      { id: "e_sp_biz_orch",    source: "sp_biz",          target: "sp_orchestrator" },
      { id: "e_sp_orch_out",    source: "sp_orchestrator", target: "sp_output" }
    ],
    mermaid: "",
    groups: [],
    importedWorkspaces: [],
    createdAt: now,
    updatedAt: now
  };
}

export function toReactFlowNodes(workflow, selectedNodeId) {
  return workflow.nodes.map((node) => ({
    id: node.id,
    type: "agentNode",
    position: node.position || { x: 0, y: 0 },
    data: { ...node, selected: node.id === selectedNodeId }
  }));
}

export function toReactFlowEdges(workflow) {
  return workflow.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    animated: true,
    style: { stroke: "#f54e00", strokeWidth: 1.5 }
  }));
}
