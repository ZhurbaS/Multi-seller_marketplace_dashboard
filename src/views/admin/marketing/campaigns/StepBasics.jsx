// Крок 1: назва, тема листа, прехедер, тема розсилки, канали
import React from "react";
import { CAMPAIGN_TOPICS, inputCls } from "../mkUtils";
import { Counter, Field, Notice, Section } from "../ui";
import { CHANNEL_LABELS, PREHEADER_MAX, SUBJECT_MAX, SUBJECT_SOFT } from "./campaignUtils";

const TOPIC_HINTS = {
  promo: "Знижки, акції, розпродажі. Отримують ті, хто не вимкнув тему «Акції».",
  news: "Нові товари й новини магазину.",
  tips: "Поради, огляди, інструкції. За замовчуванням ця тема вимкнена в нових підписників.",
};

const StepBasics = ({ form, set, errors }) => {
  const subjLen = form.subject.length;
  const toggleChannel = (ch, on) => set((f) => ({ channels: on ? [...new Set([...f.channels, ch])] : f.channels.filter((c) => c !== ch) }));
  return (
    <>
      <h2 className="text-lg font-semibold text-(--ink)">Крок 1. Основне</h2>
      <Section title="Лист" hint="Назва для команди, тема й прехедер, які бачать отримувачі.">
      <div className="grid gap-4 lg:grid-cols-2">
        <Field id="cw-name" label="Внутрішня назва"
          required hint="Бачать лише адміністратори, напр. «Black Friday — підписники»." error={errors.name} counter={<Counter value={form.name} max={200} />}>
          <input
            id="cw-name"
            data-autofocus
            className={inputCls}
            value={form.name}
            maxLength={200}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? "cw-name-err" : "cw-name-hint"}
            onChange={(e) => set({ name: e.target.value })}
          />
        </Field>
        <Field
          id="cw-subject"
          label="Тема листа"
          required={form.channels.includes("email")}
          error={errors.subject}
          hint={subjLen > SUBJECT_SOFT ? `Довга тема обріжеться на мобільних (рекомендовано до ${SUBJECT_SOFT} символів).` : "Коротко й по суті; без «КАПСУ» і багатьох «!!!» — це тригери спам-фільтрів."}
          counter={<Counter value={form.subject} max={SUBJECT_MAX} />}
        >
          <input
            id="cw-subject"
            className={inputCls}
            value={form.subject}
            maxLength={SUBJECT_MAX}
            aria-invalid={errors.subject ? true : undefined}
            aria-describedby={errors.subject ? "cw-subject-err" : "cw-subject-hint"}
            onChange={(e) => set({ subject: e.target.value })}
          />
        </Field>
        <Field id="cw-pre" label="Прехедер (текст після теми у списку листів)" hint="Необов'язково; 40–100 символів доповнюють тему." counter={<Counter value={form.preheader} max={PREHEADER_MAX} />}>
          <input id="cw-pre" className={inputCls} value={form.preheader} maxLength={PREHEADER_MAX} aria-describedby="cw-pre-hint" onChange={(e) => set({ preheader: e.target.value })} />
        </Field>
        <Field id="cw-utm" label="UTM-мітка кампанії (utm_campaign)" hint="Необов'язково; латиниця, цифри, «-», «_». Додається до посилань на сайт.">
          <input
            id="cw-utm"
            className={inputCls}
            value={form.utm.campaign}
            maxLength={100}
            aria-describedby="cw-utm-hint"
            placeholder="black-friday-2026"
            onChange={(e) => set((f) => ({ utm: { ...f.utm, campaign: e.target.value.replace(/[^\w.-]/g, "_") } }))}
          />
        </Field>
      </div>
      </Section>

      <Section title="Тема розсилки" hint="Контакти отримують лише теми, які не вимкнули в налаштуваннях підписки.">
        <fieldset className="grid gap-2 sm:grid-cols-3">
          <legend className="sr-only">Тема розсилки</legend>
          {Object.entries(CAMPAIGN_TOPICS).map(([k, label]) => (
            <label key={k} className={`flex min-h-11 cursor-pointer items-start gap-2 rounded-(--r-md) border p-3 transition-colors ${
                form.topic === k ? "border-(--brand) bg-(--brand-soft) ring-1 ring-(--brand)" : "border-(--line) bg-(--surface) hover:bg-(--surface-2)"
              }`}>
              <input type="radio" name="cw-topic" className="mt-1 h-4 w-4 accent-(--brand)" checked={form.topic === k} onChange={() => set({ topic: k })} />
              <span>
                <b className="text-sm text-(--ink)">{label}</b>
                <span className="block text-xs text-(--ink-2)">{TOPIC_HINTS[k]}</span>
              </span>
            </label>
          ))}
        </fieldset>
      </Section>

      <Section title="Канали" hint="Telegram отримають лише контакти, які підписались у боті.">
        <fieldset className="flex flex-wrap gap-4" aria-describedby={errors.channels ? "cw-ch-err" : undefined}>
          <legend className="sr-only">Канали відправки</legend>
          {Object.entries(CHANNEL_LABELS).map(([ch, label]) => (
            <label key={ch} className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-(--ink)">
              <input type="checkbox" className="h-5 w-5 accent-(--brand)" checked={form.channels.includes(ch)} onChange={(e) => toggleChannel(ch, e.target.checked)} />
              {label}
            </label>
          ))}
        </fieldset>
        {errors.channels && (
          <span id="cw-ch-err" role="alert" className="text-xs font-medium text-(--danger)">
            {errors.channels}
          </span>
        )}
        {form.channels.includes("telegram") && (
          <Notice>Для Telegram використовується окремий короткий текст (крок «Зміст»). Якщо його не задати — береться заголовок, перший абзац і перша кнопка листа.</Notice>
        )}
      </Section>
    </>
  );
};

export default StepBasics;
