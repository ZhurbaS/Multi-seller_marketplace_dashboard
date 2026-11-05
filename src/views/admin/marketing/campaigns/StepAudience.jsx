// Крок 2: сегмент або ad-hoc правила + «Порахувати» (estimate з розбивкою «Чому не всім»)
import React from "react";
import { Link } from "react-router-dom";
import { useApiGet } from "../hooks";
import { MdCalculate } from "react-icons/md";
import { Button } from "../../../../ui";
import { BASE, CRM, fmtDate, inputCls, isSystemSegment, listOf, num } from "../mkUtils";
import { describeFilter } from "../segmentFields";
import { LivePreview, RuleBuilder } from "../RuleBuilder";
import { ErrorBox, Section, Segmented, Skeleton } from "../ui";
import EstimateView from "./EstimateView";

const StepAudience = ({ form, set, errors, estimate, fresh, onEstimate }) => {
  const res = useApiGet(`${CRM}/segments`);
  const segments = listOf(res.data, "segments");
  const current = segments.find((s) => String(s._id) === form.segmentId);
  const groups = [
    ["Власні", segments.filter((s) => !isSystemSegment(s))],
    ["Системні", segments.filter(isSystemSegment)],
  ];
  return (
    <>
      <h2 className="text-lg font-semibold text-(--ink)">Крок 2. Кому</h2>
      <div className="overflow-x-auto">
        <Segmented
          label="Спосіб вибору отримувачів"
          value={form.audience}
          onChange={(audience) => set({ audience })}
          options={[
            ["segment", "Збережений сегмент"],
            ["rules", "Власні правила для цієї розсилки"],
          ]}
        />
      </div>
      {form.audience === "segment" ? (
        <Section title="Сегмент" hint="Склад сегмента рахується на момент відправки.">
          <ErrorBox error={res.error} missing={res.missing} onRetry={res.reload} />
          {res.loading && !res.data ? (
            <Skeleton rows={3} />
          ) : (
            <div className="flex flex-col gap-2">
              <label htmlFor="cw-seg" className="text-sm font-medium text-(--ink)">
                Оберіть сегмент
                <span className="ml-0.5 text-(--danger)" aria-hidden="true">
                  *
                </span>
              </label>
              <select
                id="cw-seg"
                className={`${inputCls} pr-8 ${errors.segmentId ? "!border-(--danger)" : ""}`}
                required
                aria-describedby={errors.segmentId ? "cw-seg-err" : undefined}
                value={form.segmentId}
                aria-invalid={errors.segmentId ? true : undefined}
                onChange={(e) => set({ segmentId: e.target.value })}
              >
                <option value="">— не обрано —</option>
                {groups.map(([label, list]) =>
                  list.length ? (
                    <optgroup key={label} label={label}>
                      {list.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.name}
                          {s.cachedCount != null ? ` (≈${num(s.cachedCount)})` : ""}
                        </option>
                      ))}
                    </optgroup>
                  ) : null
                )}
              </select>
              {errors.segmentId && (
                <span id="cw-seg-err" role="alert" className="text-xs font-medium text-(--danger)">
                  {errors.segmentId}
                </span>
              )}
              {current && (
                <p className="text-sm text-(--ink-2)">
                  {current.description || describeFilter(current.filter)}
                  {current.cachedAt && <span> · оцінка ≈{num(current.cachedCount)} на {fmtDate(current.cachedAt)}</span>}
                </p>
              )}
              <p className="text-xs text-(--ink-2)">
                Потрібен інший?{" "}
                <Link to={`${BASE}/segments?id=new`} className="font-medium text-(--brand-ink) underline">Створіть сегмент</Link> або оберіть «Власні правила».
              </p>
            </div>
          )}
        </Section>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] items-start">
          <Section title="Правила" hint="Діють лише для цієї розсилки; щоб використовувати повторно — збережіть як сегмент.">
            <RuleBuilder filter={form.filter} onChange={(filter) => set({ filter })} showErrors={!!errors.filter} />
            {errors.filter && (
              <span role="alert" className="text-xs font-medium text-(--danger)">
                {errors.filter}
              </span>
            )}
          </Section>
          <Section title="Збіг за правилами">
            <LivePreview filter={form.filter} />
          </Section>
        </div>
      )}

      <Section
        title="Скільки отримають"
        hint="Враховує згоду, тему розсилки, стоп-список, ліміт частоти й наявність адреси."
        actions={
          <Button icon={<MdCalculate />} onClick={onEstimate} loading={estimate.loading}>
            {estimate.loading ? "Рахуємо…" : estimate.data ? "Перерахувати" : "Порахувати"}
          </Button>
        }
      >
        {estimate.error && <ErrorBox error={estimate.error} />}
        {estimate.data && !fresh && <p className="text-xs font-medium text-(--warning-ink)">Аудиторію змінено — натисніть «Перерахувати».</p>}
        {estimate.data ? (
          <div className={fresh ? "" : "opacity-60"}>
            <EstimateView data={estimate.data} />
          </div>
        ) : (
          !estimate.loading && <p className="text-sm text-(--ink-2)">Натисніть «Порахувати», щоб побачити кількість отримувачів і причини виключень.</p>
        )}
      </Section>
    </>
  );
};

export default StepAudience;
