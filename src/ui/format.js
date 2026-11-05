// Форматери (uk-UA). Усі безпечні до null/undefined/NaN → "—".
const DASH = "—";

const cache = new Map();
function nf(key, opts) {
  if (!cache.has(key)) cache.set(key, new Intl.NumberFormat("uk-UA", opts));
  return cache.get(key);
}

function num(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * Гроші в гривнях: formatMoney(12345) → "12 345 ₴"; compact → "12,3 тис. ₴".
 * @param {number} value
 * @param {{compact?: boolean, digits?: number, currency?: string}} [o]
 */
export function formatMoney(value, o = {}) {
  const n = num(value);
  if (n === null) return DASH;
  const { compact = false, currency = "UAH" } = o;
  const digits = o.digits ?? (compact ? 1 : Number.isInteger(n) ? 0 : 2);
  const opts = {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: compact ? 0 : digits,
    maximumFractionDigits: digits,
    ...(compact && Math.abs(n) >= 10000 ? { notation: "compact" } : {}),
  };
  return nf(`m|${JSON.stringify(opts)}`, opts).format(n);
}

/** Ціле число з пробілами: 12345 → "12 345"; compact → "12 тис." */
export function formatInt(value, o = {}) {
  const n = num(value);
  if (n === null) return DASH;
  const compact = o.compact && Math.abs(n) >= 10000;
  const opts = compact
    ? { notation: "compact", maximumFractionDigits: 1 }
    : { maximumFractionDigits: 0 };
  return nf(`i|${compact}`, opts).format(compact ? n : Math.round(n));
}

/** Число з дробовою частиною (рейтинг тощо): formatNumber(4.567, 1) → "4,6" */
export function formatNumber(value, digits = 1) {
  const n = num(value);
  if (n === null) return DASH;
  return nf(`n|${digits}`, { minimumFractionDigits: 0, maximumFractionDigits: digits }).format(n);
}

/**
 * Відсоток. За замовчуванням value — уже у відсотках (12.5 → "12,5 %").
 * Для частки 0..1 передайте { ratio: true } (0.125 → "12,5 %").
 */
export function formatPct(value, o = {}) {
  const n = num(value);
  if (n === null) return DASH;
  const { digits = 1, ratio = false } = o;
  const pct = ratio ? n * 100 : n;
  return `${nf(`p|${digits}`, { minimumFractionDigits: 0, maximumFractionDigits: digits }).format(pct)} %`;
}

/**
 * Зміна у відсотках зі знаком: 12.5 → "+12,5 %", -3 → "−3 %", 0 → "0 %", null → "—".
 * { ratio: true } — якщо передано частку (0.125).
 */
export function formatDelta(value, o = {}) {
  const n = num(value);
  if (n === null) return DASH;
  const { digits = 1, ratio = false } = o;
  const pct = ratio ? n * 100 : n;
  const abs = nf(`p|${digits}`, { minimumFractionDigits: 0, maximumFractionDigits: digits }).format(Math.abs(pct));
  if (Math.abs(pct) < 10 ** -digits / 2) return "0 %";
  return `${pct > 0 ? "+" : "−"}${abs} %`;
}

const dfCache = new Map();
function df(key, opts) {
  if (!dfCache.has(key)) dfCache.set(key, new Intl.DateTimeFormat("uk-UA", { timeZone: "Europe/Kyiv", ...opts }));
  return dfCache.get(key);
}

/** Розбір дати: Date | ISO | 'YYYY-MM-DD' (як локальна дата Києва, опівдні — без зсуву доби). */
export function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const d = new Date(`${value}T12:00:00Z`);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Дата uk-UA (Europe/Kyiv).
 * formatDate(d) → "04.11.2026"; { short: true } → "4 лист."; { withTime: true } → "04.11.2026, 14:05";
 * { month: true } → "листопад 2026 р."
 */
export function formatDate(value, o = {}) {
  const d = toDate(value);
  if (!d) return DASH;
  if (o.month) return df("month", { month: "long", year: "numeric" }).format(d);
  if (o.short) return df("short", { day: "numeric", month: "short" }).format(d);
  if (o.withTime)
    return df("dt", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(d);
  return df("d", { day: "2-digit", month: "2-digit", year: "numeric" }).format(d);
}

/** Універсальне форматування за ключем: 'money'|'int'|'pct'|'ratio'|'number'|'raw'|function */
export function formatBy(format, value, o = {}) {
  if (typeof format === "function") return format(value);
  switch (format) {
    case "money":
      return formatMoney(value, o);
    case "int":
      return formatInt(value, o);
    case "pct":
      return formatPct(value, o);
    case "ratio":
      return formatPct(value, { ...o, ratio: true });
    case "number":
      return formatNumber(value, o.digits ?? 1);
    default:
      return value === null || value === undefined || value === "" ? DASH : String(value);
  }
}
