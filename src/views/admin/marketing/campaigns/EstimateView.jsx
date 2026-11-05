// Результат POST /campaigns/:id/estimate: {total, eligible, excluded:{…}, byChannel:{email,telegram}, estimatedDays, dailyLimit, warnings}
import React from "react";
import { SKIP_REASONS, num, pct } from "../mkUtils";
import { Notice, Stat } from "../ui";

const EstimateView = ({ data, compact = false }) => {
  if (!data) return null;
  const ex = data.excluded || {};
  const excludedTotal = Object.values(ex).reduce((a, n) => a + (Number(n) || 0), 0);
  const rows = Object.entries(ex)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1]);
  return (
    <div className="flex flex-col gap-3" aria-live="polite">
      <div className={`grid gap-2 ${compact ? "grid-cols-2" : "grid-cols-2 md:grid-cols-4"}`}>
        <Stat label="Отримають" value={num(data.eligible)} hint={`${pct(data.eligible, data.total)} від вибірки`} tone={data.eligible ? undefined : "bad"} />
        <Stat label="У вибірці" value={num(data.total)} />
        {!compact && <Stat label="Email" value={num(data.byChannel?.email)} />}
        {!compact && <Stat label="Telegram" value={num(data.byChannel?.telegram)} />}
      </div>
      {data.estimatedDays > 1 && (
        <Notice tone="warn">
          З денним лімітом {num(data.dailyLimit)} листів відправка займе приблизно <b>{num(data.estimatedDays)} дн.</b> Ліміт змінюється в «Підписка: аналітика → Налаштування».
        </Notice>
      )}
      {(data.warnings || []).map((w) => (
        <Notice key={w} tone="warn">
          {w}
        </Notice>
      ))}
      {excludedTotal > 0 && (
        <details className="rounded-(--r-md) border border-(--line) bg-(--surface-2) p-3" open={!compact}>
          <summary className="min-h-6 cursor-pointer text-sm font-semibold text-(--ink)">
            Чому не всім? Виключено {num(excludedTotal)} {excludedTotal === 1 ? "контакт" : "контактів"}
          </summary>
          <ul className="mt-2 flex flex-col gap-2">
            {rows.map(([k, n]) => (
              <li key={k} className="flex flex-col gap-0.5 text-sm text-(--ink)">
                <div className="flex justify-between gap-2">
                  <span>{SKIP_REASONS[k]?.label || k}</span>
                  <b className="tabular-nums">{num(n)}</b>
                </div>
                <div className="h-2 overflow-hidden rounded bg-(--surface)" aria-hidden="true">
                  <div className="h-full bg-(--warning)" style={{ width: `${(100 * n) / Math.max(1, data.total)}%` }} />
                </div>
                {SKIP_REASONS[k]?.hint && <span className="text-xs text-(--ink-2)">{SKIP_REASONS[k].hint}</span>}
              </li>
            ))}
          </ul>
          <p className="pt-2 text-xs text-(--ink-2)">Згоду й статуси перевіряємо ще раз перед кожною відправкою — фактична кількість може трохи відрізнятися.</p>
        </details>
      )}
    </div>
  );
};

export default EstimateView;
