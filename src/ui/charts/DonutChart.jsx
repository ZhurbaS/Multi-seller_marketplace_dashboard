import { useMemo } from "react";
import { ApexBase } from "./ApexBase";
import { ChartPlaceholder } from "./ChartEmpty";
import { hasData, makeFormatter } from "./chartUtils";
import { baseApexOptions, useChartTheme } from "./useChartTheme";

/**
 * DonutChart({ data:[{label, value, color?}], height=260, format='int', totalLabel='Всього',
 *              ariaLabel, loading, emptyText, legendPosition:'bottom'|'right' })
 */
export function DonutChart({
  data = [],
  height = 260,
  format = "int",
  totalLabel = "Всього",
  ariaLabel = "Кругова діаграма",
  loading = false,
  emptyText,
  legendPosition = "bottom",
}) {
  const t = useChartTheme();
  const values = data.map((d) => Number(d.value) || 0);
  const empty = !hasData(values);

  const options = useMemo(() => {
    const base = baseApexOptions(t);
    const f = makeFormatter(format);
    return {
      ...base,
      chart: { ...base.chart, type: "donut" },
      labels: data.map((d) => String(d.label)),
      colors: data.map((d, i) => d.color || t.palette[i % t.palette.length]),
      stroke: { width: 2, colors: [t.surface] },
      legend: { ...base.legend, show: true, position: legendPosition, formatter: (name, o) => `${name}: ${f(o.w.globals.series[o.seriesIndex])}` },
      plotOptions: {
        pie: {
          donut: {
            size: "68%",
            labels: {
              show: true,
              name: { color: t.ink2, fontSize: "13px" },
              value: { color: t.ink, fontSize: "20px", fontWeight: 700, formatter: (v) => f(Number(v)) },
              total: { show: true, label: totalLabel, color: t.ink2, formatter: (w) => f(w.globals.seriesTotals.reduce((a, b) => a + b, 0)) },
            },
          },
        },
      },
      tooltip: { ...base.tooltip, y: { formatter: f } },
    };
  }, [t, data, format, totalLabel, legendPosition]);

  if (loading || empty) return <ChartPlaceholder loading={loading} height={height} emptyText={emptyText} />;

  const f = makeFormatter(format);
  return (
    <ApexBase
      type="donut"
      options={options}
      series={values}
      height={height}
      ariaLabel={ariaLabel}
      summary={data.map((d) => `${d.label}: ${f(d.value)}`).join("; ")}
      themeKey={`${t.version}-${t.dark}`}
    />
  );
}
