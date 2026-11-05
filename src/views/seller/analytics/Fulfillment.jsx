// Аналітика → Виконання: GET /seller/analytics/fulfillment
import { Link } from "react-router-dom";
import { BarChart, ChartCard, DonutChart, KpiCard, formatInt, formatPct } from "../../../ui";
import { AnalyticsPage, Note } from "./shared/AnalyticsPage";
import { useAnalytics } from "./shared/useAnalytics";
import { usePeriod } from "./shared/period";
import { EMPTY_ORDERS_TEXT, INFO, MIN_DENOM, RETURN_REASON, deliveryLabel, hoursText } from "./shared/labels";

export default function Fulfillment() {
  const period = usePeriod();
  const { data, loading, refreshing, error, reload } = useAnalytics("fulfillment", period.query);
  const sla = data?.sla || {};
  const ret = data?.returns || {};
  const funnel = data?.statusFunnel || [];
  const allOrders = funnel.reduce((s, x) => s + x.count, 0);
  const base = (sla.measuredCount || 0) + (sla.overdueCount || 0);
  const lateAbs = sla.lateRate !== null && sla.lateRate !== undefined ? Math.round(sla.lateRate * base) : null;
  const lateValue = sla.lateRate === null || sla.lateRate === undefined ? "—" : base < MIN_DENOM ? `${formatInt(lateAbs)} з ${formatInt(base)}` : formatPct(sla.lateRate, { ratio: true });
  const cancelled = funnel.find((x) => x.status === "cancelled")?.count || 0;
  const cancelValue = data?.cancelRate === null || data?.cancelRate === undefined ? "—" : allOrders < MIN_DENOM ? `${formatInt(cancelled)} з ${formatInt(allOrders)}` : formatPct(data.cancelRate, { ratio: true });
  const returnsValue = ret.rate === null || ret.rate === undefined ? "—" : formatPct(ret.rate, { ratio: true });

  return (
    <AnalyticsPage title="Виконання" description="Швидкість відправки, скасування та повернення" period={period} error={error} onRetry={reload} refreshing={refreshing}>
      <section aria-label="Показники виконання" className="grid min-w-0 grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Медіана до відправки" value={hoursText(sla.medianHours)} info={INFO.sla} hint={sla.measuredCount ? `Виміряно відправлень: ${formatInt(sla.measuredCount)}` : "Ще немає відправлених замовлень"} loading={loading} />
        <KpiCard label="90 % відправлено за" value={hoursText(sla.p90Hours)} info={INFO.p90} loading={loading} />
        <KpiCard
          label="Із запізненням"
          value={lateValue}
          info={INFO.lateRate}
          hint={sla.overdueCount ? `Зараз чекають відправки > ${sla.slaHours || 48} год: ${formatInt(sla.overdueCount)}` : undefined}
          loading={loading}
        />
        <KpiCard label="Скасування" value={cancelValue} info={INFO.cancel} loading={loading} />
      </section>

      {!loading && sla.overdueCount > 0 && (
        <Note tone="warning">
          {formatInt(sla.overdueCount)} замовл. чекають відправки довше {sla.slaHours || 48} год.{" "}
          <Link to="/seller/dashboard/orders" className="font-medium text-(--brand-ink) underline">
            Перейти до замовлень
          </Link>
        </Note>
      )}

      <div className="grid min-w-0 grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2">
        <ChartCard title="Статуси замовлень" description={`Усі оформлені за період: ${formatInt(allOrders)}`} loading={loading} empty={!loading && !allOrders} emptyText={EMPTY_ORDERS_TEXT}>
          <BarChart horizontal categories={funnel.map((x) => deliveryLabel(x.status))} series={[{ name: "Замовлень", data: funnel.map((x) => x.count) }]} yFormat="int" ariaLabel="Кількість замовлень за статусами" />
        </ChartCard>
        <ChartCard
          title="Повернення за причинами"
          info={INFO.returns}
          description={`Заявок: ${formatInt(ret.count || 0)} · одиниць: ${formatInt(ret.units || 0)} · частка замовлень: ${returnsValue}`}
          loading={loading}
          empty={!loading && !(ret.byReason || []).length}
          emptyText="Повернень за період не було."
        >
          <DonutChart data={(ret.byReason || []).map((r) => ({ label: RETURN_REASON[r.reason] || "Інше", value: r.count }))} format="int" totalLabel="Заявок" ariaLabel="Повернення за причинами" />
        </ChartCard>
      </div>
    </AnalyticsPage>
  );
}
