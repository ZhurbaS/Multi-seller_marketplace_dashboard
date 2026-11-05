import { useId } from "react";
import { cx } from "../cx";

/**
 * Sparkline({ data:number[], color='var(--chart-1)', height=32, width=120, area=true, ariaLabel, className })
 * Легкий SVG без ApexCharts (для KPI-карток і таблиць). Ширина тягнеться до контейнера.
 */
export function Sparkline({ data = [], color = "var(--chart-1)", height = 32, width = 120, area = true, ariaLabel, className }) {
  const gid = useId().replace(/:/g, "");
  const nums = (data || []).map((v) => (Number.isFinite(Number(v)) ? Number(v) : 0));
  if (nums.length < 2) return null;
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const span = max - min || 1;
  const pad = 2;
  const step = (width - pad * 2) / (nums.length - 1);
  const pts = nums.map((v, i) => [pad + i * step, pad + (height - pad * 2) * (1 - (v - min) / span)]);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const fill = `${line} L${pts[pts.length - 1][0].toFixed(1)} ${height} L${pts[0][0].toFixed(1)} ${height} Z`;
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      width="100%"
      height={height}
      role={ariaLabel ? "img" : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
      className={cx("block overflow-visible", className)}
      style={{ color }}
    >
      {area && (
        <>
          <defs>
            <linearGradient id={`sg${gid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={fill} fill={`url(#sg${gid})`} stroke="none" />
        </>
      )}
      <path d={line} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
