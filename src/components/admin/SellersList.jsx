import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { MdOutlineStorefront, MdVisibility } from "react-icons/md";
import { Button, Card, FilterBar, Pagination, Select, StatusChip, Table } from "../../ui";
import { SELLER_STATUS, SELLER_PAYMENT } from "./sellerStatus";

export function SellerStatusChip({ status }) {
  const s = SELLER_STATUS[status] || { label: status || "—", tone: "neutral" };
  return <StatusChip tone={s.tone}>{s.label}</StatusChip>;
}
export function SellerPaymentChip({ payment }) {
  const s = SELLER_PAYMENT[payment] || { label: payment || "—", tone: "neutral" };
  return <StatusChip tone={s.tone}>{s.label}</StatusChip>;
}

function Avatar({ src, name }) {
  return src ? (
    <img src={src} alt="" loading="lazy" className="h-10 w-10 shrink-0 rounded-full border border-(--line) object-cover" />
  ) : (
    <span aria-hidden="true" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-(--brand-soft) font-semibold text-(--brand-ink)">
      {String(name || "?").slice(0, 1).toUpperCase()}
    </span>
  );
}

const PER_PAGE_OPTIONS = [
  { value: 5, label: "5 на сторінці" },
  { value: 10, label: "10 на сторінці" },
  { value: 20, label: "20 на сторінці" },
];

/**
 * SellersList — спільний список продавців для «Продавці», «Неактивні», «Запити».
 * fetchThunk({perPage, page, searchValue}) — той самий thunk і payload, що й раніше.
 * showShop — колонки магазину/району; emptyTitle/emptyText — порожній стан.
 */
export default function SellersList({ fetchThunk, showShop = true, emptyTitle, emptyText, caption }) {
  const dispatch = useDispatch();
  const { sellers, totalSeller } = useSelector((state) => state.seller);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchValue, setSearchValue] = useState("");
  const [perPage, setPerPage] = useState(5);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const p = dispatch(
      fetchThunk({
        perPage: parseInt(perPage),
        page: parseInt(currentPage),
        searchValue,
      }),
    );
    Promise.resolve(p).finally(() => setLoading(false));
  }, [dispatch, fetchThunk, searchValue, currentPage, perPage]);

  const columns = [
    {
      key: "name",
      header: "Продавець",
      primary: true,
      render: (d) => (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar src={d.image} name={d.name} />
          <div className="min-w-0">
            <p className="truncate font-medium text-(--ink)">{d.name || "—"}</p>
            <p className="truncate text-xs text-(--ink-2)">{d.email}</p>
          </div>
        </div>
      ),
    },
    ...(showShop
      ? [
          { key: "shop", header: "Магазин", render: (d) => <span className="break-words">{d.shopInfo?.shopName || "—"}</span> },
          { key: "district", header: "Район", render: (d) => d.shopInfo?.district || "—" },
        ]
      : []),
    { key: "payment", header: "Виплати", render: (d) => <SellerPaymentChip payment={d.payment} /> },
    { key: "status", header: "Статус", render: (d) => <SellerStatusChip status={d.status} /> },
    {
      key: "action",
      header: <span className="sr-only">Дія</span>,
      cardLabel: " ",
      align: "right",
      render: (d) => (
        <Button as={Link} to={`/admin/dashboard/seller/details/${d._id}`} variant="secondary" size="sm" icon={<MdVisibility />}>
          Переглянути
        </Button>
      ),
    },
  ];

  return (
    <Card>
      <div className="p-3 pb-0 sm:p-4 sm:pb-0">
        <FilterBar
          className="mb-0 border-0 p-0"
          search={{
            value: searchValue,
            onChange: (v) => {
              setSearchValue(v);
              setCurrentPage(1);
            },
            placeholder: "Пошук за ім'ям, email, магазином",
          }}
        >
          <Select
            aria-label="Кількість на сторінці"
            value={perPage}
            onChange={(e) => {
              setPerPage(parseInt(e.target.value));
              setCurrentPage(1);
            }}
            options={PER_PAGE_OPTIONS}
            className="w-44"
          />
        </FilterBar>
      </div>
      <div className="p-3 sm:p-4">
        <Table
          caption={caption}
          columns={columns}
          rows={sellers || []}
          rowKey="_id"
          loading={loading}
          empty={{
            icon: <MdOutlineStorefront />,
            title: searchValue ? "Нічого не знайдено" : emptyTitle || "Продавців поки немає",
            text: searchValue ? "Спробуйте змінити запит пошуку." : emptyText,
          }}
        />
        <Pagination page={currentPage} total={totalSeller || 0} perPage={perPage} onChange={setCurrentPage} />
      </div>
    </Card>
  );
}
