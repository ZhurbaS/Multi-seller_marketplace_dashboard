import { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useConfirm } from "../../ui";

const DEFAULT_TEXT = "Ви внесли зміни, які ще не збережено. Якщо вийти зі сторінки, вони втратяться.";

/**
 * Застереження про незбережені зміни.
 * - закриття/перезавантаження вкладки → нативне попередження браузера (beforeunload);
 * - клік по будь-якому внутрішньому посиланню (меню, хлібні крихти, «Скасувати») → ConfirmDialog.
 * Кнопку «Назад» браузера без data-router перехопити не можна.
 *
 * const { element, guard, release } = useUnsavedChanges(dirty);
 * {element} — відрендерити в компоненті; guard(fn) — виконати fn після підтвердження;
 * release() — зняти захист (напр. перед програмною навігацією після збереження).
 */
export function useUnsavedChanges(dirty, { title = "Вийти без збереження?", text = DEFAULT_TEXT } = {}) {
  const navigate = useNavigate();
  const [confirm, element] = useConfirm();
  const dirtyRef = useRef(dirty);

  useEffect(() => {
    dirtyRef.current = dirty;
  }, [dirty]);

  useEffect(() => {
    if (!dirty) return undefined;
    const onBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const ask = useCallback(
    () => confirm({ title, text, confirmLabel: "Вийти без збереження", cancelLabel: "Залишитися", tone: "danger" }),
    [confirm, title, text],
  );

  useEffect(() => {
    const onClick = async (e) => {
      if (!dirtyRef.current || e.defaultPrevented) return;
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target instanceof Element ? e.target.closest("a[href]") : null;
      if (!a || a.hasAttribute("download") || (a.target && a.target !== "_self")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      e.preventDefault();
      e.stopPropagation();
      if (await ask()) {
        dirtyRef.current = false;
        navigate(url.pathname + url.search + url.hash);
      }
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [ask, navigate]);

  const guard = useCallback(
    async (fn) => {
      if (!dirtyRef.current) return fn();
      if (await ask()) {
        dirtyRef.current = false;
        return fn();
      }
      return undefined;
    },
    [ask],
  );

  const release = useCallback(() => {
    dirtyRef.current = false;
  }, []);

  return { element, guard, release };
}
