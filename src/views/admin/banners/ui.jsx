import React, { useEffect, useRef } from "react";
import { MdWarningAmber, MdInfoOutline, MdErrorOutline } from "react-icons/md";
import { Button, Card as KitCard, Segmented as KitSegmented, StatusChip as KitStatusChip, Switch, cx } from "../../../ui";
import { STATUS } from "./bannerUtils";

// Локальні обгортки над UI-кітом (src/ui) зі збереженням старого API сторінок банерів/маркетингу.

export const Field = ({ label, hint, error, id, children, counter, required, className }) => (
  <div className={cx("flex min-w-0 flex-col gap-1.5", className)}>
    {(label || counter) && (
      <div className="flex items-baseline justify-between gap-2">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-(--ink)">
            {label}
            {required && (
              <span className="ml-0.5 text-(--danger)" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}
        {counter}
      </div>
    )}
    {children}
    {hint && !error && (
      <span id={id ? `${id}-hint` : undefined} className="block text-xs text-(--ink-2)">
        {hint}
      </span>
    )}
    {error && (
      <span id={id ? `${id}-err` : undefined} role="alert" className="block text-xs font-medium text-(--danger)">
        {error}
      </span>
    )}
  </div>
);

export const Counter = ({ value, max }) => {
  const n = String(value || "").length;
  return (
    <span className={cx("text-xs tabular-nums", n > max ? "font-semibold text-(--danger)" : "text-(--ink-2)")} aria-live="polite">
      {n}/{max}
    </span>
  );
};

// Вбудований діалог підтвердження (замість window.confirm). Власний шар з високим z-index,
// бо відкривається поверх повноекранних редакторів.
export const ConfirmDialog = ({ title, text, confirmLabel, onConfirm, onCancel, busy, tone = "danger" }) => {
  const btnRef = useRef(null);
  useEffect(() => {
    const prev = document.activeElement;
    btnRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCancel();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      prev?.focus?.();
    };
  }, [onCancel]);
  return (
    <div className="fixed inset-0 z-[10001] flex items-end justify-center bg-(--overlay) p-0 sm:items-center sm:p-4" onClick={onCancel}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="bn-confirm-title"
        aria-describedby="bn-confirm-text"
        className="flex w-full max-w-[440px] flex-col gap-4 rounded-t-(--r-lg) border border-(--line) bg-(--surface) p-5 text-(--ink) shadow-(--shadow-3) sm:rounded-(--r-lg)"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex gap-3">
          {tone === "danger" && (
            <span aria-hidden="true" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-(--danger-soft) text-xl text-(--danger)">
              <MdWarningAmber />
            </span>
          )}
          <div className="min-w-0">
            <h2 id="bn-confirm-title" className="text-lg font-semibold">
              {title}
            </h2>
            <p id="bn-confirm-text" className="mt-1 text-sm text-(--ink-2)">
              {text}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>
            Скасувати
          </Button>
          <Button ref={btnRef} variant={tone === "danger" ? "danger" : "primary"} loading={busy} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

// Перемикач: onChange(boolean)
export const Toggle = ({ checked, onChange, disabled, label, srLabel, description }) => (
  <Switch checked={!!checked} onChange={onChange} disabled={disabled} label={label} description={description} aria-label={label ? undefined : srLabel} />
);

const STATUS_TONE = { live: "success", scheduled: "brand", expired: "neutral", paused: "warning" };

export const StatusChip = ({ status }) => {
  const s = STATUS[status] || STATUS.paused;
  return <KitStatusChip tone={STATUS_TONE[status] || "warning"}>{s.label}</KitStatusChip>;
};

// Сегментований перемикач; options — масив пар [value, text]
export const Segmented = ({ value, onChange, options, label, size = "md" }) => (
  <KitSegmented
    ariaLabel={label}
    value={value}
    onChange={onChange}
    size={size === "sm" ? "sm" : "md"}
    options={options.map(([v, text]) => ({ value: v, label: text }))}
  />
);

export const Card = ({ className = "", children, ...rest }) => (
  <KitCard padded className={cx("w-full", className)} {...rest}>
    {children}
  </KitCard>
);

const NOTICE = {
  info: { cls: "border-(--brand) bg-(--brand-soft) text-(--ink)", icon: <MdInfoOutline className="text-(--brand-ink)" /> },
  warn: { cls: "border-(--warning) bg-(--warning-soft) text-(--ink)", icon: <MdWarningAmber className="text-(--warning-ink)" /> },
  error: { cls: "border-(--danger) bg-(--danger-soft) text-(--ink)", icon: <MdErrorOutline className="text-(--danger)" /> },
};

export const Notice = ({ tone = "info", children }) => {
  const n = NOTICE[tone] || NOTICE.info;
  return (
    <div role={tone === "info" ? undefined : "status"} className={cx("flex min-w-0 items-start gap-2 rounded-(--r-md) border-l-4 p-3 text-sm", n.cls)}>
      <span aria-hidden="true" className="mt-0.5 inline-flex shrink-0 text-lg">
        {n.icon}
      </span>
      <div className="min-w-0 flex-1 break-words">{children}</div>
    </div>
  );
};
