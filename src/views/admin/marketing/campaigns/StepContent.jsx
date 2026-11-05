// Крок 3: блоковий редактор, прев'ю ПК/моб (POST /campaigns/:id/preview з незбереженими змінами),
// текстова версія, Telegram-текст, «Тестовий лист» (POST /campaigns/:id/test)
import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import api from "../../../../api/api";
import { useDebounced } from "../hooks";
import { MdCheckCircleOutline, MdSend } from "react-icons/md";
import { Button } from "../../../../ui";
import { CRM, EMAIL_RE, errMsg, inputCls } from "../mkUtils";
import { Counter, Field, Notice, Section } from "../ui";
import BlockEditor from "../blocks/BlockEditor";
import EmailPreview from "../blocks/EmailPreview";
import { useProductsMap } from "../blocks/productsCache";
import { blocksToText, renderPreviewHtml } from "../blocks/blockUtils";
import { TG_MAX, draftBody } from "./campaignUtils";

const TestMail = ({ form, ensureId, sent, onSent }) => {
  const [to, setTo] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const bad = to.trim() && !EMAIL_RE.test(to.trim());
  const send = async () => {
    if (bad) return setError("Некоректна адреса");
    setError("");
    setBusy(true);
    try {
      const cid = await ensureId();
      if (!cid) return;
      const { data } = await api.post(`${CRM}/campaigns/${cid}/test`, { to: to.trim(), ...draftBody(form) });
      toast.success(`Тестовий лист надіслано на ${data?.to || to}`);
      onSent();
    } catch (e) {
      const d = e?.response?.data;
      setError([errMsg(e, "Не вдалося надіслати тестовий лист"), d?.hint, d?.reason].filter(Boolean).join(" — "));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Section title="Тестовий лист" hint="Тема з позначкою [ТЕСТ]; посилання без підрахунку кліків; не враховується в ліміті частоти.">
      <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
        <div className="flex-1">
          <Field id="cw-test" label="Кому надіслати" hint="Порожньо — на e-mail вашого акаунта адміністратора." error={error}>
            <input
              id="cw-test"
              type="email"
              inputMode="email"
              autoComplete="email"
              className={inputCls}
              value={to}
              placeholder="you@example.com"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "cw-test-err" : "cw-test-hint"}
              onChange={(e) => setTo(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), send())}
            />
          </Field>
        </div>
        <Button icon={<MdSend />} onClick={send} loading={busy} disabled={busy || !form.subject.trim() || !form.blocks.length} className="shrink-0 sm:mb-6">
          {busy ? "Надсилаємо…" : "Надіслати тест"}
        </Button>
      </div>
      {sent && (
        <p className="inline-flex items-center gap-1.5 text-xs font-medium text-(--success)">
          <MdCheckCircleOutline aria-hidden="true" className="shrink-0 text-base" /> Тестовий лист надіслано в цій сесії. Перевірте вигляд у Gmail/Outlook і на телефоні.
        </p>
      )}
    </Section>
  );
};

const StepContent = ({ form, set, id, ensureId, showErrors, errors, testSent, onTestSent }) => {
  const email = form.channels.includes("email");
  const tg = form.channels.includes("telegram");
  const body = JSON.stringify(draftBody(form));
  const deb = useDebounced(body, 900);
  const [pv, setPv] = useState({ html: "", text: "", telegram: null, loading: false, error: "", key: "" });
  const req = useRef(0);
  const productsMap = useProductsMap(form.blocks.flatMap((b) => (b.type === "products" ? b.productIds || [] : [])));

  const load = async (payload) => {
    const my = ++req.current;
    setPv((p) => ({ ...p, loading: true, error: "" }));
    try {
      const cid = id || (await ensureId());
      if (!cid) throw new Error("no-id");
      const { data } = await api.post(`${CRM}/campaigns/${cid}/preview`, JSON.parse(payload));
      if (my === req.current) setPv({ html: data.html || "", text: data.text || "", telegram: data.telegram || null, loading: false, error: "", key: payload });
    } catch (e) {
      if (my === req.current)
        setPv((p) => ({ ...p, loading: false, key: payload, error: e?.message === "no-id" ? "Спершу збережіть чернетку" : `${errMsg(e, "Прев'ю недоступне")}. Показано схематичний вигляд.` }));
    }
  };

  useEffect(() => {
    load(deb);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deb]);

  // Фолбек — схематичне прев'ю на клієнті, якщо сервер не відповів
  const fallback = pv.error || !pv.html;
  const html = fallback ? renderPreviewHtml({ subject: form.subject, preheader: form.preheader, blocks: form.blocks, productsMap }) : pv.html;
  const text = fallback ? blocksToText(form.blocks) : pv.text;

  return (
    <>
      <h2 className="text-lg font-semibold text-(--ink)">Крок 3. Зміст</h2>
      {!email && tg && <Notice>Обрано лише Telegram — лист не надсилається, але блоки використовуються для тексту й кнопки повідомлення, якщо Telegram-текст порожній.</Notice>}
      {errors.blocks && (
        <p role="alert" className="text-sm font-medium text-(--danger)">
          {errors.blocks}
        </p>
      )}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start">
        <div className="flex flex-col gap-4 min-w-0">
          <Section title="Блоки листа" hint="Шапка з логотипом, позначка «Реклама», реквізити й посилання відписки додаються автоматично.">
            <BlockEditor value={form.blocks} onChange={(blocks) => set({ blocks })} showErrors={showErrors} />
          </Section>
          {tg && (
            <Section title="Текст для Telegram" hint="Необов'язково. Порожньо — заголовок, перший абзац і перша кнопка листа. Внизу автоматично: «Реклама · Відписатися: /stop».">
              <Field id="cw-tg" label="Повідомлення в боті" error={errors.telegramText} counter={<Counter value={form.telegramText} max={TG_MAX} />}>
                <textarea
                  id="cw-tg"
                  rows={6}
                  className={inputCls}
                  value={form.telegramText}
                  maxLength={TG_MAX}
                  aria-invalid={errors.telegramText ? true : undefined}
                  onChange={(e) => set({ telegramText: e.target.value })}
                />
              </Field>
            </Section>
          )}
          {email && <TestMail form={form} ensureId={ensureId} sent={testSent} onSent={onTestSent} />}
        </div>
        <Section title="Прев'ю" className="xl:sticky xl:top-4 min-w-0">
          <EmailPreview
            html={html}
            text={text}
            telegram={pv.telegram}
            subject={form.subject}
            preheader={form.preheader}
            loading={pv.loading}
            error={pv.error}
            stale={body !== pv.key && !pv.loading}
            onRefresh={() => load(body)}
            showTelegram={tg}
            note={fallback ? "Схематичне прев'ю: кольори теми магазину й реквізити підставить сервер." : "Так лист виглядатиме в поштовому клієнті (посилання в прев'ю без підрахунку кліків)."}
          />
        </Section>
      </div>
    </>
  );
};

export default StepContent;
