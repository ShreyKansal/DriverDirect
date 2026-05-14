import { useState } from "react";
import { GitBranch, Link2, Code2, CheckCircle2, X } from "lucide-react";
import { useWorkflowStore } from "../../store/workflowStore.js";
import { BUILDER_TARGETS } from "../../utils/graphUtils.js";

const ICONS = {
  langgraph: <GitBranch size={28} />,
  langchain: <Link2 size={28} />,
  python:    <Code2 size={28} />
};

const FEATURES = {
  langgraph: ["Stateful graph execution", "Conditional edge routing", "Cyclic workflows & memory", "Parallel branches"],
  langchain: ["Sequential agent chains", "Simple pipeline setup", "Built-in tool integrations", "Easy to get started"],
  python:    ["Raw Python functions", "No framework lock-in", "Custom tool definitions", "Full control & flexibility"]
};

export default function ArchitecturePicker() {
  const setArchitecture             = useWorkflowStore((s) => s.setArchitecture);
  const cancelArchitectureSelection = useWorkflowStore((s) => s.cancelArchitectureSelection);
  const workflow                    = useWorkflowStore((s) => s.workflow);
  const [selected, setSelected] = useState("langgraph");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-xl border border-hairlineStrong bg-panel shadow-2xl">
        {/* Header */}
        <div className="relative border-b border-hairline px-6 py-5">
          <p className="text-[18px] font-bold text-ink">Choose your architecture</p>
          <p className="mt-1 text-[13px] text-muted">
            This sets the framework for <span className="font-semibold text-ink">{workflow.name || "your project"}</span>. You can change it later in Project Settings.
          </p>
          <button
            onClick={cancelArchitectureSelection}
            className="absolute right-4 top-4 rounded-md p-1 text-muted hover:bg-surfaceStrong hover:text-ink transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-3 gap-3 p-6">
          {BUILDER_TARGETS.map((t) => {
            const isSelected = selected === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setSelected(t.id)}
                className={`flex flex-col items-start rounded-lg border p-4 text-left transition-all ${
                  isSelected
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-hairlineStrong bg-canvas hover:border-primary/40 hover:bg-canvasSoft"
                }`}
              >
                <div className={`mb-3 rounded-md p-2 ${isSelected ? "bg-primary text-white" : "bg-surfaceStrong text-ink"}`}>
                  {ICONS[t.id]}
                </div>
                <p className="text-[14px] font-bold text-ink">{t.label}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-muted">{t.description}</p>
                <ul className="mt-3 space-y-1.5">
                  {FEATURES[t.id].map((f) => (
                    <li key={f} className="flex items-center gap-1.5 text-[11px] text-body">
                      <CheckCircle2 size={10} className={isSelected ? "text-primary" : "text-muted"} />
                      {f}
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-hairline px-6 py-4">
          <p className="flex-1 text-[11px] text-muted">
            Selected: <span className="font-semibold text-ink">{BUILDER_TARGETS.find((t) => t.id === selected)?.label}</span>
          </p>
          <button
            className="btn-primary h-9 px-5 text-sm"
            onClick={() => setArchitecture(selected)}
          >
            Confirm &amp; Start Building
          </button>
        </div>
      </div>
    </div>
  );
}
