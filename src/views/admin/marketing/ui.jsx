import React, { useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { MdClose, MdErrorOutline, MdInbox, MdWarningAmber, MdFirstPage, MdLastPage, MdChevronLeft, MdChevronRight } from "react-icons/md";
import {
  Badge as KitBadge,
  Button,
  EmptyState,
  IconButton,
  PageHeader,
  Skeleton as KitSkeleton,
  Stat as KitStat,
  cx,
} from "../../../ui";
import { useModal } from "./hooks";
import { inputCls } from "./mkUtils";

// Локальні обгортки розділу «Маркетинг» над UI-кітом (src/ui) зі збереженням старого API.
export { Card, Counter, Field, Notice, Segmented, Toggle } from "../banners/ui";

export const Page = ({ title, description, actions, children }) => (
  <div className="flex min-w-0 flex-col gap-4 pb-10">
    <PageHeader title={title} description={description} actions={actions} breadcrumbs={[{ label: "Маркетинг" }, { label: title }]} className="mb-0 sm:mb-0" />
    {children}
  </div>
);

// meta: { label, tone, hint, dot }
export const Badge = ({ meta, fallback, title }) => {
  const m = meta || { label: fallback || "—", tone: "neutral" };
  return (
    <KitBadge tone={m.tone || "neutral"} title={title || m.hint}>
      {m.label}
    </KitBadge>
  );
};

export const Chip = ({ children, onRemove, removeLabel }) => (
  <span className="inline-flex min-h-7 max-w-full items-center gap-1 rounded-full bg-(--brand-soft) py-0.5 pl-2.5 pr-1 text-xs font-medium text-(--brand-ink)">
    <span className="min-w-0 truncate">{children}</span>
    {onRemove ? (
      <button
        type="button"
        onClick={onRemove}
        aria-label={removeLabel}
        className="inline-flex h-6 w-6 items-center justify-center rounded-full hover:bg-(--surface) hover:text-(--danger)"
      >
        <MdClose aria-hidden="true" />
      </button>
    ) : (
      <span className="w-1.5" />
    )}
  </span>
);

export const Skeleton = ({ rows = 4, label = "Завантаження…" }) => (
  <div className="flex flex-col gap-2" aria-busy="true" role="status">
    <span className="sr-only">{label}</span>
    {Array.from({ length: rows }).map((_, i) => (
      <KitSkeleton key={i} className="h-11 w-full" />
    ))}
  </div>
);

export const Empty = ({ title, children, action, icon }) => <EmptyState icon={icon || <MdInbox />} title={title} text={children} action={action} />;

export const ErrorBox = ({ error, missing, onRetry }) =>
  error ? (
    <div
      role="alert"
      className={cx(
        "flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-(--r-md) border-l-4 p-3 text-sm text-(--ink)",
        missing ? "border-(--warning) bg-(--warning-soft)" : "border-(--danger) bg-(--danger-soft)",
      )}
    >
      <span className="inline-flex min-w-0 items-start gap-2">
        {missing ? (
          <MdWarningAmber aria-hidden="true" className="mt-0.5 shrink-0 text-lg text-(--warning-ink)" />
        ) : (
          <MdErrorOutline aria-hidden="true" className="mt-0.5 shrink-0 text-lg text-(--danger)" />
        )}
        <span className="min-w-0 break-words">{error}</span>
      </span>
      {onRetry && (
        <Button size="sm" variant="secondary" onClick={onRetry}>
          Спробувати ще раз
        </Button>
      )}
    </div>
  ) : null;

export const Pagination = ({ page, pages, total, onPage }) => {
  if (!pages || pages <= 1) return total != null ? <p className="text-sm text-(--ink-2)">Усього: {total}</p> : null;
  return (
    <nav aria-label="Сторінки" className="flex flex-wrap items-center justify-between gap-2">
      <span className="text-sm text-(--ink-2) tabular-nums">
        Сторінка {page} з {pages}
        {total != null && ` · усього ${total}`}
      </span>
      <div className="flex gap-1">
        <IconButton size="sm" variant="secondary" icon={<MdFirstPage />} label="Перша сторінка" disabled={page <= 1} onClick={() => onPage(1)} />
        <Button size="sm" variant="secondary" icon={<MdChevronLeft />} disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Назад
        </Button>
        <Button size="sm" variant="secondary" iconRight={<MdChevronRight />} disabled={page >= pages} onClick={() => onPage(page + 1)}>
          Далі
        </Button>
        <IconButton size="sm" variant="secondary" icon={<MdLastPage />} label="Остання сторінка" disabled={page >= pages} onClick={() => onPage(pages)} />
      </div>
    </nav>
  );
};

// Модальне вікно / діалог. Власний шар (data-mk-layer) — коректно працює поверх Drawer (Esc закриває лише верхній шар).
export const Modal = ({ title, onClose, children, footer, width = "max-w-[520px]", alert = false }) => {
  const ref = useRef(null);
  const id = useId();
  useModal(ref, onClose);
  return (
    <div
      className="fixed inset-0 z-[10002] flex items-end justify-center bg-(--overlay) p-0 sm:items-center sm:p-3"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={ref}
        data-mk-layer=""
        role={alert ? "alertdialog" : "dialog"}
        aria-modal="true"
        aria-labelledby={`${id}-t`}
        tabIndex={-1}
        className={cx(
          "flex max-h-[92dvh] w-full flex-col rounded-t-(--r-lg) border border-(--line) bg-(--surface) text-(--ink) shadow-(--shadow-3) outline-none sm:rounded-(--r-lg)",
          width,
        )}
      >
        <header className="flex items-center justify-between gap-3 border-b border-(--line) px-5 py-3">
          <h2 id={`${id}-t`} className="min-w-0 break-words text-lg font-semibold">
            {title}
          </h2>
          <IconButton icon={<MdClose />} label="Закрити" size="sm" onClick={onClose} className="-mr-2" />
        </header>
        <div className="flex min-h-0 flex-col gap-3 overflow-auto px-5 py-4 text-sm">{children}</div>
        {footer && (
          <footer className="flex flex-wrap justify-end gap-2 border-t border-(--line) px-5 py-3 pb-[max(0.75rem,var(--sab))]">{footer}</footer>
        )}
      </div>
    </div>
  );
};

export const Confirm = ({ title, text, children, confirmLabel = "Підтвердити", tone = "danger", busy, disabled, onConfirm, onCancel }) => (
  <Modal
    title={title}
    onClose={onCancel}
    alert
    width="max-w-[460px]"
    footer={
      <>
        <Button variant="secondary" onClick={onCancel}>
          Скасувати
        </Button>
        <Button variant={tone === "danger" ? "danger" : "primary"} loading={busy} disabled={disabled} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </>
    }
  >
    {text && (
      <div className="flex gap-3">
        {tone === "danger" && (
          <span aria-hidden="true" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-(--danger-soft) text-xl text-(--danger)">
            <MdWarningAmber />
          </span>
        )}
        <p className="min-w-0 break-words text-(--ink-2)">{text}</p>
      </div>
    )}
    {children}
  </Modal>
);

// Бокова панель (drawer). На мобільних — на всю ширину.
export const Drawer = ({ title, subtitle, onClose, children, footer, width = "max-w-[760px]" }) => {
  const ref = useRef(null);
  const id = useId();
  useModal(ref, onClose);
  return (
    <div className="fixed inset-0 z-[10000] flex justify-end bg-(--overlay)" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={ref}
        data-mk-layer=""
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-t`}
        tabIndex={-1}
        className={cx("flex h-full w-full flex-col border-l border-(--line) bg-(--page) text-(--ink) shadow-(--shadow-3) outline-none", width)}
      >
        <header className="flex items-start justify-between gap-3 border-b border-(--line) bg-(--surface) px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <h2 id={`${id}-t`} className="truncate text-lg font-semibold">
              {title}
            </h2>
            {subtitle && <div className="text-sm text-(--ink-2)">{subtitle}</div>}
          </div>
          <IconButton icon={<MdClose />} label="Закрити панель" size="sm" onClick={onClose} className="-mr-2" />
        </header>
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-4 sm:p-5">{children}</div>
        {footer && (
          <footer className="flex flex-wrap justify-end gap-2 border-t border-(--line) bg-(--surface) px-4 py-3 pb-[max(0.75rem,var(--sab))] sm:px-5">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
};

// Секція-картка форми
export const Section = ({ title, hint, children, actions, className = "" }) => (
  <section className={cx("flex min-w-0 flex-col gap-4 rounded-(--r-lg) border border-(--line) bg-(--surface) p-4 shadow-(--shadow-1) sm:p-5", className)}>
    {(title || actions) && (
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          {title && <h3 className="text-base font-semibold text-(--ink)">{title}</h3>}
          {hint && <p className="mt-0.5 text-sm text-(--ink-2)">{hint}</p>}
        </div>
        {actions}
      </div>
    )}
    {children}
  </section>
);

// Навігація-вкладки посиланнями (сторінки підрозділу)
export const LinkTabs = ({ items, current, label }) => (
  <nav aria-label={label} className="w-full overflow-x-auto">
    <ul className="flex min-w-max gap-1 border-b border-(--line)">
      {items.map((t) => (
        <li key={t.id}>
          <Link
            to={t.to}
            aria-current={current === t.id ? "page" : undefined}
            className={cx(
              "-mb-px flex h-11 items-center whitespace-nowrap border-b-2 px-3 text-sm font-medium transition-colors",
              current === t.id ? "border-(--brand) text-(--brand-ink)" : "border-transparent text-(--ink-2) hover:text-(--ink)",
            )}
          >
            {t.label}
          </Link>
        </li>
      ))}
    </ul>
  </nav>
);

// Select: options — пари [value, text]; onChange(value)
export const Select = ({ id, value, onChange, options, placeholder, label, className = "" }) => (
  <select id={id} aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className={cx(inputCls, "pr-8", className)}>
    {placeholder != null && <option value="">{placeholder}</option>}
    {options.map(([v, t]) => (
      <option key={v} value={v}>
        {t}
      </option>
    ))}
  </select>
);

export const Stat = ({ label, value, hint, tone }) => (
  <div className={cx("min-w-0 rounded-(--r-md) border bg-(--surface) p-3", tone === "bad" ? "border-(--danger)" : "border-(--line)")}>
    <KitStat label={label} value={value} hint={hint} />
  </div>
);

// Поле тегів з автодоповненням (combobox)
export const TagInput = ({ id, value, onChange, suggestions = [], max = 30, label = "Теги" }) => {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(-1);
  const term = q.trim().toLowerCase();
  const list = suggestions.filter((s) => !value.includes(s) && (!term || s.includes(term))).slice(0, 8);
  const add = (t) => {
    const v = String(t || "").trim().toLowerCase().slice(0, 40);
    if (!v || value.includes(v) || value.length >= max) return;
    onChange([...value, v]);
    setQ("");
    setHi(-1);
  };
  const onKey = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setHi((h) => Math.min(list.length - 1, h + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHi((h) => Math.max(-1, h - 1));
    } else if (e.key === "Enter" || e.key === ",") {
      if (q.trim() || hi >= 0) {
        e.preventDefault();
        add(hi >= 0 && list[hi] ? list[hi] : q);
      }
    } else if (e.key === "Backspace" && !q && value.length) {
      onChange(value.slice(0, -1));
    } else if (e.key === "Escape" && open) {
      e.stopPropagation();
      setOpen(false);
    }
  };
  return (
    <div className="flex flex-col gap-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1" aria-label={label}>
          {value.map((t) => (
            <Chip key={t} onRemove={() => onChange(value.filter((x) => x !== t))} removeLabel={`Прибрати тег ${t}`}>
              {t}
            </Chip>
          ))}
        </div>
      )}
      <div className="relative">
        <input
          id={id}
          role="combobox"
          aria-expanded={open && list.length > 0}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-activedescendant={hi >= 0 ? `${id}-opt-${hi}` : undefined}
          className={inputCls}
          value={q}
          autoComplete="off"
          placeholder={value.length >= max ? `Максимум ${max} тегів` : "Введіть тег і натисніть Enter"}
          disabled={value.length >= max}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
            setHi(-1);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={onKey}
        />
        {open && list.length > 0 && (
          <ul
            id={`${id}-list`}
            role="listbox"
            className="absolute z-20 mt-1 max-h-52 w-full overflow-auto rounded-(--r-md) border border-(--line) bg-(--surface) py-1 shadow-(--shadow-2)"
          >
            {list.map((s, i) => (
              <li
                key={s}
                id={`${id}-opt-${i}`}
                role="option"
                aria-selected={hi === i}
                onMouseDown={(e) => {
                  e.preventDefault();
                  add(s);
                }}
                className={cx("cursor-pointer px-3 py-2.5 text-sm", hi === i ? "bg-(--brand-soft) text-(--brand-ink)" : "text-(--ink) hover:bg-(--surface-2)")}
              >
                {s}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
