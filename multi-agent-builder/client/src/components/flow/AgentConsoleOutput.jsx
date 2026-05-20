import { useState } from "react";
import { ChevronRight } from "lucide-react";
import Select from "../ui/Select.jsx";
import OutputConfigModal from "../modals/OutputConfigModal.jsx";

const FORMAT_OPTIONS = [
  { value: "plain_text", label: "Plain Text"  },
  { value: "markdown",   label: "Markdown"    },
  { value: "json",       label: "JSON"        },
];

export default function AgentConsoleOutput({ node, update }) {
  const [showModal, setShowModal] = useState(false);

  const isExecutable = node.type === "agent" || node.type === "orchestrator";

  if (!isExecutable) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
        <p className="text-[13px] font-semibold text-ink">Output not configurable</p>
        <p className="max-w-xs text-[12px] text-muted">
          Only Agent and Orchestrator nodes have output configuration.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-hairline pb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted/50">Output</p>
        <p className="mt-1.5 text-[12px] text-muted">Format and labeling for this agent's results.</p>
      </div>

      <div>
        <label className="mb-1 block text-[13px] font-semibold text-ink">Output Format</label>
        <Select
          variant="settings"
          value={node.outputFormat || "plain_text"}
          onChange={(v) => update({ outputFormat: v })}
          options={FORMAT_OPTIONS}
        />
        <p className="mt-1 text-[11px] text-muted">
          How the agent's response is formatted when passed to the next step.
        </p>
      </div>

      <div>
        <label className="mb-1 block text-[13px] font-semibold text-ink">Output Prefix</label>
        <input
          className="h-[32px] w-full rounded-[2px] border border-hairline bg-surfaceStrong px-3 text-[13px] text-ink outline-none transition focus:border-primary placeholder:text-muted"
          value={node.outputPrefix || ""}
          onChange={(e) => update({ outputPrefix: e.target.value })}
          placeholder="Optional label for this agent's output…"
        />
        <p className="mt-1 text-[11px] text-muted">
          Added before this agent's output in the final results.
        </p>
      </div>

      <div>
        <label className="mb-2 block text-[13px] font-semibold text-ink">Output Schema</label>
        <button
          className="flex w-full items-center justify-between rounded-[2px] border border-hairline bg-canvasSoft px-3 py-2 text-[12px] font-medium text-body transition hover:bg-surfaceStrong hover:text-ink"
          onClick={() => setShowModal(true)}
        >
          <span>Configure Output Schema</span>
          <ChevronRight size={13} className="text-muted" />
        </button>
        <p className="mt-1 text-[11px] text-muted">
          Define a JSON schema to validate and shape structured outputs.
        </p>
      </div>

      {showModal && (
        <OutputConfigModal
          agent={node}
          onUpdate={update}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
