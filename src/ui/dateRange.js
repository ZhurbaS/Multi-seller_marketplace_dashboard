// Періоди для аналітики. Дати — рядки 'YYYY-MM-DD' у часовому поясі Europe/Kyiv.

export const DATE_PRESETS = [
  { value: "today", label: "Сьогодні" },
  { value: "7d", label: "7 днів" },
  { value: "30d", label: "30 днів" },
  { value: "90d", label: "90 днів" },
  { value: "month", label: "Цей місяць" },
  { value: "year", label: "Рік" },
  { value: "custom", label: "Довільний" },
];

export const COMPARE_OPTIONS = [
  { value: "prev", label: "Попередній період" },
  { value: "yoy", label: "Рік тому" },
  { value: "none", label: "Без порівняння" },
];

/** Сьогодні в Києві як 'YYYY-MM-DD'. */
export function kyivToday(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Kyiv", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

function parse(s) {
  const [y, m, d] = String(s).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}
function fmt(d) {
  return d.toISOString().slice(0, 10);
}

export function addDays(ymd, n) {
  const d = parse(ymd);
  d.setUTCDate(d.getUTCDate() + n);
  return fmt(d);
}

export function isYmd(s) {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(parse(s).getTime());
}

/** Кількість днів у періоді включно. */
export function daysBetween(from, to) {
  return Math.round((parse(to) - parse(from)) / 86400000) + 1;
}

/**
 * Межі пресету: resolvePreset('30d') → { from, to } (to = сьогодні, включно).
 * 'year' — останні 365 днів; 'month' — з 1-го числа поточного місяця.
 */
export function resolvePreset(preset, today = kyivToday()) {
  switch (preset) {
    case "today":
      return { from: today, to: today };
    case "7d":
      return { from: addDays(today, -6), to: today };
    case "90d":
      return { from: addDays(today, -89), to: today };
    case "month":
      return { from: `${today.slice(0, 7)}-01`, to: today };
    case "year":
      return { from: addDays(today, -364), to: today };
    case "30d":
    default:
      return { from: addDays(today, -29), to: today };
  }
}

/** Визначає пресет за датами (або 'custom'). */
export function detectPreset(from, to, today = kyivToday()) {
  for (const p of DATE_PRESETS) {
    if (p.value === "custom") continue;
    const r = resolvePreset(p.value, today);
    if (r.from === from && r.to === to) return p.value;
  }
  return "custom";
}

/** Значення за замовчуванням: 30 днів, порівняння з попереднім періодом. */
export function defaultRange(today = kyivToday()) {
  return { ...resolvePreset("30d", today), compare: "prev", preset: "30d" };
}

/** Діапазон порівняння (для підписів): prev — такий самий відрізок перед from; yoy — рік тому. */
export function compareRange({ from, to, compare }) {
  if (!isYmd(from) || !isYmd(to) || compare === "none") return null;
  if (compare === "yoy") {
    const shift = (s) => `${Number(s.slice(0, 4)) - 1}${s.slice(4)}`;
    return { from: shift(from), to: shift(to) };
  }
  const len = daysBetween(from, to);
  return { from: addDays(from, -len), to: addDays(from, -1) };
}

/** Читання/запис періоду в URLSearchParams (from, to, compare). */
export function rangeFromSearch(params, fallback = defaultRange()) {
  const from = params.get("from");
  const to = params.get("to");
  const compare = params.get("compare");
  if (isYmd(from) && isYmd(to) && from <= to) {
    return { from, to, compare: ["prev", "yoy", "none"].includes(compare) ? compare : "prev", preset: detectPreset(from, to) };
  }
  return fallback;
}

export function rangeToSearch(range, params = new URLSearchParams()) {
  const p = new URLSearchParams(params);
  p.set("from", range.from);
  p.set("to", range.to);
  p.set("compare", range.compare || "prev");
  return p;
}
