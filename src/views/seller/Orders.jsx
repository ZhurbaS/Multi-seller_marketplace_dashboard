import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { MdChevronRight, MdReceiptLong } from "react-icons/md";
import { get_seller_orders } from "../../store/Reducers/orderSlice";
import { formatDateTime } from "../../utils/statusLabels";
import { IconButton, Money, PageHeader, Pagination, Select, Table, Toolbar } from "../../ui";
import { DeliveryChip, PaymentChip } from "../../components/seller/OrderStatus";
import { shortId } from "../../components/seller/orderStatusUtils";
import { PER_PAGE_OPTIONS } from "../../components/seller/listUtils";

const Orders = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { userInfo } = useSelector((state) => state.auth);
  const [currentPage, setCurrentPage] = useState(1);
  // Пошук на сервері для замовлень продавця не реалізовано — передаємо порожній рядок, як і раніше за замовчуванням.
  const searchValue = "";
  const [perPage, setPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const { totalOrderCount, myOrdersArr } = useSelector((state) => state.order);

  useEffect(() => {
    if (!userInfo?._id) return;
    const obj = {
      perPage: parseInt(perPage),
      page: parseInt(currentPage),
      searchValue,
      sellerId: userInfo._id,
    };
    setLoading(true);
    dispatch(get_seller_orders(obj)).finally(() => setLoading(false));
  }, [currentPage, perPage, userInfo?._id, dispatch]);

  const detailsUrl = (d) => `/seller/dashboard/orders/details/${d._id}`;
  const units = (d) => (Array.isArray(d.products) ? d.products.reduce((s, p) => s + (Number(p.quantity) || 0), 0) : 0);

  const columns = [
    {
      key: "_id",
      header: "Замовлення",
      primary: true,
      render: (d) => (
        <div className="min-w-0">
          <Link to={detailsUrl(d)} onClick={(e) => e.stopPropagation()} className="font-semibold text-(--ink) tabular-nums hover:text-(--brand-ink) hover:underline">
            {shortId(d._id)}
          </Link>
          <p className="text-xs text-(--ink-2)">{d.createdAt ? formatDateTime(d.createdAt) : d.date}</p>
        </div>
      ),
    },
    { key: "units", header: "Товарів", align: "right", render: (d) => `${units(d)} шт` },
    { key: "price", header: "Сума", align: "right", render: (d) => <Money value={d.price} className="font-semibold" /> },
    { key: "payment_status", header: "Оплата", render: (d) => <PaymentChip status={d.payment_status} /> },
    { key: "delivery_status", header: "Статус", render: (d) => <DeliveryChip status={d.delivery_status} /> },
    {
      key: "actions",
      header: <span className="sr-only">Дії</span>,
      hideOnCard: true,
      align: "right",
      render: (d) => <IconButton as={Link} to={detailsUrl(d)} icon={<MdChevronRight />} label={`Деталі замовлення ${shortId(d._id)}`} onClick={(e) => e.stopPropagation()} />,
    },
  ];

  return (
    <div className="mx-auto w-full">
      <PageHeader
        title="Замовлення"
        description={totalOrderCount ? `Усього замовлень: ${totalOrderCount}` : "Замовлення покупців на ваші товари"}
      />

      <Toolbar className="mb-4 justify-end">
        <Select
          aria-label="Кількість на сторінці"
          size="sm"
          value={perPage}
          onChange={(e) => {
            setPerPage(parseInt(e.target.value));
            setCurrentPage(1);
          }}
          options={PER_PAGE_OPTIONS}
          className="w-full sm:w-48"
        />
      </Toolbar>

      <Table
        caption="Замовлення"
        columns={columns}
        rows={myOrdersArr}
        loading={loading && myOrdersArr.length === 0}
        onRowClick={(d) => navigate(detailsUrl(d))}
        empty={{
          icon: <MdReceiptLong />,
          title: "Замовлень поки немає",
          text: "Щойно покупець оформить замовлення на ваш товар, воно з'явиться тут.",
        }}
        className={loading && myOrdersArr.length > 0 ? "opacity-60 transition-opacity" : undefined}
      />

      <Pagination page={currentPage} total={totalOrderCount} perPage={perPage} onChange={setCurrentPage} />
    </div>
  );
};

export default Orders;
