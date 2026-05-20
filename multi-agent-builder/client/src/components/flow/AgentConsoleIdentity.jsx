import { useState } from "react";
import { useWorkflowStore } from "../../store/workflowStore.js";
import { NODE_TYPE_LABELS } from "../../utils/graphUtils.js";

const INPUT_MODE_OPTIONS = [
  { value: "direct",   label: "User Input",  desc: "Receives the user's message directly" },
  { value: "previous", label: "From Workflow", desc: "Receives output from a previous agent" },
  { value: "both",     label: "Either",      desc: "Can receive from user or previous agents" },
];

const TYPE_OPTIONS = [
  { value: "agent",       label: "Agent",       desc: "Processes tasks using AI and tools" },
  { value: "orchestrator",label: "Orchestrator", desc: "Routes messages to other agents"   },
  { value: "user_input",  label: "Input",       desc: "Entry point for user messages"      },
  { value: "output",      label: "Output",      desc: "Final step that formats the result" },
];

const vc = {
  label:    "mb-1 block text-[13px] font-semibold text-ink",
  textarea: "w-full resize-y rounded-[2px] border border-hairline bg-surfaceStrong px-[10px] py-[7px] text-[13px] text-ink outline-none placeholder:text-muted transition focus:border-primary focus:outline-none leading-[1.45] slim-scroll",
  input:    "h-[32px] w-full rounded-[2px] border border-hairline bg-surfaceStrong px-[10px] text-[13px] text-ink outline-none placeholder:text-muted transition focus:border-primary focus:outline-none",
};

export default function AgentConsoleIdentity({ node, update }) {
  const setStatusMessage = useWorkflowStore((s) => s.setStatusMessage);
  const workflow         = useWorkflowStore((s) => s.workflow);

  const roleChars  = (node.role || "").length;

  function handleTypeChange(newType) {
    const existingOrch  = workflow.nodes.find((n) => n.type === "orchestrator" && n.id !== node.id);
    const existingInput = workflow.nodes.find((n) => n.type === "user_input"   && n.id !== node.id);
    if (newType === "orchestrator" && existingOrch)  { setStatusMessage("Only one orchestrator allowed."); return; }
    if (newType === "user_input"   && existingInput) { setStatusMessage("Only one Input node allowed.");   return; }
    update({ type: newType });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[18px] font-semibold text-ink">{node.name || "Agent"}</h2>
        <p className="mt-0.5 text-[12px] text-muted">Identity — who is this agent and what is its role?</p>
      </div>

      {/* Name */}
      <div>
        <label className={vc.label}>Name</label>
        <input
          className="h-[38px] w-full rounded-[2px] border border-hairline bg-surfaceStrong px-3 text-[15px] font-semibold text-ink outline-none placeholder:text-muted transition focus:border-primary"
          value={node.name || ""}
          onChange={(e) => update({ name: e.target.value })}
          placeholder="Agent name…"
        />
      </div>

      {/* Role / Purpose */}
      <div>
        <label className={vc.label}>
          Role / Purpose
          <span className="ml-2 text-[11px] font-normal text-muted">{roleChars} chars</span>
        </label>
        <textarea
          className={`${vc.textarea} min-h-[80px]`}
          value={node.role || ""}
          onChange={(e) => update({ role: e.target.value })}
          placeholder="Describe what this agent does in the workflow. This is prepended to the system prompt."
        />
        <p className="mt-1 text-[11px] text-muted">
          Prepended to the system prompt. Helps the AI understand its position in the workflow.
        </p>
      </div>

      {/* Node Type */}
      <div>
        <label className={vc.label}>Node Type</label>
        <div className="grid grid-cols-2 gap-2">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleTypeChange(opt.value)}
              className={`rounded-[4px] border px-3 py-2.5 text-left transition ${
                node.type === opt.value
                  ? "border-primary bg-primary/8 text-ink"
                  : "border-hairline bg-canvasSoft text-body hover:border-hairlineStrong hover:text-ink"
              }`}
            >
              <p className={`text-[12px] font-semibold ${node.type === opt.value ? "text-primary" : "text-ink"}`}>
                {opt.label}
              </p>
              <p className="mt-0.5 text-[11px] text-muted">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Input Mode (only for agent/orchestrator/user_input) */}
      {(node.type === "agent" || node.type === "orchestrator" || node.type === "user_input") && (
        <div>
          <label className={vc.label}>Input Source</label>
          <div className="space-y-2">
            {INPUT_MODE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => update({ inputMode: opt.value })}
                className={`flex w-full items-center gap-3 rounded-[2px] border px-3 py-2 text-left transition ${
                  (node.inputMode || "direct") === opt.value
                    ? "border-primary bg-primary/8"
                    : "border-hairline bg-canvasSoft hover:border-hairlineStrong"
                }`}
              >
                <div className={`h-3.5 w-3.5 shrink-0 rounded-full border-2 ${
                  (node.inputMode || "direct") === opt.value
                    ? "border-primary bg-primary"
                    : "border-muted"
                }`} />
                <div>
                  <p className="text-[12px] font-medium text-ink">{opt.label}</p>
                  <p className="text-[11px] text-muted">{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
