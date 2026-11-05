import { validateRules } from "../saleRules";

export const NAME_MAX = 200;
export const BRAND_MAX = 80;
export const DESCRIPTION_MAX = 5000;
export const DESCRIPTION_GOOD = 300;
export const SPEC_KEY_MAX = 60;
export const SPEC_VALUE_MAX = 200;

export const emptyProductState = {
  name: "",
  description: "",
  discount: "",
  price: "",
  brand: "",
  stock: "",
};

const isInt = (v) => /^\d+$/.test(String(v).trim());

/**
 * Інлайн-валідація форми товару (ті самі обов'язкові поля, що перевіряє бекенд).
 * Повертає { field: "помилка" }; ключі правил продажу — з validateRules.
 */
export function validateProduct({ state, category, rules, specifications, imagesCount, requireImages }) {
  const e = {};
  if (!state.name.trim()) e.name = "Вкажіть назву товару";
  else if (state.name.trim().length < 3) e.name = "Щонайменше 3 символи";
  else if (state.name.length > NAME_MAX) e.name = `Не більше ${NAME_MAX} символів`;

  if (!state.brand.trim()) e.brand = "Вкажіть бренд (або «Без бренду»)";
  else if (state.brand.length > BRAND_MAX) e.brand = `Не більше ${BRAND_MAX} символів`;

  if (!category) e.category = "Оберіть категорію";

  if (String(state.price).trim() === "") e.price = "Вкажіть ціну";
  else if (!isInt(state.price) || Number(state.price) <= 0) e.price = "Ціле число гривень, більше 0";

  if (String(state.discount).trim() === "") e.discount = "Вкажіть знижку (0 — без знижки)";
  else if (!isInt(state.discount) || Number(state.discount) > 100) e.discount = "Ціле число від 0 до 100";

  if (String(state.stock).trim() === "") e.stock = "Вкажіть кількість (0 — немає в наявності)";
  else if (!isInt(state.stock)) e.stock = "Ціле невід'ємне число";

  if (!state.description.trim()) e.description = "Додайте опис товару";
  else if (state.description.length > DESCRIPTION_MAX) e.description = `Не більше ${DESCRIPTION_MAX} символів`;

  (specifications || []).forEach((s, i) => {
    const k = s.key.trim();
    const v = s.value.trim();
    if (k && !v) e[`spec${i}value`] = "Вкажіть значення";
    if (!k && v) e[`spec${i}key`] = "Вкажіть назву";
  });

  if (requireImages && imagesCount === 0) e.images = "Додайте хоча б одне фото товару";

  return { ...e, ...validateRules(rules) };
}

/** Перший елемент з помилкою отримує фокус. */
export function focusFirstError(errors, formEl) {
  const keys = Object.keys(errors);
  if (!keys.length || !formEl) return;
  const el = formEl.querySelector('[aria-invalid="true"]');
  if (el && typeof el.focus === "function") {
    el.focus({ preventScroll: false });
    el.scrollIntoView?.({ block: "center", behavior: "smooth" });
  }
}
