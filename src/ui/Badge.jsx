import { cx } from "./cx";

const TONES = {
  neutral: "bg-(--surface-2) text-(--ink-2) border-(--line)",
  brand: "bg-(--brand-soft) text-(--brand-ink) border-transparent",
  success: "bg-(--success-soft) text-(--success) border-transparent",
  warning: "bg-(--warning-soft) text-(--warning-ink) border-transparent",
  danger: "bg-(--danger-soft) text-(--danger) border-transparent",
};

const DOTS = {
  neutral: "bg-(--line-strong)",
  brand: "bg-(--brand)",
  success: "bg-(--success)",
  warning: "bg-(--warning)",
  danger: "bg-(--danger)",
};

/** Badge({ tone: neutral|brand|success|warning|danger, size: sm|md, icon, children }) */
export function Badge({ tone = "neutral", size = "sm", icon, className, children, ...rest }) {
  return (
    <span
      className={cx(
        "inline-flex max-w-full items-center gap-1 rounded-full border font-medium whitespace-nowrap",
        size === "md" ? "px-2.5 py-1 text-sm" : "px-2 py-0.5 text-xs",
        TONES[tone] || TONES.neutral,
        className,
      )}
      {...rest}
    >
      {icon && <span aria-hidden="true" className="inline-flex shrink-0">{icon}</span>}
      <span className="min-w-0 truncate">{children}</span>
    </span>
  );
}

/** StatusChip — як Badge, але з крапкою-індикатором. Текст обов'язковий (не лише колір). */
export function StatusChip({ tone = "neutral", size = "sm", className, children, ...rest }) {
  return (
    <span
      className={cx(
        "inline-flex max-w-full items-center gap-1.5 rounded-full border font-medium whitespace-nowrap",
        size === "md" ? "px-2.5 py-1 text-sm" : "px-2 py-0.5 text-xs",
        TONES[tone] || TONES.neutral,
        className,
      )}
      {...rest}
    >
      <span aria-hidden="true" className={cx("h-1.5 w-1.5 shrink-0 rounded-full", DOTS[tone] || DOTS.neutral)} />
      <span className="min-w-0 truncate">{children}</span>
    </span>
  );
}
