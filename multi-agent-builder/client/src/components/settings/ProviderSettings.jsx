import { useEffect, useState, useCallback } from "react";
import {
  CheckCircle2, Eye, EyeOff, ExternalLink,
  Loader2, Trash2, TriangleAlert, Plus, Pencil, RefreshCw, ChevronDown
} from "lucide-react";
import { useWorkflowStore } from "../../store/workflowStore.js";
import { currentUserKey, userHeaders } from "../../utils/authHeaders.js";

// ─── Provider metadata ──────────────────────────────────────────────────────────

const PROVIDER_META = {
  groq:      { name: "Groq",      description: "Ultra-fast open-source inference",  docsUrl: "https://console.groq.com",      keyHint: "gsk_...",     color: "#7c3aed", initials: "G" },
  openai:    { name: "OpenAI",    description: "GPT-4o, o3-mini and other models",  docsUrl: "https://platform.openai.com",   keyHint: "sk-...",      color: "#059669", initials: "O" },
  anthropic: { name: "Anthropic", description: "Claude Opus, Sonnet, and Haiku",    docsUrl: "https://console.anthropic.com", keyHint: "sk-ant-...",  color: "#d97706", initials: "A" },
  google:    { name: "Gemini",    description: "Gemini 2.0 Flash and 1.5 Pro",      docsUrl: "https://aistudio.google.com",   keyHint: "AIza...",     color: "#2563eb", initials: "G" },
};

const CUSTOM_TYPE_LABEL = { "openai-compat": "OpenAI-compat", local: "Local", "custom-http": "Custom HTTP" };

// ─── Shared helpers ─────────────────────────────────────────────────────────────

async function safeJson(res) {
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch {
    throw new Error(res.ok
      ? `Unexpected response (${res.status})`
      : `Server error (${res.status}) — is the backend running on port 4000?`);
  }
  if (!res.ok) throw new Error(json?.error || json?.message || `Server error (${res.status})`);
  return json;
}

async function safeFetchJson(url, options = {}) {
  const response = await fetch(url, options);
  return safeJson(response);
}

async function loadSavedKey(url, headers) {
  const json = await safeFetchJson(url, { headers });
  return json.apiKey || "";
}

function ProviderDot({ providerId, size = 22 }) {
  const meta = PROVIDER_META[providerId] || { color: "#6b7280", initials: "?" };
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded font-semibold text-white"
      style={{ width: size, height: size, fontSize: size * 0.48, backgroundColor: meta.color }}
    >
      {meta.initials}
    </span>
  );
}

// ─── Inline key editor (shared by both card and table modes) ────────────────────

function KeyEditor({ keyHint, docsUrl, status, saving, testing, testResult, saveError, apiKey, setApiKey, showKey, setShowKey, onSave, onTest, onCancel }) {
  return (
    <div className="flex flex-col gap-2">
      {status && (
        <p className="font-mono text-[11px] text-body">{status.preview}</p>
      )}
      <div className="flex items-center gap-1.5">
        <div className="relative min-w-0 flex-1 max-w-[360px]">
          <input
            className="h-[32px] w-full rounded-[2px] border border-hairline bg-surfaceStrong pl-[10px] pr-8 font-mono text-[12px] text-ink placeholder-muted transition focus:border-primary focus:outline-none"
            type={showKey ? "text" : "password"}
            placeholder={keyHint || "API key"}
            value={apiKey}
            onChange={(e) => { setApiKey(e.target.value); }}
            onKeyDown={(e) => e.key === "Enter" && onSave()}
            autoFocus
          />
          <button
            tabIndex={-1}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition"
            onClick={() => setShowKey(v => !v)}
          >
            {showKey ? <EyeOff size={12} /> : <Eye size={12} />}
          </button>
        </div>
        <button
          className="h-[26px] rounded-[2px] border border-hairline bg-canvasSoft px-2.5 text-[12px] text-ink hover:bg-panel disabled:opacity-40 transition"
          onClick={onTest}
          disabled={!apiKey.trim() || testing}
        >
          {testing ? <Loader2 size={11} className="animate-spin" /> : "Test"}
        </button>
        <button
          className="h-[26px] rounded-[2px] border border-primary bg-primary px-2.5 text-[12px] text-white hover:opacity-80 disabled:opacity-40 transition"
          onClick={onSave}
          disabled={!apiKey.trim() || saving}
        >
          {saving ? <Loader2 size={11} className="animate-spin" /> : (status ? "Update" : "Save")}
        </button>
        {onCancel && (
          <button
            className="h-[26px] rounded-[2px] border border-hairline bg-canvasSoft px-2.5 text-[12px] text-ink hover:bg-panel transition"
            onClick={onCancel}
          >
            Cancel
          </button>
        )}
      </div>
      <div className="flex items-center gap-4 min-h-[18px]">
        {docsUrl && (
          <a href={docsUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-[11px] text-body hover:text-primary transition">
            Get API key <ExternalLink size={10} />
          </a>
        )}
        {testResult && (
          <span className={`flex items-center gap-1 text-[11px] ${testResult.ok ? "text-success" : "text-error"}`}>
            {testResult.ok ? <><CheckCircle2 size={11} /> Valid</> : <><TriangleAlert size={11} /> {testResult.error}</>}
          </span>
        )}
        {saveError && (
          <span className="flex items-center gap-1 text-[11px] text-error">
            <TriangleAlert size={11} /> {saveError}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Card mode (legacy, kept for backward compat) ───────────────────────────────

function BuiltinCard({ provider, projectId, global: isGlobal, status, onStatusChange }) {
  const [expanded, setExpanded] = useState(!status);
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const currentUser = useWorkflowStore((s) => s.currentUser);
  const userId = currentUserKey(currentUser);

  const meta = PROVIDER_META[provider.id] || {};
  const keyUrl = isGlobal ? `/api/keys/${provider.id}` : `/api/projects/${projectId}/keys/${provider.id}`;
  const testUrl = isGlobal ? `/api/keys/${provider.id}/test` : `/api/projects/${projectId}/keys/${provider.id}/test`;

  useEffect(() => {
    if (!expanded || !status) return;

    let cancelled = false;
    loadSavedKey(keyUrl, userHeaders(userId))
      .then((savedKey) => {
        if (!cancelled) setApiKey(savedKey);
      })
      .catch((error) => {
        if (!cancelled) setSaveError(error.message || "Failed to load saved key.");
      });

    return () => {
      cancelled = true;
    };
  }, [expanded, keyUrl, status, userId]);

  async function handleSave() {
    if (!apiKey.trim()) return;
    setSaving(true); setTestResult(null); setSaveError(null);
    try {
      const res = await fetch(keyUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...userHeaders(userId) },
        body: JSON.stringify({ apiKey: apiKey.trim() })
      });
      if (res.ok) {
        const next = { preview: `${apiKey.trim().slice(0, 6)}••••••••`, updatedAt: new Date().toISOString() };
        setApiKey(""); setExpanded(false); setSaveError(null);
        onStatusChange(provider.id, next);
      } else {
        const data = await res.json().catch(() => ({}));
        setSaveError(data.error || `Save failed (${res.status})`);
      }
    } catch { setSaveError("Network error — is the server running?"); }
    setSaving(false);
  }

  async function handleTest() {
    if (!apiKey.trim()) return;
    setTesting(true); setTestResult(null);
    try {
      const res = await fetch(testUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...userHeaders(userId) },
        body: JSON.stringify({ apiKey: apiKey.trim() })
      });
      setTestResult(await res.json());
    } catch { setTestResult({ ok: false, error: "Network error" }); }
    setTesting(false);
  }

  async function handleRemove() {
    setRemoving(true); setSaveError(null);
    try {
      const res = await fetch(keyUrl, { method: "DELETE", headers: userHeaders(userId) });
      if (res.ok) { setExpanded(true); setApiKey(""); setTestResult(null); onStatusChange(provider.id, null); }
      else { const data = await res.json().catch(() => ({})); setSaveError(data.error || `Remove failed (${res.status})`); }
    } catch { setSaveError("Network error — is the server running?"); }
    setRemoving(false);
  }

  return (
    <div className="rounded-xl border border-hairline bg-panel overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <ProviderDot providerId={provider.id} size={36} />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-ink">{meta.name || provider.name}</p>
          <p className="text-[11px] text-muted">{meta.description}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {status ? (
            <>
              <span className="flex items-center gap-1 text-[11px] text-success font-medium">
                <CheckCircle2 size={12} /> Configured
              </span>
              <button className="btn h-7 px-2.5 text-[11px]" onClick={() => setExpanded(v => !v)}>
                {expanded ? "Cancel" : "Change"}
              </button>
              <button className="btn-danger h-7 w-7 p-0 shrink-0" onClick={handleRemove} disabled={removing}>
                {removing ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
              </button>
            </>
          ) : (
            <>
              <span className="flex items-center gap-1 text-[11px] text-muted">
                <span className="h-2 w-2 rounded-full bg-muted/40 inline-block" /> Not configured
              </span>
              <button className="btn-primary h-7 px-2.5 text-[11px]" onClick={() => setExpanded(v => !v)}>
                Add key
              </button>
            </>
          )}
        </div>
      </div>
      {expanded && (
        <div className="border-t border-hairline/60 bg-canvas px-4 py-3">
          <KeyEditor
            keyHint={meta.keyHint}
            docsUrl={meta.docsUrl}
            status={status}
            saving={saving}
            testing={testing}
            testResult={testResult}
            saveError={saveError}
            apiKey={apiKey}
            setApiKey={setApiKey}
            showKey={showKey}
            setShowKey={setShowKey}
            onSave={handleSave}
            onTest={handleTest}
          />
        </div>
      )}
    </div>
  );
}

// ─── Table row (table mode) ─────────────────────────────────────────────────────

// ─── 2-column table rows ────────────────────────────────────────────────────────

function BuiltinTableRow({ provider, projectId, isGlobal, status, onStatusChange, isEditing, onToggleEdit }) {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const currentUser = useWorkflowStore((s) => s.currentUser);
  const userId = currentUserKey(currentUser);

  const meta = PROVIDER_META[provider.id] || {};
  const keyUrl = isGlobal ? `/api/keys/${provider.id}` : `/api/projects/${projectId}/keys/${provider.id}`;
  const testUrl = isGlobal ? `/api/keys/${provider.id}/test` : `/api/projects/${projectId}/keys/${provider.id}/test`;

  useEffect(() => {
    if (!isEditing || !status) return;

    let cancelled = false;
    loadSavedKey(keyUrl, userHeaders(userId))
      .then((savedKey) => {
        if (!cancelled) setApiKey(savedKey);
      })
      .catch((error) => {
        if (!cancelled) setSaveError(error.message || "Failed to load saved key.");
      });

    return () => {
      cancelled = true;
    };
  }, [isEditing, keyUrl, status, userId]);

  function handleCancel() { setApiKey(""); setTestResult(null); setSaveError(null); onToggleEdit(); }

  async function handleSave() {
    if (!apiKey.trim()) return;
    setSaving(true); setTestResult(null); setSaveError(null);
    try {
      const res = await fetch(keyUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...userHeaders(userId) },
        body: JSON.stringify({ apiKey: apiKey.trim() })
      });
      if (res.ok) {
        onStatusChange(provider.id, { preview: `${apiKey.trim().slice(0, 6)}••••••••`, updatedAt: new Date().toISOString() });
        setApiKey(""); onToggleEdit();
      } else {
        const d = await res.json().catch(() => ({}));
        setSaveError(d.error || `Save failed (${res.status})`);
      }
    } catch { setSaveError("Network error — is the server running?"); }
    setSaving(false);
  }

  async function handleTest() {
    if (!apiKey.trim()) return;
    setTesting(true); setTestResult(null);
    try {
      const res = await fetch(testUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...userHeaders(userId) },
        body: JSON.stringify({ apiKey: apiKey.trim() })
      });
      setTestResult(await res.json());
    } catch { setTestResult({ ok: false, error: "Network error" }); }
    setTesting(false);
  }

  async function handleRemove() {
    setRemoving(true);
    try {
      const res = await fetch(keyUrl, { method: "DELETE", headers: userHeaders(userId) });
      if (res.ok) { onStatusChange(provider.id, null); setApiKey(""); setTestResult(null); }
    } catch {}
    setRemoving(false);
  }

  return (
    <>
      {/* Main row */}
      <tr className={`border-b border-hairlineSoft ${isEditing ? "bg-primary/5" : "hover:bg-canvasSoft"}`}>
        {/* Provider name */}
        <td className="w-[180px] py-2 pl-3 pr-2">
          <div className="flex items-center gap-2">
            <ProviderDot providerId={provider.id} size={18} />
            <span className="text-[13px] text-ink">{meta.name || provider.name}</span>
          </div>
        </td>
        {/* Key value + inline actions */}
        <td className="py-2 pl-2 pr-3">
          {isEditing ? (
            <KeyEditor
              keyHint={meta.keyHint}
              docsUrl={meta.docsUrl}
              status={status}
              saving={saving}
              testing={testing}
              testResult={testResult}
              saveError={saveError}
              apiKey={apiKey}
              setApiKey={setApiKey}
              showKey={showKey}
              setShowKey={setShowKey}
              onSave={handleSave}
              onTest={handleTest}
              onCancel={handleCancel}
            />
          ) : (
            <div className="flex items-center gap-3">
              {status ? (
                <>
                  <span className="flex items-center gap-1.5 font-mono text-[12px] text-body">
                    <CheckCircle2 size={11} className="text-success shrink-0" />
                    {status.preview}
                  </span>
                  <button
                    onClick={onToggleEdit}
                    className="h-[20px] rounded-[2px] border border-hairline bg-canvasSoft px-2 text-[11px] text-body hover:bg-panel transition"
                  >
                    Change
                  </button>
                  <button
                    onClick={handleRemove}
                    disabled={removing}
                    className="flex h-[20px] w-[20px] items-center justify-center rounded-[2px] border border-hairline bg-panel text-error hover:bg-error/5 disabled:opacity-40 transition"
                    title="Remove key"
                  >
                    {removing ? <Loader2 size={10} className="animate-spin" /> : <Trash2 size={10} />}
                  </button>
                </>
              ) : (
                <>
                  <span className="text-[12px] text-muted">Not configured</span>
                  <button
                    onClick={onToggleEdit}
                    className="h-[20px] rounded-[2px] border border-hairline bg-canvasSoft px-2 text-[11px] text-body hover:bg-panel transition"
                  >
                    Add key
                  </button>
                </>
              )}
            </div>
          )}
        </td>
      </tr>
    </>
  );
}

function CustomTableRow({ provider, keyStatus, onEdit, onDelete }) {
  const [removing, setRemoving] = useState(false);

  async function handleDelete() {
    if (!confirm(`Remove "${provider.name}"? This also deletes its API key.`)) return;
    setRemoving(true);
    try { onDelete(provider.id); } finally { setRemoving(false); }
  }

  return (
    <tr className="border-b border-hairlineSoft hover:bg-canvasSoft">
      <td className="w-[180px] py-2 pl-3 pr-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded bg-muted text-[9px] font-bold text-panel">C</span>
          <span className="text-[13px] text-ink">{provider.name}</span>
          <span className="rounded-[2px] bg-primary/10 px-1 py-0.5 text-[10px] text-primary">
            {CUSTOM_TYPE_LABEL[provider.type] || provider.type}
          </span>
        </div>
      </td>
      <td className="py-2 pl-2 pr-3">
        <div className="flex items-center gap-3">
          {keyStatus ? (
            <span className="flex items-center gap-1.5 font-mono text-[12px] text-body">
              <CheckCircle2 size={11} className="text-success shrink-0" />
              {keyStatus.preview}
            </span>
          ) : (
            <span className="text-[12px] text-muted">No key</span>
          )}
          <button onClick={() => onEdit(provider)} className="h-[20px] rounded-[2px] border border-hairline bg-canvasSoft px-2 text-[11px] text-body hover:bg-panel transition">Edit</button>
          <button onClick={handleDelete} disabled={removing} className="flex h-[20px] w-[20px] items-center justify-center rounded-[2px] border border-hairline bg-panel text-error hover:bg-error/5 disabled:opacity-40 transition" title="Delete">
            {removing ? <Loader2 size={10} className="animate-spin" /> : <Trash2 size={10} />}
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Table mode wrapper ─────────────────────────────────────────────────────────

function ProviderTable({ providers, customProviders, configured, loading, error, projectId, isGlobal, onStatusChange, onDeleteCustom, onAddProvider, onEditProvider, fetchData }) {
  const [editingId, setEditingId] = useState(null);

  function toggleEdit(id) {
    setEditingId(prev => prev === id ? null : id);
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-3 text-[12px] text-body">
        <Loader2 size={12} className="animate-spin" /> Loading providers…
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-3 py-3">
        <p className="flex items-center gap-1.5 text-[12px] text-error">
          <TriangleAlert size={12} /> {error}
        </p>
        <button onClick={fetchData} className="mt-1 flex items-center gap-1 text-[11px] text-error hover:underline">
          <RefreshCw size={10} /> Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-hairline bg-canvasSoft">
            <th className="w-[180px] py-1.5 pl-3 pr-2 text-left text-[11px] font-semibold text-muted">Provider</th>
            <th className="py-1.5 pl-2 pr-3 text-left text-[11px] font-semibold text-muted">API Key</th>
          </tr>
        </thead>
        <tbody>
          {providers.map(p => (
            <BuiltinTableRow
              key={p.id}
              provider={p}
              projectId={projectId}
              isGlobal={isGlobal}
              status={configured[p.id] || null}
              onStatusChange={onStatusChange}
              isEditing={editingId === p.id}
              onToggleEdit={() => toggleEdit(p.id)}
            />
          ))}
          {customProviders.map(p => (
            <CustomTableRow
              key={p.id}
              provider={p}
              keyStatus={configured[p.id] || null}
              onEdit={onEditProvider}
              onDelete={onDeleteCustom}
            />
          ))}
        </tbody>
      </table>
      {!isGlobal && (
        <div className="border-t border-hairlineSoft px-3 py-2">
          <button
            onClick={onAddProvider}
            className="flex h-[24px] items-center gap-1.5 rounded-[2px] bg-success px-3 text-[12px] font-medium text-white hover:opacity-80 transition"
          >
            <Plus size={11} /> Add Item
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Custom row (card mode) ─────────────────────────────────────────────────────

function CustomCardRow({ provider, keyStatus, onEdit, onDelete }) {
  const [removing, setRemoving] = useState(false);
  const typeLabel = CUSTOM_TYPE_LABEL[provider.type] || provider.type;

  async function handleDelete() {
    if (!confirm(`Remove "${provider.name}"? This also deletes its API key.`)) return;
    setRemoving(true);
    try { onDelete(provider.id); } finally { setRemoving(false); }
  }

  return (
    <div className="flex items-center gap-3 py-3 px-4 rounded-xl border border-hairline bg-panel">
      <div className="min-w-0 flex-1">
        <span className="text-[13px] font-medium text-ink">{provider.name}</span>
        <span className="ml-2 text-[12px] text-muted">
          {typeLabel} · {provider.models?.length || 0} model{provider.models?.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {keyStatus ? (
          <span className="flex items-center gap-1 text-[12px] text-success"><CheckCircle2 size={12} /> Key set</span>
        ) : (
          <span className="flex items-center gap-1 text-[12px] text-muted"><span className="text-[10px]">○</span> No key</span>
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

// ─── Main export ────────────────────────────────────────────────────────────────

export default function ProviderSettings({
  projectId,
  global: isGlobal = false,
  refreshKey = 0,
  onAddProvider,
  onEditProvider,
  customOnly = false,
  tableMode = false,
}) {
  const [providers, setProviders] = useState([]);
  const [customProviders, setCustomProviders] = useState([]);
  const [configured, setConfigured] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const currentUser = useWorkflowStore((s) => s.currentUser);
  const userId = currentUserKey(currentUser);

  const fetchData = useCallback(() => {
    setLoading(true); setError(null);
    const headers = userHeaders(userId);

    if (isGlobal) {
      Promise.all([
        safeFetchJson("/api/agents/providers", { headers }),
        safeFetchJson("/api/keys", { headers }),
      ])
        .then(([provRes, keysRes]) => {
          setProviders((provRes.providers || []).filter(p => !p.isCustom));
          setCustomProviders([]);
          const map = {};
          for (const e of keysRes.configured || []) map[e.providerId] = e;
          setConfigured(map);
        })
        .catch(err => setError(err.message || "Failed to load providers"))
        .finally(() => setLoading(false));
    } else {
      if (!projectId) { setLoading(false); return; }
      Promise.all([
        safeFetchJson(`/api/agents/providers?projectId=${projectId}`, { headers }),
        safeFetchJson(`/api/projects/${projectId}/keys`, { headers }),
        safeFetchJson(`/api/projects/${projectId}/custom-providers`, { headers }),
      ])
        .then(([provRes, keysRes, custRes]) => {
          setProviders((provRes.providers || []).filter(p => !p.isCustom));
          setCustomProviders(custRes.providers || []);
          const map = {};
          for (const e of keysRes.configured || []) map[e.providerId] = e;
          setConfigured(map);
        })
        .catch(err => setError(err.message || "Failed to load providers"))
        .finally(() => setLoading(false));
    }
  }, [userId, projectId, isGlobal, refreshKey]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleStatusChange = useCallback((id, status) => {
    setConfigured(prev => {
      const next = { ...prev };
      if (status) next[id] = status; else delete next[id];
      return next;
    });
  }, []);

  async function handleDeleteCustom(id) {
    await fetch(`/api/projects/${projectId}/custom-providers/${id}`, {
      method: "DELETE",
      headers: userHeaders(userId)
    }).catch(() => {});
    setCustomProviders(prev => prev.filter(p => p.id !== id));
    setConfigured(prev => { const next = { ...prev }; delete next[id]; return next; });
  }

  if (!isGlobal && !projectId) {
    return <p className="text-[12px] text-muted">Save the project first before configuring provider keys.</p>;
  }

  // ── Table mode ──
  if (tableMode) {
    return (
      <ProviderTable
        providers={customOnly ? [] : providers}
        customProviders={customOnly || !isGlobal ? customProviders : []}
        configured={configured}
        loading={loading}
        error={error}
        projectId={projectId}
        isGlobal={isGlobal}
        onStatusChange={handleStatusChange}
        onDeleteCustom={handleDeleteCustom}
        onAddProvider={onAddProvider}
        onEditProvider={onEditProvider}
        fetchData={fetchData}
      />
    );
  }

  // ── Card mode (legacy) ──
  if (loading) {
    return <div className="flex items-center gap-2 text-[12px] text-muted"><Loader2 size={13} className="animate-spin" /> Loading…</div>;
  }
  if (error) {
    return (
      <div className="rounded-lg border border-error/30 bg-error/5 px-4 py-3">
        <p className="flex items-center gap-2 text-[12px] text-error font-medium"><TriangleAlert size={13} /> Failed to load providers</p>
        <p className="mt-1 text-[11px] text-error/80">{error}</p>
        <button className="mt-2 flex items-center gap-1.5 text-[11px] text-error hover:underline" onClick={fetchData}>
          <RefreshCw size={11} /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {!customOnly && providers.map(p => (
        <BuiltinCard
          key={`${isGlobal ? "global" : projectId}-${p.id}`}
          provider={p}
          projectId={projectId}
          global={isGlobal}
          status={configured[p.id] || null}
          onStatusChange={handleStatusChange}
        />
      ))}
      {!isGlobal && customProviders.length > 0 && (
        <div className="space-y-2">
          {!customOnly && <p className="text-[11px] font-semibold uppercase tracking-widest text-muted/60 pt-2">Custom Providers</p>}
          {customProviders.map(p => (
            <CustomCardRow key={p.id} provider={p} keyStatus={configured[p.id] || null} onEdit={onEditProvider} onDelete={handleDeleteCustom} />
          ))}
        </div>
      )}
      {customOnly && !isGlobal && customProviders.length === 0 && (
        <p className="text-[13px] text-muted py-2">No custom providers yet.</p>
      )}
      {!isGlobal && (
        <button className="flex items-center gap-1.5 text-[12px] text-body hover:text-ink transition pt-1" onClick={onAddProvider}>
          <Plus size={13} /> Add Custom Provider
        </button>
      )}
    </div>
  );
}
