import AgentOutputCard from "./AgentOutputCard.jsx";

export default function ExecutionLog({ trace }) {
  if (!trace?.steps?.length) {
    return <div className="rounded-xl border border-dashed border-hairlineStrong bg-panel p-4 text-sm text-muted">No execution logs yet.</div>;
  }

  return (
    <div className="space-y-3">
      {trace.steps.map((step, index) => (
        <AgentOutputCard key={`${step.agentId}-${index}`} step={step} index={index} />
      ))}
    </div>
  );
}
