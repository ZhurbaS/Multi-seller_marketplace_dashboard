import { Link } from "react-router-dom";
import { MdChevronRight } from "react-icons/md";
import { cx } from "./cx";

/**
 * PageHeader({ title, description, actions, breadcrumbs:[{label, to?}] })
 */
export function PageHeader({ title, description, actions, breadcrumbs, className, children }) {
  return (
    <header className={cx("mb-5 flex min-w-0 flex-col gap-3 sm:mb-6", className)}>
      {Array.isArray(breadcrumbs) && breadcrumbs.length > 0 && (
        <nav aria-label="Хлібні крихти">
          <ol className="flex flex-wrap items-center gap-1 text-sm text-(--ink-2)">
            {breadcrumbs.map((b, i) => {
              const last = i === breadcrumbs.length - 1;
              return (
                <li key={`${b.label}-${i}`} className="flex min-w-0 items-center gap-1">
                  {b.to && !last ? (
                    <Link to={b.to} className="truncate hover:text-(--brand-ink) hover:underline">
                      {b.label}
                    </Link>
                  ) : (
                    <span className="truncate" aria-current={last ? "page" : undefined}>
                      {b.label}
                    </span>
                  )}
                  {!last && <MdChevronRight aria-hidden="true" className="shrink-0" />}
                </li>
              );
            })}
          </ol>
        </nav>
      )}
      <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <h1 className="break-words text-[clamp(1.375rem,1.1rem+1vw,1.75rem)] font-bold leading-tight tracking-tight text-(--ink)">
            {title}
          </h1>
          {description && <p className="mt-1 max-w-3xl break-words text-[0.9375rem] text-(--ink-2)">{description}</p>}
        </div>
        {actions && <div className="flex min-w-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </header>
  );
}
