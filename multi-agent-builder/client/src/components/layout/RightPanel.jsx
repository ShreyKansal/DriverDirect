import { useEffect, useRef, useState } from "react";
import { Check, Code2, Settings2 } from "lucide-react";
import hljs from "highlight.js/lib/core";
import json from "highlight.js/lib/languages/json";
import "highlight.js/styles/github.css";
import { useWorkflowStore } from "../../store/workflowStore.js";
import AgentConfigPanel from "../config/AgentConfigPanel.jsx";
import { localMermaidFromGraph } from "../../utils/mermaidUtils.js";

hljs.registerLanguage("json", json);

const CODE_TABS = [
  { id: "mermaid", label: "Mermaid" },
  { id: "json",    label: "JSON"    },
];

function WorkflowCodePanel() {
  const workflow   = useWorkflowStore((s) => s.workflow);
  const [sub, setSub]     = useState("mermaid");
  const [copied, setCopied] = useState(false);
  const codeRef = useRef(null);

  const mermaid = localMermaidFromGraph(workflow);
  const jsonStr = JSON.stringify(workflow, null, 2);
  const code    = sub === "mermaid" ? mermaid : jsonStr;
  const lang    = sub === "mermaid" ? "plaintext" : "json";

  useEffect(() => {
    if (!codeRef.current) return;
    codeRef.current.removeAttribute("data-highlighted");
    codeRef.current.textContent = code;
    codeRef.current.className = `language-${lang} !bg-transparent font-mono`;
    if (lang === "json") hljs.highlightElement(codeRef.current);
  }, [code, lang]);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable */ }
  }

  if (!workflow.nodes.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <Code2 size={28} className="text-muted" />
        <p className="text-[13px] text-muted">Add nodes to see the workflow code.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-panel">
      {/* Sub-tab bar + copy */}
      <div className="flex shrink-0 items-center justify-between border-b border-hairline px-3 py-2">
        <div className="flex gap-1">
          {CODE_TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setSub(id)}
              className={`rounded px-2.5 py-1 text-[12px] font-semibold transition ${
                sub === id
                  ? "bg-[#faf4ec] text-ink"
                  : "text-muted hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          className="flex items-center gap-1.5 rounded-md border border-hairlineStrong bg-canvasSoft px-2.5 py-1.5 text-[12px] font-semibold text-muted transition hover:text-ink"
          onClick={copyCode}
        >
          {copied ? <><Check size={13} /> Copied</> : "Copy"}
        </button>
      </div>

      {/* Code */}
      <div className="min-h-0 flex-1 overflow-auto bg-[#f6f8fa] p-4">
        <pre className="m-0 bg-transparent p-0 text-[12.5px] leading-relaxed">
          <code ref={codeRef} className={`language-${lang} !bg-transparent font-mono`} />
        </pre>
      </div>

      {/* Workflow badge */}
      <div className="shrink-0 border-t border-hairline px-4 py-2">
        <span className="rounded-full border border-hairlineStrong bg-canvasSoft px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
          {workflow.builderTarget === "langchain" ? "LangChain" : "LangGraph"} · {workflow.nodes.length} nodes
        </span>
      </div>
    </div>
  );
}

const TABS = [
  { id: "config", label: "Config", Icon: Settings2 },
  { id: "code",   label: "Code",   Icon: Code2 },
];

export default function RightPanel({ showProject, onProjectSettings }) {
  const [activeTab, setActiveTab] = useState("config");

  return (
    <div className="flex h-full flex-col bg-panel">
      {/* Tab bar */}
      <div className="flex h-10 shrink-0 items-stretch border-b border-hairline bg-canvasSoft">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`relative flex flex-1 items-center justify-center gap-2 text-[12px] font-semibold transition ${
              activeTab === id ? "text-ink" : "text-muted hover:text-ink"
            }`}
          >
            <Icon size={14} />
            {label}
            {activeTab === id && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="min-h-0 flex-1 overflow-hidden">
        {activeTab === "config" && (
          <AgentConfigPanel showProject={showProject} onProjectSettings={onProjectSettings} />
        )}
        {activeTab === "code" && <WorkflowCodePanel />}
      </div>
    </div>
  );
}
