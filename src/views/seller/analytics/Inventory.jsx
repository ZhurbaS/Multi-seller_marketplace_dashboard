// Аналітика → Залишки: GET /seller/analytics/inventory
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MdEdit, MdWarehouse } from "react-icons/md";
import { Badge, Button, Card, CardBody, IconButton, KpiCard, Segmented, StatusChip, Table, formatDate, formatInt, formatNumber } from "../../../ui";
import { AnalyticsPage, Note, ProductCell } from "./shared/AnalyticsPage";
import { useAnalytics } from "./shared/useAnalytics";
import { usePeriod } from "./shared/period";
import { ABC_TONE, INFO, INVENTORY_STATUS, coverText, editProductLink } from "./shared/labels";

export default function Inventory() {
  const period = usePeriod();
  const { data, loading, refreshing, error, reload } = useAnalytics("inventory", period.query);
  const [filter, setFilter] = useState("all");
  const s = data?.summary || {};
  const rows = useMemo(() => (data?.rows || []).filter((r) => filter === "all" || r.status === filter), [data, filter]);

  const columns = [
    { key: "name", header: "Товар", primary: true, sortable: true, render: (r) => <ProductCell name={r.name} image={r.image} to={editProductLink(r.productId)} /> },
    {
      key: "status",
      header: "Статус",
      sortable: true,
      sortValue: (r) => ({ out: 0, low: 1, dead: 2, ok: 3 })[r.status],
      render: (r) => {
        const st = INVENTORY_STATUS[r.status] || INVENTORY_STATUS.ok;
        return <StatusChip tone={st.tone}>{st.label}</StatusChip>;
      },
    },
    { key: "stock", header: "Залишок, шт", align: "right", sortable: true, render: (r) => formatInt(r.stock) },
    { key: "avgDaily28", header: "Продажі/день", align: "right", sortable: true, render: (r) => formatNumber(r.avgDaily28, 2) },
    { key: "daysOfCover", header: "Вистачить на", align: "right", sortable: true, sortValue: (r) => r.daysOfCover ?? 1e9, render: (r) => coverText(r.daysOfCover) },
    { key: "abc", header: "ABC", render: (r) => <Badge tone={ABC_TONE[r.abc] || "neutral"} size="sm">{r.abc === "-" ? "—" : r.abc}</Badge> },
    { key: "lastSaleAt", header: "Останній продаж", sortable: true, render: (r) => (r.lastSaleAt ? formatDate(r.lastSaleAt) : "Ще не було") },
    {
      key: "actions",
      header: <span className="sr-only">Дії</span>,
      hideOnCard: true,
      render: (r) => <IconButton as={Link} to={editProductLink(r.productId)} icon={<MdEdit />} label={`Редагувати «${r.name}»`} size="sm" />,
    },
  ];

  const filters = [
    { value: "all", label: `Усі${data?.rows ? ` (${formatInt(data.rows.length)})` : ""}` },
    { value: "out", label: `Немає (${formatInt(s.outOfStock || 0)})` },
    { value: "low", label: `Закінчуються (${formatInt(s.low || 0)})` },
    { value: "dead", label: `Не продаються (${formatInt(s.dead || 0)})` },
  ];

  return (
    <AnalyticsPage
      title="Залишки"
      description="Скільки днів вистачить товару, що закінчується і що не продається"
      period={period}
      exportReport="inventory"
      error={error}
      onRetry={reload}
      refreshing={refreshing}
    >
      <section aria-label="Підсумок залишків" className="grid min-w-0 grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="У наявності" value={s.active} format="int" hint="Товарів із залишком > 0" loading={loading} />
        <KpiCard label="Немає в наявності" value={s.outOfStock} format="int" hint="Покупці не можуть замовити" loading={loading} />
        <KpiCard label="Закінчуються" value={s.low} format="int" info={`Залишку менше ніж на 7 днів. ${INFO.daysOfCover}`} loading={loading} />
        <KpiCard label="Не продаються 90 дн." value={s.dead} format="int" info="Є залишок, але жодного продажу за 90 днів (нові товари молодші 90 днів не враховуються)." loading={loading} />
      </section>

      <Note>Розрахунок запасу використовує продажі за останні 28 днів і не залежить від обраного періоду. {INFO.avgDaily28}</Note>

      <Card className="min-w-0">
        <CardBody className="flex min-w-0 flex-col gap-3">
          <div className="max-w-full overflow-x-auto">
            <Segmented ariaLabel="Фільтр за статусом" size="sm" options={filters} value={filter} onChange={setFilter} />
          </div>
          <Table
            caption="Залишки товарів"
            columns={columns}
            rows={rows}
            rowKey="productId"
            loading={loading}
            empty={
              filter !== "all"
                ? { title: "Таких товарів немає", text: "Чудово — у цій категорії порожньо." }
                : { icon: <MdWarehouse aria-hidden="true" />, title: "Товарів ще немає", action: <Button as={Link} to="/seller/dashboard/add-product">Додати товар</Button> }
            }
          />
        </CardBody>
      </Card>
    </AnalyticsPage>
  );
}
