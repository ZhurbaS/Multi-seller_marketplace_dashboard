import React from "react";
import { MdWarningAmber } from "react-icons/md";
import { Table } from "../../../../ui";
import { EMAIL_STATUS, KINDS, RFM, TG_STATUS, contactName, fmtDate, money, num } from "../mkUtils";
import { Badge } from "../ui";

const Tags = ({ tags = [] }) =>
  tags.length ? (
    <div className="flex flex-wrap gap-1">
      {tags.slice(0, 4).map((t) => (
        <span key={t} className="rounded-full bg-(--brand-soft) px-2 py-0.5 text-[11px] font-medium text-(--brand-ink)">
          {t}
        </span>
      ))}
      {tags.length > 4 && <span className="text-[11px] text-(--ink-2)">+{tags.length - 4}</span>}
    </div>
  ) : (
    <span className="text-(--ink-2)">—</span>
  );

const NameCell = ({ c, onOpen }) => (
  <button
    type="button"
    onClick={() => onOpen(c._id)}
    className="block min-w-0 max-w-full rounded-(--r-sm) text-left hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--brand)"
  >
    <span className="block truncate font-semibold text-(--ink)">{contactName(c)}</span>
    <span className="block truncate text-xs text-(--ink-2)">{[c.name ? c.email : null, c.name || c.email ? c.phone : null].filter(Boolean).join(" · ")}</span>
    {c.erasureRequested && (
      <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium text-(--warning-ink)">
        <MdWarningAmber aria-hidden="true" />
        запит на видалення даних
      </span>
    )}
  </button>
);

const tg = (c) => c.channels?.telegram?.status || "none";
const em = (c) => c.channels?.email?.status || "none";

const boxCls = "h-5 w-5 shrink-0 cursor-pointer rounded-(--r-sm) border border-(--line-strong) accent-(--brand)";

const ContactsList = ({ contacts, selected, onToggle, onToggleAll, onOpen }) => {
  const allOn = contacts.length > 0 && contacts.every((c) => selected.has(c._id));
  const pick = (c) => (
    <label className="-m-2 inline-flex h-11 w-11 cursor-pointer items-center justify-center" onClick={(e) => e.stopPropagation()}>
      <input type="checkbox" className={boxCls} aria-label={`Вибрати ${contactName(c)}`} checked={selected.has(c._id)} onChange={() => onToggle(c._id)} />
    </label>
  );

  const columns = [
    {
      key: "pick",
      width: 44,
      header: <input type="checkbox" className={boxCls} aria-label="Вибрати всі на сторінці" checked={allOn} onChange={(e) => onToggleAll(e.target.checked)} />,
      render: pick,
      hideOnCard: true,
    },
    { key: "name", header: "Контакт", primary: true, className: "max-w-[260px]", render: (c) => <NameCell c={c} onOpen={onOpen} /> },
    { key: "kind", header: "Тип", className: "whitespace-nowrap", render: (c) => KINDS[c.kind] || KINDS.unknown },
    { key: "email", header: "Email", render: (c) => <Badge meta={EMAIL_STATUS[em(c)]} fallback={em(c)} /> },
    { key: "tg", header: "Telegram", render: (c) => <Badge meta={TG_STATUS[tg(c)]} fallback={tg(c)} /> },
    { key: "tags", header: "Теги", className: "max-w-[180px]", render: (c) => <Tags tags={c.tags} /> },
    { key: "ltv", header: "Замовл. / LTV", align: "right", render: (c) => `${num(c.stats?.orders || 0)} / ${money(c.stats?.ltv || 0)}` },
    { key: "rfm", header: "RFM", className: "whitespace-nowrap", render: (c) => RFM[c.stats?.rfm?.segment] || <span className="text-(--ink-2)">—</span> },
    { key: "last", header: "Ост. покупка", className: "whitespace-nowrap", render: (c) => fmtDate(c.stats?.lastOrderAt) },
  ];

  const card = (c) => (
    <div className={`-m-4 flex gap-3 p-4 ${selected.has(c._id) ? "bg-(--brand-soft)" : ""}`}>
      <div className="pt-0.5">{pick(c)}</div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <NameCell c={c} onOpen={onOpen} />
        <div className="flex flex-wrap items-center gap-1 text-xs">
          <span className="text-(--ink-2)">Email:</span>
          <Badge meta={EMAIL_STATUS[em(c)]} fallback={em(c)} />
          <span className="ml-1 text-(--ink-2)">TG:</span>
          <Badge meta={TG_STATUS[tg(c)]} fallback={tg(c)} />
        </div>
        <Tags tags={c.tags} />
        <div className="flex flex-wrap gap-x-3 text-xs text-(--ink-2)">
          <span>{KINDS[c.kind] || KINDS.unknown}</span>
          <span className="tabular-nums">
            Замовлень: {num(c.stats?.orders || 0)} · {money(c.stats?.ltv || 0)}
          </span>
          {c.stats?.rfm?.segment && <span>RFM: {RFM[c.stats.rfm.segment] || c.stats.rfm.segment}</span>}
          {c.stats?.lastOrderAt && <span>Ост. покупка: {fmtDate(c.stats.lastOrderAt)}</span>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="md:hidden">
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2.5 px-1 text-sm text-(--ink)">
          <input type="checkbox" className={boxCls} checked={allOn} onChange={(e) => onToggleAll(e.target.checked)} />
          Вибрати всі на сторінці
        </label>
      </div>
      <Table caption="Контакти CRM" columns={columns} rows={contacts} rowKey="_id" renderCard={card} />
    </div>
  );
};

export default ContactsList;
