import { MdChevronLeft, MdChevronRight } from "react-icons/md";
import { cx } from "./cx";
import { formatInt } from "./format";

function range(page, pages, sib) {
  const out = [];
  const start = Math.max(2, page - sib);
  const end = Math.min(pages - 1, page + sib);
  out.push(1);
  if (start > 2) out.push("…l");
  for (let i = start; i <= end; i++) out.push(i);
  if (end < pages - 1) out.push("…r");
  if (pages > 1) out.push(pages);
  return out;
}

/**
 * Pagination({ page (1-based), total, perPage=10, onChange(page), siblingCount=1, showSummary=true })
 * Ховається, якщо сторінка одна.
 */
export function Pagination({ page = 1, total = 0, perPage = 10, onChange, siblingCount = 1, showSummary = true, className }) {
  const pages = Math.max(1, Math.ceil((Number(total) || 0) / (Number(perPage) || 10)));
  if (pages <= 1) return null;
  const cur = Math.min(Math.max(1, page), pages);
  const from = (cur - 1) * perPage + 1;
  const to = Math.min(total, cur * perPage);
  const btn = "inline-flex h-9 min-w-9 items-center justify-center rounded-(--r-sm) px-2 text-sm font-medium tabular-nums transition-colors disabled:opacity-40 disabled:cursor-not-allowed";
  return (
    <nav aria-label="Сторінки" className={cx("mt-4 flex min-w-0 flex-wrap items-center justify-between gap-3", className)}>
      {showSummary && (
        <p className="text-sm text-(--ink-2) tabular-nums">
          {formatInt(from)}–{formatInt(to)} з {formatInt(total)}
        </p>
      )}
      <ul className="flex flex-wrap items-center gap-1">
        <li>
          <button type="button" className={cx(btn, "text-(--ink) hover:bg-(--surface-2)")} disabled={cur <= 1} onClick={() => onChange?.(cur - 1)} aria-label="Попередня сторінка">
            <MdChevronLeft aria-hidden="true" className="text-lg" />
          </button>
        </li>
        {range(cur, pages, siblingCount).map((p) =>
          typeof p === "string" ? (
            <li key={p} aria-hidden="true" className="px-1 text-(--ink-2)">
              …
            </li>
          ) : (
            <li key={p} className={cx(Math.abs(p - cur) > 1 && p !== 1 && p !== pages && "max-sm:hidden")}>
              <button
                type="button"
                aria-current={p === cur ? "page" : undefined}
                aria-label={`Сторінка ${p}`}
                onClick={() => onChange?.(p)}
                className={cx(btn, p === cur ? "bg-(--brand) text-(--on-brand)" : "text-(--ink) hover:bg-(--surface-2)")}
              >
                {p}
              </button>
            </li>
          ),
        )}
        <li>
          <button type="button" className={cx(btn, "text-(--ink) hover:bg-(--surface-2)")} disabled={cur >= pages} onClick={() => onChange?.(cur + 1)} aria-label="Наступна сторінка">
            <MdChevronRight aria-hidden="true" className="text-lg" />
          </button>
        </li>
      </ul>
    </nav>
  );
}
