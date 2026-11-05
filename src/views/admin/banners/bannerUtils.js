// Спільні константи й чисті функції сторінки «Банери» (контракт — BANNERS_SPEC.md)

export const inputCls =
  "h-11 px-3 w-full min-w-0 rounded-(--r-md) border border-(--line) bg-(--surface) text-(--ink) placeholder:text-(--ink-2)/80 hover:border-(--line-strong) focus:border-(--brand) focus:outline-none focus:ring-2 focus:ring-(--brand)/25 disabled:cursor-not-allowed disabled:bg-(--surface-2)";

// Запасний реєстр — дзеркало back/utiles/bannerPlacements.js (на випадок, якщо /meta недоступний)
export const FALLBACK_PLACEMENTS = [
  {
    id: "announcement",
    name: "Стрічка оголошення",
    where: "Над шапкою на всіх сторінках, закривається (запам'ятовується за id)",
    kind: "text",
    desktop: null,
    mobile: null,
    max: 1,
    categories: false,
  },
  {
    id: "home_hero",
    name: "Головна карусель",
    where: "Верх головної, під шапкою",
    kind: "image",
    desktop: { width: 1600, height: 533, ratio: "3:1" },
    mobile: { width: 800, height: 400, ratio: "2:1" },
    max: 6,
    categories: false,
  },
  {
    id: "home_mid",
    name: "Широкий банер на головній",
    where: "Між блоками товарів на головній (на ПК 2 банери — у 2 колонки по 800×400)",
    kind: "image",
    desktop: { width: 1600, height: 400, ratio: "4:1" },
    mobile: { width: 800, height: 400, ratio: "2:1" },
    max: 2,
    categories: false,
  },
  {
    id: "catalog_top",
    name: "Банер над каталогом",
    where: "Над сіткою товарів у каталозі/пошуку/категорії; може бути прив'язаний до категорій (порожньо = усі)",
    kind: "image",
    desktop: { width: 1600, height: 320, ratio: "5:1" },
    mobile: { width: 800, height: 320, ratio: "2.5:1" },
    max: 1,
    categories: true,
  },
  {
    id: "product_promo",
    name: "Банер на сторінці товару",
    where: "Під блоком купівлі (праворуч/під кнопками)",
    kind: "image",
    desktop: { width: 800, height: 400, ratio: "2:1" },
    mobile: { width: 800, height: 400, ratio: "2:1" },
    max: 1,
    categories: false,
  },
  {
    id: "cart_promo",
    name: "Банер у кошику",
    where: "Над списком товарів кошика",
    kind: "image",
    desktop: { width: 1200, height: 240, ratio: "5:1" },
    mobile: { width: 800, height: 320, ratio: "2.5:1" },
    max: 1,
    categories: false,
  },
];

// Кольори плейсментів для «Карти сайту» (і маркери у вкладках)
export const PLACEMENT_COLORS = {
  announcement: "var(--warning)",
  home_hero: "var(--chart-3)",
  home_mid: "var(--chart-1)",
  catalog_top: "var(--chart-5)",
  product_promo: "var(--chart-4)",
  cart_promo: "var(--chart-2)",
};

export const DEFAULT_LIMITS = { maxImageMB: 2, minImageWidth: 600 };
export const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/avif"];

const parseSize = (s) => {
  if (!s) return null;
  if (typeof s === "string") {
    const m = s.match(/(\d+)\s*[×x*]\s*(\d+)/);
    return m ? { width: +m[1], height: +m[2] } : null;
  }
  const width = Number(s.width ?? s.w);
  const height = Number(s.height ?? s.h);
  return width && height ? { width, height, ratio: s.ratio } : null;
};

export const ratioOf = (size) => (size ? size.width / size.height : null);
export const fmtRatio = (r) => {
  if (!r) return "";
  const v = Math.round(r * 10) / 10;
  return `${String(v).replace(".", ",")}:1`;
};
export const sizeLabel = (size) => (size ? `${size.width}×${size.height} px (${size.ratio || fmtRatio(ratioOf(size))})` : "—");

// Поєднує відповідь /meta з запасним реєстром; терпимо ставиться до назв полів
export const normalizePlacements = (list) => {
  const src = Array.isArray(list) && list.length ? list : FALLBACK_PLACEMENTS;
  return src
    .map((p) => {
      const id = p.id || p.key;
      const fb = FALLBACK_PLACEMENTS.find((x) => x.id === id) || {};
      return {
        ...fb,
        id,
        name: p.name || p.title || p.label || fb.name || id,
        where: p.where || p.description || fb.where || "",
        kind: p.kind || fb.kind || "image",
        desktop: parseSize(p.desktop ?? p.desktopSize) || (p.desktop === null ? null : fb.desktop || null),
        mobile: parseSize(p.mobile ?? p.mobileSize) || (p.mobile === null ? null : fb.mobile || null),
        max: Number(p.max ?? p.limit ?? fb.max ?? 1) || 1,
        categories: Boolean(p.categories ?? fb.categories),
      };
    })
    .filter((p) => p.id);
};

// Статус (дзеркало сервера): !active→paused; startAt>now→scheduled; endAt<now→expired; інакше live
export const computeStatus = (b, now = Date.now()) => {
  if (!b.active) return "paused";
  if (b.startAt && new Date(b.startAt).getTime() > now) return "scheduled";
  if (b.endAt && new Date(b.endAt).getTime() < now) return "expired";
  return "live";
};
export const statusOf = (b) => {
  const s = b.status === "active" ? "live" : b.status;
  return ["live", "scheduled", "expired", "paused"].includes(s) ? s : computeStatus(b);
};

export const STATUS = {
  live: { label: "Показується", tone: "success", dot: "●" },
  scheduled: { label: "Заплановано", tone: "brand", dot: "◷" },
  expired: { label: "Завершено", tone: "neutral", dot: "■" },
  paused: { label: "Вимкнено", tone: "warning", dot: "Ⅱ" },
};

export const DEVICE_LABEL = { all: "Усі пристрої", desktop: "Лише ПК", mobile: "Лише мобільні" };
export const AUDIENCE_LABEL = { all: "Усі відвідувачі", guest: "Лише гості", customer: "Лише зареєстровані" };

export const PAGE_OPTIONS = [
  ["/shops", "Магазини продавців (/shops)"],
  ["/stores", "Наші магазини (/stores)"],
  ["/delivery", "Доставка (/delivery)"],
  ["/returns", "Повернення (/returns)"],
  ["/warranty", "Гарантія (/warranty)"],
  ["/oferta", "Публічна оферта (/oferta)"],
  ["/privacy", "Конфіденційність (/privacy)"],
  ["/cookies", "Cookies (/cookies)"],
  ["/returns-policy", "Політика повернення (/returns-policy)"],
];

export const fmtDate = (d) => {
  if (!d) return "";
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return "";
  return x.toLocaleString("uk-UA", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

// ISO → значення для <input type="datetime-local"> у локальному часі
export const toLocalInput = (d) => {
  if (!d) return "";
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return "";
  const p = (n) => String(n).padStart(2, "0");
  return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}T${p(x.getHours())}:${p(x.getMinutes())}`;
};
export const fromLocalInput = (v) => (v ? new Date(v).toISOString() : "");

export const ctrOf = (b) => {
  const imp = Number(b.impressions) || 0;
  const clk = Number(b.clicks) || 0;
  return imp ? (clk / imp) * 100 : 0;
};
export const fmtNum = (n) => (Number(n) || 0).toLocaleString("uk-UA");

// ---- WCAG контраст ----
const HEX = /^#[0-9a-fA-F]{6}$/;
export const isHex = (v) => HEX.test(String(v || ""));
const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = c.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const contrastRatio = (a, b) => {
  if (!isHex(a) || !isHex(b)) return null;
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

// ---- Посилання ----
export const HTTPS = /^https:\/\/[^\s/$.?#][^\s]*\.[^\s]+$/i;
export const isSafePath = (p) => /^\/(?!\/)[^\s]*$/.test(String(p || ""));

export const LINK_TYPES = [
  ["none", "Без посилання"],
  ["product", "Товар"],
  ["category", "Категорія"],
  ["page", "Сторінка сайту"],
  ["url", "Зовнішнє посилання"],
];

export const linkSummary = (b) => {
  switch (b.linkType) {
    case "product":
      return `Товар: ${b.productName || b.productSlug || b.productId || "—"}`;
    case "category":
      return `Категорія: ${b.categoryName || "—"}`;
    case "page":
      return `Сторінка: ${b.pagePath || "—"}`;
    case "url":
      return `Посилання: ${b.url || "—"}`;
    default:
      return "Без посилання";
  }
};

// ---- Зображення ----
export const readImageSize = (file) =>
  new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight, url });
    };
    img.onerror = () => resolve({ width: 0, height: 0, url });
    img.src = url;
  });

// Перевірка файлу: повертає { error } (блокує) або { warnings[] } (м'які)
export const checkImage = (file, dims, target, limits = DEFAULT_LIMITS) => {
  if (!ALLOWED_MIME.includes(file.type)) return { error: "Дозволені формати: JPG, PNG, WebP, AVIF." };
  const maxMB = limits.maxImageMB || 2;
  if (file.size > maxMB * 1024 * 1024)
    return { error: `Файл ${(file.size / 1024 / 1024).toFixed(1)} МБ — більше за ${maxMB} МБ. Стисніть зображення (напр. у WebP).` };
  const warnings = [];
  const minW = limits.minImageWidth || 600;
  if (dims.width && dims.width < minW) return { error: `Ширина ${dims.width}px — замало (мінімум ${minW}px).` };
  if (target && dims.width && dims.width < target.width)
    warnings.push(`Ширина ${dims.width}px менша за рекомендовану ${target.width}px — на великих екранах може бути розмито.`);
  if (target && dims.width && dims.height) {
    const r = dims.width / dims.height;
    const tr = target.width / target.height;
    if (Math.abs(r - tr) / tr > 0.08)
      warnings.push(`Рекомендовано ${target.ratio || fmtRatio(tr)}, зараз ${fmtRatio(r)} — буде обрізано по центру.`);
  }
  return { warnings };
};

// Клієнтська валідація (дублює правила сервера)
export const validateBanner = (f, placement, imgs) => {
  const e = {};
  if (!f.name.trim()) e.name = "Вкажіть внутрішню назву.";
  else if (f.name.length > 80) e.name = "Не більше 80 символів.";
  if (f.kind === "image") {
    if (!imgs.hasDesktop) e.imageDesktop = "Завантажте зображення для ПК.";
    if (!f.alt.trim()) e.alt = "Альтернативний текст обов'язковий (для незрячих користувачів і SEO).";
  }
  if (f.alt.length > 160) e.alt = "Не більше 160 символів.";
  if (f.headline.length > 80) e.headline = "Не більше 80 символів.";
  if (f.kind === "text" && !f.headline.trim()) e.headline = "Для текстового банера вкажіть заголовок.";
  if (f.subline.length > 160) e.subline = "Не більше 160 символів.";
  if (f.ctaLabel.length > 30) e.ctaLabel = "Не більше 30 символів.";
  if (f.kind === "text") {
    if (!isHex(f.bgColor)) e.bgColor = "Колір у форматі #rrggbb.";
    if (!isHex(f.textColor)) e.textColor = "Колір у форматі #rrggbb.";
  }
  if (f.linkType === "product" && !f.productId) e.link = "Оберіть товар зі списку.";
  if (f.linkType === "category" && !f.categoryName) e.link = "Оберіть категорію.";
  if (f.linkType === "page") {
    if (!isSafePath(f.pagePath)) e.link = "Шлях має починатися з «/» (не «//»), без пробілів.";
  }
  if (f.linkType === "url" && !HTTPS.test(f.url.trim())) e.link = "Лише повна адреса https://… (http не дозволено).";
  if (f.linkType !== "none" && f.ctaLabel && !f.ctaLabel.trim()) e.ctaLabel = "Порожній текст кнопки.";
  if (f.startAt && f.endAt && new Date(f.endAt) <= new Date(f.startAt)) e.endAt = "Кінець має бути пізніше за початок.";
  if (!placement?.categories && f.categories.length) e.categories = "Категорії доступні лише для банера над каталогом.";
  return e;
};

export const errMsg = (err, fallback) => err?.response?.data?.error || err?.response?.data?.message || fallback;

// ---- Налаштування ----
export const DEFAULT_SETTINGS = { home_hero: { autoplay: true, intervalSec: 6 }, announcement: { dismissible: true } };

export const mergeSettings = (s) => ({
  home_hero: { ...DEFAULT_SETTINGS.home_hero, ...(s?.home_hero || {}) },
  announcement: { ...DEFAULT_SETTINGS.announcement, ...(s?.announcement || {}) },
});

