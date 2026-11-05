import { ChartPlaceholder } from "./ChartEmpty";
import { makeFormatter } from "./chartUtils";
import { formatPct } from "../format";

/**
 * FunnelChart({ steps:[{label, value, rate?}], format='int', minSample=30, ariaLabel, loading, emptyText })
 * Власний SVG. Між кроками — конверсія value/prev.value (якщо prev.value ≥ minSample,
 * інакше «мало даних»). rate (частка 0..1) у кроці перекриває обчислену конверсію; rate:null → «мало даних».
 */
export function FunnelChart({ steps = [], format = "int", minSample = 30, ariaLabel = "Воронка конверсії", loading = false, emptyText }) {
  const f = makeFormatter(format);
  const vals = steps.map((s) => Number(s.value) || 0);
  const top = Math.max(0, ...vals);
  if (loading || top === 0) return <ChartPlaceholder loading={loading} height={220} emptyText={emptyText} />;

  const W = 100;
  const H = 36;
  const width = (v) => Math.max(6, (v / top) * W);

  const conv = (i) => {
    if (i === 0) return null;
    const s = steps[i];
    if (Object.prototype.hasOwnProperty.call(s, "rate")) return s.rate === null || s.rate === undefined ? undefined : Number(s.rate);
    const prev = vals[i - 1];
    if (prev < minSample) return undefined;
    return prev ? vals[i] / prev : undefined;
  };

  const summary = steps
    .map((s, i) => {
      const c = conv(i);
      return `${s.label}: ${f(s.value)}${i ? `, конверсія ${c === undefined ? "— мало даних" : formatPct(c, { ratio: true })}` : ""}`;
    })
    .join("; ");

  return (
    <figure className="m-0 min-w-0" aria-label={ariaLabel} role="group">
      <ol className="flex flex-col gap-1" aria-hidden="true">
        {steps.map((s, i) => {
          const w = width(vals[i]);
          const wn = i < steps.length - 1 ? width(vals[i + 1]) : w * 0.92;
          const x1 = (W - w) / 2;
          const x2 = (W - wn) / 2;
          const c = conv(i);
          return (
            <li key={`${s.label}-${i}`} className="min-w-0">
              {i > 0 && (
                <div className="flex justify-center py-0.5 text-xs">
                  <span className="rounded-full bg-(--surface-2) px-2 py-0.5 font-medium text-(--ink-2) tabular-nums">
                    ↓ {c === undefined ? "мало даних" : formatPct(c, { ratio: true })}
                  </span>
                </div>
              )}
              <div className="grid min-w-0 grid-cols-[minmax(0,9rem)_minmax(0,1fr)_minmax(0,5.5rem)] items-center gap-3 max-sm:grid-cols-[minmax(0,1fr)_minmax(0,auto)]">
                <span className="min-w-0 truncate text-sm font-medium text-(--ink)" title={s.label}>
                  {s.label}
                </span>
                <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="block h-9 w-full max-sm:order-3 max-sm:col-span-2">
                  <polygon
                    points={`${x1},0 ${x1 + w},0 ${x2 + wn},${H} ${x2},${H}`}
                    style={{ fill: `color-mix(in srgb, var(--chart-1) ${100 - i * Math.min(14, 60 / Math.max(1, steps.length - 1))}%, var(--surface))` }}
                  />
                </svg>
                <span className="min-w-0 truncate text-right text-sm font-semibold text-(--ink) tabular-nums" title={f(s.value)}>
                  {f(s.value)}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
      <figcaption className="sr-only">{summary}</figcaption>
    </figure>
  );
}
