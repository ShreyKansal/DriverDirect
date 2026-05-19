import { useState, useEffect, useMemo, useRef } from "react";
import { ChevronRight, Info, Search, ThumbsUp, ThumbsDown } from "lucide-react";

// ─── Navigation ───────────────────────────────────────────────────────────────

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { id: "getting-started", label: "Getting Started" },
      { id: "interface-tour", label: "Interface Tour" },
    ],
  },
  {
    label: "Canvas",
    items: [
      { id: "working-with-nodes", label: "Working with Nodes" },
      { id: "connections", label: "Connections & Edges" },
      { id: "canvas-controls", label: "Canvas Controls" },
      { id: "node-groups", label: "Node Groups" },
    ],
  },
  {
    label: "Agents",
    items: [
      { id: "node-types", label: "Node Types" },
      { id: "agent-config", label: "Agent Configuration" },
      { id: "model-settings", label: "Model Settings" },
    ],
  },
  {
    label: "API Keys",
    items: [
      { id: "api-keys-overview", label: "Overview" },
      { id: "groq-key", label: "Groq" },
      { id: "openai-key", label: "OpenAI" },
      { id: "anthropic-key", label: "Anthropic" },
      { id: "gemini-key", label: "Google Gemini" },
    ],
  },
  {
    label: "Providers",
    items: [
      { id: "builtin-providers", label: "Built-in Providers" },
      { id: "custom-providers", label: "Custom Providers" },
      { id: "local-models", label: "Local Models" },
    ],
  },
  {
    label: "Tools",
    items: [
      { id: "builtin-tools", label: "Built-in Tools" },
      { id: "custom-tools", label: "Custom Python Tools" },
      { id: "custom-http-tools", label: "Custom HTTP Tools" },
    ],
  },
  {
    label: "Execution",
    items: [
      { id: "running", label: "Running a Workflow" },
      { id: "output-terminal", label: "Output Terminal" },
      { id: "docker-sandbox", label: "Docker Sandbox" },
    ],
  },
  {
    label: "Workspace",
    items: [
      { id: "code-view", label: "Code View" },
      { id: "chat-panel", label: "Chat Panel" },
      { id: "project-explorer", label: "Project Explorer" },
      { id: "command-palette", label: "Command Palette" },
    ],
  },
  {
    label: "Reference",
    items: [
      { id: "projects", label: "Project Management" },
      { id: "settings-reference", label: "Settings Reference" },
      { id: "shortcuts", label: "Keyboard Shortcuts" },
    ],
  },
];

// ─── Per-page "In this article" section anchors ───────────────────────────────

const PAGE_ARTICLES = {
  "getting-started": [
    { id: "gs-what", label: "What is AgentDRIVER" },
    { id: "gs-scenario", label: "A real scenario" },
    { id: "gs-prereqs", label: "Prerequisites" },
    { id: "gs-first", label: "Your first workflow" },
    { id: "gs-output", label: "Understanding the output" },
    { id: "gs-next", label: "Next steps" },
  ],
  "interface-tour": [
    { id: "it-layout", label: "Three-panel layout" },
    { id: "it-header", label: "Header bar" },
    { id: "it-left", label: "Left panel" },
    { id: "it-canvas", label: "Canvas area" },
    { id: "it-right", label: "Right config panel" },
    { id: "it-tabs", label: "Workspace tabs" },
  ],
  "working-with-nodes": [
    { id: "wn-anatomy", label: "Node anatomy" },
    { id: "wn-adding", label: "Adding nodes" },
    { id: "wn-selecting", label: "Selecting nodes" },
    { id: "wn-moving", label: "Moving & organizing" },
    { id: "wn-duplicate", label: "Duplicating" },
    { id: "wn-status", label: "Execution status" },
  ],
  "connections": [
    { id: "conn-flow", label: "How data flows" },
    { id: "conn-create", label: "Creating a connection" },
    { id: "conn-rules", label: "Connection rules" },
    { id: "conn-delete", label: "Deleting edges" },
    { id: "conn-parallel", label: "Parallel agents" },
  ],
  "canvas-controls": [
    { id: "cc-zoom", label: "Zoom" },
    { id: "cc-pan", label: "Pan" },
    { id: "cc-layout", label: "Auto-layout" },
    { id: "cc-undo", label: "Undo & redo" },
  ],
  "node-groups": [
    { id: "ng-create", label: "Creating groups" },
    { id: "ng-customize", label: "Naming & coloring" },
    { id: "ng-ungroup", label: "Ungrouping" },
    { id: "ng-when", label: "When to use groups" },
  ],
  "node-types": [
    { id: "nt-user-input", label: "User Input" },
    { id: "nt-agent", label: "Agent" },
    { id: "nt-orchestrator", label: "Orchestrator" },
    { id: "nt-output", label: "Final Output" },
    { id: "nt-tools", label: "Tool nodes" },
  ],
  "agent-config": [
    { id: "ac-open", label: "Opening the panel" },
    { id: "ac-identity", label: "Identity & role" },
    { id: "ac-roles", label: "Writing effective roles" },
    { id: "ac-format", label: "Output format" },
    { id: "ac-handoff", label: "Handoff policy" },
    { id: "ac-tips", label: "Design tips" },
  ],
  "model-settings": [
    { id: "ms-provider", label: "Provider selection" },
    { id: "ms-model", label: "Choosing a model" },
    { id: "ms-temp", label: "Temperature guide" },
    { id: "ms-tokens", label: "Max tokens" },
    { id: "ms-guide", label: "Model decision guide" },
  ],
  "api-keys-overview": [
    { id: "ako-storage", label: "How keys are stored" },
    { id: "ako-scope", label: "Project scope" },
    { id: "ako-add", label: "Adding a key" },
    { id: "ako-manage", label: "Managing keys" },
    { id: "ako-security", label: "Security tips" },
  ],
  "groq-key": [
    { id: "gk-about", label: "About Groq" },
    { id: "gk-steps", label: "Get your key" },
    { id: "gk-models", label: "Available models" },
    { id: "gk-limits", label: "Rate limits" },
    { id: "gk-tips", label: "Best practices" },
  ],
  "openai-key": [
    { id: "ok-about", label: "About OpenAI API" },
    { id: "ok-steps", label: "Get your key" },
    { id: "ok-models", label: "Available models" },
    { id: "ok-billing", label: "Billing" },
    { id: "ok-tips", label: "Best practices" },
  ],
  "anthropic-key": [
    { id: "ak-about", label: "About Anthropic" },
    { id: "ak-steps", label: "Get your key" },
    { id: "ak-models", label: "Available models" },
    { id: "ak-tips", label: "Best practices" },
  ],
  "gemini-key": [
    { id: "gemk-about", label: "About Google AI" },
    { id: "gemk-steps", label: "Get your key" },
    { id: "gemk-models", label: "Available models" },
    { id: "gemk-free", label: "Free tier" },
  ],
  "builtin-providers": [
    { id: "bp-overview", label: "Overview" },
    { id: "bp-table", label: "Provider reference" },
    { id: "bp-adding", label: "Adding keys" },
    { id: "bp-per-agent", label: "Per-agent providers" },
  ],
  "custom-providers": [
    { id: "cp-types", label: "Provider types" },
    { id: "cp-compat", label: "OpenAI-compatible" },
    { id: "cp-local", label: "Local endpoints" },
    { id: "cp-http", label: "Custom HTTP" },
    { id: "cp-add", label: "Adding a provider" },
  ],
  "local-models": [
    { id: "lm-why", label: "Why local models" },
    { id: "lm-ollama", label: "Ollama setup" },
    { id: "lm-lmstudio", label: "LM Studio" },
    { id: "lm-connect", label: "Connecting" },
    { id: "lm-perf", label: "Performance tips" },
  ],
  "builtin-tools": [
    { id: "bt-how", label: "How tools work" },
    { id: "bt-list", label: "Available tools" },
    { id: "bt-add", label: "Adding to an agent" },
    { id: "bt-flow", label: "Execution flow" },
  ],
  "custom-tools": [
    { id: "ct-when", label: "When to write tools" },
    { id: "ct-contract", label: "Function contract" },
    { id: "ct-ex1", label: "Example: stock price" },
    { id: "ct-ex2", label: "Example: web scraper" },
    { id: "ct-ex3", label: "Example: database query" },
    { id: "ct-pkgs", label: "Installing packages" },
  ],
  "custom-http-tools": [
    { id: "cht-overview", label: "Overview" },
    { id: "cht-create", label: "Creating a tool" },
    { id: "cht-placeholders", label: "Placeholders" },
    { id: "cht-auth", label: "Authentication" },
    { id: "cht-example", label: "Full example" },
  ],
  "running": [
    { id: "run-checklist", label: "Pre-run checklist" },
    { id: "run-start", label: "Starting a run" },
    { id: "run-phases", label: "Execution phases" },
    { id: "run-debug", label: "Debugging failures" },
    { id: "run-tips", label: "Optimization tips" },
  ],
  "output-terminal": [
    { id: "ot-open", label: "Opening the terminal" },
    { id: "ot-tabs", label: "Terminal tabs" },
    { id: "ot-bootstrap", label: "Bootstrap phase" },
    { id: "ot-cards", label: "Agent step cards" },
    { id: "ot-filter", label: "Filtering & copying" },
  ],
  "docker-sandbox": [
    { id: "ds-what", label: "What is the sandbox" },
    { id: "ds-req", label: "Requirements" },
    { id: "ds-specs", label: "Specifications" },
    { id: "ds-bootstrap", label: "Bootstrap phase" },
    { id: "ds-security", label: "Security model" },
  ],
  "code-view": [
    { id: "cv-open", label: "Opening Code View" },
    { id: "cv-mermaid", label: "Mermaid tab" },
    { id: "cv-json", label: "JSON tab" },
    { id: "cv-export", label: "Export & share" },
  ],
  "chat-panel": [
    { id: "cp2-open", label: "Opening the panel" },
    { id: "cp2-messages", label: "Sending messages" },
    { id: "cp2-attach", label: "File attachments" },
    { id: "cp2-usecases", label: "Use cases" },
  ],
  "project-explorer": [
    { id: "pe-open", label: "Opening the explorer" },
    { id: "pe-tree", label: "Project tree" },
    { id: "pe-switch", label: "Switching workflows" },
    { id: "pe-create", label: "Creating workflows" },
  ],
  "command-palette": [
    { id: "cmd-open", label: "Opening the palette" },
    { id: "cmd-list", label: "Available commands" },
    { id: "cmd-tips", label: "Power user tips" },
  ],
  "projects": [
    { id: "proj-basics", label: "Project basics" },
    { id: "proj-ops", label: "Operations" },
    { id: "proj-workflows", label: "Multiple workflows" },
    { id: "proj-io", label: "Import & export" },
  ],
  "settings-reference": [
    { id: "sr-general", label: "General" },
    { id: "sr-workflows", label: "Workflows" },
    { id: "sr-models", label: "Models & Providers" },
    { id: "sr-execution", label: "Execution" },
    { id: "sr-outputs", label: "Outputs" },
    { id: "sr-safety", label: "Safety" },
    { id: "sr-advanced", label: "Advanced & Danger Zone" },
  ],
  "shortcuts": [
    { id: "sh-global", label: "Global shortcuts" },
    { id: "sh-canvas", label: "Canvas shortcuts" },
    { id: "sh-nodes", label: "Node shortcuts" },
  ],
};

// ─── Helper components ────────────────────────────────────────────────────────

function C({ children }) {
  return (
    <code className="rounded-[2px] border border-hairline bg-surfaceStrong px-1.5 py-0.5 font-mono text-[12px] text-ink">
      {children}
    </code>
  );
}

function Kbd({ children }) {
  return (
    <kbd className="rounded-[2px] border border-hairline bg-surfaceStrong px-1.5 py-0.5 font-mono text-[11px] text-body">
      {children}
    </kbd>
  );
}

function A({ href, children }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
      {children}
    </a>
  );
}

function Divider() {
  return <div className="my-6 border-t border-hairline" />;
}

function SH({ children }) {
  return <h2 className="mb-2 mt-8 text-[17px] font-semibold text-ink first:mt-0">{children}</h2>;
}

function H3({ children }) {
  return <h3 className="mb-1 mt-5 text-[13px] font-semibold text-ink">{children}</h3>;
}

function P({ children }) {
  return <p className="mb-3 text-[13px] leading-[1.7] text-body">{children}</p>;
}

function OL({ children }) {
  return <ol className="mb-3 ml-5 list-decimal space-y-1.5 text-[13px] leading-[1.7] text-body">{children}</ol>;
}

function UL({ children }) {
  return <ul className="mb-3 ml-5 list-disc space-y-1.5 text-[13px] leading-[1.7] text-body">{children}</ul>;
}

function Callout({ type = "note", children }) {
  const isWarning = type === "warning";
  const tone = isWarning
    ? {
        border: "border-yellow-400/40",
        bg: "bg-yellow-400/10",
        text: "text-yellow-200",
        icon: "text-yellow-400",
        strong: "text-yellow-100",
        shadow: "",
      }
    : {
        border: "border-primary/30",
        bg: "bg-primary/10",
        text: "text-body",
        icon: "text-primary",
        strong: "text-ink",
        shadow: "",
      };

  return (
    <div className={`mb-4 rounded-[8px] border ${tone.border} ${tone.bg} px-4 py-3 ${tone.text}`}>
      <div className="flex items-start gap-3">
        <Info size={18} strokeWidth={1.8} className={`mt-[1px] shrink-0 ${tone.icon}`} />
        <div className={`text-[13px] leading-[1.8] [&_strong]:font-semibold [&_strong]:${tone.strong} [&_a]:${tone.strong} [&_a]:underline-offset-2 hover:[&_a]:underline`}>
          {children}
        </div>
      </div>
    </div>
  );
}

function DefList({ items }) {
  return (
    <dl className="mb-4 space-y-3">
      {items.map(({ term, def }) => (
        <div key={term} className="rounded-[2px] border border-hairline bg-canvasSoft px-4 py-3">
          <dt className="text-[13px] font-semibold text-ink">{term}</dt>
          <dd className="mt-0.5 text-[13px] leading-[1.7] text-body">{def}</dd>
        </div>
      ))}
    </dl>
  );
}

function Table({ head, rows }) {
  return (
    <div className="mb-4 overflow-hidden rounded-[3px] border border-hairline">
      <table className="w-full border-collapse text-[13px]">
        {head && (
          <thead>
            <tr className="border-b border-hairline bg-canvasSoft text-left">
              {head.map((h) => (
                <th key={h} className="py-2 pl-3 pr-4 font-semibold text-body">{h}</th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-hairlineSoft last:border-b-0 hover:bg-canvasSoft">
              {row.map((cell, j) => (
                <td key={j} className="py-2 pl-3 pr-4 text-body">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CodeBlock({ children }) {
  return (
    <pre className="mb-4 overflow-x-auto rounded-[3px] border border-hairline bg-surfaceStrong p-4 font-mono text-[12px] leading-[1.6] text-ink">
      {children}
    </pre>
  );
}

function PageHeader({ title, subtitle }) {
  return (
    <div className="mb-6 border-b border-hairline pb-4">
      <h1 className="text-[26px] font-semibold leading-tight text-ink">{title}</h1>
      {subtitle && <p className="mt-1.5 text-[14px] text-body">{subtitle}</p>}
    </div>
  );
}

function Sec({ id, children }) {
  return <section id={id} className="scroll-mt-4">{children}</section>;
}

// ─── Page: Getting Started ────────────────────────────────────────────────────

function PageGettingStarted() {
  return (
    <>
      <PageHeader
        title="Getting Started"
        subtitle="Build and run your first multi-agent workflow in under five minutes."
      />

      <Sec id="gs-what">
        <SH>What is AgentDRIVER</SH>
        <P>
          AgentDRIVER is a visual multi-agent workflow builder. You design pipelines by placing
          LLM-powered nodes on a canvas, wiring them together, and pressing Run. Each node is an
          independent AI agent with its own model, system prompt, and optional tools. They
          collaborate by passing outputs downstream until an Orchestrator node synthesizes a
          final answer.
        </P>
        <P>
          Unlike prompt chaining in code, AgentDRIVER lets you see the entire workflow as a
          graph, watch each agent execute in real time, and inspect every input and output
          without writing a single line of code. When you need more power, you can attach
          arbitrary Python tools or call external APIs from any agent.
        </P>
      </Sec>

      <Sec id="gs-scenario">
        <SH>A real scenario: competitive research report</SH>
        <P>
          Imagine you want to generate a competitive analysis for a SaaS product. A typical
          three-agent workflow looks like this:
        </P>
        <DefList
          items={[
            {
              term: "1. Research Agent",
              def: "Receives the product name from User Input. Uses the DuckDuckGo Search tool to find recent news, pricing pages, and user reviews. Outputs a raw data dump.",
            },
            {
              term: "2. Analysis Agent",
              def: "Receives the Research Agent's output. Identifies strengths, weaknesses, pricing patterns, and target markets. Outputs a structured analysis in JSON format.",
            },
            {
              term: "3. Orchestrator",
              def: "Receives both the raw research and the analysis. Synthesizes a polished executive summary in Markdown, ready to paste into a presentation.",
            },
          ]}
        />
        <P>
          The whole pipeline runs in seconds. You can tweak any agent's prompt, swap its model,
          or add more specialized agents (e.g., a dedicated Pricing Agent) without touching the
          others. That is the core value of AgentDRIVER: composable, observable AI pipelines
          without code.
        </P>
      </Sec>

      <Sec id="gs-prereqs">
        <SH>Prerequisites</SH>
        <UL>
          <li>A modern browser (Chrome, Edge, Firefox, or Safari).</li>
          <li>
            An API key from at least one provider — Groq is free and takes 60 seconds to set up.
            See the <strong>API Keys</strong> section for step-by-step instructions.
          </li>
          <li>
            <strong>Optional:</strong> Docker Desktop — only required if you want to use built-in
            or custom Python tools. Workflows without tools run without Docker.
          </li>
        </UL>
      </Sec>

      <Sec id="gs-first">
        <SH>Your first workflow</SH>
        <OL>
          <li>
            Press <Kbd>Ctrl+Shift+N</Kbd> or click <strong>File → New Project</strong>. A new
            project opens with four nodes already connected:{" "}
            <strong>User Input → Agent → Orchestrator → Final Output</strong>.
          </li>
          <li>
            Click the <strong>Agent</strong> node. The right panel shows its configuration. Set
            the <strong>Name</strong> to <em>Research Agent</em> and the <strong>Role</strong>{" "}
            to: <em>You are a research assistant. Find relevant facts about the given topic.</em>
          </li>
          <li>
            In the <strong>Model</strong> tab, select <strong>Groq</strong> as the provider and{" "}
            <strong>Llama 3.3 70B</strong> as the model. If no key is set yet, a yellow warning
            appears — click it to jump directly to the key settings.
          </li>
          <li>
            Add your API key: press <Kbd>Ctrl+K</Kbd>, go to{" "}
            <strong>Models &amp; Providers</strong>, and paste your Groq key next to Groq. Save.
          </li>
          <li>
            Press <Kbd>Ctrl+Enter</Kbd> or click <strong>Run</strong> in the header. Type your
            task, for example: <em>Research the key features and pricing of Notion.</em>
          </li>
          <li>
            The terminal panel opens at the bottom. Watch each agent execute step by step. The
            Orchestrator synthesizes the final answer which appears under{" "}
            <strong>final output</strong>.
          </li>
        </OL>
        <Callout type="tip">
          The workflow auto-saves 1.5 seconds after every change. You never need to manually
          save before running — just hit Run.
        </Callout>
      </Sec>

      <Sec id="gs-output">
        <SH>Understanding the execution output</SH>
        <P>
          The terminal panel has two tabs: <strong>TERMINAL</strong> shows the live step-by-step
          execution log; <strong>OUTPUT</strong> shows just the final answer. During a run:
        </P>
        <UL>
          <li>
            A <strong>pulsing yellow dot</strong> on a node means it is currently calling its
            LLM.
          </li>
          <li>A <strong>green checkmark</strong> means the agent completed successfully.</li>
          <li>A <strong>red X</strong> means the agent failed — expand its card to see the error.</li>
          <li>
            Each agent card shows the exact input the agent received, its full output, and any
            tool calls it made (with inputs, outputs, and execution times).
          </li>
        </UL>
        <P>
          The final answer at the bottom of the TERMINAL tab is the Orchestrator's synthesized
          response. Click <strong>copy</strong> to copy it to the clipboard.
        </P>
      </Sec>

      <Sec id="gs-next">
        <SH>Next steps</SH>
        <P>After your first run, explore these features to get more out of AgentDRIVER:</P>
        <UL>
          <li>
            <strong>Add more agents</strong> — use <strong>Edit → Add Node → Agent</strong> to
            add specialized agents for different subtasks.
          </li>
          <li>
            <strong>Add tools</strong> — click an agent, open the Tools tab, and add DuckDuckGo
            Search or Calculator. Requires Docker.
          </li>
          <li>
            <strong>Explore the Code View</strong> — click the Code tab to see your workflow as
            a Mermaid diagram or raw JSON. Copy the JSON to share with teammates.
          </li>
          <li>
            <strong>Try different models</strong> — give each agent a different model and compare
            the results. A fast cheap model for extraction, a powerful model for synthesis.
          </li>
          <li>
            <strong>Use the Command Palette</strong> — press <Kbd>Ctrl+Shift+P</Kbd> to run any
            action by name without reaching for the mouse.
          </li>
        </UL>
      </Sec>
    </>
  );
}

// ─── Page: Interface Tour ─────────────────────────────────────────────────────

function PageInterfaceTour() {
  return (
    <>
      <PageHeader
        title="Interface Tour"
        subtitle="A guided map of every panel, toolbar, and tab in the workspace."
      />

      <Sec id="it-layout">
        <SH>Three-panel layout</SH>
        <P>
          AgentDRIVER uses a three-panel layout that mirrors professional IDEs. The left panel
          handles navigation and conversation, the center panel is your main workspace, and the
          right panel is context-sensitive configuration. All three panels are resizable by
          dragging their borders.
        </P>
        <Table
          head={["Panel", "Purpose", "Toggle"]}
          rows={[
            ["Left", "Explorer, Chat, or Workspaces", "Ctrl+B / Ctrl+Shift+K"],
            ["Center", "Canvas, terminal, code view", "Always visible"],
            ["Right", "Node config, connection list", "Auto-shows on node select"],
          ]}
        />
      </Sec>

      <Sec id="it-header">
        <SH>Header bar</SH>
        <P>
          The 48 px header bar spans the full width of the window and contains, left to right:
        </P>
        <UL>
          <li>
            <strong>App menu</strong> — File, Edit, Selection, View, Run, Terminal, Help. Every
            action in the app is accessible from here.
          </li>
          <li>
            <strong>Command search</strong> — a search box (<Kbd>Ctrl+Shift+P</Kbd>) that lets
            you run any command by typing its name. Faster than the menus once you learn the
            names.
          </li>
          <li>
            <strong>Project switcher</strong> — a dropdown showing all open projects. Click to
            switch; the canvas, terminal, and settings all update to the selected project.
          </li>
          <li>
            <strong>Run button</strong> — starts a workflow execution. Turns into a{" "}
            <em>Running…</em> button during a run; click it again to abort.
          </li>
          <li>
            <strong>Theme toggle &amp; profile</strong> — switch between light and dark mode;
            view your account info.
          </li>
        </UL>
      </Sec>

      <Sec id="it-left">
        <SH>Left panel</SH>
        <P>
          A 14 px activity bar on the far left holds icon buttons. Click an icon to toggle the
          corresponding panel open or closed:
        </P>
        <DefList
          items={[
            {
              term: "Explorer (Ctrl+B)",
              def: "A project and workflow tree. Shows every project you have created, with their workflows listed underneath. Click a workflow to switch to it. Use the + button to add new workflows to a project.",
            },
            {
              term: "Chat (Ctrl+Shift+K)",
              def: "A conversation panel for discussing workflow design, attaching reference files, or taking notes. Supports Markdown rendering. Not connected to the workflow execution engine — messages do not feed into agent runs.",
            },
          ]}
        />
      </Sec>

      <Sec id="it-canvas">
        <SH>Canvas area</SH>
        <P>
          The canvas is the heart of AgentDRIVER. It occupies the center column and contains
          three zones stacked vertically:
        </P>
        <UL>
          <li>
            <strong>Canvas toolbar</strong> — a thin strip at the top with zoom in/out/fit
            buttons and an auto-layout trigger.
          </li>
          <li>
            <strong>Flow Canvas</strong> — the interactive node editor. Drag nodes to position
            them, drag edges between ports to connect agents, scroll to zoom, and drag the
            background to pan. Supports multi-select, grouping, and undo.
          </li>
          <li>
            <strong>Output Terminal</strong> — a resizable panel at the bottom that shows
            execution logs. Toggle with <Kbd>Ctrl+`</Kbd>. Drag its top border to resize.
          </li>
        </UL>
      </Sec>

      <Sec id="it-right">
        <SH>Right config panel</SH>
        <P>
          Clicking any node opens the right panel with two tabs:
        </P>
        <UL>
          <li>
            <strong>Config</strong> — edit the node's name, role, model, temperature, max
            tokens, output format, handoff policy, and tools. Changes are saved automatically.
          </li>
          <li>
            <strong>Connections</strong> — lists all edges connected to the selected node,
            showing the source and target. Click any edge to highlight it on the canvas.
          </li>
        </UL>
        <P>
          The right panel stays open and updates as you click different nodes. It closes when
          you press <Kbd>Escape</Kbd> or click an empty area of the canvas.
        </P>
      </Sec>

      <Sec id="it-tabs">
        <SH>Workspace tabs</SH>
        <P>
          Above the canvas, a tab bar lets you switch views within the current project:
        </P>
        <Table
          head={["Tab", "What it shows"]}
          rows={[
            ["Workflow", "The main canvas editor. Default view."],
            ["Code", "Mermaid diagram and raw JSON of the workflow."],
            ["Agent: [name]", "Full-width view of a single agent's config. Right-click a node → Open in Tab."],
            ["Settings", "All project settings. Opens with Ctrl+K."],
            ["Docs", "This documentation. Opens with F1."],
          ]}
        />
        <Callout type="tip">
          Settings and Docs tabs are sticky — switching to the Workflow tab does not close them.
          They stay open so you can reference them while editing.
        </Callout>
      </Sec>
    </>
  );
}

// ─── Page: Working with Nodes ─────────────────────────────────────────────────

function PageWorkingWithNodes() {
  return (
    <>
      <PageHeader
        title="Working with Nodes"
        subtitle="Add, select, move, duplicate, and delete nodes on the canvas."
      />

      <Sec id="wn-anatomy">
        <SH>Node anatomy</SH>
        <P>
          Every node is a card with three visual areas. Understanding them helps you read the
          canvas at a glance:
        </P>
        <UL>
          <li>
            <strong>Header</strong> — shows the node type icon, name, and a status badge in the
            top-right corner during execution (yellow pulse = running, green = done, red = failed).
          </li>
          <li>
            <strong>Body</strong> — shows the provider, model name, and tool count for Agent and
            Orchestrator nodes. User Input and Final Output nodes show their node type label.
          </li>
          <li>
            <strong>Ports</strong> — circular connection points on the left (input) and right
            (output) edges. Hover a node to reveal them. Drag from an output port to connect.
          </li>
        </UL>
        <P>
          Tool nodes are a special sub-type: they appear smaller with a dashed border and are
          always attached to a parent agent. They represent Python or HTTP functions the LLM can
          call during execution.
        </P>
      </Sec>

      <Sec id="wn-adding">
        <SH>Adding nodes</SH>
        <P>Three ways to add a node:</P>
        <OL>
          <li>
            <strong>Menu bar:</strong> Click <strong>Edit → Add Node</strong> and choose a type.
          </li>
          <li>
            <strong>Command palette:</strong> Press <Kbd>Ctrl+Shift+P</Kbd>, type{" "}
            <em>add agent</em> or <em>add orchestrator</em>, and press Enter.
          </li>
          <li>
            <strong>Node Palette (if visible):</strong> Drag a node type from the left palette
            onto the canvas.
          </li>
        </OL>
        <P>
          The new node appears in the center of the current viewport. Drag it to your preferred
          position. A new Agent node comes pre-filled with a default name and model — click it
          to customize.
        </P>
        <Callout type="note">
          Every workflow must have exactly one User Input node and exactly one Orchestrator
          node. Adding a second of either will cause a validation error when you try to run.
        </Callout>
      </Sec>

      <Sec id="wn-selecting">
        <SH>Selecting nodes</SH>
        <UL>
          <li>
            <strong>Single select:</strong> click a node. Its config opens in the right panel.
          </li>
          <li>
            <strong>Multi-select:</strong> hold <Kbd>Shift</Kbd> and click additional nodes, or
            drag a selection rectangle over an empty area of the canvas.
          </li>
          <li>
            <strong>Deselect:</strong> press <Kbd>Escape</Kbd> or click an empty canvas area.
          </li>
        </UL>
        <P>
          When multiple nodes are selected, right-clicking shows a context menu with bulk
          options including <strong>Group selected nodes</strong> and{" "}
          <strong>Delete selected</strong>.
        </P>
      </Sec>

      <Sec id="wn-moving">
        <SH>Moving and organizing</SH>
        <P>
          Drag any node to reposition it. Edges update dynamically. For large workflows, use
          auto-layout (<Kbd>Ctrl+Shift+L</Kbd>) to arrange all nodes into a clean left-to-right
          DAG hierarchy. Auto-layout runs a topological sort and a barycenter pass to minimize
          edge crossings, so even complex 10-agent graphs become readable in one click.
        </P>
        <P>
          After auto-layout, you can still drag individual nodes to fine-tune positioning. The
          layout is a starting point, not a constraint.
        </P>
      </Sec>

      <Sec id="wn-duplicate">
        <SH>Duplicating nodes</SH>
        <P>
          Select a node and press <Kbd>Ctrl+D</Kbd>, or use{" "}
          <strong>Edit → Duplicate Node</strong>. The copy appears offset from the original and
          inherits everything: name, model, provider, temperature, max tokens, system prompt, and
          tools. Edges are not copied — you wire the duplicate manually.
        </P>
        <P>
          Duplication is useful when you need several agents with the same base configuration
          but different role descriptions — for example, three specialized research agents, each
          covering a different topic domain.
        </P>
      </Sec>

      <Sec id="wn-status">
        <SH>Execution status indicators</SH>
        <P>
          During a workflow run, each node displays a real-time status badge so you can watch
          the execution flow through the graph:
        </P>
        <Table
          head={["Badge", "Meaning"]}
          rows={[
            ["Pulsing yellow dot", "Agent is currently calling its LLM or waiting for a tool."],
            ["Green checkmark", "Agent completed successfully. Output is available in the terminal."],
            ["Red X", "Agent failed. The run stops here unless error handling is configured."],
            ["No badge", "Agent has not run yet in this execution."],
          ]}
        />
        <P>
          Badges clear when you start a new run or click the trash icon in the terminal header.
        </P>
      </Sec>
    </>
  );
}

// ─── Page: Connections & Edges ────────────────────────────────────────────────

function PageConnections() {
  return (
    <>
      <PageHeader
        title="Connections & Edges"
        subtitle="Wire agents together to define how data flows through your workflow."
      />

      <Sec id="conn-flow">
        <SH>How data flows between nodes</SH>
        <P>
          Each edge represents a data dependency. When an agent completes, its text output is
          passed to every node that has an incoming edge from it. A downstream agent receives the
          outputs of all its upstream predecessors as combined context before generating its own
          response.
        </P>
        <P>
          This means you can build fan-out patterns (one agent feeding several specialists) and
          fan-in patterns (several agents feeding one summarizer) just by drawing edges. The
          execution engine handles the topological sort automatically — no explicit ordering code
          needed.
        </P>
      </Sec>

      <Sec id="conn-create">
        <SH>Creating a connection</SH>
        <OL>
          <li>Hover over a node until the circular ports appear on its left and right edges.</li>
          <li>Click and drag from the <strong>output port</strong> (right side) of the source node.</li>
          <li>Drag toward the <strong>input port</strong> (left side) of the target node.</li>
          <li>Release over the port. A Bezier curve edge appears connecting the two nodes.</li>
        </OL>
        <P>
          You can fan multiple edges from a single output port — for example, connecting a
          Research Agent to both an Analysis Agent and a Fact-Check Agent in parallel. The
          canvas fans the edges to prevent overlap.
        </P>
        <Callout type="tip">
          If you miss the port, the edge disappears. Try again — hover until the port turns blue
          before dragging.
        </Callout>
      </Sec>

      <Sec id="conn-rules">
        <SH>Connection rules</SH>
        <P>Not all connections are valid. Here are the recommended patterns:</P>
        <Table
          head={["From", "To", "Purpose"]}
          rows={[
            ["User Input", "Agent", "Task prompt enters the pipeline."],
            ["User Input", "Orchestrator", "Task goes directly to synthesis (simple workflows)."],
            ["Agent", "Agent", "Output from one specialist feeds another."],
            ["Agent", "Orchestrator", "Agent results collected for final synthesis."],
            ["Orchestrator", "Final Output", "Synthesized answer displayed to user."],
          ]}
        />
        <Callout type="note">
          Circular connections (A → B → A) are detected and blocked. The execution engine
          enforces acyclicity to prevent infinite loops.
        </Callout>
      </Sec>

      <Sec id="conn-delete">
        <SH>Deleting edges</SH>
        <OL>
          <li>Click an edge on the canvas. It highlights in blue when selected.</li>
          <li>Press <Kbd>Backspace</Kbd> to delete it.</li>
        </OL>
        <P>
          Deleting an edge does not delete either node — only the data connection between them.
          The upstream agent will still run; its output just won't flow to the disconnected node.
        </P>
      </Sec>

      <Sec id="conn-parallel">
        <SH>Running agents in parallel</SH>
        <P>
          Agents that have no dependency on each other run conceptually in parallel order — the
          execution engine calculates which agents are at the same topological depth and runs
          them together before moving to the next layer.
        </P>
        <P>
          To create a parallel pattern: connect User Input to two separate Agent nodes (Research
          Agent and Pricing Agent), then connect both to the Orchestrator. The execution will
          gather both outputs before the Orchestrator synthesizes the final answer.
        </P>
      </Sec>
    </>
  );
}

// ─── Page: Canvas Controls ────────────────────────────────────────────────────

function PageCanvasControls() {
  return (
    <>
      <PageHeader
        title="Canvas Controls"
        subtitle="Zoom, pan, auto-layout, and undo — keep large workflows manageable."
      />

      <Sec id="cc-zoom">
        <SH>Zoom</SH>
        <P>The canvas supports zoom from 15% to 200%. Three ways to zoom:</P>
        <UL>
          <li><strong>Scroll wheel</strong> — zoom in and out centered on the cursor position.</li>
          <li><strong>Toolbar buttons</strong> — the + and – icons in the top canvas toolbar.</li>
          <li>
            <strong>Fit to view</strong> — the fit icon in the toolbar zooms out just enough to
            show all nodes at once. Useful after adding many nodes or switching to a workflow
            you haven't opened in a while.
          </li>
        </UL>
      </Sec>

      <Sec id="cc-pan">
        <SH>Pan</SH>
        <UL>
          <li><strong>Drag the background</strong> — click and drag any empty area of the canvas.</li>
          <li>
            <strong>Space + drag</strong> — hold <Kbd>Space</Kbd> and drag anywhere on the
            canvas, including over nodes. This is the fastest way to navigate without
            accidentally moving a node.
          </li>
        </UL>
      </Sec>

      <Sec id="cc-layout">
        <SH>Auto-layout</SH>
        <P>
          Auto-layout rearranges all nodes into a clean left-to-right directed graph. It runs a
          topological sort to establish layer order, then a barycenter heuristic pass to minimize
          edge crossings. For most workflows, one click produces a readable layout.
        </P>
        <OL>
          <li>Press <Kbd>Ctrl+Shift+L</Kbd>, or click the layout icon in the canvas toolbar.</li>
          <li>Nodes snap to their computed positions with a smooth animation.</li>
          <li>You can drag any node afterward to fine-tune placement.</li>
        </OL>
        <Callout type="tip">
          Run auto-layout immediately after building a new workflow — it reveals the data flow
          direction and makes it obvious if you've missed a connection.
        </Callout>
      </Sec>

      <Sec id="cc-undo">
        <SH>Undo and redo</SH>
        <P>
          AgentDRIVER keeps an 80-step undo history for workflow changes. Press{" "}
          <Kbd>Ctrl+Z</Kbd> to undo the last change. Currently redo is not mapped to a shortcut
          — use the Edit menu if you need to redo.
        </P>
        <P>
          Undo covers: adding/deleting/moving nodes, connecting/deleting edges, renaming nodes,
          changing model settings, and editing role descriptions. It does not cover API key
          changes or project-level settings.
        </P>
      </Sec>
    </>
  );
}

// ─── Page: Node Groups ────────────────────────────────────────────────────────

function PageNodeGroups() {
  return (
    <>
      <PageHeader
        title="Node Groups"
        subtitle="Visually group related agents to organize complex workflows."
      />

      <Sec id="ng-create">
        <SH>Creating a group</SH>
        <OL>
          <li>
            Multi-select two or more nodes by holding <Kbd>Shift</Kbd> and clicking each one,
            or by dragging a selection rectangle.
          </li>
          <li>Right-click any selected node to open the context menu.</li>
          <li>Choose <strong>Group selected nodes</strong>.</li>
          <li>
            A colored rectangle appears around the nodes with a default name like{" "}
            <em>Group 1</em>. The color is assigned randomly.
          </li>
        </OL>
      </Sec>

      <Sec id="ng-customize">
        <SH>Naming and coloring</SH>
        <P>
          Right-click the group border or header to open the group context menu:
        </P>
        <UL>
          <li><strong>Rename group</strong> — type a descriptive name like <em>Data Pipeline</em> or <em>Analysis Layer</em>.</li>
          <li><strong>Change color</strong> — choose from the color palette. Use color to encode meaning: blue for data agents, green for analysis agents, orange for output agents.</li>
        </UL>
      </Sec>

      <Sec id="ng-ungroup">
        <SH>Ungrouping and deleting</SH>
        <UL>
          <li>
            <strong>Ungroup:</strong> right-click the group → <strong>Ungroup</strong>. Nodes are
            released back to the canvas; all edges remain intact. The group container is removed.
          </li>
          <li>
            <strong>Delete group:</strong> right-click → <strong>Delete group</strong>. This
            removes only the group container — nodes inside are <em>not</em> deleted.
          </li>
        </UL>
      </Sec>

      <Sec id="ng-when">
        <SH>When to use groups</SH>
        <P>
          Groups are purely visual — they do not affect execution order or data routing. Use them
          to:
        </P>
        <UL>
          <li>
            <strong>Annotate workflow phases</strong> — group the first three agents into a
            "Research Phase" group and the next two into a "Synthesis Phase" group.
          </li>
          <li>
            <strong>Communicate intent to teammates</strong> — color-coded groups make it
            immediately clear which agents are responsible for which stage of the pipeline.
          </li>
          <li>
            <strong>Manage large workflows</strong> — in a 12-agent workflow, groups prevent the
            canvas from looking like a tangle of boxes.
          </li>
        </UL>
      </Sec>
    </>
  );
}

// ─── Page: Node Types ─────────────────────────────────────────────────────────

function PageNodeTypes() {
  return (
    <>
      <PageHeader title="Node Types" subtitle="Four node types form the building blocks of every workflow." />
      <Sec id="nt-user-input">
        <SH>User Input</SH>
        <P>The entry point of every workflow. When you click Run, the task you type is injected here and passed downstream. Does not call any LLM — pure pass-through. Every workflow needs exactly one.</P>
      </Sec>
      <Sec id="nt-agent">
        <SH>Agent</SH>
        <P>An LLM-powered worker with its own model, system prompt, and optional tools. Receives context from all upstream nodes, generates a response, and passes it downstream. You can have as many agents as needed.</P>
        <UL>
          <li><strong>Specialist agents</strong> — each handles one domain (research, pricing, legal).</li>
          <li><strong>Sequential pipeline</strong> — each agent refines the previous output.</li>
          <li><strong>Reviewer agent</strong> — checks another agent's output for accuracy.</li>
        </UL>
      </Sec>
      <Sec id="nt-orchestrator">
        <SH>Orchestrator</SH>
        <P>Runs after all agents finish. Receives every preceding agent's output as context and synthesizes the final answer. Think of it as the editor-in-chief — it doesn't do original research, it reads everything the specialists produced and writes the definitive response. Every workflow needs exactly one.</P>
        <Callout type="tip">Use your most capable model for the Orchestrator — it has the largest context (all agent outputs combined) and the highest reasoning demands.</Callout>
      </Sec>
      <Sec id="nt-output">
        <SH>Final Output</SH>
        <P>The display sink. Receives the Orchestrator result and shows it in the terminal. Does not call any LLM. Every workflow needs exactly one connected to the Orchestrator.</P>
      </Sec>
      <Sec id="nt-tools">
        <SH>Tool nodes</SH>
        <P>Small nodes with a dashed border representing Python functions or HTTP calls the LLM can invoke. They attach to a parent agent via the Tools tab — not by drawing canvas edges. All tools run in an isolated Docker sandbox.</P>
      </Sec>
    </>
  );
}

// ─── Page: Agent Configuration ────────────────────────────────────────────────

function PageAgentConfig() {
  return (
    <>
      <PageHeader title="Agent Configuration" subtitle="Configure each agent's identity, model, prompt, and tools from the right panel." />
      <Sec id="ac-open">
        <SH>Opening the config panel</SH>
        <P>Click any Agent or Orchestrator node. The right panel shows its configuration. Press <Kbd>Escape</Kbd> or click an empty canvas area to close. Right-click a node and choose <strong>Open in Tab</strong> for a dedicated full-screen editing view — useful for agents with long role descriptions.</P>
      </Sec>
      <Sec id="ac-identity">
        <SH>Identity and type</SH>
        <DefList items={[
          { term: "Name", def: "Label shown on the node card and in execution logs. Use descriptive names: 'Research Agent', 'Pricing Analyzer'. Avoid 'Agent 1' — it makes logs unreadable." },
          { term: "Type", def: "agent, orchestrator, user_input, or output. Most nodes stay as 'agent'." },
          { term: "Role (System Prompt)", def: "Instructions to the LLM. The most important configuration field — a well-written role determines output quality. The builder auto-constructs the full system prompt from this." },
        ]} />
      </Sec>
      <Sec id="ac-roles">
        <SH>Writing effective role descriptions</SH>
        <H3>What to avoid</H3>
        <UL>
          <li><em>"You are a helpful assistant."</em> — Too generic. No focus, no format, no constraints.</li>
          <li><em>"Research things."</em> — No output format, no scope, no purpose.</li>
        </UL>
        <H3>What works</H3>
        <UL>
          <li><em>"You are a market research specialist. Given a company name, find its key products, pricing tiers, and target market. Return a structured list with one section per topic. Be specific."</em></li>
          <li><em>"You are a fact-checker. Identify vague or unsupported claims in the report below. Return a numbered list of flagged claims with your reasoning for each."</em></li>
          <li><em>"You are a technical writer. Rewrite the JSON analysis below as a plain-English executive summary. Use bullet points for key findings. Maximum 300 words."</em></li>
        </UL>
        <Callout type="tip">A good role has four parts: a job title, a specific task, a format instruction, and constraints. Four sentences is usually enough.</Callout>
      </Sec>
      <Sec id="ac-format">
        <SH>Output format</SH>
        <Table head={["Format", "Best for", "Example"]} rows={[
          ["Markdown", "Reports, summaries, analysis", "Headers, bullet lists, code blocks"],
          ["JSON", "Structured extraction, API data", '{"price":"$29","tier":"Pro"}'],
          ["Plain text", "Short answers, classifications", "Positive, confidence 0.87"],
        ]} />
        <P>When using JSON, include the schema in the role: <em>"Return a JSON object with keys: name, price, features (array), verdict."</em></P>
      </Sec>
      <Sec id="ac-handoff">
        <SH>Handoff policy</SH>
        <DefList items={[
          { term: "Edges (default)", def: "Output flows to all directly connected downstream nodes. Use this for 95% of workflows." },
          { term: "Orchestrator", def: "Output always routes to the Orchestrator regardless of canvas edges." },
          { term: "Manual", def: "The LLM itself decides where to route. Advanced use for fully agentic flows." },
        ]} />
      </Sec>
      <Sec id="ac-tips">
        <SH>Design tips for multi-agent workflows</SH>
        <UL>
          <li><strong>Single responsibility.</strong> Each agent does one thing. Split research + analysis + writing into three separate agents.</li>
          <li><strong>Match model to task.</strong> Fast cheap model for extraction; powerful model for the Orchestrator.</li>
          <li><strong>Format contracts.</strong> If Agent A outputs JSON, tell Agent B's role that it will receive JSON with that specific schema.</li>
          <li><strong>Test individually first.</strong> Connect User Input directly to one agent, run it, inspect the output, then reconnect in the full pipeline.</li>
        </UL>
      </Sec>
    </>
  );
}

// ─── Page: Model Settings ─────────────────────────────────────────────────────

function PageModelSettings() {
  return (
    <>
      <PageHeader title="Model Settings" subtitle="Control which LLM each agent uses and how it generates responses." />
      <Sec id="ms-provider">
        <SH>Provider selection</SH>
        <P>Each agent has an independent provider. One workflow can use Groq for fast extraction agents, Claude for careful reasoning, and a local Ollama model for sensitive data — all in the same pipeline. If a provider has no API key, a yellow warning appears and the workflow will fail to run until the key is added.</P>
      </Sec>
      <Sec id="ms-model">
        <SH>Choosing a model</SH>
        <P>After selecting a provider, pick a model from the dropdown. The list shows only models available for that provider. See the individual provider pages (Groq, OpenAI, Anthropic, Gemini) for full model descriptions and context window sizes.</P>
      </Sec>
      <Sec id="ms-temp">
        <SH>Temperature guide</SH>
        <P>Controls output randomness. Range 0.0 – 2.0. Default 0.3.</P>
        <Table head={["Range", "Behavior", "Best for"]} rows={[
          ["0.0 – 0.2", "Near-deterministic, very consistent across runs", "Data extraction, JSON output, classification"],
          ["0.3 – 0.5", "Focused with slight variation. Default range.", "Research summaries, factual writing"],
          ["0.6 – 0.9", "More varied phrasing, occasional surprises", "General writing, explanation, Q&A"],
          ["1.0 – 2.0", "Creative, unpredictable, verbose", "Brainstorming, creative writing, ideation"],
        ]} />
        <Callout type="note">Start at 0.3 and increase only if outputs feel too repetitive or mechanical. At 1.5+ the model may go off-topic or produce inconsistent formats.</Callout>
      </Sec>
      <Sec id="ms-tokens">
        <SH>Max tokens</SH>
        <P>Limits the length of the model's response. One token ≈ 4 characters of English. Default 1024 (~750 words). Increase if outputs are getting cut off; decrease to save cost on simple tasks.</P>
        <Table head={["Task", "Suggested max tokens"]} rows={[
          ["Classification / yes-no answer", "50 – 100"],
          ["Short factual extraction", "256 – 512"],
          ["Research summary or analysis", "1,024 – 2,048"],
          ["Full report or long-form writing", "4,096+"],
          ["Orchestrator with many agent inputs", "2,048 – 4,096"],
        ]} />
      </Sec>
      <Sec id="ms-guide">
        <SH>Model decision guide</SH>
        <Table head={["Agent task", "Recommended model", "Reason"]} rows={[
          ["Extract facts from text", "Groq Llama 3.1 8B", "Fast, cheap, handles extraction well"],
          ["Analyze structured data", "Groq Llama 3.3 70B", "Strong reasoning, still fast"],
          ["Write the final report", "Claude Sonnet 4.6", "Best instruction following and prose quality"],
          ["Complex multi-step reasoning", "GPT-4o or Claude Opus 4.7", "Highest capability"],
          ["Private or sensitive data", "Local Ollama model", "Never leaves your machine"],
          ["High-volume, cost-sensitive", "Gemini 2.0 Flash", "Very cheap per token, large context"],
        ]} />
      </Sec>
    </>
  );
}

// ─── Page: API Keys Overview ──────────────────────────────────────────────────

function PageApiKeysOverview() {
  return (
    <>
      <PageHeader title="API Keys — Overview" subtitle="How keys are stored, scoped, and managed securely across projects." />
      <Sec id="ako-storage">
        <SH>How keys are stored</SH>
        <P>API keys are encrypted with AES-256-GCM before being written to the database. The encryption uses a server-side secret stored in <C>.env</C> as <C>ENCRYPTION_KEY</C>. Keys are never stored in plain text and the full key is never sent back to the browser after saving — the UI shows only a masked preview like <C>gsk_••••••••••••aBcD</C>.</P>
      </Sec>
      <Sec id="ako-scope">
        <SH>Project scope</SH>
        <P>Every API key is scoped to a specific project. Keys from Project A are never used in Project B. This lets you use separate billing accounts for dev and production, give different team members different provider access, and rotate keys for one project without affecting others.</P>
      </Sec>
      <Sec id="ako-add">
        <SH>Adding a key</SH>
        <OL>
          <li>Press <Kbd>Ctrl+K</Kbd> to open project Settings.</li>
          <li>Go to <strong>Models &amp; Providers</strong>.</li>
          <li>Find the provider and click <strong>Add key</strong>.</li>
          <li>Paste your API key and click <strong>Save</strong>.</li>
          <li>The provider immediately appears in every agent's model dropdown for this project.</li>
        </OL>
      </Sec>
      <Sec id="ako-manage">
        <SH>Managing and rotating keys</SH>
        <P>Click <strong>Reset</strong> to replace a key with a new one, or the trash icon to delete it. After deletion, any agent using that provider will fail to run until a new key is added or the agent is switched to a different provider.</P>
        <Callout type="warning">Deleting a key that active agents depend on will break your next run. Update affected agents' model settings first.</Callout>
      </Sec>
      <Sec id="ako-security">
        <SH>Security best practices</SH>
        <UL>
          <li>Generate a strong <C>ENCRYPTION_KEY</C> and keep it out of version control.</li>
          <li>Rotate API keys every 90 days or immediately after any suspected exposure.</li>
          <li>Set spending limits on OpenAI and Anthropic dashboards to cap surprise charges.</li>
          <li>Use separate API keys for development and production projects.</li>
          <li>Never commit <C>.env</C> to git — it is in <C>.gitignore</C> by default.</li>
        </UL>
      </Sec>
    </>
  );
}

// ─── Page: Groq ───────────────────────────────────────────────────────────────

function PageGroqKey() {
  return (
    <>
      <PageHeader title="Groq API Key" subtitle="Fast open-source inference — free tier available, no credit card needed." />
      <Sec id="gk-about">
        <SH>About Groq</SH>
        <P>Groq runs open-source models (Llama, Gemma, Mixtral) on custom LPU hardware, delivering 500+ tokens per second — some of the fastest inference available. It has a generous free tier making it the ideal starting point for experimenting with AgentDRIVER before spending money on other providers.</P>
      </Sec>
      <Sec id="gk-steps">
        <SH>Get your API key — step by step</SH>
        <OL>
          <li>Go to <A href="https://console.groq.com">console.groq.com</A>.</li>
          <li>Click <strong>Sign Up</strong> — register with Google or email. No credit card required.</li>
          <li>After logging in, click <strong>API Keys</strong> in the left sidebar.</li>
          <li>Click <strong>Create API Key</strong>, enter a name (e.g., <em>AgentDRIVER</em>), click <strong>Submit</strong>.</li>
          <li>Copy the key immediately — it starts with <C>gsk_</C> and is shown only once.</li>
        </OL>
        <H3>Add the key to AgentDRIVER</H3>
        <OL>
          <li>Press <Kbd>Ctrl+K</Kbd> → <strong>Models &amp; Providers</strong> → Groq row.</li>
          <li>Click <strong>Add key</strong>, paste, click <strong>Save</strong>.</li>
        </OL>
        <Callout type="tip">If you lose the key, just create a new one — Groq allows multiple keys per account.</Callout>
      </Sec>
      <Sec id="gk-models">
        <SH>Available models</SH>
        <Table head={["Model", "Context", "Best for"]} rows={[
          ["Llama 3.3 70B Versatile", "128k", "Complex reasoning, reports, Orchestrator"],
          ["Llama 3.1 8B Instant", "128k", "Ultra-fast extraction, classification"],
          ["Gemma 2 9B", "8k", "Lightweight instruction following"],
          ["Mixtral 8x7B", "32k", "Code tasks, multilingual, diverse reasoning"],
        ]} />
      </Sec>
      <Sec id="gk-limits">
        <SH>Rate limits (free tier)</SH>
        <Table head={["Limit", "Free tier"]} rows={[
          ["Requests per minute", "30"],
          ["Requests per day", "14,400"],
          ["Tokens per minute", "6,000 – 30,000 (varies by model)"],
        ]} />
        <P>If you hit RPM limits in multi-agent workflows, mix models — use 8B for some agents and 70B for others to spread load across separate rate-limit buckets.</P>
      </Sec>
      <Sec id="gk-tips">
        <SH>Best practices</SH>
        <UL>
          <li>Use <strong>Llama 3.1 8B Instant</strong> for extraction agents, <strong>Llama 3.3 70B</strong> for the Orchestrator.</li>
          <li>Keep temperature at 0.1 – 0.3 for consistent, fast responses from Groq models.</li>
          <li>Groq is ideal for development — switch to a paid provider only when you need higher quality for production.</li>
        </UL>
      </Sec>
    </>
  );
}

// ─── Page: OpenAI ─────────────────────────────────────────────────────────────

function PageOpenAIKey() {
  return (
    <>
      <PageHeader title="OpenAI API Key" subtitle="Access GPT-4o, o3-mini, and the full OpenAI model family." />
      <Sec id="ok-about">
        <SH>About the OpenAI API</SH>
        <P>OpenAI provides access to the GPT-4 family and reasoning models (o1, o3). GPT-4o is a strong all-round choice. GPT-4o Mini offers a 20x cost reduction with only moderate capability decrease, making it a good default for extraction and summarization agents.</P>
      </Sec>
      <Sec id="ok-steps">
        <SH>Get your API key — step by step</SH>
        <OL>
          <li>Go to <A href="https://platform.openai.com">platform.openai.com</A>.</li>
          <li>Sign in or create an account.</li>
          <li>Click your profile picture (top-right) → navigate to <strong>API keys</strong> in the left sidebar.</li>
          <li>Click <strong>+ Create new secret key</strong>, give it a name, click <strong>Create secret key</strong>.</li>
          <li>Copy the key — starts with <C>sk-</C>. Shown only once.</li>
        </OL>
        <H3>Add the key to AgentDRIVER</H3>
        <OL>
          <li>Press <Kbd>Ctrl+K</Kbd> → <strong>Models &amp; Providers</strong> → OpenAI row.</li>
          <li>Click <strong>Add key</strong>, paste, click <strong>Save</strong>.</li>
        </OL>
      </Sec>
      <Sec id="ok-models">
        <SH>Available models</SH>
        <Table head={["Model", "Context", "Best for"]} rows={[
          ["GPT-4o", "128k", "Best overall, complex reasoning, vision"],
          ["GPT-4o Mini", "128k", "Cost-efficient, fast extraction"],
          ["o3-mini", "200k", "Advanced multi-step reasoning"],
          ["GPT-4 Turbo", "128k", "Long context, previous-gen reliable"],
          ["GPT-3.5 Turbo", "16k", "Budget option, simple tasks only"],
        ]} />
      </Sec>
      <Sec id="ok-billing">
        <SH>Billing</SH>
        <P>OpenAI requires a funded account to use the API. Add credits at <A href="https://platform.openai.com/account/billing">platform.openai.com/account/billing</A>. Set a monthly spending limit to cap development costs. GPT-4o Mini costs roughly 20x less than GPT-4o per token — use it for all agents except the Orchestrator during development.</P>
      </Sec>
      <Sec id="ok-tips">
        <SH>Best practices</SH>
        <UL>
          <li>Set a $10–20/month spending limit during development.</li>
          <li>Use GPT-4o Mini for all agents; only upgrade the Orchestrator to GPT-4o when quality is insufficient.</li>
          <li>o3-mini uses more tokens internally — set max tokens to 4,096+ for reasoning agents.</li>
        </UL>
      </Sec>
    </>
  );
}

// ─── Page: Anthropic ──────────────────────────────────────────────────────────

function PageAnthropicKey() {
  return (
    <>
      <PageHeader title="Anthropic API Key" subtitle="Claude Opus, Sonnet, and Haiku — exceptional instruction following and analysis." />
      <Sec id="ak-about">
        <SH>About Anthropic</SH>
        <P>Anthropic's Claude models excel at precise instruction following, long coherent outputs, and complex analysis. Claude Sonnet 4.6 is particularly well-balanced — it handles complex reasoning while being faster and cheaper than Opus, making it the recommended default for Orchestrator nodes.</P>
      </Sec>
      <Sec id="ak-steps">
        <SH>Get your API key — step by step</SH>
        <OL>
          <li>Go to <A href="https://console.anthropic.com">console.anthropic.com</A>.</li>
          <li>Sign up or sign in with your email address.</li>
          <li>Click <strong>API Keys</strong> in the left sidebar.</li>
          <li>Click <strong>Create Key</strong>, enter a name (e.g., <em>AgentDRIVER</em>), confirm.</li>
          <li>Copy the key — starts with <C>sk-ant-</C>. Shown only once.</li>
        </OL>
        <H3>Add the key to AgentDRIVER</H3>
        <OL>
          <li>Press <Kbd>Ctrl+K</Kbd> → <strong>Models &amp; Providers</strong> → Anthropic row.</li>
          <li>Click <strong>Add key</strong>, paste, click <strong>Save</strong>.</li>
        </OL>
      </Sec>
      <Sec id="ak-models">
        <SH>Available models</SH>
        <Table head={["Model", "Context", "Best for"]} rows={[
          ["Claude Opus 4.7", "200k", "Most powerful, complex research and reasoning"],
          ["Claude Sonnet 4.6", "200k", "Best balance of speed, quality, and cost"],
          ["Claude Haiku 4.5", "200k", "Fast, lightweight, cost-efficient classification"],
          ["Claude 3.5 Sonnet", "200k", "Previous generation, reliable and well-tested"],
        ]} />
        <Callout type="tip">Claude Sonnet 4.6 is the recommended Orchestrator model — it handles large combined contexts from multiple agents without losing information.</Callout>
      </Sec>
      <Sec id="ak-tips">
        <SH>Best practices</SH>
        <UL>
          <li>Claude follows role descriptions very literally — be specific and precise in the Role field.</li>
          <li>Claude Haiku 4.5 is excellent for classification tasks (sentiment, category, priority) at very low cost.</li>
          <li>For JSON output, always specify the exact schema in the role description.</li>
          <li>Set spending limits at <A href="https://console.anthropic.com">console.anthropic.com</A> under Billing.</li>
        </UL>
      </Sec>
    </>
  );
}

// ─── Page: Google Gemini ──────────────────────────────────────────────────────

function PageGeminiKey() {
  return (
    <>
      <PageHeader title="Google Gemini API Key" subtitle="Gemini 2.0 Flash and 1.5 Pro — generous free tier via AI Studio." />
      <Sec id="gemk-about">
        <SH>About Google AI</SH>
        <P>Google's Gemini models are available through AI Studio with a free tier. Gemini 1.5 Pro supports a 2 million token context window — uniquely suited for workflows that need to process very large documents. Gemini 2.0 Flash is Google's fastest and most cost-effective current model.</P>
      </Sec>
      <Sec id="gemk-steps">
        <SH>Get your API key — step by step</SH>
        <OL>
          <li>Go to <A href="https://aistudio.google.com">aistudio.google.com</A>.</li>
          <li>Sign in with your Google account.</li>
          <li>Click <strong>Get API key</strong> in the left sidebar.</li>
          <li>Click <strong>Create API key</strong> and select a Google Cloud project.</li>
          <li>Copy the key — starts with <C>AIza</C>.</li>
        </OL>
        <H3>Add the key to AgentDRIVER</H3>
        <OL>
          <li>Press <Kbd>Ctrl+K</Kbd> → <strong>Models &amp; Providers</strong> → Google Gemini row.</li>
          <li>Click <strong>Add key</strong>, paste, click <strong>Save</strong>.</li>
        </OL>
      </Sec>
      <Sec id="gemk-models">
        <SH>Available models</SH>
        <Table head={["Model", "Context", "Best for"]} rows={[
          ["Gemini 2.0 Flash", "1M tokens", "Fastest Gemini, general purpose"],
          ["Gemini 1.5 Pro", "2M tokens", "Very long documents, large-scale analysis"],
          ["Gemini 1.5 Flash", "1M tokens", "Balanced speed and quality"],
        ]} />
      </Sec>
      <Sec id="gemk-free">
        <SH>Free tier</SH>
        <Table head={["Model", "Free RPM", "Free RPD"]} rows={[
          ["Gemini 2.0 Flash", "15", "1,500"],
          ["Gemini 1.5 Pro", "2", "50"],
          ["Gemini 1.5 Flash", "15", "1,500"],
        ]} />
        <P>For development and testing, Gemini 2.0 Flash on the free tier is adequate for most multi-agent workflows. The 15 RPM limit is unlikely to be hit in a typical pipeline.</P>
      </Sec>
    </>
  );
}

// ─── Page: Built-in Providers ─────────────────────────────────────────────────

function PageBuiltinProviders() {
  return (
    <>
      <PageHeader title="Built-in Providers" subtitle="Four providers ready to use after adding an API key." />
      <Sec id="bp-overview">
        <SH>Overview</SH>
        <P>AgentDRIVER ships with native integrations for Groq, OpenAI, Anthropic, and Google Gemini. Each has a dedicated SDK integration, so you only need to paste your API key — no URL configuration or request templates needed.</P>
      </Sec>
      <Sec id="bp-table">
        <SH>Provider reference</SH>
        <Table head={["Provider", "Key format", "Console"]} rows={[
          ["Groq", "gsk_...", "console.groq.com"],
          ["OpenAI", "sk-...", "platform.openai.com"],
          ["Anthropic", "sk-ant-...", "console.anthropic.com"],
          ["Google Gemini", "AIza...", "aistudio.google.com"],
        ]} />
      </Sec>
      <Sec id="bp-adding">
        <SH>Adding and removing keys</SH>
        <OL>
          <li>Press <Kbd>Ctrl+K</Kbd> → <strong>Models &amp; Providers</strong>.</li>
          <li>Click <strong>Add key</strong> next to the provider.</li>
          <li>Paste and click <strong>Save</strong>. The provider is now available across all agents in this project.</li>
        </OL>
        <P>To remove a key, click the trash icon. To rotate it, click <strong>Reset</strong> and enter the new key.</P>
      </Sec>
      <Sec id="bp-per-agent">
        <SH>Using different providers per agent</SH>
        <P>Each agent in a workflow can use a completely different provider and model. A common pattern: use Groq (fast, free) for most agents and Claude Sonnet (high quality) only for the Orchestrator. This balances cost and quality across the pipeline.</P>
        <Callout type="tip">You only need to add keys for the providers you actually use in a given project.</Callout>
      </Sec>
    </>
  );
}

// ─── Page: Custom Providers ───────────────────────────────────────────────────

function PageCustomProviders() {
  return (
    <>
      <PageHeader title="Custom Providers" subtitle="Connect any AI model beyond the four built-ins." />
      <Sec id="cp-types">
        <SH>Provider types</SH>
        <DefList items={[
          { term: "OpenAI-Compatible", def: "Any endpoint accepting the OpenAI chat completions format — Together AI, Fireworks, Perplexity, Anyscale, and similar. Provide a base URL and API key." },
          { term: "Local Model", def: "Ollama, LM Studio, or LocalAI running on your machine. No API key required. Default base URL: http://localhost:11434." },
          { term: "Custom HTTP", def: "Any REST endpoint with a custom request/response shape. You define the request body template and a dot-notation path to extract the reply." },
        ]} />
      </Sec>
      <Sec id="cp-compat">
        <SH>OpenAI-compatible providers</SH>
        <P>Hundreds of providers expose OpenAI-compatible APIs. Popular options: Together AI, Fireworks AI, Perplexity, Anyscale, Mistral AI. To add one:</P>
        <OL>
          <li>Press <Kbd>Ctrl+K</Kbd> → <strong>Models &amp; Providers</strong> → <strong>+ Add Custom Provider</strong>.</li>
          <li>Select <strong>OpenAI-Compatible</strong> and enter the provider's base URL (e.g., <C>https://api.together.xyz/v1</C>).</li>
          <li>Click <strong>Auto-discover</strong> to fetch available models from <C>/v1/models</C>, or add model IDs manually.</li>
          <li>Enter the API key and click <strong>Test Connection</strong>.</li>
          <li>Click <strong>Add Provider</strong>.</li>
        </OL>
      </Sec>
      <Sec id="cp-local">
        <SH>Local endpoints</SH>
        <P>Connect to Ollama or LM Studio running on your machine. Type: <strong>Local Model</strong>, base URL: <C>http://localhost:11434</C> (Ollama default). Use Auto-discover to import all downloaded models. No API key needed.</P>
      </Sec>
      <Sec id="cp-http">
        <SH>Custom HTTP providers</SH>
        <P>For endpoints with non-standard request formats, use Custom HTTP. Define the request body as a JSON template using these placeholders:</P>
        <Table head={["Placeholder", "Value injected"]} rows={[
          ["{{messages}}", "Chat messages array"],
          ["{{model}}", "Model ID string"],
          ["{{maxTokens}}", "Max tokens number"],
          ["{{temperature}}", "Temperature float"],
        ]} />
        <P>Set the response path using dot notation — e.g., <C>choices.0.message.content</C> for OpenAI-style responses.</P>
      </Sec>
      <Sec id="cp-add">
        <SH>Adding and testing a custom provider</SH>
        <OL>
          <li><Kbd>Ctrl+K</Kbd> → <strong>Models &amp; Providers</strong> → <strong>+ Add Custom Provider</strong>.</li>
          <li>Select type, enter base URL, add models.</li>
          <li>Enter API key if required.</li>
          <li>Click <strong>Test Connection</strong> — a success message confirms the endpoint is reachable.</li>
          <li>Click <strong>Add Provider</strong>. It appears immediately in all agent model dropdowns.</li>
        </OL>
      </Sec>
    </>
  );
}

// ─── Page: Local Models ───────────────────────────────────────────────────────

function PageLocalModels() {
  return (
    <>
      <PageHeader title="Local Models" subtitle="Run models on your own hardware — no API costs, complete privacy." />
      <Sec id="lm-why">
        <SH>Why use local models</SH>
        <UL>
          <li><strong>Privacy</strong> — data never leaves your machine. Essential for sensitive documents.</li>
          <li><strong>Cost</strong> — no per-token charges. Ideal for high-volume development workflows.</li>
          <li><strong>Offline</strong> — works without internet access.</li>
          <li><strong>Customization</strong> — run fine-tuned models not available from cloud providers.</li>
        </UL>
      </Sec>
      <Sec id="lm-ollama">
        <SH>Ollama setup</SH>
        <OL>
          <li>Download Ollama from <A href="https://ollama.com">ollama.com</A> and install it.</li>
          <li>Pull a model in your terminal: <C>ollama pull llama3.2</C></li>
          <li>Ollama automatically starts a local server at <C>http://localhost:11434</C>.</li>
        </OL>
        <P>Popular models to try: <C>llama3.2</C> (3B, fast), <C>llama3.1:8b</C> (good quality), <C>mistral</C> (code-friendly), <C>gemma2:9b</C> (balanced).</P>
      </Sec>
      <Sec id="lm-lmstudio">
        <SH>LM Studio</SH>
        <OL>
          <li>Download from <A href="https://lmstudio.ai">lmstudio.ai</A> and install.</li>
          <li>Open the <strong>Discover</strong> tab and download a model (GGUF format).</li>
          <li>Go to the <strong>Local Server</strong> tab and click <strong>Start Server</strong>. Default port: 1234.</li>
          <li>Use <C>http://localhost:1234</C> as the base URL when adding in AgentDRIVER.</li>
        </OL>
      </Sec>
      <Sec id="lm-connect">
        <SH>Connecting to AgentDRIVER</SH>
        <OL>
          <li><Kbd>Ctrl+K</Kbd> → <strong>Models &amp; Providers</strong> → <strong>+ Add Custom Provider</strong>.</li>
          <li>Type: <strong>Local Model</strong>. Base URL: <C>http://localhost:11434</C>.</li>
          <li>Click <strong>Auto-discover</strong> to import all downloaded models.</li>
          <li>Click <strong>Add Provider</strong>. No API key needed.</li>
        </OL>
      </Sec>
      <Sec id="lm-perf">
        <SH>Performance tips</SH>
        <UL>
          <li>Models under 7B run well on most modern laptops (8 GB+ RAM).</li>
          <li>7B–13B models need 16 GB RAM or a dedicated GPU for acceptable speed.</li>
          <li>70B+ models require 32 GB+ RAM or VRAM — typically only practical on high-end workstations.</li>
          <li>Use quantized models (Q4_K_M) for a good quality/speed tradeoff on consumer hardware.</li>
        </UL>
      </Sec>
    </>
  );
}

// ─── Page: Built-in Tools ─────────────────────────────────────────────────────

function PageBuiltinTools() {
  return (
    <>
      <PageHeader title="Built-in Tools" subtitle="Give agents web search, Wikipedia lookup, calculations, and JSON parsing — out of the box." />
      <Sec id="bt-how">
        <SH>How tools work</SH>
        <P>Tools give agents the ability to take actions beyond pure text generation. When an agent has tools attached, it can call them during its response — for example, searching the web for a fact before writing its analysis. The LLM decides when and how to call tools based on the task and available tool names.</P>
        <P>All tools run in an isolated Docker container that starts automatically before the first agent executes. The container is destroyed when the run finishes. Nothing persists between runs.</P>
        <Callout type="note">Docker Desktop must be installed and running on your machine for any tools to work. Workflows with no tools skip the sandbox entirely.</Callout>
      </Sec>
      <Sec id="bt-list">
        <SH>Available tools</SH>
        <DefList items={[
          { term: "DuckDuckGo Search", def: "Web search via DuckDuckGo. Returns result titles, URLs, and snippets. Best for real-time information the model wasn't trained on — current events, recent product launches, live pricing." },
          { term: "Wikipedia", def: "Fetches article summaries from Wikipedia by title. Returns the intro paragraph and key facts. Best for background information on well-known topics." },
          { term: "Calculator", def: "Evaluates mathematical expressions. Handles arithmetic, exponents, percentages, and basic algebra. Returns the numeric result. Eliminates hallucinated math." },
          { term: "JSON Get Value", def: "Extracts a nested value from a JSON string using a dot-notation key path (e.g., 'user.address.city'). Useful when an upstream agent outputs JSON that a downstream agent needs to read." },
        ]} />
      </Sec>
      <Sec id="bt-add">
        <SH>Adding a tool to an agent</SH>
        <OL>
          <li>Click an Agent node on the canvas.</li>
          <li>In the right panel, open the <strong>Tools</strong> tab.</li>
          <li>Search for a tool by name and click it to add.</li>
          <li>The tool node appears on the canvas attached to the agent.</li>
          <li>On the next run, the Docker sandbox starts and the tool is available to the LLM.</li>
        </OL>
      </Sec>
      <Sec id="bt-flow">
        <SH>Execution flow with tools</SH>
        <P>When an agent with tools runs:</P>
        <OL>
          <li>The LLM receives its prompt and the list of available tool names and descriptions.</li>
          <li>The LLM decides whether to call a tool. If yes, it outputs a structured tool call.</li>
          <li>The execution engine intercepts the call, runs the tool in the Docker sandbox, and returns the result to the LLM.</li>
          <li>The LLM incorporates the tool result into its final response.</li>
          <li>This loop can repeat multiple times if the LLM needs to call several tools.</li>
        </OL>
        <P>Each tool call is logged in the terminal — you can see the exact input sent to the tool, the output returned, and the execution time.</P>
      </Sec>
    </>
  );
}

// ─── Page: Custom Python Tools ────────────────────────────────────────────────

function PageCustomTools() {
  return (
    <>
      <PageHeader title="Custom Python Tools" subtitle="Write arbitrary Python functions as agent tools, run them in the isolated sandbox." />
      <Sec id="ct-when">
        <SH>When to write custom tools</SH>
        <P>Write a custom tool when built-in tools don't cover your use case: calling an internal API, scraping a specific website, reading a file, querying a database, running a calculation with custom logic, or integrating with a third-party service. Any Python code that accepts a string input and returns a string output can become a tool.</P>
      </Sec>
      <Sec id="ct-contract">
        <SH>Function contract</SH>
        <P>Every custom tool must follow this contract:</P>
        <CodeBlock>{`def tool_name(input: str) -> str:
    # input  — the string the LLM passed to the tool
    # return — the string result sent back to the LLM
    ...`}</CodeBlock>
        <UL>
          <li><strong>Name:</strong> Use snake_case. This exact name is what the LLM calls. Make it descriptive: <C>search_web</C>, <C>get_stock_price</C>, <C>query_database</C>.</li>
          <li><strong>Input:</strong> Always <C>str</C>. The LLM passes its decision as a single string.</li>
          <li><strong>Return:</strong> Always <C>str</C>. The string is fed back to the LLM as the tool result.</li>
        </UL>
        <Callout type="tip">Keep tool names short and descriptive — the LLM decides when to call them based on the name alone. Good: <C>fetch_stock_price</C>. Avoid: <C>my_custom_function_v2</C>.</Callout>
      </Sec>
      <Sec id="ct-ex1">
        <SH>Example: stock price lookup</SH>
        <CodeBlock>{`import requests

def get_stock_price(input: str) -> str:
    ticker = input.strip().upper()
    resp = requests.get(
        f"https://query1.finance.yahoo.com/v8/finance/chart/{ticker}"
    )
    data = resp.json()
    price = data["chart"]["result"][0]["meta"]["regularMarketPrice"]
    return f"{ticker}: \${price:.2f}"`}</CodeBlock>
      </Sec>
      <Sec id="ct-ex2">
        <SH>Example: webpage text extractor</SH>
        <CodeBlock>{`import requests
from bs4 import BeautifulSoup

def extract_page_text(input: str) -> str:
    # input is a URL
    resp = requests.get(input, timeout=10, headers={"User-Agent": "Mozilla/5.0"})
    soup = BeautifulSoup(resp.text, "html.parser")
    # Remove scripts and styles
    for tag in soup(["script", "style"]):
        tag.decompose()
    text = soup.get_text(separator=" ", strip=True)
    return text[:4000]  # Limit to 4000 chars for LLM context`}</CodeBlock>
      </Sec>
      <Sec id="ct-ex3">
        <SH>Example: currency conversion</SH>
        <CodeBlock>{`import requests

def convert_currency(input: str) -> str:
    # input format: "100 USD to EUR"
    parts = input.strip().split()
    amount, from_cur, _, to_cur = parts[0], parts[1], parts[2], parts[3]
    resp = requests.get(
        f"https://api.frankfurter.app/latest?amount={amount}&from={from_cur}&to={to_cur}"
    )
    data = resp.json()
    result = data["rates"][to_cur.upper()]
    return f"{amount} {from_cur.upper()} = {result:.2f} {to_cur.upper()}"`}</CodeBlock>
      </Sec>
      <Sec id="ct-pkgs">
        <SH>Installing packages</SH>
        <P>Any pip package can be imported. If it is not pre-installed in the sandbox base image, it will be installed during the bootstrap phase before the first agent runs. Simply import it at the top of your tool function:</P>
        <CodeBlock>{`from bs4 import BeautifulSoup   # pip installs beautifulsoup4
import pandas as pd              # pip installs pandas
import numpy as np               # pip installs numpy`}</CodeBlock>
        <P>Bootstrap progress is shown in the terminal. If a package fails to install, the run stops with an error showing the pip output.</P>
      </Sec>
    </>
  );
}

// ─── Page: Custom HTTP Tools ──────────────────────────────────────────────────

function PageCustomHttpTools() {
  return (
    <>
      <PageHeader title="Custom HTTP Tools" subtitle="Call any external REST API as a tool — no Python required." />
      <Sec id="cht-overview">
        <SH>Overview</SH>
        <P>Custom HTTP tools let an agent call any REST endpoint directly. You configure the request template and the response extraction path. This is ideal for webhooks, internal APIs, or third-party services with simple JSON interfaces where writing Python would be overkill.</P>
      </Sec>
      <Sec id="cht-create">
        <SH>Creating a custom HTTP tool</SH>
        <OL>
          <li>Click an Agent node → <strong>Tools</strong> tab → <strong>Add Custom Tool</strong> → select type <strong>HTTP</strong>.</li>
          <li>Enter a tool name and the target URL.</li>
          <li>Choose the HTTP method (GET, POST, PUT).</li>
          <li>Write the request body as a JSON template — use <C>{"{{input}}"}</C> where the LLM's input string should be injected.</li>
          <li>Set the response path using dot notation pointing to the text field in the JSON response.</li>
          <li>Add any required HTTP headers (Authorization, Content-Type, etc.).</li>
        </OL>
      </Sec>
      <Sec id="cht-placeholders">
        <SH>Request template placeholders</SH>
        <Table head={["Placeholder", "Injected value"]} rows={[
          ["{{input}}", "The string the LLM passed as the tool input"],
          ["{{model}}", "The agent's model ID"],
          ["{{temperature}}", "The agent's temperature setting"],
        ]} />
      </Sec>
      <Sec id="cht-auth">
        <SH>Authentication</SH>
        <P>Add authentication in the Headers section. Common patterns:</P>
        <Table head={["Auth type", "Header name", "Header value"]} rows={[
          ["Bearer token", "Authorization", "Bearer YOUR_TOKEN"],
          ["API key header", "X-API-Key", "YOUR_API_KEY"],
          ["Basic auth", "Authorization", "Basic BASE64_CREDENTIALS"],
        ]} />
      </Sec>
      <Sec id="cht-example">
        <SH>Full example: sentiment analysis API</SH>
        <DefList items={[
          { term: "URL", def: "https://api.example.com/sentiment" },
          { term: "Method", def: "POST" },
          { term: "Body template", def: '{ "text": "{{input}}", "language": "en" }' },
          { term: "Response path", def: "result.sentiment_label" },
          { term: "Headers", def: "Authorization: Bearer sk_live_xxxxx" },
        ]} />
        <P>The LLM calls <C>sentiment_analysis("The product exceeded my expectations")</C> and receives back <C>"positive"</C> — which it incorporates into its response.</P>
      </Sec>
    </>
  );
}

// ─── Page: Running a Workflow ─────────────────────────────────────────────────

function PageRunning() {
  return (
    <>
      <PageHeader title="Running a Workflow" subtitle="Execute your canvas graph against a task and read the results." />
      <Sec id="run-checklist">
        <SH>Pre-run checklist</SH>
        <UL>
          <li>Every agent has a provider with a valid API key — no yellow warnings in the Model tab.</li>
          <li>The workflow has exactly one User Input node and one Orchestrator node.</li>
          <li>All agents are connected to the graph — no isolated floating nodes.</li>
          <li>If any agent uses tools: Docker Desktop is installed and running.</li>
        </UL>
      </Sec>
      <Sec id="run-start">
        <SH>Starting a run</SH>
        <OL>
          <li>Click <strong>Run</strong> in the header, or press <Kbd>Ctrl+Enter</Kbd>.</li>
          <li>A dialog appears — type your task. This is the input to the User Input node.</li>
          <li>Click <strong>Run</strong> to start execution.</li>
          <li>The terminal panel opens at the bottom of the canvas.</li>
        </OL>
        <P>To abort a run, click the <strong>Running…</strong> button (it replaces Run during execution). This terminates the stream and stops the Docker sandbox container.</P>
      </Sec>
      <Sec id="run-phases">
        <SH>Execution phases</SH>
        <OL>
          <li><strong>Bootstrap</strong> (only when tools exist) — Docker starts and pip installs any required packages. Progress streams to the terminal in real time.</li>
          <li><strong>Agent execution</strong> — agents run in topological order. Each receives context from upstream nodes and generates a response. A pulsing yellow badge shows which agent is currently running.</li>
          <li><strong>Orchestrator synthesis</strong> — receives all agent outputs and generates the final answer.</li>
          <li><strong>Output display</strong> — the Final Output node receives the result; it appears under <strong>final output</strong> in the terminal.</li>
        </OL>
      </Sec>
      <Sec id="run-debug">
        <SH>Debugging failed runs</SH>
        <P>When a run fails, the terminal shows a red error card. Common causes and fixes:</P>
        <Table head={["Error", "Cause", "Fix"]} rows={[
          ["Missing API key", "Provider has no key set", "Ctrl+K → Models & Providers → Add key"],
          ["Bootstrap failed", "pip package install error", "Check package name; try a simpler version constraint"],
          ["Docker not found", "Docker Desktop not running", "Start Docker Desktop and re-run"],
          ["Context too long", "Too many agents' outputs for model's context window", "Reduce max tokens per agent or use a model with larger context"],
          ["Rate limit hit", "Too many API calls per minute", "Add a delay between agents or switch to a provider with higher limits"],
          ["Tool call timed out", "Tool ran longer than 35 seconds", "Optimize the tool code or add a shorter timeout"],
        ]} />
      </Sec>
      <Sec id="run-tips">
        <SH>Optimization tips</SH>
        <UL>
          <li><strong>Use fast models for simple agents.</strong> Groq Llama 8B for extraction agents saves seconds per run.</li>
          <li><strong>Reduce max tokens.</strong> If an agent only needs to output a classification label, set max tokens to 50.</li>
          <li><strong>Trim agent outputs.</strong> Add "Be concise, maximum 200 words" to role descriptions to prevent downstream context bloat.</li>
          <li><strong>Test without tools first.</strong> Tool bootstrap adds 5–15 seconds. Verify the core pipeline works before adding tools.</li>
          <li><strong>Clear previous output.</strong> Click the trash icon in the terminal header before each run to keep logs readable.</li>
        </UL>
      </Sec>
    </>
  );
}

// ─── Page: Output Terminal ────────────────────────────────────────────────────

function PageOutputTerminal() {
  return (
    <>
      <PageHeader title="Output Terminal" subtitle="Read execution logs, inspect every tool call, and copy the final answer." />
      <Sec id="ot-open">
        <SH>Opening and closing</SH>
        <P>The terminal panel sits at the bottom of the canvas. Toggle it with <Kbd>Ctrl+`</Kbd> or click the terminal icon in the canvas toolbar. It opens automatically when a run starts. Drag the top border to resize the panel height (range: 120 px – 520 px).</P>
      </Sec>
      <Sec id="ot-tabs">
        <SH>Terminal tabs</SH>
        <DefList items={[
          { term: "TERMINAL", def: "Main view: bootstrap progress, agent step cards, tool call details, and final output — in execution order. This is where you watch the workflow run in real time." },
          { term: "OUTPUT", def: "Shows only the final answer from the Orchestrator, plus a copy button. Use this after the run finishes to extract just the result without the execution noise." },
        ]} />
      </Sec>
      <Sec id="ot-bootstrap">
        <SH>Bootstrap phase</SH>
        <P>If any agent has tools, the terminal shows bootstrap progress first — before any agent runs. Each pip package install step streams in real time:</P>
        <UL>
          <li>A pulsing package icon means installation is in progress.</li>
          <li>A green checkmark means all dependencies are ready.</li>
          <li>A red X with error text means a package failed to install — the run stops here.</li>
        </UL>
        <P>Subsequent runs are faster because the sandbox image caches installed packages until the container is rebuilt.</P>
      </Sec>
      <Sec id="ot-cards">
        <SH>Agent step cards</SH>
        <P>Each agent that runs produces a card in the TERMINAL tab showing:</P>
        <UL>
          <li><strong>Agent name and step number</strong> — e.g., <C>[01] Research Agent</C>.</li>
          <li><strong>Status badge</strong> — running (yellow), completed (green), failed (red).</li>
          <li><strong>Execution time</strong> — shown after the agent finishes.</li>
          <li><strong>Input context</strong> — the combined input the agent received from upstream nodes.</li>
          <li><strong>Output</strong> — the agent's full text response.</li>
          <li><strong>Tool calls</strong> (if any) — expandable list showing call ID, tool name, input string, output string, and execution time for each call.</li>
        </UL>
      </Sec>
      <Sec id="ot-filter">
        <SH>Filtering and copying</SH>
        <P>When a workflow has more than one agent, an agent filter dropdown appears at the top of the TERMINAL tab. Select a specific agent to show only its step cards — useful in large workflows with many agents.</P>
        <P>The final output section has a <strong>copy</strong> button. Click it to copy the Orchestrator's complete response to the clipboard. Alternatively, switch to the OUTPUT tab which shows only the final answer.</P>
      </Sec>
    </>
  );
}

// ─── Page: Docker Sandbox ─────────────────────────────────────────────────────

function PageDockerSandbox() {
  return (
    <>
      <PageHeader title="Docker Sandbox" subtitle="An isolated container that runs tool code safely and is destroyed after each run." />
      <Sec id="ds-what">
        <SH>What is the sandbox</SH>
        <P>When any agent in a workflow has tools attached, AgentDRIVER starts a temporary Docker container before execution begins. All tool code — built-in and custom Python — runs inside this container. When the run finishes, the container is destroyed. No files, state, or installed packages persist between runs (the base image is reused, but the runtime environment is fresh each time).</P>
      </Sec>
      <Sec id="ds-req">
        <SH>Requirements</SH>
        <UL>
          <li><strong>Docker Desktop</strong> must be installed and running. Download from <A href="https://www.docker.com/products/docker-desktop">docker.com</A>.</li>
          <li>The first run pulls the sandbox image <C>driverdirect/tool-sandbox:latest</C> from Docker Hub — a one-time download.</li>
          <li>Workflows with no tools skip the sandbox entirely — Docker is not needed.</li>
        </UL>
      </Sec>
      <Sec id="ds-specs">
        <SH>Container specifications</SH>
        <Table head={["Spec", "Value"]} rows={[
          ["Memory limit", "256 MB"],
          ["CPU limit", "0.5 vCPU"],
          ["Temporary storage", "64 MB tmpfs (in-memory, not persisted)"],
          ["Network during bootstrap", "Internet access (for pip installs)"],
          ["Network during execution", "Isolated (no outbound except explicit HTTP tool calls)"],
          ["Tool call timeout", "35 seconds"],
          ["Bootstrap timeout", "120 seconds"],
        ]} />
      </Sec>
      <Sec id="ds-bootstrap">
        <SH>Bootstrap phase</SH>
        <P>Before any agent runs, the sandbox installs all pip packages required by custom Python tools. Progress streams to the terminal in real time. If a package fails, the run stops at this stage and the pip error output is shown.</P>
        <P>Subsequent runs with the same packages skip reinstallation if the sandbox container is reused. A fresh container is started for each new workflow run.</P>
      </Sec>
      <Sec id="ds-security">
        <SH>Security model</SH>
        <P>The sandbox provides defense-in-depth isolation:</P>
        <UL>
          <li>Container runs as a non-root user.</li>
          <li>Memory and CPU are strictly limited to prevent resource exhaustion.</li>
          <li>Network access is restricted during execution — only explicit HTTP tool calls go out.</li>
          <li>Each run gets a fresh container — no cross-run data leakage.</li>
          <li>tmpfs storage is in-memory only — nothing is written to the host filesystem.</li>
        </UL>
      </Sec>
    </>
  );
}

// ─── Page: Code View ──────────────────────────────────────────────────────────

function PageCodeView() {
  return (
    <>
      <PageHeader title="Code View" subtitle="Inspect your workflow as a Mermaid diagram or raw JSON." />
      <Sec id="cv-open">
        <SH>Opening Code View</SH>
        <P>Click the <strong>Code</strong> tab in the workspace tab bar above the canvas. The tab stays open until you explicitly close it — switching to the Workflow tab does not close it. This lets you reference the diagram while editing the canvas.</P>
      </Sec>
      <Sec id="cv-mermaid">
        <SH>Mermaid tab</SH>
        <P>Shows your workflow as a Mermaid graph syntax diagram that updates automatically as you add, remove, or rename nodes. The diagram reflects the exact connections on the canvas.</P>
        <P>Use the copy button to paste the diagram into any Mermaid-compatible tool:</P>
        <UL>
          <li><A href="https://mermaid.live">mermaid.live</A> — online editor with live preview.</li>
          <li>GitHub Markdown — paste in a <C>```mermaid</C> block to render it in READMEs and PRs.</li>
          <li>Notion, Confluence, GitLab — all support inline Mermaid diagrams.</li>
        </UL>
      </Sec>
      <Sec id="cv-json">
        <SH>JSON tab</SH>
        <P>Shows the raw workflow definition as JSON — the exact structure sent to the backend when you run. Includes every node with its full configuration (model, role, tools, settings) and every edge. Use the copy button to export this for sharing or backup.</P>
      </Sec>
      <Sec id="cv-export">
        <SH>Export and share</SH>
        <P>To share a workflow with a teammate:</P>
        <OL>
          <li>Open Code View → JSON tab → click <strong>copy</strong>.</li>
          <li>Send the JSON to your teammate.</li>
          <li>They open AgentDRIVER → <strong>File → Import JSON</strong> → paste the JSON.</li>
          <li>The workflow is imported as a new project with all node configurations intact.</li>
        </OL>
        <P>Alternatively, use <strong>File → Export JSON</strong> to download it as a <C>.json</C> file.</P>
      </Sec>
    </>
  );
}

// ─── Page: Chat Panel ─────────────────────────────────────────────────────────

function PageChatPanel() {
  return (
    <>
      <PageHeader title="Chat Panel" subtitle="A side-by-side conversation panel for discussing and annotating your workflow." />
      <Sec id="cp2-open">
        <SH>Opening the panel</SH>
        <P>Press <Kbd>Ctrl+Shift+K</Kbd> or click the Chat icon in the left activity bar. The panel opens alongside the canvas. Press the same shortcut again or click the icon to close it.</P>
      </Sec>
      <Sec id="cp2-messages">
        <SH>Sending messages</SH>
        <OL>
          <li>Type in the input box at the bottom of the panel.</li>
          <li>Press <Kbd>Enter</Kbd> to send, or <Kbd>Shift+Enter</Kbd> for a line break.</li>
          <li>The input box grows automatically as you type.</li>
        </OL>
        <P>Messages are rendered with full Markdown support — code blocks, headers, tables, and bullet lists display correctly. The panel auto-scrolls to the latest message.</P>
      </Sec>
      <Sec id="cp2-attach">
        <SH>File attachments</SH>
        <P>Click the paperclip icon to attach files to a message. Supported types include text files (.txt, .md, .csv) and images (.png, .jpg). Attachments are included as context alongside the message text.</P>
      </Sec>
      <Sec id="cp2-usecases">
        <SH>Use cases</SH>
        <UL>
          <li><strong>Design notes</strong> — document why you chose a specific agent configuration or model.</li>
          <li><strong>Reference material</strong> — attach a document that agents should reference during development.</li>
          <li><strong>Team communication</strong> — leave notes for teammates about the workflow's intent.</li>
          <li><strong>Debugging scratchpad</strong> — paste problematic outputs and analyze them before adjusting agent roles.</li>
        </UL>
        <Callout type="note">The Chat panel is not connected to the workflow execution engine. Messages do not feed into agent runs — it is purely a human collaboration and note-taking tool.</Callout>
      </Sec>
    </>
  );
}

// ─── Page: Project Explorer ───────────────────────────────────────────────────

function PageProjectExplorer() {
  return (
    <>
      <PageHeader title="Project Explorer" subtitle="Browse and manage all projects and their workflows from the left sidebar." />
      <Sec id="pe-open">
        <SH>Opening the explorer</SH>
        <P>Press <Kbd>Ctrl+B</Kbd> or click the Explorer icon in the left activity bar. The panel shows a tree of all projects. Press the same shortcut to close it.</P>
      </Sec>
      <Sec id="pe-tree">
        <SH>Project tree</SH>
        <P>Each project appears as a collapsible row. Expand a project to see its list of workflows. The currently active workflow is highlighted. A dot indicator shows whether a project has unsaved changes (though auto-save means this is rarely visible for more than 1.5 seconds).</P>
      </Sec>
      <Sec id="pe-switch">
        <SH>Switching workflows</SH>
        <P>Click any workflow name in the tree to switch to it. The canvas, terminal output, and right panel all update to reflect the selected workflow. The previous workflow is auto-saved before switching.</P>
      </Sec>
      <Sec id="pe-create">
        <SH>Creating new workflows</SH>
        <OL>
          <li>Expand a project in the tree.</li>
          <li>Click the <strong>+</strong> button next to the project name.</li>
          <li>Type a name for the new workflow and press <Kbd>Enter</Kbd>.</li>
          <li>The new workflow opens with a default four-node canvas.</li>
        </OL>
        <P>You can have unlimited workflows per project. Use multiple workflows to experiment with different agent configurations for the same overall task, or to build separate pipelines that belong to the same project context.</P>
      </Sec>
    </>
  );
}

// ─── Page: Command Palette ────────────────────────────────────────────────────

function PageCommandPalette() {
  return (
    <>
      <PageHeader title="Command Palette" subtitle="Run any action in the app by name — keyboard-first navigation." />
      <Sec id="cmd-open">
        <SH>Opening the palette</SH>
        <P>Press <Kbd>Ctrl+Shift+P</Kbd> or click the search box in the header. Start typing to filter commands. Press <Kbd>Enter</Kbd> to execute the highlighted command, or click it. Press <Kbd>Escape</Kbd> to close without running a command.</P>
      </Sec>
      <Sec id="cmd-list">
        <SH>Available commands</SH>
        <Table head={["Command", "Action"]} rows={[
          ["New Project", "Create a new project (Ctrl+Shift+N)"],
          ["Save Project", "Force-save the current workflow"],
          ["Import JSON", "Import a workflow from a JSON file"],
          ["Export JSON", "Export the current workflow as JSON"],
          ["Run Workflow", "Start execution (Ctrl+Enter)"],
          ["Open Settings", "Open project settings (Ctrl+K)"],
          ["Toggle Explorer", "Show/hide the project explorer (Ctrl+B)"],
          ["Toggle Chat", "Show/hide the chat panel (Ctrl+Shift+K)"],
          ["Toggle Terminal", "Show/hide the output terminal (Ctrl+`)"],
          ["Add Agent", "Add an Agent node to the canvas"],
          ["Add Orchestrator", "Add an Orchestrator node"],
          ["Add User Input", "Add a User Input node"],
          ["Add Output", "Add a Final Output node"],
          ["Duplicate Node", "Duplicate the selected node (Ctrl+D)"],
          ["Delete Node", "Delete the selected node (Delete)"],
          ["Auto Layout", "Rearrange all nodes (Ctrl+Shift+L)"],
          ["Open Docs", "Open this documentation (F1)"],
        ]} />
      </Sec>
      <Sec id="cmd-tips">
        <SH>Power user tips</SH>
        <UL>
          <li>The palette supports fuzzy matching — type <em>new</em> to find New Project, or <em>tog</em> to find all Toggle commands.</li>
          <li>After learning the keyboard shortcuts, you can skip the palette entirely — but it's the fastest way to discover and run actions you haven't memorized yet.</li>
          <li>The palette also searches project names — type part of a project name to switch to it directly.</li>
        </UL>
      </Sec>
    </>
  );
}

// ─── Page: Project Management ─────────────────────────────────────────────────

function PageProjects() {
  return (
    <>
      <PageHeader title="Project Management" subtitle="Projects are independent workspaces — each with its own canvas, agents, and API keys." />
      <Sec id="proj-basics">
        <SH>Project basics</SH>
        <P>A project contains one or more workflows, a set of project-level settings (default model, execution constraints, safety instructions), and provider API keys scoped to that project. Two projects never share keys or execution state.</P>
      </Sec>
      <Sec id="proj-ops">
        <SH>Operations</SH>
        <Table head={["Action", "How"]} rows={[
          ["New project", "File → New Project or Ctrl+Shift+N"],
          ["Switch project", "Click the project dropdown in the header, or use the Project Explorer"],
          ["Rename project", "Settings (Ctrl+K) → General → edit the Project name field"],
          ["Save", "Auto-saves 1.5s after every change; force-save with Ctrl+S"],
          ["Import JSON", "File → Import JSON — loads the workflow into a new project"],
          ["Export JSON", "File → Export JSON — downloads the full workflow definition"],
          ["Delete project", "Hover the project in the header dropdown → trash icon, or Settings → Danger Zone"],
        ]} />
      </Sec>
      <Sec id="proj-workflows">
        <SH>Multiple workflows per project</SH>
        <P>Each project can contain multiple named workflows. Use this to keep related experiments together — for example, a "Customer Support Bot" project with workflows for different conversation styles or different model configurations. Switch between workflows in the Project Explorer without losing any work.</P>
        <P>Manage workflows in Settings → Workflows: create, rename, duplicate, set as default, or delete.</P>
      </Sec>
      <Sec id="proj-io">
        <SH>Import and export</SH>
        <P>Export a workflow as JSON to back it up, share it with teammates, or move it to a different environment. The exported JSON includes all nodes (with full configuration), edges, and project settings. Import it with File → Import JSON.</P>
        <Callout type="note">Exported JSON does not include API keys — keys are never exported for security reasons. The recipient will need to add their own keys after importing.</Callout>
      </Sec>
    </>
  );
}

// ─── Page: Settings Reference ─────────────────────────────────────────────────

function PageSettingsReference() {
  return (
    <>
      <PageHeader title="Settings Reference" subtitle="Every settings section explained. Open with Ctrl+K." />
      <Sec id="sr-general">
        <SH>General</SH>
        <P>Project name, description, builder target, and layout preset.</P>
        <P><strong>Builder target</strong> determines how the backend translates your canvas graph into executable code: <strong>LangGraph</strong> (stateful agent graphs), <strong>LangChain</strong> (sequential chain execution), or <strong>Python</strong> (raw Python scripts). LangGraph is recommended for most workflows.</P>
      </Sec>
      <Sec id="sr-workflows">
        <SH>Workflows</SH>
        <P>Lists all workflows in the project. Create new ones, rename existing ones, duplicate a workflow (copies all nodes and configuration), set a default workflow that opens when the project is loaded, or delete workflows you no longer need.</P>
      </Sec>
      <Sec id="sr-models">
        <SH>Models &amp; Providers</SH>
        <P>Set the project-default model, provider, temperature, and max tokens. These defaults are used when creating new agent nodes. Also where you add, view, and remove API keys for all built-in providers and custom providers.</P>
      </Sec>
      <Sec id="sr-execution">
        <SH>Execution</SH>
        <DefList items={[
          { term: "Max agent steps", def: "Maximum number of LLM calls per agent per run. Prevents infinite loops in agentic workflows." },
          { term: "Handoff policy", def: "Project-wide default for how agent outputs route to downstream nodes. Individual agents can override this." },
          { term: "Retry on failure", def: "Whether to automatically retry a failed agent step once before marking the run as failed." },
          { term: "Run timeout", def: "Maximum total wall-clock time for a workflow run before it is forcefully terminated." },
        ]} />
      </Sec>
      <Sec id="sr-outputs">
        <SH>Outputs</SH>
        <P>Default output format (Markdown, JSON, or plain text) for new agent nodes. Whether to include timestamps in the terminal log. Artifact settings for saving run outputs to files.</P>
      </Sec>
      <Sec id="sr-safety">
        <SH>Safety</SH>
        <P>Safety instructions that are injected into every agent's system prompt in this project. Useful for adding project-wide constraints like "Never reveal confidential information" or "Always cite sources." Also configure the default reviewer agent and whether deleting nodes requires confirmation.</P>
      </Sec>
      <Sec id="sr-advanced">
        <SH>Advanced and Danger Zone</SH>
        <P><strong>Advanced</strong> shows a read-only view of the raw workflow JSON schema and project metadata — useful for debugging unexpected behavior.</P>
        <P><strong>Danger Zone</strong> has two irreversible actions: <strong>Reset project</strong> (clears all workflows and returns to the default four-node canvas) and <strong>Delete project</strong> (permanently removes the project and all its data).</P>
        <Callout type="warning">Both Danger Zone actions are permanent and cannot be undone. Export your workflow JSON before using either.</Callout>
      </Sec>
    </>
  );
}

// ─── Page: Keyboard Shortcuts ─────────────────────────────────────────────────

function PageShortcuts() {
  return (
    <>
      <PageHeader title="Keyboard Shortcuts" subtitle="Full shortcut reference — also available in Settings → Shortcuts." />
      <Sec id="sh-global">
        <SH>Global shortcuts</SH>
        <Table head={["Shortcut", "Action"]} rows={[
          ["Ctrl+Enter", "Run workflow"],
          ["Ctrl+S", "Force-save project"],
          ["Ctrl+Shift+P", "Open command palette"],
          ["Ctrl+Shift+N", "New project"],
          ["Ctrl+K", "Open project settings"],
          ["F1", "Open documentation"],
          ["Ctrl+B", "Toggle Explorer panel"],
          ["Ctrl+Shift+K", "Toggle Chat panel"],
          ["Ctrl+`", "Toggle output terminal"],
        ]} />
      </Sec>
      <Sec id="sh-canvas">
        <SH>Canvas shortcuts</SH>
        <Table head={["Shortcut", "Action"]} rows={[
          ["Ctrl+Shift+L", "Auto-layout all nodes"],
          ["Ctrl+Z", "Undo last workflow change"],
          ["Space (hold)", "Temporary pan mode"],
          ["Scroll wheel", "Zoom in / out"],
          ["Escape", "Clear canvas selection"],
        ]} />
      </Sec>
      <Sec id="sh-nodes">
        <SH>Node and edge shortcuts</SH>
        <Table head={["Shortcut", "Action"]} rows={[
          ["Ctrl+D", "Duplicate selected node"],
          ["Delete", "Delete selected node(s)"],
          ["Backspace", "Delete selected edge"],
          ["Shift+Click", "Add node to selection (multi-select)"],
        ]} />
      </Sec>
    </>
  );
}

const PAGE_COMPONENTS = {
  "getting-started": PageGettingStarted,
  "interface-tour": PageInterfaceTour,
  "working-with-nodes": PageWorkingWithNodes,
  connections: PageConnections,
  "canvas-controls": PageCanvasControls,
  "node-groups": PageNodeGroups,
  "node-types": PageNodeTypes,
  "agent-config": PageAgentConfig,
  "model-settings": PageModelSettings,
  "api-keys-overview": PageApiKeysOverview,
  "groq-key": PageGroqKey,
  "openai-key": PageOpenAIKey,
  "anthropic-key": PageAnthropicKey,
  "gemini-key": PageGeminiKey,
  "builtin-providers": PageBuiltinProviders,
  "custom-providers": PageCustomProviders,
  "local-models": PageLocalModels,
  "builtin-tools": PageBuiltinTools,
  "custom-tools": PageCustomTools,
  "custom-http-tools": PageCustomHttpTools,
  running: PageRunning,
  "output-terminal": PageOutputTerminal,
  "docker-sandbox": PageDockerSandbox,
  "code-view": PageCodeView,
  "chat-panel": PageChatPanel,
  "project-explorer": PageProjectExplorer,
  "command-palette": PageCommandPalette,
  projects: PageProjects,
  "settings-reference": PageSettingsReference,
  shortcuts: PageShortcuts,
};

const DOCS_SIDEBAR_WIDTH_KEY = "builder-docs-sidebar-width";
const DOCS_SIDEBAR_MIN_WIDTH = 216;
const DOCS_SIDEBAR_MAX_WIDTH = 300;
const DOCS_SIDEBAR_DEFAULT_WIDTH = 228;

function PlaceholderPage({ title }) {
  return (
    <>
      <PageHeader
        title={title}
        subtitle="This documentation section is still being assembled."
      />
      <Callout type="note">
        The navigation entry is wired up, but the article content for this section has not been
        added to this file yet.
      </Callout>
    </>
  );
}

function findPageLabel(pageId) {
  for (const group of NAV_GROUPS) {
    const match = group.items.find((item) => item.id === pageId);
    if (match) return match.label;
  }
  return pageId;
}

function filterNavGroups(query) {
  const searchQuery = query.trim().toLowerCase();
  if (!searchQuery) return NAV_GROUPS;

  return NAV_GROUPS.map((group) => {
    const items = group.items.filter((item) => {
      const anchorLabels = (PAGE_ARTICLES[item.id] || []).map((anchor) => anchor.label).join(" ");
      return `${group.label} ${item.label} ${anchorLabels}`.toLowerCase().includes(searchQuery);
    });
    return { ...group, items };
  }).filter((group) => group.items.length > 0);
}

function DocsSidebar({ activePage, filteredGroups, onChange, width }) {
  return (
    <aside
      className="slim-scroll shrink-0 overflow-y-auto border-r border-hairline bg-panel"
      style={{ width }}
    >
      <nav className="pb-6 pt-3">
        {filteredGroups.map((group) => (
          <div key={group.label}>
            {group.items.map((item) => {
              const active = item.id === activePage;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onChange(item.id)}
                  className={`flex w-full items-center gap-1.5 py-[2px] text-left text-[13px] leading-[22px] select-none outline-none ${
                    active ? "font-semibold text-ink" : "font-normal text-body"
                  }`}
                  style={
                    active
                      ? {
                          borderLeft: "3px solid rgb(var(--color-primary))",
                          paddingLeft: 14,
                          paddingRight: 12,
                          backgroundColor: "rgb(var(--color-canvas-soft))",
                        }
                      : { borderLeft: "3px solid transparent", paddingLeft: 14, paddingRight: 12 }
                  }
                  onMouseEnter={(event) => {
                    if (!active) event.currentTarget.style.backgroundColor = "rgb(var(--color-canvas-soft))";
                  }}
                  onMouseLeave={(event) => {
                    if (!active) event.currentTarget.style.backgroundColor = "";
                  }}
                >
                  <ChevronRight
                    size={12}
                    strokeWidth={1.75}
                    className={active ? "text-body" : "text-muted"}
                  />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}

export default function DocsPage() {
  const [query, setQuery] = useState("");
  const [activePage, setActivePage] = useState("getting-started");
  const contentRef = useRef(null);
  const layoutRef = useRef(null);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    if (typeof window === "undefined") return DOCS_SIDEBAR_DEFAULT_WIDTH;
    const stored = Number(window.localStorage.getItem(DOCS_SIDEBAR_WIDTH_KEY));
    return Number.isFinite(stored)
      ? Math.min(DOCS_SIDEBAR_MAX_WIDTH, Math.max(DOCS_SIDEBAR_MIN_WIDTH, stored))
      : DOCS_SIDEBAR_DEFAULT_WIDTH;
  });

  const filteredGroups = useMemo(() => filterNavGroups(query), [query]);
  const visiblePageIds = useMemo(
    () => filteredGroups.flatMap((group) => group.items.map((item) => item.id)),
    [filteredGroups]
  );

  const CurrentPage = PAGE_COMPONENTS[activePage];
  const articleLinks = PAGE_ARTICLES[activePage] || [];

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: "instant" });
  }, [activePage]);

  useEffect(() => {
    if (!visiblePageIds.includes(activePage) && visiblePageIds[0]) {
      setActivePage(visiblePageIds[0]);
    }
  }, [activePage, visiblePageIds]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DOCS_SIDEBAR_WIDTH_KEY, String(sidebarWidth));
    }
  }, [sidebarWidth]);

  useEffect(() => {
    if (!isResizingSidebar) return;

    function handleMouseMove(event) {
      const containerRect = layoutRef.current?.getBoundingClientRect();
      if (!containerRect) return;

      const nextWidth = event.clientX - containerRect.left;
      setSidebarWidth(
        Math.min(
          DOCS_SIDEBAR_MAX_WIDTH,
          Math.max(DOCS_SIDEBAR_MIN_WIDTH, nextWidth)
        )
      );
    }

    function handleMouseUp() {
      setIsResizingSidebar(false);
    }

    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizingSidebar]);

  return (
    <div className="flex h-full min-w-0 flex-col bg-canvas">
      <div className="bg-panel" style={{ borderBottom: "1px solid rgb(var(--color-hairline-soft))" }}>
        <div className="flex items-center gap-0">
          <div className="relative flex-1">
            <Search size={12} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search docs"
              className="h-[35px] w-full border-0 bg-panel pl-9 pr-3 text-[13px] text-ink placeholder-muted focus:outline-none focus:ring-0"
            />
          </div>
        </div>
      </div>

      <div ref={layoutRef} className="flex min-h-0 flex-1 overflow-hidden bg-canvas text-ink">
        <DocsSidebar
          activePage={activePage}
          filteredGroups={filteredGroups}
          onChange={setActivePage}
          width={sidebarWidth}
        />
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize documentation sidebar"
          onMouseDown={(event) => {
            event.preventDefault();
            setIsResizingSidebar(true);
          }}
          className={`group relative w-[6px] shrink-0 cursor-col-resize bg-transparent transition ${
            isResizingSidebar ? "bg-primary/10" : ""
          }`}
        >
          <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-transparent transition group-hover:bg-primary/30" />
        </div>
        <div className="slim-scroll min-w-0 flex-1 overflow-auto bg-canvas">
          <div ref={contentRef} className="h-full overflow-y-auto">
            {!visiblePageIds.length ? (
              <div className="mx-auto max-w-[860px] px-8 py-12 text-center">
                <p className="text-[14px] font-normal text-ink">No results for "{query.trim().toLowerCase()}"</p>
                <p className="mt-1 text-[12px] text-body">
                  Try: getting started, models, tools, execution, settings, shortcuts
                </p>
              </div>
            ) : (
              <div className="mx-auto flex w-full max-w-[1400px] gap-10 px-8 py-8">
                <article className="min-w-0 max-w-[860px] flex-1">
                  {CurrentPage ? <CurrentPage /> : <PlaceholderPage title={findPageLabel(activePage)} />}

                  <Divider />
                </article>

                <aside className="sticky top-0 hidden w-[220px] shrink-0 self-start pt-2 xl:block">
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted">
                    In This Article
                  </p>
                  <div className="space-y-1">
                    {articleLinks.length > 0 ? (
                      articleLinks.map((item) => (
                        <a
                          key={item.id}
                          href={`#${item.id}`}
                          className="block rounded px-2 py-1.5 text-[12px] text-body transition hover:bg-canvasSoft hover:text-ink"
                        >
                          {item.label}
                        </a>
                      ))
                    ) : (
                      <p className="px-2 text-[12px] text-muted">No section anchors for this page yet.</p>
                    )}
                  </div>
                  <div className="mt-6 border-t border-hairline pt-4">
                    <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted">
                      Feedback
                    </p>
                    <div className="space-y-2">
                      <p className="text-[12px] text-body">Was this page helpful?</p>
                      <div className="flex items-center gap-2">
                        <button className="rounded-md border border-hairline p-2 transition hover:bg-canvasSoft" aria-label="Helpful">
                          <ThumbsUp size={14} />
                        </button>
                        <button className="rounded-md border border-hairline p-2 transition hover:bg-canvasSoft" aria-label="Not helpful">
                          <ThumbsDown size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </aside>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
