// Перевикористовуваний блоковий редактор листа (розсилки й автоматизації).
// value — масив блоків з внутрішнім ключем _k (див. withKeys/stripKeys у blockUtils.js).
import React, { useId, useRef, useState } from "react";
import { FaArrowDown, FaArrowUp, FaChevronDown, FaChevronRight, FaClone, FaTrash } from "react-icons/fa";
import { btn } from "../mkUtils";
import { Confirm } from "../ui";
import BlockFields from "./BlockFields";
import { BLOCK_TYPES, newBlock, uid, validateBlocks } from "./blockUtils";

export const MAX_BLOCKS = 50;

const summary = (b) => {
  if (b.type === "heading" || b.type === "text") return String(b.text || "").replace(/\s+/g, " ").slice(0, 70);
  if (b.type === "button") return b.label || "";
  if (b.type === "image") return b.alt || b.url || "";
  if (b.type === "products") return `${(b.productIds || []).length} тов.${b.title ? ` · ${b.title}` : ""}`;
  return "";
};

const AddBar = ({ onAdd, disabled, label = "Додати блок" }) => (
  <div className="flex flex-wrap items-center gap-1" role="group" aria-label={label}>
    <span className="mr-1 text-xs font-medium text-(--ink-2)">{label}:</span>
    {Object.entries(BLOCK_TYPES).map(([type, t]) => (
      <button key={type} type="button" className={btn.small} disabled={disabled} onClick={() => onAdd(type)}>
        <span aria-hidden="true">{t.icon}</span> {t.label}
      </button>
    ))}
  </div>
);

const BlockEditor = ({ value = [], onChange, showErrors = false, label = "Зміст листа" }) => {
  const base = useId();
  const [collapsed, setCollapsed] = useState(() => new Set());
  const [askDel, setAskDel] = useState(null);
  const listRef = useRef(null);
  const errs = showErrors ? validateBlocks(value) : {};
  const full = value.length >= MAX_BLOCKS;

  const focusBlock = (k) =>
    setTimeout(() => {
      const el = listRef.current?.querySelector(`[data-block="${k}"] input, [data-block="${k}"] textarea, [data-block="${k}"] button`);
      el?.focus();
    }, 30);

  const add = (type, at = value.length) => {
    if (full) return;
    const b = { ...newBlock(type), _k: uid() };
    onChange([...value.slice(0, at), b, ...value.slice(at)]);
    focusBlock(b._k);
  };
  const update = (i, b) => onChange(value.map((x, j) => (j === i ? b : x)));
  const move = (i, d) => {
    const n = [...value];
    [n[i], n[i + d]] = [n[i + d], n[i]];
    onChange(n);
  };
  const duplicate = (i) => {
    if (full) return;
    const copy = { ...JSON.parse(JSON.stringify(value[i])), _k: uid() };
    onChange([...value.slice(0, i + 1), copy, ...value.slice(i + 1)]);
  };
  const remove = (i) => {
    onChange(value.filter((_, j) => j !== i));
    setAskDel(null);
  };
  const toggle = (k) =>
    setCollapsed((s) => {
      const n = new Set(s);
      n.has(k) ? n.delete(k) : n.add(k);
      return n;
    });
  const isEmpty = (b) => !summary(b) && !["divider", "spacer"].includes(b.type);

  return (
    <div className="flex flex-col gap-3" aria-label={label} role="group">
      {value.length === 0 && (
        <div className="rounded-(--r-md) border border-dashed border-(--line-strong) bg-(--surface-2) p-4 text-center text-sm text-(--ink-2)">
          Лист порожній. Почніть із заголовка й тексту, додайте кнопку із закликом до дії.
        </div>
      )}
      <ol ref={listRef} className="flex flex-col gap-2">
        {value.map((b, i) => {
          const t = BLOCK_TYPES[b.type] || { label: b.type, icon: "?" };
          const k = b._k || String(i);
          const open = !collapsed.has(k);
          const bad = !!errs[i];
          return (
            <li key={k} data-block={k} className={`rounded-(--r-md) border bg-(--surface) ${bad ? "border-(--danger) ring-1 ring-(--danger)/30" : "border-(--line)"}`}>
              <div className="flex items-center gap-1 p-2 flex-wrap">
                <button
                  type="button"
                  className="flex items-center gap-2 min-w-0 flex-1 text-left text-sm rounded px-1 py-0.5 min-h-11 text-(--ink) hover:bg-(--surface-2) focus-visible:outline focus-visible:outline-2 focus-visible:outline-(--brand)"
                  aria-expanded={open}
                  aria-controls={`${base}-b${k}`}
                  onClick={() => toggle(k)}
                >
                  {open ? <FaChevronDown aria-hidden="true" className="shrink-0" /> : <FaChevronRight aria-hidden="true" className="shrink-0" />}
                  <span className="w-6 text-center shrink-0" aria-hidden="true">
                    {t.icon}
                  </span>
                  <b className="shrink-0">
                    {i + 1}. {t.label}
                  </b>
                  <span className="truncate text-(--ink-2)">{summary(b)}</span>
                  {bad && <span className="shrink-0 rounded-full bg-(--danger-soft) px-2 py-0.5 text-xs font-medium text-(--danger)">заповніть поля</span>}
                </button>
                <button type="button" className={btn.small} disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Блок ${i + 1} вище`} title="Вище">
                  <FaArrowUp aria-hidden="true" />
                </button>
                <button type="button" className={btn.small} disabled={i === value.length - 1} onClick={() => move(i, 1)} aria-label={`Блок ${i + 1} нижче`} title="Нижче">
                  <FaArrowDown aria-hidden="true" />
                </button>
                <button type="button" className={btn.small} disabled={full} onClick={() => duplicate(i)} aria-label={`Дублювати блок ${i + 1}`} title="Дублювати">
                  <FaClone aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className={`${btn.small} hover:border-(--danger) hover:text-(--danger)`}
                  onClick={() => (isEmpty(b) ? remove(i) : setAskDel(i))}
                  aria-label={`Видалити блок ${i + 1}`}
                  title="Видалити"
                >
                  <FaTrash aria-hidden="true" />
                </button>
              </div>
              {open && (
                <div id={`${base}-b${k}`} className="border-t border-(--line) px-3 pb-3 pt-3">
                  <BlockFields block={b} idBase={`${base}-b${k}`} errors={errs[i] || {}} onChange={(nb) => update(i, nb)} />
                </div>
              )}
            </li>
          );
        })}
      </ol>
      <AddBar onAdd={(type) => add(type)} disabled={full} />
      {full && <p className="text-xs font-medium text-(--warning-ink)">Досягнуто максимуму — {MAX_BLOCKS} блоків.</p>}
      {askDel !== null && value[askDel] && (
        <Confirm
          title="Видалити блок?"
          text={`Блок «${(BLOCK_TYPES[value[askDel].type] || {}).label || value[askDel].type}» ${summary(value[askDel]) ? `(${summary(value[askDel])})` : ""} буде видалено з листа.`}
          confirmLabel="Видалити"
          onConfirm={() => remove(askDel)}
          onCancel={() => setAskDel(null)}
        />
      )}
    </div>
  );
};

export default BlockEditor;
