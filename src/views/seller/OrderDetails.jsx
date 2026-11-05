import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { MdLocalShipping, MdPayments, MdShoppingBag } from "react-icons/md";
import { get_seller_order_details, messageClear, seller_order_status_update } from "../../store/Reducers/orderSlice";
import { DELIVERY_STATUS, formatAddress, formatDateTime } from "../../utils/statusLabels";
import { Card, CardBody, CardHeader, ConfirmDialog, Field, Money, PageHeader, Select, Skeleton, Spinner } from "../../ui";
import { DeliveryChip, PaymentChip } from "../../components/seller/OrderStatus";
import { shortId } from "../../components/seller/orderStatusUtils";
import { ProductThumb } from "../../components/seller/ProductCells";

// Статуси, які продавець може встановити (як на бекенді); «Очікує обробки» — лише для відображення.
const STATUS_OPTIONS = [
  { value: "pending", label: DELIVERY_STATUS.pending, disabled: true },
  { value: "placed", label: DELIVERY_STATUS.placed },
  { value: "processing", label: DELIVERY_STATUS.processing },
  { value: "packing", label: DELIVERY_STATUS.packing },
  { value: "shipped", label: DELIVERY_STATUS.shipped },
  { value: "delivered", label: DELIVERY_STATUS.delivered },
  { value: "cancelled", label: DELIVERY_STATUS.cancelled },
];

function Row({ label, children, strong }) {
  return (
    <div className="flex min-w-0 items-baseline justify-between gap-4 py-2">
      <dt className="text-sm text-(--ink-2)">{label}</dt>
      <dd className={strong ? "min-w-0 text-right text-base font-semibold text-(--ink)" : "min-w-0 text-right text-(--ink)"}>{children}</dd>
    </div>
  );
}

const OrderDetails = () => {
  const dispatch = useDispatch();
  const { orderId } = useParams();
  const { order, errorMessage, successMessage } = useSelector((state) => state.order);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [pendingCancel, setPendingCancel] = useState(false);

  const loaded = order && String(order._id) === String(orderId);

  useEffect(() => {
    setStatus(order?.delivery_status);
  }, [order]);

  useEffect(() => {
    dispatch(get_seller_order_details(orderId));
  }, [orderId, dispatch]);

  const apply = (value) => {
    const prev = status;
    setStatus(value);
    setSaving(true);
    dispatch(seller_order_status_update({ orderId, info: { status: value } })).then((res) => {
      setSaving(false);
      if (seller_order_status_update.rejected.match(res)) setStatus(prev);
    });
  };

  const status_update = (e) => {
    const value = e.target.value;
    if (value === "cancelled") setPendingCancel(true);
    else apply(value);
  };

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(messageClear());
    }
    if (errorMessage) {
      toast.error(errorMessage);
      dispatch(messageClear());
    }
  }, [successMessage, errorMessage, dispatch]);

  const products = Array.isArray(order?.products) ? order.products : [];
  const address = typeof order?.shippingInfo === "string" ? order.shippingInfo : formatAddress(order?.shippingInfo);

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        title={loaded ? `Замовлення ${shortId(order._id)}` : "Замовлення"}
        description={loaded ? (order.createdAt ? formatDateTime(order.createdAt) : order.date) : "Завантаження…"}
        breadcrumbs={[{ label: "Замовлення", to: "/seller/dashboard/orders" }, { label: "Деталі" }]}
        actions={
          loaded && (
            <div className="flex flex-wrap items-center gap-2">
              <PaymentChip status={order.payment_status} />
              <DeliveryChip status={status} />
            </div>
          )
        }
      />

      {!loaded ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]" aria-busy="true">
          <Card>
            <CardBody className="flex flex-col gap-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton width="3rem" height="3rem" rounded="md" />
                  <Skeleton lines={2} className="flex-1" />
                </div>
              ))}
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Skeleton lines={4} />
            </CardBody>
          </Card>
        </div>
      ) : (
        <div className="grid min-w-0 gap-4 sm:gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Card as="section">
            <CardHeader title="Товари" description={`Позицій: ${products.length}`} icon={<MdShoppingBag />} />
            <CardBody>
              <ul className="divide-y divide-(--line)">
                {products.map((p, i) => (
                  <li key={p._id || i} className="flex min-w-0 items-start gap-3 py-3 first:pt-0 last:pb-0">
                    <ProductThumb src={p.images?.[0]} size="lg" />
                    <div className="min-w-0 flex-1">
                      <p className="break-words font-medium text-(--ink)">{p.name}</p>
                      {p.brand && <p className="text-sm text-(--ink-2)">Бренд: {p.brand}</p>}
                      <p className="mt-1 text-sm text-(--ink-2) tabular-nums">Кількість: {p.quantity} шт</p>
                    </div>
                    {typeof p.price === "number" && (
                      <div className="shrink-0 text-right">
                        <Money value={p.price} className="font-semibold" />
                        {p.discount ? <p className="text-xs text-(--sale)">−{p.discount} %</p> : null}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>

          <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
            <Card as="section">
              <CardHeader title="Статус замовлення" icon={<MdLocalShipping />} />
              <CardBody className="flex flex-col gap-3">
                <Field label="Змінити статус" hint={saving ? undefined : "Зміна зберігається одразу після вибору"}>
                  <Select value={status || ""} onChange={status_update} disabled={saving} options={STATUS_OPTIONS} />
                </Field>
                {saving && (
                  <p className="inline-flex items-center gap-2 text-sm text-(--ink-2)" aria-live="polite">
                    <Spinner /> Збереження…
                  </p>
                )}
                <div className="rounded-(--r-md) bg-(--surface-2) p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-(--ink-2)">Доставка</p>
                  <p className="mt-1 break-words text-sm text-(--ink)">{address || "—"}</p>
                </div>
              </CardBody>
            </Card>

            <Card as="section">
              <CardHeader title="Оплата" icon={<MdPayments />} actions={<PaymentChip status={order.payment_status} />} />
              <CardBody>
                <dl className="divide-y divide-(--line)">
                  <Row label="Сума замовлення">
                    <Money value={order.price} />
                  </Row>
                  {typeof order.commission === "number" && (
                    <>
                      <Row label="Комісія магазину">
                        <Money value={order.commission} className="text-(--ink-2)" />
                      </Row>
                      <Row label="До виплати вам" strong>
                        <Money value={order.payout} className="text-(--success)" />
                      </Row>
                    </>
                  )}
                </dl>
              </CardBody>
            </Card>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={pendingCancel}
        title="Скасувати замовлення?"
        text="Відновити оплачене скасоване замовлення потім не вийде. Доставлене замовлення скасувати не можна — покупець може оформити повернення."
        confirmLabel="Скасувати замовлення"
        cancelLabel="Ні, залишити"
        onClose={() => setPendingCancel(false)}
        onConfirm={() => {
          setPendingCancel(false);
          apply("cancelled");
        }}
      />
    </div>
  );
};

export default OrderDetails;
