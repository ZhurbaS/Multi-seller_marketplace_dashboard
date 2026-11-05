// ДОДАНО (агент «адмін: налаштування сайту/маркетинг»): sticky-панель дій форми + застереження про незбережені зміни.
import { useEffect } from "react";
import { MdErrorOutline, MdCheckCircleOutline } from "react-icons/md";
import { cx } from "./cx";

/**
 * useUnsavedChanges(dirty, message?) — попереджає браузерним діалогом при закритті/перезавантаженні вкладки,
 * якщо є незбережені зміни. (Роутер не data-router, тож внутрішні переходи не блокуються.)
 */
export function useUnsavedChanges(dirty, message = "Є незбережені зміни. Покинути сторінку?") {
  useEffect(() => {
    if (!dirty) return undefined;
    const h = (e) => {
      e.preventDefault();
      e.returnValue = message;
      return message;
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty, message]);
}

/**
 * StickyActions({ dirty, status, children (кнопки), className })
 * Прилипає до низу екрана на довгих формах; ліворуч — статус «Є незбережені зміни» / «Усі зміни збережено».
 * status — довільний вузол замість стандартного тексту.
 */
export function StickyActions({ dirty = false, status, savedText = "Усі зміни збережено", dirtyText = "Є незбережені зміни", children, className }) {
  return (
    <div
      className={cx(
        "sticky bottom-0 z-20 -mx-3 mt-4 flex min-w-0 flex-wrap items-center gap-2 border-t border-(--line) bg-(--surface)/95 px-3 py-3 pb-[max(0.75rem,var(--sab))] shadow-(--shadow-2) backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8",
        className,
      )}
    >
      <div className="min-w-0 flex-1 text-sm" aria-live="polite">
        {status ??
          (dirty ? (
            <span className="inline-flex items-center gap-1.5 font-medium text-(--warning-ink)">
              <MdErrorOutline aria-hidden="true" className="shrink-0 text-lg" />
              {dirtyText}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-(--ink-2)">
              <MdCheckCircleOutline aria-hidden="true" className="shrink-0 text-lg text-(--success)" />
              {savedText}
            </span>
          ))}
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2">{children}</div>
    </div>
  );
}
