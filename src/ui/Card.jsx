import { cx } from "./cx";

/** Card — контейнер-картка. padded=true додає внутрішній відступ (без CardBody). */
export function Card({ as = "div", padded = false, interactive = false, className, children, ...rest }) {
  const Comp = as;
  return (
    <Comp
      className={cx(
        "min-w-0 rounded-(--r-lg) border border-(--line) bg-(--surface) text-(--ink) shadow-(--shadow-1)",
        padded && "p-4 sm:p-5",
        interactive && "transition-shadow hover:shadow-(--shadow-2)",
        className,
      )}
      {...rest}
    >
      {children}
    </Comp>
  );
}

/** CardHeader — заголовок картки: title, description, icon, actions (праворуч). */
export function CardHeader({ title, description, icon, actions, as = "h2", className, children }) {
  const H = as;
  return (
    <div className={cx("flex min-w-0 flex-wrap items-start gap-3 px-4 pt-4 sm:px-5 sm:pt-5", className)}>
      {icon && (
        <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-(--r-md) bg-(--brand-soft) text-lg text-(--brand-ink)" aria-hidden="true">
          {icon}
        </span>
      )}
      <div className="min-w-0 flex-1">
        {title && <H className="break-words text-base font-semibold leading-6 text-(--ink)">{title}</H>}
        {description && <p className="mt-0.5 break-words text-sm text-(--ink-2)">{description}</p>}
        {children}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** CardBody — тіло картки з відступами. */
export function CardBody({ className, children, ...rest }) {
  return (
    <div className={cx("min-w-0 p-4 sm:p-5", className)} {...rest}>
      {children}
    </div>
  );
}

/** CardFooter — нижня панель картки (дії). */
export function CardFooter({ className, children }) {
  return (
    <div className={cx("flex flex-wrap items-center justify-end gap-2 border-t border-(--line) px-4 py-3 sm:px-5", className)}>
      {children}
    </div>
  );
}
