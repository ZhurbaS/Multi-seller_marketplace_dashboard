// Поля редагування одного блоку листа (MARKETING_SPEC.md §2)
import React from "react";
import { inputCls } from "../mkUtils";
import { Counter, Field, Segmented } from "../ui";
import ProductPicker from "./ProductPicker";

const inp = (err) => `${inputCls} ${err ? "!border-(--danger) focus:!ring-(--danger)/25" : ""}`;
const a11y = (id, err) => ({ id, "aria-invalid": err ? true : undefined, "aria-describedby": err ? `${id}-err` : `${id}-hint` });

const BlockFields = ({ block: b, onChange, errors = {}, idBase }) => {
  const set = (k) => (e) => onChange({ ...b, [k]: e?.target ? e.target.value : e });
  const id = (k) => `${idBase}-${k}`;
  switch (b.type) {
    case "heading":
      return (
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] items-end">
          <Field id={id("text")} label="Текст заголовка" error={errors.text} counter={<Counter value={b.text} max={200} />}>
            <input {...a11y(id("text"), errors.text)} className={inp(errors.text)} value={b.text || ""} maxLength={200} onChange={set("text")} />
          </Field>
          <Segmented
            label="Розмір заголовка"
            size="sm"
            value={Number(b.level) === 2 ? "2" : "1"}
            onChange={(v) => onChange({ ...b, level: Number(v) })}
            options={[
              ["1", "Великий"],
              ["2", "Середній"],
            ]}
          />
        </div>
      );
    case "text":
      return (
        <Field
          id={id("text")}
          label="Текст"
          error={errors.text}
          hint="**жирний**, [текст посилання](https://…), порожній рядок — новий абзац."
          counter={<Counter value={b.text} max={5000} />}
        >
          <textarea {...a11y(id("text"), errors.text)} rows={5} className={inp(errors.text)} value={b.text || ""} maxLength={5000} onChange={set("text")} />
        </Field>
      );
    case "button":
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field id={id("label")} label="Текст кнопки" error={errors.label} counter={<Counter value={b.label} max={80} />}>
            <input {...a11y(id("label"), errors.label)} className={inp(errors.label)} value={b.label || ""} maxLength={80} onChange={set("label")} placeholder="Перейти до акції" />
          </Field>
          <Field id={id("url")} label="Посилання" error={errors.url} hint="https://… або шлях сайту, напр. /shops">
            <input {...a11y(id("url"), errors.url)} className={inp(errors.url)} value={b.url || ""} maxLength={1000} onChange={set("url")} inputMode="url" placeholder="https://" />
          </Field>
        </div>
      );
    case "image":
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field id={id("url")} label="Адреса зображення" error={errors.url} hint="Ширина листа — 600 px; JPG/PNG до ~300 КБ.">
            <input {...a11y(id("url"), errors.url)} className={inp(errors.url)} value={b.url || ""} maxLength={1000} onChange={set("url")} inputMode="url" placeholder="https://…/banner.jpg" />
          </Field>
          <Field id={id("alt")} label="Опис (alt) для незрячих і вимкнених картинок" error={errors.alt}>
            <input {...a11y(id("alt"), errors.alt)} className={inp(errors.alt)} value={b.alt || ""} maxLength={200} onChange={set("alt")} />
          </Field>
          <Field id={id("href")} label="Посилання при натисканні (необов'язково)" error={errors.href}>
            <input {...a11y(id("href"), errors.href)} className={inp(errors.href)} value={b.href || ""} maxLength={1000} onChange={set("href")} inputMode="url" />
          </Field>
          {b.url && !errors.url && /^https?:\/\//i.test(b.url) && (
            <img src={b.url} alt={b.alt || ""} className="max-h-28 w-auto self-end justify-self-start rounded-(--r-sm) border border-(--line) bg-(--surface-2)" loading="lazy" />
          )}
        </div>
      );
    case "products":
      return (
        <div className="flex flex-col gap-3">
          <Field id={id("title")} label="Заголовок добірки (необов'язково)" counter={<Counter value={b.title} max={200} />}>
            <input id={id("title")} className={inputCls} value={b.title || ""} maxLength={200} onChange={set("title")} placeholder="Хіти тижня" />
          </Field>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-(--ink)">Товари (до 6; ціни й фото беруться на момент відправки)</span>
            <ProductPicker id={id("search")} value={b.productIds || []} onChange={(productIds) => onChange({ ...b, productIds })} invalid={!!errors.productIds} />
            {errors.productIds && (
              <span role="alert" className="text-xs font-medium text-(--danger)">
                {errors.productIds}
              </span>
            )}
          </div>
        </div>
      );
    case "divider":
      return <p className="text-xs text-(--ink-2)">Горизонтальна лінія між розділами листа.</p>;
    case "spacer":
      return <p className="text-xs text-(--ink-2)">Порожній відступ (≈24 px).</p>;
    case "banner":
      return <p className="text-xs text-(--ink-2)">Банер сайту (id {b.bannerId}). Редагується в розділі «Банери».</p>;
    default:
      return <p className="text-xs text-(--ink-2)">Невідомий тип блоку — його буде пропущено.</p>;
  }
};

export default BlockFields;
