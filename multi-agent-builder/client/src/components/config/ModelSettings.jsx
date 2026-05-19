import { useEffect, useState } from "react";
import { Settings2, TriangleAlert, WifiOff } from "lucide-react";
import Select from "../ui/Select.jsx";
import { useWorkflowStore } from "../../store/workflowStore.js";
import { currentUserKey, userHeaders } from "../../utils/authHeaders.js";

const FALLBACK_PROVIDERS = [
  {
    id: "groq",
    name: "Groq",
    models: [
      { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B Versatile" },
      { id: "llama-3.1-8b-instant",    name: "Llama 3.1 8B Instant"    },
      { id: "llama3-70b-8192",         name: "Llama 3 70B"             },
    ]
  },
  {
    id: "openai",
    name: "OpenAI",
    models: [
      { id: "gpt-4o",      name: "GPT-4o"      },
      { id: "gpt-4o-mini", name: "GPT-4o Mini" },
      { id: "o3-mini",     name: "o3-mini"     },
    ]
  },
  {
    id: "anthropic",
    name: "Anthropic",
    models: [
      { id: "claude-opus-4-7",           name: "Claude Opus 4.7"   },
      { id: "claude-sonnet-4-6",         name: "Claude Sonnet 4.6" },
      { id: "claude-haiku-4-5-20251001", name: "Claude Haiku 4.5"  },
    ]
  },
  {
    id: "google",
    name: "Google Gemini",
    models: [
      { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash" },
      { id: "gemini-1.5-pro",   name: "Gemini 1.5 Pro"   },
    ]
  },
];

const vcInput = "w-full rounded-[2px] border border-hairline bg-surfaceStrong px-[10px] py-[6px] text-[13px] text-ink outline-none placeholder:text-muted transition focus:border-primary focus:outline-none";
const vcLabel = "mb-1.5 block text-[12px] font-semibold text-body";

export default function ModelSettings({ agent, update }) {
  const activeProjectId = useWorkflowStore((s) => s.activeProjectId);
  const currentUser = useWorkflowStore((s) => s.currentUser);
  const userId = currentUserKey(currentUser);
  const keyProjectId = activeProjectId;

  const [allProviders, setAllProviders] = useState(FALLBACK_PROVIDERS);
  const [configuredIds, setConfiguredIds] = useState(new Set());
  const [backendOffline, setBackendOffline] = useState(false);

  useEffect(() => {
    const headers = userHeaders(userId);
    const provUrl = keyProjectId
      ? `/api/agents/providers?projectId=${keyProjectId}`
      : "/api/agents/providers";

    const requests = [fetch(provUrl, { headers }).then((r) => r.json())];
    if (keyProjectId) {
      requests.push(fetch(`/api/projects/${keyProjectId}/keys`, { headers }).then((r) => r.json()));
    }

    Promise.all(requests)
      .then(([{ providers }, keysRes]) => {
        if (providers?.length) {
          setAllProviders(providers);
          setBackendOffline(false);
        }
        const ids = new Set((keysRes?.configured || []).map((entry) => entry.providerId));
        for (const p of providers || []) {
          if (p.isCustom && p.type === "local") ids.add(p.id);
        }
        setConfiguredIds(ids);
      })
      .catch(() => { setBackendOffline(true); });
  }, [keyProjectId, userId]);

  const currentProvider = agent.provider || "groq";
  const providerData = allProviders.find((p) => p.id === currentProvider) || allProviders[0];
  const modelList = providerData?.models || [];

  const providerOptions = allProviders.map((p) => ({
    value: p.id,
    label: p.isCustom ? `${p.name} (Custom)` : p.name,
  }));
  const modelOptions = modelList.map((m) => ({ value: m.id, label: m.name || m.id }));

  function handleProviderChange(newProvider) {
    const provider = allProviders.find((p) => p.id === newProvider);
    update({ provider: newProvider, model: provider?.models[0]?.id || "" });
  }

  const noKey = !configuredIds.has(currentProvider);

  return (
    <div className="space-y-3">
      {backendOffline && (
        <div className="flex items-start gap-2 rounded-[2px] border border-orange-300 bg-orange-50 p-2.5">
          <WifiOff size={12} className="mt-0.5 shrink-0 text-orange-500" />
          <div>
            <p className="text-[11px] font-semibold text-orange-700">Backend offline — showing defaults</p>
            <p className="text-[10px] text-body">Start with: <code className="font-mono">npm --prefix server start</code></p>
          </div>
        </div>
      )}

      {noKey && (
        <div className="flex items-start gap-2 rounded-[2px] border border-yellow-300 bg-yellow-50 p-2.5">
          <TriangleAlert size={12} className="mt-0.5 shrink-0 text-yellow-600" />
          <div>
            <p className="text-[11px] font-semibold text-yellow-700">No API key for {providerData?.name}</p>
            <p className="text-[10px] text-body">
              Add it in <span className="font-semibold text-ink">App Settings / Model providers</span>.
            </p>
          </div>
        </div>
      )}

      <div>
        <span className={vcLabel}>Provider</span>
        <Select variant="settings" value={currentProvider} onChange={handleProviderChange} options={providerOptions} />
      </div>

      <div>
        <span className={vcLabel}>Model</span>
        <Select
          variant="settings"
          value={agent.model || modelOptions[0]?.value || ""}
          onChange={(value) => update({ model: value })}
          options={modelOptions}
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <span className={vcLabel}>Temp</span>
          <input
            className={vcInput}
            type="number"
            min="0"
            max="2"
            step="0.1"
            value={agent.temperature}
            onChange={(e) => update({ temperature: Number(e.target.value) })}
          />
        </div>
        <div className="col-span-2">
          <span className={vcLabel}>Max Tokens</span>
          <input
            className={vcInput}
            type="number"
            min="1"
            value={agent.maxTokens}
            onChange={(e) => update({ maxTokens: Number(e.target.value) })}
          />
        </div>
      </div>

      {!noKey && (
        <p className="flex items-center gap-1.5 text-[11px] text-muted">
          <Settings2 size={10} />
          Manage keys in App Settings / Model providers
        </p>
      )}
    </div>
  );
}
