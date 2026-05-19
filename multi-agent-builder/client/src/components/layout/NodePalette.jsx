import { MessageSquare, Settings, Sidebar } from "lucide-react";

function ActivityBtn({ onClick, title, children, disabled, active }) {
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
        <span className="absolute right-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
      )}
      {children}
    </button>
  );
}

export default function NodePalette({
  activePanel,
  settingsActive,
  onPanelToggle,
  onSettings,
}) {
  return (
    <div className="flex w-14 shrink-0 flex-col items-center border-r border-hairline bg-panel py-2">
      <ActivityBtn
        onClick={() => onPanelToggle("explorer")}
        title="Explorer (Ctrl+B)"
        active={activePanel === "explorer"}
      >
        <Sidebar size={20} />
      </ActivityBtn>

      <ActivityBtn
        onClick={() => onPanelToggle("chat")}
        title="Chat with workflow (Ctrl+Shift+K)"
        active={activePanel === "chat"}
      >
        <MessageSquare size={20} />
      </ActivityBtn>

      <div className="flex-1" />

      <ActivityBtn onClick={onSettings} title="Settings (Ctrl+,)" active={settingsActive}>
        <Settings size={20} />
      </ActivityBtn>
    </div>
  );
}
