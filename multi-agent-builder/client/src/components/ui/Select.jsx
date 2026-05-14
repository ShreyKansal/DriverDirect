import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown } from "lucide-react";

/**
 * Themed select dropdown — matches the Header menu style exactly.
 *
 * Props:
 *   value     – currently selected value
 *   onChange  – (value: string) => void  (receives value directly, not an event)
 *   options   – [{ value, label }]
 *   className – extra classes applied to the root wrapper
 */
export default function Select({ value, onChange, options = [], className = "" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const selected = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        className="input flex w-full items-center justify-between gap-2 text-left"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="min-w-0 flex-1 truncate">{selected?.label ?? "Select…"}</span>
        <ChevronDown
          size={12}
          className={`shrink-0 text-muted transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown list */}
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-md border border-hairlineStrong bg-panel py-1 shadow-lg">
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                className={`flex h-8 w-full items-center gap-2 px-3 text-left text-[13px] transition-colors ${
                  isSelected
                    ? "bg-primary/8 text-primary"
                    : "text-ink hover:bg-canvasSoft"
                }`}
                onClick={() => { onChange(option.value); setOpen(false); }}
              >
                <span className="flex w-3 shrink-0 items-center justify-center">
                  {isSelected && <Check size={11} />}
                </span>
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
