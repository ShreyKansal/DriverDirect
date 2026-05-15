import { useEffect, useState, useCallback } from "react";
import {
  CheckCircle2, Eye, EyeOff, ExternalLink,
  Loader2, Trash2, TriangleAlert, Plus, Pencil
} from "lucide-react";

const BUILTIN_META = {
  groq:      { description: "Ultra-fast open-source inference",  docsUrl: "https://console.groq.com",      keyHint: "gsk_..." },
  openai:    { description: "GPT-4o, o3-mini and other models",  docsUrl: "https://platform.openai.com",   keyHint: "sk-..." },
  anthropic: { description: "Claude Opus, Sonnet, and Haiku",    docsUrl: "https://console.anthropic.com", keyHint: "sk-ant-..." },
  google:    { description: "Gemini 2.0 Flash and 1.5 Pro",      docsUrl: "https://aistudio.google.com",   keyHint: "AIza..." }
};

const CUSTOM_TYPE_LABEL = { "openai-compat": "OpenAI-compat", local: "Local", "custom-http": "Custom HTTP" };

/* ── Built-in provider row ─────────────────────────────────────────────── */
function BuiltinRow({ provider, projectId, status, onStatusChange }) {
  const [expanded, setExpanded]     = useState(!status);
  const [apiKey, setApiKey]         = useState("");
  const [showKey, setShowKey]       = useState(false);
  const [saving, setSaving]         = useState(false);
  const [testing, setTesting]       = useState(false);
  const [removing, setRemoving]     = useState(false);
  const [testResult, setTestResult] = useState(null);

  const meta = BUILTIN_META[provider.id] || {};

  async function handleSave() {
    if (!apiKey.trim()) return;
    setSaving(true); setTestResult(null);
    const res = await fetch(`/api/projects/${projectId}/keys/${provider.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey: apiKey.trim() })
    }).catch(() => null);
    setSaving(false);
    if (res?.ok) {
      const next = { preview: `${apiKey.trim().slice(0, 6)}••••••••`, updatedAt: new Date().toISOString() };
      setApiKey(""); setExpanded(false);
      onStatusChange(provider.id, next);
    }
  }

  async function handleTest() {
    if (!apiKey.trim()) return;
    setTesting(true); setTestResult(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/keys/${provider.id}/test`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKey.trim() })
      });
      setTestResult(await res.json());
    } catch { setTestResult({ ok: false, error: "Network error" }); }
    finally { setTesting(false); }
  }

  async function handleRemove() {
    setRemoving(true);
    await fetch(`/api/projects/${projectId}/keys/${provider.id}`, { method: "DELETE" }).catch(() => {});
    setRemoving(false);
    setExpanded(true); setApiKey(""); setTestResult(null);
    onStatusChange(provider.id, null);
  }

  return (
    <div className="border-b border-hairline/60 last:border-0">
      {/* Header row */}
      <div className="flex items-center gap-3 py-3 px-4">
        <div className="min-w-0 flex-1">
          <span className="text-[13px] font-medium text-ink">{provider.name}</span>
          <span className="ml-2 text-[12px] text-muted">{meta.description}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {status ? (
            <>
              <span className="flex items-center gap-1 text-[12px] text-success">
                <span className="text-[10px]">●</span> Configured
              </span>
              <button className="btn h-7 px-2.5 text-[11px]" onClick={() => setExpanded((v) => !v)}>
                {expanded ? "Cancel" : "Change"}
              </button>
              <button className="btn-danger h-7 w-7 p-0 shrink-0" onClick={handleRemove} disabled={removing} title="Remove key">
                {removing ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
              </button>
            </>
          ) : (
            <>
              <span className="flex items-center gap-1 text-[12px] text-muted">
                <span className="text-[10px]">○</span> Not configured
              </span>
              <button
                className="btn h-7 px-2.5 text-[11px]"
                onClick={() => setExpanded((v) => !v)}
              >
                Add key
              </button>
            </>
          )}
        </div>
      </div>

      {/* Expanded input */}
      {expanded && (
        <div className="px-4 pb-3 space-y-2">
          {status && (
            <p className="text-[11px] text-muted font-mono">{status.preview}</p>
          )}
          <div className="flex gap-2">
            <div className="relative min-w-0 flex-1">
              <input
                className="input w-full pr-9 font-mono text-[12px]"
                type={showKey ? "text" : "password"}
                placeholder={meta.keyHint || "API key"}
                value={apiKey}
                onChange={(e) => { setApiKey(e.target.value); setTestResult(null); }}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                autoFocus
              />
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition"
                onClick={() => setShowKey((v) => !v)} tabIndex={-1}>
                {showKey ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
            <button className="btn h-9 px-3 text-[12px]" onClick={handleTest} disabled={!apiKey.trim() || testing}>
              {testing ? <Loader2 size={12} className="animate-spin" /> : "Test"}
            </button>
            <button className="btn-primary h-9 px-3 text-[12px]" onClick={handleSave} disabled={!apiKey.trim() || saving}>
              {saving ? <Loader2 size={12} className="animate-spin" /> : (status ? "Update" : "Save")}
            </button>
          </div>
          <div className="flex items-center gap-4">
            {meta.docsUrl && (
              <a href={meta.docsUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] text-muted hover:text-ink transition">
                Get API key <ExternalLink size={10} />
              </a>
            )}
            {testResult && (
              <p className={`flex items-center gap-1 text-[11px] ${testResult.ok ? "text-success" : "text-error"}`}>
                {testResult.ok
                  ? <><CheckCircle2 size={11} /> Valid</>
                  : <><TriangleAlert size={11} /> {testResult.error}</>}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Custom provider row ───────────────────────────────────────────────── */
function CustomRow({ provider, keyStatus, onEdit, onDelete }) {
  const [removing, setRemoving] = useState(false);

  async function handleDelete() {
    if (!confirm(`Remove "${provider.name}"? This also deletes its API key.`)) return;
    setRemoving(true);
    try { onDelete(provider.id); } finally { setRemoving(false); }
  }

  const typeLabel = CUSTOM_TYPE_LABEL[provider.type] || provider.type;

  return (
    <div className="flex items-center gap-3 py-3 px-4 border-b border-hairline/60 last:border-0">
      <div className="min-w-0 flex-1">
        <span className="text-[13px] font-medium text-ink">{provider.name}</span>
        <span className="ml-2 text-[12px] text-muted">
          {typeLabel} · {provider.models?.length || 0} model{provider.models?.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {keyStatus ? (
          <span className="flex items-center gap-1 text-[12px] text-success">
            <span className="text-[10px]">●</span> Key set
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[12px] text-muted">
            <span className="text-[10px]">○</span> No key
          </span>
        )}
        <span className="text-[10px] font-medium text-muted border border-hairlineStrong rounded px-1.5 py-0.5">Custom</span>
        <button className="btn h-7 px-2.5 text-[11px] flex items-center gap-1" onClick={() => onEdit(provider)}>
          <Pencil size={10} /> Edit
        </button>
        <button className="btn-danger h-7 w-7 p-0 shrink-0" onClick={handleDelete} disabled={removing} title="Delete">
          {removing ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   Main export
══════════════════════════════════════════════════════════════════════════ */
export default function ProviderSettings({ projectId, refreshKey = 0, onAddProvider, onEditProvider }) {
  const [providers, setProviders]             = useState([]);
  const [customProviders, setCustomProviders] = useState([]);
  const [configured, setConfigured]           = useState({});
  const [loading, setLoading]                 = useState(true);

  useEffect(() => {
    if (!projectId) { setLoading(false); return; }
    setLoading(true);
    Promise.all([
      fetch(`/api/agents/providers?projectId=${projectId}`).then((r) => r.json()),
      fetch(`/api/projects/${projectId}/keys`).then((r) => r.json()),
      fetch(`/api/projects/${projectId}/custom-providers`).then((r) => r.json())
    ])
      .then(([{ providers: pList }, { configured: cfgList }, { providers: custList }]) => {
        setProviders((pList || []).filter((p) => !p.isCustom));
        setCustomProviders(custList || []);
        const map = {};
        for (const e of cfgList || []) map[e.providerId] = e;
        setConfigured(map);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectId, refreshKey]);

  const handleStatusChange = useCallback((id, status) => {
    setConfigured((prev) => {
      const next = { ...prev };
      if (status) next[id] = status; else delete next[id];
      return next;
    });
  }, []);

  async function handleDeleteCustom(id) {
    await fetch(`/api/projects/${projectId}/custom-providers/${id}`, { method: "DELETE" }).catch(() => {});
    setCustomProviders((prev) => prev.filter((p) => p.id !== id));
    setConfigured((prev) => { const next = { ...prev }; delete next[id]; return next; });
  }

  if (!projectId) {
    return <p className="text-[12px] text-muted">Save the project first before configuring provider keys.</p>;
  }

  if (loading) {
    return <div className="flex items-center gap-2 text-[12px] text-muted"><Loader2 size={13} className="animate-spin" />Loading…</div>;
  }

  return (
    <div className="rounded-md border border-hairline overflow-hidden">
      {providers.map((p) => (
        <BuiltinRow
          key={`${projectId}-${p.id}`}
          provider={p}
          projectId={projectId}
          status={configured[p.id] || null}
          onStatusChange={handleStatusChange}
        />
      ))}

      {customProviders.map((p) => (
        <CustomRow
          key={p.id}
          provider={p}
          keyStatus={configured[p.id] || null}
          onEdit={onEditProvider}
          onDelete={handleDeleteCustom}
        />
      ))}

      <div className="px-4 py-3 border-t border-hairline/60">
        <button
          className="flex items-center gap-1.5 text-[12px] text-body hover:text-ink transition"
          onClick={onAddProvider}
        >
          <Plus size={13} /> Add Custom Provider
        </button>
      </div>
    </div>
  );
}
