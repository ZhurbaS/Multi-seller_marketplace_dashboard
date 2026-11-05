// Умови продажу товару: значення за замовчуванням, перетворення й валідація (без JSX).

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

// Інлайн-валідація умов продажу. Повертає { field: "текст помилки" } (порожній об'єкт — усе гаразд).
export const validateRules = (r) => {
  const e = {};
  const min = Number(r.minOrderQty);
  const step = Number(r.orderStep);
  if (r.minOrderQty !== "" && (!Number.isInteger(min) || min < 1)) e.minOrderQty = "Ціле число від 1";
  if (r.orderStep !== "" && (!Number.isInteger(step) || step < 1)) e.orderStep = "Ціле число від 1";
  const dMin = r.restockDaysMin === "" ? null : Number(r.restockDaysMin);
  const dMax = r.restockDaysMax === "" ? null : Number(r.restockDaysMax);
  if (dMin !== null && (!(dMin >= 1) || dMin > 365)) e.restockDaysMin = "Від 1 до 365 днів";
  if (dMax !== null && (!(dMax >= 1) || dMax > 365)) e.restockDaysMax = "Від 1 до 365 днів";
  if (dMin !== null && dMax !== null && !e.restockDaysMin && !e.restockDaysMax && dMax < dMin)
    e.restockDaysMax = "Не менше, ніж «від»";
  (r.priceTiers || []).forEach((t, i) => {
    if (t.minQty === "" && t.percent === "") return;
    const q = Number(t.minQty);
    const pc = Number(t.percent);
    if (!(q >= 2)) e[`tier${i}minQty`] = "Від 2 шт";
    if (!(pc >= 1 && pc <= 90)) e[`tier${i}percent`] = "1–90 %";
  });
  return e;
};
