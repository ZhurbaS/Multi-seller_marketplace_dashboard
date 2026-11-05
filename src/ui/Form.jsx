import { Children, cloneElement, isValidElement, useId } from "react";
import { MdExpandMore } from "react-icons/md";
import { cx } from "./cx";

const CONTROL =
  "w-full min-w-0 rounded-(--r-md) border bg-(--surface) text-(--ink) transition-colors " +
  "placeholder:text-(--ink-2)/80 hover:border-(--line-strong) " +
  "focus:border-(--brand) focus:outline-none focus:ring-2 focus:ring-(--brand)/25 " +
  "disabled:cursor-not-allowed disabled:bg-(--surface-2) disabled:text-(--ink-2) disabled:opacity-80 " +
  "read-only:bg-(--surface-2)";

function border(invalid) {
  return invalid ? "border-(--danger) focus:border-(--danger) focus:ring-(--danger)/25" : "border-(--line)";
}

/**
 * Field({ label, hint, error, required, children, htmlFor, className })
 * Лейбл над полем, інлайн-помилка. Єдиній дитині автоматично передаються
 * id, aria-describedby, aria-invalid, required (якщо не задані).
 */
export function Field({ label, hint, error, required = false, htmlFor, className, children }) {
  const auto = useId();
  const only = Children.count(children) === 1 && isValidElement(children) ? children : null;
  const id = htmlFor || only?.props?.id || `f${auto}`;
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-err` : undefined;
  const describedBy = [only?.props?.["aria-describedby"], hintId, errId].filter(Boolean).join(" ") || undefined;
  const child = only
    ? cloneElement(only, {
        id,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : only.props["aria-invalid"],
        ...(typeof only.type === "string" ? {} : { invalid: only.props.invalid ?? (error ? true : undefined) }),
        required: only.props.required ?? (required || undefined),
      })
    : children;
  return (
    <div className={cx("flex min-w-0 flex-col gap-1.5", className)}>
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
      {child}
      {hint && !error && (
        <p id={hintId} className="text-xs text-(--ink-2)">
          {hint}
        </p>
      )}
      {error && (
        <p id={errId} role="alert" className="text-xs font-medium text-(--danger)">
          {error}
        </p>
      )}
    </div>
  );
}

/** Input({ invalid, leftIcon, rightSlot, size: md|sm, className, ...input props }) — висота 44px. */
export function Input({ invalid, leftIcon, rightSlot, size = "md", className, ref, type = "text", ...rest }) {
  const h = size === "sm" ? "h-9" : "h-11";
  if (!leftIcon && !rightSlot) {
    return <input ref={ref} type={type} className={cx(CONTROL, border(invalid), h, "px-3", className)} {...rest} />;
  }
  return (
    <div className={cx("relative flex min-w-0 items-center", className)}>
      {leftIcon && (
        <span aria-hidden="true" className="pointer-events-none absolute left-3 inline-flex text-(--ink-2)">
          {leftIcon}
        </span>
      )}
      <input
        ref={ref}
        type={type}
        className={cx(CONTROL, border(invalid), h, leftIcon ? "pl-9" : "pl-3", rightSlot ? "pr-11" : "pr-3")}
        {...rest}
      />
      {rightSlot && <span className="absolute right-1 inline-flex items-center">{rightSlot}</span>}
    </div>
  );
}

/**
 * Select({ options:[{value,label,disabled?}], placeholder, invalid, size, children, ...select props })
 * Можна передати <option> дітьми замість options.
 */
export function Select({ options, placeholder, invalid, size = "md", className, children, ref, ...rest }) {
  const h = size === "sm" ? "h-9" : "h-11";
  return (
    <div className={cx("relative min-w-0", className)}>
      <select ref={ref} className={cx(CONTROL, border(invalid), h, "appearance-none pl-3 pr-9")} {...rest}>
        {placeholder !== undefined && (
          <option value="" disabled={rest.required}>
            {placeholder}
          </option>
        )}
        {Array.isArray(options)
          ? options.map((o) => (
              <option key={String(o.value)} value={o.value} disabled={o.disabled}>
                {o.label}
              </option>
            ))
          : children}
      </select>
      <MdExpandMore aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-lg text-(--ink-2)" />
    </div>
  );
}

/** Textarea({ invalid, rows=4, ...textarea props }) */
export function Textarea({ invalid, rows = 4, className, ref, ...rest }) {
  return <textarea ref={ref} rows={rows} className={cx(CONTROL, border(invalid), "min-h-[5.5rem] px-3 py-2.5 leading-6", className)} {...rest} />;
}

/**
 * Checkbox({ label, description, checked, onChange(event), disabled, invalid, ...input props })
 * onChange — НАТИВНА подія (e.target.checked), як у звичайного input.
 */
export function Checkbox({ label, description, invalid, className, id, ref, ...rest }) {
  const auto = useId();
  const cid = id || `c${auto}`;
  return (
    <div className={cx("flex min-w-0 items-start gap-2.5", className)}>
      <span className="flex h-6 items-center">
        <input
          ref={ref}
          id={cid}
          type="checkbox"
          aria-invalid={invalid || undefined}
          className={cx(
            "h-5 w-5 shrink-0 cursor-pointer rounded-(--r-sm) border accent-(--brand) disabled:cursor-not-allowed",
            invalid ? "border-(--danger)" : "border-(--line-strong)",
          )}
          {...rest}
        />
      </span>
      {(label || description) && (
        <label htmlFor={cid} className="min-w-0 cursor-pointer select-none">
          {label && <span className="block text-[0.9375rem] leading-6 text-(--ink)">{label}</span>}
          {description && <span className="block text-xs text-(--ink-2)">{description}</span>}
        </label>
      )}
    </div>
  );
}

/**
 * Switch({ checked, onChange(checked:boolean), label, description, disabled, size: md|sm })
 * onChange отримує BOOLEAN (не подію).
 */
export function Switch({ checked = false, onChange, label, description, disabled = false, size = "md", id, className, ...rest }) {
  const auto = useId();
  const sid = id || `s${auto}`;
  const sm = size === "sm";
  return (
    <div className={cx("flex min-w-0 items-start gap-3", className)}>
      <button
        id={sid}
        type="button"
        role="switch"
        aria-checked={!!checked}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={cx(
          "relative inline-flex shrink-0 items-center rounded-full border border-transparent transition-colors disabled:cursor-not-allowed disabled:opacity-55",
          sm ? "h-5 w-9" : "h-6 w-11",
          checked ? "bg-(--brand)" : "bg-(--line-strong)",
        )}
        {...rest}
      >
        <span
          aria-hidden="true"
          className={cx(
            "inline-block rounded-full bg-white shadow transition-transform",
            sm ? "h-4 w-4" : "h-5 w-5",
            checked ? (sm ? "translate-x-4" : "translate-x-5") : "translate-x-0.5",
          )}
        />
      </button>
      {(label || description) && (
        <label htmlFor={sid} className="min-w-0 cursor-pointer select-none">
          {label && <span className="block text-[0.9375rem] leading-6 text-(--ink)">{label}</span>}
          {description && <span className="block text-xs text-(--ink-2)">{description}</span>}
        </label>
      )}
    </div>
  );
}
