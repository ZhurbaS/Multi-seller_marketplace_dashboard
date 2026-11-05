import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  MdLocalShipping,
  MdPerson,
  MdReceiptLong,
  MdPictureAsPdf,
  MdCheckCircle,
  MdSend,
  MdUpdate,
  MdOpenInNew,
  MdWarningAmber,
  MdStorefront,
  MdInventory2,
  MdAssignmentReturn,
} from "react-icons/md";
import api from "../../api/api";
import {
  admin_order_status_update,
  get_admin_order_details,
  messageClear,
} from "../../store/Reducers/orderSlice";
import {
  orderNo,
  formatDateTime,
  payLabel,
  deliveryLabel,
  formatAddress,
  recipientText,
  DELIVERY_TYPE,
} from "../../utils/statusLabels";
import {
  PageHeader,
  Card,
  CardHeader,
  CardBody,
  Field,
  Input,
  Select,
  Button,
  StatusChip,
  Badge,
  Money,
  Skeleton,
  EmptyState,
  useConfirm,
  formatDate,
} from "../../ui";

const payTone = (s) => (s === "paid" ? "success" : s === "unpaid" ? "warning" : "neutral");
const deliveryTone = (s) =>
  s === "delivered" ? "success" : s === "cancelled" ? "danger" : s === "shipped" ? "brand" : s === "pending" ? "warning" : "neutral";

const STATUS_OPTIONS = [
  { value: "cancelled", label: "Скасовано" },
  { value: "placed", label: "Розміщено" },
  { value: "processing", label: "Опрацьовується" },
  { value: "packing", label: "Готується до відправки" },
  { value: "shipped", label: "Відправлено" },
  { value: "delivered", label: "Доставлено" },
];

const INVOICE_STATUS = {
  awaiting: "очікує надсилання",
  sent: "надіслано, очікує оплату",
  paid: "оплачено",
  expired: "строк минув — замовлення скасовано",
  cancelled: "скасовано (обрано інший спосіб оплати)",
};
const invoiceTone = (s) => (s === "paid" ? "success" : s === "expired" || s === "cancelled" ? "danger" : "warning");
const MESSAGE_STATUS = { sent: "відправлено", delivered: "доставлено", read: "прочитано", failed: "не доставлено" };

function Row({ label, children }) {
  return (
    <div className="grid min-w-0 grid-cols-1 gap-0.5 py-2 sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)] sm:gap-3">
      <dt className="text-sm text-(--ink-2)">{label}</dt>
      <dd className="min-w-0 break-words text-sm text-(--ink)">{children}</dd>
    </div>
  );
}

function ProductLine({ p }) {
  return (
    <li className="flex min-w-0 items-center gap-3 py-3">
      {p.images?.[0] ? (
        <img src={p.images[0]} alt="" className="h-12 w-12 shrink-0 rounded-(--r-md) border border-(--line) object-cover" loading="lazy" />
      ) : (
        <span aria-hidden="true" className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-(--r-md) bg-(--surface-2) text-(--ink-2)">
          <MdInventory2 />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="break-words text-sm font-medium text-(--ink)">{p.name}</p>
        {p.brand && <p className="truncate text-xs text-(--ink-2)">Бренд: {p.brand}</p>}
      </div>
      <span className="shrink-0 text-sm tabular-nums text-(--ink-2)">× {p.quantity} шт.</span>
    </li>
  );
}

const OrderDetails = () => {
  const dispatch = useDispatch();
  const [confirm, confirmEl] = useConfirm();

  const { orderId } = useParams();
  const { order, errorMessage, successMessage } = useSelector((state) => state.order);
  const [status, setStatus] = useState("");
  const [override, setOverride] = useState("default");
  const [tracking, setTracking] = useState("");
  const [busy, setBusy] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setStatus(order?.delivery_status);
    setTracking(order?.trackingNumber || "");
    setOverride(order?.returnOverride || "default");
  }, [order]);

  const reload = () => dispatch(get_admin_order_details(orderId));

  const downloadInvoice = async () => {
    setBusy("pdf");
    try {
      const { data } = await api.get(`/admin/orders/${orderId}/invoice.pdf`, { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `rahunok-${order.invoice?.number}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      toast.error("Не вдалося завантажити рахунок");
    } finally {
      setBusy("");
    }
  };

  const resendInvoice = async (extend) => {
    setBusy(extend ? "extend" : "resend");
    try {
      const { data } = await api.post(`/admin/orders/${orderId}/invoice/resend`, { extend });
      data.sent ? toast.success(data.message) : toast.error(data.message);
      reload();
    } catch (err) {
      toast.error(err.response?.data?.error || "Не вдалося надіслати");
    } finally {
      setBusy("");
    }
  };

  const confirmPayment = async () => {
    const ok = await confirm({
      title: "Підтвердити оплату?",
      text: "Підтвердіть, що кошти за цим замовленням надійшли на рахунок.",
      confirmLabel: "Так, кошти надійшли",
      tone: "brand",
    });
    if (!ok) return;
    setBusy("pay");
    try {
      await api.get(`/order/confirm/${orderId}`);
      toast.success("Оплату підтверджено");
      reload();
    } catch (err) {
      toast.error(err.response?.data?.error || "Не вдалося підтвердити оплату");
    } finally {
      setBusy("");
    }
  };

  // Для окремого замовлення адмін може дозволити/заборонити повернення незалежно від загальних умов
  const changeOverride = async (e) => {
    const mode = e.target.value;
    setBusy("override");
    try {
      const { data } = await api.put(`/admin/orders/${orderId}/return-override`, { mode });
      setOverride(data.returnOverride);
      toast.success(data.message);
    } catch (err) {
      toast.error(err.response?.data?.error || "Не вдалося змінити");
    } finally {
      setBusy("");
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.resolve(dispatch(get_admin_order_details(orderId))).finally(() => setLoading(false));
  }, [orderId, dispatch]);

  const status_update = async (e) => {
    const value = e.target.value;
    if (value === "cancelled") {
      const ok = await confirm({
        title: "Скасувати замовлення?",
        text: "Покупець отримає сповіщення про скасування.",
        confirmLabel: "Скасувати замовлення",
        cancelLabel: "Ні",
      });
      if (!ok) return;
    }
    dispatch(admin_order_status_update({ orderId, info: { status: value, trackingNumber: tracking } }));
    setStatus(value);
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

  const ready = order && order._id && String(order._id) === String(orderId);
  const crumbs = [
    { label: "Огляд", to: "/admin/dashboard" },
    { label: "Замовлення", to: "/admin/dashboard/orders" },
    { label: ready ? orderNo(order) : "Деталі" },
  ];

  if (loading && !ready) {
    return (
      <div>
        <PageHeader title="Деталі замовлення" breadcrumbs={crumbs} />
        <div className="grid gap-4 lg:grid-cols-3">
          <Card padded className="lg:col-span-2">
            <Skeleton lines={8} />
          </Card>
          <Card padded>
            <Skeleton lines={5} />
          </Card>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div>
        <PageHeader title="Деталі замовлення" breadcrumbs={crumbs} />
        <Card>
          <EmptyState
            icon={<MdReceiptLong />}
            title="Замовлення не знайдено"
            text="Можливо, його видалено або посилання неправильне."
            action={
              <Button as={Link} to="/admin/dashboard/orders" variant="secondary">
                До списку замовлень
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  const inv = order.invoice;
  const lastChange = order.shippingChanges?.length > 0 ? order.shippingChanges.at(-1) : null;

  return (
    <div>
      <PageHeader
        title={`Замовлення ${orderNo(order)}`}
        description={`від ${formatDateTime(order.createdAt)}`}
        breadcrumbs={crumbs}
        actions={
          <>
            <StatusChip size="md" tone={payTone(order.payment_status)}>
              {payLabel(order.payment_status)}
            </StatusChip>
            <StatusChip size="md" tone={deliveryTone(order.delivery_status)}>
              {deliveryLabel(order.delivery_status)}
            </StatusChip>
          </>
        }
      />

      <div className="grid min-w-0 gap-4 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-4 lg:col-span-2">
          {order.shippingChangedAt && (
            <div role="status" className="flex gap-3 rounded-(--r-lg) border border-(--warning)/40 bg-(--warning-soft) p-4 text-sm text-(--warning-ink)">
              <MdWarningAmber aria-hidden="true" className="mt-0.5 shrink-0 text-lg" />
              <div className="min-w-0">
                <p className="font-semibold">Покупець змінив отримувача/доставку · {formatDate(order.shippingChangedAt, { withTime: true })}</p>
                {lastChange && (
                  <p className="mt-0.5 break-words">
                    Було: {recipientText(lastChange.before) || `${lastChange.before?.name}, ${lastChange.before?.phone}`}; {formatAddress(lastChange.before)}
                  </p>
                )}
              </div>
            </div>
          )}

          <Card>
            <CardHeader title="Покупець і доставка" icon={<MdPerson />} />
            <CardBody className="pt-2">
              <dl className="divide-y divide-(--line)">
                <Row label="Замовник">
                  {order.shippingInfo?.name}
                  {order.shippingInfo?.phone && (
                    <>
                      ,{" "}
                      <a className="text-(--brand-ink) hover:underline" href={`tel:${order.shippingInfo.phone}`}>
                        {order.shippingInfo.phone}
                      </a>
                    </>
                  )}
                </Row>
                {recipientText(order.shippingInfo) && <Row label="Отримувач">{recipientText(order.shippingInfo)}</Row>}
                <Row label="Покупець">
                  {order.buyer?.kind === "company" ? (
                    <>
                      Юрособа: {order.buyer.companyName}, ЄДРПОУ {order.buyer.edrpou}
                      {order.buyer.ipn ? `, ІПН ${order.buyer.ipn}` : ""}
                    </>
                  ) : (
                    "Фізична особа"
                  )}
                </Row>
                <Row label="Доставка">
                  {DELIVERY_TYPE[order.shippingInfo?.deliveryType] || "—"}{" "}
                  <span className="text-(--ink-2)">(оплачує покупець при отриманні)</span>
                </Row>
                <Row label="Адреса">{formatAddress(order.shippingInfo) || "—"}</Row>
                {order.comment && (
                  <Row label="Коментар покупця">
                    <span className="whitespace-pre-wrap">{order.comment}</span>
                  </Row>
                )}
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Товари"
              icon={<MdInventory2 />}
              actions={order.has_preorder ? <Badge tone="warning">Містить передзамовлення</Badge> : null}
            />
            <CardBody className="pt-1">
              {order.products?.length ? (
                <ul className="divide-y divide-(--line)">
                  {order.products.map((p, i) => (
                    <ProductLine key={p._id || i} p={p} />
                  ))}
                </ul>
              ) : (
                <EmptyState compact title="Товарів немає" />
              )}
              <dl className="mt-2 flex flex-col gap-1.5 border-t border-(--line) pt-3 text-sm">
                {order.order_discount?.amount > 0 && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-(--ink-2)">Знижка за сумою (−{order.order_discount.percent}%)</dt>
                    <dd className="tabular-nums">
                      −<Money value={order.order_discount.amount} />
                    </dd>
                  </div>
                )}
                {order.coupon?.amount > 0 && (
                  <div className="flex justify-between gap-3">
                    <dt className="min-w-0 text-(--ink-2)">Купон {order.coupon.code} (за рахунок магазину)</dt>
                    <dd className="tabular-nums">
                      −<Money value={order.coupon.amount} />
                    </dd>
                  </div>
                )}
                {order.refunded_total > 0 && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-(--ink-2)">Повернено покупцю</dt>
                    <dd>
                      <Money value={order.refunded_total} />
                    </dd>
                  </div>
                )}
                <div className="flex items-baseline justify-between gap-3 pt-1">
                  <dt className="font-semibold">Разом</dt>
                  <dd className="min-w-0 text-lg font-bold">
                    <Money value={order.price} />
                  </dd>
                </div>
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Підзамовлення продавців" icon={<MdStorefront />} />
            <CardBody className="flex flex-col gap-3 pt-2">
              {order.suborder?.length ? (
                order.suborder.map((so, i) => (
                  <div key={so._id || i} className="min-w-0 rounded-(--r-md) border border-(--line) p-3">
                    <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold">Продавець {i + 1}</p>
                      <StatusChip tone={deliveryTone(so.delivery_status)}>{deliveryLabel(so.delivery_status)}</StatusChip>
                    </div>
                    {typeof so.commission === "number" && (
                      <dl className="mt-2 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
                        <div className="min-w-0 rounded-(--r-sm) bg-(--surface-2) px-3 py-2">
                          <dt className="text-xs text-(--ink-2)">Сума</dt>
                          <dd className="font-semibold">
                            <Money value={so.price} />
                          </dd>
                        </div>
                        <div className="min-w-0 rounded-(--r-sm) bg-(--surface-2) px-3 py-2">
                          <dt className="text-xs text-(--ink-2)">Комісія магазину</dt>
                          <dd className="font-semibold">
                            <Money value={so.commission} />
                          </dd>
                        </div>
                        <div className="min-w-0 rounded-(--r-sm) bg-(--surface-2) px-3 py-2">
                          <dt className="text-xs text-(--ink-2)">До виплати продавцю</dt>
                          <dd className="font-semibold">
                            <Money value={so.payout} />
                          </dd>
                        </div>
                      </dl>
                    )}
                    {so.products?.length > 0 && (
                      <ul className="mt-1 divide-y divide-(--line)">
                        {so.products.map((p, j) => (
                          <ProductLine key={p._id || j} p={p} />
                        ))}
                      </ul>
                    )}
                  </div>
                ))
              ) : (
                <EmptyState compact title="Підзамовлень немає" />
              )}
            </CardBody>
          </Card>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <Card>
            <CardHeader title="Статус і відправлення" icon={<MdLocalShipping />} />
            <CardBody className="flex flex-col gap-4">
              <Field label="Статус замовлення">
                <Select value={status || ""} onChange={status_update} options={STATUS_OPTIONS} placeholder={status ? undefined : "Оберіть статус"} />
              </Field>
              <form
                className="flex flex-col gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  dispatch(admin_order_status_update({ orderId, info: { status, trackingNumber: tracking } }));
                }}
              >
                <Field label="ТТН перевізника" hint="Вноситься до листа «Відправлено»: вкажіть ТТН і змініть статус.">
                  <Input
                    value={tracking}
                    onChange={(e) => setTracking(e.target.value)}
                    maxLength={40}
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="Номер накладної"
                  />
                </Field>
                <Button type="submit" variant="secondary" fullWidth>
                  Зберегти ТТН
                </Button>
              </form>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Оплата" icon={<MdReceiptLong />} />
            <CardBody className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm text-(--ink-2)">Статус оплати</span>
                <StatusChip tone={payTone(order.payment_status)}>{payLabel(order.payment_status)}</StatusChip>
              </div>
              {inv?.number && (
                <div className="flex min-w-0 flex-col gap-2 rounded-(--r-md) border border-(--line) bg-(--surface-2) p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold">Рахунок {inv.number}</span>
                    <StatusChip tone={invoiceTone(inv.status)}>{INVOICE_STATUS[inv.status] || inv.status}</StatusChip>
                  </div>
                  <p className="break-words text-(--ink-2)">
                    Виставлено: {formatDate(inv.issuedAt)} · дійсний до: {formatDate(inv.dueAt)}
                    {inv.sentTo ? ` · надіслано на ${inv.sentTo}` : ""}
                    {inv.messageStatus ? ` · статус у месенджері: ${MESSAGE_STATUS[inv.messageStatus] || inv.messageStatus}` : ""}
                  </p>
                  {inv.channel && inv.channel !== "email" && (
                    <div className="flex flex-col gap-2">
                      <p className="break-words">
                        Покупець просить надіслати у {inv.channel === "viber" ? "Viber" : "WhatsApp"}: {inv.contact || "—"}
                      </p>
                      {inv.contact && (
                        <Button
                          as="a"
                          size="sm"
                          variant="secondary"
                          icon={<MdOpenInNew />}
                          target="_blank"
                          rel="noreferrer"
                          href={
                            inv.channel === "viber"
                              ? `viber://chat?number=${encodeURIComponent(String(inv.contact).replace(/[^\d+]/g, ""))}`
                              : `https://wa.me/${String(inv.contact).replace(/\D/g, "")}`
                          }
                        >
                          Відкрити чат
                        </Button>
                      )}
                      <p className="text-xs text-(--ink-2)">Завантажте PDF і надішліть вручну.</p>
                    </div>
                  )}
                  {inv.sendError && inv.status !== "paid" && (
                    <p role="alert" className="font-medium text-(--danger)">
                      {inv.sendError}
                    </p>
                  )}
                  <div className="flex flex-col gap-2 pt-1">
                    <Button size="sm" variant="secondary" icon={<MdPictureAsPdf />} loading={busy === "pdf"} onClick={downloadInvoice}>
                      Завантажити PDF
                    </Button>
                    {order.payment_status !== "paid" && order.delivery_status !== "cancelled" && inv.status !== "cancelled" && (
                      <>
                        <Button size="sm" variant="secondary" icon={<MdSend />} loading={busy === "resend"} disabled={!!busy} onClick={() => resendInvoice(false)}>
                          Надіслати повторно
                        </Button>
                        <Button size="sm" variant="secondary" icon={<MdUpdate />} loading={busy === "extend"} disabled={!!busy} onClick={() => resendInvoice(true)}>
                          Продовжити строк і надіслати
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}
              {inv?.number && order.payment_status !== "paid" && (
                <Button icon={<MdCheckCircle />} loading={busy === "pay"} disabled={!!busy && busy !== "pay"} onClick={confirmPayment} fullWidth>
                  Підтвердити оплату
                </Button>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Повернення" icon={<MdAssignmentReturn />} />
            <CardBody className="flex flex-col gap-3">
              <Field label="Повернення для цього замовлення" hint="Перевизначає загальні умови повернення лише для цього замовлення.">
                <Select value={override} onChange={changeOverride} disabled={busy === "override"}>
                  <option value="default">За загальними умовами</option>
                  <option value="allow">Дозволити (без обмежень строку)</option>
                  <option value="deny">Заборонити</option>
                </Select>
              </Field>
              <Button as={Link} to={`/admin/dashboard/returns?order=${orderId}`} variant="ghost" size="sm">
                Заявки на повернення за замовленням
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>
      {confirmEl}
    </div>
  );
};

export default OrderDetails;
