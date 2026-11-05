// Аналітика → Воронка та трафік: GET /seller/analytics/funnel
import { Card, CardBody, CardHeader, ChartCard, FunnelChart, KpiCard, Table, formatDate, formatInt } from "../../../ui";
import { AnalyticsPage, Note, ProductCell } from "./shared/AnalyticsPage";
import { useAnalytics } from "./shared/useAnalytics";
import { usePeriod } from "./shared/period";
import { INFO, MIN_DENOM, editProductLink, ratioOrAbs, sourceLabel } from "./shared/labels";

export default function Funnel() {
  const period = usePeriod();
  const { data, loading, refreshing, error, reload } = useAnalytics("funnel", period.query);
  const t = data?.totals || {};
  const r = data?.rates || {};
  const sources = data?.sources || [];
  const srcTotal = sources.reduce((s, x) => s + (x.views || 0), 0);
  const noTracking = !loading && data && !data.dataSince;
  const sinceAfterFrom = data?.dataSince && data.dataSince > period.range.from;

  const steps = [
    { label: "Перегляди", value: t.views || 0 },
    { label: "Додали в кошик", value: t.carts || 0, rate: r.viewToCart ?? null },
    { label: "Оформили замовлення", value: t.orders || 0, rate: r.cartToOrder ?? null },
    { label: "Оплачені / зараховані", value: t.paid || 0, rate: (t.orders || 0) >= MIN_DENOM ? (t.paid || 0) / t.orders : null },
  ];

  return (
    <AnalyticsPage title="Воронка та трафік" description="Від перегляду товару до оплаченого замовлення, джерела відвідувачів" period={period} error={error} onRetry={reload} refreshing={refreshing} allowCompare={false}>
      {noTracking && <Note>Статистика переглядів ще не зібрана. Вона накопичується з моменту, коли покупці відкривають сторінки ваших товарів у магазині.</Note>}
      {!loading && data?.dataSince && sinceAfterFrom && (
        <Note>Перегляди й додавання в кошик рахуються з {formatDate(data.dataSince)}. За дні до цього воронка неповна, а замовлення враховано повністю — конверсія може бути завищеною.</Note>
      )}
      {!loading && data?.lowSample && !noTracking && (
        <Note tone="warning">Переглядів за період менше {MIN_DENOM} — частки не показуємо, лише абсолютні числа. Оберіть довший період.</Note>
      )}

      <section aria-label="Показники воронки" className="grid min-w-0 grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Перегляди" value={t.views} format="int" info={INFO.views} hint={t.uniqueViews ? `Унікальних: ${formatInt(t.uniqueViews)}` : undefined} loading={loading} />
        <KpiCard label="Перегляд → кошик" value={ratioOrAbs(r.viewToCart, t.carts, t.views)} info={INFO.viewToCart} loading={loading} />
        <KpiCard label="Кошик → замовлення" value={ratioOrAbs(r.cartToOrder, t.orders, t.carts)} info={INFO.cartToOrder} loading={loading} />
        <KpiCard label="Конверсія" value={ratioOrAbs(r.cr, t.paid, t.views)} info={INFO.cr} loading={loading} />
      </section>

      <div className="grid min-w-0 grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-3">
        <ChartCard className="lg:col-span-2" title="Воронка" info={INFO.cr} loading={loading}>
          <FunnelChart steps={steps} minSample={MIN_DENOM} emptyText="Переглядів за період ще немає." ariaLabel="Воронка: перегляди, кошик, замовлення, оплата" />
        </ChartCard>
        <Card className="min-w-0">
          <CardHeader title="Джерела переглядів" description="UTM-мітка або сайт, з якого прийшов відвідувач" />
          <CardBody>
            <Table
              dense
              caption="Джерела переглядів"
              rows={sources}
              rowKey="source"
              loading={loading}
              empty={{ title: "Даних про джерела ще немає" }}
              columns={[
                { key: "source", header: "Джерело", primary: true, render: (s) => <span className="break-all">{sourceLabel(s.source)}</span> },
                { key: "views", header: "Перегляди", align: "right", render: (s) => formatInt(s.views) },
                { key: "share", header: "Частка", align: "right", render: (s) => ratioOrAbs(srcTotal >= MIN_DENOM ? s.views / srcTotal : null, s.views, srcTotal) },
              ]}
            />
          </CardBody>
        </Card>
      </div>

      <Card className="min-w-0">
        <CardHeader title="Воронка по товарах" description={`Частки показуємо при знаменнику ≥ ${MIN_DENOM}, інакше — «N з M»`} />
        <CardBody>
          <Table
            caption="Воронка по товарах"
            rows={data?.byProduct || []}
            rowKey="productId"
            loading={loading}
            empty={{ title: "Даних поки мало", text: "Перегляди з'являться, коли покупці відкриють ваші товари." }}
            columns={[
              { key: "name", header: "Товар", primary: true, sortable: true, render: (p) => <ProductCell name={p.name} to={editProductLink(p.productId)} /> },
              { key: "views", header: "Перегляди", align: "right", sortable: true, render: (p) => formatInt(p.views) },
              { key: "carts", header: "У кошик", align: "right", sortable: true, render: (p) => formatInt(p.carts) },
              { key: "orders", header: "Замовлення", align: "right", sortable: true, render: (p) => formatInt(p.orders) },
              { key: "viewToCart", header: "Перегляд → кошик", align: "right", sortable: true, render: (p) => ratioOrAbs(p.viewToCart, p.carts, p.views) },
              { key: "cartToOrder", header: "Кошик → замовл.", align: "right", sortable: true, render: (p) => ratioOrAbs(p.cartToOrder, p.orders, p.carts) },
              { key: "cr", header: "Конверсія", align: "right", sortable: true, render: (p) => ratioOrAbs(p.cr, p.orders, p.views) },
            ]}
          />
        </CardBody>
      </Card>
    </AnalyticsPage>
  );
}
