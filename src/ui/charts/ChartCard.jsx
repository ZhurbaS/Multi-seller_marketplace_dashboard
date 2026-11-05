import { cx } from "../cx";
import { InfoTip } from "../InfoTip";
import { ChartPlaceholder, DEFAULT_EMPTY } from "./ChartEmpty";

/**
 * ChartCard({ title, description, info, actions, loading, empty, emptyText, height, footer, children })
 * Картка-обгортка для графіка: заголовок, дії, skeleton (loading) і порожній стан (empty=true).
 */
export function ChartCard({ title, description, info, actions, loading = false, empty = false, emptyText = DEFAULT_EMPTY, height = 280, footer, className, children }) {
  return (
    <section className={cx("flex min-w-0 flex-col rounded-(--r-lg) border border-(--line) bg-(--surface) shadow-(--shadow-1)", className)}>
      {(title || actions) && (
        <div className="flex min-w-0 flex-wrap items-start gap-2 px-4 pt-4 sm:px-5">
          <div className="min-w-0 flex-1">
            {title && (
              <h2 className="flex items-center gap-1 text-base font-semibold text-(--ink)">
                <span className="min-w-0 break-words">{title}</span>
                {info && <InfoTip text={info} />}
              </h2>
            )}
            {description && <p className="mt-0.5 text-sm text-(--ink-2)">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className="min-w-0 flex-1 px-2 pb-3 pt-2 sm:px-3">
        {loading || empty ? (
          <div className="px-2 pt-1">
            <ChartPlaceholder loading={loading} height={height} emptyText={emptyText} />
          </div>
        ) : (
          children
        )}
      </div>
      {footer && <div className="border-t border-(--line) px-4 py-3 text-sm text-(--ink-2) sm:px-5">{footer}</div>}
    </section>
  );
}
