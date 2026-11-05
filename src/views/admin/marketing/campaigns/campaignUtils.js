// Розсилки: форма майстра ⇄ тіло API (back/controllers/campaignController.js normalizeCampaignInput)
import { stripKeys, validateBlocks, withKeys } from "../blocks/blockUtils";
import { emptyFilter, normalizeFilter, validateFilter } from "../segmentFields";

export const SUBJECT_MAX = 200;
export const SUBJECT_SOFT = 60; // рекомендована довжина теми для мобільних клієнтів
export const PREHEADER_MAX = 250;
export const TG_MAX = 4000;
export const MAX_SCHEDULE_DAYS = 90;

export const STEPS = [
  { id: 1, label: "Основне" },
  { id: 2, label: "Кому" },
  { id: 3, label: "Зміст" },
  { id: 4, label: "Відправлення" },
];

export const CHANNEL_LABELS = { email: "Email", telegram: "Telegram" };

export const emptyForm = (segmentId = "") => ({
  name: "",
  subject: "",
  preheader: "",
  topic: "promo",
  channels: ["email"],
  audience: "segment",
  segmentId,
  filter: emptyFilter(),
  blocks: withKeys([
    { type: "heading", text: "", level: 1 },
    { type: "text", text: "" },
    { type: "button", label: "", url: "" },
  ]),
  telegramText: "",
  utm: { campaign: "", source: "email", medium: "newsletter" },
});

export const toForm = (c) => ({
  name: c.name || "",
  subject: c.subject || "",
  preheader: c.preheader || "",
  topic: c.topic || "promo",
  channels: c.channels?.length ? c.channels : ["email"],
  audience: c.filter && !c.segmentId ? "rules" : "segment",
  segmentId: c.segmentId ? String(c.segmentId) : "",
  filter: c.filter ? normalizeFilter(c.filter) : emptyFilter(),
  blocks: withKeys(c.blocks || []),
  telegramText: c.telegramText || "",
  utm: { campaign: "", source: "email", medium: "newsletter", ...(c.utm || {}) },
});

// Тіло PUT/POST. Сегмент або ad-hoc фільтр — взаємовиключні (бекенд обнуляє інше)
export const toBody = (f) => ({
  name: f.name.trim() || f.subject.trim() || "Нова розсилка",
  subject: f.subject.trim(),
  preheader: f.preheader.trim(),
  topic: f.topic,
  channels: f.channels,
  segmentId: f.audience === "segment" ? f.segmentId || null : null,
  filter: f.audience === "rules" ? f.filter : null,
  blocks: stripKeys(f.blocks),
  telegramText: f.telegramText,
  utm: f.utm,
});

// Поля, які прев'ю/тест приймають поверх збереженої кампанії (withDraft на бекенді)
export const draftBody = (f) => ({ subject: f.subject.trim(), preheader: f.preheader.trim(), blocks: stripKeys(f.blocks), telegramText: f.telegramText, utm: f.utm });

// Ключ аудиторії — estimate застаріває, якщо змінились сегмент/правила/тема/канали
export const audienceKey = (f) => JSON.stringify([f.audience, f.audience === "segment" ? f.segmentId : f.filter, f.topic, [...f.channels].sort()]);

export const stepErrors = (f, step) => {
  const e = {};
  if (step === 1) {
    if (!f.name.trim()) e.name = "Вкажіть внутрішню назву розсилки";
    if (f.channels.includes("email") && !f.subject.trim()) e.subject = "Вкажіть тему листа";
    if (f.subject.length > SUBJECT_MAX) e.subject = `Тема — до ${SUBJECT_MAX} символів`;
    if (!f.channels.length) e.channels = "Оберіть хоча б один канал";
  }
  if (step === 2) {
    if (f.audience === "segment" && !f.segmentId) e.segmentId = "Оберіть сегмент";
    if (f.audience === "rules") {
      if (!f.filter.rules.length) e.filter = "Додайте хоча б одну умову";
      else if (Object.keys(validateFilter(f.filter)).length) e.filter = "Заповніть усі умови";
    }
  }
  if (step === 3) {
    const onlyTg = !f.channels.includes("email");
    if (!f.blocks.length && !(onlyTg && f.telegramText.trim())) e.blocks = "Додайте хоча б один блок";
    else if (Object.keys(validateBlocks(f.blocks)).length) e.blocks = "Заповніть обов'язкові поля блоків";
    if (f.telegramText.length > TG_MAX) e.telegramText = `До ${TG_MAX} символів`;
  }
  return e;
};

export const firstInvalidStep = (f) => [1, 2, 3].find((s) => Object.keys(stepErrors(f, s)).length) || null;

// Межі для datetime-local (локальний час браузера)
export const localInput = (d) => {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

export const scheduleError = (value) => {
  if (!value) return "Оберіть дату й час";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Некоректна дата";
  if (d.getTime() < Date.now() + 60 * 1000) return "Час має бути в майбутньому";
  if (d.getTime() > Date.now() + MAX_SCHEDULE_DAYS * 864e5) return `Не далі ніж на ${MAX_SCHEDULE_DAYS} днів`;
  return "";
};

