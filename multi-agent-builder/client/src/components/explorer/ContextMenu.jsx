import { useEffect, useRef } from "react";

export default function ContextMenu({ x, y, items, onClose }) {
  const ref = useRef(null);

  // Close on outside click or Escape
  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose(); }
    function onDown(e) { if (ref.current && !ref.current.contains(e.target)) onClose(); }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [onClose]);

  // Keep menu inside viewport
  const style = { position: "fixed", zIndex: 9999, top: y, left: x };

  return (
    <div
      ref={ref}
      style={style}
      className="min-w-[160px] overflow-hidden rounded-md border border-hairlineStrong bg-panel py-1 shadow-modal"
    >
      {items.map((item, i) =>
        item === "---" ? (
          <div key={i} className="my-1 border-t border-hairline" />
        ) : (
          <button
            key={i}
            className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] transition hover:bg-canvasSoft ${
              item.danger ? "text-error" : "text-ink"
            }`}
            onClick={() => { item.action(); onClose(); }}
          >
            {item.icon && <span className="shrink-0 text-muted">{item.icon}</span>}
            {item.label}
          </button>
        )
      )}
    </div>
  );
}
