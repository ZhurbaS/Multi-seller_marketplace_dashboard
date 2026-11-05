import React, { useEffect, useState } from "react";
import { EMAIL_STATUS, KINDS, RFM, SOURCES, TG_STATUS, TOPICS, btn, inputCls } from "../mkUtils";
import { Select } from "../ui";

const opts = (o) => Object.entries(o).map(([v, m]) => [v, typeof m === "string" ? m : m.label]);

const SORTS = [
  // ключі — як SORTS у back/controllers/crmController.js
  ["newest", "Нові спочатку"],
  ["oldest", "Старі спочатку"],
  ["activity", "Остання активність"],
  ["lastOrder", "Остання покупка"],
  ["ltv", "LTV: більші спочатку"],
  ["orders", "Замовлень: більше спочатку"],
  ["name", "Ім'я А→Я"],
];

const FILTERS = [
  ["status", "Статус email", opts(EMAIL_STATUS)],
  ["topic", "Тема", opts(TOPICS)],
  ["kind", "Тип", opts(KINDS)],
  ["source", "Джерело", opts(SOURCES)],
  ["rfm", "RFM-сегмент", opts(RFM)],
  ["telegram", "Telegram", opts(TG_STATUS)],
];

const ContactsFilters = ({ values, onChange, segments, tags, onReset }) => {
  const [q, setQ] = useState(values.q || "");
  const [city, setCity] = useState(values.city || "");
  useEffect(() => setQ(values.q || ""), [values.q]);
  useEffect(() => setCity(values.city || ""), [values.city]);
  // debounce текстових полів
  useEffect(() => {
    const t = setTimeout(() => {
      if (q !== (values.q || "")) onChange({ q });
    }, 400);
    return () => clearTimeout(t);
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const t = setTimeout(() => {
      if (city !== (values.city || "")) onChange({ city });
    }, 400);
    return () => clearTimeout(t);
  }, [city]); // eslint-disable-line react-hooks/exhaustive-deps

  const active = Object.entries(values).filter(([k, v]) => v && !["page", "sort", "contact"].includes(k)).length;

  return (
    <form role="search" aria-label="Пошук і фільтри контактів" onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-3">
      <div className="grid gap-2 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div>
          <label htmlFor="crm-q" className="sr-only">
            Пошук
          </label>
          <input id="crm-q" type="search" className={inputCls} placeholder="Пошук: ім'я, email, телефон" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div>
          <label htmlFor="crm-sort" className="sr-only">
            Сортування
          </label>
          <Select id="crm-sort" value={values.sort || "newest"} onChange={(sort) => onChange({ sort })} options={SORTS} />
        </div>
      </div>
      <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 xl:grid-cols-5">
        {FILTERS.map(([k, label, o]) => (
          <div key={k} className="flex flex-col">
            <label htmlFor={`crm-f-${k}`} className="pb-1 text-sm font-medium text-(--ink)">
              {label}
            </label>
            <Select id={`crm-f-${k}`} value={values[k] || ""} onChange={(v) => onChange({ [k]: v })} options={o} placeholder="Усі" />
          </div>
        ))}
        <div className="flex flex-col">
          <label htmlFor="crm-f-city" className="pb-1 text-sm font-medium text-(--ink)">
            Місто
          </label>
          <input id="crm-f-city" className={inputCls} value={city} onChange={(e) => setCity(e.target.value)} placeholder="Будь-яке" />
        </div>
        <div className="flex flex-col">
          <label htmlFor="crm-f-tag" className="pb-1 text-sm font-medium text-(--ink)">
            Тег
          </label>
          <Select id="crm-f-tag" value={values.tag || ""} onChange={(tag) => onChange({ tag })} options={tags.map((t) => [t, t])} placeholder="Будь-який" />
        </div>
        <div className="flex flex-col col-span-2 sm:col-span-1 xl:col-span-2">
          <label htmlFor="crm-f-seg" className="pb-1 text-sm font-medium text-(--ink)">
            Сегмент
          </label>
          <Select
            id="crm-f-seg"
            value={values.segmentId || ""}
            onChange={(segmentId) => onChange({ segmentId })}
            options={segments.map((s) => [s._id, s.name])}
            placeholder="Без сегмента"
          />
        </div>
      </div>
      {active > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-(--ink-2)">
          <span>Активних фільтрів: {active}</span>
          <button type="button" className={btn.small} onClick={onReset}>
            Скинути фільтри
          </button>
        </div>
      )}
    </form>
  );
};

export default ContactsFilters;
