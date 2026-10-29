import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  get_commission,
  update_commission,
  messageClear,
} from "../../store/Reducers/settingsSlice";
import { get_category } from "../../store/Reducers/categorySlice";

const inputCls =
  "px-3 py-2 focus:border-indigo-600 outline-none bg-[#6a5fdf] border border-slate-700 rounded-md text-[#d0d2d6] w-full";

// Комісія магазину і правила виплат продавцям.
// Комісія береться з ціни товару на сайті (покупець бачить одну ціну).
// Порядок: індивідуальна ставка продавця (0% — власний магазин) → ставка категорії → типова.
const Commission = () => {
  const dispatch = useDispatch();
  const { commission, loader, successMessage, errorMessage } = useSelector(
    (state) => state.settings
  );
  const { categories } = useSelector((state) => state.category);

  const [defaultPercent, setDefaultPercent] = useState("10");
  const [holdDays, setHoldDays] = useState("14");
  const [rates, setRates] = useState({}); // categoryId -> "7"

  useEffect(() => {
    dispatch(get_commission());
    dispatch(get_category({ perPage: 1000, page: 1, searchValue: "" }));
  }, [dispatch]);

  useEffect(() => {
    if (!commission) return;
    setDefaultPercent(String(commission.defaultCommissionPercent));
    setHoldDays(String(commission.payoutHoldDays));
    const r = {};
    for (const c of commission.categoryCommissions || []) {
      r[String(c.categoryId)] = String(c.percent);
    }
    setRates(r);
  }, [commission]);

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

  const save = (e) => {
    e.preventDefault();
    dispatch(
      update_commission({
        defaultCommissionPercent: defaultPercent,
        payoutHoldDays: holdDays,
        categoryCommissions: Object.entries(rates)
          .filter(([, p]) => p !== "")
          .map(([categoryId, percent]) => ({ categoryId, percent })),
      })
    );
  };

  return (
    <div className="px-2 lg:px-7 pt-5">
      <div className="w-full p-4 bg-[#6a5fdf] rounded-md text-[#d0d2d6]">
        <h1 className="text-xl font-semibold pb-2">Комісії і виплати</h1>
        <p className="text-sm opacity-80 pb-4">
          Комісія — відсоток від суми товарів продавця, який лишається магазину.
          Покупець бачить одну ціну. Для власних товарів задайте продавцю 0% у
          розділі «Продавці». Зміна ставки діє лише для нових замовлень.
        </p>

        <form onSubmit={save} className="flex flex-col gap-4 max-w-[640px]">
          <div className="flex gap-3 items-center">
            <label className="text-sm w-[260px]">Типова комісія, %</label>
            <input
              className={inputCls}
              type="number"
              min="0"
              max="50"
              step="0.5"
              value={defaultPercent}
              onChange={(e) => setDefaultPercent(e.target.value)}
              required
            />
          </div>
          <div className="flex gap-3 items-center">
            <label className="text-sm w-[260px]">
              Утримання виплат після доставки, днів
            </label>
            <input
              className={inputCls}
              type="number"
              min="0"
              max="90"
              step="1"
              value={holdDays}
              onChange={(e) => setHoldDays(e.target.value)}
              required
            />
          </div>
          <p className="text-xs opacity-70 -mt-2">
            Кошти продавця стають доступними для виведення через цю кількість
            днів після статусу «Доставлено» (термін повернення товару покупцем).
            0 — одразу після доставки.
          </p>

          <div>
            <h2 className="text-base font-semibold pb-2">Комісія за категоріями</h2>
            <p className="text-xs opacity-70 pb-2">
              Порожньо — діє типова комісія.
            </p>
            <div className="flex flex-col gap-2">
              {(categories || []).map((c) => (
                <div key={c._id} className="flex gap-3 items-center">
                  <span className="text-sm w-[260px] truncate">{c.name}</span>
                  <input
                    className={inputCls}
                    type="number"
                    min="0"
                    max="50"
                    step="0.5"
                    placeholder={`типова (${defaultPercent || 0})`}
                    value={rates[c._id] ?? ""}
                    onChange={(e) =>
                      setRates({ ...rates, [c._id]: e.target.value })
                    }
                  />
                  <span className="text-sm">%</span>
                </div>
              ))}
              {(!categories || categories.length === 0) && (
                <p className="text-sm opacity-70">Категорій ще немає.</p>
              )}
            </div>
          </div>

          <div>
            <button
              disabled={loader}
              className="px-6 py-2 bg-red-500 text-white rounded-sm text-sm disabled:opacity-60"
            >
              {loader ? "Збереження..." : "Зберегти"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Commission;
