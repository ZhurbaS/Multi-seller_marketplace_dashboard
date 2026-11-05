import React, { useEffect, useId, useRef, useState } from "react";
import api from "../../../api/api";
import { MdAdd, MdDelete, MdWarningAmber } from "react-icons/md";
import { Button, IconButton } from "../../../ui";
import { useDebounced, useSuggestions } from "./hooks";
import { CRM, EMAIL_STATUS, contactName, errMsg, inputCls, num } from "./mkUtils";
import { FIELDS, FIELD_OPTIONS, OPS, defaultValue, newRule, validateFilter } from "./segmentFields";
import { Badge, Segmented } from "./ui";

const ValueControl = ({ id, rule, field, onChange, disabled, sug, invalid }) => {
  const common = { id, disabled, "aria-invalid": invalid || undefined, className: inputCls };
  if (field.type === "enum" || field.type === "bool")
    return (
      <select
        {...common}
        aria-label="Значення"
        value={String(rule.value)}
        onChange={(e) => onChange(field.type === "bool" ? e.target.value === "true" : e.target.value)}
      >
        {field.options.map(([v, t]) => (
          <option key={v} value={v}>
            {t}
          </option>
        ))}
      </select>
    );
  if (field.type === "number" || field.type === "days")
    return (
      <div className="flex items-center gap-2">
        <input
          {...common}
          aria-label={field.type === "days" ? "Кількість днів" : "Число"}
          type="number"
          inputMode="numeric"
          min={0}
          value={rule.value}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        />
        {field.type === "days" && <span className="text-xs text-(--ink-2) shrink-0">днів</span>}
      </div>
    );
  const list = field.type === "tag" ? sug.tags : field.type === "category" ? sug.categories : [];
  return (
    <>
      <input
        {...common}
        aria-label="Значення"
        value={rule.value ?? ""}
        placeholder={field.placeholder}
        list={list.length ? `${id}-dl` : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
      {list.length > 0 && (
        <datalist id={`${id}-dl`}>
          {list.map((v) => (
            <option key={v} value={v} />
          ))}
        </datalist>
      )}
    </>
  );
};

// Конструктор правил: {match, rules:[{field, op, value}]}
export const RuleBuilder = ({ filter, onChange, readOnly = false, showErrors = false }) => {
  const uid = useId();
  const sug = useSuggestions();
  const errs = showErrors ? validateFilter(filter) : {};
  const rules = filter.rules || [];
  const setRule = (i, patch) => onChange({ ...filter, rules: rules.map((r, j) => (j === i ? { ...r, ...patch } : r)) });
  const setField = (i, field) => setRule(i, { field, op: FIELDS[field].ops[0], value: defaultValue(field) });
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 flex-wrap text-sm">
        <span>Контакт відповідає</span>
        {readOnly ? (
          <b>{filter.match === "any" ? "будь-якій умові" : "усім умовам"}</b>
        ) : (
          <Segmented
            label="Режим поєднання умов"
            value={filter.match}
            onChange={(v) => onChange({ ...filter, match: v })}
            options={[
              ["all", "усім умовам (І)"],
              ["any", "будь-якій (АБО)"],
            ]}
            size="sm"
          />
        )}
      </div>
      {rules.length === 0 && <p className="text-sm text-(--ink-2)">Умов немає — до вибірки потраплять усі контакти бази.</p>}
      <ol className="flex flex-col gap-2">
        {rules.map((r, i) => {
          const f = FIELDS[r.field];
          if (!f) return null;
          const base = `${uid}-r${i}`;
          return (
            <li key={i} className="flex flex-col gap-1 rounded-(--r-md) border border-(--line) bg-(--surface-2) p-2.5">
              <div className="grid gap-2 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] items-start">
                <div>
                  <label htmlFor={`${base}-f`} className="sr-only">
                    Поле умови {i + 1}
                  </label>
                  <select id={`${base}-f`} disabled={readOnly} className={inputCls} value={r.field} onChange={(e) => setField(i, e.target.value)}>
                    {FIELD_OPTIONS.map(([v, t]) => (
                      <option key={v} value={v}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor={`${base}-o`} className="sr-only">
                    Умова {i + 1}
                  </label>
                  <select id={`${base}-o`} disabled={readOnly || f.ops.length < 2} className={inputCls} value={r.op} onChange={(e) => setRule(i, { op: e.target.value })}>
                    {f.ops.map((o) => (
                      <option key={o} value={o}>
                        {OPS[o]}
                      </option>
                    ))}
                  </select>
                </div>
                <ValueControl id={`${base}-v`} rule={r} field={f} disabled={readOnly} sug={sug} invalid={!!errs[i]} onChange={(value) => setRule(i, { value })} />
                {!readOnly && (
                  <IconButton
                    icon={<MdDelete />}
                    label={`Видалити умову ${i + 1}`}
                    variant="ghost"
                    className="justify-self-end hover:text-(--danger)"
                    onClick={() => onChange({ ...filter, rules: rules.filter((_, j) => j !== i) })}
                  />
                )}
              </div>
              {errs[i] && (
                <span role="alert" className="inline-flex items-center gap-1 text-xs font-medium text-(--danger)">
                  <MdWarningAmber aria-hidden="true" /> Умова {i + 1}: {errs[i]}
                </span>
              )}
            </li>
          );
        })}
      </ol>
      {!readOnly && (
        <Button
          variant="secondary"
          icon={<MdAdd />}
          className="self-start"
          disabled={rules.length >= 20}
          onClick={() => onChange({ ...filter, rules: [...rules, newRule("tags")] })}
        >
          Додати умову
        </Button>
      )}
    </div>
  );
};

// Живий лічильник і вибірка (debounce POST /segments/preview)
export const LivePreview = ({ filter, segmentId }) => {
  const key = JSON.stringify(filter);
  const deb = useDebounced(key, 600);
  const [st, setSt] = useState({ loading: true, count: null, sample: [], error: "" });
  const req = useRef(0);
  useEffect(() => {
    const f = JSON.parse(deb);
    if (Object.keys(validateFilter(f)).length) {
      setSt({ loading: false, count: null, sample: [], error: "Заповніть умови, щоб побачити кількість" });
      return;
    }
    const my = ++req.current;
    setSt((s) => ({ ...s, loading: true, error: "" }));
    api
      .post(`${CRM}/segments/preview`, segmentId ? { filter: f, segmentId } : { filter: f })
      .then(({ data }) => my === req.current && setSt({ loading: false, count: data.count ?? 0, sample: data.sample || data.contacts || [], error: "" }))
      .catch((e) => my === req.current && setSt({ loading: false, count: null, sample: [], error: errMsg(e, "Не вдалося порахувати") }));
  }, [deb, segmentId]);
  const stale = deb !== key;
  return (
    <div className="flex flex-col gap-2" aria-live="polite" aria-busy={st.loading || stale}>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-semibold text-(--ink) tabular-nums">{st.count == null ? "—" : num(st.count)}</span>
        <span className="text-sm text-(--ink-2)">контактів відповідають умовам</span>
        {(st.loading || stale) && <span className="text-xs text-(--ink-2)">рахуємо…</span>}
      </div>
      {st.error && (
        <p className="inline-flex items-center gap-1 text-xs font-medium text-(--warning-ink)">
          <MdWarningAmber aria-hidden="true" /> {st.error}
        </p>
      )}
      {st.sample.length > 0 && (
        <div>
          <p className="text-xs text-(--ink-2) pb-1">Приклади (до 10):</p>
          <ul className="flex flex-col divide-y divide-(--line) rounded-(--r-md) border border-(--line) bg-(--surface) text-sm">
            {st.sample.slice(0, 10).map((c) => (
              <li key={c._id || c.email} className="px-3 py-1.5 flex items-center justify-between gap-2 min-w-0">
                <span className="truncate">
                  {contactName(c)}
                  {c.name && c.email && <span className="text-(--ink-2)"> · {c.email}</span>}
                </span>
                <Badge meta={EMAIL_STATUS[c.channels?.email?.status || c.emailStatus || "none"]} />
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="text-[11px] text-(--ink-2)">
        Кількість — це всі контакти за умовами. Фактично маркетинг отримають лише ті, хто має активну згоду та ввімкнену тему (див. оцінку в розсилці).
      </p>
    </div>
  );
};
