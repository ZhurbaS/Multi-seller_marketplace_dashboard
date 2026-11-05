import React, { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "../../../../ui";
import api from "../../../../api/api";
import { useSuggestions } from "../hooks";
import { CRM, EMAIL_RE, KINDS, PHONE_RE, errMsg, inputCls, pick } from "../mkUtils";
import { Counter, Field, Modal, Notice, TagInput } from "../ui";

const AddContactDialog = ({ onClose, onCreated }) => {
  const sug = useSuggestions();
  const [f, setF] = useState({ email: "", phone: "", name: "", kind: "unknown", city: "", tags: [], basis: "", note: "" });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e?.target ? e.target.value : e }));

  const validate = () => {
    const e = {};
    const email = f.email.trim();
    const phone = f.phone.trim();
    if (!email && !phone) e.email = "Вкажіть email або телефон";
    if (email && !EMAIL_RE.test(email)) e.email = "Некоректний email";
    if (phone && !PHONE_RE.test(phone)) e.phone = "Телефон у форматі +380XXXXXXXXX";
    if (!f.basis) e.basis = "Оберіть, чи є підстава для маркетингу";
    if (f.basis === "proof" && f.note.trim().length < 5) e.note = "Опишіть доказ згоди (щонайменше 5 символів)";
    if (f.note.length > 500) e.note = "До 500 символів";
    return e;
  };

  const submit = async (ev) => {
    ev?.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      const body = {
        email: f.email.trim().toLowerCase() || undefined,
        phone: f.phone.trim() || undefined,
        name: f.name.trim(),
        kind: f.kind,
        city: f.city.trim(),
        tags: f.tags,
        consent: f.basis === "proof" ? { proof: true, note: f.note.trim() } : { proof: false, note: f.note.trim() },
      };
      const { data } = await api.post(`${CRM}/contacts`, body);
      toast.success(data?.message || "Контакт додано");
      onCreated(pick(data, "contact"));
    } catch (err) {
      toast.error(errMsg(err, "Не вдалося додати контакт"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Додати контакт"
      onClose={onClose}
      width="max-w-[620px]"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Скасувати
          </Button>
          <Button type="submit" form="crm-add-form" loading={busy}>
            {busy ? "Збереження…" : "Додати"}
          </Button>
        </>
      }
    >
      <form id="crm-add-form" onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field id="add-email" label="Email" error={errors.email}>
            <input id="add-email" data-autofocus type="email" className={inputCls} value={f.email} onChange={set("email")} onBlur={() => f.email.trim() && setErrors((x) => ({ ...x, email: EMAIL_RE.test(f.email.trim()) ? undefined : "Некоректний email" }))} aria-invalid={!!errors.email} autoComplete="off" />
          </Field>
          <Field id="add-phone" label="Телефон" error={errors.phone}>
            <input id="add-phone" type="tel" className={inputCls} value={f.phone} onChange={set("phone")} placeholder="+380…" onBlur={() => f.phone.trim() && setErrors((x) => ({ ...x, phone: PHONE_RE.test(f.phone.trim()) ? undefined : "Телефон у форматі +380XXXXXXXXX" }))} aria-invalid={!!errors.phone} />
          </Field>
          <Field id="add-name" label="Ім'я або назва компанії">
            <input id="add-name" className={inputCls} value={f.name} onChange={set("name")} maxLength={120} />
          </Field>
          <Field id="add-city" label="Місто">
            <input id="add-city" className={inputCls} value={f.city} onChange={set("city")} maxLength={80} />
          </Field>
          <Field id="add-kind" label="Тип">
            <select id="add-kind" className={inputCls} value={f.kind} onChange={set("kind")}>
              {Object.entries(KINDS).map(([v, t]) => (
                <option key={v} value={v}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <Field id="add-tags" label="Теги">
            <TagInput id="add-tags" value={f.tags} onChange={set("tags")} suggestions={sug.tags} />
          </Field>
        </div>

        <fieldset className="flex flex-col gap-3 rounded-(--r-md) border border-(--line) bg-(--surface-2) p-3 sm:p-4" aria-describedby={errors.basis ? "add-basis-err" : undefined}>
          <legend className="px-1 text-sm font-semibold text-(--ink)">Підстава для маркетингових розсилок *</legend>
          <label className="flex min-h-11 cursor-pointer items-start gap-2.5 rounded-(--r-md) border border-(--line) bg-(--surface) p-3 has-[:checked]:border-(--brand) has-[:checked]:bg-(--brand-soft)">
            <input type="radio" name="basis" className="mt-0.5 h-5 w-5 shrink-0 accent-(--brand)" checked={f.basis === "none"} onChange={() => (setF((x) => ({ ...x, basis: "none" })), setErrors((x) => ({ ...x, basis: undefined })))} />
            <span>
              <b>Немає підтвердженої згоди</b>
              <span className="block text-xs text-(--ink-2)">Контакт буде лише в CRM (статус «Без згоди»), маркетинг йому не надсилатиметься.</span>
            </span>
          </label>
          <label className="flex min-h-11 cursor-pointer items-start gap-2.5 rounded-(--r-md) border border-(--line) bg-(--surface) p-3 has-[:checked]:border-(--brand) has-[:checked]:bg-(--brand-soft)">
            <input type="radio" name="basis" className="mt-0.5 h-5 w-5 shrink-0 accent-(--brand)" checked={f.basis === "proof"} onChange={() => (setF((x) => ({ ...x, basis: "proof" })), setErrors((x) => ({ ...x, basis: undefined })))} />
            <span>
              <b>Є підстава/доказ згоди</b>
              <span className="block text-xs text-(--ink-2)">
                Людина сама погодилась отримувати рекламу (письмова заява, підписана форма, лист). Статус — «Підписаний», дія фіксується в журналі згод від вашого імені.
              </span>
            </span>
          </label>
          {errors.basis && (
            <span id="add-basis-err" role="alert" className="inline-flex items-center gap-1 text-xs font-medium text-(--danger)">
              {errors.basis}
            </span>
          )}
          <Field
            id="add-note"
            label={f.basis === "proof" ? "Доказ згоди (де, коли, як отримано) *" : "Примітка"}
            error={errors.note}
            counter={<Counter value={f.note} max={500} />}
          >
            <textarea
              id="add-note"
              rows={2}
              className={inputCls}
              value={f.note}
              onChange={set("note")}
              maxLength={500}
              placeholder={f.basis === "proof" ? "Напр.: анкета на виставці 12.10.2026, оригінал у теці «Згоди»" : ""}
              aria-invalid={!!errors.note}
            />
          </Field>
          {f.basis === "proof" && (
            <Notice tone="warn">
              Ст. 14-3 Закону «Про рекламу»: розсилка реклами без попередньої згоди споживача заборонена. Зберігайте оригінал доказу — у разі скарги його доведеться пред'явити.
            </Notice>
          )}
        </fieldset>
      </form>
    </Modal>
  );
};

export default AddContactDialog;
