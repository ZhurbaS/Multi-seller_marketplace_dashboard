// Аналітика → Покупці: GET /seller/analytics/customers — лише агрегати, без персональних даних.
import { MdGroup, MdLock } from "react-icons/md";
import { BarChart, Card, CardBody, CardHeader, ChartCard, DonutChart, KpiCard, Money, Table, formatInt, formatPct } from "../../../ui";
import { AnalyticsPage, Note } from "./shared/AnalyticsPage";
import { useAnalytics } from "./shared/useAnalytics";
import { usePeriod } from "./shared/period";
import { EMPTY_ORDERS_TEXT, INFO, MIN_DENOM } from "./shared/labels";

const Hidden = ({ min }) => (
  <span className="inline-flex items-center gap-1 text-(--ink-2)" title={`Група менша за ${min} покупців — приховано`}>
    <MdLock aria-hidden="true" /> приховано
  </span>
);

export default function Customers() {
  const period = usePeriod();
  const { data, loading, refreshing, error, reload } = useAnalytics("customers", period.query);
  const min = data?.minGroup || 5;
  const nvr = data?.newVsRepeat || {};
  const total = (nvr.new || 0) + (nvr.repeat || 0);
  const regions = data?.byRegion || [];
  const checks = data?.checkSegments || [];
  const rfm = data?.rfm || [];
  const anyHidden = [...regions, ...checks, ...rfm].some((x) => x.hidden) || (total > 0 && data?.buyers === null);
  const visibleChecks = checks.filter((c) => !c.hidden);
  const visibleRfm = rfm.filter((s) => !s.hidden);

  return (
    <AnalyticsPage
      title="Покупці"
      description="Нові й повторні покупці, регіони та сегменти — лише узагальнені дані"
      period={period}
      exportReport="customers"
      error={error}
      onRetry={reload}
      refreshing={refreshing}
      allowCompare={false}
    >
      <Note>
        Аналітика не містить імен, контактів чи адрес покупців. Групи, менші за {formatInt(min)} покупців, приховано або об'єднано в «Інші», щоб не можна було впізнати конкретну людину.
      </Note>

      <section aria-label="Нові та повторні покупці" className="grid min-w-0 grid-cols-1 gap-3 min-[420px]:grid-cols-3">
        <KpiCard label="Нові покупці" value={nvr.new} format="int" info={INFO.buyers} icon={<MdGroup />} loading={loading} />
        <KpiCard label="Повторні покупці" value={nvr.repeat} format="int" info={INFO.buyers} loading={loading} />
        <KpiCard
          label="Частка повторних"
          value={total === 0 ? "—" : total < MIN_DENOM ? `${formatInt(Math.round((nvr.repeatRate || 0) * total))} з ${formatInt(total)}` : formatPct(nvr.repeatRate, { ratio: true })}
          info={INFO.repeatRate}
          loading={loading}
        />
      </section>

      <Card className="min-w-0">
        <CardHeader title="Регіони" description="Замовлення та виручка за областю доставки" />
        <CardBody>
          <Table
            caption="Замовлення за регіонами"
            rows={regions}
            rowKey="region"
            loading={loading}
            empty={{ title: "Даних поки мало", text: EMPTY_ORDERS_TEXT }}
            columns={[
              { key: "region", header: "Регіон", primary: true },
              { key: "orders", header: "Замовлень", align: "right", sortable: true, render: (r) => (r.hidden ? <Hidden min={min} /> : formatInt(r.orders)) },
              { key: "revenue", header: "Виручка", align: "right", sortable: true, render: (r) => (r.hidden ? <Hidden min={min} /> : <Money value={r.revenue} />) },
            ]}
          />
        </CardBody>
      </Card>

      <div className="grid min-w-0 grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2">
        <ChartCard title="Сегменти за чеком" description="Кількість замовлень у діапазоні суми" loading={loading} empty={!loading && !visibleChecks.some((c) => c.count > 0)} emptyText={EMPTY_ORDERS_TEXT}>
          <BarChart categories={visibleChecks.map((c) => `${c.label} ₴`)} series={[{ name: "Замовлень", data: visibleChecks.map((c) => c.count) }]} yFormat="int" ariaLabel="Замовлення за сегментами чека" />
          {checks.some((c) => c.hidden) && <p className="px-2 text-xs text-(--ink-2)">Приховано: {checks.filter((c) => c.hidden).map((c) => `${c.label} ₴`).join(", ")} (менше {min} покупців).</p>}
        </ChartCard>
        <ChartCard title="RFM-сегменти" info={INFO.rfm} description="Покупці за давністю, частотою та сумою покупок" loading={loading} empty={!loading && !visibleRfm.length} emptyText="Покупців поки мало для сегментації.">
          <DonutChart data={visibleRfm.map((s) => ({ label: s.label || s.segment, value: s.count }))} format="int" totalLabel="Покупців" ariaLabel="Покупці за RFM-сегментами" />
          {rfm.some((s) => s.hidden) && <p className="px-2 text-xs text-(--ink-2)">Приховано малі сегменти: {rfm.filter((s) => s.hidden).map((s) => s.label || s.segment).join(", ")}.</p>}
        </ChartCard>
      </div>

      {!loading && anyHidden && <Note>Частину груп приховано, бо в них менше {formatInt(min)} покупців. Зі зростанням продажів вони з'являться.</Note>}
    </AnalyticsPage>
  );
}
