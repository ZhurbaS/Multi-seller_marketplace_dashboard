// Спільні константи й утиліти розділу «Маркетинг» (контракт — MARKETING_SPEC.md §1–§3, §7)
import api from "../../../api/api";

export const CRM = "/admin/crm";
export const BASE = "/admin/dashboard";

// Класи для нативних полів/кнопок (токени UI-кіта; висота 44px). Для нового коду — Input/Button з "../../../ui".
export const inputCls =
  "h-11 px-3 w-full min-w-0 rounded-(--r-md) border border-(--line) bg-(--surface) text-(--ink) placeholder:text-(--ink-2)/80 hover:border-(--line-strong) focus:border-(--brand) focus:outline-none focus:ring-2 focus:ring-(--brand)/25 disabled:cursor-not-allowed disabled:bg-(--surface-2) disabled:opacity-80";
const BTN = "inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-55";
export const btn = {
  primary: `${BTN} h-11 px-4 rounded-(--r-md) bg-(--brand) text-(--on-brand) hover:bg-(--brand-hover)`,
  success: `${BTN} h-11 px-4 rounded-(--r-md) bg-(--brand) text-(--on-brand) hover:bg-(--brand-hover)`,
  ghost: `${BTN} h-11 px-3 rounded-(--r-md) border border-(--line-strong)/60 bg-(--surface) text-(--ink) hover:bg-(--surface-2)`,
  danger: `${BTN} h-11 px-4 rounded-(--r-md) bg-(--danger) text-(--on-danger) hover:brightness-95`,
  small: `${BTN} h-9 px-3 text-sm rounded-(--r-sm) border border-(--line) bg-(--surface) text-(--ink) hover:bg-(--surface-2)`,
};

// ---- Статуси (бейджі з текстом, не лише колір) ----
export const EMAIL_STATUS = {
  none: { label: "Без згоди", tone: "neutral", cls: "bg-(--surface-2) text-(--ink-2)", hint: "Лише облік у CRM, маркетинг заборонено" },
  pending: { label: "Очікує підтвердження", tone: "warning", cls: "bg-(--warning-soft) text-(--warning-ink)", hint: "Double opt-in: лист підтвердження надіслано" },
  subscribed: { label: "Підписаний", tone: "success", cls: "bg-(--success-soft) text-(--success)", hint: "Можна надсилати маркетинг (з урахуванням тем)" },
  unsubscribed: { label: "Відписаний", tone: "neutral", cls: "bg-(--surface-2) text-(--ink-2)", hint: "Маркетинг не надсилається" },
  bounced: { label: "Недоставка (bounce)", tone: "danger", cls: "bg-(--danger-soft) text-(--danger)", hint: "Адреса не приймає листи" },
  complained: { label: "Скарга на спам", tone: "danger", cls: "bg-(--danger-soft) text-(--danger)", hint: "Ніколи не надсилати маркетинг" },
  cleaned: { label: "Очищено", tone: "neutral", cls: "bg-(--surface-2) text-(--ink-2)", hint: "Не підтвердив підписку за 30 днів" },
};
export const TG_STATUS = {
  none: { label: "Немає", tone: "neutral", cls: "bg-(--surface-2) text-(--ink-2)" },
  subscribed: { label: "Підписаний", tone: "brand", cls: "bg-(--brand-soft) text-(--brand-ink)" },
  unsubscribed: { label: "Відписаний", tone: "neutral", cls: "bg-(--surface-2) text-(--ink-2)" },
  blocked: { label: "Заблокував бота", tone: "danger", cls: "bg-(--danger-soft) text-(--danger)" },
};
export const CAMPAIGN_STATUS = {
  draft: { label: "Чернетка", tone: "neutral", cls: "bg-(--surface-2) text-(--ink-2)", dot: "✎" },
  scheduled: { label: "Заплановано", tone: "brand", cls: "bg-(--brand-soft) text-(--brand-ink)", dot: "⏱" },
  sending: { label: "Надсилається", tone: "warning", cls: "bg-(--warning-soft) text-(--warning-ink)", dot: "↻" },
  sent: { label: "Надіслано", tone: "success", cls: "bg-(--success-soft) text-(--success)", dot: "✓" },
  cancelled: { label: "Скасовано", tone: "neutral", cls: "bg-(--surface-2) text-(--ink-2)", dot: "✕" },
  failed: { label: "Помилка", tone: "danger", cls: "bg-(--danger-soft) text-(--danger)", dot: "!" },
};
export const MSG_STATUS = {
  queued: "У черзі",
  sent: "Надіслано",
  failed: "Помилка",
  skipped: "Пропущено",
};

export const TOPICS = { promo: "Акції та знижки", news: "Новинки", restock: "Надходження товарів", tips: "Поради й огляди" };
export const CAMPAIGN_TOPICS = { promo: "Акції та знижки", news: "Новинки", tips: "Поради й огляди" };
export const KINDS = { person: "Фізособа", company: "Юрособа", unknown: "Невідомо" };
export const SOURCES = {
  footer: "Форма у футері",
  checkout: "Оформлення замовлення",
  register: "Реєстрація",
  google: "Вхід через Google",
  import: "Імпорт CSV",
  admin: "Додано вручну",
  telegram: "Telegram-бот",
  customer: "Покупець",
  legacy_customer: "Перенесено з акаунтів",
};
export const RFM = {
  champions: "Чемпіони",
  loyal: "Лояльні",
  new: "Нові",
  promising: "Перспективні",
  at_risk: "Під ризиком",
  hibernating: "Сплячі",
  lost: "Втрачені",
};
export const SKIP_REASONS = {
  not_subscribed: { label: "Не підписані", hint: "Немає активної згоди на маркетинг у цьому каналі" },
  topic_off: { label: "Вимкнена тема", hint: "Підписані, але відмовились від цієї теми розсилки" },
  suppressed: { label: "У стоп-списку", hint: "Bounce, скарга на спам або відписка — надсилати заборонено" },
  frequency_cap: { label: "Ліміт частоти", hint: "Уже отримали максимум маркетингових повідомлень за період" },
  no_address: { label: "Немає адреси", hint: "Немає email або Telegram для обраних каналів" },
  outside_window: { label: "Поза вікном відправки", hint: "Буде надіслано у наступне вікно" },
  daily_limit: { label: "Денний ліміт", hint: "Перенесено на наступний день через денний ліміт" },
};
export const CONSENT_ACTIONS = {
  opt_in_request: "Запит підписки (лист підтвердження)",
  opt_in_confirm: "Підтвердив підписку",
  opt_in_explicit: "Явна згода (галочка)",
  opt_out: "Відписався",
  topic_change: "Змінив теми",
  import: "Імпорт",
  admin_set: "Змінено адміністратором",
  bounce: "Недоставка (bounce)",
  complaint: "Скарга на спам",
  telegram_start: "Підписався у Telegram",
  telegram_stop: "Зупинив Telegram-бота",
  erasure_request: "Запит на видалення даних",
};

// ---- Форматування ----
const nf = new Intl.NumberFormat("uk-UA");
export const num = (v) => (v == null || Number.isNaN(Number(v)) ? "—" : nf.format(Number(v)));
export const money = (v) => (v == null ? "—" : `${nf.format(Math.round(Number(v) || 0))} ₴`);
export const pct = (a, b) => (b ? `${((100 * (Number(a) || 0)) / b).toFixed(1).replace(".", ",")}%` : "—");
// rate — частка 0..1
export const rate = (v) => (v == null ? "—" : `${(Number(v) * 100).toFixed(2).replace(".", ",")}%`);
export const fmtDate = (d) => {
  if (!d) return "—";
  const x = new Date(d);
  return Number.isNaN(x.getTime()) ? "—" : x.toLocaleDateString("uk-UA");
};
export const fmtDateTime = (d) => {
  if (!d) return "—";
  const x = new Date(d);
  return Number.isNaN(x.getTime())
    ? "—"
    : x.toLocaleString("uk-UA", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
};
export const toLocalInput = (d) => {
  if (!d) return "";
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return "";
  const p = (n) => String(n).padStart(2, "0");
  return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}T${p(x.getHours())}:${p(x.getMinutes())}`;
};

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const PHONE_RE = /^\+?[0-9 ()-]{9,20}$/;
export const URL_RE = /^https?:\/\/\S+$/i;

// ---- Відповіді API ----
// Бекенд пишеться паралельно — приймаємо і {key:[...]}, і голий масив/об'єкт
export const pick = (data, key) => (data && typeof data === "object" && key in data ? data[key] : data);
export const listOf = (data, key) => {
  const v = pick(data, key);
  return Array.isArray(v) ? v : [];
};

export const errMsg = (err, fallback = "Сталася помилка") => {
  const r = err?.response;
  if (!r) return err?.code === "ERR_CANCELED" ? "" : "Немає з'єднання із сервером. Перевірте мережу й спробуйте ще раз.";
  const m = r.data && typeof r.data === "object" ? r.data.error || r.data.message : null;
  if (m) return m;
  if (r.status === 404) return "Цей розділ ще не підключено на сервері (404). Оновіть сторінку пізніше.";
  if (r.status === 401 || r.status === 403) return "Немає доступу. Увійдіть як адміністратор.";
  if (r.status === 413) return "Файл завеликий.";
  if (r.status === 429) return "Забагато запитів. Зачекайте хвилину.";
  if (r.status >= 500) return "Помилка сервера. Спробуйте пізніше.";
  return fallback;
};
export const isMissing = (err) => err?.response?.status === 404 || err?.response?.status === 501;

// Помилка з blob-відповіді (експорт)
const blobError = async (err) => {
  const d = err?.response?.data;
  if (d instanceof Blob) {
    try {
      const j = JSON.parse(await d.text());
      return j.error || j.message;
    } catch {
      return null;
    }
  }
  return null;
};

export const saveBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

// Завантаження файлу з автентифікацією (cookie/Bearer через api-інстанс)
export const downloadFile = async (path, params, filename) => {
  try {
    const { data } = await api.get(path, { params, responseType: "blob" });
    saveBlob(data instanceof Blob ? data : new Blob([data], { type: "text/csv;charset=utf-8" }), filename);
    return null;
  } catch (err) {
    return (await blobError(err)) || errMsg(err, "Не вдалося завантажити файл");
  }
};

export const csvEscape = (v) => {
  const s = v == null ? "" : String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
export const toCsv = (rows) => "﻿" + rows.map((r) => r.map(csvEscape).join(",")).join("\n");

// Очищення параметрів запиту від порожніх значень
export const cleanParams = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== "" && v != null));

export const contactName = (c) => c?.name || c?.email || c?.phone || "Без імені";
export const isSystemSegment = (s) => Boolean(s?.system || s?.isSystem || s?.readOnly || s?.builtin);
