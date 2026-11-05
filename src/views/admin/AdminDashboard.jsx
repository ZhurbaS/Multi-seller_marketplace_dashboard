import { useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  MdAccountBalanceWallet,
  MdAssignmentReturn,
  MdChevronRight,
  MdPayments,
  MdPersonAdd,
  MdRateReview,
  MdReceiptLong,
  MdRefresh,
  MdShoppingCart,
  MdStorefront,
  MdTrendingUp,
  MdHowToReg,
} from "react-icons/md";
import { get_admin_dashboard_data } from "../../store/Reducers/dashboardSlice";
import { get_admin_overview, overviewKey } from "../../store/Reducers/adminAnalyticsSlice";
import { payLabel, deliveryLabel, orderNo } from "../../utils/statusLabels";
import {
  PageHeader,
  DateRangePicker,
  KpiCard,
  Card,
  CardHeader,
  CardBody,
  ChartCard,
  LineAreaChart,
  Table,
  Money,
  StatusChip,
  Button,
  EmptyState,
  Skeleton,
  formatDate,
  formatInt,
  formatPct,
  rangeFromSearch,
  rangeToSearch,
  compareRange,
} from "../../ui";

const payTone = (s) => (s === "paid" ? "success" : s === "unpaid" ? "warning" : "neutral");
const deliveryTone = (s) =>
  s === "delivered" ? "success" : s === "cancelled" ? "danger" : s === "shipped" ? "brand" : s === "pending" ? "warning" : "neutral";

const ACTIONS = [
  { key: "sellerRequests", label: "Продавці на модерації", to: "/admin/dashboard/sellers-request", icon: <MdHowToReg /> },
  { key: "paymentRequests", label: "Заявки на виплату", to: "/admin/dashboard/payment-request", icon: <MdPayments /> },
  { key: "returns", label: "Нові повернення", to: "/admin/dashboard/returns", icon: <MdAssignmentReturn /> },
  { key: "reviews", label: "Відгуки на модерації", to: "/admin/dashboard/reviews", icon: <MdRateReview /> },
];

function compareLabel(range) {
  if (range.compare === "none") return undefined;
  const r = compareRange(range);
  if (!r) return undefined;
  return range.compare === "yoy" ? "до того ж періоду рік тому" : "до попереднього періоду";
}

function RankList({ rows, loading, emptyText, renderName, renderMeta }) {
  if (loading) {
    return (
      <div className="space-y-3 p-4 sm:p-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} height={20} />
        ))}
      </div>
    );
  }
  if (!rows.length) return <EmptyState compact icon={<MdTrendingUp />} title="Даних поки мало" text={emptyText} />;
  const max = Math.max(...rows.map((r) => Number(r.revenue) || 0), 1);
  return (
    <ol className="divide-y divide-(--line)">
      {rows.map((r, i) => (
        <li key={i} className="flex min-w-0 items-center gap-3 px-4 py-3 sm:px-5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-(--surface-2) text-xs font-semibold text-(--ink-2) tabular-nums">
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-baseline justify-between gap-3">
              <span className="min-w-0 truncate font-medium text-(--ink)">{renderName(r)}</span>
              <Money value={r.revenue} compact className="shrink-0 font-semibold" />
            </div>
            <div className="mt-1.5 flex min-w-0 items-center gap-3">
              <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-(--surface-2)" aria-hidden="true">
                <div className="h-full rounded-full bg-(--chart-1)" style={{ width: `${Math.max(4, ((Number(r.revenue) || 0) / max) * 100)}%` }} />
              </div>
              <span className="shrink-0 text-xs text-(--ink-2) tabular-nums">{renderMeta(r)}</span>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const [params, setParams] = useSearchParams();
  const range = useMemo(() => rangeFromSearch(params), [params]);
  const key = overviewKey(range);

  const { cache, loadingKey, errorKey, error } = useSelector((s) => s.adminAnalytics);
  const { recentOrders } = useSelector((s) => s.dashboard);
  const data = cache[key]?.data || null;
  const loading = !data && errorKey !== key;
  const refreshing = !!data && loadingKey === key;
  const failed = errorKey === key && !data;

  useEffect(() => {
    dispatch(get_admin_overview({ from: range.from, to: range.to, compare: range.compare }));
  }, [dispatch, range.from, range.to, range.compare]);

  useEffect(() => {
    dispatch(get_admin_dashboard_data());
  }, [dispatch]);

  const reload = () => dispatch(get_admin_overview({ from: range.from, to: range.to, compare: range.compare }));
  const onRange = (r) => setParams(rangeToSearch(r, params), { replace: true });

  const kpi = data?.kpi || {};
  const cmp = data?.compare || {};
  const dLabel = compareLabel(range);
  const delta = (k) => (range.compare === "none" ? undefined : (cmp[k]?.deltaPct ?? null));
  const series = data?.series || [];
  const pending = data?.pendingActions || {};
  const pendingTotal = ACTIONS.reduce((s, a) => s + (Number(pending[a.key]) || 0), 0);

  const kpis = [
    { k: "gmv", label: "GMV (оборот)", format: "money", compact: true, icon: <MdTrendingUp />, info: "Сума зарахованих підзамовлень (оплачені або доставлені, без скасованих) за ціною товарів." },
    { k: "orders", label: "Замовлення", format: "int", icon: <MdShoppingCart />, info: "Кількість замовлень покупців із зарахованими підзамовленнями." },
    { k: "commission", label: "Комісія маркетплейсу", format: "money", compact: true, icon: <MdAccountBalanceWallet />, info: "Сума комісій із зарахованих підзамовлень (знімок на момент замовлення)." },
    { k: "payoutsPending", label: "Виплати в очікуванні", format: "money", compact: true, icon: <MdPayments />, info: "Поточна сума заявок продавців на виплату зі статусом «очікує». Не залежить від періоду.", noDelta: true },
    { k: "activeSellers", label: "Активні продавці", format: "int", icon: <MdStorefront />, info: "Продавці з принаймні одним зарахованим замовленням у періоді." },
    { k: "newCustomers", label: "Нові клієнти", format: "int", icon: <MdPersonAdd />, info: "Нові зареєстровані акаунти покупців (без гостьових)." },
  ];

  const orderColumns = [
    {
      key: "no",
      header: "Замовлення",
      primary: true,
      render: (o) => (
        <Link to={`/admin/dashboard/order/details/${o._id}`} className="font-semibold text-(--brand-ink) hover:underline">
          {orderNo(o)}
        </Link>
      ),
    },
    { key: "price", header: "Сума", align: "right", render: (o) => <Money value={o.price} className="font-semibold" /> },
    { key: "pay", header: "Оплата", render: (o) => <StatusChip tone={payTone(o.payment_status)}>{payLabel(o.payment_status)}</StatusChip> },
    { key: "del", header: "Статус", render: (o) => <StatusChip tone={deliveryTone(o.delivery_status)}>{deliveryLabel(o.delivery_status)}</StatusChip> },
    {
      key: "act",
      header: "Дії",
      align: "right",
      cardLabel: " ",
      render: (o) => (
        <Button size="sm" variant="secondary" as={Link} to={`/admin/dashboard/order/details/${o._id}`}>
          Переглянути
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Огляд маркетплейсу"
        description={
          data?.period
            ? `Період: ${formatDate(data.period.from)} – ${formatDate(data.period.to)}${refreshing ? " · оновлення…" : ""}`
            : "Ключові показники, динаміка та черги, що потребують уваги."
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <DateRangePicker value={range} onChange={onRange} />
            <Button variant="ghost" icon={<MdRefresh />} onClick={reload} loading={refreshing} aria-label="Оновити дані">
              <span className="hidden sm:inline">Оновити</span>
            </Button>
          </div>
        }
      />

      {failed && (
        <Card padded className="border-(--danger) bg-(--danger-soft)">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="min-w-0 text-sm text-(--danger)">{error}</p>
            <Button size="sm" variant="secondary" icon={<MdRefresh />} onClick={reload}>
              Спробувати ще раз
            </Button>
          </div>
        </Card>
      )}

      <section aria-label="Ключові показники" className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {kpis.map((c) => (
          <KpiCard
            key={c.k}
            label={c.label}
            value={kpi[c.k]}
            format={c.format}
            compact={c.compact}
            icon={c.icon}
            info={c.info}
            loading={loading}
            delta={c.noDelta ? undefined : delta(c.k)}
            deltaLabel={c.noDelta ? undefined : dLabel}
            hint={c.noDelta ? "поточний стан" : undefined}
          />
        ))}
      </section>

      <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-3">
        <ChartCard
          className="xl:col-span-2"
          title="GMV, комісія та замовлення"
          description={data?.returns?.rate != null ? `Частка повернень за період: ${formatPct(data.returns.rate, { ratio: true })}` : undefined}
          loading={loading}
          height={300}
        >
          <LineAreaChart
            height={300}
            ariaLabel="Динаміка GMV, комісії та кількості замовлень за період"
            categories={series.map((p) => formatDate(p.date, { short: true }))}
            yFormat="money"
            series={[
              { name: "GMV", data: series.map((p) => p.gmv), format: "money" },
              { name: "Комісія", data: series.map((p) => p.commission), format: "money" },
              { name: "Замовлення", data: series.map((p) => p.orders), axis: "right", format: "int", type: "line" },
            ]}
          />
        </ChartCard>

        <Card>
          <CardHeader
            title="Потребує уваги"
            description={loading ? undefined : pendingTotal ? `${formatInt(pendingTotal)} у чергах` : "Черги порожні"}
          />
          <ul className="divide-y divide-(--line)">
            {ACTIONS.map((a) => {
              const n = Number(pending[a.key]) || 0;
              return (
                <li key={a.key}>
                  <Link
                    to={a.to}
                    className="flex min-h-[52px] min-w-0 items-center gap-3 px-4 py-3 hover:bg-(--surface-2) focus-visible:bg-(--surface-2) sm:px-5"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-(--r-md) bg-(--brand-soft) text-lg text-(--brand-ink)" aria-hidden="true">
                      {a.icon}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-(--ink)">{a.label}</span>
                    {loading ? (
                      <Skeleton width={32} height={22} rounded="full" />
                    ) : n > 0 ? (
                      <StatusChip tone="warning">{formatInt(n)}</StatusChip>
                    ) : (
                      <StatusChip tone="success">0</StatusChip>
                    )}
                    <MdChevronRight className="shrink-0 text-(--ink-2)" aria-hidden="true" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Топ продавців" description="За GMV у періоді" icon={<MdStorefront />} />
          <RankList
            loading={loading}
            rows={data?.topSellers || []}
            emptyText="Рейтинг з'явиться після перших зарахованих замовлень."
            renderName={(s) =>
              s.sellerId ? (
                <Link to={`/admin/dashboard/seller/details/${s.sellerId}`} className="hover:underline">
                  {s.shopName || "Без назви"}
                </Link>
              ) : (
                s.shopName || "Без назви"
              )
            }
            renderMeta={(s) => `${formatInt(s.orders)} підзам.`}
          />
        </Card>
        <Card>
          <CardHeader title="Топ категорій" description="За виручкою товарів у періоді" icon={<MdTrendingUp />} />
          <RankList
            loading={loading}
            rows={data?.topCategories || []}
            emptyText="Рейтинг з'явиться після перших зарахованих замовлень."
            renderName={(c) => c.category || "—"}
            renderMeta={(c) => `${formatInt(c.units)} шт.`}
          />
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Останні замовлення"
          icon={<MdReceiptLong />}
          actions={
            <Button size="sm" variant="ghost" as={Link} to="/admin/dashboard/orders" iconRight={<MdChevronRight />}>
              Усі замовлення
            </Button>
          }
        />
        <CardBody className="pt-0">
          <Table
            caption="Останні замовлення"
            dense
            columns={orderColumns}
            rows={recentOrders || []}
            empty={{ icon: <MdReceiptLong />, title: "Замовлень поки немає", text: "Нові замовлення покупців з'являться тут." }}
          />
        </CardBody>
      </Card>
    </div>
  );
};

export default AdminDashboard;
