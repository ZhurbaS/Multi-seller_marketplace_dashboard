import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api/api";
import { RETURN_STATUS, RETURN_REASON, fmtDate } from "../../utils/returnLabels";

// Продавець бачить заявки на повернення своїх товарів (лише перегляд) і вплив на свій баланс
const Returns = () => {
  const [list, setList] = useState([]);

  useEffect(() => {
    api
      .get("/seller/returns")
      .then(({ data }) => setList(data.requests))
      .catch((e) => toast.error(e.response?.data?.error || "Не вдалося завантажити повернення"));
  }, []);

  return (
    <div className="px-2 lg:px-7 pt-5">
      <div className="w-full p-4 bg-[#6a5fdf] rounded-md text-[#d0d2d6]">
        <h1 className="text-xl font-semibold pb-2">Повернення</h1>
        <p className="text-sm opacity-80 pb-3">
          Рішення про повернення приймає магазин. Тут видно заявки щодо ваших товарів і суми, списані з вашого балансу
          (повернення товару та, якщо передбачено умовами, зворотна доставка). Подробиці — у розділі «Платежі».
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase border-b border-slate-700">
              <tr>
                <th className="py-2 pr-3">№</th>
                <th className="pr-3">Дата</th>
                <th className="pr-3">Причина</th>
                <th className="pr-3">Товари</th>
                <th className="pr-3">Статус</th>
                <th className="pr-3">Огляд</th>
                <th>Вплив на баланс</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r._id} className="border-b border-slate-700/50 align-top">
                  <td className="py-2 pr-3 font-semibold">
                    {r.number}
                    <div className="text-xs font-normal opacity-70">
                      <Link className="underline" to={`/seller/dashboard/orders`}>замовлення</Link>
                    </div>
                  </td>
                  <td className="pr-3">{fmtDate(r.createdAt)}</td>
                  <td className="pr-3">{RETURN_REASON[r.reason]}</td>
                  <td className="pr-3">
                    {r.items.map((i, k) => (
                      <div key={k}>
                        {i.name} × {i.quantity}
                      </div>
                    ))}
                  </td>
                  <td className="pr-3">{RETURN_STATUS[r.status]}</td>
                  <td className="pr-3 text-xs">
                    {{ ok: "Товар у порядку", damaged: "Пошкоджений", mismatch: "Невідповідність" }[r.inspection?.result] || "—"}
                    {r.inspection?.note ? ` — ${r.inspection.note}` : ""}
                    {r.shippingCost > 0 && <div>Зворотна доставка (за ваш рахунок): ₴{r.shippingCost}</div>}
                    {r.deduction > 0 && <div>Утримано з покупця: ₴{r.deduction}</div>}
                  </td>
                  <td>{r.balanceImpact ? `₴${r.balanceImpact}` : "—"}</td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center opacity-70">Заявок немає</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Returns;
