// Налаштування маркетингу: GET/PUT /settings ({settings}); межі — back/utiles/marketingSettings.js LIMITS
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../../../api/api";
import { MdRestore, MdSave } from "react-icons/md";
import { Button, StickyActions, useUnsavedChanges } from "../../../../ui";
import { CRM, EMAIL_RE, errMsg, inputCls } from "../mkUtils";
import { Counter, Field, Notice, Section, Toggle } from "../ui";

const LIM = { frequencyMax: [1, 10], frequencyDays: [1, 30], dailyLimit: [10, 100000], batchSize: [1, 100] };
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const FIELDS = ["senderName", "fromEmail", "replyTo", "frequencyCap", "sendWindow", "dailyLimit", "batchSize", "doubleOptInFooter", "consentText"];

const pickSettings = (s = {}) => Object.fromEntries(FIELDS.map((k) => [k, s[k]]));
const intErr = (v, [a, b]) => (v === "" || !Number.isInteger(Number(v)) || v < a || v > b ? `Ціле число від ${a} до ${b}` : "");
const fromOk = (v) => {
  const s = String(v || "").trim();
  if (!s) return true;
  const m = s.match(/^(.*)<([^<>]+)>$/);
  return EMAIL_RE.test((m ? m[2] : s).trim());
};

const settingsErrors = (f) => {
  const e = {};
  if (!f.senderName.trim()) e.senderName = "Вкажіть назву відправника";
  if (!fromOk(f.fromEmail)) e.fromEmail = "Формат: news@news.домен.ua або «Назва <news@news.домен.ua>»";
  if (f.replyTo.trim() && !EMAIL_RE.test(f.replyTo.trim())) e.replyTo = "Некоректна адреса";
  const fm = intErr(f.frequencyCap.max, LIM.frequencyMax);
  if (fm) e.fcMax = fm;
  const fd = intErr(f.frequencyCap.days, LIM.frequencyDays);
  if (fd) e.fcDays = fd;
  if (!HHMM.test(f.sendWindow.from)) e.wFrom = "Час у форматі ГГ:ХХ";
  if (!HHMM.test(f.sendWindow.to)) e.wTo = "Час у форматі ГГ:ХХ";
  if (!e.wFrom && !e.wTo && f.sendWindow.from >= f.sendWindow.to) e.wTo = "Кінець вікна має бути пізніше за початок";
  const dl = intErr(f.dailyLimit, LIM.dailyLimit);
  if (dl) e.dailyLimit = dl;
  const bs = intErr(f.batchSize, LIM.batchSize);
  if (bs) e.batchSize = bs;
  if (!f.consentText.footer.trim()) e.ctFooter = "Текст згоди обов'язковий";
  if (!f.consentText.checkout.trim()) e.ctCheckout = "Текст згоди обов'язковий";
  if (!/^[\w.-]{1,20}$/.test(f.consentText.version)) e.ctVersion = "Латиниця, цифри, «.», «-», «_» (до 20)";
  return e;
};

const numVal = (v) => (v === "" ? "" : Number(v));

const SettingsForm = ({ data, onSaved }) => {
  const [f, setF] = useState(() => pickSettings(data?.settings));
  const [orig, setOrig] = useState(() => JSON.stringify(pickSettings(data?.settings)));
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const p = pickSettings(data?.settings);
    setF(p);
    setOrig(JSON.stringify(p));
  }, [data]);

  const dirty = JSON.stringify(f) !== orig;
  useUnsavedChanges(dirty);
  // Інлайн-валідація: поле показує помилку після першого виходу з нього (або після спроби зберегти)
  const [touched, setTouched] = useState({});
  if (!f.frequencyCap) return null;
  const errs = settingsErrors(f);
  const e = tried ? errs : Object.fromEntries(Object.entries(errs).filter(([k]) => touched[k]));
  const set = (patch) => setF((x) => ({ ...x, ...patch }));
  const setIn = (k, patch) => setF((x) => ({ ...x, [k]: { ...x[k], ...patch } }));
  const versionChanged = f.consentText.version !== JSON.parse(orig).consentText?.version;
  const textChanged = JSON.stringify([f.consentText.footer, f.consentText.checkout]) !== JSON.stringify([JSON.parse(orig).consentText?.footer, JSON.parse(orig).consentText?.checkout]);
  const ids = (k) => ({ id: `ms-${k}`, onBlur: () => setTouched((t) => (t[k] ? t : { ...t, [k]: true })), "aria-invalid": e[k] ? true : undefined, "aria-describedby": e[k] ? `ms-${k}-err` : `ms-${k}-hint` });

  const save = async () => {
    setTried(true);
    if (Object.keys(errs).length) return toast.error("Перевірте поля налаштувань");
    setBusy(true);
    try {
      const { data: r } = await api.put(`${CRM}/settings`, { settings: f });
      const p = pickSettings(r.settings);
      setF(p);
      setOrig(JSON.stringify(p));
      toast.success("Налаштування збережено");
      onSaved?.();
    } catch (err) {
      toast.error(errMsg(err, "Не вдалося зберегти налаштування"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
    <Section title="Відправник і ліміти" hint="Діють для всіх розсилок і автоматизацій.">
      <div className="grid gap-4 md:grid-cols-2">
        <Field id="ms-senderName" label="Назва відправника *" error={e.senderName} hint="Показується в полі «Від» у поштовому клієнті.">
          <input {...ids("senderName")} className={inputCls} value={f.senderName} maxLength={100} onChange={(x) => set({ senderName: x.target.value })} />
        </Field>
        <Field
          id="ms-fromEmail"
          label="Адреса відправника (піддомен розсилок)"
          error={e.fromEmail}
          hint={data?.envFrom ? `Порожньо — використовується MARKETING_MAIL_FROM: ${data.envFrom}` : "Порожньо — береться MARKETING_MAIL_FROM з .env бекенду (зараз не задано)."}
        >
          <input {...ids("fromEmail")} className={inputCls} value={f.fromEmail} maxLength={300} placeholder="news@news.ваш-домен.ua" onChange={(x) => set({ fromEmail: x.target.value })} />
        </Field>
        <Field id="ms-replyTo" label="Адреса для відповідей (Reply-To)" error={e.replyTo} hint="Куди приходитимуть відповіді клієнтів на розсилку.">
          <input {...ids("replyTo")} type="email" inputMode="email" className={inputCls} value={f.replyTo} maxLength={254} onChange={(x) => set({ replyTo: x.target.value })} />
        </Field>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-(--ink)">Ліміт частоти на контакт (усі канали й автоматизації)</span>
          <div className="flex items-start gap-2 flex-wrap">
            <Field id="ms-fcMax" label="не більше" error={e.fcMax}>
              <input {...ids("fcMax")} type="number" min={1} max={10} className={`${inputCls} w-24`} value={f.frequencyCap.max} onChange={(x) => setIn("frequencyCap", { max: numVal(x.target.value) })} />
            </Field>
            <Field id="ms-fcDays" label="повідомлень за (днів)" error={e.fcDays}>
              <input {...ids("fcDays")} type="number" min={1} max={30} className={`${inputCls} w-24`} value={f.frequencyCap.days} onChange={(x) => setIn("frequencyCap", { days: numVal(x.target.value) })} />
            </Field>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-(--ink)">Вікно відправки (час Києва)</span>
          <div className="flex items-start gap-2 flex-wrap">
            <Field id="ms-wFrom" label="з" error={e.wFrom}>
              <input {...ids("wFrom")} type="time" className={`${inputCls} w-32`} value={f.sendWindow.from} onChange={(x) => setIn("sendWindow", { from: x.target.value })} />
            </Field>
            <Field id="ms-wTo" label="до" error={e.wTo}>
              <input {...ids("wTo")} type="time" className={`${inputCls} w-32`} value={f.sendWindow.to} onChange={(x) => setIn("sendWindow", { to: x.target.value })} />
            </Field>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Field id="ms-dailyLimit" label="Денний ліміт листів" error={e.dailyLimit} hint="Безкоштовний Resend — 100/день.">
            <input {...ids("dailyLimit")} type="number" min={10} max={100000} className={inputCls} value={f.dailyLimit} onChange={(x) => set({ dailyLimit: numVal(x.target.value) })} />
          </Field>
          <Field id="ms-batchSize" label="Розмір пачки" error={e.batchSize} hint="1–100 листів за запит.">
            <input {...ids("batchSize")} type="number" min={1} max={100} className={inputCls} value={f.batchSize} onChange={(x) => set({ batchSize: numVal(x.target.value) })} />
          </Field>
        </div>
      </div>
      <Toggle
        checked={!!f.doubleOptInFooter}
        onChange={(v) => set({ doubleOptInFooter: v })}
        label="Подвійне підтвердження (double opt-in) для форми у футері"
        srLabel="Подвійне підтвердження для форми у футері"
      />
      {!f.doubleOptInFooter && <Notice tone="warn">Без підтвердження в базу потраплятимуть чужі й помилкові адреси — це підвищує ризик скарг і блокування домену. Рекомендуємо залишити увімкненим.</Notice>}

    </Section>

    <Section title="Тексти згоди" hint="Показуються біля форм підписки; точний текст і версія пишуться в журнал згод.">
      <div className="grid gap-4 md:grid-cols-2">
        <Field id="ms-ctFooter" label="Форма підписки у футері *" error={e.ctFooter} counter={<Counter value={f.consentText.footer} max={1000} />}>
          <textarea {...ids("ctFooter")} rows={3} className={inputCls} value={f.consentText.footer} maxLength={1000} onChange={(x) => setIn("consentText", { footer: x.target.value })} />
        </Field>
        <Field id="ms-ctCheckout" label="Галочка при реєстрації / оформленні *" error={e.ctCheckout} counter={<Counter value={f.consentText.checkout} max={1000} />}>
          <textarea {...ids("ctCheckout")} rows={3} className={inputCls} value={f.consentText.checkout} maxLength={1000} onChange={(x) => setIn("consentText", { checkout: x.target.value })} />
        </Field>
        <Field id="ms-ctVersion" label="Версія формулювання" error={e.ctVersion} hint="Записується в журнал згод разом із точним текстом.">
          <input {...ids("ctVersion")} className={`${inputCls} max-w-[160px]`} value={f.consentText.version} maxLength={20} onChange={(x) => setIn("consentText", { version: x.target.value })} />
        </Field>
      </div>
      {textChanged && !versionChanged && <Notice tone="warn">Ви змінили текст згоди — підвищте версію (напр. v2), щоб у журналі згод було видно, яке формулювання бачив клієнт.</Notice>}

    </Section>

    <StickyActions dirty={dirty}>
      <Button variant="ghost" icon={<MdRestore />} disabled={!dirty || busy} onClick={() => (setF(JSON.parse(orig)), setTried(false), setTouched({}))}>
        Скасувати зміни
      </Button>
      <Button icon={<MdSave />} loading={busy} disabled={!dirty} onClick={save}>
        {busy ? "Збереження…" : dirty ? "Зберегти налаштування" : "Збережено"}
      </Button>
    </StickyActions>
    </>
  );
};

export default SettingsForm;
