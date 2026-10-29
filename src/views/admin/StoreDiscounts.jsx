import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  get_discounts,
  get_commission,
  update_discounts,
  messageClear,
} from "../../store/Reducers/settingsSlice";

const inputCls =
  "px-3 py-2 focus:border-indigo-600 outline-none bg-[#6a5fdf] border border-slate-700 rounded-md text-[#d0d2d6] w-full";

// Знижки за сумою замовлення для всього магазину.
// Покупець бачить у кошику: «Додайте ще на ₴X і отримайте знижку Y%».
// Знижку фінансує магазин: продавцям нараховується повна сума їхніх товарів.
const StoreDiscounts = () => {
  const dispatch = useDispatch();
  const { orderDiscountTiers, commission, loader, successMessage, errorMessage } =
    useSelector((state) => state.settings);
  const [tiers, setTiers] = useState([]);

  useEffect(() => {
    dispatch(get_discounts());
    dispatch(get_commission());
  }, [dispatch]);

  // Знижку фінансує магазин із комісії: якщо вона більша за типову комісію, замовлення буде збитковим.
  const defaultCommission = commission?.defaultCommissionPercent;
  const tooHigh =
    typeof defaultCommission === "number" &&
    tiers.some((t) => Number(t.percent) > defaultCommission);

  useEffect(() => {
    setTiers(
      orderDiscountTiers.map((t) => ({
        minTotal: String(t.minTotal),
        percent: String(t.percent),
      }))
    );
  }, [orderDiscountTiers]);

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

  const setTier = (i, field, value) =>
    setTiers(tiers.map((t, idx) => (idx === i ? { ...t, [field]: value } : t)));

  const save = (e) => {
    e.preventDefault();
    dispatch(
      update_discounts(
        tiers.filter((t) => t.minTotal !== "" || t.percent !== "")
      )
    );
  };

  return (
    <div className="px-2 lg:px-7 pt-5">
      <div className="w-full p-4 bg-[#6a5fdf] rounded-md text-[#d0d2d6]">
        <h1 className="text-xl font-semibold pb-2">Знижки за сумою замовлення</h1>
        <p className="text-sm opacity-80 pb-4">
          Діють на весь магазин і застосовуються автоматично до суми товарів
          (без доставки). Знижка фінансується магазином — продавцям нараховується
          повна сума їхніх товарів. Знижки за кількість окремого товару продавець
          задає у картці товару.
        </p>

        <form onSubmit={save} className="flex flex-col gap-3 max-w-[640px]">
          {tiers.length === 0 && (
            <p className="text-sm opacity-70">
              Знижок за сумою немає. Приклад: від ₴5000 — 3%, від ₴10000 — 5%.
            </p>
          )}
          {tiers.map((t, i) => (
            <div key={i} className="flex gap-3 items-center">
              <span className="text-sm whitespace-nowrap">від ₴</span>
              <input
                className={inputCls}
                type="number"
                min="1"
                placeholder="5000"
                value={t.minTotal}
                onChange={(e) => setTier(i, "minTotal", e.target.value)}
              />
              <span className="text-sm whitespace-nowrap">— знижка</span>
              <input
                className={inputCls}
                type="number"
                min="1"
                max="50"
                placeholder="3"
                value={t.percent}
                onChange={(e) => setTier(i, "percent", e.target.value)}
              />
              <span className="text-sm">%</span>
              <button
                type="button"
                onClick={() => setTiers(tiers.filter((_, idx) => idx !== i))}
                className="px-3 py-1 bg-red-500 text-white rounded-sm text-sm"
              >
                ✕
              </button>
            </div>
          ))}
          {tooHigh && (
            <p className="text-sm text-yellow-200">
              Увага: знижка більша за типову комісію ({defaultCommission}%) — на
              замовленнях зі сторонніх продавців магазин піде в мінус.
            </p>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setTiers([...tiers, { minTotal: "", percent: "" }])}
              className="px-4 py-2 bg-blue-500 text-white rounded-sm text-sm"
            >
              + Додати поріг
            </button>
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

export default StoreDiscounts;
