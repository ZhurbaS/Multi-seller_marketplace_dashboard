// Легкі SVG/CSS-графіки без бібліотек; кожен має текстову альтернативу (таблиця в <details>)
import React from "react";
import { num } from "./mkUtils";

// Кольори — токени графіків UI-кіта (світла/темна тема). Hex-кольори з викликів мапляться на токени.
const PALETTE = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--chart-6)", "var(--ink-2)"];
const HEX_TO_TOKEN = {
  "#4ade80": "var(--success)",
  "#fbbf24": "var(--warning)",
  "#f87171": "var(--danger)",
  "#ef4444": "var(--danger)",
  "#38bdf8": "var(--chart-1)",
  "#c084fc": "var(--chart-5)",
  "#94a3b8": "var(--line-strong)",
  "#64748b": "var(--ink-2)",
  "#475569": "var(--line)",
};
const tone = (c, k = 0) => (c ? HEX_TO_TOKEN[String(c).toLowerCase()] || c : PALETTE[k % PALETTE.length]);
const GRID = "var(--line)";
const AXIS = "var(--ink-2)";

const shortDate = (d) => {
  const x = new Date(d);
  return Number.isNaN(x.getTime()) ? String(d) : x.toLocaleDateString("uk-UA", { day: "2-digit", month: "2-digit" });
};

const DataTable = ({ caption, head, rows }) => (
  <details className="text-xs">
    <summary className="cursor-pointer select-none text-(--ink-2) hover:text-(--ink)">Показати таблицею</summary>
    <div className="overflow-auto max-h-60 mt-1">
      <table className="w-full text-left">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h} scope="col" className="px-2 py-1 font-semibold text-(--ink-2)">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-(--line)">
              {r.map((c, j) => (
                <td key={j} className="px-2 py-1 tabular-nums">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </details>
);

const Legend = ({ series }) => (
  <ul className="flex flex-wrap gap-3 text-xs">
    {series.map((s) => (
      <li key={s.label} className="flex items-center gap-1">
        <span className="w-3 h-3 rounded-sm" style={{ background: tone(s.color) }} aria-hidden="true" />
        {s.label}
      </li>
    ))}
  </ul>
);

// Лінійний графік (кілька серій) — labels: дати, series: [{label,color,values}]
export const LineChart = ({ title, labels = [], series = [], height = 180 }) => {
  const W = 600;
  const H = height;
  const P = { l: 34, r: 8, t: 10, b: 22 };
  const max = Math.max(1, ...series.flatMap((s) => s.values.map((v) => Number(v) || 0)));
  const n = Math.max(1, labels.length - 1);
  const x = (i) => P.l + ((W - P.l - P.r) * i) / n;
  const y = (v) => H - P.b - ((H - P.t - P.b) * (Number(v) || 0)) / max;
  const ticks = [0, Math.round(max / 2), max];
  const step = Math.max(1, Math.ceil(labels.length / 6));
  if (!labels.length) return <p className="text-sm text-(--ink-2)">Ще немає даних для графіка.</p>;
  return (
    <figure className="flex flex-col gap-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={title}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={P.l} x2={W - P.r} y1={y(t)} y2={y(t)} stroke={GRID} />
            <text x={P.l - 4} y={y(t) + 3} textAnchor="end" fontSize="10" fill={AXIS}>
              {t}
            </text>
          </g>
        ))}
        {labels.map((l, i) =>
          i % step === 0 || i === labels.length - 1 ? (
            <text key={i} x={x(i)} y={H - 6} textAnchor="middle" fontSize="10" fill={AXIS}>
              {shortDate(l)}
            </text>
          ) : null
        )}
        {series.map((s) => (
          <g key={s.label}>
            <polyline fill="none" stroke={tone(s.color)} strokeWidth="2.5" strokeLinejoin="round" points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(" ")} />
            {s.values.map((v, i) => (
              <circle key={i} cx={x(i)} cy={y(v)} r="2.5" fill={tone(s.color)}>
                <title>{`${shortDate(labels[i])}: ${s.label} — ${num(v)}`}</title>
              </circle>
            ))}
          </g>
        ))}
      </svg>
      <Legend series={series} />
      <DataTable
        caption={title}
        head={["Дата", ...series.map((s) => s.label)]}
        rows={labels.map((l, i) => [shortDate(l), ...series.map((s) => num(s.values[i]))])}
      />
    </figure>
  );
};

// Стовпчики по днях (згруповані серії)
export const DayBars = ({ title, labels = [], series = [], height = 170 }) => {
  const W = 600;
  const H = height;
  const P = { l: 34, r: 6, t: 8, b: 22 };
  if (!labels.length) return <p className="text-sm text-(--ink-2)">Ще немає даних по днях.</p>;
  const max = Math.max(1, ...series.flatMap((s) => s.values.map((v) => Number(v) || 0)));
  const slot = (W - P.l - P.r) / labels.length;
  const bw = Math.max(2, (slot * 0.8) / Math.max(1, series.length));
  const h = (v) => ((H - P.t - P.b) * (Number(v) || 0)) / max;
  const step = Math.max(1, Math.ceil(labels.length / 8));
  return (
    <figure className="flex flex-col gap-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={title}>
        {[0, Math.round(max / 2), max].map((t) => (
          <g key={t}>
            <line x1={P.l} x2={W - P.r} y1={H - P.b - h(t)} y2={H - P.b - h(t)} stroke={GRID} />
            <text x={P.l - 4} y={H - P.b - h(t) + 3} textAnchor="end" fontSize="10" fill={AXIS}>
              {t}
            </text>
          </g>
        ))}
        {labels.map((l, i) => (
          <g key={i}>
            {series.map((s, j) => (
              <rect key={s.label} x={P.l + i * slot + slot * 0.1 + j * bw} y={H - P.b - h(s.values[i])} width={bw - 1} height={h(s.values[i])} fill={tone(s.color)} rx="1">
                <title>{`${shortDate(l)}: ${s.label} — ${num(s.values[i])}`}</title>
              </rect>
            ))}
            {(i % step === 0 || i === labels.length - 1) && (
              <text x={P.l + i * slot + slot / 2} y={H - 6} textAnchor="middle" fontSize="10" fill={AXIS}>
                {shortDate(l)}
              </text>
            )}
          </g>
        ))}
      </svg>
      <Legend series={series} />
      <DataTable caption={title} head={["Дата", ...series.map((s) => s.label)]} rows={labels.map((l, i) => [shortDate(l), ...series.map((s) => num(s.values[i]))])} />
    </figure>
  );
};

// Горизонтальні смуги: items [{label, value, color?, hint?}]
export const HBars = ({ title, items = [], unit = "" }) => {
  const max = Math.max(1, ...items.map((i) => Number(i.value) || 0));
  const total = items.reduce((a, i) => a + (Number(i.value) || 0), 0);
  if (!items.length || !total) return <p className="text-sm text-(--ink-2)">Немає даних.</p>;
  return (
    <ul className="flex flex-col gap-2" aria-label={title}>
      {items.map((i, k) => (
        <li key={i.label} className="flex flex-col gap-0.5">
          <div className="flex justify-between gap-2 text-xs">
            <span title={i.hint}>{i.label}</span>
            <span className="tabular-nums">
              {num(i.value)}
              {unit} <span className="text-(--ink-2)">({Math.round((100 * (Number(i.value) || 0)) / total)}%)</span>
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded bg-(--surface-2)" aria-hidden="true">
            <div className="h-full rounded" style={{ width: `${(100 * (Number(i.value) || 0)) / max}%`, background: tone(i.color, k) }} />
          </div>
        </li>
      ))}
    </ul>
  );
};

// Одна складена смуга (частки) з легендою
export const StackBar = ({ title, items = [] }) => {
  const total = items.reduce((a, i) => a + (Number(i.value) || 0), 0);
  if (!total) return <p className="text-sm text-(--ink-2)">Немає даних.</p>;
  const withColor = items.map((i, k) => ({ ...i, color: tone(i.color, k) }));
  return (
    <figure className="flex flex-col gap-2">
      <div className="flex h-5 rounded overflow-hidden" role="img" aria-label={`${title}: ${withColor.map((i) => `${i.label} ${num(i.value)}`).join(", ")}`}>
        {withColor.map((i) =>
          Number(i.value) > 0 ? <div key={i.label} style={{ width: `${(100 * i.value) / total}%`, background: i.color }} title={`${i.label}: ${num(i.value)}`} /> : null
        )}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {withColor.map((i) => (
          <li key={i.label} className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm" style={{ background: i.color }} aria-hidden="true" />
            {i.label}: <b className="tabular-nums">{num(i.value)}</b>
          </li>
        ))}
      </ul>
    </figure>
  );
};

// Міні-спарклайн для KPI
export const Sparkline = ({ values = [], color = "var(--chart-1)", label }) => {
  if (values.length < 2) return null;
  const max = Math.max(1, ...values);
  const pts = values.map((v, i) => `${(100 * i) / (values.length - 1)},${30 - (28 * (Number(v) || 0)) / max}`).join(" ");
  return (
    <svg viewBox="0 0 100 32" className="w-full h-8" role="img" aria-label={label} preserveAspectRatio="none">
      <polyline fill="none" stroke={tone(color)} strokeWidth="2" vectorEffect="non-scaling-stroke" points={pts} />
    </svg>
  );
};
