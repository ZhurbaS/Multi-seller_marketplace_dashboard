// Період аналітики: стан у URL query (?from&to&compare), копія в Redux (sellerAnalytics.range),
// щоб переходи по меню «Аналітика» (посилання без query) зберігали обраний період.
import { useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { daysBetween, defaultRange, rangeFromSearch, rangeToSearch, formatDate } from "../../../../ui";
import { setAnalyticsRange } from "../../../../store/Reducers/sellerAnalyticsSlice";

const same = (a, b) => !!a && !!b && a.from === b.from && a.to === b.to && (a.compare || "prev") === (b.compare || "prev");

/**
 * usePeriod() → { range:{from,to,compare,preset}, setRange(next), query:{from,to,compare} }
 * Якщо в URL періоду немає — береться останній обраний (Redux) або 30 днів, і дописується в URL (replace).
 */
export function usePeriod() {
  const [params, setParams] = useSearchParams();
  const dispatch = useDispatch();
  const stored = useSelector((s) => s.sellerAnalytics?.range);
  const fromUrl = rangeFromSearch(params, null);
  const search = params.toString();

  const range = useMemo(() => fromUrl || stored || defaultRange(), [fromUrl?.from, fromUrl?.to, fromUrl?.compare, stored]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!fromUrl) {
      setParams(rangeToSearch(range, new URLSearchParams(search)), { replace: true });
    } else if (!same(stored, fromUrl)) {
      dispatch(setAnalyticsRange({ from: fromUrl.from, to: fromUrl.to, compare: fromUrl.compare, preset: fromUrl.preset }));
    }
  }, [fromUrl?.from, fromUrl?.to, fromUrl?.compare, search]); // eslint-disable-line react-hooks/exhaustive-deps

  const setRange = useCallback(
    (next) => {
      dispatch(setAnalyticsRange(next));
      setParams((cur) => {
        const p = rangeToSearch(next, cur);
        p.delete("page");
        return p;
      });
    },
    [dispatch, setParams],
  );

  const query = useMemo(() => ({ from: range.from, to: range.to, compare: range.compare || "prev" }), [range.from, range.to, range.compare]);
  return { range, setRange, query };
}

/** Додає період до внутрішнього посилання на сторінки аналітики (інші посилання — без змін). */
export function withPeriod(link, range) {
  if (!link || typeof link !== "string" || !range) return link || null;
  if (!link.startsWith("/seller/analytics") && link !== "/seller/dashboard") return link;
  const [path, qs] = link.split("?");
  const p = rangeToSearch(range, new URLSearchParams(qs || ""));
  return `${path}?${p.toString()}`;
}

/** Підпис порівняння для KPI: «vs попередній період» / «vs рік тому» / null. */
export function compareLabel(compare) {
  if (compare === "yoy") return "vs рік тому";
  if (compare === "none") return null;
  return "vs попередній період";
}

/** Підпис бакета на осі X залежно від гранулярності. */
export function bucketLabel(date, granularity) {
  if (granularity === "month") {
    const d = new Date(`${date}T12:00:00Z`);
    return Number.isNaN(d.getTime()) ? date : d.toLocaleDateString("uk-UA", { month: "short", year: "2-digit", timeZone: "Europe/Kyiv" });
  }
  if (granularity === "week") return `з ${formatDate(date, { short: true })}`;
  return formatDate(date, { short: true });
}

/** Вирівнює ряд порівняння за довжиною основного (різна кількість днів у місяцях тощо). */
export function alignSeries(prev, length, key) {
  const out = (prev || []).slice(0, length).map((p) => Number(p?.[key]) || 0);
  while (out.length < length) out.push(null);
  return out;
}

/** Гранулярність як на бекенді (auto): ≤31 дн → day, ≤6 міс → week, інакше month. */
export function autoGranularity(range) {
  if (!range?.from || !range?.to) return "day";
  const days = daysBetween(range.from, range.to);
  if (days <= 31) return "day";
  if (days <= 184) return "week";
  return "month";
}
