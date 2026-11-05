import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { MdInfoOutline } from "react-icons/md";
import { get_commission_info } from "../store/Reducers/settingsSlice";
import { formatMoney } from "../ui";

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
    typeof info.sellerPercent === "number" ? info.sellerPercent : typeof catRate === "number" ? catRate : info.defaultPercent;
  const commission = round2((unit * percent) / 100);
  const payout = round2(unit - commission);
  const money = (v) => formatMoney(v);

  return (
    <div
      aria-live="polite"
      className="flex min-w-0 items-start gap-3 rounded-(--r-md) border border-(--brand)/25 bg-(--brand-soft) p-3 text-sm text-(--ink)"
    >
      <MdInfoOutline aria-hidden="true" className="mt-0.5 shrink-0 text-lg text-(--brand-ink)" />
      <div className="min-w-0 break-words">
        <p>
          Покупець бачить <b className="tabular-nums">{money(unit)}</b>. Комісія магазину:{" "}
          <span className="tabular-nums">{percent} %</span>
          {percent > 0 ? <span className="tabular-nums"> ({money(commission)})</span> : " — не нараховується"}.
        </p>
        <p className="mt-0.5">
          Ви отримаєте <b className="tabular-nums text-(--success)">{money(payout)}</b> за 1 шт.
        </p>
        {info.payoutHoldDays > 0 && (
          <p className="mt-1 text-xs text-(--ink-2)">Виплата доступна через {info.payoutHoldDays} дн. після доставки.</p>
        )}
      </div>
    </div>
  );
};

export default CommissionHint;
