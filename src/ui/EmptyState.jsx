import { MdInsights } from "react-icons/md";
import { cx } from "./cx";

/** EmptyState({ icon, title, text, action, compact }) */
export function EmptyState({ icon, title = "Поки що порожньо", text, action, compact = false, className }) {
  return (
    <div
      className={cx(
        "flex min-w-0 flex-col items-center justify-center text-center",
        compact ? "gap-2 px-4 py-6" : "gap-3 px-6 py-10",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cx(
          "inline-flex items-center justify-center rounded-full bg-(--surface-2) text-(--ink-2)",
          compact ? "h-10 w-10 text-xl" : "h-14 w-14 text-2xl",
        )}
      >
        {icon || <MdInsights />}
      </span>
      {title && <p className="max-w-md break-words font-semibold text-(--ink)">{title}</p>}
      {text && <p className="max-w-md break-words text-sm text-(--ink-2)">{text}</p>}
      {action && <div className="mt-1 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}
