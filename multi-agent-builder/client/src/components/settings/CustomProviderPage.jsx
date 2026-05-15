import { useEffect, useState } from "react";
import {
  CheckCircle2, Eye, EyeOff, Globe, Loader2,
  Plus, RefreshCw, Server, Code2, Trash2, TriangleAlert
} from "lucide-react";

const DEFAULT_REQUEST_TEMPLATE = `{
  "model": "{{model}}",
  "messages": {{messages}},
  "max_tokens": {{maxTokens}},
  "temperature": {{temperature}}
}`;

const TYPE_OPTIONS = [
  { value: "openai-compat", label: "OpenAI-Compatible", Icon: Globe,   description: "Together AI, Fireworks, Perplexity — any OpenAI-fork API" },
  { value: "local",         label: "Local Model",       Icon: Server,  description: "Ollama, LM Studio — runs on your machine, no key needed" },
  { value: "custom-http",   label: "Custom HTTP",       Icon: Code2,   description: "Any REST endpoint — configure request format & response path" }
];

function SectionCard({ title, description, children }) {
  return (
    <div className="rounded-xl border border-hairline bg-panel">
      <div className="border-b border-hairline px-5 py-4">
        <h3 className="text-[14px] font-semibold text-ink">{title}</h3>
        {description && <p className="mt-0.5 text-[12px] text-muted">{description}</p>}
      </div>
      <div className="px-5 py-5 space-y-5">{children}</div>
    </div>
  );
}

function FieldRow({ label, hint, children }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-[12px] font-semibold text-ink">{label}</label>
        {hint && <span className="text-[11px] text-muted">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function ModelList({ models, onChange, canDiscover, baseUrl, apiKey, projectId }) {
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
    setDiscovering(true); setDiscoverError("");
    try {
      const params = new URLSearchParams({ baseUrl });
      if (apiKey?.trim()) params.set("apiKey", apiKey.trim());
      const res  = await fetch(`/api/projects/${projectId}/custom-providers/discover-models?${params}`);
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
    <div className="space-y-3">
      {models.length > 0 && (
        <div className="space-y-1.5">
          {models.map((m, i) => (
            <div key={i} className="flex items-center gap-2 rounded-md border border-hairline bg-canvasSoft px-3 py-2">
              <span className="flex-1 font-mono text-[12px] text-ink truncate">{m.id}</span>
              {m.name !== m.id && <span className="text-[11px] text-muted truncate max-w-[140px]">{m.name}</span>}
              <button onClick={() => onChange(models.filter((_, j) => j !== i))}
                className="shrink-0 text-muted hover:text-error transition">
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          className="input flex-1 font-mono text-[12px]"
          placeholder="model-id  (e.g. llama3.2)"
          value={newId}
          onChange={(e) => setNewId(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <input
          className="input w-32 text-[12px]"
          placeholder="Display name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <button className="btn h-9 px-3 shrink-0" onClick={add} disabled={!newId.trim()}>
          <Plus size={13} />
        </button>
      </div>

      {canDiscover && (
        <div className="space-y-1">
          <button
            className="btn h-8 px-3 text-[12px] flex items-center gap-1.5"
            onClick={discover}
            disabled={discovering || !baseUrl}
          >
            {discovering ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
            Auto-discover from /v1/models
          </button>
          {discoverError && (
            <p className="flex items-center gap-1.5 text-[11px] text-error">
              <TriangleAlert size={11} /> {discoverError}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function CustomProviderPage({ projectId, editProvider, onSaved, onCancel }) {
  const isEdit = !!editProvider;

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

  // default base URL for local
  useEffect(() => {
    if (type === "local" && !baseUrl) setBaseUrl("http://localhost:11434");
  }, [type]);

  const baseUrlPlaceholder = {
    "openai-compat": "https://api.together.xyz/v1",
    local:           "http://localhost:11434",
    "custom-http":   "https://your-api.example.com/chat"
  }[type];

  async function testConnection() {
    setTesting(true); setTestResult(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/custom-providers/test-config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, baseUrl, authHeaderName: authHeader, requestTemplate: reqTemplate, responsePath: respPath, apiKey: apiKey.trim() })
      });
      setTestResult(await res.json());
    } catch { setTestResult({ ok: false, error: "Network error" }); }
    finally { setTesting(false); }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = { name, type, baseUrl, authHeaderName: authHeader, models, requestTemplate: reqTemplate, responsePath: respPath };
      if (apiKey.trim()) payload.apiKey = apiKey.trim();

      const url    = isEdit ? `/api/projects/${projectId}/custom-providers/${editProvider.id}` : `/api/projects/${projectId}/custom-providers`;
      const method = isEdit ? "PUT" : "POST";
      const res    = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const json   = await res.json();
      if (!res.ok) throw new Error(json.error || "Save failed");
      onSaved(json.provider);
    } catch (err) {
      setTestResult({ ok: false, error: err.message });
    } finally {
      setSaving(false);
    }
  }

  const canSave = name.trim() && baseUrl.trim() && models.length > 0;

  return (
    <div className="flex min-h-full flex-col">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-8 py-8 space-y-6">

          {/* ── Provider Info ────────────────────────────────────── */}
          <SectionCard title="Provider Info" description="Name and type of connection for this AI provider.">

            <FieldRow label="Provider name">
              <input
                className="input w-full"
                placeholder="e.g. My Ollama, Together AI, Custom GPT"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </FieldRow>

            <FieldRow label="Connection type">
              <div className="grid grid-cols-3 gap-2">
                {TYPE_OPTIONS.map(({ value, label, Icon }) => (
                  <button
                    key={value}
                    onClick={() => setType(value)}
                    className={`flex flex-col items-center gap-1.5 rounded-lg border px-2 py-3 text-center transition ${
                      type === value
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-hairline bg-canvasSoft text-muted hover:border-hairlineStrong hover:text-body"
                    }`}
                  >
                    <Icon size={15} />
                    <span className="text-[11px] font-semibold leading-tight">{label}</span>
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-muted mt-1.5">
                {TYPE_OPTIONS.find((o) => o.value === type)?.description}
              </p>
            </FieldRow>

            <FieldRow label="Base URL">
              <input
                className="input w-full font-mono text-[12px]"
                placeholder={baseUrlPlaceholder}
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
              />
            </FieldRow>

          </SectionCard>

          {/* ── Models ───────────────────────────────────────────── */}
          <SectionCard
            title="Models"
            description="Define the model IDs available through this provider. These appear in the agent Model picker."
          >
            <ModelList
              models={models}
              onChange={setModels}
              canDiscover={type === "local" || type === "openai-compat"}
              baseUrl={baseUrl}
              apiKey={apiKey}
              projectId={projectId}
            />
            {models.length === 0 && (
              <p className="text-[11px] text-muted">Add at least one model ID before saving.</p>
            )}
          </SectionCard>

          {/* ── HTTP Config (custom-http only) ────────────────────── */}
          {type === "custom-http" && (
            <SectionCard
              title="HTTP Config"
              description="Configure how requests are sent and how the response text is extracted."
            >
              <FieldRow label="Auth header name">
                <input
                  className="input w-full font-mono text-[12px]"
                  placeholder="Authorization"
                  value={authHeader}
                  onChange={(e) => setAuthHeader(e.target.value)}
                />
              </FieldRow>

              <FieldRow
                label="Request body template"
                hint="Use placeholders below"
              >
                <textarea
                  className="input w-full font-mono text-[11px] resize-none leading-relaxed"
                  rows={9}
                  value={reqTemplate}
                  onChange={(e) => setReqTemplate(e.target.value)}
                />
              </FieldRow>

              <div className="rounded-lg border border-amber-300/40 bg-amber-50/50 px-4 py-3">
                <p className="text-[11px] font-semibold text-amber-800 mb-2">Available placeholders</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {[
                    ["{{messages}}", "Chat messages array"],
                    ["{{model}}", "Model ID string"],
                    ["{{maxTokens}}", "Max tokens number"],
                    ["{{temperature}}", "Temperature number"],
                  ].map(([ph, desc]) => (
                    <div key={ph} className="flex items-center gap-2">
                      <code className="text-[10px] bg-amber-100 px-1.5 py-0.5 rounded font-mono text-amber-900">{ph}</code>
                      <span className="text-[11px] text-amber-700">{desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              <FieldRow
                label="Response path"
                hint="Dot-notation to the text field in the JSON response"
              >
                <input
                  className="input w-full font-mono text-[12px]"
                  placeholder="choices.0.message.content"
                  value={respPath}
                  onChange={(e) => setRespPath(e.target.value)}
                />
              </FieldRow>
            </SectionCard>
          )}

          {/* ── API Key ──────────────────────────────────────────── */}
          <SectionCard
            title="API Key"
            description={type === "local" ? "Local providers don't need an API key." : "Stored encrypted per-project."}
          >
            {type === "local" ? (
              <div className="rounded-lg border border-blue-300/30 bg-blue-50/40 px-4 py-3">
                <p className="text-[12px] font-semibold text-blue-800">No key required</p>
                <p className="text-[11px] text-blue-700 mt-0.5">
                  Make sure your local server is running at{" "}
                  <code className="font-mono bg-blue-100 px-1 rounded text-[10px]">{baseUrl || "http://localhost:11434"}</code>
                </p>
              </div>
            ) : (
              <FieldRow label="API Key" hint={isEdit ? "Leave empty to keep existing key" : undefined}>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      className="input w-full pr-9 font-mono text-[12px]"
                      type={showKey ? "text" : "password"}
                      placeholder="sk-..."
                      value={apiKey}
                      onChange={(e) => { setApiKey(e.target.value); setTestResult(null); }}
                    />
                    <button
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition"
                      onClick={() => setShowKey((v) => !v)}
                      tabIndex={-1}
                    >
                      {showKey ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                  <button
                    className="btn h-9 px-3 text-[12px] shrink-0 flex items-center gap-1.5"
                    onClick={testConnection}
                    disabled={testing || !baseUrl}
                  >
                    {testing ? <Loader2 size={12} className="animate-spin" /> : null}
                    Test
                  </button>
                </div>
              </FieldRow>
            )}

            {testResult && (
              <p className={`flex items-center gap-1.5 text-[12px] ${testResult.ok ? "text-success" : "text-error"}`}>
                {testResult.ok
                  ? <><CheckCircle2 size={13} /> Connection successful</>
                  : <><TriangleAlert size={13} /> {testResult.error}</>}
              </p>
            )}
          </SectionCard>

        </div>
      </div>

      {/* ── Sticky footer ──────────────────────────────────────── */}
      <div className="sticky bottom-0 z-10 flex items-center justify-between border-t border-hairline bg-canvas px-8 py-4">
        <button className="btn h-9 px-4 text-[13px]" onClick={onCancel}>
          Cancel
        </button>
        <button
          className="btn-primary h-9 px-5 text-[13px] flex items-center gap-2"
          onClick={handleSave}
          disabled={saving || !canSave}
        >
          {saving && <Loader2 size={13} className="animate-spin" />}
          {isEdit ? "Save Changes" : "Add Provider"}
        </button>
      </div>
    </div>
  );
}
