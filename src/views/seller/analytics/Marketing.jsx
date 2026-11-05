// Аналітика → Маркетинг: GET /seller/analytics/marketing (купони магазину та знижки продавця)
import { Link } from "react-router-dom";
import { MdLocalOffer } from "react-icons/md";
import { Badge, Button, Card, CardBody, CardHeader, KpiCard, Money, Table, formatDelta, formatInt } from "../../../ui";
import { AnalyticsPage, Note, ProductCell, TitleInfo } from "./shared/AnalyticsPage";
import { useAnalytics } from "./shared/useAnalytics";
import { compareLabel, usePeriod } from "./shared/period";
import { INFO, MIN_DENOM, editProductLink, ratioOrAbs } from "./shared/labels";

export default function Marketing() {
  const period = usePeriod();
  const { data, loading, refreshing, error, reload } = useAnalytics("marketing", period.query);
  const s = data?.summary || {};
  const coupons = data?.coupons || [];
  const discounted = data?.discountedProducts || [];
  const cmp = compareLabel(period.range.compare);

  return (
    <AnalyticsPage title="Маркетинг" description="Як купони магазину та ваші знижки впливають на продажі" period={period} error={error} onRetry={reload} refreshing={refreshing}>
      <Note>
        Купони поки створює лише магазин (адміністратор) — тут видно, як часто їх застосовували до замовлень із вашими товарами. Знижку купона фінансує магазин, ваша виручка не зменшується. Власні знижки на товари налаштовуйте в розділі{" "}
        <Link to="/seller/dashboard/discount-product" className="font-medium text-(--brand-ink) underline">
          «Товари зі знижкою»
        </Link>{" "}
        або в картці товару.
      </Note>

      <section aria-label="Підсумок купонів" className="grid min-w-0 grid-cols-1 gap-3 min-[420px]:grid-cols-3">
        <KpiCard label="Замовлень з купоном" value={s.ordersWithCoupon} format="int" icon={<MdLocalOffer />} loading={loading} />
        <KpiCard label="Виручка з купоном" value={s.revenueWithCoupon} format="money" compact info={INFO.revenue} loading={loading} />
        <KpiCard label="Знижка купонів на ваші товари" value={s.couponCost} format="money" compact info={INFO.couponCost} loading={loading} />
      </section>

      <Card className="min-w-0">
        <CardHeader title="Купони" description="Використання купонів у замовленнях на ваші товари" />
        <CardBody>
          <Table
            caption="Купони"
            rows={coupons}
            rowKey="code"
            loading={loading}
            empty={{ icon: <MdLocalOffer aria-hidden="true" />, title: "За період купони не використовували", text: "Коли покупці застосують купон магазину до ваших товарів, статистика з'явиться тут." }}
            columns={[
              {
                key: "code",
                header: "Купон",
                primary: true,
                sortable: true,
                render: (c) => (
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate font-mono font-semibold text-(--ink)">{c.code}</span>
                    {c.title && <span className="truncate text-xs text-(--ink-2)">{c.title}</span>}
                  </span>
                ),
              },
              { key: "uses", header: "Замовлень", align: "right", sortable: true, render: (c) => formatInt(c.uses) },
              { key: "share", header: "Частка замовлень", align: "right", sortable: true, render: (c) => {
                  if (!c.share) return "—";
                  const total = Math.round(c.uses / c.share);
                  return ratioOrAbs(total >= MIN_DENOM ? c.share : null, c.uses, total);
                },
              },
              { key: "revenue", header: "Виручка", align: "right", sortable: true, render: (c) => <Money value={c.revenue} /> },
              { key: "aov", header: "Середній чек", align: "right", sortable: true, render: (c) => <Money value={c.aov} /> },
              { key: "discountCost", header: "Знижка", align: "right", sortable: true, render: (c) => <Money value={c.discountCost} /> },
            ]}
          />
        </CardBody>
      </Card>

      <Card className="min-w-0">
        <CardHeader title="Товари зі знижкою" description={cmp ? `Зміна продажів (шт) ${cmp}` : "Продажі товарів зі знижкою"} />
        <CardBody>
          <Table
            caption="Товари зі знижкою"
            rows={discounted}
            rowKey="productId"
            loading={loading}
            empty={{
              title: "Товарів зі знижкою немає",
              text: "Знижка допомагає розпродати залишки та підняти позиції у каталозі.",
              action: (
                <Button as={Link} to="/seller/dashboard/discount-product" variant="secondary">
                  Товари зі знижкою
                </Button>
              ),
            }}
            columns={[
              { key: "name", header: "Товар", primary: true, sortable: true, render: (p) => <ProductCell name={p.name} to={editProductLink(p.productId)} /> },
              { key: "discount", header: "Знижка", align: "right", sortable: true, render: (p) => <Badge tone="warning" size="sm">−{formatInt(p.discount)} %</Badge> },
              { key: "units", header: "Продано, шт", align: "right", sortable: true, render: (p) => formatInt(p.units) },
              { key: "revenue", header: "Виручка", align: "right", sortable: true, render: (p) => <Money value={p.revenue} /> },
              {
                key: "liftVsPrev",
                header: <TitleInfo title="Зміна продажів" info={INFO.lift} />,
                cardLabel: "Зміна продажів",
                align: "right",
                render: (p) => (p.liftVsPrev === null || p.liftVsPrev === undefined ? "—" : formatDelta(p.liftVsPrev)),
              },
            ]}
          />
        </CardBody>
      </Card>
    </AnalyticsPage>
  );
}
