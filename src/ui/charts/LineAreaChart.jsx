import { useMemo } from "react";
import { ApexBase } from "./ApexBase";
import { ChartPlaceholder } from "./ChartEmpty";
import { describeSeries, hasData, makeFormatter } from "./chartUtils";
import { baseApexOptions, useChartTheme } from "./useChartTheme";

/**
 * LineAreaChart({ series:[{ name, data:number[], axis?:'left'|'right', format?, dashed?, color?, type?:'area'|'line' }],
 *                 categories:string[], type:'area'|'line', height=280, yFormat='int', ariaLabel,
 *                 loading, emptyText, minPoints=2, stacked=false, showLegend })
 * Порівняння з попереднім періодом — окремий ряд з dashed:true.
 * axis:'right' — друга вісь Y (напр. «Замовлення» поруч із «Виручкою»).
 */
export function LineAreaChart({
  series = [],
  categories = [],
  type = "area",
  height = 280,
  yFormat = "int",
  ariaLabel = "Графік",
  loading = false,
  emptyText,
  minPoints = 2,
  stacked = false,
  showLegend,
}) {
  const t = useChartTheme();
  const empty = !series.some((s) => hasData(s.data, minPoints));

  const seriesType = (s) => (type === "area" && (s.dashed || s.type === "line") ? "line" : s.type || type);
  const mixed = new Set(series.map(seriesType)).size > 1;
  const chartType = mixed ? "line" : type;

  const options = useMemo(() => {
    const base = baseApexOptions(t);
    const hasRight = series.some((s) => s.axis === "right");
    const leftName = series.find((s) => s.axis !== "right")?.name;
    const rightName = series.find((s) => s.axis === "right")?.name;
    const yaxis = hasRight
      ? series.map((s) => {
          const right = s.axis === "right";
          const f = makeFormatter(s.format || (right ? "int" : yFormat), true);
          return {
            seriesName: right ? rightName : leftName,
            opposite: right,
            show: s.name === (right ? rightName : leftName),
            labels: { style: { colors: t.ink2 }, formatter: f },
            min: 0,
            forceNiceScale: true,
          };
        })
      : { labels: { style: { colors: t.ink2 }, formatter: makeFormatter(yFormat, true) }, min: 0, forceNiceScale: true };
    const colors = series.map((s, i) => s.color || t.palette[i % t.palette.length]);
    return {
      ...base,
      chart: { ...base.chart, type: chartType, stacked },
      colors,
      stroke: {
        curve: "smooth",
        width: series.map((s) => (s.dashed ? 2 : 2.5)),
        dashArray: series.map((s) => (s.dashed ? 5 : 0)),
      },
      fill:
        type === "area"
          ? {
              type: series.map((s) => (s.dashed || s.type === "line" ? "solid" : "gradient")),
              opacity: series.map((s) => (s.dashed || s.type === "line" ? 0 : 0.28)),
              gradient: { shadeIntensity: 1, opacityFrom: 0.28, opacityTo: 0.02, stops: [0, 95] },
            }
          : { type: "solid", opacity: 1 },
      markers: { size: categories.length <= 14 ? 3 : 0, strokeWidth: 0, hover: { size: 5 } },
      legend: { ...base.legend, show: showLegend ?? series.length > 1, position: "top", horizontalAlign: "left" },
      xaxis: {
        ...base.xaxis,
        categories,
        tickAmount: Math.min(categories.length, 8),
        labels: { ...base.xaxis.labels, rotate: 0, hideOverlappingLabels: true, trim: true },
        tooltip: { enabled: false },
      },
      yaxis,
      tooltip: {
        ...base.tooltip,
        shared: true,
        intersect: false,
        y: { formatter: (v, { seriesIndex }) => makeFormatter(series[seriesIndex]?.format || (series[seriesIndex]?.axis === "right" ? "int" : yFormat))(v) },
      },
    };
  }, [t, series, categories, type, chartType, yFormat, stacked, showLegend]);

  if (loading || empty) return <ChartPlaceholder loading={loading} height={height} emptyText={emptyText} />;

  const apexSeries = series.map((s) => ({
    name: s.name,
    type: seriesType(s),
    data: (s.data || []).map((v) => (v === null || v === undefined ? null : Number(v))),
  }));

  return (
    <ApexBase
      type={chartType}
      options={options}
      series={apexSeries}
      height={height}
      ariaLabel={ariaLabel}
      summary={describeSeries(series, yFormat)}
      themeKey={`${t.version}-${t.dark}`}
    />
  );
}
