import { formatBy } from "../format";

export const DOW_LABELS = { 1: "Пн", 2: "Вт", 3: "Ср", 4: "Чт", 5: "Пт", 6: "Сб", 7: "Нд" };

/** Чи є що малювати: ≥ minPoints скінченних чисел і хоча б одне ≠ 0. */
export function hasData(values, minPoints = 1) {
  if (!Array.isArray(values)) return false;
  const nums = values.map(Number).filter((n) => Number.isFinite(n));
  return nums.length >= minPoints && nums.some((n) => n !== 0);
}

/** Форматер для осей/тултіпів: 'money'|'int'|'pct'|'ratio'|'number'|fn. compact — для осей. */
export function makeFormatter(format, compact = false) {
  return (v) => {
    if (v === null || v === undefined || Number.isNaN(v)) return "—";
    if (!format || format === "raw") return typeof v === "number" ? formatBy("int", v, { compact }) : String(v);
    return formatBy(format, v, { compact });
  };
}

/** Короткий текстовий опис ряду для скрінрідерів. */
export function describeSeries(series, format) {
  return (series || [])
    .map((s) => {
      const f = makeFormatter(s.format || (s.axis === "right" ? "int" : format));
      const nums = (s.data || []).map(Number).filter(Number.isFinite);
      if (!nums.length) return `${s.name}: немає даних`;
      const sum = nums.reduce((a, b) => a + b, 0);
      return `${s.name}: всього ${f(sum)}, максимум ${f(Math.max(...nums))}, мінімум ${f(Math.min(...nums))}`;
    })
    .join("; ");
}
