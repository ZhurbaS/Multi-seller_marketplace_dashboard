import { useMemo } from "react";
import { ApexBase } from "./ApexBase";
import { ChartPlaceholder } from "./ChartEmpty";
import { describeSeries, hasData, makeFormatter } from "./chartUtils";
import { baseApexOptions, useChartTheme } from "./useChartTheme";

/**
 * BarChart({ series:[{name, data:number[], color?}], categories:string[], horizontal=false, stacked=false,
 *            distributed=false, height=280, yFormat='int', ariaLabel, loading, emptyText, showLegend, dataLabels=false })
 */
export function BarChart({
  series = [],
  categories = [],
  horizontal = false,
  stacked = false,
  distributed = false,
  height = 280,
  yFormat = "int",
  ariaLabel = "Стовпчикова діаграма",
  loading = false,
  emptyText,
  showLegend,
  dataLabels = false,
}) {
  const t = useChartTheme();
  const empty = !series.some((s) => hasData(s.data));

  const options = useMemo(() => {
    const base = baseApexOptions(t);
    const f = makeFormatter(yFormat, true);
    const valueAxisLabels = { style: { colors: t.ink2 }, formatter: f };
    return {
      ...base,
      chart: { ...base.chart, type: "bar", stacked },
      colors: distributed ? t.palette : series.map((s, i) => s.color || t.palette[i % t.palette.length]),
      plotOptions: {
        bar: {
          horizontal,
          distributed,
          borderRadius: 4,
          borderRadiusApplication: "end",
          columnWidth: categories.length > 12 ? "70%" : "55%",
          barHeight: "65%",
        },
      },
      dataLabels: { enabled: dataLabels, formatter: makeFormatter(yFormat, true), style: { colors: [t.ink] } },
      legend: { ...base.legend, show: showLegend ?? (series.length > 1 && !distributed), position: "top", horizontalAlign: "left" },
      xaxis: {
        ...base.xaxis,
        categories,
        labels: horizontal ? valueAxisLabels : { ...base.xaxis.labels, rotate: -30, hideOverlappingLabels: true, trim: true },
      },
      yaxis: horizontal ? { labels: { style: { colors: t.ink2 }, maxWidth: 180 } } : { labels: valueAxisLabels, forceNiceScale: true, min: 0 },
      grid: { ...base.grid, xaxis: { lines: { show: horizontal } }, yaxis: { lines: { show: !horizontal } } },
      tooltip: { ...base.tooltip, y: { formatter: makeFormatter(yFormat) } },
    };
  }, [t, series, categories, horizontal, stacked, distributed, yFormat, showLegend, dataLabels]);

  if (loading || empty) return <ChartPlaceholder loading={loading} height={height} emptyText={emptyText} />;

  return (
    <ApexBase
      type="bar"
      options={options}
      series={series.map((s) => ({ name: s.name, data: (s.data || []).map((v) => Number(v) || 0) }))}
      height={height}
      ariaLabel={ariaLabel}
      summary={describeSeries(series, yFormat)}
      themeKey={`${t.version}-${t.dark}`}
    />
  );
}
