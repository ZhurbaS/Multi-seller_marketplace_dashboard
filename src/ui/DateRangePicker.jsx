import { useEffect, useId, useRef, useState } from "react";
import { MdCalendarMonth, MdExpandMore } from "react-icons/md";
import { cx } from "./cx";
import { Button } from "./Button";
import { Input, Select } from "./Form";
import { formatDate } from "./format";
import { COMPARE_OPTIONS, DATE_PRESETS, defaultRange, detectPreset, isYmd, kyivToday, resolvePreset } from "./dateRange";

function label(v) {
  const p = DATE_PRESETS.find((x) => x.value === v.preset);
  if (p && p.value !== "custom") return p.label;
  if (v.from === v.to) return formatDate(v.from);
  return `${formatDate(v.from, { short: true })} – ${formatDate(v.to)}`;
}

/**
 * DateRangePicker({ value:{from,to,compare,preset?}, onChange({from,to,compare,preset}),
 *                   allowCompare=true, align: left|right, className })
 * Пресети: Сьогодні / 7 / 30 / 90 днів / Цей місяць / Рік (365 дн.) / Довільний.
 * Порівняння: prev (Попередній період) | yoy (Рік тому) | none (Без порівняння).
 * Дати — 'YYYY-MM-DD' (Europe/Kyiv). Без value використовується 30 днів + prev.
 */
export function DateRangePicker({ value, onChange, allowCompare = true, align = "right", className }) {
  const v = value && isYmd(value.from) && isYmd(value.to) ? { compare: "prev", ...value } : defaultRange();
  const preset = v.preset || detectPreset(v.from, v.to);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ ...v, preset });
  const [error, setError] = useState("");
  const rootRef = useRef(null);
  const btnRef = useRef(null);
  const pid = useId();
  const today = kyivToday();

  const toggle = () => {
    if (!open) {
      setDraft({ ...v, preset });
      setError("");
    }
    setOpen((o) => !o);
  };

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => rootRef.current && !rootRef.current.contains(e.target) && setOpen(false);
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pick = (p) => {
    if (p === "custom") setDraft((d) => ({ ...d, preset: "custom" }));
    else setDraft((d) => ({ ...d, ...resolvePreset(p, today), preset: p }));
    setError("");
  };

  const apply = () => {
    if (!isYmd(draft.from) || !isYmd(draft.to)) return setError("Вкажіть обидві дати");
    if (draft.from > draft.to) return setError("Дата початку пізніша за дату кінця");
    if (draft.to > today) return setError("Дата кінця не може бути в майбутньому");
    const next = { from: draft.from, to: draft.to, compare: allowCompare ? draft.compare || "prev" : "none" };
    next.preset = draft.preset === "custom" ? detectPreset(next.from, next.to) : draft.preset;
    onChange?.(next);
    setOpen(false);
    btnRef.current?.focus();
  };

  const cmpLabel = COMPARE_OPTIONS.find((c) => c.value === v.compare)?.label;

  return (
    <div ref={rootRef} className={cx("relative min-w-0", className)}>
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? pid : undefined}
        onClick={toggle}
        className="inline-flex h-11 max-w-full min-w-0 items-center gap-2 rounded-(--r-md) border border-(--line) bg-(--surface) px-3 text-left text-sm text-(--ink) hover:border-(--line-strong)"
      >
        <MdCalendarMonth aria-hidden="true" className="shrink-0 text-lg text-(--ink-2)" />
        <span className="min-w-0 truncate">
          <span className="font-semibold">{label({ ...v, preset })}</span>
          {allowCompare && v.compare !== "none" && <span className="text-(--ink-2) max-sm:hidden"> · vs {cmpLabel?.toLowerCase()}</span>}
        </span>
        <MdExpandMore aria-hidden="true" className="shrink-0 text-lg text-(--ink-2)" />
      </button>

      {open && (
        <div
          id={pid}
          role="dialog"
          aria-label="Вибір періоду"
          className={cx(
            "z-50 rounded-(--r-lg) border border-(--line) bg-(--surface) p-4 text-(--ink) shadow-(--shadow-3)",
            "max-sm:fixed max-sm:inset-x-3 max-sm:bottom-3 max-sm:max-h-[85dvh] max-sm:overflow-y-auto",
            "sm:absolute sm:top-full sm:mt-2 sm:w-[22rem]",
            align === "left" ? "sm:left-0" : "sm:right-0",
          )}
        >
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-(--ink-2)">Період</p>
          <div className="grid grid-cols-2 gap-1.5" role="radiogroup" aria-label="Пресет періоду">
            {DATE_PRESETS.map((p) => (
              <button
                key={p.value}
                type="button"
                role="radio"
                aria-checked={draft.preset === p.value}
                onClick={() => pick(p.value)}
                className={cx(
                  "h-9 rounded-(--r-sm) border px-2 text-sm font-medium transition-colors",
                  draft.preset === p.value ? "border-(--brand) bg-(--brand-soft) text-(--brand-ink)" : "border-(--line) hover:bg-(--surface-2)",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <label className="flex min-w-0 flex-col gap-1 text-xs text-(--ink-2)">
              Від
              <Input type="date" value={draft.from} max={today} onChange={(e) => setDraft((d) => ({ ...d, from: e.target.value, preset: "custom" }))} />
            </label>
            <label className="flex min-w-0 flex-col gap-1 text-xs text-(--ink-2)">
              До
              <Input type="date" value={draft.to} max={today} onChange={(e) => setDraft((d) => ({ ...d, to: e.target.value, preset: "custom" }))} />
            </label>
          </div>

          {allowCompare && (
            <label className="mt-3 flex flex-col gap-1 text-xs text-(--ink-2)">
              Порівняти з
              <Select value={draft.compare || "prev"} options={COMPARE_OPTIONS} onChange={(e) => setDraft((d) => ({ ...d, compare: e.target.value }))} />
            </label>
          )}

          {error && (
            <p role="alert" className="mt-2 text-xs font-medium text-(--danger)">
              {error}
            </p>
          )}

          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Скасувати
            </Button>
            <Button size="sm" onClick={apply}>
              Застосувати
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
