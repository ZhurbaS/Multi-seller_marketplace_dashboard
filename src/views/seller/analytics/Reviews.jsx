// Аналітика → Відгуки: GET /seller/analytics/reviews
import { MdRateReview, MdStar } from "react-icons/md";
import { Card, CardBody, CardHeader, ChartCard, EmptyState, KpiCard, LineAreaChart, Skeleton, formatDate, formatInt, formatNumber, formatPct } from "../../../ui";
import { AnalyticsPage, Note } from "./shared/AnalyticsPage";
import { useAnalytics } from "./shared/useAnalytics";
import { autoGranularity, bucketLabel, usePeriod } from "./shared/period";
import { INFO, MIN_DENOM } from "./shared/labels";

function Stars({ value }) {
  const n = Math.round(Number(value) || 0);
  return (
    <span className="inline-flex shrink-0 items-center text-(--star)" aria-label={`Оцінка ${n} з 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <MdStar key={i} aria-hidden="true" className={i <= n ? "" : "opacity-25"} />
      ))}
    </span>
  );
}

export default function Reviews() {
  const period = usePeriod();
  const { data, loading, refreshing, error, reload } = useAnalytics("reviews", period.query);
  const r = data?.rating || { distribution: {} };
  const count = r.count || 0;
  const dist = r.distribution || {};
  const trend = data?.trend || [];
  const neg = (dist[1] || 0) + (dist[2] || 0);

  return (
    <AnalyticsPage title="Відгуки" description="Оцінки покупців ваших товарів за період (лише схвалені модерацією)" period={period} error={error} onRetry={reload} refreshing={refreshing} allowCompare={false}>
      <section aria-label="Підсумок відгуків" className="grid min-w-0 grid-cols-1 gap-3 min-[420px]:grid-cols-3">
        <KpiCard label="Середня оцінка" value={r.avg ? `${formatNumber(r.avg, 2)} ★` : "—"} info={INFO.rating} icon={<MdStar />} loading={loading} />
        <KpiCard label="Відгуків" value={count} format="int" icon={<MdRateReview />} loading={loading} />
        <KpiCard
          label="Негативні (1–2 ★)"
          value={count === 0 ? "—" : count < MIN_DENOM ? `${formatInt(neg)} з ${formatInt(count)}` : formatPct(data?.negativeShare, { ratio: true })}
          info={INFO.negativeShare}
          loading={loading}
        />
      </section>

      <div className="grid min-w-0 grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-3">
        <Card className="min-w-0">
          <CardHeader title="Розподіл оцінок" />
          <CardBody>
            {loading ? (
              <Skeleton lines={5} />
            ) : (
              <ul className="flex flex-col gap-2" aria-label="Кількість відгуків за оцінкою">
                {[5, 4, 3, 2, 1].map((k) => {
                  const v = dist[k] || 0;
                  return (
                    <li key={k} className="flex min-w-0 items-center gap-2 text-sm">
                      <span className="w-8 shrink-0 tabular-nums text-(--ink-2)">{k} ★</span>
                      <span className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-(--surface-2)">
                        <span className={`block h-full rounded-full ${k <= 2 ? "bg-(--danger)" : k === 3 ? "bg-(--warning)" : "bg-(--success)"}`} style={{ width: `${count ? (v / count) * 100 : 0}%` }} />
                      </span>
                      <span className="w-10 shrink-0 text-right tabular-nums text-(--ink)">{formatInt(v)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardBody>
        </Card>
        <ChartCard className="lg:col-span-2" title="Динаміка оцінки" loading={loading} empty={!loading && trend.filter((t) => t.count > 0).length < 2} emptyText="Відгуків поки мало для графіка.">
          <LineAreaChart
            categories={trend.map((t) => bucketLabel(t.date, autoGranularity(period.range)))}
            yFormat="number"
            ariaLabel="Середня оцінка і кількість відгуків"
            series={[
              { name: "Середня оцінка", data: trend.map((t) => t.avg), format: "number", type: "line" },
              { name: "Відгуків", data: trend.map((t) => t.count), axis: "right", format: "int", type: "line", dashed: true },
            ]}
          />
        </ChartCard>
      </div>

      {!loading && count > 0 && count < 5 && <Note>Відгуків мало ({formatInt(count)}) — середня оцінка ще нестабільна.</Note>}

      <Card className="min-w-0">
        <CardHeader title="Останні відгуки" description="Імена покупців скорочено" />
        <CardBody>
          {loading ? (
            <Skeleton lines={6} />
          ) : !(data?.recent || []).length ? (
            <EmptyState compact icon={<MdRateReview aria-hidden="true" />} title="Відгуків за період немає" text="Нагадайте покупцям залишити відгук після доставки." />
          ) : (
            <ul className="flex flex-col divide-y divide-(--line)">
              {data.recent.map((x, i) => (
                <li key={`${x.productId}-${x.createdAt}-${i}`} className="flex min-w-0 flex-col gap-1 py-3 first:pt-0 last:pb-0">
                  <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
                    <Stars value={x.rating} />
                    <span className="min-w-0 truncate text-sm font-semibold text-(--ink)" title={x.productName}>
                      {x.productName}
                    </span>
                  </div>
                  {x.text && <p className="break-words text-sm text-(--ink)">{x.text}</p>}
                  <p className="text-xs text-(--ink-2)">
                    {x.customerName || "Покупець"} · {formatDate(x.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </AnalyticsPage>
  );
}
