import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { MdReceiptLong, MdStorefront } from "react-icons/md";
import { get_admin_orders } from "../../store/Reducers/orderSlice";
import { payLabel, deliveryLabel, orderNo } from "../../utils/statusLabels";
import {
  PageHeader,
  FilterBar,
  Select,
  Table,
  Pagination,
  StatusChip,
  Money,
  Button,
  Modal,
  formatDate,
} from "../../ui";

const INVOICE_STATUS = { awaiting: "не надіслано", sent: "надіслано", paid: "оплачено", expired: "строк минув", cancelled: "скасовано" };

const payTone = (s) => (s === "paid" ? "success" : s === "unpaid" ? "warning" : "neutral");
const deliveryTone = (s) =>
  s === "delivered" ? "success" : s === "cancelled" ? "danger" : s === "shipped" ? "brand" : s === "pending" ? "warning" : "neutral";

const PER_PAGE_OPTIONS = [
  { value: 5, label: "5 на сторінці" },
  { value: 10, label: "10 на сторінці" },
  { value: 20, label: "20 на сторінці" },
];

const Orders = () => {
  const dispatch = useDispatch();

  const [currentPage, setCurrentPage] = useState(1);
  const [searchValue, setSearchValue] = useState("");
  const [perPage, setPerPage] = useState(5);
  const [show, setShow] = useState(null);
  const [loading, setLoading] = useState(true);

  const { totalOrderCount, myOrdersArr } = useSelector((state) => state.order);

  useEffect(() => {
    const obj = {
      perPage: parseInt(perPage),
      page: parseInt(currentPage),
      searchValue,
    };
    setLoading(true);
    Promise.resolve(dispatch(get_admin_orders(obj))).finally(() => setLoading(false));
  }, [searchValue, currentPage, perPage, dispatch]);

  const opened = show ? (myOrdersArr || []).find((o) => o._id === show) : null;

  const columns = [
    {
      key: "no",
      header: "Замовлення",
      primary: true,
      render: (o) => (
        <div className="min-w-0">
          <Link to={`/admin/dashboard/order/details/${o._id}`} className="font-semibold text-(--brand-ink) hover:underline">
            {orderNo(o)}
          </Link>
          <div className="text-xs text-(--ink-2)">{formatDate(o.createdAt)}</div>
        </div>
      ),
    },
    { key: "price", header: "Сума", align: "right", render: (o) => <Money value={o.price} className="font-semibold" /> },
    {
      key: "payment",
      header: "Оплата",
      render: (o) => (
        <div className="flex min-w-0 flex-col items-end gap-1 md:items-start">
          <StatusChip tone={payTone(o.payment_status)}>{payLabel(o.payment_status)}</StatusChip>
          {o.invoice?.number && (
            <span className="text-xs text-(--ink-2)">
              рахунок {o.invoice.number}: {INVOICE_STATUS[o.invoice.status] || ""}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "delivery",
      header: "Статус",
      render: (o) => <StatusChip tone={deliveryTone(o.delivery_status)}>{deliveryLabel(o.delivery_status)}</StatusChip>,
    },
    {
      key: "actions",
      header: "Дії",
      align: "right",
      cardLabel: " ",
      render: (o) => (
        <div className="flex flex-wrap justify-end gap-2">
          {Array.isArray(o.suborder) && o.suborder.length > 0 && (
            <Button size="sm" variant="ghost" icon={<MdStorefront />} onClick={() => setShow(o._id)}>
              Продавці ({o.suborder.length})
            </Button>
          )}
          <Button size="sm" variant="secondary" as={Link} to={`/admin/dashboard/order/details/${o._id}`}>
            Переглянути
          </Button>
        </div>
      ),
    },
  ];

  const subColumns = [
    { key: "id", header: "Підзамовлення", primary: true, render: (so) => <span className="break-all font-medium">#{so._id}</span> },
    { key: "price", header: "Сума", align: "right", render: (so) => <Money value={so.price} /> },
    { key: "payment", header: "Оплата", render: (so) => <StatusChip tone={payTone(so.payment_status)}>{payLabel(so.payment_status)}</StatusChip> },
    { key: "delivery", header: "Статус", render: (so) => <StatusChip tone={deliveryTone(so.delivery_status)}>{deliveryLabel(so.delivery_status)}</StatusChip> },
  ];

  return (
    <div>
      <PageHeader
        title="Замовлення"
        description="Усі замовлення покупців. Відкрийте замовлення, щоб змінити статус або підтвердити оплату."
        breadcrumbs={[{ label: "Огляд", to: "/admin/dashboard" }, { label: "Замовлення" }]}
      />

      <FilterBar
        search={{
          value: searchValue,
          onChange: (v) => {
            setSearchValue(v);
            setCurrentPage(1);
          },
          placeholder: "Пошук за номером замовлення",
        }}
      >
        <Select
          aria-label="Кількість на сторінці"
          size="sm"
          value={perPage}
          options={PER_PAGE_OPTIONS}
          onChange={(e) => {
            setPerPage(parseInt(e.target.value));
            setCurrentPage(1);
          }}
        />
      </FilterBar>

      <Table
        caption="Замовлення"
        columns={columns}
        rows={myOrdersArr || []}
        loading={loading && !(myOrdersArr || []).length}
        skeletonRows={perPage}
        empty={{
          icon: <MdReceiptLong />,
          title: searchValue ? "Нічого не знайдено" : "Замовлень поки немає",
          text: searchValue ? "Спробуйте змінити запит пошуку." : "Нові замовлення покупців з'являться тут.",
        }}
      />

      <Pagination page={currentPage} total={totalOrderCount} perPage={perPage} onChange={setCurrentPage} />

      <Modal
        open={!!opened}
        onClose={() => setShow(null)}
        size="lg"
        title={opened ? `Підзамовлення продавців — ${orderNo(opened)}` : ""}
        description="Кожен продавець отримує власне підзамовлення."
        footer={
          <Button variant="secondary" onClick={() => setShow(null)}>
            Закрити
          </Button>
        }
      >
        {opened && <Table caption="Підзамовлення" dense columns={subColumns} rows={opened.suborder || []} />}
      </Modal>
    </div>
  );
};

export default Orders;
