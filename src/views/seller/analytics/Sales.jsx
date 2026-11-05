// Аналітика → Продажі: GET /seller/analytics/sales
import { useMemo } from "react";
import { BarChart, ChartCard, DOW_LABELS, DonutChart, Heatmap, LineAreaChart, Money, Stat, Card, CardBody, Table, formatInt, formatPct } from "../../../ui";
import { AnalyticsPage, Note } from "./shared/AnalyticsPage";
import { useAnalytics } from "./shared/useAnalytics";
import { bucketLabel, usePeriod } from "./shared/period";
import { EMPTY_ORDERS_TEXT, INFO, MIN_DENOM, deliveryLabel, paymentMethodLabel } from "./shared/labels";

export default function Sales() {
  const period = usePeriod();
  const { data, loading, refreshing, error, reload } = useAnalytics("sales", period.query);
  const byPeriod = useMemo(() => data?.byPeriod || [], [data]);
  const g = data?.period?.granularity;

  const totals = useMemo(() => {
    const t = { revenue: 0, orders: 0, units: 0 };
    for (const r of byPeriod) {
      t.revenue += r.revenue || 0;
      t.orders += r.orders || 0;
      t.units += r.units || 0;
    }
    t.aov = t.orders ? t.revenue / t.orders : null;
    return t;
  }, [byPeriod]);
  const empty = !loading && totals.orders === 0;
  const cats = byPeriod.map((r) => bucketLabel(r.date, g));
  const weekday = data?.byWeekday || [];
  const methods = data?.paymentMethods || [];
  const statuses = data?.status || [];
  const statusTotal = statuses.reduce((s, x) => s + x.count, 0);

  return (
    <AnalyticsPage title="Продажі" description="Динаміка виручки, дні й години попиту, структура чеків і способів оплати" period={period} exportReport="sales" error={error} onRetry={reload} refreshing={refreshing}>
      <Card>
        <CardBody className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:grid-cols-4">
          <Stat label="Виручка" value={totals.revenue} format="money" compact info={INFO.revenue} loading={loading} />
          <Stat label="Замовлення" value={totals.orders} format="int" info={INFO.orders} loading={loading} />
          <Stat label="Середній чек" value={totals.aov} format="money" info={INFO.aov} loading={loading} />
          <Stat label="Продано одиниць" value={totals.units} format="int" info={INFO.units} loading={loading} />
        </CardBody>
      </Card>

      {!loading && totals.orders > 0 && totals.orders < MIN_DENOM && <Note>Замовлень за період: {formatInt(totals.orders)}. Розподіли нижче показуємо в абсолютних числах — частки на малій вибірці неточні.</Note>}

      <ChartCard title="Виручка і середній чек" info={INFO.aov} loading={loading} empty={empty} emptyText={EMPTY_ORDERS_TEXT}>
        <LineAreaChart
          categories={cats}
          yFormat="money"
          ariaLabel="Виручка і середній чек за період"
          series={[
            { name: "Виручка", data: byPeriod.map((r) => r.revenue), format: "money" },
            { name: "Середній чек", data: byPeriod.map((r) => r.aov), axis: "right", format: "money", type: "line" },
          ]}
        />
      </ChartCard>

      <div className="grid min-w-0 grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2">
        <ChartCard title="За днями тижня" description="Кількість замовлень" loading={loading} empty={empty} emptyText={EMPTY_ORDERS_TEXT}>
          <BarChart categories={weekday.map((w) => DOW_LABELS[w.dow])} series={[{ name: "Замовлення", data: weekday.map((w) => w.orders) }]} yFormat="int" ariaLabel="Замовлення за днями тижня" />
        </ChartCard>
        <ChartCard title="Розмір чека" description="Кількість замовлень у діапазоні суми" loading={loading} empty={empty} emptyText={EMPTY_ORDERS_TEXT}>
          <BarChart
            categories={(data?.checkBuckets || []).map((b) => `${b.label} ₴`)}
            series={[{ name: "Замовлення", data: (data?.checkBuckets || []).map((b) => b.count) }]}
            yFormat="int"
            ariaLabel="Розподіл замовлень за сумою чека"
          />
        </ChartCard>
      </div>

      <ChartCard title="Коли замовляють" description="Замовлення за днем тижня та годиною (Київ)" loading={loading} empty={empty} emptyText={EMPTY_ORDERS_TEXT} height={260}>
        <Heatmap data={data?.heatmap || []} valueLabel="замовлень" ariaLabel="Теплова карта замовлень за днем тижня і годиною" />
      </ChartCard>

      <div className="grid min-w-0 grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2">
        <ChartCard title="Способи оплати" description="Частка виручки" loading={loading} empty={!loading && !methods.length} emptyText={EMPTY_ORDERS_TEXT}>
          <DonutChart data={methods.map((m) => ({ label: paymentMethodLabel(m.method), value: m.revenue }))} format="money" ariaLabel="Виручка за способами оплати" />
          <Table
            dense
            className="mt-2"
            caption="Способи оплати"
            rowKey="method"
            rows={methods}
            columns={[
              { key: "method", header: "Спосіб", primary: true, render: (m) => paymentMethodLabel(m.method) },
              { key: "count", header: "Замовлень", align: "right", render: (m) => formatInt(m.count) },
              { key: "revenue", header: "Виручка", align: "right", render: (m) => <Money value={m.revenue} /> },
            ]}
          />
        </ChartCard>
        <ChartCard title="Статуси замовлень" description="Усі оформлені за період, включно зі скасованими" loading={loading} empty={!loading && !statusTotal} emptyText={EMPTY_ORDERS_TEXT}>
          <Table
            dense
            caption="Статуси замовлень"
            rowKey="status"
            rows={statuses}
            columns={[
              { key: "status", header: "Статус", primary: true, render: (s) => deliveryLabel(s.status) },
              { key: "count", header: "Кількість", align: "right", render: (s) => formatInt(s.count) },
              {
                key: "share",
                header: "Частка",
                align: "right",
                render: (s) => (statusTotal >= MIN_DENOM ? formatPct(s.count / statusTotal, { ratio: true }) : `${formatInt(s.count)} з ${formatInt(statusTotal)}`),
              },
            ]}
          />
        </ChartCard>
      </div>
    </AnalyticsPage>
  );
}
