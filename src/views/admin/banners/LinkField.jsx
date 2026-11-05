import React, { useEffect, useRef, useState } from "react";
import api from "../../../api/api";
import { LINK_TYPES, PAGE_OPTIONS, inputCls } from "./bannerUtils";
import { Checkbox } from "../../../ui";
import { Field, Segmented } from "./ui";

// Пошук товару з автодоповненням (combobox за WAI-ARIA)
const ProductPicker = ({ value, onPick, error }) => {
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fail, setFail] = useState("");
  const [hi, setHi] = useState(-1);
  const reqId = useRef(0);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setItems([]);
      setLoading(false);
      return undefined;
    }
    const my = ++reqId.current;
    setLoading(true);
    const t = setTimeout(() => {
      api
        .get("/admin/banners/product-search", { params: { q: term } })
        .then(({ data }) => {
          if (my !== reqId.current) return;
          setItems(data.products || []);
          setFail("");
          setHi(-1);
        })
        .catch(() => my === reqId.current && setFail("Пошук недоступний. Спробуйте пізніше."))
        .finally(() => my === reqId.current && setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const pick = (p) => {
    onPick(p);
    setQ("");
    setItems([]);
    setOpen(false);
  };

  const onKey = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setHi((h) => Math.min(items.length - 1, h + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHi((h) => Math.max(0, h - 1));
    } else if (e.key === "Enter" && open && hi >= 0 && items[hi]) {
      e.preventDefault();
      pick(items[hi]);
    } else if (e.key === "Escape" && open) {
      e.stopPropagation();
      setOpen(false);
    }
  };

  return (
    <Field
      id="bn-product"
      label="Товар"
      required
      error={error}
      hint={value.productId ? undefined : "Почніть вводити назву (мінімум 2 літери) і оберіть товар зі списку."}
    >
      {value.productId && (
        <div className="mb-2 flex items-center gap-2 rounded-(--r-md) border border-(--line) bg-(--surface-2) p-2 text-sm">
          {value.productImage && <img src={value.productImage} alt="" className="h-10 w-10 rounded-(--r-sm) object-cover" />}
          <span className="flex-1 min-w-0 truncate">
            <b>{value.productName || value.productSlug || value.productId}</b>
          </span>
          <button type="button" onClick={() => onPick(null)} className="min-h-9 rounded-(--r-sm) px-2 text-sm font-medium text-(--brand-ink) hover:bg-(--brand-soft)">
            Змінити
          </button>
        </div>
      )}
      <div className="relative">
        <input
          id="bn-product"
          className={inputCls}
          role="combobox"
          aria-expanded={open && items.length > 0}
          aria-controls="bn-product-list"
          aria-autocomplete="list"
          aria-activedescendant={hi >= 0 ? `bn-product-opt-${hi}` : undefined}
          aria-invalid={!!error}
          autoComplete="off"
          value={q}
          placeholder={value.productId ? "Пошук іншого товару…" : "Напр. ноутбук Lenovo"}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={onKey}
        />
        {open && q.trim().length >= 2 && (
          <ul
            id="bn-product-list"
            role="listbox"
            className="absolute left-0 right-0 z-20 mt-1 max-h-64 overflow-auto rounded-(--r-md) border border-(--line) bg-(--surface) py-1 shadow-(--shadow-2)"
          >
            {loading && <li className="px-3 py-2.5 text-sm text-(--ink-2)">Пошук…</li>}
            {!loading && fail && <li className="px-3 py-2.5 text-sm text-(--danger)">{fail}</li>}
            {!loading && !fail && items.length === 0 && <li className="px-3 py-2.5 text-sm text-(--ink-2)">Нічого не знайдено</li>}
            {!loading &&
              items.map((p, i) => (
                <li
                  key={p._id}
                  id={`bn-product-opt-${i}`}
                  role="option"
                  aria-selected={hi === i}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    pick(p);
                  }}
                  onMouseEnter={() => setHi(i)}
                  className={`flex min-h-11 cursor-pointer items-center gap-2 px-3 py-1.5 text-sm ${hi === i ? "bg-(--brand-soft) text-(--brand-ink)" : "text-(--ink)"}`}
                >
                  {p.image && <img src={p.image} alt="" className="h-8 w-8 rounded-(--r-sm) object-cover" />}
                  <span className="truncate">{p.name}</span>
                </li>
              ))}
          </ul>
        )}
      </div>
    </Field>
  );
};

const LinkField = ({ f, set, patch, categories, catError, errors }) => (
  <fieldset className="flex flex-col gap-3">
    <legend className="pb-2 text-sm font-semibold text-(--ink)">Куди веде банер</legend>
    <Segmented
      label="Тип посилання"
      value={f.linkType}
      onChange={(v) => patch({ linkType: v, ...(v === "url" && f.linkType !== "url" ? { newTab: true } : {}) })}
      options={LINK_TYPES}
      size="sm"
    />
    {f.linkType === "none" && (
      <p className="text-sm text-(--ink-2)">Банер не буде клікабельним. Кнопка-заклик (CTA) у такому разі не показується.</p>
    )}
    {f.linkType === "product" && (
      <ProductPicker
        value={f}
        error={errors.link}
        onPick={(p) =>
          patch(
            p
              ? { productId: p._id, productName: p.name, productSlug: p.slug, productImage: p.image }
              : { productId: "", productName: "", productSlug: "", productImage: "" }
          )
        }
      />
    )}
    {f.linkType === "category" && (
      <Field id="bn-cat" label="Категорія"
        required error={errors.link || catError}>
        <select id="bn-cat" className={inputCls} value={f.categoryName} onChange={set("categoryName")} aria-invalid={!!errors.link}>
          <option value="">— оберіть категорію —</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </Field>
    )}
    {f.linkType === "page" && (
      <div className="grid sm:grid-cols-2 gap-3">
        <Field id="bn-page-sel" label="Сторінка зі списку">
          <select
            id="bn-page-sel"
            className={inputCls}
            value={PAGE_OPTIONS.some(([v]) => v === f.pagePath) ? f.pagePath : ""}
            onChange={(e) => e.target.value && patch({ pagePath: e.target.value })}
          >
            <option value="">— інша (вкажіть шлях) —</option>
            {PAGE_OPTIONS.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </Field>
        <Field id="bn-page" label="Шлях на сайті"
          required error={errors.link} hint="Відносний шлях, напр. /catalog?sale=1">
          <input
            id="bn-page"
            className={inputCls}
            value={f.pagePath}
            onChange={set("pagePath")}
            placeholder="/delivery"
            maxLength={300}
            aria-invalid={!!errors.link}
          />
        </Field>
      </div>
    )}
    {f.linkType === "url" && (
      <Field id="bn-url" label="Адреса"
        required error={errors.link} hint="Лише https://. Зовнішні сайти відкриваються з rel=noopener.">
        <input
          id="bn-url"
          className={inputCls}
          type="url"
          inputMode="url"
          value={f.url}
          onChange={set("url")}
          placeholder="https://example.com/promo"
          maxLength={1000}
          aria-invalid={!!errors.link}
        />
      </Field>
    )}
    {f.linkType !== "none" && (
      <Checkbox
        checked={!!f.newTab}
        onChange={set("newTab")}
        label="Відкривати в новій вкладці"
        description="Рекомендовано лише для зовнішніх посилань"
      />
    )}
  </fieldset>
);

export default LinkField;
