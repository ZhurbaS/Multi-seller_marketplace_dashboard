import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { MdClose, MdWarningAmber } from "react-icons/md";
import { cx } from "./cx";
import { Button, IconButton } from "./Button";

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

let lockCount = 0;
function lockScroll() {
  if (lockCount++ === 0) {
    document.documentElement.style.overflow = "hidden";
  }
}
function unlockScroll() {
  if (--lockCount <= 0) {
    lockCount = 0;
    document.documentElement.style.overflow = "";
  }
}

/** Спільна логіка: Esc, фокус-пастка, блок прокрутки, повернення фокуса. */
function useDialog(open, onClose, panelRef, initialFocusRef) {
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.activeElement;
    lockScroll();
    const t = setTimeout(() => {
      const el = initialFocusRef?.current || panelRef.current?.querySelector("[data-autofocus]") || panelRef.current?.querySelector(FOCUSABLE) || panelRef.current;
      el?.focus?.();
    }, 0);
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        closeRef.current?.();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const items = [...panelRef.current.querySelectorAll(FOCUSABLE)].filter((n) => n.offsetParent !== null);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      unlockScroll();
      prev?.focus?.();
    };
  }, [open, panelRef, initialFocusRef]);
}

const MODAL_SIZES = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };

/**
 * Modal({ open, onClose, title, description, children, footer, size: sm|md|lg|xl,
 *         closeOnBackdrop=true, hideClose, initialFocusRef })
 */
export function Modal({ open, onClose, title, description, children, footer, size = "md", closeOnBackdrop = true, hideClose = false, initialFocusRef, className }) {
  const panelRef = useRef(null);
  const tid = useId();
  useDialog(open, onClose, panelRef, initialFocusRef);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-(--overlay)" aria-hidden="true" onClick={closeOnBackdrop ? onClose : undefined} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? `${tid}-t` : undefined}
        aria-describedby={description ? `${tid}-d` : undefined}
        tabIndex={-1}
        className={cx(
          "relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-(--r-lg) border border-(--line) bg-(--surface) text-(--ink) shadow-(--shadow-3) sm:rounded-(--r-lg)",
          MODAL_SIZES[size] || MODAL_SIZES.md,
          className,
        )}
      >
        {(title || !hideClose) && (
          <div className="flex items-start gap-3 border-b border-(--line) px-5 py-4">
            <div className="min-w-0 flex-1">
              {title && (
                <h2 id={`${tid}-t`} className="break-words text-lg font-semibold">
                  {title}
                </h2>
              )}
              {description && (
                <p id={`${tid}-d`} className="mt-0.5 text-sm text-(--ink-2)">
                  {description}
                </p>
              )}
            </div>
            {!hideClose && <IconButton icon={<MdClose />} label="Закрити" size="sm" onClick={onClose} className="-mr-2" />}
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-(--line) px-5 py-3 pb-[max(0.75rem,var(--sab))]">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

/**
 * Drawer({ open, onClose, title, side: right|left|bottom, children, footer, width })
 */
export function Drawer({ open, onClose, title, side = "right", children, footer, width = "min(420px, 100vw)", className, ariaLabel }) {
  const panelRef = useRef(null);
  const tid = useId();
  useDialog(open, onClose, panelRef);
  if (!open) return null;
  const pos =
    side === "left"
      ? "left-0 top-0 h-full"
      : side === "bottom"
        ? "bottom-0 left-0 right-0 max-h-[88dvh] rounded-t-(--r-lg)"
        : "right-0 top-0 h-full";
  return createPortal(
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-(--overlay)" aria-hidden="true" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={!title ? ariaLabel : undefined}
        aria-labelledby={title ? `${tid}-t` : undefined}
        tabIndex={-1}
        style={side === "bottom" ? undefined : { width }}
        className={cx("absolute flex flex-col border-(--line) bg-(--surface) text-(--ink) shadow-(--shadow-3)", pos, className)}
      >
        {title && (
          <div className="flex items-center gap-3 border-b border-(--line) px-5 py-3">
            <h2 id={`${tid}-t`} className="min-w-0 flex-1 truncate text-lg font-semibold">
              {title}
            </h2>
            <IconButton icon={<MdClose />} label="Закрити" size="sm" onClick={onClose} className="-mr-2" />
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-(--line) px-5 py-3 pb-[max(0.75rem,var(--sab))]">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

/**
 * ConfirmDialog({ open, title, text, confirmLabel, cancelLabel, tone: danger|brand,
 *                 loading, onConfirm, onClose }) — замість window.confirm().
 */
export function ConfirmDialog({
  open,
  title = "Підтвердіть дію",
  text,
  confirmLabel = "Підтвердити",
  cancelLabel = "Скасувати",
  tone = "danger",
  loading = false,
  onConfirm,
  onClose,
  children,
}) {
  const cancelRef = useRef(null);
  return (
    <Modal
      open={open}
      onClose={loading ? undefined : onClose}
      size="sm"
      hideClose
      initialFocusRef={cancelRef}
      footer={
        <>
          <Button ref={cancelRef} variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={tone === "danger" ? "danger" : "primary"} loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex gap-3">
        {tone === "danger" && (
          <span aria-hidden="true" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-(--danger-soft) text-xl text-(--danger)">
            <MdWarningAmber />
          </span>
        )}
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">{title}</h2>
          {text && <p className="mt-1 break-words text-sm text-(--ink-2)">{text}</p>}
          {children}
        </div>
      </div>
    </Modal>
  );
}
