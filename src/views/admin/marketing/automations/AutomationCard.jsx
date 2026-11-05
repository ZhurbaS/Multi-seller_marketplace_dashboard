// Картка автоматизації: вмикач, параметри, лист(и), статистика, збереження (PUT /automations лише свого ключа)
import React, { useId, useState } from "react";
import { MdAdd, MdCheck, MdDeleteOutline, MdErrorOutline } from "react-icons/md";
import { Button, StatusChip } from "../../../../ui";
import { inputCls } from "../mkUtils";
import { Card, Confirm, Field, Notice, Toggle } from "../ui";
import { newBlock, uid, validateBlocks } from "../blocks/blockUtils";
import AutoMail, { StatLine, SUBJECT_MAX } from "./AutoMail";

const LIMITS = { delayHours: [0, 720], afterHours: [1, 720], afterDays: [7, 1095], maxSteps: 5 };

const intErr = (v, [min, max]) => {
  const n = Number(v);
  return v === "" || !Number.isInteger(n) || n < min || n > max ? `Ціле число від ${min} до ${max}` : "";
};

const mailErrors = (m) => {
  const e = {};
  if (!String(m.subject || "").trim()) e.subject = "Вкажіть тему листа";
  else if (m.subject.length > SUBJECT_MAX) e.subject = `До ${SUBJECT_MAX} символів`;
  if (!m.blocks?.length) e.blocks = "Додайте хоча б один блок";
  else if (Object.keys(validateBlocks(m.blocks)).length) e.blocks = "Заповніть обов'язкові поля блоків";
  return e;
};

// Помилки всієї автоматизації → {} якщо валідна
const automationErrors = (key, a) => {
  const e = {};
  if (key === "welcome") {
    (a.steps || []).forEach((s, i) => {
      const se = mailErrors(s);
      const d = intErr(s.delayHours, LIMITS.delayHours);
      if (d) se.delayHours = d;
      if (Object.keys(se).length) e[`step${i}`] = se;
    });
    if (!(a.steps || []).length) e.steps = "Потрібен хоча б один лист";
  } else {
    Object.assign(e, mailErrors(a));
    const param = key === "abandonedCart" ? "afterHours" : "afterDays";
    const d = intErr(a[param], LIMITS[param]);
    if (d) e[param] = d;
  }
  return e;
};

const NumField = ({ id, label, hint, value, range, error, onChange, unit }) => (
  <Field id={id} label={label} hint={hint} error={error}>
    <div className="flex items-center gap-2">
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={range[0]}
        max={range[1]}
        className={`${inputCls} max-w-[140px]`}
        value={value}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-err` : `${id}-hint`}
        onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
      />
      <span className="text-sm text-(--ink-2)">{unit}</span>
    </div>
  </Field>
);

const WelcomeSteps = ({ a, set, idBase, tried, errors, stats }) => {
  const [askDel, setAskDel] = useState(null);
  const steps = a.steps || [];
  const upd = (i, patch) => set({ steps: steps.map((s, j) => (j === i ? { ...s, ...patch } : s)) });
  const add = () =>
    set({
      steps: [...steps, { _k: uid(), delayHours: (Number(steps.at(-1)?.delayHours) || 0) + 72, subject: "", blocks: [{ ...newBlock("heading"), _k: uid() }, { ...newBlock("text"), _k: uid() }] }],
    });
  return (
    <div className="flex flex-col gap-3">
      {errors.steps && (
        <p role="alert" className="text-xs font-medium text-(--danger)">
          {errors.steps}
        </p>
      )}
      <ol className="flex flex-col gap-3">
        {steps.map((s, i) => {
          const se = tried ? errors[`step${i}`] || {} : {};
          return (
            <li key={s._k || i} className="flex flex-col gap-3 rounded-(--r-md) border border-(--line) bg-(--surface-2) p-3 sm:p-4">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <h4 className="font-semibold text-(--ink)">Лист {i + 1}</h4>
                {steps.length > 1 && (
                  <Button size="sm" variant="ghost" className="text-(--danger)" icon={<MdDeleteOutline />} onClick={() => setAskDel(i)} aria-label={`Видалити лист ${i + 1}`}>
                    Видалити
                  </Button>
                )}
              </div>
              <NumField
                id={`${idBase}-d${i}`}
                label="Затримка після підтвердження підписки"
                hint={i === 0 ? "0 — одразу після підтвердження." : "Від моменту підписки (не від попереднього листа)."}
                value={s.delayHours}
                range={LIMITS.delayHours}
                unit="год"
                error={se.delayHours}
                onChange={(v) => upd(i, { delayHours: v })}
              />
              <AutoMail idBase={`${idBase}-s${i}`} subject={s.subject} blocks={s.blocks} onChange={(p) => upd(i, p)} showErrors={tried} subjectError={se.subject} />
              {se.blocks && (
                <p role="alert" className="text-xs font-medium text-(--danger)">
                  {se.blocks}
                </p>
              )}
              <StatLine s={stats?.steps?.[i]} />
            </li>
          );
        })}
      </ol>
      {steps.length < LIMITS.maxSteps ? (
        <Button variant="secondary" className="self-start" icon={<MdAdd />} onClick={add}>
          Додати лист у ланцюжок
        </Button>
      ) : (
        <p className="text-xs text-(--ink-2)">Максимум {LIMITS.maxSteps} листів у ланцюжку.</p>
      )}
      {askDel !== null && (
        <Confirm
          title={`Видалити лист ${askDel + 1}?`}
          text="Лист буде прибрано з ланцюжка після збереження. Уже заплановані листи цього кроку можуть не надіслатися."
          confirmLabel="Видалити"
          onConfirm={() => {
            set({ steps: steps.filter((_, j) => j !== askDel) });
            setAskDel(null);
          }}
          onCancel={() => setAskDel(null)}
        />
      )}
    </div>
  );
};

const AutomationCard = ({ akey, meta, value: a, onChange, onSave, saving, dirty, stats }) => {
  const idBase = useId();
  const [tried, setTried] = useState(false);
  const errors = automationErrors(akey, a);
  const shown = tried ? errors : {};
  const set = (patch) => onChange({ ...a, ...patch });
  const save = () => {
    setTried(true);
    if (Object.keys(errors).length) return;
    onSave();
  };
  const param = akey === "abandonedCart" ? "afterHours" : akey === "winback" ? "afterDays" : null;

  return (
    <Card className="flex flex-col gap-4">
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h2 className="flex flex-wrap items-center gap-2 text-lg font-semibold text-(--ink)">
            {meta.title}
            <StatusChip tone={a.enabled ? "success" : "neutral"}>{a.enabled ? "Увімкнено" : "Вимкнено"}</StatusChip>
            {dirty && <StatusChip tone="warning">Не збережено</StatusChip>}
          </h2>
          <p className="mt-0.5 max-w-[760px] text-sm text-(--ink-2)">{meta.description}</p>
        </div>
        <Toggle checked={!!a.enabled} onChange={(enabled) => set({ enabled })} label={a.enabled ? "Увімкнено" : "Вимкнено"} srLabel={`Увімкнути автоматизацію «${meta.title}»`} />
      </header>

      <div className="rounded-(--r-md) border border-(--line) bg-(--surface-2) p-3">
        <p className="pb-1 text-xs font-semibold text-(--ink)">Статистика за 30 днів</p>
        <StatLine s={stats} />
      </div>

      {param && (
        <NumField
          id={`${idBase}-${param}`}
          label={meta.paramLabel}
          hint={meta.paramHint}
          value={a[param]}
          range={LIMITS[param]}
          unit={param === "afterHours" ? "год" : "дн."}
          error={shown[param]}
          onChange={(v) => set({ [param]: v })}
        />
      )}

      {akey === "welcome" ? (
        <WelcomeSteps a={a} set={set} idBase={idBase} tried={tried} errors={shown} stats={stats} />
      ) : (
        <>
          <AutoMail idBase={idBase} subject={a.subject} blocks={a.blocks} onChange={set} showErrors={tried} subjectError={shown.subject} />
          {shown.blocks && (
            <p role="alert" className="text-xs font-medium text-(--danger)">
              {shown.blocks}
            </p>
          )}
        </>
      )}

      {meta.note && <Notice>{meta.note}</Notice>}
      {tried && Object.keys(errors).length > 0 && (
        <p role="alert" className="inline-flex items-center gap-1.5 text-sm font-medium text-(--danger)">
          <MdErrorOutline aria-hidden="true" className="shrink-0 text-lg" /> Виправте поля, позначені червоним.
        </p>
      )}
      <div className="flex justify-end gap-2 border-t border-(--line) pt-3">
        <Button onClick={save} loading={saving} disabled={saving || !dirty} icon={!dirty ? <MdCheck /> : undefined}>
          {saving ? "Збереження…" : dirty ? "Зберегти" : "Збережено"}
        </Button>
      </div>
    </Card>
  );
};

export default AutomationCard;
