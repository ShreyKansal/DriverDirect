import { useState } from "react";
import { ChevronDown, Eye } from "lucide-react";

function estimateTokens(text) {
  return Math.ceil((text || "").length / 4);
}

export default function AgentConsoleInstructions({ node, update, isInput, isOutput }) {
  const [tipsOpen, setTipsOpen]       = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const prompt     = node.prompt || "";
  const role       = node.role   || "";
  const chars      = prompt.length;
  const tokens     = estimateTokens(prompt);
  const compiled   = [role && `[Purpose]\n${role}`, prompt && `[System Prompt]\n${prompt}`]
    .filter(Boolean)
    .join("\n\n");

  if (isOutput) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
        <p className="text-[13px] font-semibold text-ink">Instructions not available</p>
        <p className="max-w-xs text-[12px] text-muted">Output nodes do not have a system prompt.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-hairline pb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted/50">Instructions</p>
        <p className="mt-1.5 text-[12px] text-muted">System prompt that guides this agent's reasoning and output.</p>
      </div>

      {/* System prompt */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">System Prompt</label>
          <div className="flex items-center gap-3 text-[11px] text-muted">
            <span>{chars.toLocaleString()} chars</span>
            <span>~{tokens.toLocaleString()} tokens</span>
          </div>
        </div>
        <textarea
          className="slim-scroll w-full resize-y rounded-[2px] border border-hairline bg-surfaceStrong px-3 py-2.5 font-mono text-[12.5px] leading-relaxed text-ink outline-none placeholder:text-muted transition focus:border-primary"
          style={{ minHeight: 240 }}
          value={prompt}
          onChange={(e) => update({ prompt: e.target.value })}
          placeholder={
            isInput
              ? "Describe how user input should be pre-processed or formatted…"
              : "Write instructions for your agent. Tell it its role, how to format output, and how to handle edge cases."
          }
          spellCheck={false}
        />
      </div>

      {/* Preview compiled prompt */}
      <div>
        <button
          className="flex w-full items-center gap-2 rounded-[2px] border border-hairline bg-canvasSoft px-3 py-2 text-left text-[12px] font-medium text-body transition hover:bg-surfaceStrong hover:text-ink"
          onClick={() => setPreviewOpen((o) => !o)}
        >
          <Eye size={13} className="shrink-0 text-muted" />
          <span>Preview compiled prompt</span>
          <ChevronDown
            size={12}
            className={`ml-auto shrink-0 text-muted transition-transform ${previewOpen ? "" : "-rotate-90"}`}
          />
        </button>
        {previewOpen && (
          <pre className="slim-scroll mt-2 max-h-64 overflow-auto rounded-[2px] bg-canvasSoft p-3 text-[11.5px] font-mono leading-relaxed text-ink whitespace-pre-wrap">
            {compiled || "(Nothing to preview — add a purpose or system prompt above.)"}
          </pre>
        )}
      </div>

      {/* Tips */}
      <div>
        <button
          className="flex w-full items-center gap-2 rounded-[2px] border border-hairline bg-canvasSoft px-3 py-2 text-left text-[12px] font-medium text-body transition hover:bg-surfaceStrong hover:text-ink"
          onClick={() => setTipsOpen((o) => !o)}
        >
          <span>Tips for writing instructions</span>
          <ChevronDown
            size={12}
            className={`ml-auto shrink-0 text-muted transition-transform ${tipsOpen ? "" : "-rotate-90"}`}
          />
        </button>
        {tipsOpen && (
          <div className="mt-2 rounded-[2px] border border-hairline bg-canvasSoft p-4 text-[12px] text-body space-y-2">
            <p>Good instructions tell the agent:</p>
            <ul className="ml-4 list-disc space-y-1">
              <li>Its specific role in the workflow</li>
              <li>The format of its output (bullet points, JSON, markdown, prose)</li>
              <li>How to handle edge cases or missing information</li>
              <li>What to do when it cannot answer</li>
              <li>Any constraints or tone (formal, concise, detailed)</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
