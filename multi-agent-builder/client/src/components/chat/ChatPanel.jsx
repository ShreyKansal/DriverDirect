import { useEffect, useRef, useState } from "react";
import { MessageSquare, Paperclip, Send, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useWorkflowStore } from "../../store/workflowStore.js";

const ACCEPTED = ".txt,.md,.csv,.json,.png,.jpg,.jpeg,.webp,.gif";

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const isImageFile = (f) => f.type.startsWith("image/");

// ── Markdown renderer ─────────────────────────────────────────────────────────
const mdComponents = {
  h1: ({ children }) => <p className="mb-1 mt-3 text-[13px] font-bold text-ink first:mt-0">{children}</p>,
  h2: ({ children }) => <p className="mb-1 mt-3 text-[12.5px] font-bold text-ink first:mt-0">{children}</p>,
  h3: ({ children }) => <p className="mb-0.5 mt-2.5 text-[12px] font-semibold text-ink first:mt-0">{children}</p>,
  p:  ({ children }) => <p className="mb-2 last:mb-0 text-[12px] leading-relaxed text-ink">{children}</p>,
  ul: ({ children }) => <ul className="mb-2 ml-4 list-disc space-y-0.5 text-[12px] text-ink">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal space-y-0.5 text-[12px] text-ink">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  hr: () => <hr className="my-3 border-hairline" />,
  strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
  em: ({ children }) => <em className="italic text-body">{children}</em>,
  code: ({ inline, children }) =>
    inline
      ? <code className="rounded-[2px] bg-surfaceStrong px-1.5 py-0.5 font-mono text-[11px] text-error">{children}</code>
      : <pre className="my-2 overflow-x-auto rounded-[2px] border border-hairline bg-canvasSoft p-3 font-mono text-[11px] leading-relaxed text-ink"><code>{children}</code></pre>,
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-2 border-primary pl-3 text-[12px] text-body">{children}</blockquote>
  ),
};

// ── Message bubble ────────────────────────────────────────────────────────────
function MessageBubble({ msg }) {
  const isUser = msg.role === "user";

  return (
    <div className={`flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
      <span className="px-1 text-[10px] font-medium text-muted">
        {isUser ? "You" : "Workflow"}
      </span>

      <div className={`max-w-[88%] ${isUser ? "" : "w-full"}`}>
        {msg.images?.length > 0 && (
          <div className={`mb-1.5 flex flex-wrap gap-1.5 ${isUser ? "justify-end" : ""}`}>
            {msg.images.map((src, i) => (
              <img key={i} src={src} alt="attachment"
                className="max-h-32 rounded-[2px] border border-hairline object-cover" />
            ))}
          </div>
        )}

        {msg.files?.length > 0 && (
          <div className={`mb-1.5 flex flex-wrap gap-1 ${isUser ? "justify-end" : ""}`}>
            {msg.files.map((f, i) => (
              <span key={i} className="rounded-[2px] bg-surfaceStrong px-2 py-0.5 text-[10px] font-medium text-body">{f}</span>
            ))}
          </div>
        )}

        {isUser ? (
          <div className="rounded-[2px] bg-surfaceStrong px-3.5 py-2.5">
            <p className="whitespace-pre-wrap text-[12px] leading-relaxed text-ink">{msg.content}</p>
          </div>
        ) : (
          <div className="px-1">
            <ReactMarkdown components={mdComponents}>{msg.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex flex-col items-start gap-1">
      <span className="px-1 text-[10px] font-medium text-muted">Workflow</span>
      <div className="flex items-center gap-1.5 px-1 py-2">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted" />
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ChatPanel() {
  const running        = useWorkflowStore((s) => s.runs[s.activeProjectId]?.running ?? false);
  const trace          = useWorkflowStore((s) => s.runs[s.activeProjectId]?.trace ?? null);
  const setRuntimeTask = useWorkflowStore((s) => s.setRuntimeTask);
  const startRun       = useWorkflowStore((s) => s.startRun);

  const [messages,    setMessages]    = useState([]);
  const [input,       setInput]       = useState("");
  const [attachments, setAttachments] = useState([]);
  const pendingRef   = useRef(false);
  const listEndRef   = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef  = useRef(null);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, running]);

  useEffect(() => {
    if (!running && pendingRef.current) {
      pendingRef.current = false;
      const output = trace?.finalOutput || trace?.errors?.[0] || "No output.";
      setMessages((prev) => [...prev, { role: "assistant", content: output }]);
    }
  }, [running, trace]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, [input]);

  async function handleFiles(fileList) {
    const parsed = await Promise.all(Array.from(fileList).map(async (file) => {
      const ext = file.name.split(".").pop()?.toLowerCase() || "file";
      if (isImageFile(file)) return { name: file.name, ext, type: "image", dataUrl: await readFileAsDataURL(file) };
      return { name: file.name, ext, type: "text", text: await readFileAsText(file) };
    }));
    setAttachments((prev) => [...prev, ...parsed]);
  }

  function buildPrompt(text, atts) {
    const textFiles = atts.filter((a) => a.type === "text");
    return text + textFiles.map((a) => `\n\n--- Attached: ${a.name} ---\n${a.text}`).join("");
  }

  function handleSend() {
    const text = input.trim();
    if ((!text && !attachments.length) || running) return;

    const images = attachments.filter((a) => a.type === "image").map((a) => a.dataUrl);
    const files  = attachments.filter((a) => a.type === "text").map((a) => a.name);

    setMessages((prev) => [...prev, {
      role: "user", content: text,
      images: images.length ? images : undefined,
      files:  files.length  ? files  : undefined,
    }]);
    setRuntimeTask(buildPrompt(text, attachments));
    setInput("");
    setAttachments([]);
    pendingRef.current = true;
    startRun();
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  const canSend = (input.trim() || attachments.length > 0) && !running;

  return (
    <div
      className="flex h-full flex-col bg-canvas"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files); }}
    >
      {/* Message list */}
      <div className="slim-scroll min-h-0 flex-1 overflow-y-auto px-4 py-5">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-hairline bg-canvasSoft">
              <MessageSquare size={18} className="text-muted" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-ink">Chat with your workflow</p>
              <p className="mt-1.5 text-[11px] leading-relaxed text-body">
                Type a message to trigger a run.<br />Attach text files or images as context.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
            {running && <TypingIndicator />}
          </div>
        )}
        <div ref={listEndRef} />
      </div>

      {/* Input area */}
      <div className="shrink-0 border-t border-hairline px-3 pb-3 pt-2">
        {/* Attachment chips */}
        {attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5 px-0.5">
            {attachments.map((att, i) => (
              <div key={i} className="flex items-center gap-1.5 rounded-[2px] border border-hairline bg-surfaceStrong px-2 py-1 text-[11px] text-body">
                {att.type === "image"
                  ? <img src={att.dataUrl} alt={att.name} className="h-4 w-4 rounded-[2px] object-cover" />
                  : <span className="text-[9px] font-bold uppercase text-muted">.{att.ext}</span>
                }
                <span className="max-w-[80px] truncate">{att.name}</span>
                <button onClick={() => setAttachments((p) => p.filter((_, j) => j !== i))} className="text-muted hover:text-error">
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input box */}
        <div className={`rounded-[2px] border bg-panel transition-colors ${
          running ? "border-hairline opacity-60" : "border-hairlineStrong focus-within:border-primary"
        }`}>
          <textarea
            ref={textareaRef}
            className="block w-full resize-none bg-transparent px-3 pb-0 pt-2.5 text-[12.5px] leading-snug text-ink outline-none placeholder:text-muted"
            placeholder="Ask your workflow something…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            disabled={running}
            rows={1}
          />
          <div className="flex items-center justify-between px-2.5 pb-2 pt-1">
            <button
              className="flex h-7 w-7 items-center justify-center rounded-[2px] text-muted transition hover:bg-canvasSoft hover:text-body disabled:opacity-40"
              onClick={() => fileInputRef.current?.click()}
              disabled={running}
              title="Attach file"
            >
              <Paperclip size={14} />
            </button>
            <input ref={fileInputRef} type="file" accept={ACCEPTED} multiple className="hidden"
              onChange={(e) => { if (e.target.files?.length) handleFiles(e.target.files); e.target.value = ""; }} />
            <button
              className={`flex h-7 w-7 items-center justify-center rounded-[2px] transition ${
                canSend ? "bg-primary text-white hover:bg-primary/90" : "bg-canvasSoft text-muted opacity-50"
              }`}
              onClick={handleSend}
              disabled={!canSend}
              title="Send (Enter)"
            >
              <Send size={12} />
            </button>
          </div>
        </div>
        <p className="mt-1.5 px-0.5 text-[10px] text-muted">↵ Send · ⇧↵ New line</p>
      </div>
    </div>
  );
}
