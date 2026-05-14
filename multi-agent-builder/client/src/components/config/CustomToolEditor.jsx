import { useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronRight, Code2, Check, X } from "lucide-react";
import { makeId } from "../../utils/idUtils.js";

const TEMPLATES = {
  langgraph: `from langchain.tools import tool

@tool
def my_tool(input: str) -> str:
    """Describe what this tool does."""
    # Your logic here
    return f"Result for: {input}"
`,
  langchain: `from langchain.tools import tool

@tool
def my_tool(input: str) -> str:
    """Describe what this tool does."""
    # Your logic here
    return f"Result for: {input}"
`,
  python: `def my_tool(input: str) -> str:
    """Describe what this tool does."""
    # Your logic here
    return f"Result for: {input}"
`
};

function deriveName(code) {
  const match = code.match(/def\s+(\w+)\s*\(/);
  return match ? match[1] : "custom_tool";
}

function ToolCard({ tool, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-md border border-hairlineStrong bg-canvas">
      <div className="flex items-center gap-2 px-3 py-2">
        <button className="text-muted transition hover:text-ink" onClick={() => setExpanded((e) => !e)}>
          {expanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
        </button>
        <Code2 size={11} className="shrink-0 text-muted" />
        <span className="flex-1 truncate font-mono text-[11px] font-semibold text-ink">{tool.name}</span>
        <button className="text-muted transition hover:text-primary" onClick={onEdit} title="Edit">
          <Check size={11} />
        </button>
        <button className="text-muted transition hover:text-error" onClick={onDelete} title="Delete">
          <Trash2 size={11} />
        </button>
      </div>
      {expanded && (
        <div className="border-t border-hairline px-3 pb-3 pt-2">
          <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded bg-canvasSoft p-2 font-mono text-[10px] leading-relaxed text-body">
            {tool.code}
          </pre>
        </div>
      )}
    </div>
  );
}

function ToolForm({ initial, architecture, onSave, onCancel }) {
  const [code, setCode] = useState(initial?.code || TEMPLATES[architecture] || TEMPLATES.python);
  const name = deriveName(code);

  return (
    <div className="rounded-md border border-primary/40 bg-canvas">
      <div className="flex items-center gap-2 border-b border-hairline px-3 py-2">
        <Code2 size={11} className="text-primary" />
        <span className="flex-1 font-mono text-[11px] font-semibold text-ink">{name || "unnamed_tool"}</span>
        <span className="text-[9px] text-muted">(auto-derived from def name)</span>
      </div>
      <div className="p-3">
        <textarea
          className="input min-h-[160px] w-full resize-y font-mono text-[11px] leading-relaxed"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck={false}
        />
        <div className="mt-2 flex justify-end gap-2">
          <button className="btn h-7 px-3 text-[11px]" onClick={onCancel}>
            <X size={11} /> Cancel
          </button>
          <button
            className="btn-primary h-7 px-3 text-[11px]"
            onClick={() => onSave({ id: initial?.id || makeId("ctool"), name: deriveName(code) || "custom_tool", code })}
            disabled={!code.trim()}
          >
            <Check size={11} /> Save Tool
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CustomToolEditor({ customTools = [], architecture = "python", onChange }) {
  const [editing, setEditing] = useState(null); // null | "new" | tool.id

  function saveNew(tool) {
    onChange([...customTools, tool]);
    setEditing(null);
  }

  function saveEdit(updated) {
    onChange(customTools.map((t) => (t.id === updated.id ? updated : t)));
    setEditing(null);
  }

  function deleteTool(id) {
    onChange(customTools.filter((t) => t.id !== id));
  }

  return (
    <div className="space-y-2">
      {customTools.map((tool) =>
        editing === tool.id ? (
          <ToolForm
            key={tool.id}
            initial={tool}
            architecture={architecture}
            onSave={saveEdit}
            onCancel={() => setEditing(null)}
          />
        ) : (
          <ToolCard
            key={tool.id}
            tool={tool}
            onEdit={() => setEditing(tool.id)}
            onDelete={() => deleteTool(tool.id)}
          />
        )
      )}

      {editing === "new" ? (
        <ToolForm
          architecture={architecture}
          onSave={saveNew}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <button
          className="btn h-8 w-full justify-center gap-1.5 text-[11px]"
          onClick={() => setEditing("new")}
        >
          <Plus size={11} /> New Custom Tool
        </button>
      )}
    </div>
  );
}
