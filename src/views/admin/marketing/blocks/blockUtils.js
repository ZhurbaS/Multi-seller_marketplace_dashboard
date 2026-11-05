// Блоки листа (MARKETING_SPEC.md §2) — утиліти й схематичне прев'ю на клієнті
import { URL_RE } from "../mkUtils";

// Як на бекенді (marketingSettings.safeUrl): http(s)://… або відносний шлях сайту /…
export const LINK_RE = /^(https?:\/\/\S+|\/(?!\/)\S*)$/i;
const isLink = (v) => LINK_RE.test(String(v || "").trim());

export const BLOCK_TYPES = {
  heading: { label: "Заголовок", icon: "H" },
  text: { label: "Текст", icon: "¶" },
  button: { label: "Кнопка", icon: "▭" },
  image: { label: "Зображення", icon: "🖼" },
  products: { label: "Товари", icon: "🛒" },
  divider: { label: "Роздільник", icon: "—" },
  spacer: { label: "Відступ", icon: "↕" },
};

let seq = 0;
export const uid = () => `b${Date.now().toString(36)}${(seq++).toString(36)}`;

export const newBlock = (type) => {
  const b = { type };
  if (type === "heading") Object.assign(b, { text: "", level: 1 });
  if (type === "text") b.text = "";
  if (type === "button") Object.assign(b, { label: "", url: "" });
  if (type === "image") Object.assign(b, { url: "", alt: "", href: "" });
  if (type === "products") Object.assign(b, { title: "", productIds: [] });
  return b;
};

// Внутрішній _k — стабільний ключ для React; при збереженні прибирається
export const withKeys = (blocks) => (Array.isArray(blocks) ? blocks : []).map((b) => ({ ...b, _k: b._k || uid() }));
export const stripKeys = (blocks) => (blocks || []).map(({ _k, ...b }) => b); // eslint-disable-line no-unused-vars

// {index: {field: msg}}
export const validateBlocks = (blocks) => {
  const errs = {};
  (blocks || []).forEach((b, i) => {
    const e = {};
    if (b.type === "heading" && !String(b.text || "").trim()) e.text = "Введіть текст заголовка";
    if (b.type === "text" && !String(b.text || "").trim()) e.text = "Введіть текст";
    if (b.type === "button") {
      if (!String(b.label || "").trim()) e.label = "Текст кнопки";
      if (!isLink(b.url)) e.url = "Посилання: https://… або шлях сайту /…";
    }
    if (b.type === "image") {
      if (!isLink(b.url)) e.url = "Адреса зображення: https://… або /…";
      if (!String(b.alt || "").trim()) e.alt = "Опишіть зображення (alt)";
      if (b.href && !isLink(b.href)) e.href = "Посилання: https://… або шлях сайту /…";
    }
    if (b.type === "products" && !(b.productIds || []).length) e.productIds = "Додайте хоча б один товар";
    if (Object.keys(e).length) errs[i] = e;
  });
  return errs;
};

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const safeUrl = (u) => (URL_RE.test(String(u || "").trim()) ? esc(String(u).trim()) : "#");
const safeImg = (u) => {
  const s = String(u || "").trim();
  if (URL_RE.test(s)) return esc(s);
  return /^\/(?!\/)/.test(s) && typeof window !== "undefined" ? esc(`${window.location.origin}${s}`) : "";
};

// Проста розмітка: **жирний**, [текст](url), абзаци по порожньому рядку
export const miniMarkup = (text) =>
  String(text || "")
    .split(/\n\s*\n/)
    .map((p) =>
      `<p style="margin:0 0 12px;line-height:1.55">${esc(p)
        .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
        .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" style="color:#4f46e5">$1</a>')
        .replace(/\n/g, "<br>")}</p>`
    )
    .join("");

// Схематичне прев'ю (остаточний HTML формує сервер — тема магазину, реквізити, відписка)
export const renderPreviewHtml = ({ subject, preheader, blocks = [], productsMap = {} }) => {
  const body = blocks
    .map((b) => {
      switch (b.type) {
        case "heading":
          return `<h${b.level === 2 ? 2 : 1} style="margin:0 0 12px;font-size:${b.level === 2 ? 20 : 26}px">${esc(b.text)}</h${b.level === 2 ? 2 : 1}>`;
        case "text":
          return miniMarkup(b.text);
        case "button":
          return `<p style="margin:16px 0;text-align:center"><a href="${safeUrl(b.url)}" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">${esc(b.label || "Кнопка")}</a></p>`;
        case "image":
          return safeImg(b.url) ? `<p style="margin:0 0 12px"><img src="${safeImg(b.url)}" alt="${esc(b.alt)}" style="max-width:100%;height:auto;display:block;border-radius:4px"></p>` : "";
        case "products": {
          const items = (b.productIds || []).slice(0, 6).map((id) => productsMap[id] || { name: "Товар", _id: id });
          return `${b.title ? `<h3 style="margin:8px 0">${esc(b.title)}</h3>` : ""}<table role="presentation" width="100%" style="border-collapse:collapse"><tr>${items
            .map(
              (p, i) =>
                `${i && i % 2 === 0 ? "</tr><tr>" : ""}<td style="width:50%;padding:6px;vertical-align:top"><div style="border:1px solid #e5e7eb;border-radius:6px;padding:8px;text-align:center">${
                  p.image ? `<img src="${safeUrl(p.image)}" alt="" style="max-width:100%;height:110px;object-fit:contain">` : '<div style="height:110px;background:#f3f4f6"></div>'
                }<div style="font-size:14px;margin:6px 0">${esc(p.name)}</div>${p.price != null ? `<b>${esc(p.price)} ₴</b>` : ""}</div></td>`
            )
            .join("")}</tr></table>`;
        }
        case "divider":
          return '<hr style="border:0;border-top:1px solid #e5e7eb;margin:16px 0">';
        case "spacer":
          return '<div style="height:24px"></div>';
        default:
          return "";
      }
    })
    .join("");
  return `<!doctype html><html lang="uk"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(subject)}</title></head>
<body style="margin:0;background:#f3f4f6;font-family:Arial,sans-serif;color:#111827">
<div style="display:none">${esc(preheader)}</div>
<table role="presentation" width="100%"><tr><td align="center" style="padding:16px">
<table role="presentation" width="100%" style="max-width:600px;background:#fff;border-radius:8px"><tr><td style="padding:20px 24px;background:#4f46e5;color:#fff;font-weight:700;border-radius:8px 8px 0 0">Ваш магазин</td></tr>
<tr><td style="padding:24px">${body || '<p style="color:#6b7280">Додайте блоки, щоб побачити лист.</p>'}</td></tr>
<tr><td style="padding:16px 24px;font-size:12px;color:#6b7280;border-top:1px solid #e5e7eb">Реклама · реквізити продавця · <a href="#" style="color:#6b7280">Відписатися</a> · <a href="#" style="color:#6b7280">Налаштування підписки</a></td></tr></table>
</td></tr></table></body></html>`;
};

export const blocksToText = (blocks = []) =>
  blocks
    .map((b) => {
      if (b.type === "heading") return String(b.text || "").toUpperCase();
      if (b.type === "text") return String(b.text || "").replace(/\*\*(.+?)\*\*/g, "$1").replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)");
      if (b.type === "button") return `${b.label}: ${b.url}`;
      if (b.type === "image") return b.href ? `${b.alt} — ${b.href}` : "";
      if (b.type === "divider") return "———";
      return "";
    })
    .filter(Boolean)
    .join("\n\n");
