import { useId, useState } from "react";
import { MdInfoOutline } from "react-icons/md";
import { cx } from "./cx";

/** InfoTip({ text, label }) — іконка «що це?» з підказкою (hover/focus/tap). */
export function InfoTip({ text, label = "Що це?", className }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  if (!text) return null;
  return (
    <span className={cx("relative inline-flex align-middle", className)}>
      <button
        type="button"
        aria-label={label}
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        className="inline-flex h-6 w-6 items-center justify-center rounded-full text-(--ink-2) hover:text-(--ink)"
      >
        <MdInfoOutline aria-hidden="true" />
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          className="absolute left-1/2 top-full z-50 mt-1 w-64 max-w-[80vw] -translate-x-1/2 rounded-(--r-md) border border-(--line) bg-(--surface) p-3 text-left text-xs font-normal leading-5 text-(--ink) shadow-(--shadow-3)"
        >
          {text}
        </span>
      )}
    </span>
  );
}
