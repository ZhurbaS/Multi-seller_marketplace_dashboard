import { cx } from "../../ui";

/**
 * StickyActions — липка нижня панель дій довгої форми (Зберегти / Скасувати).
 * Розтягується на ширину <main> (компенсує його горизонтальні відступи), враховує safe-area.
 * children — кнопки; hint — текст ліворуч (напр. «Є незбережені зміни»).
 */
export default function StickyActions({ children, hint, className }) {
  return (
    <div
      className={cx(
        "sticky bottom-0 z-20 -mx-3 mt-6 border-t border-(--line) bg-(--surface)/95 px-3 py-3 pb-[max(0.75rem,var(--sab))] backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8",
        className,
      )}
    >
      <div className="mx-auto flex w-full max-w-[1400px] min-w-0 flex-wrap items-center justify-end gap-2">
        {hint && <p className="mr-auto min-w-0 truncate text-sm text-(--ink-2)">{hint}</p>}
        {children}
      </div>
    </div>
  );
}
