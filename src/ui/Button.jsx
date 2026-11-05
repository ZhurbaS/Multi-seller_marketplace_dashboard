import { cx } from "./cx";

const VARIANTS = {
  primary: "bg-(--brand) text-(--on-brand) hover:bg-(--brand-hover) border border-transparent",
  secondary: "bg-(--surface) text-(--ink) border border-(--line-strong)/60 hover:bg-(--surface-2)",
  ghost: "bg-transparent text-(--ink) border border-transparent hover:bg-(--surface-2)",
  danger: "bg-(--danger) text-(--on-danger) border border-transparent hover:brightness-95",
  cta: "bg-(--cta) text-(--on-cta) border border-transparent hover:bg-(--cta-hover)",
};

const SIZES = {
  sm: "h-9 px-3 text-sm gap-1.5 rounded-(--r-sm)",
  md: "h-11 px-4 text-[0.9375rem] gap-2 rounded-(--r-md)",
  lg: "h-12 px-5 text-base gap-2 rounded-(--r-md)",
};

const ICON_SIZES = {
  sm: "h-9 w-9 rounded-(--r-sm) text-base",
  md: "h-11 w-11 rounded-(--r-md) text-lg",
  lg: "h-12 w-12 rounded-(--r-md) text-xl",
};

export function Spinner({ className, label = "Завантаження" }) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cx(
        "inline-block h-[1em] w-[1em] shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent",
        className,
      )}
    />
  );
}

/**
 * Button — variant: primary|secondary|ghost|danger|cta; size: sm|md|lg.
 * loading — спінер + disabled; icon/iconRight — вузол іконки; as — інший компонент (напр. Link).
 */
export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon = null,
  iconRight = null,
  fullWidth = false,
  as: Comp = "button",
  type,
  disabled,
  className,
  children,
  ...rest
}) {
  const isButton = Comp === "button";
  const isDisabled = disabled || loading;
  return (
    <Comp
      type={isButton ? type || "button" : type}
      disabled={isButton ? isDisabled : undefined}
      aria-disabled={!isButton && isDisabled ? true : undefined}
      aria-busy={loading || undefined}
      className={cx(
        "inline-flex select-none items-center justify-center whitespace-nowrap font-semibold transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-55 aria-disabled:pointer-events-none aria-disabled:opacity-55",
        VARIANTS[variant] || VARIANTS.primary,
        SIZES[size] || SIZES.md,
        fullWidth && "w-full",
        className,
      )}
      {...rest}
    >
      {loading ? <Spinner /> : icon ? <span className="inline-flex shrink-0 text-[1.1em]" aria-hidden="true">{icon}</span> : null}
      {children != null && <span className="min-w-0 truncate">{children}</span>}
      {iconRight && !loading && (
        <span className="inline-flex shrink-0 text-[1.1em]" aria-hidden="true">
          {iconRight}
        </span>
      )}
    </Comp>
  );
}

/**
 * IconButton — квадратна кнопка з іконкою. label обов'язковий (aria-label + title).
 * badge — число/текст у кружечку (лічильник).
 */
export function IconButton({
  icon,
  label,
  variant = "ghost",
  size = "md",
  badge,
  loading = false,
  as: Comp = "button",
  type,
  disabled,
  className,
  children,
  ...rest
}) {
  const isButton = Comp === "button";
  return (
    <Comp
      type={isButton ? type || "button" : type}
      aria-label={label}
      title={label}
      disabled={isButton ? disabled || loading : undefined}
      className={cx(
        "relative inline-flex shrink-0 items-center justify-center transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-55",
        VARIANTS[variant] || VARIANTS.ghost,
        ICON_SIZES[size] || ICON_SIZES.md,
        className,
      )}
      {...rest}
    >
      {loading ? <Spinner /> : <span aria-hidden="true" className="inline-flex">{icon || children}</span>}
      {badge !== undefined && badge !== null && badge !== 0 && badge !== false && (
        <span className="absolute -right-1 -top-1 min-w-[1.15rem] rounded-full bg-(--sale) px-1 text-center text-[0.6875rem] font-bold leading-[1.15rem] text-(--on-sale) tabular-nums">
          {typeof badge === "number" && badge > 99 ? "99+" : badge}
        </span>
      )}
    </Comp>
  );
}
