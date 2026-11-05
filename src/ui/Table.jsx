import { isValidElement, useMemo, useState } from "react";
import { MdArrowDownward, MdArrowUpward, MdUnfoldMore } from "react-icons/md";
import { cx } from "./cx";
import { Skeleton } from "./Skeleton";
import { EmptyState } from "./EmptyState";

const ALIGN = { left: "text-left", right: "text-right", center: "text-center" };

function cellValue(col, row, i) {
  if (col.render) return col.render(row, i);
  const v = row?.[col.key];
  return v === null || v === undefined || v === "" ? "—" : v;
}

function getKey(rowKey, row, i) {
  if (typeof rowKey === "function") return rowKey(row, i);
  return row?.[rowKey] ?? row?.id ?? i;
}

/**
 * Table — адаптивна таблиця: ≥md — <table>, <md — список карток.
 * columns: [{ key, header, render?(row,i), align?: left|right|center, sortable?, sortValue?(row),
 *             width?, className?, hideOnCard?, cardLabel?, primary? (заголовок картки) }]
 * rows: масив; rowKey: string|fn (за замовч. "_id");
 * renderCard?(row,i) — власна картка для мобільних;
 * empty — вузол або { icon,title,text,action } для EmptyState;
 * loading — skeleton; skeletonRows=5;
 * sort — { key, dir: 'asc'|'desc' } (керований) + onSort(nextSort); без onSort сортує на клієнті;
 * onRowClick?(row); caption — підпис для скрінрідерів; dense — компактні рядки.
 */
export function Table({
  columns = [],
  rows = [],
  rowKey = "_id",
  renderCard,
  empty,
  loading = false,
  skeletonRows = 5,
  sort,
  onSort,
  onRowClick,
  caption,
  dense = false,
  className,
}) {
  const [innerSort, setInnerSort] = useState(null);
  const activeSort = onSort ? sort : sort ?? innerSort;

  const sorted = useMemo(() => {
    if (onSort || !activeSort?.key || !Array.isArray(rows)) return rows || [];
    const col = columns.find((c) => c.key === activeSort.key);
    if (!col) return rows;
    const get = col.sortValue || ((r) => r?.[col.key]);
    const dir = activeSort.dir === "desc" ? -1 : 1;
    return [...rows].sort((a, b) => {
      const x = get(a);
      const y = get(b);
      if (x === y) return 0;
      if (x === null || x === undefined) return 1;
      if (y === null || y === undefined) return -1;
      return (typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), "uk")) * dir;
    });
  }, [rows, columns, activeSort, onSort]);

  const toggleSort = (key) => {
    const next = activeSort?.key === key ? { key, dir: activeSort.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" };
    if (onSort) onSort(next);
    else setInnerSort(next);
  };

  const pad = dense ? "px-3 py-2" : "px-4 py-3";
  const isEmpty = !loading && (!sorted || sorted.length === 0);
  const emptyNode = isEmpty ? (
    empty && typeof empty === "object" && !isValidElement(empty) ? (
      <EmptyState compact {...empty} />
    ) : (
      empty || <EmptyState compact title="Нічого не знайдено" />
    )
  ) : null;

  const primaryCol = columns.find((c) => c.primary) || columns[0];

  return (
    <div className={cx("min-w-0 overflow-hidden rounded-(--r-lg) border border-(--line) bg-(--surface)", className)}>
      {/* ≥ md: таблиця */}
      <div className="hidden overflow-x-auto scrollbar-thin md:block">
        <table className="w-full border-collapse text-sm">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead className="bg-(--surface-2) text-xs font-semibold uppercase tracking-wide text-(--ink-2)">
            <tr>
              {columns.map((c) => {
                const active = activeSort?.key === c.key;
                return (
                  <th
                    key={c.key}
                    scope="col"
                    style={c.width ? { width: c.width } : undefined}
                    aria-sort={active ? (activeSort.dir === "asc" ? "ascending" : "descending") : undefined}
                    className={cx(pad, "whitespace-nowrap border-b border-(--line)", ALIGN[c.align] || ALIGN.left)}
                  >
                    {c.sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(c.key)}
                        className={cx("inline-flex items-center gap-1 uppercase hover:text-(--ink)", active && "text-(--ink)", c.align === "right" && "flex-row-reverse")}
                      >
                        {c.header}
                        {active ? activeSort.dir === "asc" ? <MdArrowUpward aria-hidden="true" /> : <MdArrowDownward aria-hidden="true" /> : <MdUnfoldMore aria-hidden="true" className="opacity-60" />}
                      </button>
                    ) : (
                      c.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: skeletonRows }, (_, i) => (
                  <tr key={`sk${i}`} className="border-b border-(--line) last:border-0">
                    {columns.map((c) => (
                      <td key={c.key} className={pad}>
                        <Skeleton height="0.875rem" width={c.align === "right" ? "60%" : "80%"} className={c.align === "right" ? "ml-auto" : ""} />
                      </td>
                    ))}
                  </tr>
                ))
              : sorted.map((row, i) => (
                  <tr
                    key={getKey(rowKey, row, i)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cx("border-b border-(--line) last:border-0 align-middle", onRowClick && "cursor-pointer hover:bg-(--surface-2)")}
                  >
                    {columns.map((c) => (
                      <td key={c.key} className={cx(pad, "min-w-0 text-(--ink)", ALIGN[c.align] || ALIGN.left, c.align === "right" && "tabular-nums whitespace-nowrap", c.className)}>
                        {cellValue(c, row, i)}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
        {emptyNode}
      </div>

      {/* < md: картки */}
      <ul className="divide-y divide-(--line) md:hidden" aria-label={caption}>
        {loading
          ? Array.from({ length: Math.min(skeletonRows, 3) }, (_, i) => (
              <li key={`skc${i}`} className="p-4">
                <Skeleton lines={3} />
              </li>
            ))
          : sorted.map((row, i) => (
              <li key={getKey(rowKey, row, i)} className="min-w-0">
                {renderCard ? (
                  <div onClick={onRowClick ? () => onRowClick(row) : undefined} className={cx("p-4", onRowClick && "cursor-pointer")}>
                    {renderCard(row, i)}
                  </div>
                ) : (
                  <div onClick={onRowClick ? () => onRowClick(row) : undefined} className={cx("flex min-w-0 flex-col gap-1.5 p-4", onRowClick && "cursor-pointer active:bg-(--surface-2)")}>
                    {primaryCol && <div className="min-w-0 break-words font-semibold text-(--ink)">{cellValue(primaryCol, row, i)}</div>}
                    <dl className="grid min-w-0 grid-cols-[minmax(0,auto)_minmax(0,1fr)] gap-x-3 gap-y-1 text-sm">
                      {columns
                        .filter((c) => c !== primaryCol && !c.hideOnCard)
                        .map((c) => (
                          <div key={c.key} className="contents">
                            <dt className="truncate text-(--ink-2)">{c.cardLabel || c.header}</dt>
                            <dd className="min-w-0 break-words text-right text-(--ink) tabular-nums">{cellValue(c, row, i)}</dd>
                          </div>
                        ))}
                    </dl>
                  </div>
                )}
              </li>
            ))}
      </ul>
      <div className="md:hidden">{emptyNode}</div>
    </div>
  );
}
