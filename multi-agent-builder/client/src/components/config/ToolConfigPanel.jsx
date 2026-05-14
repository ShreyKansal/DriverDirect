import { useState } from "react";
import { AlertTriangle, Check, Copy, Info, Loader2, Play, Wrench } from "lucide-react";
import { useWorkflowStore } from "../../store/workflowStore.js";
import { BUILTIN_TOOLS } from "../../utils/graphUtils.js";
import Select from "../ui/Select.jsx";

const TOOL_TYPE_OPTIONS = [
  { value: "http",    label: "HTTP API — call any REST endpoint" },
  { value: "builtin", label: "Builtin — LangChain / LangGraph tools" },
  { value: "mcp",     label: "MCP — Model Context Protocol server" },
  { value: "custom",  label: "Custom — Python function" }
];

const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

const AUTH_OPTIONS = [
  { value: "none",    label: "No authentication"  },
  { value: "bearer",  label: "Bearer Token"        },
  { value: "api_key", label: "API Key (header)"    },
  { value: "basic",   label: "Basic Auth"          }
];

function completion(tool) {
  const mainField =
    tool.toolType === "http"    ? !!tool.endpoint?.trim() :
    tool.toolType === "builtin" ? !!tool.builtinId :
    tool.toolType === "mcp"     ? !!(tool.mcpServer?.trim() && tool.mcpToolName?.trim()) :
    !!(tool.customCode?.trim());
  const checks = [
    !!(tool.name && tool.name !== "New Tool"),
    mainField,
    !!tool.description?.trim(),
    !!tool.inputSchema?.trim(),
    !!tool.outputSchema?.trim()
  ];
  const done = checks.filter(Boolean).length;
  return { done, total: checks.length };
}

function Label({ children }) {
  return (
    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
      {children}
    </p>
  );
}

export default function ToolConfigPanel({ tool }) {
  const updateNode        = useWorkflowStore((s) => s.updateNode);
  const saveSelectedAgent = useWorkflowStore((s) => s.saveSelectedAgent);
  const workflow          = useWorkflowStore((s) => s.workflow);

  const [copiedField, setCopied]    = useState(null);
  const [testInput, setTestInput]   = useState("");
  const [testing, setTesting]       = useState(false);
  const [testResult, setTestResult] = useState(null);

  const update         = (u) => updateNode(tool.id, u);
  const { done, total } = completion(tool);
  const builderTarget  = workflow.builderTarget || "langgraph";

  const compatibleBuiltins   = BUILTIN_TOOLS.filter((t) => t.targets.includes(builderTarget));
  const incompatibleBuiltins = BUILTIN_TOOLS.filter((t) => !t.targets.includes(builderTarget));

  function copy(text, key) {
    navigator.clipboard.writeText(text || "").then(() => {
      setCopied(key); setTimeout(() => setCopied(null), 2000);
    });
  }

  async function handleTest() {
    if (!testInput.trim()) return;
    setTesting(true); setTestResult(null);
    const start = Date.now();
    try {
      if (tool.toolType === "http" && tool.endpoint) {
        let body;
        try { body = JSON.parse(testInput); } catch { body = { input: testInput }; }
        const headers = { "Content-Type": "application/json" };
        if (tool.authType === "bearer" && tool.authValue)  headers["Authorization"] = `Bearer ${tool.authValue}`;
        if (tool.authType === "api_key" && tool.authValue) headers["X-Api-Key"] = tool.authValue;
        const res = await fetch(tool.endpoint, {
          method:  tool.method || "POST",
          headers,
          body:    ["GET", "HEAD"].includes(tool.method) ? undefined : JSON.stringify(body)
        });
        const text = await res.text();
        let pretty = text;
        try { pretty = JSON.stringify(JSON.parse(text), null, 2); } catch {}
        setTestResult({ ok: res.ok, status: res.status, body: pretty, latency: `${Date.now() - start}ms` });
      } else {
        setTestResult({
          ok:      null,
          status:  null,
          latency: null,
          body:    tool.toolType === "builtin"
            ? `Builtin tools run inside the agent. Configure the agent and run the workflow to test "${tool.name}".`
            : tool.toolType === "mcp"
              ? `MCP tools execute on the MCP server. Start your server at ${tool.mcpServer || "<url>"} then run the workflow.`
              : `Custom tools execute in Python. Run the workflow to see the output.`,
          info: true
        });
      }
    } catch (err) {
      setTestResult({ ok: false, status: null, body: err.message, latency: `${Date.now() - start}ms` });
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="flex h-full flex-col bg-panel">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="border-b border-hairline px-4 pb-3 pt-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-surfaceStrong text-ink">
            <Wrench size={13} />
          </span>
          <input
            className="min-w-0 flex-1 bg-transparent text-[14px] font-semibold text-ink outline-none placeholder:text-muted"
            value={tool.name || ""}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="Tool name"
          />
        </div>
        <div className="mt-2 flex items-center gap-2">
          <div className="flex gap-1">
            {Array.from({ length: total }).map((_, i) => (
              <span key={i} className={`h-1.5 w-1.5 rounded-full ${i < done ? "bg-primary" : "bg-hairlineStrong"}`} />
            ))}
          </div>
          <span className="text-[10px] text-muted">{done}/{total} configured</span>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <div className="panel-scroll flex-1 overflow-auto px-4 py-4">
        <div className="space-y-5">

          {/* What is a tool */}
          <div className="flex items-start gap-2 rounded-lg border border-violet-200/60 bg-violet-50/70 px-3 py-2.5">
            <Info size={13} className="mt-0.5 shrink-0 text-violet-400" />
            <p className="text-[12px] leading-relaxed text-violet-900/75">
              A <strong className="font-semibold text-violet-900">Tool Node</strong> gives an agent a capability — like calling an API, searching the web, or running code. Connect this node to an agent; the agent calls it automatically when needed.
            </p>
          </div>

          {/* Type dropdown */}
          <div>
            <Label>Type</Label>
            <Select
              value={tool.toolType || "http"}
              onChange={(v) => update({ toolType: v })}
              options={TOOL_TYPE_OPTIONS}
            />
          </div>

          {/* ── HTTP ──────────────────────────────────────────────── */}
          {tool.toolType === "http" && (
            <>
              <div>
                <Label>Endpoint URL</Label>
                <input
                  className="input w-full font-mono text-[12px]"
                  value={tool.endpoint || ""}
                  onChange={(e) => update({ endpoint: e.target.value })}
                  placeholder="https://api.example.com/v1/search"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Method</Label>
                  <Select
                    value={tool.method || "POST"}
                    onChange={(v) => update({ method: v })}
                    options={HTTP_METHODS.map((m) => ({ value: m, label: m }))}
                  />
                </div>
                <div>
                  <Label>Auth</Label>
                  <Select
                    value={tool.authType || "none"}
                    onChange={(v) => update({ authType: v })}
                    options={AUTH_OPTIONS}
                  />
                </div>
              </div>

              {tool.authType !== "none" && (
                <div>
                  <Label>
                    {tool.authType === "bearer" ? "Token" : tool.authType === "api_key" ? "API Key" : "Credentials"}
                  </Label>
                  <input
                    className="input w-full font-mono text-[12px]"
                    type="password"
                    value={tool.authValue || ""}
                    onChange={(e) => update({ authValue: e.target.value })}
                    placeholder={tool.authType === "bearer" ? "sk-…" : tool.authType === "api_key" ? "your-api-key" : "user:password"}
                  />
                </div>
              )}
            </>
          )}

          {/* ── Builtin ───────────────────────────────────────────── */}
          {tool.toolType === "builtin" && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label>
                  {builderTarget === "python" ? "Python tools" : "LangChain / LangGraph tools"}
                </Label>
                <span className="rounded border border-hairline bg-canvasSoft px-1.5 py-0.5 font-mono text-[9px] text-muted">
                  {builderTarget}
                </span>
              </div>

              {compatibleBuiltins.length === 0 ? (
                <div className="flex items-start gap-2 rounded-md border border-error/20 bg-error/5 p-3 text-[12px] text-error">
                  <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                  No built-in tools for this target. Switch to LangGraph or LangChain, or use HTTP / Custom type.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {compatibleBuiltins.map((bt) => {
                    const active = tool.builtinId === bt.id;
                    return (
                      <button
                        key={bt.id}
                        className={`flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left transition ${
                          active ? "border-primary/30 bg-primary/5" : "border-hairline bg-panel hover:bg-canvasSoft"
                        }`}
                        onClick={() => update({ builtinId: bt.id, name: bt.name, description: bt.description })}
                      >
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${active ? "bg-primary" : "bg-hairlineStrong"}`} />
                        <div className="min-w-0 flex-1">
                          <p className="text-[12px] font-semibold text-ink">{bt.name}</p>
                          <p className="truncate text-[11px] text-muted">{bt.description}</p>
                        </div>
                        {bt.package && (
                          <span className="shrink-0 font-mono text-[10px] text-muted">{bt.package}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {incompatibleBuiltins.length > 0 && (
                <div className="mt-3 space-y-1 opacity-40">
                  <p className="text-[10px] text-muted">Not available on {builderTarget}</p>
                  {incompatibleBuiltins.map((bt) => (
                    <div key={bt.id} className="flex cursor-not-allowed items-center gap-3 rounded-md border border-hairline px-3 py-2">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-hairlineStrong" />
                      <p className="text-[12px] text-ink line-through">{bt.name}</p>
                      <span className="ml-auto font-mono text-[9px] text-muted">{bt.targets.join(", ")}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── MCP ───────────────────────────────────────────────── */}
          {tool.toolType === "mcp" && (
            <>
              <div>
                <Label>Server URL</Label>
                <input
                  className="input w-full font-mono text-[12px]"
                  value={tool.mcpServer || ""}
                  onChange={(e) => update({ mcpServer: e.target.value })}
                  placeholder="http://localhost:3000"
                />
                <p className="mt-1 text-[11px] text-muted">The MCP server that exposes this tool.</p>
              </div>
              <div>
                <Label>Tool name</Label>
                <input
                  className="input w-full font-mono text-[12px]"
                  value={tool.mcpToolName || ""}
                  onChange={(e) => update({ mcpToolName: e.target.value })}
                  placeholder="get_weather"
                />
              </div>
            </>
          )}

          {/* ── Custom ────────────────────────────────────────────── */}
          {tool.toolType === "custom" && (
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <Label>Python function</Label>
                <button className="text-[10px] text-muted hover:text-ink transition" onClick={() => copy(tool.customCode, "code")}>
                  {copiedField === "code" ? <Check size={11} /> : <Copy size={11} />}
                </button>
              </div>
              <textarea
                className="input w-full resize-y font-mono text-[12px] leading-relaxed"
                style={{ minHeight: 148 }}
                value={tool.customCode || ""}
                onChange={(e) => update({ customCode: e.target.value })}
                spellCheck={false}
              />
              <p className="mt-1 text-[11px] text-muted">
                Must accept <code className="font-mono">str</code> → return <code className="font-mono">str</code>.
              </p>
            </div>
          )}

          {/* ── Description ───────────────────────────────────────── */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <Label>Description</Label>
              <span className="text-[10px] text-muted">{(tool.description || "").length}/200</span>
            </div>
            <textarea
              className="input w-full resize-y text-[12px] leading-relaxed"
              style={{ minHeight: 72 }}
              maxLength={200}
              placeholder="Tell the agent what this tool does and when to call it."
              value={tool.description || ""}
              onChange={(e) => update({ description: e.target.value })}
            />
            <p className="mt-1 text-[11px] text-muted">Shown to the LLM to decide when to call this tool.</p>
          </div>

          {/* ── Schemas ───────────────────────────────────────────── */}
          <div className="space-y-3">
            <Label>Schemas</Label>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[10px] text-muted">Input</span>
                <button className="text-muted transition hover:text-ink" onClick={() => copy(tool.inputSchema, "in")}>
                  {copiedField === "in" ? <Check size={10} /> : <Copy size={10} />}
                </button>
              </div>
              <textarea
                className="input w-full resize-y font-mono text-[11px] leading-relaxed"
                style={{ minHeight: 80 }}
                value={tool.inputSchema || ""}
                onChange={(e) => update({ inputSchema: e.target.value })}
                spellCheck={false}
              />
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[10px] text-muted">Output</span>
                <button className="text-muted transition hover:text-ink" onClick={() => copy(tool.outputSchema, "out")}>
                  {copiedField === "out" ? <Check size={10} /> : <Copy size={10} />}
                </button>
              </div>
              <textarea
                className="input w-full resize-y font-mono text-[11px] leading-relaxed"
                style={{ minHeight: 72 }}
                value={tool.outputSchema || ""}
                onChange={(e) => update({ outputSchema: e.target.value })}
                spellCheck={false}
              />
            </div>
          </div>

          {/* ── Test ─────────────────────────────────────────────── */}
          <div>
            <Label>Test Tool</Label>

            {tool.toolType !== "http" && (
              <div className="mb-3 flex items-start gap-2 rounded-md border border-hairline bg-canvasSoft px-3 py-2.5 text-[11px] text-muted">
                <Info size={12} className="mt-0.5 shrink-0" />
                {tool.toolType === "builtin"
                  ? "Builtin tools run inside the agent. Use the Run button to execute the workflow."
                  : tool.toolType === "mcp"
                    ? "MCP tools run on your MCP server. Make sure the server is running before testing."
                    : "Custom tools run in Python. Use the Run button to execute the workflow."
                }
              </div>
            )}

            <div className="space-y-2">
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[10px] text-muted">Input (JSON)</span>
                  {tool.inputSchema && (
                    <button className="text-[10px] text-muted transition hover:text-ink"
                      onClick={() => setTestInput(tool.inputSchema)}>
                      Use schema
                    </button>
                  )}
                </div>
                <textarea
                  className="input w-full resize-none font-mono text-[11px] leading-relaxed"
                  style={{ height: 68 }}
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  placeholder={'{"query": "example input"}'}
                  spellCheck={false}
                />
              </div>

              <button
                className="flex w-full items-center justify-center gap-1.5 rounded-md border border-ink bg-ink py-2 text-[12px] font-medium text-white transition hover:bg-ink/85 disabled:cursor-not-allowed disabled:opacity-40"
                onClick={handleTest}
                disabled={testing || !testInput.trim()}
              >
                {testing
                  ? <><Loader2 size={12} className="animate-spin" /> Running…</>
                  : <><Play size={12} /> Run Test</>
                }
              </button>

              {testResult && (
                <div className={`rounded-md border px-3 py-3 ${
                  testResult.info
                    ? "border-hairline bg-canvasSoft"
                    : testResult.ok
                      ? "border-success/25 bg-success/5"
                      : "border-error/25 bg-error/5"
                }`}>
                  {!testResult.info && (
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className={`text-[10px] font-semibold ${
                        testResult.ok ? "text-success" : "text-error"
                      }`}>
                        {testResult.ok ? `✓ ${testResult.status} OK` : `✗ ${testResult.status || "Error"}`}
                      </span>
                      {testResult.latency && (
                        <span className="text-[10px] text-muted">{testResult.latency}</span>
                      )}
                    </div>
                  )}
                  <pre className="overflow-auto whitespace-pre-wrap font-mono text-[11px] text-ink">
                    {testResult.body}
                  </pre>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center justify-end border-t border-hairline bg-panel px-4 py-3">
        <button className="btn-primary h-9 px-5 text-[12px]" onClick={saveSelectedAgent}>
          <Check size={13} /> Apply Changes
        </button>
      </div>
    </div>
  );
}
