import React from "react";

// Умови продажу товару: упаковки/комплекти (мін. замовлення і крок), знижки за кількість,
// терміни поставки й передзамовлення. Використовується у формах додавання й редагування.

export const defaultRules = {
  minOrderQty: "1",
  orderStep: "1",
  packLabel: "",
  priceTiers: [],
  restockDaysMin: "",
  restockDaysMax: "",
  allowPreorder: false,
};

export const rulesFromProduct = (p = {}) => ({
  minOrderQty: String(p.minOrderQty || 1),
  orderStep: String(p.orderStep || 1),
  packLabel: p.packLabel || "",
  priceTiers: (p.priceTiers || []).map((t) => ({
    minQty: String(t.minQty),
    percent: String(t.percent),
  })),
  restockDaysMin: p.restockDaysMin ? String(p.restockDaysMin) : "",
  restockDaysMax: p.restockDaysMax ? String(p.restockDaysMax) : "",
  allowPreorder: !!p.allowPreorder,
});

// Для JSON-запиту (редагування)
export const rulesToPayload = (r) => ({
  minOrderQty: r.minOrderQty,
  orderStep: r.orderStep,
  packLabel: r.packLabel,
  priceTiers: r.priceTiers.filter((t) => t.minQty !== "" || t.percent !== ""),
  restockDaysMin: r.restockDaysMin,
  restockDaysMax: r.restockDaysMax,
  allowPreorder: r.allowPreorder,
});

// Для multipart-форми (додавання)
export const appendRulesToFormData = (fd, r) => {
  const p = rulesToPayload(r);
  fd.append("minOrderQty", p.minOrderQty);
  fd.append("orderStep", p.orderStep);
  fd.append("packLabel", p.packLabel);
  fd.append("priceTiers", JSON.stringify(p.priceTiers));
  fd.append("restockDaysMin", p.restockDaysMin);
  fd.append("restockDaysMax", p.restockDaysMax);
  fd.append("allowPreorder", String(p.allowPreorder));
};

const inputCls =
  "px-3 py-2 focus:border-indigo-600 outline-none bg-[#6a5fdf] border border-slate-700 rounded-md text-[#d0d2d6] w-full";

const SaleRulesFields = ({ rules, onChange }) => {
  const set = (patch) => onChange({ ...rules, ...patch });

  const setTier = (i, field, value) => {
    const tiers = rules.priceTiers.map((t, idx) =>
      idx === i ? { ...t, [field]: value } : t
    );
    set({ priceTiers: tiers });
  };

  return (
    <div className="mb-3 p-3 border border-slate-600 rounded-md text-[#d0d2d6] flex flex-col gap-4">
      <h2 className="font-semibold text-lg">Умови продажу</h2>

      <div>
        <p className="text-sm mb-2 opacity-80">
          Ціна й кількість на складі — за 1 шт. Для упаковок і комплектів задайте
          мінімальне замовлення й крок: наприклад, «мін. 100, крок 100» — покупець
          зможе замовити лише 100, 200, 300 шт.
        </p>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex flex-col gap-1 w-full">
            <label>Мінімальне замовлення, шт</label>
            <input
              className={inputCls}
              type="number"
              min="1"
              value={rules.minOrderQty}
              onChange={(e) => set({ minOrderQty: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1 w-full">
            <label>Крок (кратність), шт</label>
            <input
              className={inputCls}
              type="number"
              min="1"
              value={rules.orderStep}
              onChange={(e) => set({ orderStep: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1 w-full">
            <label>Підпис для покупця (необов'язково)</label>
            <input
              className={inputCls}
              type="text"
              maxLength={60}
              placeholder="Упаковка по 100 шт"
              value={rules.packLabel}
              onChange={(e) => set({ packLabel: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="font-semibold">Знижки за кількість</label>
          <button
            type="button"
            onClick={() =>
              set({ priceTiers: [...rules.priceTiers, { minQty: "", percent: "" }] })
            }
            className="px-3 py-1 bg-blue-500 text-white rounded-sm text-sm"
          >
            + Додати поріг
          </button>
        </div>
        {rules.priceTiers.length === 0 && (
          <p className="text-sm opacity-70">
            Без знижок за кількість. Приклад: від 10 шт — 5%, від 50 шт — 10%.
          </p>
        )}
        {rules.priceTiers.map((t, i) => (
          <div key={i} className="flex gap-3 mb-2 items-center">
            <span className="text-sm whitespace-nowrap">від</span>
            <input
              className={inputCls}
              type="number"
              min="2"
              placeholder="шт"
              value={t.minQty}
              onChange={(e) => setTier(i, "minQty", e.target.value)}
            />
            <span className="text-sm whitespace-nowrap">шт — знижка</span>
            <input
              className={inputCls}
              type="number"
              min="1"
              max="90"
              placeholder="%"
              value={t.percent}
              onChange={(e) => setTier(i, "percent", e.target.value)}
            />
            <span className="text-sm">%</span>
            <button
              type="button"
              onClick={() =>
                set({ priceTiers: rules.priceTiers.filter((_, idx) => idx !== i) })
              }
              className="px-3 py-1 bg-red-500 text-white rounded-sm text-sm"
            >
              ✕
            </button>
          </div>
        ))}
        {rules.priceTiers.length > 0 && (
          <p className="text-xs opacity-70">
            Знижка додається до знижки самого товару. Відсоток має зростати разом з кількістю.
          </p>
        )}
      </div>

      <div>
        <label className="font-semibold">Коли товару немає в наявності</label>
        <p className="text-sm mb-2 opacity-80">
          Покупець побачить «Очікується через …» і зможе підписатися на сповіщення.
        </p>
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex flex-col gap-1 w-full">
            <label>Очікуваний термін поставки: від, днів</label>
            <input
              className={inputCls}
              type="number"
              min="1"
              max="365"
              placeholder="20"
              value={rules.restockDaysMin}
              onChange={(e) => set({ restockDaysMin: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1 w-full">
            <label>до, днів</label>
            <input
              className={inputCls}
              type="number"
              min="1"
              max="365"
              placeholder="30"
              value={rules.restockDaysMax}
              onChange={(e) => set({ restockDaysMax: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-2 w-full pb-2">
            <input
              type="checkbox"
              checked={rules.allowPreorder}
              onChange={(e) => set({ allowPreorder: e.target.checked })}
            />
            Приймати передзамовлення, поки товару немає
          </label>
        </div>
      </div>
    </div>
  );
};

export default SaleRulesFields;
