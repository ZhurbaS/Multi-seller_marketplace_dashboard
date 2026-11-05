import { useMemo } from "react";
import { useThemeVersion } from "../../utils/themeMode";

const NAMES = ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5", "chart-6", "chart-grid", "ink", "ink-2", "line", "surface", "surface-2", "brand"];

// Розв'язує var()/color-mix у конкретний "#rrggbb" (ApexCharts не розуміє var() і color()).
// getComputedStyle може повернути color(srgb …)/oklab(…) → нормалізуємо через 1×1 canvas.
function toHex(color, ctx) {
  if (!ctx || !color) return color;
  try {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = "#000";
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
  } catch {
    return color;
  }
}

function resolveColors() {
  const out = {};
  if (typeof document === "undefined") return out;
  const probe = document.createElement("span");
  probe.style.display = "none";
  document.body.appendChild(probe);
  let ctx = null;
  try {
    const cv = document.createElement("canvas");
    cv.width = 1;
    cv.height = 1;
    ctx = cv.getContext("2d", { willReadFrequently: true });
  } catch {
    ctx = null;
  }
  for (const n of NAMES) {
    probe.style.color = `var(--${n})`;
    out[n] = toHex(getComputedStyle(probe).color || "", ctx);
  }
  probe.remove();
  return out;
}

/** Кольори графіків з токенів; перераховуються при зміні теми. */
export function useChartTheme() {
  const v = useThemeVersion();
  return useMemo(() => {
    const c = resolveColors();
    const dark = document.documentElement.getAttribute("data-theme") === "dark";
    return {
      dark,
      palette: [c["chart-1"], c["chart-2"], c["chart-3"], c["chart-4"], c["chart-5"], c["chart-6"]],
      grid: c["chart-grid"],
      ink: c.ink,
      ink2: c["ink-2"],
      line: c.line,
      surface: c.surface,
      surface2: c["surface-2"],
      brand: c.brand,
      version: v,
    };
  }, [v]);
}

/** Базові опції ApexCharts з токенів. */
export function baseApexOptions(t) {
  return {
    chart: {
      fontFamily: "Inter Variable, Inter, system-ui, sans-serif",
      foreColor: t.ink2,
      background: "transparent",
      toolbar: { show: false },
      zoom: { enabled: false },
      animations: { enabled: !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches, speed: 300 },
      parentHeightOffset: 0,
      redrawOnParentResize: true,
    },
    theme: { mode: t.dark ? "dark" : "light" },
    colors: t.palette,
    grid: { borderColor: t.grid, strokeDashArray: 3, padding: { left: 4, right: 8 } },
    dataLabels: { enabled: false },
    legend: { labels: { colors: t.ink2 }, fontSize: "13px", markers: { size: 6 }, itemMargin: { horizontal: 8 } },
    tooltip: { theme: t.dark ? "dark" : "light" },
    xaxis: { axisBorder: { color: t.line }, axisTicks: { color: t.line }, labels: { style: { colors: t.ink2 } } },
    yaxis: { labels: { style: { colors: t.ink2 } } },
    states: { hover: { filter: { type: "lighten" } } },
    noData: { text: "" },
  };
}
