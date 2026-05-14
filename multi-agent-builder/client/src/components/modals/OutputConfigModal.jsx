import { useState } from "react";
import { X } from "lucide-react";

export default function OutputConfigModal({ agent, onSave, onClose }) {
  const [format, setFormat] = useState(agent.outputFormat || "markdown");
  const [jsonSchema, setJsonSchema] = useState(agent.jsonSchema || "");
  const [stripWhitespace, setStripWhitespace] = useState(agent.postProcess?.stripWhitespace || false);
  const [extractJson, setExtractJson] = useState(agent.postProcess?.extractJson || false);

  function handleSave() {
    onSave({
      outputFormat: format,
      jsonSchema: format === "json" ? jsonSchema : "",
      postProcess: { stripWhitespace, extractJson }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="w-[420px] rounded-xl border border-hairline bg-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
          <h2 className="text-sm font-semibold text-ink">Output Configuration</h2>
          <button className="icon-btn h-7 w-7" onClick={onClose}>
            <X size={13} />
          </button>
        </div>

        <div className="space-y-4 p-4">
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted">Output Format</p>
            <div className="space-y-1.5">
              {[
                { value: "plain_text", label: "Plain Text", desc: "Raw text, no formatting." },
                { value: "markdown", label: "Markdown", desc: "Markdown-formatted response." },
                { value: "json", label: "JSON", desc: "Structured JSON object." }
              ].map((opt) => (
                <label
                  key={opt.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-2.5 transition ${
                    format === opt.value ? "border-primary bg-primary/5" : "border-hairline bg-canvasSoft"
                  }`}
                >
                  <input
                    type="radio"
                    name="format"
                    value={opt.value}
                    checked={format === opt.value}
                    onChange={() => setFormat(opt.value)}
                    className="mt-0.5"
                  />
                  <div>
                    <p className="text-xs font-medium text-ink">{opt.label}</p>
                    <p className="text-[11px] text-muted">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {format === "json" && (
            <label className="field">
              <span>JSON Schema (optional)</span>
              <textarea
                className="input min-h-24 resize-y font-mono text-xs"
                value={jsonSchema}
                onChange={(e) => setJsonSchema(e.target.value)}
                placeholder={'{ "type": "object", "properties": { ... } }'}
              />
            </label>
          )}

          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted">Post-processing</p>
            <div className="space-y-1.5">
              <label className="flex cursor-pointer items-center gap-2 rounded border border-hairline bg-canvasSoft px-3 py-2 text-xs text-body">
                <input
                  type="checkbox"
                  checked={stripWhitespace}
                  onChange={(e) => setStripWhitespace(e.target.checked)}
                />
                Strip leading / trailing whitespace
              </label>
              <label className="flex cursor-pointer items-center gap-2 rounded border border-hairline bg-canvasSoft px-3 py-2 text-xs text-body">
                <input
                  type="checkbox"
                  checked={extractJson}
                  onChange={(e) => setExtractJson(e.target.checked)}
                />
                Extract first JSON block from response
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-hairline px-4 py-3">
          <button className="btn h-8 px-4 text-xs" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary h-8 px-4 text-xs" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
