// Тема магазину (кольори з адмінки «Дизайн сайту») — та сама, що у front/src/utils/theme.js.
// GET /api/home/settings/theme → { hash, css } (css будує сервер лише з валідних hex).
// Кеш у localStorage дає миттєве застосування до відповіді сервера.
// Будь-яка помилка → лишаються дефолтні токени з index.css.
import api from "../api/api";
import { emitThemeChange } from "./themeMode";

const KEY = "ts-theme";
// Безпека: приймаємо лише :root{--name:value;…} без небезпечних конструкцій.
const SAFE_CSS = /^:root\{(?:--[a-z0-9-]+:[#a-zA-Z0-9(),.%\s-]+;)*\}$/;

function apply(css) {
  if (typeof css !== "string" || !SAFE_CSS.test(css.trim())) return false;
  let el = document.getElementById("ts-theme");
  if (!el) {
    el = document.createElement("style");
    el.id = "ts-theme";
    document.head.appendChild(el);
  }
  if (el.textContent !== css) {
    el.textContent = css;
    emitThemeChange();
  }
  return true;
}

function readCache() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "null");
  } catch {
    return null;
  }
}

/** Синхронно застосовує кешовану тему (викликати до першого рендера). */
export function applyCachedStoreTheme() {
  const saved = readCache();
  if (saved?.css) apply(saved.css);
}

/** Підтягує актуальну тему магазину. Ніколи не кидає помилок. */
export async function initStoreTheme() {
  const saved = readCache();
  try {
    const { data } = await api.get("/home/settings/theme", {
      params: saved?.hash ? { hash: saved.hash } : undefined,
      timeout: 8000,
    });
    if (data && typeof data.css === "string" && apply(data.css)) {
      try {
        localStorage.setItem(KEY, JSON.stringify({ hash: data.hash, css: data.css }));
      } catch {
        /* приватний режим */
      }
    }
  } catch {
    /* тема за замовчуванням з index.css */
  }
}
