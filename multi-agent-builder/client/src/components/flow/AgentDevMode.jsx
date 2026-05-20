import { useCallback, useMemo, useRef, useState } from "react";
import { Check, Copy, Play, Loader2, AlertTriangle, Wrench } from "lucide-react";
import { useWorkflowStore } from "../../store/workflowStore.js";
import { makeId } from "../../utils/idUtils.js";

// ─── Helpers ────────────────────────────────────────────────────────────────

function buildSyntheticWorkflow(agentNode, builderTarget) {
  const inputId = makeId("syn_input");
  return {
    name: "quick-run",
    builderTarget: builderTarget || "langgraph",
    nodes: [
      {
        id: inputId,
        type: "user_input",
        name: "Input",
        role: "",
        prompt: "",
        inputMode: "direct",
        position: { x: 0, y: 0 },
      },
      { ...agentNode, position: { x: 300, y: 0 } },
    ],
    edges: [
      { id: makeId("syn_edge"), source: inputId, target: agentNode.id, type: "default" },
    ],
  };
}

function estimateTokens(text) {
  return Math.ceil((text || "").length / 4);
}

// ─── Inspector tab content ────────────────────────────────────────────────────

function StateTab({ node }) {
  const [copied, setCopied] = useState(false);
  const json = useMemo(() => JSON.stringify(node, null, 2), [node]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <div className="relative h-full min-h-0">
      <button
        className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-[2px] border border-hairline bg-panel px-2 py-1 text-[11px] text-muted transition hover:text-ink"
        onClick={copy}
      >
        {copied ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy</>}
      </button>
      <pre className="slim-scroll h-full overflow-auto rounded-[2px] bg-canvasSoft p-3 text-[11.5px] leading-relaxed font-mono text-ink">
        {json}
      </pre>
    </div>
  );
}

function TraceTab({ agentId, runs, activeProjectId }) {
  const run = runs?.[activeProjectId];
  const steps = useMemo(
    () => (run?.trace?.steps || []).filter((s) => s.agentId === agentId),
    [run, agentId]
  );

  if (!run && steps.length === 0) {
    return (
      <EmptyTabState
        title="No run yet"
        hint="Use Quick Run on the right to send a test message to this agent."
      />
    );
  }

  if (steps.length === 0) {
    return (
      <EmptyTabState
        title="This agent has not run yet"
        hint="This agent was not part of the last workflow run."
      />
    );
  }

  return (
    <div className="slim-scroll h-full overflow-auto space-y-4 pr-1">
      {steps.map((step, i) => (
        <div key={i} className="rounded-[2px] border border-hairline bg-canvasSoft p-3 text-[12px]">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-ink">Step {i + 1}</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              step.status === "completed"
                ? "bg-green-100 text-green-700"
                : step.status === "error"
                ? "bg-red-100 text-red-600"
                : "bg-primary/10 text-primary"
            }`}>
              {step.status}
            </span>
          </div>
          {step.input && (
            <div className="mb-2">
              <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted">Input</p>
              <p className="whitespace-pre-wrap text-body">{step.input}</p>
            </div>
          )}
          {step.toolCalls?.length > 0 && (
            <div className="mb-2">
              <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
                Tool Calls ({step.toolCalls.length})
              </p>
              <div className="space-y-1">
                {step.toolCalls.map((tc, j) => (
                  <div key={j} className="rounded-[2px] bg-surfaceStrong p-2 text-[11px]">
                    <span className="font-semibold text-ink">{tc.name || tc.tool}</span>
                    {tc.result && (
                      <p className="mt-0.5 text-muted truncate">{typeof tc.result === "string" ? tc.result : JSON.stringify(tc.result)}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {step.output && (
            <div>
              <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted">Output</p>
              <p className="whitespace-pre-wrap text-body">{step.output}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function TokensTab({ agentId, runs, activeProjectId }) {
  const run = runs?.[activeProjectId];
  const steps = useMemo(
    () => (run?.trace?.steps || []).filter((s) => s.agentId === agentId),
    [run, agentId]
  );

  if (!run || steps.length === 0) {
    return (
      <EmptyTabState
        title="No run yet"
        hint="Run the workflow or use Quick Run to see token usage."
      />
    );
  }

  const allResponses = steps.flatMap((s) => s.llmResponses || []);
  const promptTokens     = allResponses.reduce((sum, r) => sum + (r.prompt_tokens     || r.usage?.prompt_tokens     || 0), 0);
  const completionTokens = allResponses.reduce((sum, r) => sum + (r.completion_tokens || r.usage?.completion_tokens || 0), 0);
  const totalTokens      = promptTokens + completionTokens;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Prompt Tokens",     value: promptTokens.toLocaleString()     },
          { label: "Completion Tokens", value: completionTokens.toLocaleString() },
          { label: "Total",             value: totalTokens.toLocaleString()       },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-[2px] border border-hairline bg-canvasSoft p-3 text-center">
            <p className="text-[20px] font-semibold text-ink">{value}</p>
            <p className="mt-0.5 text-[10px] text-muted">{label}</p>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-muted">
        From {steps.length} agent step{steps.length !== 1 ? "s" : ""} in last run.
        Cost varies by model and provider.
      </p>
    </div>
  );
}

function PromptPreviewTab({ node }) {
  const [copied, setCopied] = useState(false);
  const compiled = useMemo(() => {
    const parts = [];
    if (node.role) parts.push(`[Purpose]\n${node.role}`);
    if (node.prompt) parts.push(`[System Prompt]\n${node.prompt}`);
    return parts.join("\n\n") || "(No prompt configured for this agent.)";
  }, [node.role, node.prompt]);

  const chars  = compiled.length;
  const tokens = estimateTokens(compiled);

  async function copy() {
    try {
      await navigator.clipboard.writeText(compiled);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex gap-3 text-[11px] text-muted">
          <span>{chars.toLocaleString()} chars</span>
          <span>~{tokens.toLocaleString()} tokens</span>
        </div>
        <button
          className="flex items-center gap-1 rounded-[2px] border border-hairline bg-panel px-2 py-1 text-[11px] text-muted transition hover:text-ink"
          onClick={copy}
        >
          {copied ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy</>}
        </button>
      </div>
      <pre className="slim-scroll flex-1 overflow-auto rounded-[2px] bg-canvasSoft p-3 text-[11.5px] leading-relaxed font-mono text-ink whitespace-pre-wrap">
        {compiled}
      </pre>
    </div>
  );
}

function EmptyTabState({ title, hint }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <p className="text-[13px] font-semibold text-ink">{title}</p>
      <p className="max-w-xs text-[12px] text-muted">{hint}</p>
    </div>
  );
}

// ─── Inspector panel ─────────────────────────────────────────────────────────

const INSPECTOR_TABS = [
  { id: "state",   label: "State"          },
  { id: "trace",   label: "Trace"          },
  { id: "tokens",  label: "Tokens"         },
  { id: "prompt",  label: "Prompt Preview" },
];

function Inspector({ activeTab, onTabChange, node, agentId, runs, activeProjectId }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[2px] border border-hairline bg-panel">
      <div
        className="flex shrink-0 border-b border-hairline"
        role="tablist"
        aria-label="Dev Mode inspector"
      >
        {INSPECTOR_TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`devmode-panel-${tab.id}`}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 px-2 py-2 text-[12px] font-medium transition ${
              activeTab === tab.id
                ? "border-b-2 border-primary text-ink"
                : "text-muted hover:text-ink"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div
        id={`devmode-panel-${activeTab}`}
        role="tabpanel"
        className="min-h-0 flex-1 overflow-hidden p-3"
      >
        {activeTab === "state"  && <StateTab node={node} />}
        {activeTab === "trace"  && <TraceTab agentId={agentId} runs={runs} activeProjectId={activeProjectId} />}
        {activeTab === "tokens" && <TokensTab agentId={agentId} runs={runs} activeProjectId={activeProjectId} />}
        {activeTab === "prompt" && <PromptPreviewTab node={node} />}
      </div>
    </div>
  );
}

// ─── Actions panel ────────────────────────────────────────────────────────────

function QuickRunPanel({ node, workflow, runInputRef }) {
  const [input, setInput]   = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  async function handleRun() {
    if (!input.trim()) return;
    setLoading(true);
    setError("");
    setOutput("");
    try {
      const syntheticWorkflow = buildSyntheticWorkflow(node, workflow.builderTarget);
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflow: syntheticWorkflow, userTask: input }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Run failed (${res.status}): ${text}`);
      }
      const data = await res.json();
      const finalOutput =
        data?.trace?.finalOutput ||
        data?.trace?.steps?.find((s) => s.agentId === node.id)?.output ||
        JSON.stringify(data, null, 2);
      setOutput(finalOutput || "(No output returned)");
    } catch (err) {
      setError(`Run failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleRun();
    }
  }

  return (
    <div className="rounded-[2px] border border-hairline bg-panel p-3">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-primary">
        Quick Run
      </p>
      <div className="flex gap-2">
        <textarea
          ref={runInputRef}
          className="slim-scroll min-h-[48px] flex-1 resize-y rounded-[2px] border border-hairline bg-surfaceStrong px-2.5 py-2 text-[12px] text-ink outline-none placeholder:text-muted transition focus:border-primary"
          placeholder="Type a test message… (Ctrl+Enter to run)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <button
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[2px] bg-primary text-white transition hover:bg-primary/90 disabled:opacity-50"
          onClick={handleRun}
          disabled={loading || !input.trim()}
          title="Run (Ctrl+Enter)"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
        </button>
      </div>
      {error && (
        <div className="mt-2 flex items-start gap-1.5 rounded-[2px] border border-red-300 bg-red-50 px-2.5 py-2 text-[11px] text-red-700">
          <AlertTriangle size={12} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {output && (
        <div className="mt-2 rounded-[2px] bg-canvasSoft p-2.5 text-[12px] leading-relaxed text-ink whitespace-pre-wrap">
          {output}
        </div>
      )}
      {!output && !error && !loading && (
        <p className="mt-2 text-[11px] text-muted">Output will appear here after run.</p>
      )}
    </div>
  );
}

function TestToolCallPanel({ node }) {
  const tools = useMemo(() => {
    const builtins = (node.builtinTools || []).map((t) => ({ ...t, source: "builtin" }));
    const custom   = (node.customTools  || []).map((t) => ({ ...t, id: t.name, source: "custom" }));
    return [...builtins, ...custom];
  }, [node.builtinTools, node.customTools]);

  const [selectedTool, setSelectedTool] = useState(tools[0]?.id || "");
  const [args, setArgs]   = useState("{}");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  if (tools.length === 0) {
    return (
      <div className="rounded-[2px] border border-hairline bg-panel p-3">
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
          Test Tool Call
        </p>
        <p className="text-[12px] text-muted">No tools attached to this agent.</p>
      </div>
    );
  }

  async function handleRunTool() {
    const tool = tools.find((t) => t.id === selectedTool);
    if (!tool) return;
    if (tool.source !== "custom") {
      setResult("Testing not available for this tool type. Only custom Python tools can be tested directly.");
      return;
    }
    setLoading(true);
    setResult("");
    try {
      let parsedArgs = {};
      try { parsedArgs = JSON.parse(args); } catch { throw new Error("Invalid JSON in args"); }
      const res = await fetch("/api/tools/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: tool.code || "", input: parsedArgs }),
      });
      const data = await res.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (err) {
      setResult(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-[2px] border border-hairline bg-panel p-3">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
        Test Tool Call
      </p>
      <div className="space-y-2">
        <select
          className="h-[30px] w-full rounded-[2px] border border-hairline bg-surfaceStrong px-2 text-[12px] text-ink outline-none transition focus:border-primary"
          value={selectedTool}
          onChange={(e) => setSelectedTool(e.target.value)}
        >
          {tools.map((t) => (
            <option key={t.id} value={t.id}>{t.name || t.id}</option>
          ))}
        </select>
        <textarea
          className="slim-scroll w-full resize-y rounded-[2px] border border-hairline bg-surfaceStrong px-2.5 py-1.5 font-mono text-[11px] text-ink outline-none placeholder:text-muted transition focus:border-primary"
          rows={3}
          placeholder='{"key": "value"}'
          value={args}
          onChange={(e) => setArgs(e.target.value)}
        />
        <button
          className="flex h-8 w-full items-center justify-center gap-1.5 rounded-[2px] border border-hairlineStrong bg-canvasSoft text-[12px] font-medium text-body transition hover:bg-surfaceStrong disabled:opacity-50"
          onClick={handleRunTool}
          disabled={loading}
        >
          {loading ? <Loader2 size={11} className="animate-spin" /> : <Wrench size={11} />}
          Run Tool
        </button>
        {result && (
          <pre className="slim-scroll max-h-32 overflow-auto rounded-[2px] bg-canvasSoft p-2 text-[10.5px] font-mono text-ink">
            {result}
          </pre>
        )}
      </div>
    </div>
  );
}

function OverridePromptPanel({ node }) {
  const [text, setText]       = useState("");
  const [active, setActive]   = useState(false);
  const [saved, setSaved]     = useState(false);

  function handleApply() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="rounded-[2px] border border-hairline bg-panel p-3">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
        Override Prompt
      </p>
      <textarea
        className="slim-scroll w-full resize-y rounded-[2px] border border-hairline bg-surfaceStrong px-2.5 py-1.5 text-[12px] text-ink outline-none placeholder:text-muted transition focus:border-primary"
        rows={3}
        placeholder="Additional instructions prepended before the system prompt…"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <label className="mt-2 flex cursor-pointer items-center gap-2 text-[12px] text-body">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
          className="accent-primary"
        />
        Active for next run only
      </label>
      <p className="mt-1 text-[10px] text-muted">
        ⚠ Resets when this tab closes. Not persisted.
      </p>
      <button
        className="mt-2 flex h-7 w-full items-center justify-center rounded-[2px] border border-hairline bg-canvasSoft text-[11px] font-medium text-body transition hover:bg-surfaceStrong disabled:opacity-40"
        onClick={handleApply}
        disabled={!text.trim()}
      >
        {saved ? "Applied for next run" : "Apply"}
      </button>
    </div>
  );
}

// ─── Main Dev Mode component ──────────────────────────────────────────────────

export default function AgentDevMode({ agentId, node, workflow, runInputRef }) {
  const activeProjectId = useWorkflowStore((s) => s.activeProjectId);
  const runs            = useWorkflowStore((s) => s.runs);
  const [inspectorTab, setInspectorTab] = useState("state");

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="border-b border-hairline pb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted/50">Dev Mode</p>
        <p className="mt-1.5 text-[12px] text-muted">
          Inspect state and traces. Test this agent with Quick Run.
        </p>
      </div>

      <div className="flex min-h-0 flex-1 gap-4" style={{ minHeight: 420 }}>
        {/* Left: Inspector */}
        <div className="flex min-h-0 flex-1 flex-col" style={{ minWidth: 0 }}>
          <Inspector
            activeTab={inspectorTab}
            onTabChange={setInspectorTab}
            node={node}
            agentId={agentId}
            runs={runs}
            activeProjectId={activeProjectId}
          />
        </div>

        {/* Right: Actions */}
        <div className="slim-scroll flex w-[320px] shrink-0 flex-col gap-3 overflow-y-auto">
          <QuickRunPanel node={node} workflow={workflow} runInputRef={runInputRef} />
          <TestToolCallPanel node={node} />
          <OverridePromptPanel node={node} />
        </div>
      </div>
    </div>
  );
}
