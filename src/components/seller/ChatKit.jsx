import { useEffect, useRef } from "react";
import { MdChatBubbleOutline, MdSend } from "react-icons/md";
import { Button, EmptyState, cx, formatDate, toDate } from "../../ui";

const initials = (name = "") =>
  String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("") || "?";

/** Аватар: фото або ініціали; online — зелена крапка з підписом для скрінрідерів. */
export function Avatar({ src, name, online, size = "md" }) {
  const s = size === "sm" ? "h-9 w-9 text-xs" : "h-10 w-10 text-sm";
  return (
    <span className={cx("relative inline-flex shrink-0", s)}>
      {src ? (
        <img src={src} alt="" className={cx(s, "rounded-full border border-(--line) bg-(--surface-2) object-cover")} />
      ) : (
        <span aria-hidden="true" className={cx(s, "inline-flex items-center justify-center rounded-full bg-(--brand-soft) font-semibold text-(--brand-ink)")}>
          {initials(name)}
        </span>
      )}
      {online && (
        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-(--surface) bg-(--success)">
          <span className="sr-only">онлайн</span>
        </span>
      )}
    </span>
  );
}

const dayKey = (v) => {
  const d = toDate(v);
  return d ? d.toDateString() : "";
};

/**
 * Стрічка повідомлень-бульбашок. messages: [{_id, message, senderId, createdAt}]; isMine(m) → bool.
 * Автопрокрутка до останнього повідомлення; розділювачі за датою.
 */
export function MessageList({ messages = [], isMine, emptyTitle = "Повідомлень ще немає", emptyText, className }) {
  const endRef = useRef(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  return (
    <div role="log" aria-live="polite" aria-label="Повідомлення" className={cx("min-h-0 flex-1 overflow-y-auto bg-(--surface-2) p-3 sm:p-4", className)}>
      {messages.length === 0 ? (
        <div className="flex h-full items-center justify-center">
          <EmptyState compact icon={<MdChatBubbleOutline />} title={emptyTitle} text={emptyText} />
        </div>
      ) : (
        <ol className="flex flex-col gap-1.5">
          {messages.map((m, i) => {
            const mine = isMine(m);
            const prev = messages[i - 1];
            const newDay = m.createdAt && (!prev || dayKey(prev.createdAt) !== dayKey(m.createdAt));
            const grouped = prev && isMine(prev) === mine && !newDay;
            return (
              <li key={m._id || i} className="flex min-w-0 flex-col">
                {newDay && (
                  <span className="mx-auto my-2 rounded-full bg-(--surface) px-3 py-0.5 text-xs text-(--ink-2) shadow-(--shadow-1)">
                    {formatDate(m.createdAt)}
                  </span>
                )}
                <div className={cx("flex min-w-0", mine ? "justify-end" : "justify-start", !grouped && i > 0 && "mt-1.5")}>
                  <div
                    className={cx(
                      "min-w-0 max-w-[85%] rounded-(--r-lg) px-3 py-2 text-[0.9375rem] leading-snug shadow-(--shadow-1) lg:max-w-[70%]",
                      mine ? "rounded-br-(--r-sm) bg-(--brand) text-(--on-brand)" : "rounded-bl-(--r-sm) bg-(--surface) text-(--ink)",
                    )}
                  >
                    <span className="sr-only">{mine ? "Ви: " : "Співрозмовник: "}</span>
                    <p className="whitespace-pre-wrap break-words">{m.message}</p>
                    {m.createdAt && (
                      <p className={cx("mt-1 text-right text-[11px] tabular-nums", mine ? "opacity-80" : "text-(--ink-2)")}>
                        {formatDate(m.createdAt, { withTime: true }).split(", ").pop()}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
      <div ref={endRef} />
    </div>
  );
}

/** Поле введення: Enter — надіслати, Shift+Enter — новий рядок; авто-висота. */
export function Composer({ value, onChange, onSubmit, disabled = false, placeholder = "Введіть повідомлення", maxLength = 2000 }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  return (
    <form onSubmit={onSubmit} className="flex min-w-0 items-end gap-2 border-t border-(--line) bg-(--surface) p-3 pb-[max(0.75rem,var(--sab))]">
      <textarea
        ref={ref}
        rows={1}
        aria-label="Повідомлення"
        value={value}
        maxLength={maxLength}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            if (value.trim()) e.currentTarget.form?.requestSubmit();
          }
        }}
        placeholder={placeholder}
        enterKeyHint="send"
        autoComplete="off"
        className="min-h-11 min-w-0 flex-1 resize-none rounded-(--r-md) border border-(--line) bg-(--surface) px-3 py-2.5 leading-6 text-(--ink) placeholder:text-(--ink-2)/80 focus:border-(--brand) focus:outline-none focus:ring-2 focus:ring-(--brand)/25 disabled:cursor-not-allowed disabled:bg-(--surface-2)"
      />
      <Button type="submit" icon={<MdSend />} disabled={disabled || !value.trim()} aria-label="Надіслати">
        <span className="hidden sm:inline">Надіслати</span>
      </Button>
    </form>
  );
}
