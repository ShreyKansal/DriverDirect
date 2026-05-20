import ConnectionsPanel from "./ConnectionsPanel.jsx";

export default function AgentConsoleConnections({ agentId }) {
  return (
    <div className="space-y-4">
      <div className="border-b border-hairline pb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted/50">Connections</p>
        <p className="mt-1.5 text-[12px] text-muted">Incoming and outgoing edges for this node.</p>
      </div>
      <div className="rounded-[2px] border border-hairline overflow-hidden" style={{ minHeight: 300 }}>
        <ConnectionsPanel nodeId={agentId} showHeader={false} />
      </div>
    </div>
  );
}
