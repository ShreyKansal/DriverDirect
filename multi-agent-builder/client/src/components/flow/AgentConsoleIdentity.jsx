import { useWorkflowStore } from "../../store/workflowStore.js";
import { nodeIcon } from "../ui/entityIcons.jsx";

const INPUT_MODE_OPTIONS = [
  { value: "direct",   label: "User Input",    desc: "Receives the user's message directly"  },
  { value: "previous", label: "From Workflow",  desc: "Receives output from a previous agent" },
  { value: "both",     label: "Either",         desc: "Can receive from user or previous agents" },
];

const TYPE_OPTIONS = [
  { value: "agent",        label: "Agent",        desc: "Processes tasks using AI and tools"  },
  { value: "orchestrator", label: "Orchestrator",  desc: "Routes messages to other agents"    },
  { value: "user_input",   label: "Input",         desc: "Entry point for user messages"      },
  { value: "output",       label: "Output",        desc: "Final step that formats the result" },
];

export default function AgentConsoleIdentity({ node, update }) {
  const setStatusMessage = useWorkflowStore((s) => s.setStatusMessage);
  const workflow         = useWorkflowStore((s) => s.workflow);
  const roleChars        = (node.role || "").length;

  function handleTypeChange(newType) {
    const existingOrch  = workflow.nodes.find((n) => n.type === "orchestrator" && n.id !== node.id);
    const existingInput = workflow.nodes.find((n) => n.type === "user_input"   && n.id !== node.id);
    if (newType === "orchestrator" && existingOrch)  { setStatusMessage("Only one orchestrator allowed."); return; }
    if (newType === "user_input"   && existingInput) { setStatusMessage("Only one Input node allowed.");   return; }
    update({ type: newType });
  }

  const activeMode = node.inputMode || "direct";

  return (
    <div className="space-y-8">

      {/* Name — title editor feel */}
      <div>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">Agent Name</p>
        <input
          className="w-full border-0 border-b border-hairlineStrong bg-transparent pb-1.5 text-[22px] font-bold text-ink outline-none placeholder:text-muted/40 transition-colors focus:border-primary"
          value={node.name || ""}
          onChange={(e) => update({ name: e.target.value })}
          placeholder="Unnamed Agent"
          spellCheck={false}
        />
      </div>

      {/* Role / Purpose */}
      <div>
        <div className="mb-1.5 flex items-baseline gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">Purpose</p>
          {roleChars > 0 && (
            <span className="text-[10px] text-muted/60">{roleChars} chars</span>
          )}
        </div>
        <textarea
          className="slim-scroll w-full resize-y rounded-[2px] border border-hairline bg-surfaceStrong px-3 py-2.5 text-[13px] leading-relaxed text-ink outline-none placeholder:text-muted/60 transition focus:border-primary"
          style={{ minHeight: 72 }}
          value={node.role || ""}
          onChange={(e) => update({ role: e.target.value })}
          placeholder="What does this agent do in the workflow? This text is prepended to the system prompt."
        />
      </div>

      {/* Node Type — icon + label cards */}
      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">Node Type</p>
        <div className="grid grid-cols-2 gap-1.5">
          {TYPE_OPTIONS.map((opt) => {
            const active = node.type === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleTypeChange(opt.value)}
                className={`group relative flex items-start gap-2.5 rounded-[3px] border px-3 py-2.5 text-left transition-all ${
                  active
                    ? "border-primary/60 bg-primary/6"
                    : "border-hairline bg-canvasSoft hover:border-hairlineStrong hover:bg-surfaceStrong"
                }`}
              >
                {/* Active indicator stripe */}
                {active && (
                  <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-primary" />
                )}
                <span className="mt-[1px] shrink-0">
                  {nodeIcon(opt.value, 14)}
                </span>
                <div className="min-w-0">
                  <p className={`text-[12px] font-semibold leading-tight ${active ? "text-ink" : "text-ink"}`}>
                    {opt.label}
                  </p>
                  <p className="mt-0.5 text-[10.5px] leading-snug text-muted">{opt.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Input Source — horizontal segmented control */}
      {(node.type === "agent" || node.type === "orchestrator" || node.type === "user_input") && (
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">Input Source</p>
          <div
            className="flex gap-px rounded-[3px] border border-hairline bg-canvasSoft p-[3px]"
            role="radiogroup"
          >
            {INPUT_MODE_OPTIONS.map((opt) => {
              const active = activeMode === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => update({ inputMode: opt.value })}
                  title={opt.desc}
                  className={`flex-1 rounded-[2px] px-3 py-1.5 text-center text-[12px] font-medium transition-all ${
                    active
                      ? "bg-panel text-ink shadow-sm"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 text-[11px] text-muted">
            {INPUT_MODE_OPTIONS.find((o) => o.value === activeMode)?.desc}
          </p>
        </div>
      )}

    </div>
  );
}
