import { useMemo } from "react";
import { ChartPlaceholder } from "./ChartEmpty";
import { DOW_LABELS, makeFormatter } from "./chartUtils";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS = [1, 2, 3, 4, 5, 6, 7];

/**
 * Heatmap — теплова карта (CSS-grid, без ApexCharts).
 * За замовчуванням — «день тижня × година» для GET /sales heatmap:[{dow,hour,orders}].
 * Props: data, xKey='hour', yKey='dow', valueKey='orders', xValues=[0..23], yValues=[1..7],
 *        xLabel(v), yLabel(v), format='int', valueLabel='Замовлень', ariaLabel, loading, emptyText.
 */
export function Heatmap({
  data = [],
  xKey = "hour",
  yKey = "dow",
  valueKey = "orders",
  xValues = HOURS,
  yValues = DAYS,
  xLabel = (v) => String(v),
  yLabel = (v) => DOW_LABELS[v] ?? String(v),
  format = "int",
  valueLabel = "Замовлень",
  ariaLabel = "Теплова карта: день тижня × година",
  loading = false,
  emptyText,
  height = 220,
}) {
  const f = makeFormatter(format);
  const { grid, max, peak } = useMemo(() => {
    const g = new Map();
    let mx = 0;
    let pk = null;
    for (const d of data || []) {
      const v = Number(d?.[valueKey]) || 0;
      const k = `${d?.[yKey]}|${d?.[xKey]}`;
      g.set(k, (g.get(k) || 0) + v);
    }
    for (const [k, v] of g) {
      if (v > mx) {
        mx = v;
        pk = k;
      }
    }
    return { grid: g, max: mx, peak: pk };
  }, [data, xKey, yKey, valueKey]);

  if (loading || max === 0) return <ChartPlaceholder loading={loading} height={height} emptyText={emptyText} />;

  const [py, px] = (peak || "").split("|");
  const summary = `${ariaLabel}. Пік: ${yLabel(Number(py))}, ${xLabel(Number(px))} — ${f(max)}.`;

  return (
    <figure className="m-0 min-w-0" aria-label={ariaLabel} role="group">
      <div className="overflow-x-auto pb-1 scrollbar-thin">
        <div
          className="grid min-w-[560px] gap-[3px] text-[0.6875rem] text-(--ink-2)"
          style={{ gridTemplateColumns: `2.25rem repeat(${xValues.length}, minmax(0, 1fr))` }}
          aria-hidden="true"
        >
          <span />
          {xValues.map((x) => (
            <span key={`h${x}`} className="text-center tabular-nums">
              {xValues.length > 12 && Number(x) % 3 !== 0 ? "" : xLabel(x)}
            </span>
          ))}
          {yValues.map((y) => (
            <div key={`r${y}`} className="contents">
              <span className="flex items-center font-medium">{yLabel(y)}</span>
              {xValues.map((x) => {
                const v = grid.get(`${y}|${x}`) || 0;
                const pct = v ? Math.round(18 + (v / max) * 82) : 0;
                return (
                  <span
                    key={`c${y}-${x}`}
                    title={`${yLabel(y)}, ${xLabel(x)}: ${f(v)}`}
                    className="aspect-square min-h-3 rounded-[3px]"
                    style={{ background: v ? `color-mix(in srgb, var(--chart-1) ${pct}%, var(--surface))` : "var(--surface-2)" }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-end gap-2 text-xs text-(--ink-2)" aria-hidden="true">
        <span>менше</span>
        {[0, 25, 50, 75, 100].map((p) => (
          <span
            key={p}
            className="h-3 w-3 rounded-[3px]"
            style={{ background: p ? `color-mix(in srgb, var(--chart-1) ${18 + p * 0.82}%, var(--surface))` : "var(--surface-2)" }}
          />
        ))}
        <span>більше</span>
      </div>
      <figcaption className="sr-only">
        {summary} {valueLabel}: максимум {f(max)}.
      </figcaption>
    </figure>
  );
}
