// Підписи, пояснення метрик і правила малих вибірок для сторінок аналітики продавця.
import { formatInt, formatPct } from "../../../../ui";

export { deliveryLabel, payLabel } from "../../../../utils/statusLabels";
export { RETURN_REASON } from "../../../../utils/returnLabels";

/** Мінімальний знаменник для показу частки (як MIN_DENOM на бекенді). */
export const MIN_DENOM = 30;

export const EMPTY_ORDERS_TEXT = "Даних поки мало — з'являться після перших замовлень.";

export const PAYMENT_METHOD = {
  cod: "Оплата при отриманні",
  monobank: "Картка (monobank)",
  liqpay: "Картка (LiqPay)",
  invoice: "За рахунком",
  mock: "Тестова оплата",
  unknown: "Не вказано",
};
export const paymentMethodLabel = (m) => PAYMENT_METHOD[m] || m || PAYMENT_METHOD.unknown;

export const DELIVERY_TONE = {
  pending: "warning",
  placed: "brand",
  processing: "brand",
  packing: "brand",
  shipped: "brand",
  delivered: "success",
  cancelled: "danger",
};

export const SEVERITY = {
  critical: { tone: "danger", label: "Терміново" },
  warning: { tone: "warning", label: "Увага" },
  success: { tone: "success", label: "Добре" },
  info: { tone: "brand", label: "Порада" },
};

export const ABC_TONE = { A: "success", B: "brand", C: "neutral", "-": "neutral" };
export const ABC_HINT = {
  A: "Клас A — товари, що дають ~80 % виручки за період",
  B: "Клас B — наступні ~15 % виручки",
  C: "Клас C — решта ~5 % виручки",
  "-": "Без продажів за період",
};

export const SOURCE_LABEL = { direct: "Прямі заходи / без реферера", other: "Інші джерела" };
export const sourceLabel = (s) => SOURCE_LABEL[s] || s || "—";

// Пояснення «що це за метрика»
export const INFO = {
  revenue: "Сума ваших товарів у зарахованих замовленнях (оплачені або доставлені, без скасованих) за датою оформлення. Знижки купонів фінансує магазин і не зменшують цю суму.",
  orders: "Кількість ваших підзамовлень, зарахованих у виручку (оплачені або доставлені, без скасованих).",
  aov: "Середній чек = виручка ÷ кількість замовлень.",
  payout: "Сума, що належить вам після комісії магазину, за зарахованими замовленнями періоду. Фактичні виплати — у розділі «Платежі».",
  returns: "Частка замовлень, за якими оформлено повернення (крім відхилених і відкликаних заявок).",
  cancel: "Частка скасованих підзамовлень серед усіх оформлених за період.",
  buyers: "Новий — перше замовлення у вашому магазині припало на цей період; повторний — купував у вас раніше.",
  rating: "Середня оцінка схвалених відгуків на ваші товари, залишених за період.",
  units: "Кількість проданих одиниць товару.",
  daysOfCover: "На скільки днів вистачить залишку при середніх продажах за останні 28 днів.",
  avgDaily28: "Середні продажі за день за останні 28 днів (незалежно від обраного періоду).",
  abc: "ABC-аналіз за виручкою періоду: A — ключові товари (~80 % виручки), B — середні, C — решта.",
  xyz: "XYZ — стабільність попиту за 12 тижнів: X — стабільний, Y — коливається, Z — нерегулярний.",
  views: "Перегляди сторінки товару у вітрині (боти не враховуються). Унікальні — різні відвідувачі за добу, без cookie.",
  viewToCart: "Частка переглядів, після яких товар додали в кошик. Показуємо лише при ≥30 переглядах.",
  cartToOrder: "Частка додавань у кошик, що завершились замовленням. Показуємо лише при ≥30 додаваннях.",
  cr: "Конверсія: оплачені/зараховані замовлення ÷ перегляди. Показуємо лише при ≥30 переглядах.",
  quality: "Індекс якості картки 0–100: фото, опис, характеристики, назва, бренд/артикул/гарантія, відгуки.",
  sla: "Час від оформлення до відправки (статус «Відправлено»). Норматив — 48 годин.",
  lateRate: "Частка замовлень, відправлених пізніше 48 год, разом із тими, що досі чекають відправки довше 48 год.",
  p90: "90 % замовлень відправлено швидше за цей час.",
  negativeShare: "Частка відгуків з оцінкою 1–2 ★.",
  repeatRate: "Частка покупців періоду, які зробили у вас ≥2 замовлень (за всю історію до кінця періоду).",
  rfm: "RFM — сегменти за давністю останньої покупки, частотою та сумою покупок.",
  lift: "Зміна кількості проданих одиниць порівняно з періодом порівняння.",
  couponCost: "Частка знижки купонів, що припадає на ваші товари. Її фінансує магазин.",
};

/**
 * Частка з урахуванням малої вибірки: при знаменнику < MIN_DENOM — «N з M» (абсолютні числа),
 * інакше — відсоток. part/total — абсолютні значення.
 */
export function rateText(part, total, { min = MIN_DENOM, digits = 1 } = {}) {
  const t = Number(total) || 0;
  const p = Number(part) || 0;
  if (t <= 0) return "—";
  if (t < min) return `${formatInt(p)} з ${formatInt(t)}`;
  return formatPct(p / t, { ratio: true, digits });
}

/** Чи достатньо даних для відсотка. */
export const enough = (total, min = MIN_DENOM) => (Number(total) || 0) >= min;

/** Години → «18 год» / «2,5 дн.» */
export function hoursText(h) {
  if (h === null || h === undefined || !Number.isFinite(Number(h))) return "—";
  const n = Number(h);
  if (n >= 72) return `${formatPct(n / 24, { digits: 1 }).replace(" %", "")} дн.`;
  return `${formatPct(n, { digits: 1 }).replace(" %", "")} год`;
}

// Підказки «як виправити» для проблем індексу якості (рядки з utiles/sellerAnalytics.qualityScore)
const QUALITY_TIPS = [
  [/^Додайте фото/, "Завантажте щонайменше 5 фото: загальний вигляд, деталі, комплектація, товар у використанні. Світлий фон, без водяних знаків."],
  [/^Розширте опис/, "Опишіть призначення, переваги, сумісність, комплектацію й умови використання — щонайменше 300 символів, абзацами або списком."],
  [/^Заповніть характеристики/, "Додайте щонайменше 3 характеристики у форматі «назва — значення»: модель, розміри, матеріал, потужність тощо."],
  [/^Назва/, "Формула назви: тип товару + бренд + модель + ключова характеристика (≥20 символів), напр. «Навушники Sony WH-1000XM5 бездротові»."],
  [/^Вкажіть бренд/, "Заповніть поле «Бренд» у картці товару — за ним покупці фільтрують каталог."],
  [/^Додайте артикул/, "Додайте характеристику «Артикул» або «Модель» — так товар легше знайти пошуком."],
  [/^Вкажіть гарантію/, "Додайте характеристику «Гарантія», напр. «12 місяців» — це підвищує довіру."],
  [/^Ще немає відгуків/, "Нагадайте покупцям про відгук після доставки, швидко відповідайте на запитання в чаті."],
];
export function qualityTip(issue) {
  const hit = QUALITY_TIPS.find(([re]) => re.test(String(issue || "")));
  return hit ? hit[1] : null;
}

export const qualityTone = (score) => (score >= 80 ? "success" : score >= 60 ? "warning" : "danger");
export const qualityLabel = (score) => (score >= 80 ? "Добре" : score >= 60 ? "Середньо" : "Слабко");

export const INVENTORY_STATUS = {
  out: { label: "Немає", tone: "danger" },
  low: { label: "Закінчується", tone: "warning" },
  dead: { label: "Не продається 90 дн.", tone: "neutral" },
  ok: { label: "Достатньо", tone: "success" },
};

export const editProductLink = (id) => `/seller/dashboard/edit-product/${id}`;

/** Частка з бекенду (null при малій вибірці) → «12,5 %» або «3 з 12» (абсолютні числа). */
export function ratioOrAbs(rate, part, total) {
  if (rate !== null && rate !== undefined && Number.isFinite(Number(rate))) return formatPct(rate, { ratio: true });
  const t = Number(total) || 0;
  if (t <= 0) return "—";
  return `${formatInt(part)} з ${formatInt(t)}`;
}

/** Днів запасу: null — немає продажів (∞), 0 — немає залишку. */
export function coverText(days) {
  if (days === null || days === undefined) return "Без продажів";
  if (Number(days) >= 365) return "> 1 року";
  return `${formatInt(days)} дн.`;
}
