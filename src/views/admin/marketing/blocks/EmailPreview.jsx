// Кольори Telegram/фону поштового клієнта — навмисна імітація зовнішнього застосунку (style, не тема дашборду).
const TG = { bg: "#0e1621", panel: "#17212b", bubble: "#2b5278", ink: "#e5e7eb" };
// Прев'ю листа: ПК / мобільний (iframe srcDoc у пісочниці), текстова версія, Telegram
import React, { useState } from "react";
import { MdRefresh } from "react-icons/md";
import { Button } from "../../../../ui";
import { Segmented } from "../ui";

const TgMessage = ({ telegram }) => (
  <div className="flex max-w-[420px] flex-col gap-2 rounded-(--r-md) p-3" style={{ background: TG.panel, color: TG.ink }}>
    <div className="whitespace-pre-wrap break-words rounded-(--r-lg) p-3 text-sm" style={{ background: TG.bubble }}>
      {telegram?.text || "—"}
    </div>
    {(telegram?.buttons || []).map((b) => (
      <span key={b.url} className="rounded-(--r-sm) py-2 text-center text-sm" style={{ background: TG.bubble, opacity: 0.85 }} title={b.url}>
        {b.text} ↗
      </span>
    ))}
  </div>
);

const EmailPreview = ({ html, text, telegram, subject, preheader, loading, error, stale, onRefresh, note, showTelegram = false }) => {
  const [mode, setMode] = useState("desktop");
  const options = [
    ["desktop", "ПК"],
    ["mobile", "Мобільний"],
    ["text", "Текстова версія"],
    ...(showTelegram ? [["telegram", "Telegram"]] : []),
  ];
  const cur = options.some(([v]) => v === mode) ? mode : "desktop";
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 flex-wrap justify-between">
        <Segmented label="Режим прев'ю" value={cur} onChange={setMode} options={options} size="sm" />
        {onRefresh && (
          <Button size="sm" variant="secondary" icon={<MdRefresh />} onClick={onRefresh} loading={loading}>
            {loading ? "Оновлюємо…" : "Оновити прев'ю"}
          </Button>
        )}
      </div>
      {(subject || preheader) && cur !== "telegram" && (
        <div className="rounded-(--r-md) border border-(--line) bg-(--surface-2) p-2 text-xs text-(--ink)">
          <div>
            <span className="text-(--ink-2)">Тема: </span>
            <b>{subject || "—"}</b>
          </div>
          {preheader && (
            <div className="truncate">
              <span className="text-(--ink-2)">Прехедер: </span>
              {preheader}
            </div>
          )}
        </div>
      )}
      <div aria-live="polite" className="min-h-[1rem] text-xs text-(--ink-2)">
        {error ? <span className="font-medium text-(--danger)">{error}</span> : loading ? "Формуємо прев'ю…" : stale ? "Є зміни — прев'ю оновиться автоматично" : ""}
      </div>
      <div className={`relative overflow-hidden rounded-(--r-md) border border-(--line) bg-(--surface-2) ${loading ? "opacity-70" : ""}`}>
        {cur === "text" ? (
          <pre className="p-3 text-xs text-(--ink) whitespace-pre-wrap break-words max-h-[640px] overflow-auto font-mono">{text || "Текстова версія з'явиться після формування прев'ю."}</pre>
        ) : cur === "telegram" ? (
          <div className="p-3" style={{ background: TG.bg }}>
            <TgMessage telegram={telegram} />
          </div>
        ) : html ? (
          <div className="flex justify-center p-2 overflow-auto">
            <iframe
              title={cur === "mobile" ? "Прев'ю листа на мобільному" : "Прев'ю листа на ПК"}
              srcDoc={html}
              sandbox="allow-popups allow-popups-to-escape-sandbox"
              className="rounded-(--r-sm) border-0 shadow-(--shadow-2)"
              style={{ background: "#ffffff", width: cur === "mobile" ? 375 : "100%", maxWidth: cur === "mobile" ? 375 : 720, height: 640 }}
            />
          </div>
        ) : (
          <p className="p-6 text-center text-sm text-(--ink-2)">{loading ? "Завантаження…" : "Прев'ю з'явиться, щойно у листі буде зміст."}</p>
        )}
      </div>
      {note && <p className="text-xs text-(--ink-2)">{note}</p>}
    </div>
  );
};

export default EmailPreview;
