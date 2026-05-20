import ConnectionsPanel from "./ConnectionsPanel.jsx";

export default function AgentConsoleConnections({ agentId }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-[18px] font-semibold text-ink">Connections</h2>
        <p className="mt-0.5 text-[12px] text-muted">How does this agent connect to other nodes in the workflow?</p>
      </div>
      <div className="rounded-[2px] border border-hairline overflow-hidden" style={{ minHeight: 300 }}>
        <ConnectionsPanel nodeId={agentId} showHeader={false} />
      </div>
    </div>
  );
}
