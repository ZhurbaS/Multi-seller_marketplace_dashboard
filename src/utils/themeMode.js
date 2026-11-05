// Режим теми дашборду: "light" | "dark" | "system".
// На <html> завжди стоїть розв'язане значення data-theme="light|dark".
import { useEffect, useState, useSyncExternalStore } from "react";

const KEY = "ts-dash-theme-mode";
const EVENT = "ts-themechange";
const MODES = ["light", "dark", "system"];

function mq() {
  try {
    return window.matchMedia("(prefers-color-scheme: dark)");
  } catch {
    return null;
  }
}

export function getThemeMode() {
  try {
    const v = localStorage.getItem(KEY);
    return MODES.includes(v) ? v : "light";
  } catch {
    return "light";
  }
}

export function resolveMode(mode) {
  if (mode === "system") return mq()?.matches ? "dark" : "light";
  return mode === "dark" ? "dark" : "light";
}

export function emitThemeChange() {
  try {
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* noop */
  }
}

function applyResolved(mode) {
  const resolved = resolveMode(mode);
  const root = document.documentElement;
  if (root.getAttribute("data-theme") !== resolved) {
    root.setAttribute("data-theme", resolved);
    emitThemeChange();
  }
}

export function setThemeMode(mode) {
  const m = MODES.includes(mode) ? mode : "light";
  try {
    localStorage.setItem(KEY, m);
  } catch {
    /* приватний режим */
  }
  currentMode = m;
  applyResolved(m);
  modeListeners.forEach((l) => l());
}

let currentMode = "light";
const modeListeners = new Set();

/** Викликати один раз до рендера (index.jsx). */
export function initThemeMode() {
  currentMode = getThemeMode();
  applyResolved(currentMode);
  const m = mq();
  const onChange = () => currentMode === "system" && applyResolved("system");
  try {
    m?.addEventListener("change", onChange);
  } catch {
    /* старі Safari */
  }
}

/** [mode, setMode] — для перемикача теми. */
export function useThemeMode() {
  const mode = useSyncExternalStore(
    (cb) => {
      modeListeners.add(cb);
      return () => modeListeners.delete(cb);
    },
    () => currentMode,
    () => "light",
  );
  return [mode, setThemeMode];
}

/** Лічильник змін теми (світла/темна або кольори магазину) — для перерахунку графіків. */
export function useThemeVersion() {
  const [v, setV] = useState(0);
  useEffect(() => {
    const on = () => setV((x) => x + 1);
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, []);
  return v;
}

export function isDarkTheme() {
  return document.documentElement.getAttribute("data-theme") === "dark";
}
