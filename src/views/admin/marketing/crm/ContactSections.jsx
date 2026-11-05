import React, { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../../../api/api";
import {
  BASE,
  CONSENT_ACTIONS,
  CRM,
  EMAIL_STATUS,
  MSG_STATUS,
  RFM,
  SKIP_REASONS,
  SOURCES,
  TG_STATUS,
  TOPICS,
  btn,
  errMsg,
  fmtDate,
  fmtDateTime,
  inputCls,
  money,
  num,
} from "../mkUtils";
import { Badge, Confirm, Counter, Field, Notice, Section } from "../ui";

// ---- Канали з діями ----
export const ChannelsSection = ({ contact, onChanged }) => {
  const [dlg, setDlg] = useState(null); // {channel, status}
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const em = contact.channels?.email || {};
  const tg = contact.channels?.telegram || {};

  const open = (channel, status) => {
    setReason("");
    setDlg({ channel, status });
  };
  const apply = async () => {
    if (dlg.status === "subscribed" && reason.trim().length < 5) return;
    setBusy(true);
    try {
      await api.put(`${CRM}/contacts/${contact._id}/status`, { channel: dlg.channel, status: dlg.status, reason: reason.trim() });
      toast.success(dlg.status === "subscribed" ? "Підписку встановлено" : "Контакт відписано");
      setDlg(null);
      onChanged();
    } catch (err) {
      toast.error(errMsg(err, "Не вдалося змінити статус"));
    } finally {
      setBusy(false);
    }
  };

  const emailBlocked = ["complained"].includes(em.status);
  const row = (label, meta, fallback, dates, actions) => (
    <div className="flex flex-col justify-between gap-2 rounded-(--r-md) border border-(--line) bg-(--surface-2) p-3 sm:flex-row sm:items-center">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-(--ink)">{label}</span>
          <Badge meta={meta} fallback={fallback} />
        </div>
        <span className="text-[11px] text-(--ink-2)">{dates}</span>
      </div>
      <div className="flex gap-2 flex-wrap">{actions}</div>
    </div>
  );

  return (
    <Section title="Канали і згоди" hint="Транзакційні листи (замовлення, рахунки) надсилаються незалежно від цих статусів.">
      {row(
        `Email${contact.email ? `: ${contact.email}` : ""}`,
        EMAIL_STATUS[em.status || "none"],
        em.status,
        [em.subscribedAt && `підписка ${fmtDate(em.subscribedAt)}`, em.confirmedAt && `підтверджено ${fmtDate(em.confirmedAt)}`, em.unsubscribedAt && `відписка ${fmtDate(em.unsubscribedAt)}`]
          .filter(Boolean)
          .join(" · ") || "—",
        contact.email ? (
          em.status === "subscribed" || em.status === "pending" ? (
            <button type="button" className={btn.small} onClick={() => open("email", "unsubscribed")}>
              Відписати
            </button>
          ) : (
            <button type="button" className={btn.small} disabled={emailBlocked} title={emailBlocked ? "Скарга на спам — повторна підписка заборонена" : undefined} onClick={() => open("email", "subscribed")}>
              Підписати (з причиною)
            </button>
          )
        ) : (
          <span className="text-xs text-(--ink-2)">Немає email</span>
        )
      )}
      {row(
        `Telegram${tg.username ? `: @${tg.username}` : ""}`,
        TG_STATUS[tg.status || "none"],
        tg.status,
        [tg.subscribedAt && `підписка ${fmtDate(tg.subscribedAt)}`, tg.unsubscribedAt && `відписка ${fmtDate(tg.unsubscribedAt)}`].filter(Boolean).join(" · ") ||
          "Підписатися в Telegram клієнт може лише сам через бота",
        tg.status === "subscribed" ? (
          <button type="button" className={btn.small} onClick={() => open("telegram", "unsubscribed")}>
            Відписати
          </button>
        ) : null
      )}
      {dlg && (
        <Confirm
          title={dlg.status === "subscribed" ? "Підписати контакт на маркетинг?" : "Відписати контакт?"}
          tone={dlg.status === "subscribed" ? "success" : "danger"}
          confirmLabel={dlg.status === "subscribed" ? "Підписати" : "Відписати"}
          busy={busy}
          disabled={dlg.status === "subscribed" && reason.trim().length < 5}
          onConfirm={apply}
          onCancel={() => setDlg(null)}
        >
          {dlg.status === "subscribed" ? (
            <Notice tone="warn">
              Підписуйте вручну лише за наявності згоди людини (ст. 14-3 Закону «Про рекламу»). Причина й ваш акаунт буде записано в журнал згод.
              {em.status === "bounced" && " Увага: на цю адресу листи не доставлялися (bounce) — перевірте адресу."}
            </Notice>
          ) : (
            <p>Маркетингові повідомлення в каналі «{dlg.channel === "email" ? "Email" : "Telegram"}» припиняться. Дію буде записано в журнал згод.</p>
          )}
          <Field id="ch-reason" label={dlg.status === "subscribed" ? "Причина / доказ згоди *" : "Причина (необов'язково)"} counter={<Counter value={reason} max={300} />}>
            <textarea id="ch-reason" data-autofocus rows={2} className={inputCls} maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
        </Confirm>
      )}
    </Section>
  );
};

// ---- Таймлайн журналу згод ----
export const ConsentTimeline = ({ consents = [] }) => {
  const list = [...consents].sort((a, b) => new Date(b.at || b.createdAt) - new Date(a.at || a.createdAt));
  return (
    <Section title="Журнал згод" hint="Незмінний журнал: хто, коли, де і з яким текстом дав або відкликав згоду.">
      {!list.length ? (
        <p className="text-sm text-(--ink-2)">Записів немає.</p>
      ) : (
        <ol className="relative border-l-2 border-(--line) ml-2 flex flex-col gap-3">
          {list.map((c, i) => {
            const neg = ["opt_out", "bounce", "complaint", "telegram_stop", "erasure_request"].includes(c.action);
            return (
              <li key={c._id || i} className="ml-4">
                <span className={`absolute -left-[7px] w-3 h-3 rounded-full mt-1.5 ${neg ? "bg-(--danger)" : "bg-(--success)"}`} aria-hidden="true" />
                <div className="text-sm">
                  <b>{CONSENT_ACTIONS[c.action] || c.action}</b>
                  <span className="text-(--ink-2)">
                    {" "}
                    · {c.channel === "telegram" ? "Telegram" : "Email"}
                    {c.topic && c.topic !== "all" && ` · тема «${TOPICS[c.topic] || c.topic}»`}
                  </span>
                </div>
                <div className="text-[11px] text-(--ink-2)">
                  {fmtDateTime(c.at || c.createdAt)} · джерело: {SOURCES[c.source] || c.source || "—"}
                  {c.ip && ` · IP ${c.ip}`}
                  {c.textVersion && ` · текст ${c.textVersion}`}
                </div>
                {(c.text || c.userAgent || c.meta) && (
                  <details className="text-xs mt-1">
                    <summary className="cursor-pointer text-(--ink-2)">Подробиці</summary>
                    {c.text && <p className="mt-1 rounded-(--r-md) border border-(--line) bg-(--surface-2) p-3 whitespace-pre-wrap">«{c.text}»</p>}
                    {c.userAgent && <p className="mt-1 text-(--ink-2) break-all">UA: {c.userAgent}</p>}
                    {c.meta && Object.keys(c.meta).length > 0 && <pre className="mt-1 text-(--ink-2) whitespace-pre-wrap break-all">{JSON.stringify(c.meta, null, 1)}</pre>}
                  </details>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </Section>
  );
};

// ---- Історія розсилок ----
export const MessagesSection = ({ messages = [] }) => (
  <Section title="Історія розсилок" hint="Останні 50 маркетингових повідомлень.">
    {!messages.length ? (
      <p className="text-sm text-(--ink-2)">Розсилок ще не було.</p>
    ) : (
      <ul className="flex flex-col divide-y divide-(--line) text-sm rounded-(--r-md) bg-(--surface-2)">
        {messages.map((m, i) => {
          const cid = m.campaignId?._id || m.campaignId;
          const title = m.campaignId?.name || m.campaignName || (m.automation ? `Автоматизація: ${m.automation}` : "Розсилка");
          return (
            <li key={m._id || i} className="px-3 py-2 flex flex-wrap items-center justify-between gap-2">
              <span className="min-w-0">
                {cid ? (
                  <Link to={`${BASE}/campaigns/${cid}`} className="font-medium text-(--brand-ink) underline-offset-2 hover:underline">
                    {title}
                  </Link>
                ) : (
                  title
                )}
                <span className="text-xs text-(--ink-2)"> · {m.channel === "telegram" ? "Telegram" : "Email"} · {fmtDateTime(m.sentAt || m.queuedAt)}</span>
              </span>
              <span className="text-xs">
                {MSG_STATUS[m.status] || m.status}
                {m.skipReason && ` (${SKIP_REASONS[m.skipReason]?.label || m.skipReason})`}
                {m.clicks > 0 && ` · кліків: ${m.clicks}`}
              </span>
            </li>
          );
        })}
      </ul>
    )}
  </Section>
);

// ---- Замовлення ----
export const OrdersSection = ({ orders, contact }) => (
  <Section title="Замовлення">
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
      <div className="rounded-(--r-md) border border-(--line) bg-(--surface-2) p-3">
        <span className="text-xs text-(--ink-2) block">Замовлень</span>
        <b className="tabular-nums">{num(orders?.count ?? contact.stats?.orders ?? 0)}</b>
      </div>
      <div className="rounded-(--r-md) border border-(--line) bg-(--surface-2) p-3">
        <span className="text-xs text-(--ink-2) block">LTV</span>
        <b className="tabular-nums">{money(orders?.ltv ?? contact.stats?.ltv ?? 0)}</b>
      </div>
      <div className="rounded-(--r-md) border border-(--line) bg-(--surface-2) p-3">
        <span className="text-xs text-(--ink-2) block">Середній чек</span>
        <b className="tabular-nums">{money(contact.stats?.avgOrder || 0)}</b>
      </div>
      <div className="rounded-(--r-md) border border-(--line) bg-(--surface-2) p-3">
        <span className="text-xs text-(--ink-2) block">Остання</span>
        <b>{fmtDate(contact.stats?.lastOrderAt)}</b>
      </div>
    </div>
    {orders?.last5?.length > 0 && (
      <ul className="flex flex-col divide-y divide-(--line) text-sm rounded-(--r-md) bg-(--surface-2)">
        {orders.last5.map((o) => (
          <li key={o._id} className="px-3 py-2 flex justify-between gap-2">
            <Link to={`${BASE}/order/details/${o._id}`} className="font-medium text-(--brand-ink) underline-offset-2 hover:underline">
              №{o.number || o.orderNumber || String(o._id).slice(-6)} · {fmtDate(o.createdAt)}
            </Link>
            <span className="tabular-nums">
              {money(o.price ?? o.total)} {o.delivery_status && <span className="text-xs text-(--ink-2)">· {o.delivery_status}</span>}
            </span>
          </li>
        ))}
      </ul>
    )}
  </Section>
);

// ---- RFM та інтереси ----
const Score = ({ label, v, hint }) => (
  <div className="flex flex-col gap-1" title={hint}>
    <span className="text-xs text-(--ink-2)">{label}</span>
    <div className="flex gap-0.5" role="img" aria-label={`${label}: ${v || 0} з 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`h-2.5 w-5 rounded-sm ${i <= (v || 0) ? "bg-(--success)" : "bg-(--line)"}`} />
      ))}
    </div>
  </div>
);

export const RfmSection = ({ contact }) => {
  const rfm = contact.stats?.rfm;
  const cats = contact.stats?.categories || [];
  return (
    <Section title="RFM та інтереси" hint="R — давність останньої покупки, F — частота, M — сума. 5 — найкраще.">
      {rfm?.segment ? (
        <div className="flex flex-wrap items-end gap-4">
          <span className="text-lg font-semibold">{RFM[rfm.segment] || rfm.segment}</span>
          <Score label="Давність (R)" v={rfm.r} />
          <Score label="Частота (F)" v={rfm.f} />
          <Score label="Сума (M)" v={rfm.m} />
          {rfm.computedAt && <span className="text-[11px] text-(--ink-2)">пораховано {fmtDate(rfm.computedAt)}</span>}
        </div>
      ) : (
        <p className="text-sm text-(--ink-2)">RFM рахується для клієнтів з оплаченими замовленнями.</p>
      )}
      {cats.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {cats.map((c) => (
            <span key={c.name} className="rounded-full bg-(--brand-soft) px-2 py-0.5 text-xs text-(--brand-ink)">
              {c.name} · {c.count}
            </span>
          ))}
        </div>
      )}
    </Section>
  );
};
