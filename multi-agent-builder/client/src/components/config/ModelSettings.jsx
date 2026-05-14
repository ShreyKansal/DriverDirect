import { useEffect, useState } from "react";
import { Settings2, TriangleAlert } from "lucide-react";
import Select from "../ui/Select.jsx";
import { useWorkflowStore } from "../../store/workflowStore.js";

const FALLBACK_PROVIDERS = [
  {
    id: "groq",
    name: "Groq",
    models: [
      { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B Versatile" },
      { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B Instant" }
    ]
  }
];

export default function ModelSettings({ agent, update }) {
  const activeProjectId = useWorkflowStore((s) => s.activeProjectId);
  const workflowId = useWorkflowStore((s) => s.workflow.id);
  const keyProjectId = workflowId || activeProjectId;

  const [allProviders, setAllProviders] = useState(FALLBACK_PROVIDERS);
  const [configuredIds, setConfiguredIds] = useState(new Set());

  useEffect(() => {
    const requests = [fetch("/api/agents/providers").then((response) => response.json())];
    if (keyProjectId) {
      requests.push(fetch(`/api/projects/${keyProjectId}/keys`).then((response) => response.json()));
    }

    Promise.all(requests)
      .then(([{ providers }, keysRes]) => {
        if (providers?.length) setAllProviders(providers);
        const ids = new Set((keysRes?.configured || []).map((entry) => entry.providerId));
        setConfiguredIds(ids);
      })
      .catch(() => {});
  }, [keyProjectId]);

  const currentProvider = agent.provider || "groq";
  const providerData = allProviders.find((provider) => provider.id === currentProvider) || allProviders[0];
  const modelList = providerData?.models || [];

  const providerOptions = allProviders.map((provider) => ({ value: provider.id, label: provider.name }));
  const modelOptions = modelList.map((model) => ({ value: model.id, label: model.name || model.id }));

  function handleProviderChange(newProvider) {
    const provider = allProviders.find((item) => item.id === newProvider);
    update({ provider: newProvider, model: provider?.models[0]?.id || "" });
  }

  const noKey = !configuredIds.has(currentProvider);

  return (
    <div className="space-y-3">
      {noKey && (
        <div className="flex items-start gap-2 rounded-md border border-yellow-500/30 bg-yellow-500/5 p-2.5">
          <TriangleAlert size={12} className="mt-0.5 shrink-0 text-yellow-600" />
          <div>
            <p className="text-[11px] font-semibold text-yellow-700">No API key for {providerData?.name}</p>
            <p className="text-[10px] text-muted">
              Add it in <span className="font-semibold text-body">Project Settings / Model providers</span>.
            </p>
          </div>
        </div>
      )}

      <label className="field">
        <span>Provider</span>
        <Select value={currentProvider} onChange={handleProviderChange} options={providerOptions} />
      </label>

      <label className="field">
        <span>Model</span>
        <Select
          value={agent.model || modelOptions[0]?.value || ""}
          onChange={(value) => update({ model: value })}
          options={modelOptions}
        />
      </label>

      <div className="grid grid-cols-3 gap-2">
        <label className="field">
          <span>Temp</span>
          <input
            className="input"
            type="number"
            min="0"
            max="2"
            step="0.1"
            value={agent.temperature}
            onChange={(event) => update({ temperature: Number(event.target.value) })}
          />
        </label>
        <label className="field col-span-2">
          <span>Max Tokens</span>
          <input
            className="input"
            type="number"
            min="1"
            value={agent.maxTokens}
            onChange={(event) => update({ maxTokens: Number(event.target.value) })}
          />
        </label>
      </div>

      {!noKey && (
        <p className="flex items-center gap-1.5 text-[10px] text-muted">
          <Settings2 size={10} />
          Manage keys in Project Settings / Model providers
        </p>
      )}
    </div>
  );
}
