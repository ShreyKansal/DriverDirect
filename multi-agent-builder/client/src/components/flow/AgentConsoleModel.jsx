import ModelSettings from "../config/ModelSettings.jsx";

const TEMP_LABELS = [
  { val: 0,    label: "Precise"  },
  { val: 0.5,  label: "Balanced" },
  { val: 1.0,  label: "Creative" },
  { val: 1.5,  label: "Wild"     },
];

function TempLabel({ value }) {
  const nearest = TEMP_LABELS.reduce((prev, curr) =>
    Math.abs(curr.val - value) < Math.abs(prev.val - value) ? curr : prev
  );
  return (
    <span className="rounded-full border border-hairline bg-canvasSoft px-2 py-0.5 text-[10px] font-semibold text-muted">
      {nearest.label}
    </span>
  );
}

export default function AgentConsoleModel({ node, update }) {
  const temp      = node.temperature ?? 0.7;
  const maxTokens = node.maxTokens   ?? 1024;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[18px] font-semibold text-ink">Model</h2>
        <p className="mt-0.5 text-[12px] text-muted">Choose which AI model powers this agent.</p>
      </div>

      {/* Provider + Model selects (reuse existing component) */}
      <div className="rounded-[2px] border border-hairline bg-panel p-4">
        <ModelSettings agent={node} update={update} />
      </div>

      {/* Temperature slider */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-[13px] font-semibold text-ink">Temperature</label>
          <div className="flex items-center gap-2">
            <TempLabel value={temp} />
            <span className="text-[13px] font-mono text-ink">{temp.toFixed(2)}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="w-14 text-[11px] text-muted text-right">Precise</span>
          <input
            type="range"
            min="0"
            max="2"
            step="0.05"
            value={temp}
            onChange={(e) => update({ temperature: parseFloat(e.target.value) })}
            className="flex-1 accent-primary"
          />
          <span className="w-14 text-[11px] text-muted">Creative</span>
        </div>
        <p className="mt-1.5 text-[11px] text-muted">
          Lower = more predictable and consistent. Higher = more varied and creative.
        </p>
      </div>

      {/* Max Tokens */}
      <div>
        <label className="mb-1 block text-[13px] font-semibold text-ink">Max Tokens</label>
        <input
          className="h-[32px] w-full rounded-[2px] border border-hairline bg-surfaceStrong px-3 text-[13px] text-ink outline-none transition focus:border-primary"
          type="number"
          min="1"
          max="32000"
          value={maxTokens}
          onChange={(e) => update({ maxTokens: Number(e.target.value) })}
        />
        <p className="mt-1 text-[11px] text-muted">
          How many words the agent can write per response. 1 token ≈ 0.75 words.
        </p>
      </div>
    </div>
  );
}
