// Аналітика продавця → «Огляд» (DASHBOARD_SPEC.md §5): реальні дані GET /seller/analytics/overview.
import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  MdArrowForward,
  MdCheckCircle,
  MdChatBubbleOutline,
  MdGroup,
  MdKeyboardReturn,
  MdOutlineAccountBalanceWallet,
  MdOutlineReceiptLong,
  MdPayments,
  MdRadioButtonUnchecked,
  MdShoppingBag,
  MdStar,
  MdTaskAlt,
} from "react-icons/md";
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  ChartCard,
  EmptyState,
  KpiCard,
  LineAreaChart,
  Money,
  Skeleton,
  StatusChip,
  Table,
  formatDate,
  formatInt,
  formatNumber,
  formatPct,
} from "../../ui";
import { get_seller_dashboard_data } from "../../store/Reducers/dashboardSlice";
import { AnalyticsPage, Note } from "./analytics/shared/AnalyticsPage";
import { useAnalytics } from "./analytics/shared/useAnalytics";
import { alignSeries, bucketLabel, compareLabel, usePeriod, withPeriod } from "./analytics/shared/period";
import { DELIVERY_TONE, EMPTY_ORDERS_TEXT, INFO, MIN_DENOM, SEVERITY, deliveryLabel, payLabel } from "./analytics/shared/labels";

function Onboarding({ onboarding }) {
  const steps = onboarding?.steps || [];
  const done = steps.filter((s) => s.done).length;
  return (
    <Card>
      <CardHeader
        title="Перші кроки продавця"
        description={`Виконано ${done} з ${steps.length}. Після перших замовлень тут з'явиться повна аналітика.`}
        icon={<MdTaskAlt aria-hidden="true" />}
      />
      <CardBody>
        <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-(--surface-2)" role="progressbar" aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={done} aria-label="Прогрес старту">
          <div className="h-full rounded-full bg-(--success)" style={{ width: `${steps.length ? (done / steps.length) * 100 : 0}%` }} />
        </div>
        <ol className="flex flex-col gap-1">
          {steps.map((s) => (
            <li key={s.id}>
              <Link to={s.link} className="flex min-h-11 min-w-0 items-center gap-3 rounded-(--r-md) px-2 py-2 hover:bg-(--surface-2)">
                {s.done ? (
                  <MdCheckCircle aria-hidden="true" className="shrink-0 text-xl text-(--success)" />
                ) : (
                  <MdRadioButtonUnchecked aria-hidden="true" className="shrink-0 text-xl text-(--ink-2)" />
                )}
                <span className={s.done ? "min-w-0 flex-1 break-words text-(--ink-2) line-through" : "min-w-0 flex-1 break-words font-medium text-(--ink)"}>{s.title}</span>
                <span className="sr-only">{s.done ? "виконано" : "не виконано"}</span>
                {!s.done && <MdArrowForward aria-hidden="true" className="shrink-0 text-(--ink-2)" />}
              </Link>
            </li>
          ))}
        </ol>
      </CardBody>
    </Card>
  );
}

function Insights({ insights, loading, range }) {
  return (
    <Card className="h-full">
      <CardHeader title="Що варто зробити" description="Підказки на основі ваших продажів, залишків і відгуків" />
      <CardBody>
        {loading ? (
          <Skeleton lines={4} />
        ) : !insights?.length ? (
          <EmptyState compact icon={<MdCheckCircle aria-hidden="true" />} title="Усе гаразд" text="Термінових дій немає. Перевіряйте розділ після нових замовлень." />
        ) : (
          <ul className="flex flex-col divide-y divide-(--line)">
            {insights.map((it) => {
              const sev = SEVERITY[it.severity] || SEVERITY.info;
              const to = withPeriod(it.link, range);
              return (
                <li key={`${it.id}-${it.productId || ""}`} className="flex min-w-0 flex-col gap-1 py-3 first:pt-0 last:pb-0">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <StatusChip tone={sev.tone} size="sm">
                      {sev.label}
                    </StatusChip>
                    <span className="min-w-0 break-words font-semibold text-(--ink)">{it.title}</span>
                  </div>
                  {it.text && <p className="break-words text-sm text-(--ink-2)">{it.text}</p>}
                  {to && (
                    <Link to={to} className="inline-flex min-h-8 items-center gap-1 self-start text-sm font-medium text-(--brand-ink) hover:underline">
                      Перейти <MdArrowForward aria-hidden="true" />
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}

const orderColumns = [
  {
    key: "_id",
    header: "Замовлення",
    primary: true,
    render: (o) => (
      <Link to={`/seller/dashboard/orders/details/${o._id}`} className="font-medium text-(--brand-ink) hover:underline">
        №{String(o._id).slice(-8).toUpperCase()}
      </Link>
    ),
  },
  { key: "createdAt", header: "Дата", render: (o) => formatDate(o.createdAt, { withTime: true }) },
  { key: "price", header: "Сума", align: "right", render: (o) => <Money value={o.price} /> },
  { key: "payment_status", header: "Оплата", render: (o) => <Badge tone={o.payment_status === "paid" ? "success" : "neutral"}>{payLabel(o.payment_status)}</Badge> },
  { key: "delivery_status", header: "Статус", render: (o) => <StatusChip tone={DELIVERY_TONE[o.delivery_status] || "neutral"}>{deliveryLabel(o.delivery_status)}</StatusChip> },
];

export default function SellerDashboard() {
  const period = usePeriod();
  const { range, query } = period;
  const { data, loading, refreshing, error, reload } = useAnalytics("overview", query);
  const dispatch = useDispatch();
  const { userInfo } = useSelector((s) => s.auth);
  const { recentOrders = [], recentMessages = [] } = useSelector((s) => s.dashboard);

  useEffect(() => {
    if (userInfo?.role === "seller") dispatch(get_seller_dashboard_data());
  }, [dispatch, userInfo?.role]);

  const k = data?.kpi || {};
  const dl = compareLabel(range.compare);
  const d = (x) => (range.compare === "none" ? undefined : x?.deltaPct ?? null);
  const series = data?.series || [];
  const g = data?.period?.granularity;
  const chart = useMemo(() => {
    const s = data?.series || [];
    const p = data?.prevSeries || [];
    const out = [{ name: "Виручка", data: s.map((x) => x.revenue), format: "money" }];
    if (p.length) out.push({ name: "Виручка (порівняння)", data: alignSeries(p, s.length, "revenue"), format: "money", dashed: true });
    out.push({ name: "Замовлення", data: s.map((x) => x.orders), axis: "right", format: "int", type: "line" });
    return out;
  }, [data]);
  const hasSales = series.some((x) => x.orders > 0);

  const orders = k.orders?.value || 0;
  const returnsAbs = k.returnsRate?.value !== null && k.returnsRate?.value !== undefined ? Math.round(k.returnsRate.value * orders) : null;
  const returnsValue = k.returnsRate?.value === null || k.returnsRate?.value === undefined ? "—" : orders < MIN_DENOM ? `${formatInt(returnsAbs)} з ${formatInt(orders)}` : formatPct(k.returnsRate.value, { ratio: true });
  const buyersTotal = (k.newBuyers?.value || 0) + (k.repeatBuyers?.value || 0);

  return (
    <AnalyticsPage title="Огляд" description="Ключові показники вашого магазину за обраний період" period={period} error={error} onRetry={reload} refreshing={refreshing}>
      {data?.onboarding && <Onboarding onboarding={data.onboarding} />}

      <section aria-label="Ключові показники" className="grid min-w-0 grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Виручка" value={k.revenue?.value} format="money" compact delta={d(k.revenue)} deltaLabel={dl} info={INFO.revenue} icon={<MdPayments />} loading={loading} />
        <KpiCard label="Замовлення" value={k.orders?.value} format="int" delta={d(k.orders)} deltaLabel={dl} info={INFO.orders} icon={<MdShoppingBag />} loading={loading} hint={k.units ? `Продано одиниць: ${formatInt(k.units.value)}` : undefined} />
        <KpiCard label="Середній чек" value={k.aov?.value} format="money" compact delta={d(k.aov)} deltaLabel={dl} info={INFO.aov} icon={<MdOutlineReceiptLong />} loading={loading} />
        <KpiCard label="До виплати" value={k.payout?.value} format="money" compact delta={d(k.payout)} deltaLabel={dl} info={INFO.payout} icon={<MdOutlineAccountBalanceWallet />} loading={loading} />
        <KpiCard
          label="Повернення"
          value={returnsValue}
          delta={orders >= MIN_DENOM ? d(k.returnsRate) : undefined}
          deltaLabel={dl}
          invertDelta
          info={INFO.returns}
          icon={<MdKeyboardReturn />}
          loading={loading}
          hint={orders > 0 && orders < MIN_DENOM ? "Мала вибірка — показуємо кількість" : undefined}
        />
        <KpiCard
          label="Нові / повторні покупці"
          value={`${formatInt(k.newBuyers?.value)} / ${formatInt(k.repeatBuyers?.value)}`}
          delta={d(k.newBuyers)}
          deltaLabel={dl ? `нові ${dl}` : null}
          info={INFO.buyers}
          icon={<MdGroup />}
          loading={loading}
          hint={buyersTotal ? `Усього покупців: ${formatInt(buyersTotal)}` : undefined}
        />
        <KpiCard
          label="Рейтинг"
          value={k.avgRating?.value === null || k.avgRating?.value === undefined ? "—" : `${formatNumber(k.avgRating.value, 2)} ★`}
          delta={d(k.avgRating)}
          deltaLabel={dl}
          info={INFO.rating}
          icon={<MdStar />}
          loading={loading}
        />
        <KpiCard
          label="Скасування"
          value={k.cancelRate?.value === null || k.cancelRate?.value === undefined ? "—" : formatPct(k.cancelRate.value, { ratio: true })}
          delta={d(k.cancelRate)}
          deltaLabel={dl}
          invertDelta
          info={INFO.cancel}
          icon={<MdKeyboardReturn />}
          loading={loading}
        />
      </section>

      <div className="grid min-w-0 grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-3">
        <ChartCard
          className="xl:col-span-2"
          title="Виручка і замовлення"
          info={INFO.revenue}
          description={range.compare !== "none" && data?.period?.prevFrom ? `Пунктир — ${formatDate(data.period.prevFrom)} – ${formatDate(data.period.prevTo)}` : undefined}
          loading={loading}
          empty={!loading && !hasSales}
          emptyText={EMPTY_ORDERS_TEXT}
        >
          <LineAreaChart categories={series.map((x) => bucketLabel(x.date, g))} yFormat="money" series={chart} ariaLabel="Виручка і кількість замовлень за період" />
        </ChartCard>
        <Insights insights={data?.insights} loading={loading} range={range} />
      </div>

      {!loading && orders > 0 && orders < 10 && <Note>Замовлень за період мало ({formatInt(orders)}) — зміни у відсотках можуть бути випадковими. Орієнтуйтеся на абсолютні числа.</Note>}

      <div className="grid min-w-0 grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-3">
        <Card className="min-w-0 xl:col-span-2">
          <CardHeader
            title="Останні замовлення"
            actions={
              <Link to="/seller/dashboard/orders" className="text-sm font-medium text-(--brand-ink) hover:underline">
                Усі замовлення
              </Link>
            }
          />
          <CardBody>
            <Table columns={orderColumns} rows={recentOrders} rowKey="_id" dense caption="Останні замовлення" empty={{ title: "Замовлень ще немає", text: EMPTY_ORDERS_TEXT }} />
          </CardBody>
        </Card>
        <Card className="min-w-0">
          <CardHeader
            title="Нові повідомлення"
            actions={
              <Link to="/seller/dashboard/chat-customer" className="text-sm font-medium text-(--brand-ink) hover:underline">
                Чат
              </Link>
            }
          />
          <CardBody>
            {!recentMessages.length ? (
              <EmptyState compact icon={<MdChatBubbleOutline aria-hidden="true" />} title="Повідомлень немає" />
            ) : (
              <ul className="flex flex-col divide-y divide-(--line)">
                {recentMessages.slice(0, 5).map((m) => (
                  <li key={m._id} className="min-w-0 py-2.5 first:pt-0 last:pb-0">
                    <div className="flex min-w-0 items-baseline justify-between gap-2">
                      <span className="min-w-0 truncate text-sm font-semibold text-(--ink)">{m.senderId === userInfo?._id ? "Ви" : m.senderName}</span>
                      <time className="shrink-0 text-xs text-(--ink-2)" dateTime={m.createdAt}>
                        {formatDate(m.createdAt, { withTime: true })}
                      </time>
                    </div>
                    <p className="line-clamp-2 break-words text-sm text-(--ink-2)">{m.message}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </AnalyticsPage>
  );
}
