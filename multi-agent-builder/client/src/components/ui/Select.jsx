import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

/**
 * Shared custom select.
 *
 * Props:
 *   value     - currently selected value
 *   onChange  - (value: string) => void
 *   options   - [{ value, label, description?, meta? }]
 *   className - extra classes applied to the root wrapper
 *   variant   - "default" or "settings"
 */
export default function Select({
  value,
  onChange,
  options = [],
  className = "",
  variant = "default",
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const isSettings = variant === "settings";

  const selected = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const handler = (event) => {
      if (!ref.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        className={
          isSettings
            ? "flex h-[32px] w-full items-center justify-between gap-2 rounded-[2px] border border-hairline bg-surfaceStrong pl-[10px] pr-0 text-left text-[13px] text-ink transition hover:brightness-110 focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:text-muted"
            : "input flex w-full items-center justify-between gap-2 text-left disabled:cursor-not-allowed disabled:opacity-60"
        }
        onClick={() => setOpen((current) => !current)}
      >
        <span className="min-w-0 flex-1 truncate">{selected?.label ?? "Select..."}</span>
        <span
          className={
            isSettings
              ? "flex h-full w-8 shrink-0 items-center justify-center border-l border-hairline bg-surfaceStrong text-muted"
              : "flex shrink-0 items-center justify-center pr-3 text-muted"
          }
        >
          <ChevronDown
            size={isSettings ? 14 : 12}
            className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          />
        </span>
      </button>

      {open && (
        <div
          className={
            isSettings
              ? "absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-[4px] border border-hairline bg-surfaceStrong py-1 shadow-[0_4px_14px_rgba(0,0,0,0.4)]"
              : "absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-md border border-hairlineStrong bg-panel py-1 shadow-lg"
          }
        >
          {options.length === 0 ? (
            <div className={`px-3 py-2 text-[12px] ${isSettings ? "text-muted" : "text-muted"}`}>
              No options
            </div>
          ) : (
            options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  className={
                    isSettings
                      ? `flex w-full items-start gap-0 px-[10px] py-[5px] text-left text-[13px] transition-colors ${
                          isSelected
                            ? "bg-primary/10 text-primary font-medium"
                            : "bg-transparent text-ink hover:bg-canvasSoft"
                        }`
                      : `flex h-8 w-full items-center gap-2 px-3 text-left text-[13px] transition-colors ${
                          isSelected
                            ? "bg-primary/8 text-primary"
                            : "text-ink hover:bg-canvasSoft"
                        }`
                  }
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  <span className={`flex shrink-0 items-center justify-center ${isSettings ? "w-0" : "w-3"}`}>
                    {!isSettings && isSelected && <Check size={11} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{option.label}</span>
                    {option.description && (
                      <span
                        className={`mt-0.5 block text-[12px] leading-[1.35] ${
                          isSettings ? "text-body" : "text-muted"
                        }`}
                      >
                        {option.description}
                      </span>
                    )}
                  </span>
                  {option.meta && (
                    <span className={`ml-3 shrink-0 text-[11px] ${isSettings ? "text-body" : "text-muted"}`}>
                      {option.meta}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
