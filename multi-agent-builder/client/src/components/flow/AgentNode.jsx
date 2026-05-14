import { Handle, Position } from "@xyflow/react";
import { Bot, Crown, FileInput, FileOutput, Wrench } from "lucide-react";

export default function AgentNode({ data }) {
  const isOrchestrator = data.type === "orchestrator";
  const isInput = data.type === "user_input";
  const isOutput = data.type === "output";
  const icon = isOrchestrator ? <Crown size={15} /> : isInput ? <FileInput size={15} /> : isOutput ? <FileOutput size={15} /> : <Bot size={15} />;
  const toolCount = (data.builtinTools?.length || 0) + (data.customTools?.length || 0);
  return (
    <div className={`w-56 rounded-xl border bg-panel px-4 py-3 shadow-soft ${data.selected ? "border-primary ring-2 ring-primary/15" : "border-hairlineStrong"}`}>
      <Handle type="target" position={Position.Left} className="!h-3 !w-3 !border-2 !border-panel !bg-primary" />
      <div className="flex items-start gap-2">
        <div className={`mt-0.5 rounded-md p-1.5 ${isOrchestrator ? "bg-primary text-white" : isInput ? "bg-surfaceStrong text-ink" : isOutput ? "bg-ink text-canvas" : "bg-canvasSoft text-ink"}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <div className="truncate text-[16px] font-semibold leading-[1.4] text-ink">{data.name}</div>
          <div className="truncate text-[13px] leading-[1.4] text-muted">{data.role}</div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between font-mono text-[12px] text-muted">
        <span>{data.model || "default model"}</span>
        <div className="flex items-center gap-2">
          {toolCount > 0 && (
            <span className="flex items-center gap-0.5 rounded bg-primary/8 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
              <Wrench size={9} />
              {toolCount}
            </span>
          )}
          <span>{data.outputFormat}</span>
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="!h-3 !w-3 !border-2 !border-panel !bg-primary" />
    </div>
  );
}
