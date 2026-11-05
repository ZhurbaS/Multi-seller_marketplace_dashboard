// Аналітика → Товари: GET /seller/analytics/products?sort=&order=&q=&page=&limit=
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { MdEdit, MdInventory2 } from "react-icons/md";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Drawer,
  FilterBar,
  InfoTip,
  Money,
  Pagination,
  Stat,
  Table,
  formatInt,
  formatNumber,
  formatPct,
} from "../../../ui";
import { AnalyticsPage, ProductCell, TitleInfo } from "./shared/AnalyticsPage";
import { useAnalytics } from "./shared/useAnalytics";
import { usePeriod } from "./shared/period";
import { ABC_HINT, ABC_TONE, EMPTY_ORDERS_TEXT, INFO, coverText, editProductLink, qualityTone, ratioOrAbs } from "./shared/labels";

const LIMIT = 20;
const SORTS = new Set(["name", "price", "stock", "units", "orders", "revenue", "returnRate", "rating", "views", "cr", "daysOfCover", "abc", "qualityScore"]);

function AbcBadge({ abc }) {
  return (
    <span title={ABC_HINT[abc] || ABC_HINT["-"]}>
      <Badge tone={ABC_TONE[abc] || "neutral"} size="sm">
        {abc === "-" || !abc ? "—" : abc}
        <span className="sr-only"> — {ABC_HINT[abc] || ABC_HINT["-"]}</span>
      </Badge>
    </span>
  );
}

function MiniList({ title, rows, empty }) {
  return (
    <Card className="min-w-0">
      <CardHeader title={title} />
      <CardBody>
        {!rows?.length ? (
          <p className="text-sm text-(--ink-2)">{empty}</p>
        ) : (
          <ol className="flex flex-col gap-2">
            {rows.map((r) => (
              <li key={r.productId} className="flex min-w-0 items-center justify-between gap-3">
                <ProductCell name={r.name} image={r.image} sub={`${formatInt(r.units)} шт · залишок ${formatInt(r.stock)}`} />
                <Money value={r.revenue} className="shrink-0 font-semibold" />
              </li>
            ))}
          </ol>
        )}
      </CardBody>
    </Card>
  );
}

function Detail({ row, onClose }) {
  const items = row
    ? [
        ["Виручка", <Money key="r" value={row.revenue} />, INFO.revenue],
        ["Продано, шт", formatInt(row.units), INFO.units],
        ["Замовлень", formatInt(row.orders)],
        ["Ціна", <Money key="p" value={row.price} />],
        ["Знижка", row.discount ? `${formatInt(row.discount)} %` : "—"],
        ["Залишок", formatInt(row.stock)],
        ["Днів запасу", coverText(row.daysOfCover), INFO.daysOfCover],
        ["ABC / XYZ", `${row.abc === "-" ? "—" : row.abc} / ${row.xyz === "-" ? "—" : row.xyz}`, `${INFO.abc} ${INFO.xyz}`],
        ["Перегляди", formatInt(row.views), INFO.views],
        ["Додали в кошик", formatInt(row.carts)],
        ["Перегляд → кошик", ratioOrAbs(row.viewToCart, row.carts, row.views), INFO.viewToCart],
        ["Кошик → замовлення", ratioOrAbs(row.cartToOrder, row.orders, row.carts), INFO.cartToOrder],
        ["Конверсія", ratioOrAbs(row.cr, row.orders, row.views), INFO.cr],
        ["Повернено, шт", formatInt(row.returnsUnits), INFO.returns],
        ["Рейтинг", row.rating ? `${formatNumber(row.rating, 2)} ★ (${formatInt(row.reviews)})` : "Немає відгуків", INFO.rating],
        ["Якість картки", `${formatInt(row.qualityScore)} / 100`, INFO.quality],
      ]
    : [];
  return (
    <Drawer
      open={!!row}
      onClose={onClose}
      title={row?.name || "Товар"}
      footer={
        row && (
          <div className="flex flex-wrap gap-2">
            <Button as={Link} to={editProductLink(row.productId)} icon={<MdEdit aria-hidden="true" />}>
              Редагувати товар
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Закрити
            </Button>
          </div>
        )
      }
    >
      {row && (
        <div className="flex min-w-0 flex-col gap-4">
          {row.image && <img src={row.image} alt="" className="aspect-square w-32 rounded-(--r-md) border border-(--line) object-cover" />}
          <dl className="grid grid-cols-1 gap-x-4 gap-y-3 min-[420px]:grid-cols-2">
            {items.map(([label, value, info]) => (
              <div key={label} className="min-w-0">
                <dt className="flex items-center gap-1 text-xs text-(--ink-2)">
                  {label}
                  {info && <InfoTip text={info} />}
                </dt>
                <dd className="min-w-0 truncate font-semibold tabular-nums text-(--ink)">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </Drawer>
  );
}

export default function Products() {
  const period = usePeriod();
  const [params, setParams] = useSearchParams();
  const sortKey = SORTS.has(params.get("sort")) ? params.get("sort") : "revenue";
  const order = params.get("order") === "asc" ? "asc" : "desc";
  const page = Math.max(1, parseInt(params.get("page"), 10) || 1);
  const q = params.get("q") || "";
  const [search, setSearch] = useState(q);
  const [detail, setDetail] = useState(null);

  const setParam = (patch) =>
    setParams((cur) => {
      const p = new URLSearchParams(cur);
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === "" || v === undefined) p.delete(k);
        else p.set(k, String(v));
      }
      return p;
    });

  // Пошук з затримкою 350 мс
  useEffect(() => {
    if (search === q) return undefined;
    const t = setTimeout(() => setParam({ q: search.trim() || null, page: null }), 350);
    return () => clearTimeout(t);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const query = useMemo(() => ({ ...period.query, sort: sortKey, order, q, page, limit: LIMIT }), [period.query, sortKey, order, q, page]);
  const { data, loading, refreshing, error, reload } = useAnalytics("products", query);
  const rows = data?.rows || [];
  const abc = data?.abc;

  const columns = [
    {
      key: "name",
      header: "Товар",
      primary: true,
      sortable: true,
      render: (r) => <ProductCell name={r.name} image={r.image} sub={`Ціна: ${r.price ?? "—"} ₴${r.discount ? ` · −${r.discount} %` : ""}`} />,
    },
    { key: "abc", header: "ABC", sortable: true, render: (r) => <AbcBadge abc={r.abc} /> },
    { key: "revenue", header: "Виручка", align: "right", sortable: true, render: (r) => <Money value={r.revenue} /> },
    { key: "units", header: "Продано", align: "right", sortable: true, render: (r) => formatInt(r.units) },
    { key: "stock", header: "Залишок", align: "right", sortable: true, render: (r) => formatInt(r.stock) },
    { key: "daysOfCover", header: "Запас", align: "right", sortable: true, render: (r) => coverText(r.daysOfCover) },
    { key: "views", header: "Перегляди", align: "right", sortable: true, render: (r) => formatInt(r.views) },
    { key: "cr", header: "Конверсія", align: "right", sortable: true, render: (r) => ratioOrAbs(r.cr, r.orders, r.views) },
    { key: "rating", header: "Рейтинг", align: "right", sortable: true, render: (r) => (r.rating ? `${formatNumber(r.rating, 1)} ★` : "—") },
    {
      key: "qualityScore",
      header: "Якість",
      align: "right",
      sortable: true,
      render: (r) => (
        <Badge tone={qualityTone(r.qualityScore)} size="sm">
          {formatInt(r.qualityScore)}
        </Badge>
      ),
    },
  ];

  return (
    <AnalyticsPage
      title="Товари"
      description="Продажі, конверсія та ABC-аналіз кожного товару за період"
      period={period}
      exportReport="products"
      error={error}
      onRetry={reload}
      refreshing={refreshing}
    >
      <Card>
        <CardHeader title={<TitleInfo title="ABC-аналіз" info={INFO.abc} />} description="Розподіл товарів за внеском у виручку періоду" />
        <CardBody className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-3">
          {["A", "B", "C"].map((k) => (
            <Stat
              key={k}
              label={`Клас ${k}`}
              loading={loading}
              value={abc ? `${formatInt(abc[k]?.count)} тов.` : null}
              hint={abc ? `${formatPct(abc[k]?.share, { ratio: true })} виручки` : undefined}
              info={ABC_HINT[k]}
            />
          ))}
        </CardBody>
      </Card>

      <div className="grid min-w-0 grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2">
        <MiniList title="Лідери за виручкою" rows={data?.topN} empty={EMPTY_ORDERS_TEXT} />
        <MiniList title="Найслабші (є залишок)" rows={data?.worstN} empty="Немає товарів із залишком." />
      </div>

      <Card className="min-w-0">
        <CardBody className="flex min-w-0 flex-col gap-3">
          <FilterBar search={{ value: search, onChange: setSearch, placeholder: "Пошук товару за назвою" }} onReset={q ? () => setSearch("") : undefined} />
          <Table
            caption="Аналітика товарів"
            columns={columns}
            rows={rows}
            rowKey="productId"
            loading={loading}
            sort={{ key: sortKey, dir: order }}
            onSort={(s) => setParam({ sort: s.key, order: s.dir, page: null })}
            onRowClick={setDetail}
            empty={
              q
                ? { title: "Нічого не знайдено", text: "Змініть запит пошуку." }
                : { icon: <MdInventory2 aria-hidden="true" />, title: "Товарів ще немає", text: "Додайте товари, щоб бачити їхню аналітику.", action: <Button as={Link} to="/seller/dashboard/add-product">Додати товар</Button> }
            }
          />
          {data?.total > LIMIT && <Pagination page={page} total={data.total} perPage={LIMIT} onChange={(p) => setParam({ page: p > 1 ? p : null })} />}
        </CardBody>
      </Card>

      <Detail row={detail} onClose={() => setDetail(null)} />
    </AnalyticsPage>
  );
}
