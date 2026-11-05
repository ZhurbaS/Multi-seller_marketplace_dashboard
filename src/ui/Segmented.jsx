import { useId, useRef } from "react";
import { cx } from "./cx";

function moveFocus(e, refs, count, current, onSelect) {
  const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
  let next = null;
  if (e.key in keys) next = (current + keys[e.key] + count) % count;
  if (e.key === "Home") next = 0;
  if (e.key === "End") next = count - 1;
  if (next === null) return;
  e.preventDefault();
  refs.current[next]?.focus();
  onSelect(next);
}

/**
 * Segmented({ options:[{value,label,icon?,disabled?}], value, onChange(value), size: sm|md, ariaLabel, fullWidth })
 * Радіогрупа-перемикач (для 2–5 варіантів).
 */
export function Segmented({ options = [], value, onChange, size = "md", ariaLabel, fullWidth = false, className }) {
  const refs = useRef([]);
  const idx = Math.max(0, options.findIndex((o) => o.value === value));
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cx(
        "inline-flex min-w-0 max-w-full items-center gap-0.5 overflow-x-auto rounded-(--r-md) border border-(--line) bg-(--surface-2) p-0.5 scrollbar-thin",
        fullWidth && "flex w-full",
        className,
      )}
    >
      {options.map((o, i) => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            ref={(el) => (refs.current[i] = el)}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={o.ariaLabel}
            title={o.ariaLabel}
            disabled={o.disabled}
            tabIndex={i === idx ? 0 : -1}
            onClick={() => onChange?.(o.value)}
            onKeyDown={(e) => moveFocus(e, refs, options.length, i, (n) => onChange?.(options[n].value))}
            className={cx(
              "inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-[calc(var(--r-md)-2px)] font-medium transition-colors disabled:opacity-50",
              size === "sm" ? "h-8 px-2.5 text-xs" : "h-9 px-3 text-sm",
              fullWidth && "flex-1",
              active ? "bg-(--surface) text-(--ink) shadow-(--shadow-1)" : "text-(--ink-2) hover:text-(--ink)",
            )}
          >
            {o.icon && <span aria-hidden="true" className="inline-flex">{o.icon}</span>}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Tabs({ tabs:[{value,label,count?,icon?,disabled?}], value, onChange(value), ariaLabel })
 * Лише смуга вкладок; вміст рендерить сторінка. Для зв'язку з панеллю передайте idPrefix
 * і дайте панелі id=`${idPrefix}-panel-${value}` role="tabpanel".
 */
export function Tabs({ tabs = [], value, onChange, ariaLabel, className, idPrefix }) {
  const refs = useRef([]);
  const auto = useId();
  const pfx = idPrefix || `t${auto}`;
  const idx = Math.max(0, tabs.findIndex((t) => t.value === value));
  return (
    <div role="tablist" aria-label={ariaLabel} className={cx("flex min-w-0 gap-1 overflow-x-auto border-b border-(--line) scrollbar-thin", className)}>
      {tabs.map((t, i) => {
        const active = t.value === value;
        return (
          <button
            key={String(t.value)}
            ref={(el) => (refs.current[i] = el)}
            id={`${pfx}-tab-${t.value}`}
            type="button"
            role="tab"
            aria-selected={active}
            aria-controls={`${pfx}-panel-${t.value}`}
            disabled={t.disabled}
            tabIndex={i === idx ? 0 : -1}
            onClick={() => onChange?.(t.value)}
            onKeyDown={(e) => moveFocus(e, refs, tabs.length, i, (n) => onChange?.(tabs[n].value))}
            className={cx(
              "-mb-px inline-flex h-11 shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-3 text-sm font-medium transition-colors disabled:opacity-50",
              active ? "border-(--brand) text-(--brand-ink)" : "border-transparent text-(--ink-2) hover:text-(--ink)",
            )}
          >
            {t.icon && <span aria-hidden="true" className="inline-flex">{t.icon}</span>}
            {t.label}
            {t.count !== undefined && t.count !== null && (
              <span className={cx("rounded-full px-1.5 text-xs tabular-nums", active ? "bg-(--brand-soft)" : "bg-(--surface-2)")}>{t.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
