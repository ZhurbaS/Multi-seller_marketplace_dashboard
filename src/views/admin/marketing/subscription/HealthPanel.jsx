// Health-панель: GET /health → {resendConfigured, marketingFromConfigured, marketingFrom, webhookConfigured, telegramConfigured,
// dnsHint, sentToday, dailyLimit, sent7d, complaintRate7d, bounceRate7d, worker:{enabled,running,lastTickAt,lastError}, stuckScheduled, warnings}
import React from "react";
import { MdCheckCircle, MdErrorOutline, MdWarningAmber } from "react-icons/md";
import { StatusChip } from "../../../../ui";
import { fmtDateTime, num, rate } from "../mkUtils";
import { Notice, Section } from "../ui";

const TONE = {
  ok: { Icon: MdCheckCircle, chip: "success", word: "Гаразд", border: "border-(--line)", ic: "text-(--success)" },
  warn: { Icon: MdWarningAmber, chip: "warning", word: "Увага", border: "border-(--warning)", ic: "text-(--warning-ink)" },
  bad: { Icon: MdErrorOutline, chip: "danger", word: "Проблема", border: "border-(--danger)", ic: "text-(--danger)" },
};

const Row = ({ tone, title, children }) => {
  const t = TONE[tone];
  return (
    <li className={`flex items-start gap-3 rounded-(--r-md) border bg-(--surface) p-3 ${t.border}`}>
      <t.Icon aria-hidden="true" className={`mt-0.5 shrink-0 text-xl ${t.ic}`} />
      <div className="min-w-0 flex-1 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <p className="min-w-0 break-words font-semibold text-(--ink)">{title}</p>
          <StatusChip tone={t.chip} size="sm">
            {t.word}
          </StatusChip>
        </div>
        {children && <p className="mt-0.5 text-xs text-(--ink-2)">{children}</p>}
      </div>
    </li>
  );
};

const healthRows = (h) => {
  const rows = [];
  rows.push({
    tone: h.resendConfigured ? "ok" : "bad",
    title: h.resendConfigured ? "Resend API підключено" : "Resend API не підключено",
    text: h.resendConfigured ? "Ключ RESEND_API_KEY задано." : "Задайте RESEND_API_KEY у .env бекенду — без нього масові листи не надсилаються.",
  });
  rows.push({
    tone: h.marketingFromConfigured ? "ok" : "bad",
    title: h.marketingFromConfigured ? `Відправник розсилок: ${h.marketingFrom}` : "Не задано відправника розсилок",
    text: h.marketingFromConfigured
      ? "Розсилки йдуть з окремого піддомену — це захищає репутацію транзакційних листів."
      : "Задайте MARKETING_MAIL_FROM (напр. «TechScout <news@news.ваш-домен.ua>») або поле «Адреса відправника» нижче.",
  });
  rows.push({
    tone: h.webhookConfigured ? "ok" : "warn",
    title: h.webhookConfigured ? "Вебхук Resend налаштовано" : "Вебхук Resend не налаштовано",
    text: h.webhookConfigured ? "Bounce і скарги автоматично переводять контакт у стоп-список." : "Задайте RESEND_WEBHOOK_SECRET і додайте вебхук /api/webhooks/resend у панелі Resend.",
  });
  rows.push({
    tone: h.telegramConfigured ? "ok" : "warn",
    title: h.telegramConfigured ? "Telegram-бот підключено" : "Telegram-бот не підключено (необов'язково)",
    text: h.telegramConfigured ? "Канал Telegram доступний у розсилках." : "Щоб розсилати в Telegram, задайте TELEGRAM_BOT_TOKEN, TELEGRAM_BOT_USERNAME і TELEGRAM_WEBHOOK_SECRET.",
  });
  const w = h.worker || {};
  rows.push({
    tone: w.enabled === false ? "bad" : w.running ? "ok" : "warn",
    title: w.enabled === false ? "Черга відправки вимкнена" : w.running ? "Черга відправки працює" : "Черга відправки не запущена",
    text: [w.lastTickAt && `Остання перевірка: ${fmtDateTime(w.lastTickAt)}.`, w.lastError && `Помилка: ${w.lastError}`, w.enabled === false && "Приберіть MARKETING_WORKER=off у .env."]
      .filter(Boolean)
      .join(" "),
  });
  const used = h.dailyLimit ? h.sentToday / h.dailyLimit : 0;
  rows.push({
    tone: used >= 1 ? "bad" : used >= 0.8 ? "warn" : "ok",
    title: `Сьогодні надіслано ${num(h.sentToday)} з ${num(h.dailyLimit)}`,
    text: used >= 1 ? "Денний ліміт вичерпано — решта листів піде завтра." : "Денний ліміт задається в налаштуваннях і має відповідати тарифу Resend.",
  });
  const cr = Number(h.complaintRate7d) || 0;
  rows.push({
    tone: cr > 0.003 ? "bad" : cr > 0.001 ? "warn" : "ok",
    title: `Скарги на спам за 7 днів: ${rate(cr)}`,
    text: cr > 0.003 ? "Вище порогу 0,3% — призупиніть розсилки й перевірте аудиторію та джерела згод." : `Поріг — 0,3%. Надіслано за 7 днів: ${num(h.sent7d)}.`,
  });
  const br = Number(h.bounceRate7d) || 0;
  rows.push({
    tone: br > 0.04 ? "bad" : br > 0.02 ? "warn" : "ok",
    title: `Недоставлені (bounce) за 7 днів: ${rate(br)}`,
    text: br > 0.04 ? "Забагато — очистіть базу від неіснуючих адрес." : "Норма — до 2%.",
  });
  if (h.stuckScheduled) rows.push({ tone: "bad", title: `${num(h.stuckScheduled)} розсилок чекають на відправку`, text: "Ймовірно, не налаштовано відправника — див. пункти вище." });
  return rows;
};

const HealthPanel = ({ health: h }) => {
  if (!h) return null;
  const rows = healthRows(h);
  const bad = rows.filter((r) => r.tone === "bad").length;
  const warn = rows.filter((r) => r.tone === "warn").length;
  return (
    <Section
      title="Стан системи розсилок"
      hint={bad ? `Проблем: ${bad}${warn ? `, попереджень: ${warn}` : ""}` : warn ? `Усе працює; попереджень: ${warn}` : "Усе налаштовано"}
    >
      <ul className="grid gap-2 lg:grid-cols-2">
        {rows.map((r) => (
          <Row key={r.title} tone={r.tone} title={r.title}>
            {r.text}
          </Row>
        ))}
      </ul>
      {(h.warnings || []).length > 0 && (
        <Notice tone="warn">
          <ul className="flex list-disc flex-col gap-1 pl-4">
            {h.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </Notice>
      )}
      {h.dnsHint && (
        <Notice>
          <b>DNS піддомену розсилок (SPF / DKIM / DMARC).</b> {h.dnsHint}
        </Notice>
      )}
    </Section>
  );
};

export default HealthPanel;
