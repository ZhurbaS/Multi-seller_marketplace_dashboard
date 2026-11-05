import { Button, Card, CardBody, CardHeader, cx } from "../../ui";

/** Секція-картка форми: заголовок + опис + тіло з відступами між полями. */
export function FormSection({ title, description, icon, actions, className, bodyClassName, children }) {
  return (
    <Card as="section" className={className}>
      <CardHeader title={title} description={description} icon={icon} actions={actions} />
      <CardBody className={cx("flex flex-col gap-4", bodyClassName)}>{children}</CardBody>
    </Card>
  );
}

/** Підказка з лічильником символів для Field.hint: «текст … 12 / 200». */
export function CountHint({ text, length = 0, max }) {
  const over = max && length > max;
  const near = max && length > max * 0.9;
  return (
    <span className="flex min-w-0 items-start justify-between gap-3">
      <span className="min-w-0">{text}</span>
      <span
        aria-live="polite"
        className={cx("shrink-0 tabular-nums", over ? "font-semibold text-(--danger)" : near ? "text-(--warning-ink)" : "text-(--ink-2)")}
      >
        {length}
        {max ? ` / ${max}` : ""}
      </span>
    </span>
  );
}

/**
 * Sticky-панель дій форми (низ екрана). Розміщувати ВСЕРЕДИНІ <form> — кнопка «Зберегти» має type=submit.
 * dirty — показує статус «Є незбережені зміни»; loading — спінер і disabled.
 */
export function FormActionsBar({
  dirty = false,
  loading = false,
  submitLabel = "Зберегти",
  cancelLabel = "Скасувати",
  onCancel,
  disabled = false,
  savedText = "Змін немає",
  extra,
}) {
  return (
    <div className="sticky bottom-0 z-20 -mx-3 mt-6 border-t border-(--line) bg-(--surface)/95 px-3 py-3 pb-[max(0.75rem,var(--sab))] shadow-(--shadow-2) backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-3">
        <p className="flex min-w-0 flex-1 items-center gap-2 text-sm text-(--ink-2)" aria-live="polite">
          <span
            aria-hidden="true"
            className={cx("h-2 w-2 shrink-0 rounded-full", dirty ? "bg-(--warning)" : "bg-(--success)")}
          />
          <span className="truncate">{loading ? "Збереження…" : dirty ? "Є незбережені зміни" : savedText}</span>
        </p>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          {extra}
          {onCancel && (
            <Button variant="secondary" onClick={onCancel} disabled={loading} className="flex-1 sm:flex-none">
              {cancelLabel}
            </Button>
          )}
          <Button type="submit" loading={loading} disabled={disabled} className="flex-1 sm:flex-none sm:min-w-40">
            {submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Рядок «ключ — значення» для карток-описів (dl). */
export function InfoRow({ label, children }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5 py-2.5 sm:flex-row sm:items-baseline sm:gap-4">
      <dt className="shrink-0 text-sm text-(--ink-2) sm:w-40">{label}</dt>
      <dd className="min-w-0 break-words text-[0.9375rem] text-(--ink)">{children ?? "—"}</dd>
    </div>
  );
}
