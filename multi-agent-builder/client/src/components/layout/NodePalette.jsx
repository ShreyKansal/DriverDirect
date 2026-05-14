import { LayoutDashboard, MessageSquare, RotateCcw, Settings, Sidebar } from "lucide-react";
import { useWorkflowStore } from "../../store/workflowStore.js";

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

export default function NodePalette({ activePanel, projectSettingsActive, onPanelToggle, onProjectSettings }) {
  const resetWorkflow      = useWorkflowStore((s) => s.resetWorkflow);
  const autoLayoutWorkflow = useWorkflowStore((s) => s.autoLayoutWorkflow);

  return (
    <div className="flex w-14 shrink-0 flex-col items-center border-r border-hairline bg-panel py-2">
      <ActivityBtn
        onClick={() => onPanelToggle("explorer")}
        title="Explorer"
        active={activePanel === "explorer"}
      >
        <Sidebar size={20} />
      </ActivityBtn>

      <ActivityBtn
        onClick={() => onPanelToggle("chat")}
        title="Chat with workflow"
        active={activePanel === "chat"}
      >
        <MessageSquare size={20} />
      </ActivityBtn>

      <div className="my-1 h-px w-6 bg-hairline" />

      <ActivityBtn onClick={autoLayoutWorkflow} title="Auto-layout canvas">
        <LayoutDashboard size={20} />
      </ActivityBtn>

      <ActivityBtn onClick={resetWorkflow} title="Reset workflow">
        <RotateCcw size={20} />
      </ActivityBtn>

      <div className="flex-1" />

      <ActivityBtn onClick={onProjectSettings} title="Project settings" active={projectSettingsActive}>
        <Settings size={20} />
      </ActivityBtn>
    </div>
  );
}
