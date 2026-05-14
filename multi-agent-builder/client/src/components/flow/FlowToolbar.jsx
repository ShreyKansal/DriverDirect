import { Bot, Crown, FileInput, FileOutput, LayoutDashboard, RotateCcw, Trash2 } from "lucide-react";
import { useWorkflowStore } from "../../store/workflowStore.js";

export default function FlowToolbar() {
  const selectedNodeId = useWorkflowStore((state) => state.selectedNodeId);
  const workflow = useWorkflowStore((state) => state.workflow);
  const addAgent = useWorkflowStore((state) => state.addAgent);
  const deleteNode = useWorkflowStore((state) => state.deleteNode);
  const resetWorkflow = useWorkflowStore((state) => state.resetWorkflow);
  const autoLayoutWorkflow = useWorkflowStore((state) => state.autoLayoutWorkflow);
  const updateWorkflow = useWorkflowStore((state) => state.updateWorkflow);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline bg-canvas px-4 py-3">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.88px] text-muted">Workflow Canvas</p>
        <h2 className="text-[22px] font-normal leading-[1.3] tracking-[-0.11px] text-ink">LangChain / LangGraph builder</h2>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex h-10 overflow-hidden rounded-lg border border-hairlineStrong bg-panel">
          {["langgraph", "langchain"].map((target) => (
            <button
              key={target}
              className={`px-3 text-[12px] font-semibold uppercase tracking-[0.88px] ${workflow.builderTarget === target ? "bg-ink text-canvas" : "text-ink"}`}
              onClick={() => updateWorkflow({ builderTarget: target })}
            >
              {target}
            </button>
          ))}
        </div>
        <button className="btn" onClick={() => addAgent("user_input")}><FileInput size={15} /> Prompt</button>
        <button className="btn-primary" onClick={() => addAgent("agent")}><Bot size={15} /> Agent</button>
        <button className="btn" onClick={() => addAgent("orchestrator")}><Crown size={15} /> Orchestrator</button>
        <button className="btn" onClick={() => addAgent("output")}><FileOutput size={15} /> Output</button>
        <button className="icon-btn" onClick={autoLayoutWorkflow} title="Auto layout canvas"><LayoutDashboard size={15} /></button>
        <button className="icon-btn" onClick={() => deleteNode(selectedNodeId)} disabled={!selectedNodeId} title="Delete selected node"><Trash2 size={15} /></button>
        <button className="icon-btn" onClick={resetWorkflow} title="Reset workflow"><RotateCcw size={15} /></button>
      </div>
    </div>
  );
}
