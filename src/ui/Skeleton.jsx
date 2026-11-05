import { cx } from "./cx";

/** Skeleton({ className, width, height, rounded, lines }) — плейсхолдер завантаження. */
export function Skeleton({ className, width, height, rounded = "md", lines = 1 }) {
  const r = rounded === "full" ? "rounded-full" : rounded === "sm" ? "rounded-(--r-sm)" : rounded === "lg" ? "rounded-(--r-lg)" : "rounded-(--r-md)";
  if (lines > 1) {
    return (
      <span className={cx("flex flex-col gap-2", className)} aria-hidden="true">
        {Array.from({ length: lines }, (_, i) => (
          <span
            key={i}
            className={cx("skeleton block h-3.5", r)}
            style={{ width: i === lines - 1 ? "60%" : width || "100%" }}
          />
        ))}
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      className={cx("skeleton block", !height && "h-4", r, className)}
      style={{ width, height }}
    />
  );
}
