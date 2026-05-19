import { useEffect, useState } from "react";
import { CheckCircle2, Eye, EyeOff, Loader2, Plus, RefreshCw, Trash2, TriangleAlert } from "lucide-react";
import Select from "../ui/Select.jsx";
import { useWorkflowStore } from "../../store/workflowStore.js";
import { currentUserKey, userHeaders } from "../../utils/authHeaders.js";

// ─── Constants ──────────────────────────────────────────────────────────────────

const DEFAULT_REQUEST_TEMPLATE = `{
  "model": "{{model}}",
  "messages": {{messages}},
  "max_tokens": {{maxTokens}},
  "temperature": {{temperature}}
}`;

const TYPE_OPTIONS = [
  { value: "openai-compat", label: "OpenAI-Compatible", description: "Together AI, Fireworks, Perplexity — any OpenAI-fork API" },
  { value: "local",         label: "Local Model",       description: "Ollama, LM Studio — runs on your machine, no key needed" },
  { value: "custom-http",   label: "Custom HTTP",       description: "Any REST endpoint — configure request format & response path" },
];

// ─── VS Code-theme primitives (same CSS as UnifiedSettingsPanel) ─────────────

const inputCls = "h-[32px] w-full rounded-[2px] border border-hairline bg-surfaceStrong px-[10px] text-[13px] text-ink placeholder-muted transition focus:border-primary focus:outline-none";
const textareaCls = "w-full resize-y rounded-[2px] border border-hairline bg-surfaceStrong px-[10px] py-[7px] text-[13px] text-ink leading-[1.45] placeholder-muted transition focus:border-primary focus:outline-none";
const btnPrimaryCls = "flex h-[26px] items-center gap-1.5 border border-primary bg-primary px-3 text-[13px] text-white hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed transition";
const btnSecondaryCls = "flex h-[26px] items-center gap-1.5 border border-hairline bg-canvasSoft px-3 text-[13px] text-ink hover:bg-panel disabled:opacity-40 disabled:cursor-not-allowed transition";
const btnDangerTextCls = "text-[12px] text-error hover:underline disabled:opacity-30 transition";

// ─── Sub-components ──────────────────────────────────────────────────────────

/* VS Code–style section title inside a sub-page */
function PageSubHeading({ title }) {
  return (
    <h2 className="mb-2 mt-6 border-b border-hairline pb-1.5 text-[14px] font-semibold text-ink">
      {title}
    </h2>
  );
}

/* Label + optional hint + control — mirrors SettingRow in UnifiedSettingsPanel */
function FieldRow({ label, hint, description, children }) {
  return (
    <div className="mb-0">
      <div className="-mx-4 rounded-[2px] px-4 py-3 transition-colors hover:bg-canvasSoft">
        <div className="flex items-baseline gap-2">
          <p className="text-[13px] font-semibold text-ink">{label}</p>
          {hint && <span className="text-[11px] text-muted">{hint}</span>}
        </div>
        {description && <p className="mt-[2px] text-[13px] leading-[1.4] text-body">{description}</p>}
        <div className="mt-2 max-w-[500px]">{children}</div>
      </div>
    </div>
  );
}

/* Inline info banner */
function InfoBanner({ children }) {
  return (
    <div className="flex items-start gap-2 rounded-none border border-primary/20 bg-primary/5 px-3 py-2">
      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white">i</span>
      <p className="text-[12px] text-ink leading-relaxed">{children}</p>
    </div>
  );
}

/* Connection type radio buttons — VS Code style (outlined pills, no icons) */
function TypeSelector({ value, onChange }) {
  return (
    <div className="flex gap-2 max-w-[500px]">
      {TYPE_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`flex-1 border px-3 py-1.5 text-[12px] text-left transition ${
            value === opt.value
              ? "border-primary bg-primary/10 text-primary font-semibold"
              : "border-hairline bg-panel text-body hover:border-primary hover:text-primary"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/* Model list — table with add row at the bottom */
function ModelList({ models, onChange, canDiscover, baseUrl, apiKey, projectId, headers }) {
  const [newId, setNewId]         = useState("");
  const [newName, setNewName]     = useState("");
  const [discovering, setDiscovering] = useState(false);
  const [discoverError, setDiscoverError] = useState("");

  function add() {
    const id = newId.trim();
    if (!id) return;
    onChange([...models, { id, name: newName.trim() || id }]);
    setNewId(""); setNewName("");
  }

  async function discover() {
    if (!projectId) return;
    setDiscovering(true); setDiscoverError("");
    try {
      const params = new URLSearchParams({ baseUrl });
      if (apiKey?.trim()) params.set("apiKey", apiKey.trim());
      const res  = await fetch(`/api/projects/${projectId}/custom-providers/discover-models?${params}`, { headers });
      const json = await res.json();
      if (json.ok && json.models?.length) {
        onChange(json.models);
      } else {
        setDiscoverError(json.error || "No models found at /v1/models");
      }
    } catch (err) {
      setDiscoverError(err.message);
    } finally {
      setDiscovering(false);
    }
  }

  return (
    <div className="max-w-[500px]">
      {/* Model table */}
      {models.length > 0 && (
        <table className="w-full border-collapse mb-2">
          <thead>
            <tr className="border-b border-hairline bg-canvasSoft">
              <th className="py-1.5 pl-3 text-left text-[11px] font-semibold text-muted">Model ID</th>
              <th className="py-1.5 pl-2 text-left text-[11px] font-semibold text-muted">Display name</th>
              <th className="py-1.5 pr-2 w-8" />
            </tr>
          </thead>
          <tbody>
            {models.map((m, i) => (
              <tr key={i} className="border-b border-hairlineSoft hover:bg-canvasSoft">
                <td className="py-1.5 pl-3 font-mono text-[12px] text-ink">{m.id}</td>
                <td className="py-1.5 pl-2 text-[12px] text-body">{m.name !== m.id ? m.name : "—"}</td>
                <td className="py-1.5 pr-2 text-right">
                  <button
                    onClick={() => onChange(models.filter((_, j) => j !== i))}
                    className={btnDangerTextCls}
                    title="Remove"
                  >
                    <Trash2 size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Add row */}
      <div className="flex items-center gap-1.5">
        <input
          className={`${inputCls} flex-1 font-mono text-[12px]`}
          placeholder="model-id"
          value={newId}
          onChange={(e) => setNewId(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <input
          className={`${inputCls} w-[140px] text-[12px]`}
          placeholder="Display name (optional)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <button className={`${btnSecondaryCls} shrink-0`} onClick={add} disabled={!newId.trim()}>
          <Plus size={12} /> Add
        </button>
      </div>

      {canDiscover && (
        <div className="mt-2">
          <button
            className={`${btnSecondaryCls} text-[12px]`}
            onClick={discover}
            disabled={discovering || !baseUrl}
          >
            {discovering ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
            Auto-discover from /v1/models
          </button>
          {discoverError && (
            <p className="mt-1 flex items-center gap-1 text-[11px] text-error">
              <TriangleAlert size={11} /> {discoverError}
            </p>
          )}
        </div>
      )}

      {models.length === 0 && (
        <p className="mt-1 text-[12px] text-muted">Add at least one model ID before saving.</p>
      )}
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export default function CustomProviderPage({ projectId, editProvider, onSaved, onCancel }) {
  const isEdit = !!editProvider;
  const currentUser = useWorkflowStore((s) => s.currentUser);
  const userId = currentUserKey(currentUser);

  const [name, setName]               = useState(editProvider?.name || "");
  const [type, setType]               = useState(editProvider?.type || "openai-compat");
  const [baseUrl, setBaseUrl]         = useState(editProvider?.baseUrl || "");
  const [authHeader, setAuthHeader]   = useState(editProvider?.authHeaderName || "Authorization");
  const [reqTemplate, setReqTemplate] = useState(editProvider?.requestTemplate || DEFAULT_REQUEST_TEMPLATE);
  const [respPath, setRespPath]       = useState(editProvider?.responsePath || "choices.0.message.content");
  const [models, setModels]           = useState(editProvider?.models || []);
  const [apiKey, setApiKey]           = useState("");
  const [showKey, setShowKey]         = useState(false);
  const [saving, setSaving]           = useState(false);
  const [testing, setTesting]         = useState(false);
  const [testResult, setTestResult]   = useState(null);

  useEffect(() => {
    if (type === "local" && !baseUrl) setBaseUrl("http://localhost:11434");
  }, [type]);

  useEffect(() => {
    if (!isEdit || type === "local") return;

    let cancelled = false;
    fetch(`/api/projects/${projectId}/keys/${editProvider.id}`, { headers: userHeaders(userId) })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Failed to load saved key (${res.status})`);
        }
        return res.json();
      })
      .then((json) => {
        if (!cancelled) setApiKey(json.apiKey || "");
      })
      .catch((error) => {
        if (!cancelled) {
          setTestResult((current) => current || { ok: false, error: error.message });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [editProvider, isEdit, projectId, type, userId]);

  const baseUrlPlaceholder = {
    "openai-compat": "https://api.together.xyz/v1",
    local:           "http://localhost:11434",
    "custom-http":   "https://your-api.example.com/chat",
  }[type];

  async function testConnection() {
    setTesting(true); setTestResult(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/custom-providers/test-config`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...userHeaders(userId) },
        body: JSON.stringify({ type, baseUrl, authHeaderName: authHeader, requestTemplate: reqTemplate, responsePath: respPath, apiKey: apiKey.trim() }),
      });
      setTestResult(await res.json());
    } catch { setTestResult({ ok: false, error: "Network error" }); }
    setTesting(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = { name, type, baseUrl, authHeaderName: authHeader, models, requestTemplate: reqTemplate, responsePath: respPath };
      if (apiKey.trim()) payload.apiKey = apiKey.trim();
      const url    = isEdit ? `/api/projects/${projectId}/custom-providers/${editProvider.id}` : `/api/projects/${projectId}/custom-providers`;
      const method = isEdit ? "PUT" : "POST";
      const res    = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...userHeaders(userId) },
        body: JSON.stringify(payload)
      });
      const json   = await res.json();
      if (!res.ok) throw new Error(json.error || "Save failed");
      onSaved(json.provider);
    } catch (err) {
      setTestResult({ ok: false, error: err.message });
    }
    setSaving(false);
  }

  const canSave = name.trim() && baseUrl.trim() && models.length > 0;

  if (!projectId) {
    return (
      <div className="py-12 text-center">
        <p className="text-[13px] text-ink">No project selected</p>
        <p className="mt-1 text-[12px] text-body max-w-xs mx-auto">
          Custom providers are stored per-project. Open a project first.
        </p>
        {onCancel && (
          <button className={`${btnSecondaryCls} mt-4 mx-auto`} onClick={onCancel}>
            Go back
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[680px]">

          {/* ── Identity ──────────────────────────────────── */}
          <PageSubHeading title="Identity" />

          <FieldRow label="Provider name" description="Shown in the model picker and provider table.">
            <input
              className={inputCls}
              placeholder="e.g. My Ollama, Together AI, Custom GPT"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </FieldRow>

          <FieldRow label="Connection type" description={TYPE_OPTIONS.find((o) => o.value === type)?.description}>
            <Select
              value={type}
              onChange={setType}
              options={TYPE_OPTIONS}
              className="w-full max-w-[500px]"
              variant="settings"
            />
          </FieldRow>

          <FieldRow label="Base URL" description="The root endpoint for API requests.">
            <input
              className={`${inputCls} font-mono text-[12px]`}
              placeholder={baseUrlPlaceholder}
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
            />
          </FieldRow>

          {/* ── Models ────────────────────────────────────── */}
          <PageSubHeading title="Models" />

          <FieldRow label="Model list" description="Define model IDs available through this provider. These appear in the agent Model picker.">
            <ModelList
              models={models}
              onChange={setModels}
              canDiscover={type === "local" || type === "openai-compat"}
              baseUrl={baseUrl}
              apiKey={apiKey}
              projectId={projectId}
              headers={userHeaders(userId)}
            />
          </FieldRow>

          {/* ── HTTP Config (custom-http only) ─────────────── */}
          {type === "custom-http" && (
            <>
              <PageSubHeading title="HTTP Configuration" />

              <FieldRow label="Auth header name">
                <input
                  className={`${inputCls} font-mono text-[12px]`}
                  placeholder="Authorization"
                  value={authHeader}
                  onChange={(e) => setAuthHeader(e.target.value)}
                />
              </FieldRow>

              <FieldRow
                label="Request body template"
                hint="Supports: {{messages}}, {{model}}, {{maxTokens}}, {{temperature}}"
                description="JSON template sent with every request. Use the placeholders listed above."
              >
                <textarea
                  className={`${textareaCls} font-mono text-[12px]`}
                  rows={8}
                  value={reqTemplate}
                  onChange={(e) => setReqTemplate(e.target.value)}
                />
                {/* Placeholder reference — VS Code style inline table */}
                <table className="mt-2 w-full border-collapse text-[12px]">
                  <thead>
                    <tr className="border-b border-hairline bg-canvasSoft">
                      <th className="py-1 pl-2 text-left text-[11px] font-semibold text-muted">Placeholder</th>
                      <th className="py-1 pl-2 text-left text-[11px] font-semibold text-muted">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["{{messages}}", "Chat messages array (JSON)"],
                      ["{{model}}", "Model ID string"],
                      ["{{maxTokens}}", "Max tokens number"],
                      ["{{temperature}}", "Temperature number"],
                    ].map(([ph, desc]) => (
                      <tr key={ph} className="border-b border-hairlineSoft">
                        <td className="py-1 pl-2 font-mono text-[11px] text-ink">{ph}</td>
                        <td className="py-1 pl-2 text-[11px] text-body">{desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </FieldRow>

              <FieldRow
                label="Response path"
                hint="Dot-notation"
                description="Path to extract the text content from the JSON response."
              >
                <input
                  className={`${inputCls} font-mono text-[12px]`}
                  placeholder="choices.0.message.content"
                  value={respPath}
                  onChange={(e) => setRespPath(e.target.value)}
                />
              </FieldRow>
            </>
          )}

          {/* ── API Key ───────────────────────────────────── */}
          <PageSubHeading title="API Key" />

          {type === "local" ? (
            <InfoBanner>
              Local providers don't require an API key. Make sure your local server is running
              at <span className="font-mono text-[11px]">{baseUrl || "http://localhost:11434"}</span>.
            </InfoBanner>
          ) : (
            <FieldRow
              label="API Key"
              hint={isEdit ? "Loaded from encrypted storage. Leave it blank and save to keep the current key unchanged." : undefined}
              description="Stored encrypted and scoped to this project."
            >
              <div className="flex gap-1.5">
                <div className="relative flex-1">
                  <input
                    className={`${inputCls} pr-8 font-mono text-[12px]`}
                    type={showKey ? "text" : "password"}
                    placeholder="sk-..."
                    value={apiKey}
                    onChange={(e) => { setApiKey(e.target.value); setTestResult(null); }}
                  />
                  <button
                    tabIndex={-1}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition"
                    onClick={() => setShowKey((v) => !v)}
                  >
                    {showKey ? <EyeOff size={12} /> : <Eye size={12} />}
                  </button>
                </div>
                <button
                  className={btnSecondaryCls}
                  onClick={testConnection}
                  disabled={testing || !baseUrl}
                >
                  {testing ? <Loader2 size={11} className="animate-spin" /> : null}
                  Test connection
                </button>
              </div>
            </FieldRow>
          )}

          {testResult && (
            <p className={`mt-1 flex items-center gap-1.5 text-[12px] ${testResult.ok ? "text-success" : "text-error"}`}>
              {testResult.ok
                ? <><CheckCircle2 size={12} /> Connection successful</>
                : <><TriangleAlert size={12} /> {testResult.error}</>}
            </p>
          )}

          {/* bottom padding so content doesn't sit against the footer */}
          <div className="h-8" />
        </div>
      </div>

      {/* ── Sticky footer ─────────────────────────────────── */}
      <div className="flex items-center justify-between border-t border-hairline bg-canvas px-0 py-4">
        <button className={btnSecondaryCls} onClick={onCancel}>
          Cancel
        </button>
        <button
          className={btnPrimaryCls}
          onClick={handleSave}
          disabled={saving || !canSave}
        >
          {saving && <Loader2 size={12} className="animate-spin" />}
          {isEdit ? "Save changes" : "Add provider"}
        </button>
      </div>
    </div>
  );
}
