// Крок 4: чеклист, зараз / за розкладом, вбудоване підтвердження з кількістю отримувачів (POST /campaigns/:id/send)
import React, { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../../../api/api";
import { useApiGet } from "../hooks";
import { MdCalculate, MdCheck, MdClose, MdPriorityHigh, MdSchedule, MdSend } from "react-icons/md";
import { Button } from "../../../../ui";
import { BASE, CAMPAIGN_TOPICS, CRM, btn, errMsg, fmtDateTime, inputCls, num } from "../mkUtils";
import { Confirm, Notice, Section, Segmented } from "../ui";
import EstimateView from "./EstimateView";
import { CHANNEL_LABELS, MAX_SCHEDULE_DAYS, localInput, scheduleError } from "./campaignUtils";

const ITEM = {
  ok: { icon: <MdCheck />, cls: "bg-(--success-soft) text-(--success)", sr: "виконано" },
  warn: { icon: <MdPriorityHigh />, cls: "bg-(--warning-soft) text-(--warning-ink)", sr: "рекомендовано" },
  bad: { icon: <MdClose />, cls: "bg-(--danger-soft) text-(--danger)", sr: "не виконано" },
};

const Check = ({ state, title, children, action }) => {
  const m = ITEM[state];
  return (
    <li className="flex items-start gap-3 rounded-(--r-md) border border-(--line) bg-(--surface-2) p-2.5">
      <span className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-sm font-bold ${m.cls}`} aria-hidden="true">
        {m.icon}
      </span>
      <div className="flex-1 min-w-0 text-sm">
        <p className="font-semibold text-(--ink)">
          {title} <span className="sr-only">({m.sr})</span>
        </p>
        {children && <p className="text-xs text-(--ink-2)">{children}</p>}
      </div>
      {action}
    </li>
  );
};

const StepSend = ({ form, id, save, estimate, fresh, onEstimate, setEstimate, testSent, valid, onGo, onSent }) => {
  const settings = useApiGet(`${CRM}/settings`);
  const health = useApiGet(`${CRM}/health`);
  const [mode, setMode] = useState("now");
  const [at, setAt] = useState(() => localInput(new Date(Date.now() + 2 * 3600e3)));
  const [ask, setAsk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const s = settings.data?.settings;
  const h = health.data;
  const email = form.channels.includes("email");
  const eligible = fresh ? Number(estimate.data?.eligible) || 0 : 0;
  const schedErr = mode === "later" ? scheduleError(at) : "";
  const mailOff = email && h && (!h.resendConfigured || !h.marketingFromConfigured);
  const blocking = !valid[1] || !valid[2] || !valid[3] || !fresh || !eligible || !!schedErr || !id;

  const go = (n) => (
    <button type="button" className={btn.small} onClick={() => onGo(n)}>
      Виправити
    </button>
  );

  const send = async () => {
    setBusy(true);
    setError(null);
    try {
      const cid = await save();
      if (!cid) return;
      const body = mode === "later" ? { scheduleAt: new Date(at).toISOString() } : {};
      const { data } = await api.post(`${CRM}/campaigns/${cid}/send`, body);
      toast.success(mode === "later" ? `Розсилку заплановано на ${fmtDateTime(data?.campaign?.scheduledAt || at)}` : "Розсилку поставлено в чергу відправки");
      setAsk(false);
      onSent();
    } catch (e) {
      const d = e?.response?.data || {};
      if (d.estimate) setEstimate(d.estimate);
      setError({ text: errMsg(e, "Не вдалося запустити розсилку"), hint: d.hint });
      setAsk(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <h2 className="text-lg font-semibold text-(--ink)">Крок 4. Відправлення</h2>
      <Section title="Перевірка перед відправкою">
        <ul className="flex flex-col gap-2">
          <Check state={valid[1] ? "ok" : "bad"} title="Назва, тема листа й канали" action={!valid[1] && go(1)}>
            {form.subject ? `«${form.subject}»` : "Тема не вказана"} · {CAMPAIGN_TOPICS[form.topic]} · {form.channels.map((c) => CHANNEL_LABELS[c]).join(", ")}
          </Check>
          <Check state={valid[2] ? "ok" : "bad"} title="Аудиторія" action={!valid[2] && go(2)}>
            {form.audience === "segment" ? "Збережений сегмент" : "Власні правила"}
          </Check>
          <Check state={valid[3] ? "ok" : "bad"} title="Зміст листа" action={!valid[3] && go(3)}>
            {form.blocks.length} блок(ів)
          </Check>
          <Check
            state={fresh && eligible ? "ok" : "bad"}
            title={fresh ? `Отримувачів: ${num(eligible)}` : "Оцінка аудиторії"}
            action={
              <Button size="sm" variant="secondary" icon={<MdCalculate />} onClick={onEstimate} loading={estimate.loading}>
                {estimate.loading ? "Рахуємо…" : fresh ? "Перерахувати" : "Порахувати"}
              </Button>
            }
          >
            {!fresh ? "Порахуйте отримувачів — без позитивної оцінки відправка неможлива." : !eligible ? "Немає жодного отримувача: перевірте сегмент і тему." : "Згоду перевіримо ще раз перед кожною відправкою."}
          </Check>
          <Check state="ok" title="Позначка «Реклама», реквізити продавця й відписка">
            Додаються у футер автоматично (List-Unsubscribe + посилання). Реквізити — у розділі{" "}
            <Link to={`${BASE}/company`} className="font-medium text-(--brand-ink) underline">
              «Реквізити для рахунків»
            </Link>
            .
          </Check>
          {email && (
            <Check state={testSent ? "ok" : "warn"} title={testSent ? "Тестовий лист надіслано" : "Тестовий лист не надсилався"} action={!testSent && go(3)}>
              Рекомендуємо перевірити лист у пошті перед масовою відправкою.
            </Check>
          )}
          {email && h && (
            <Check state={mailOff ? "bad" : "ok"} title={mailOff ? "Відправка e-mail не налаштована" : `Відправник: ${h.marketingFrom || "налаштовано"}`}>
              {mailOff ? (
                <>
                  Розсилка чекатиме в статусі «Заплановано». Див.{" "}
                  <Link to={`${BASE}/subscription-analytics`} className="font-medium text-(--brand-ink) underline">
                    Підписка: аналітика
                  </Link>
                  .
                </>
              ) : (
                `Сьогодні надіслано ${num(h.sentToday)} з ${num(h.dailyLimit)} (денний ліміт).`
              )}
            </Check>
          )}
        </ul>
      </Section>

      {estimate.data && fresh && (
        <Section title="Аудиторія">
          <EstimateView data={estimate.data} compact />
        </Section>
      )}

      <Section title="Коли надіслати" hint={s ? `Листи йдуть лише у вікні ${s.sendWindow?.from}–${s.sendWindow?.to} (Київ), пачками по ${s.batchSize}, не більше ${num(s.dailyLimit)} на день.` : undefined}>
        <Segmented
          label="Час відправки"
          value={mode}
          onChange={setMode}
          options={[
            ["now", "Зараз"],
            ["later", "За розкладом"],
          ]}
        />
        {mode === "later" && (
          <div className="flex flex-col gap-1 max-w-[320px]">
            <label htmlFor="cw-at" className="text-sm font-medium text-(--ink)">
              Дата й час (ваш місцевий час)
            </label>
            <input
              id="cw-at"
              type="datetime-local"
              className={`${inputCls} ${schedErr ? "!border-(--danger)" : ""}`}
              value={at}
              min={localInput(new Date())}
              max={localInput(new Date(Date.now() + MAX_SCHEDULE_DAYS * 864e5))}
              aria-invalid={schedErr ? true : undefined}
              aria-describedby="cw-at-err"
              onChange={(e) => setAt(e.target.value)}
            />
            <span id="cw-at-err" className={`text-xs ${schedErr ? "font-medium text-(--danger)" : "text-(--ink-2)"}`} role={schedErr ? "alert" : undefined}>
              {schedErr ? schedErr : `До ${MAX_SCHEDULE_DAYS} днів наперед. Заплановану розсилку можна скасувати.`}
            </span>
          </div>
        )}
      </Section>

      {error && (
        <Notice tone="error">
          <b>{error.text}</b>
          {error.hint && <span className="block text-xs pt-1">{error.hint}</span>}
        </Notice>
      )}

      <div className="flex flex-col items-stretch gap-1 sm:items-end">
        <Button variant="cta" size="lg" icon={mode === "later" ? <MdSchedule /> : <MdSend />} disabled={blocking || busy} onClick={() => setAsk(true)}>
          {mode === "later" ? "Запланувати розсилку…" : "Надіслати розсилку…"}
        </Button>
        {blocking && <p className="text-xs text-(--ink-2) sm:text-right">Кнопка стане активною, коли всі обов'язкові пункти виконано.</p>}
      </div>

      {ask && (
        <Confirm
          title={mode === "later" ? "Запланувати розсилку?" : "Надіслати розсилку зараз?"}
          tone="success"
          busy={busy}
          confirmLabel={mode === "later" ? "Так, запланувати" : `Так, надіслати ${num(eligible)}`}
          onConfirm={send}
          onCancel={() => setAsk(false)}
        >
          <p>
            «{form.name}» отримають приблизно <b className="text-lg text-(--ink)">{num(eligible)}</b> контакт(ів)
            {estimate.data?.byChannel && (
              <>
                {" "}
                (email: {num(estimate.data.byChannel.email)}
                {form.channels.includes("telegram") ? `, Telegram: ${num(estimate.data.byChannel.telegram)}` : ""})
              </>
            )}
            .
          </p>
          <p className="text-(--ink-2)">{mode === "later" ? `Старт: ${fmtDateTime(at)}.` : "Відправка почнеться в найближче вікно відправки."} Після старту зміст змінити не можна — лише скасувати решту.</p>
          {estimate.data?.estimatedDays > 1 && <p className="font-medium text-(--warning-ink)">Через денний ліміт відправка триватиме ≈{num(estimate.data.estimatedDays)} дн.</p>}
        </Confirm>
      )}
    </>
  );
};

export default StepSend;
