import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";
import api from "../../api/api";
import {
  admin_order_status_update,
  get_admin_order_details,
  messageClear,
} from "../../store/Reducers/orderSlice";
import toast from "react-hot-toast";
import { payLabel, deliveryLabel, formatAddress, recipientText } from "../../utils/statusLabels";

const OrderDetails = () => {
  const dispatch = useDispatch();

  const { orderId } = useParams();
  const { order, errorMessage, successMessage } = useSelector(
    (state) => state.order
  );
  const [status, setStatus] = useState("");
  const [override, setOverride] = useState("default");

  useEffect(() => {
    setStatus(order?.delivery_status);
    setOverride(order?.returnOverride || "default");
  }, [order]);

  const reload = () => dispatch(get_admin_order_details(orderId));

  const downloadInvoice = async () => {
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
    }
  };

  const resendInvoice = async (extend) => {
    try {
      const { data } = await api.post(`/admin/orders/${orderId}/invoice/resend`, { extend });
      data.sent ? toast.success(data.message) : toast.error(data.message);
      reload();
    } catch (err) {
      toast.error(err.response?.data?.error || "Не вдалося надіслати");
    }
  };

  const confirmPayment = async () => {
    if (!window.confirm("Підтвердити, що кошти за цим замовленням надійшли на рахунок?")) return;
    try {
      await api.get(`/order/confirm/${orderId}`);
      toast.success("Оплату підтверджено");
      reload();
    } catch (err) {
      toast.error(err.response?.data?.error || "Не вдалося підтвердити оплату");
    }
  };

  // Для окремого замовлення адмін може дозволити/заборонити повернення незалежно від загальних умов
  const changeOverride = async (e) => {
    const mode = e.target.value;
    try {
      const { data } = await api.put(`/admin/orders/${orderId}/return-override`, { mode });
      setOverride(data.returnOverride);
      toast.success(data.message);
    } catch (err) {
      toast.error(err.response?.data?.error || "Не вдалося змінити");
    }
  };

  useEffect(() => {
    dispatch(get_admin_order_details(orderId));
  }, [orderId]);

  const status_update = (e) => {
    dispatch(
      admin_order_status_update({ orderId, info: { status: e.target.value } })
    );
    setStatus(e.target.value);
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
  }, [successMessage, errorMessage]);

  return (
    <div className="px-2 lg:px-7 pt-5">
      <div className="w-full p-4 bg-[#6a5fdf] rounded-md">
        <div className="flex justify-between items-center p-4">
          <h2 className="text-xl text-[#d0d2d6]">Деталі замовлення</h2>
          <select
            value={status}
            onChange={status_update}
            name=""
            id=""
            className="px-4 py-2 focus:border-indigo-500 outline-none bg-[#475569] border border-slate-700 rounded-md text-[#d0d2d6]"
          >
            <option value="cancelled">Скасовано</option>
            <option value="placed">Розміщено</option>
            <option value="processing">Опрацьовується</option>
            {/* <option value="">Очікує на оплату</option> */}
            <option value="packing">Готується до відправки</option>
            <option value="shipped">Відправлено</option>
            <option value="delivered">Доставлено</option>
          </select>
        </div>
        <div className="p-4">
          <div className="flex gap-2 text-lg text-[#d0d2d6]">
            <h2>#{order._id}</h2>
            <span>{order.date}</span>
          </div>
          <div className="flex flex-wrap">
            <div className="w-[50%]">
              <div className="pr-3 text-[#d0d2d6] text-lg">
                <div className="flex flex-col gap-1">
                  <h2 className="pb-2 font-semibold">
                    Замовник: {order.shippingInfo?.name}, {order.shippingInfo?.phone}
                  </h2>
                  {recipientText(order.shippingInfo) && (
                    <p className="font-semibold">Отримувач: {recipientText(order.shippingInfo)}</p>
                  )}
                  <p>
                    <span className="text-sm">
                      Адреса: {formatAddress(order.shippingInfo)}
                    </span>
                  </p>
                </div>
                <div className="flex justify-start items-center gap-3">
                  <h2>Статус оплати: </h2>
                  <span className="text-base">{payLabel(order.payment_status)}</span>
                </div>
                <p className="text-sm">
                  Доставка:{" "}
                  {{
                    nova_poshta_warehouse: "Нова пошта — у відділення",
                    nova_poshta_courier: "Нова пошта — кур'єр",
                    ukrposhta: "Укрпошта",
                    pickup: "Самовивіз",
                  }[order.shippingInfo?.deliveryType] || "—"}{" "}
                  (оплачує покупець при отриманні)
                </p>
                {order.order_discount?.amount > 0 && (
                  <p className="text-sm">
                    Знижка за сумою: −{order.order_discount.percent}% (−₴
                    {order.order_discount.amount})
                  </p>
                )}
                {order.invoice?.number && (
                  <div className="mt-2 p-3 bg-[#5b51cc] rounded-md text-sm flex flex-col gap-1">
                    <div className="font-semibold">
                      Рахунок {order.invoice.number} ·{" "}
                      {{
                        awaiting: "очікує надсилання",
                        sent: "надіслано, очікує оплату",
                        paid: "оплачено",
                        expired: "строк минув — замовлення скасовано",
                        cancelled: "скасовано (обрано інший спосіб оплати)",
                      }[order.invoice.status] || order.invoice.status}
                    </div>
                    <div>
                      Виставлено: {new Date(order.invoice.issuedAt).toLocaleDateString("uk-UA")} · дійсний до:{" "}
                      {new Date(order.invoice.dueAt).toLocaleDateString("uk-UA")}
                      {order.invoice.sentTo ? ` · надіслано на ${order.invoice.sentTo}` : ""}
                    </div>
                    {order.invoice.sendError && order.invoice.status !== "paid" && (
                      <div className="text-yellow-200">{order.invoice.sendError}</div>
                    )}
                    <div className="flex gap-2 flex-wrap pt-1">
                      <button onClick={downloadInvoice} className="px-3 py-1 rounded-md bg-[#475569]">PDF</button>
                      {order.payment_status !== "paid" && (
                        <button onClick={confirmPayment} className="px-3 py-1 rounded-md bg-green-600 text-white">
                          Підтвердити оплату
                        </button>
                      )}
                      {order.payment_status !== "paid" && order.delivery_status !== "cancelled" && order.invoice.status !== "cancelled" && (
                        <>
                          <button onClick={() => resendInvoice(false)} className="px-3 py-1 rounded-md bg-[#475569]">
                            Надіслати повторно
                          </button>
                          <button onClick={() => resendInvoice(true)} className="px-3 py-1 rounded-md bg-[#475569]">
                            Продовжити строк і надіслати
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
                {order.coupon?.amount > 0 && (
                  <p className="text-sm">
                    Купон {order.coupon.code}: −₴{order.coupon.amount} (за рахунок магазину)
                  </p>
                )}
                {order.buyer?.kind === "company" ? (
                  <p className="text-sm">
                    Юрособа: {order.buyer.companyName}, ЄДРПОУ {order.buyer.edrpou}
                    {order.buyer.ipn ? `, ІПН ${order.buyer.ipn}` : ""}
                  </p>
                ) : (
                  <p className="text-sm">Покупець: фізична особа</p>
                )}
                {order.refunded_total > 0 && (
                  <p className="text-sm">Повернено покупцю: ₴{order.refunded_total}</p>
                )}
                <div className="flex items-center gap-2 text-sm flex-wrap">
                  <span>Повернення для цього замовлення:</span>
                  <select
                    value={override}
                    onChange={changeOverride}
                    className="px-2 py-1 bg-[#475569] border border-slate-700 rounded-md text-[#d0d2d6]"
                  >
                    <option value="default">за загальними умовами</option>
                    <option value="allow">дозволити (без обмежень строку)</option>
                    <option value="deny">заборонити</option>
                  </select>
                  <Link className="underline" to={`/admin/dashboard/returns?order=${orderId}`}>
                    заявки
                  </Link>
                </div>
                {order.has_preorder && (
                  <p className="text-sm text-orange-300">
                    Містить передзамовлення (товар очікується)
                  </p>
                )}
                <span>Ціна: ₴{order.price}</span>

                <div className="mt-4 flex flex-col gap-4 bg-[#8288ed] rounded-md">
                  <div className="text-[#d0d2d6]">
                    {order.products &&
                      order.products.map((p, i) => (
                        <div key={p._id} className="flex gap-3 text-md">
                          <img
                            className="w-[50px] h-[50px]"
                            src={p.images[0]}
                            alt=""
                          />
                          <div className="">
                            <h2>Назва: {p.name}</h2>
                            <p>
                              <span>Бренд: </span>
                              <span>{p.brand} </span>
                            </p>
                            <p>
                              <span className="text-lg">
                                Кількість: {p.quantity} шт.
                              </span>
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="w-[50%]">
              <div className="pl-3 ">
                <div className="mt-4 flex flex-col bg-[#8288ed] rounded-md p-4">
                  {order?.suborder?.map((so, i) => (
                    <div key={so._id} className="text-[#d0d2d6] mt-2">
                      <div className="flex justify-start items-center gap-3">
                        <h2>Продавець {i + 1}. Статус доставки замовлення: </h2>
                        <span>{deliveryLabel(so.delivery_status)}</span>
                      </div>
                      {typeof so.commission === "number" && (
                        <p className="text-sm">
                          Сума: ₴{so.price} · комісія магазину: ₴{so.commission} · до
                          виплати продавцю: ₴{so.payout}
                        </p>
                      )}

                      {so.products?.map((p, i) => (
                        <div className="flex gap-3 text-md ">
                          <img
                            className="w-[50px] h-[50px]"
                            src={p.images[0]}
                            alt=""
                          />
                          <div className="">
                            <h2>Назва: {p.name}</h2>
                            <p>
                              <span>Бренд: </span>
                              <span>{p.brand} </span>
                            </p>
                            <p>
                              <span className="text-lg">
                                Кількість: {p.quantity}
                              </span>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
