import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { get_commission_info } from "../store/Reducers/settingsSlice";

const round2 = (n) => Math.round(n * 100) / 100;

// Підказка продавцю під полями ціни: «Покупець бачить ₴X, комісія Y%, ви отримаєте ₴Z».
// Ставка: індивідуальна (0 — власний магазин) → категорія → типова — як у бекенді.
const CommissionHint = ({ price, discount, categoryName }) => {
  const dispatch = useDispatch();
  const info = useSelector((state) => state.settings.commissionInfo);
  const { categories } = useSelector((state) => state.category);

  useEffect(() => {
    if (!info) dispatch(get_commission_info());
  }, [dispatch, info]);

  const p = Number(price);
  if (!info || !Number.isFinite(p) || p <= 0) return null;

  const d = Number(discount) || 0;
  const unit = round2(p - (p * d) / 100); // ціна на сайті після знижки товару
  const cat = (categories || []).find((c) => c.name === categoryName);
  const catRate = cat ? info.categoryRates?.[cat._id] : undefined;
  const percent =
    typeof info.sellerPercent === "number"
      ? info.sellerPercent
      : typeof catRate === "number"
      ? catRate
      : info.defaultPercent;
  const commission = round2((unit * percent) / 100);
  const payout = round2(unit - commission);

  return (
    <div className="mb-3 p-3 bg-[#9e97e9] rounded-md text-black text-sm">
      Покупець бачить ₴{unit}. Комісія магазину: {percent}%
      {percent > 0 ? ` (₴${commission})` : " — не нараховується"}. Ви отримаєте{" "}
      <b>₴{payout}</b> за 1 шт.
      {info.payoutHoldDays > 0 && (
        <span className="block text-xs mt-1">
          Виплата доступна через {info.payoutHoldDays} дн. після доставки.
        </span>
      )}
    </div>
  );
};

export default CommissionHint;
