import { lazy, Suspense } from "react";
import { Skeleton } from "../Skeleton";

// ApexCharts завантажується лише на сторінках з графіками.
const ReactApex = lazy(() => import("react-apexcharts"));

/** Внутрішня обгортка: lazy ApexCharts + підпис для скрінрідерів. */
export function ApexBase({ type, options, series, height, ariaLabel, summary, themeKey }) {
  return (
    <figure className="m-0 min-w-0" role="img" aria-label={ariaLabel}>
      <Suspense fallback={<Skeleton height={height} className="w-full" />}>
        <div className="min-w-0" aria-hidden="true">
          <ReactApex key={themeKey} type={type} options={options} series={series} height={height} width="100%" />
        </div>
      </Suspense>
      {summary && <figcaption className="sr-only">{summary}</figcaption>}
    </figure>
  );
}
