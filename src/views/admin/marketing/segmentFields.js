// Білий список полів DSL сегментів (MARKETING_SPEC.md §3) з типами контролів
import { EMAIL_STATUS, KINDS, RFM, SOURCES, TG_STATUS, TOPICS } from "./mkUtils";

const opts = (o) => Object.entries(o).map(([v, m]) => [v, typeof m === "string" ? m : m.label]);
const BOOL = [
  ["true", "Так"],
  ["false", "Ні"],
];

export const OPS = {
  is: "дорівнює",
  isNot: "не дорівнює",
  has: "має",
  notHas: "не має",
  contains: "містить текст",
  gte: "не менше ніж (≥)",
  lte: "не більше ніж (≤)",
  eq: "дорівнює (=)",
  daysAgoGte: "давніше ніж N днів тому",
  daysAgoLte: "за останні N днів",
};

export const FIELDS = {
  "channel.email.status": { label: "Статус email", type: "enum", ops: ["is", "isNot"], options: opts(EMAIL_STATUS) },
  topic: { label: "Тема підписки", type: "enum", ops: ["has"], options: opts(TOPICS) },
  kind: { label: "Тип клієнта", type: "enum", ops: ["is"], options: opts({ person: KINDS.person, company: KINDS.company }) },
  city: { label: "Місто", type: "text", ops: ["is", "contains"], placeholder: "Київ" },
  tags: { label: "Тег", type: "tag", ops: ["has", "notHas"], placeholder: "vip" },
  source: { label: "Джерело", type: "enum", ops: ["is"], options: opts(SOURCES) },
  isCustomer: { label: "Є покупцем (акаунт)", type: "bool", ops: ["is"], options: BOOL },
  "stats.orders": { label: "Кількість замовлень", type: "number", ops: ["gte", "lte", "eq"], min: 0 },
  "stats.ltv": { label: "Сума покупок (LTV), ₴", type: "number", ops: ["gte", "lte"], min: 0 },
  "stats.lastOrderAt": { label: "Остання покупка", type: "days", ops: ["daysAgoGte", "daysAgoLte"] },
  "stats.firstOrderAt": { label: "Перша покупка", type: "days", ops: ["daysAgoGte", "daysAgoLte"] },
  createdAt: { label: "Дата додавання в базу", type: "days", ops: ["daysAgoLte", "daysAgoGte"] },
  "stats.categories": { label: "Купував у категорії", type: "category", ops: ["has"], placeholder: "Ноутбуки" },
  "rfm.segment": { label: "RFM-сегмент", type: "enum", ops: ["is"], options: opts(RFM) },
  "channel.telegram.status": { label: "Статус Telegram", type: "enum", ops: ["is"], options: opts(TG_STATUS) },
  hasTelegram: { label: "Має Telegram", type: "bool", ops: ["is"], options: BOOL },
};

export const FIELD_OPTIONS = Object.entries(FIELDS).map(([k, f]) => [k, f.label]);

export const defaultValue = (field) => {
  const f = FIELDS[field];
  if (!f) return "";
  if (f.type === "enum") return f.options[0]?.[0] ?? "";
  if (f.type === "bool") return true;
  if (f.type === "number") return 1;
  if (f.type === "days") return 30;
  return "";
};

export const newRule = (field = "channel.email.status") => ({ field, op: FIELDS[field].ops[0], value: field === "channel.email.status" ? "subscribed" : defaultValue(field) });

export const emptyFilter = () => ({ match: "all", rules: [newRule()] });

export const normalizeFilter = (f) => ({
  match: f?.match === "any" ? "any" : "all",
  rules: Array.isArray(f?.rules) ? f.rules.filter((r) => FIELDS[r?.field]) : [],
});

// Повертає {index: повідомлення} для невалідних правил
export const validateFilter = (filter) => {
  const errs = {};
  (filter?.rules || []).forEach((r, i) => {
    const f = FIELDS[r.field];
    if (!f) errs[i] = "Невідоме поле";
    else if (!f.ops.includes(r.op)) errs[i] = "Оберіть умову";
    else if (f.type === "number" || f.type === "days") {
      const n = Number(r.value);
      if (r.value === "" || !Number.isFinite(n) || n < 0) errs[i] = "Вкажіть невід'ємне число";
    } else if (f.type !== "bool" && !String(r.value ?? "").trim()) errs[i] = "Вкажіть значення";
  });
  return errs;
};

export const describeRule = (r) => {
  const f = FIELDS[r.field];
  if (!f) return r.field;
  let v = r.value;
  if (f.type === "enum" || f.type === "bool") v = (f.options.find(([k]) => String(k) === String(r.value)) || [null, String(r.value)])[1];
  if (f.type === "days") return `${f.label}: ${r.op === "daysAgoGte" ? `понад ${v} дн. тому` : `за останні ${v} дн.`}`;
  return `${f.label} ${OPS[r.op] || r.op} «${v}»`;
};

export const describeFilter = (filter) => {
  const rules = filter?.rules || [];
  if (!rules.length) return "Усі контакти";
  return rules.map(describeRule).join(filter.match === "any" ? " АБО " : " І ");
};
