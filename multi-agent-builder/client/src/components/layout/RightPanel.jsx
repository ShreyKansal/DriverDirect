import { Code2, Link2, MessageSquare, Settings2 } from "lucide-react";
import { useState } from "react";
import ChatPanel from "../chat/ChatPanel.jsx";
import AgentConfigPanel from "../config/AgentConfigPanel.jsx";
import ConnectionsPanel from "../flow/ConnectionsPanel.jsx";

function ActivityBtn({ onClick, title, children, active, disabled }) {
  return (
    <button
      className={`relative flex h-11 w-11 items-center justify-center rounded-md transition disabled:opacity-30 ${
        active ? "text-ink" : "text-muted hover:text-ink"
      }`}
      onClick={onClick}
      title={title}
      disabled={disabled}
    >
      {active && (
        <span className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
      )}
      {children}
    </button>
  );
}

const SECTIONS = [
  { id: "chat",        Icon: MessageSquare, title: "Chat (Ctrl+Shift+K)" },
  { id: "code",        Icon: Code2,         title: "Code (coming soon)", disabled: true },
  { id: "config",      Icon: Settings2,     title: "Config" },
  { id: "connections", Icon: Link2,         title: "Connections" },
];

export default function RightPanel({ showProject, onProjectSettings: onSettings }) {
  const [activeSection, setActiveSection] = useState("config");

  return (
    <div className="flex h-full flex-row bg-panel">
      {/* Vertical activity bar */}
      <div className="flex w-14 shrink-0 flex-col items-center border-r border-hairline bg-panel py-2">
        {SECTIONS.map(({ id, Icon, title, disabled }) => (
          <ActivityBtn
            key={id}
            onClick={() => !disabled && setActiveSection(id)}
            title={title}
            active={activeSection === id}
            disabled={disabled}
          >
            <Icon size={20} />
          </ActivityBtn>
        ))}
      </div>

      {/* Section content */}
      <div className="min-h-0 flex-1 overflow-hidden">
        {activeSection === "chat" && <ChatPanel />}
        {activeSection === "code" && (
          <div className="flex h-full items-center justify-center text-[12px] text-muted">
            Coming soon
          </div>
        )}
        {activeSection === "config" && (
          <AgentConfigPanel showProject={showProject} onSettings={onSettings} />
        )}
        {activeSection === "connections" && <ConnectionsPanel />}
      </div>
    </div>
  );
}
