import { MdArrowDownward, MdArrowUpward, MdRemove } from "react-icons/md";
import { cx } from "./cx";
import { formatBy, formatDelta, formatMoney } from "./format";
import { Skeleton } from "./Skeleton";
import { InfoTip } from "./InfoTip";
import { Sparkline } from "./charts/Sparkline";

function DeltaPill({ delta, deltaLabel, invertDelta }) {
  if (delta === undefined) return null;
  const n = delta === null || delta === "" ? null : Number(delta);
  const valid = n !== null && Number.isFinite(n);
  const up = valid && n > 0;
  const down = valid && n < 0;
  const good = invertDelta ? down : up;
  const bad = invertDelta ? up : down;
  const tone = !valid || (!up && !down) ? "text-(--ink-2) bg-(--surface-2)" : good ? "text-(--success) bg-(--success-soft)" : bad ? "text-(--danger) bg-(--danger-soft)" : "";
  const Icon = up ? MdArrowUpward : down ? MdArrowDownward : MdRemove;
  const word = !valid ? "немає даних для порівняння" : up ? "зростання" : down ? "зниження" : "без змін";
  return (
    <span className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs">
      <span className={cx("inline-flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold tabular-nums", tone)}>
        <Icon aria-hidden="true" />
        <span className="sr-only">{word}: </span>
        {valid ? formatDelta(n) : "—"}
      </span>
      {deltaLabel && <span className="min-w-0 truncate text-(--ink-2)">{deltaLabel}</span>}
    </span>
  );
}

function ValueText({ value, format, compact, big }) {
  const isNode = value !== null && typeof value === "object";
  const text = isNode ? null : formatBy(format, value, { compact });
  const title = isNode ? undefined : format === "money" ? formatMoney(value) : text;
  return (
    <span
      className={cx(
        "block min-w-0 truncate font-bold leading-tight tracking-tight text-(--ink) tabular-nums",
        big ? "text-[clamp(1.25rem,0.9rem+1.2vw,1.75rem)]" : "text-[clamp(1.05rem,0.9rem+0.6vw,1.3rem)]",
      )}
      title={title}
      data-num=""
    >
      {isNode ? value : text}
    </span>
  );
}

/**
 * KpiCard({ label, value, delta, deltaLabel, hint, icon, loading, format,
 *           compact, invertDelta, sparkline, info, onClick, className })
 * value — число (форматується за format) або React-вузол.
 * format — 'money'|'int'|'pct'|'ratio'|'number'|'raw'|fn (за замовч. 'raw').
 * delta — зміна у ВІДСОТКАХ (12.5 = +12,5 %); null → «—»; undefined → не показувати.
 * invertDelta — для метрик, де зростання погане (повернення, скасування).
 * compact — стисла сума (12,3 тис. ₴). sparkline — масив чисел для міні-графіка.
 */
export function KpiCard({
  label,
  value,
  delta,
  deltaLabel,
  hint,
  icon,
  loading = false,
  format = "raw",
  compact = false,
  invertDelta = false,
  sparkline,
  info,
  onClick,
  className,
}) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cx(
        "flex min-w-0 flex-col gap-2 overflow-hidden rounded-(--r-lg) border border-(--line) bg-(--surface) p-4 text-left shadow-(--shadow-1)",
        onClick && "transition-shadow hover:shadow-(--shadow-2)",
        className,
      )}
    >
      <div className="flex min-w-0 items-start justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1 text-sm font-medium text-(--ink-2)">
          <span className="min-w-0 truncate" title={typeof label === "string" ? label : undefined}>
            {label}
          </span>
          {info && !onClick && <InfoTip text={info} />}
        </span>
        {icon && (
          <span aria-hidden="true" className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-(--r-md) bg-(--brand-soft) text-base text-(--brand-ink)">
            {icon}
          </span>
        )}
      </div>
      {loading ? (
        <div className="flex flex-col gap-2" aria-busy="true">
          <Skeleton height="1.75rem" width="70%" />
          <Skeleton height="0.875rem" width="45%" />
        </div>
      ) : (
        <>
          <ValueText value={value} format={format} compact={compact} big />
          <DeltaPill delta={delta} deltaLabel={deltaLabel} invertDelta={invertDelta} />
          {hint && <p className="min-w-0 break-words text-xs text-(--ink-2)">{hint}</p>}
          {Array.isArray(sparkline) && sparkline.length > 1 && (
            <Sparkline data={sparkline} height={32} className="mt-auto w-full" ariaLabel={`Динаміка: ${typeof label === "string" ? label : ""}`} />
          )}
        </>
      )}
    </Comp>
  );
}

/** Stat — компактний показник без рамки картки (ті самі props, що KpiCard). */
export function Stat({ label, value, delta, deltaLabel, hint, icon, loading = false, format = "raw", compact = false, invertDelta = false, info, className }) {
  return (
    <div className={cx("flex min-w-0 items-start gap-3", className)}>
      {icon && (
        <span aria-hidden="true" className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-(--r-md) bg-(--brand-soft) text-lg text-(--brand-ink)">
          {icon}
        </span>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex min-w-0 items-center gap-1 text-xs font-medium text-(--ink-2)">
          <span className="min-w-0 truncate">{label}</span>
          {info && <InfoTip text={info} />}
        </span>
        {loading ? <Skeleton height="1.25rem" width="60%" /> : <ValueText value={value} format={format} compact={compact} />}
        {!loading && <DeltaPill delta={delta} deltaLabel={deltaLabel} invertDelta={invertDelta} />}
        {!loading && hint && <span className="min-w-0 break-words text-xs text-(--ink-2)">{hint}</span>}
      </div>
    </div>
  );
}
