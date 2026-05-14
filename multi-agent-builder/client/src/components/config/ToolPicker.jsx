import { useState, useEffect, useRef } from "react";
import { Plus, X, Wrench, ChevronDown, Loader2, AlertTriangle } from "lucide-react";

function fuzzyMatch(query, tool) {
  const q = query.toLowerCase();
  return (
    tool.name.toLowerCase().includes(q) ||
    tool.description.toLowerCase().includes(q) ||
    (tool.module || "").toLowerCase().includes(q)
  );
}

export default function ToolPicker({ selectedTools = [], onChange }) {
  const [allTools,   setAllTools]   = useState(null);   // null = still loading
  const [fetchError, setFetchError] = useState(false);
  const [query,      setQuery]      = useState("");
  const [open,       setOpen]       = useState(false);
  const [focused,    setFocused]    = useState(0);
  const inputRef    = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetch("/api/tools/builtin")
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((data) => {
        if (Array.isArray(data?.tools) && data.tools.length > 0) {
          setAllTools(data.tools);
        } else {
          setFetchError(true);
        }
      })
      .catch(() => setFetchError(true));
  }, []);

  const tools    = allTools || [];
  const filtered = query.trim()
    ? tools.filter((t) => fuzzyMatch(query, t) && !selectedTools.find((s) => s.id === t.id))
    : tools.filter((t) => !selectedTools.find((s) => s.id === t.id));

  function addTool(tool) {
    onChange([...selectedTools, tool]);
    setQuery("");
    setOpen(false);
    inputRef.current?.focus();
  }

  function removeTool(id) {
    onChange(selectedTools.filter((t) => t.id !== id));
  }

  function onKeyDown(e) {
    if (!open) { if (e.key === "ArrowDown" || e.key === "Enter") setOpen(true); return; }
    if      (e.key === "ArrowDown") { e.preventDefault(); setFocused((f) => Math.min(f + 1, filtered.length - 1)); }
    else if (e.key === "ArrowUp")   { e.preventDefault(); setFocused((f) => Math.max(f - 1, 0)); }
    else if (e.key === "Enter")     { e.preventDefault(); if (filtered[focused]) addTool(filtered[focused]); }
    else if (e.key === "Escape")    { setOpen(false); }
  }

  useEffect(() => { setFocused(0); }, [query]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (!dropdownRef.current?.contains(e.target) && e.target !== inputRef.current) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const isLoading  = allTools === null && !fetchError;
  const isDisabled = isLoading || fetchError;

  const borderClass = fetchError
    ? "border-red-400/50 bg-red-400/5"
    : "border-hairlineStrong bg-canvas focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20";

  const placeholder = isLoading  ? "Loading tools…"
    : fetchError ? "Server unreachable — restart the server"
    : "Add a built-in tool…";

  return (
    <div className="space-y-2">
      {/* Selected tool pills */}
      {selectedTools.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedTools.map((tool) => (
            <span
              key={tool.id}
              className="flex items-center gap-1 rounded-full border border-primary/30 bg-primary/8 px-2.5 py-0.5 text-[11px] font-medium text-primary"
            >
              <Wrench size={9} />
              {tool.name}
              <button className="ml-0.5 text-primary/60 hover:text-primary" onClick={() => removeTool(tool.id)}>
                <X size={9} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <div className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 ${borderClass}`}>
          {isLoading
            ? <Loader2 size={11} className="shrink-0 animate-spin text-muted" />
            : fetchError
            ? <AlertTriangle size={11} className="shrink-0 text-red-400" />
            : <Plus size={11} className="shrink-0 text-muted" />}

          <input
            ref={inputRef}
            className="min-w-0 flex-1 bg-transparent text-[12px] text-ink placeholder:text-muted focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            placeholder={placeholder}
            value={query}
            disabled={isDisabled}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
          />

          {!isDisabled && (
            <ChevronDown
              size={11}
              className={`shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
              onClick={() => setOpen((o) => !o)}
            />
          )}
        </div>

        {/* Dropdown */}
        {open && filtered.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-auto rounded-md border border-hairlineStrong bg-panel shadow-lg"
          >
            {filtered.slice(0, 12).map((tool, i) => (
              <button
                key={tool.id}
                className={`flex w-full flex-col items-start px-3 py-2 text-left transition-colors ${
                  i === focused ? "bg-primary/8 text-primary" : "hover:bg-canvasSoft"
                }`}
                onMouseEnter={() => setFocused(i)}
                onClick={() => addTool(tool)}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="text-[12px] font-semibold text-ink">{tool.name}</span>
                  {tool.package && (
                    <span className="rounded bg-canvasSoft px-1.5 py-0.5 font-mono text-[9px] text-muted">
                      {tool.package}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-muted">{tool.module || "built-in"}</span>
                <span className="text-[10px] text-body">{tool.description}</span>
              </button>
            ))}
          </div>
        )}

        {open && query.trim() && filtered.length === 0 && !isDisabled && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-md border border-hairline bg-panel px-3 py-3 text-[11px] text-muted shadow-lg">
            No matching tools found for &ldquo;{query}&rdquo;
          </div>
        )}
      </div>
    </div>
  );
}
