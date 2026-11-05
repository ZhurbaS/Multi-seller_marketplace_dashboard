// Спільна оболонка сторінок «Аналітики» продавця: шапка з періодом і експортом, стан помилки, дрібні блоки.
import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { MdDownload, MdErrorOutline, MdRefresh, MdImageNotSupported, MdInfoOutline } from "react-icons/md";
import { Button, Card, DateRangePicker, EmptyState, InfoTip, PageHeader, Spinner, cx } from "../../../../ui";
import { downloadCsv } from "./exportCsv";
import { withPeriod } from "./period";

/** Кнопка «Експорт CSV» (axios blob, cookie-сесія). */
export function ExportButton({ report, query, label = "CSV" }) {
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    try {
      await downloadCsv(report, query);
    } catch (e) {
      toast.error(e.message || "Не вдалося сформувати файл");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Button variant="secondary" icon={<MdDownload aria-hidden="true" />} loading={busy} onClick={run} aria-label={`Експорт ${label}`}>
      <span>Експорт {label}</span>
    </Button>
  );
}

/** Помилка завантаження з повтором. */
export function ErrorState({ text, onRetry }) {
  return (
    <Card padded>
      <EmptyState
        icon={<MdErrorOutline aria-hidden="true" />}
        title="Не вдалося завантажити дані"
        text={text}
        action={
          onRetry && (
            <Button variant="secondary" icon={<MdRefresh aria-hidden="true" />} onClick={onRetry}>
              Спробувати ще раз
            </Button>
          )
        }
      />
    </Card>
  );
}

/** Примітка (мала вибірка, пояснення). tone: info|warning */
export function Note({ children, tone = "info", className }) {
  return (
    <p
      className={cx(
        "flex min-w-0 items-start gap-2 rounded-(--r-md) border px-3 py-2 text-sm",
        tone === "warning" ? "border-(--warning) bg-(--surface-2) text-(--ink)" : "border-(--line) bg-(--surface-2) text-(--ink-2)",
        className,
      )}
    >
      <MdInfoOutline aria-hidden="true" className={cx("mt-0.5 shrink-0", tone === "warning" ? "text-(--warning)" : "text-(--ink-2)")} />
      <span className="min-w-0 break-words">{children}</span>
    </p>
  );
}

/** Мініатюра товару + назва (обрізається, не виходить за межі). */
export function ProductCell({ name, image, to, sub }) {
  const body = (
    <span className="flex min-w-0 items-center gap-3">
      {image ? (
        <img src={image} alt="" loading="lazy" className="h-10 w-10 shrink-0 rounded-(--r-sm) border border-(--line) object-cover" />
      ) : (
        <span aria-hidden="true" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-(--r-sm) border border-(--line) bg-(--surface-2) text-(--ink-2)">
          <MdImageNotSupported />
        </span>
      )}
      <span className="flex min-w-0 flex-col">
        <span className="line-clamp-2 break-words font-medium text-(--ink)" title={name}>
          {name || "Без назви"}
        </span>
        {sub && <span className="truncate text-xs text-(--ink-2)">{sub}</span>}
      </span>
    </span>
  );
  return to ? (
    <Link to={to} className="block min-w-0 hover:underline" onClick={(e) => e.stopPropagation()}>
      {body}
    </Link>
  ) : (
    body
  );
}

/**
 * AnalyticsPage({ title, description, period:{range,setRange,query}, exportReport, actions,
 *                 error, onRetry, refreshing, children })
 */
export function AnalyticsPage({ title, description, period, exportReport, actions, error, onRetry, refreshing, allowCompare = true, children }) {
  const { range, setRange, query } = period;
  return (
    <div className="min-w-0 pb-6">
      <PageHeader
        title={title}
        description={description}
        breadcrumbs={[{ label: "Аналітика", to: withPeriod("/seller/dashboard", range) }, { label: title }]}
        actions={
          <>
            {refreshing && <Spinner label="Оновлення даних" className="text-(--ink-2)" />}
            <DateRangePicker value={range} onChange={setRange} allowCompare={allowCompare} />
            {exportReport && <ExportButton report={exportReport} query={query} />}
            {actions}
          </>
        }
      />
      {error ? <ErrorState text={error} onRetry={onRetry} /> : <div className="flex min-w-0 flex-col gap-4 sm:gap-5">{children}</div>}
    </div>
  );
}

/** Посилання з періодом (для внутрішніх сторінок аналітики). */
export function PeriodLink({ to, range, className, children }) {
  return (
    <Link to={withPeriod(to, range)} className={cx("font-medium text-(--brand-ink) hover:underline", className)}>
      {children}
    </Link>
  );
}

/** Заголовок картки з підказкою «що це» (CardHeader не має prop info). */
export function TitleInfo({ title, info }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1">
      <span className="min-w-0 break-words">{title}</span>
      {info && <InfoTip text={info} />}
    </span>
  );
}
