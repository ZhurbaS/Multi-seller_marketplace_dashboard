// Вибір товарів для блоку «products»: пошук через GET /admin/crm/product-search?q= і підвантаження обраних (?ids=)
import React, { useEffect, useId, useRef, useState } from "react";
import { FaArrowDown, FaArrowUp, FaTimes } from "react-icons/fa";
import api from "../../../../api/api";
import { useDebounced } from "../hooks";
import { CRM, btn, errMsg, inputCls, money } from "../mkUtils";
import { MAX_PRODUCTS, cacheProduct, useProductsMap } from "./productsCache";


const Thumb = ({ p }) =>
  p?.image ? (
    <img src={p.image} alt="" className="h-10 w-10 shrink-0 rounded-(--r-sm) border border-(--line) bg-(--surface) object-contain" loading="lazy" />
  ) : (
    <span className="h-10 w-10 shrink-0 rounded-(--r-sm) bg-(--surface-2)" aria-hidden="true" />
  );

const ProductPicker = ({ id, value = [], onChange, invalid }) => {
  const uid = useId();
  const [q, setQ] = useState("");
  const deb = useDebounced(q.trim(), 400);
  const [st, setSt] = useState({ loading: false, list: [], error: "" });
  const map = useProductsMap(value);
  const req = useRef(0);
  const full = value.length >= MAX_PRODUCTS;

  useEffect(() => {
    if (!deb) return setSt({ loading: false, list: [], error: "" });
    const my = ++req.current;
    setSt((s) => ({ ...s, loading: true, error: "" }));
    api
      .get(`${CRM}/product-search`, { params: { q: deb } })
      .then(({ data }) => {
        if (my !== req.current) return;
        const list = data?.products || [];
        list.forEach(cacheProduct);
        setSt({ loading: false, list, error: "" });
      })
      .catch((e) => my === req.current && setSt({ loading: false, list: [], error: errMsg(e, "Пошук не вдався") }));
  }, [deb]);

  const add = (p) => !full && !value.includes(String(p._id)) && onChange([...value, String(p._id)]);
  const move = (i, d) => {
    const n = [...value];
    [n[i], n[i + d]] = [n[i + d], n[i]];
    onChange(n);
  };

  return (
    <div className="flex flex-col gap-2">
      {value.length > 0 ? (
        <ol className="flex flex-col gap-1" aria-label="Обрані товари">
          {value.map((pid, i) => {
            const p = map[pid];
            return (
              <li key={pid} className="flex items-center gap-2 rounded-(--r-md) border border-(--line) bg-(--surface-2) p-1.5 text-sm text-(--ink)">
                <Thumb p={p} />
                <span className="flex-1 min-w-0 truncate">{p ? p.name : "Завантаження…"}</span>
                {p && <span className="shrink-0 text-xs tabular-nums text-(--ink-2)">{money(p.price)}</span>}
                {p && p.stock === 0 && <span className="shrink-0 rounded-full bg-(--warning-soft) px-2 py-0.5 text-[11px] font-medium text-(--warning-ink)">немає в наявності</span>}
                <button type="button" className={btn.small} disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Перемістити ${p?.name || "товар"} вище`}>
                  <FaArrowUp aria-hidden="true" />
                </button>
                <button type="button" className={btn.small} disabled={i === value.length - 1} onClick={() => move(i, 1)} aria-label={`Перемістити ${p?.name || "товар"} нижче`}>
                  <FaArrowDown aria-hidden="true" />
                </button>
                <button type="button" className={btn.small} onClick={() => onChange(value.filter((x) => x !== pid))} aria-label={`Прибрати ${p?.name || "товар"}`}>
                  <FaTimes aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="text-xs text-(--ink-2)">Товарів ще не обрано. Знайдіть товар за назвою й натисніть «Додати».</p>
      )}
      <label htmlFor={id} className="sr-only">
        Пошук товарів
      </label>
      <input
        id={id}
        type="search"
        className={inputCls}
        value={q}
        disabled={full}
        aria-invalid={invalid || undefined}
        style={invalid ? { borderColor: "var(--danger)" } : undefined}
        aria-describedby={`${uid}-st`}
        placeholder={full ? `Максимум ${MAX_PRODUCTS} товарів` : "Пошук товару за назвою…"}
        onChange={(e) => setQ(e.target.value)}
      />
      <p id={`${uid}-st`} className="text-xs text-(--ink-2)" aria-live="polite">
        {st.loading ? "Шукаємо…" : st.error ? `⚠ ${st.error}` : deb && !st.list.length ? "Нічого не знайдено" : `Обрано ${value.length} з ${MAX_PRODUCTS}`}
      </p>
      {st.list.length > 0 && (
        <ul className="flex max-h-60 flex-col gap-1 overflow-auto rounded-(--r-md) border border-(--line) bg-(--surface) p-1" aria-label="Результати пошуку">
          {st.list.map((p) => {
            const added = value.includes(String(p._id));
            return (
              <li key={p._id} className="flex items-center gap-2 rounded-(--r-sm) p-1.5 text-sm text-(--ink) hover:bg-(--surface-2)">
                <Thumb p={p} />
                <span className="flex-1 min-w-0 truncate">{p.name}</span>
                <span className="shrink-0 text-xs tabular-nums text-(--ink-2)">{money(p.price)}</span>
                <button type="button" className={btn.small} disabled={added || full} onClick={() => add(p)}>
                  {added ? "Додано" : "Додати"}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default ProductPicker;
