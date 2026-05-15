import { useEffect, useRef, useState } from "react";

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { id: "getting-started", label: "Getting Started" }
    ]
  },
  {
    label: "Core Concepts",
    items: [
      { id: "node-types",   label: "Node Types" },
      { id: "agent-config", label: "Agent Configuration" }
    ]
  },
  {
    label: "Providers",
    items: [
      { id: "builtin-providers", label: "Built-in Providers" },
      { id: "custom-providers",  label: "Custom Providers" }
    ]
  },
  {
    label: "Tools",
    items: [
      { id: "builtin-tools", label: "Built-in Tools" },
      { id: "custom-tools",  label: "Custom Python Tools" }
    ]
  },
  {
    label: "Execution",
    items: [
      { id: "running", label: "Running a Workflow" }
    ]
  },
  {
    label: "Reference",
    items: [
      { id: "projects",  label: "Project Management" },
      { id: "shortcuts", label: "Keyboard Shortcuts" }
    ]
  }
];

const ALL_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

/* ── Inline text ─────────────────────────────────────────────────────────── */
function C({ children }) {
  return (
    <code className="font-mono text-[12px] bg-canvasSoft border border-hairline rounded px-1.5 py-0.5 text-ink">
      {children}
    </code>
  );
}

function Kbd({ children }) {
  return (
    <kbd className="font-mono text-[11px] bg-canvasSoft border border-hairlineStrong rounded px-1.5 py-0.5 text-body">
      {children}
    </kbd>
  );
}

function A({ href, children }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="text-primary underline underline-offset-2 hover:opacity-80">
      {children}
    </a>
  );
}

/* ── Block components ────────────────────────────────────────────────────── */
function Section({ id, title, children, sectionRefs }) {
  return (
    <div ref={(el) => { if (sectionRefs) sectionRefs.current[id] = el; }} className="scroll-mt-8">
      <h1 className="text-[22px] font-semibold text-ink">{title}</h1>
      <div className="mt-4 space-y-5">{children}</div>
    </div>
  );
}

function H2({ children }) {
  return <h2 className="text-[15px] font-semibold text-ink mt-8 mb-2">{children}</h2>;
}

function P({ children }) {
  return <p className="text-[13px] text-body leading-[1.75]">{children}</p>;
}

function OL({ children }) {
  return <ol className="list-decimal ml-5 space-y-2 text-[13px] text-body leading-[1.75]">{children}</ol>;
}

function UL({ children }) {
  return <ul className="list-disc ml-5 space-y-1.5 text-[13px] text-body leading-[1.75]">{children}</ul>;
}

function Divider() {
  return <hr className="border-hairline my-10" />;
}

/* ── Callout box ─────────────────────────────────────────────────────────── */
function Callout({ type = "note", children }) {
  const label = type === "tip" ? "Tip" : "Note";
  return (
    <div className="border-l-2 border-hairlineStrong bg-canvasSoft px-4 py-3 text-[13px] leading-[1.7] text-body">
      <span className="font-semibold text-ink mr-1.5">{label}.</span>
      {children}
    </div>
  );
}

/* ── Definition list ─────────────────────────────────────────────────────── */
function DefList({ items }) {
  return (
    <dl className="space-y-3">
      {items.map(({ term, def }) => (
        <div key={term}>
          <dt className="text-[13px] font-semibold text-ink">{term}</dt>
          <dd className="mt-0.5 text-[13px] text-body leading-[1.75] ml-4">{def}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function DocsPage() {
  const sectionRefs = useRef({});
  const contentRef  = useRef(null);
  const [active, setActive] = useState("getting-started");
  const [navSearch, setNavSearch] = useState("");

  useEffect(() => {
    const observers = [];
    ALL_ITEMS.forEach(({ id }) => {
      const el = sectionRefs.current[id];
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActive(id); },
        { root: contentRef.current, threshold: 0.2 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  function scrollTo(id) {
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActive(id);
  }

  const filteredGroups = navSearch.trim()
    ? NAV_GROUPS.map((g) => ({
        ...g,
        items: g.items.filter(({ label }) =>
          label.toLowerCase().includes(navSearch.toLowerCase())
        )
      })).filter((g) => g.items.length > 0)
    : NAV_GROUPS;

  return (
    <div className="flex h-full min-h-0 bg-canvas">

      {/* ── Left nav ──────────────────────────────────────────────────── */}
      <aside className="w-[220px] shrink-0 border-r border-hairline overflow-y-auto py-5 px-3 flex flex-col gap-4">
        <div className="px-1">
          <input
            className="w-full rounded-md border border-hairline bg-panel px-3 py-1.5 text-[12px] text-ink outline-none focus:border-primary placeholder:text-muted"
            placeholder="Search…"
            value={navSearch}
            onChange={(e) => setNavSearch(e.target.value)}
          />
        </div>

        {filteredGroups.map((group) => (
          <div key={group.label}>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted px-3 mb-1.5">
              {group.label}
            </p>
            {group.items.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => { scrollTo(id); setNavSearch(""); }}
                className={`w-full text-left px-3 py-1.5 rounded text-[13px] transition ${
                  active === id
                    ? "font-medium text-ink bg-canvasSoft"
                    : "text-body hover:bg-canvasSoft hover:text-ink"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        ))}
      </aside>

      {/* ── Content ───────────────────────────────────────────────────── */}
      <div ref={contentRef} className="flex-1 overflow-y-auto px-14 py-10">
        <div className="max-w-[680px]">

          {/* ── Getting Started ─────────────────────────────────────── */}
          <Section id="getting-started" title="Getting Started" sectionRefs={sectionRefs}>
            <P>AgentDRIVER is a visual multi-agent workflow builder. Connect LLM-powered nodes on a canvas, configure each agent's model and tools, and run the workflow against a task.</P>
            <OL>
              <li>Create a new project — click <strong>File → New Project</strong> or press <Kbd>Ctrl+Shift+N</Kbd>.</li>
              <li>The canvas opens with four default nodes already connected: <strong>User Input → Agent → Orchestrator → Final Output</strong>.</li>
              <li>Click any node to open its configuration in the left panel.</li>
              <li>Connect nodes by dragging from the output port of one node to the input port of another.</li>
              <li>Add an API key — open <strong>Settings</strong> (<Kbd>Ctrl+K</Kbd>) → <strong>Model Providers</strong> → paste your key and click Save.</li>
              <li>Click <strong>Run</strong> in the top-right corner, or press <Kbd>Ctrl+Enter</Kbd>.</li>
              <li>Watch real-time execution in the terminal panel at the bottom of the canvas.</li>
            </OL>
            <Callout type="tip">
              The workflow auto-saves 1.5 seconds after every change. Force-save anytime with <Kbd>Ctrl+S</Kbd>.
            </Callout>
          </Section>

          <Divider />

          {/* ── Node Types ──────────────────────────────────────────── */}
          <Section id="node-types" title="Node Types" sectionRefs={sectionRefs}>
            <P>Every workflow is built from four types of nodes. Each has a distinct role in the execution graph.</P>
            <DefList items={[
              { term: "User Input", def: "Entry point. Receives the task prompt from the user at runtime. Every workflow needs exactly one." },
              { term: "Agent",      def: "An LLM-powered worker. Has its own model, system prompt, and optional tools. Produces text output that downstream nodes can consume." },
              { term: "Orchestrator", def: "Receives outputs from all agents and synthesizes a final answer. Acts as the workflow brain. Every workflow needs exactly one." },
              { term: "Final Output", def: "Collects and displays the orchestrator's result. The terminal node for every execution path." }
            ]} />
            <H2>Adding a node</H2>
            <OL>
              <li>Click <strong>Edit → Add Node</strong> in the menu bar and choose a node type.</li>
              <li>The node appears on the canvas. Drag it to position it.</li>
              <li>Drag from the output port of one node to the input port of another to connect them.</li>
              <li>Use <strong>Edit → Auto Layout</strong> (<Kbd>Ctrl+Shift+L</Kbd>) to automatically arrange all nodes.</li>
            </OL>
          </Section>

          <Divider />

          {/* ── Agent Configuration ─────────────────────────────────── */}
          <Section id="agent-config" title="Agent Configuration" sectionRefs={sectionRefs}>
            <P>Each Agent and Orchestrator node has three configuration tabs accessible from the left panel.</P>
            <OL>
              <li>Click an Agent node on the canvas to select it and open its config panel.</li>
              <li><strong>General tab</strong> — set the agent name, role description, input mode (<em>user task</em>, <em>previous agent output</em>, or <em>combined context</em>), and output format.</li>
              <li><strong>Model tab</strong> — choose a provider, model, temperature (0–2), and max tokens. A warning appears if the provider has no API key set.</li>
              <li><strong>Tools tab</strong> — add built-in tools (search, calculator) or write custom Python tools. Tools run in an isolated Docker sandbox.</li>
              <li>The system prompt is constructed automatically from the agent's name, role, and input mode. You can preview it in the prompt section.</li>
              <li>Changes auto-save. Re-run the workflow to apply updated configuration.</li>
            </OL>
            <Callout type="note">
              The system prompt is auto-generated from the agent's name and role — you don't need to write prompt engineering instructions manually.
            </Callout>
          </Section>

          <Divider />

          {/* ── Built-in Providers ──────────────────────────────────── */}
          <Section id="builtin-providers" title="Built-in Providers" sectionRefs={sectionRefs}>
            <P>AgentDRIVER supports four built-in model providers. API keys are encrypted with AES-256-GCM and stored per project.</P>
            <OL>
              <li>Open <strong>Settings</strong> (<Kbd>Ctrl+K</Kbd>) and go to the <strong>Model Providers</strong> section.</li>
              <li>Click <strong>Add key</strong> next to the provider you want to configure.</li>
              <li>Paste your API key, click <strong>Test</strong> to verify it, then click <strong>Save</strong>.</li>
              <li>The provider now appears in the Model dropdown when configuring any agent in this project.</li>
              <li>Different projects can have different keys. Keys are never shared across projects.</li>
            </OL>
            <H2>Provider reference</H2>
            <table className="w-full text-[13px] border-collapse mt-3">
              <thead>
                <tr className="border-b border-hairline text-left">
                  <th className="pb-2 font-semibold text-ink pr-6">Provider</th>
                  <th className="pb-2 font-semibold text-ink pr-6">Key format</th>
                  <th className="pb-2 font-semibold text-ink">Console</th>
                </tr>
              </thead>
              <tbody className="text-body">
                {[
                  { name: "Groq",          fmt: "gsk_...",     url: "https://console.groq.com",         label: "console.groq.com" },
                  { name: "OpenAI",        fmt: "sk-...",      url: "https://platform.openai.com",      label: "platform.openai.com" },
                  { name: "Anthropic",     fmt: "sk-ant-...",  url: "https://console.anthropic.com",    label: "console.anthropic.com" },
                  { name: "Google Gemini", fmt: "AIza...",     url: "https://aistudio.google.com",      label: "aistudio.google.com" }
                ].map(({ name, fmt, url, label }) => (
                  <tr key={name} className="border-b border-hairline/50 last:border-0">
                    <td className="py-2.5 pr-6 font-medium text-ink">{name}</td>
                    <td className="py-2.5 pr-6"><C>{fmt}</C></td>
                    <td className="py-2.5"><A href={url}>{label}</A></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Callout type="tip">
              Keys are stored per project — you can use a different provider for each project, useful for separating dev and prod budgets.
            </Callout>
          </Section>

          <Divider />

          {/* ── Custom Providers ────────────────────────────────────── */}
          <Section id="custom-providers" title="Custom Providers" sectionRefs={sectionRefs}>
            <P>Connect any AI model beyond the four built-ins. Three provider types are supported.</P>
            <DefList items={[
              { term: "OpenAI-Compatible", def: "Any endpoint that accepts the OpenAI chat completions format — Together AI, Fireworks, Perplexity, Anyscale, etc. Provide a base URL and API key." },
              { term: "Local Model",       def: "Ollama, LM Studio, or LocalAI running on your machine. No API key required. Default base URL: http://localhost:11434" },
              { term: "Custom HTTP",       def: "Any REST endpoint. You define the request body template and a dot-notation path to extract the response text." }
            ]} />
            <H2>Adding a custom provider</H2>
            <OL>
              <li>Open <strong>Settings</strong> → <strong>Model Providers</strong> → click <strong>+ Add Custom Provider</strong>.</li>
              <li>Select a provider type and enter the base URL.</li>
              <li>Add model IDs manually, or click <strong>Auto-discover</strong> to fetch the list from <C>/v1/models</C> (OpenAI-compat and local providers).</li>
              <li>Enter an API key if required, then click <strong>Test Connection</strong>.</li>
              <li>Click <strong>Add Provider</strong>. The provider immediately appears in the Model dropdown for all agents in this project.</li>
            </OL>
            <H2>Custom HTTP template placeholders</H2>
            <P>Use these placeholders in your request body template:</P>
            <table className="w-full text-[13px] border-collapse mt-3">
              <tbody className="text-body">
                {[
                  ["{{messages}}", "Chat messages array"],
                  ["{{model}}", "Model ID string"],
                  ["{{maxTokens}}", "Max tokens number"],
                  ["{{temperature}}", "Temperature (float)"]
                ].map(([ph, desc]) => (
                  <tr key={ph} className="border-b border-hairline/50 last:border-0">
                    <td className="py-2 pr-6"><C>{ph}</C></td>
                    <td className="py-2 text-body">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <P>Set the response path using dot notation, e.g. <C>choices.0.message.content</C>.</P>
          </Section>

          <Divider />

          {/* ── Built-in Tools ──────────────────────────────────────── */}
          <Section id="builtin-tools" title="Built-in Tools" sectionRefs={sectionRefs}>
            <P>Built-in tools give agents the ability to search the web, look up information, and run calculations. All tools run in an isolated Docker container that is created at the start of each workflow run and destroyed when it finishes.</P>
            <OL>
              <li>Click an Agent or Orchestrator node → open the <strong>Tools</strong> tab.</li>
              <li>Type in the search box to find a tool by name.</li>
              <li>Click a tool to add it to the agent.</li>
              <li>On the next run, the Docker sandbox starts automatically and the tool is available to the LLM.</li>
            </OL>
            <H2>Available tools</H2>
            <UL>
              <li>DuckDuckGo Search — web search via DuckDuckGo</li>
              <li>Wikipedia — article summaries from Wikipedia</li>
              <li>Calculator — evaluate mathematical expressions</li>
              <li>JSON Get Value — extract a value from a JSON string by key path</li>
            </UL>
            <Callout type="note">
              Docker must be running on your machine for tools to work. The sandbox container starts automatically before the first agent runs.
            </Callout>
          </Section>

          <Divider />

          {/* ── Custom Python Tools ─────────────────────────────────── */}
          <Section id="custom-tools" title="Custom Python Tools" sectionRefs={sectionRefs}>
            <P>Write arbitrary Python functions as tools. The function receives a string input and must return a string. It runs in the same Docker sandbox as built-in tools.</P>
            <OL>
              <li>In the Tools tab, click <strong>Add Custom Tool</strong>.</li>
              <li>Give the tool a name — this is the exact function name the LLM will call.</li>
              <li>Write a Python function that accepts <C>input: str</C> and returns a <C>str</C>.</li>
              <li>You can import any pip package. If it is not pre-installed, it will be added during the bootstrap phase before the first agent runs.</li>
              <li>The return value of the function is fed back to the LLM as the tool result.</li>
            </OL>
            <Callout type="tip">
              Keep tool names short and descriptive — the LLM decides when to call them based on the name alone. Good: <C>search_web</C>. Avoid: <C>my_custom_function_v2</C>.
            </Callout>
          </Section>

          <Divider />

          {/* ── Running a Workflow ──────────────────────────────────── */}
          <Section id="running" title="Running a Workflow" sectionRefs={sectionRefs}>
            <P>Each workflow run is an end-to-end execution of the canvas graph against a user-provided task.</P>
            <OL>
              <li>Confirm every agent has a model provider configured. A yellow warning in the Model tab means the API key is missing.</li>
              <li>Click <strong>Run</strong> in the top-right corner, or press <Kbd>Ctrl+Enter</Kbd>.</li>
              <li>The terminal panel opens at the bottom of the canvas.</li>
              <li>If any agent uses tools, a <strong>bootstrap phase</strong> runs first — each pip package required is installed and progress is shown in the terminal.</li>
              <li>Agents execute in topological order, left to right based on their connections.</li>
              <li>Each agent card in the terminal shows: the input it received, its output, and any tool calls it made.</li>
              <li>The Orchestrator runs last, synthesizing all agent outputs into the final answer.</li>
              <li>To abort a run, click the <strong>Running…</strong> button — this terminates the stream and stops the sandbox.</li>
              <li>Click the trash icon in the terminal header to clear previous output before the next run.</li>
            </OL>
          </Section>

          <Divider />

          {/* ── Project Management ──────────────────────────────────── */}
          <Section id="projects" title="Project Management" sectionRefs={sectionRefs}>
            <P>Projects are independent workflows, each with their own canvas, agent configuration, and provider keys.</P>
            <UL>
              <li><strong>New project</strong> — File → New Project (<Kbd>Ctrl+Shift+N</Kbd>)</li>
              <li><strong>Switch project</strong> — click the project name dropdown in the top-right header</li>
              <li><strong>Save</strong> — auto-saves 1.5 s after every change; force-save with <Kbd>Ctrl+S</Kbd></li>
              <li><strong>Rename</strong> — Settings → General → edit the Project name field</li>
              <li><strong>Import JSON</strong> — File → Import JSON</li>
              <li><strong>Export JSON</strong> — File → Export JSON</li>
              <li><strong>Delete project</strong> — hover a project in the dropdown → click the trash icon</li>
            </UL>
          </Section>

          <Divider />

          {/* ── Keyboard Shortcuts ──────────────────────────────────── */}
          <Section id="shortcuts" title="Keyboard Shortcuts" sectionRefs={sectionRefs}>
            <table className="w-full text-[13px] border-collapse">
              <thead>
                <tr className="border-b border-hairline text-left">
                  <th className="pb-2 font-semibold text-ink pr-8">Shortcut</th>
                  <th className="pb-2 font-semibold text-ink">Action</th>
                </tr>
              </thead>
              <tbody>
                {[
                  [["Ctrl", "Enter"],          "Run workflow"],
                  [["Ctrl", "S"],              "Save project"],
                  [["Ctrl", "Shift", "P"],     "Focus command search"],
                  [["Ctrl", "Shift", "N"],     "New project"],
                  [["Ctrl", "K"],              "Open Project Settings"],
                  [["F1"],                     "Open Documentation"],
                  [["Ctrl", "B"],              "Toggle Explorer panel"],
                  [["Ctrl", "Shift", "K"],     "Toggle Chat panel"],
                  [["Ctrl", "Shift", "L"],     "Auto layout canvas"],
                  [["Ctrl", "D"],              "Duplicate selected node"],
                  [["Delete"],                 "Delete selected node"],
                  [["Ctrl", "`"],              "Toggle terminal"],
                  [["Escape"],                 "Clear canvas selection"],
                ].map(([keys, action]) => (
                  <tr key={action} className="border-b border-hairline/50 last:border-0">
                    <td className="py-2.5 pr-8">
                      <span className="flex items-center gap-1 flex-wrap">
                        {keys.map((k, i) => (
                          <span key={i} className="flex items-center gap-1">
                            <Kbd>{k}</Kbd>
                            {i < keys.length - 1 && <span className="text-muted text-[11px]">+</span>}
                          </span>
                        ))}
                      </span>
                    </td>
                    <td className="py-2.5 text-body">{action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <div className="h-16" />
        </div>
      </div>
    </div>
  );
}
