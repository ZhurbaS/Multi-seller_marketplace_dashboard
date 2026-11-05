// Аналітика підписки: GET /analytics → {subscribers:{email,telegram}, growth[30], topics, sources, kinds, rfm, campaigns[10]}
import React from "react";
import { Link } from "react-router-dom";
import { BASE, CAMPAIGN_STATUS, EMAIL_STATUS, KINDS, RFM, SOURCES, TG_STATUS, TOPICS, fmtDate, num, rate } from "../mkUtils";
import { HBars, LineChart, StackBar } from "../charts";
import { Table } from "../../../../ui";
import { Badge, Empty, Section, Stat } from "../ui";

const ST_COLORS = {
  subscribed: "var(--success)",
  pending: "var(--warning)",
  unsubscribed: "var(--line-strong)",
  bounced: "var(--danger)",
  complained: "var(--sale)",
  cleaned: "var(--ink-2)",
  none: "var(--line)",
  blocked: "var(--danger)",
};
const toItems = (obj = {}, labels = {}, colors) =>
  Object.entries(obj)
    .filter(([, v]) => Number(v) > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => ({ label: labels[k]?.label || labels[k] || k, value: v, color: colors?.[k] }));

export const Kpis = ({ a }) => {
  const e = a.subscribers?.email || {};
  const t = a.subscribers?.telegram || {};
  const g = a.growth || [];
  const plus = g.reduce((s, x) => s + (x.subscribed || 0), 0);
  const minus = g.reduce((s, x) => s + (x.unsubscribed || 0), 0);
  return (
    <div className="grid gap-2 grid-cols-2 lg:grid-cols-5">
      <Stat label="Підписані на email" value={num(e.subscribed)} />
      <Stat label="Очікують підтвердження" value={num(e.pending)} />
      <Stat label="Підписані в Telegram" value={num(t.subscribed)} />
      <Stat label="Нових за 30 днів" value={`+${num(plus)}`} />
      <Stat label="Відписок за 30 днів" value={num(minus)} hint={plus ? `${Math.round((100 * minus) / Math.max(1, plus))}% від нових` : undefined} />
    </div>
  );
};

const AnalyticsCharts = ({ a }) => {
  const g = a.growth || [];
  return (
    <>
      <Section title="Зростання за 30 днів" hint="Нові згоди (підтвердження, галочка, імпорт, Telegram) і відписки по днях.">
        <LineChart
          title="Підписки й відписки за 30 днів"
          labels={g.map((x) => x.date)}
          series={[
            { label: "Підписались", color: "var(--chart-1)", values: g.map((x) => x.subscribed) },
            { label: "Відписались", color: "var(--chart-4)", values: g.map((x) => x.unsubscribed) },
          ]}
        />
      </Section>
      <div className="grid gap-4 lg:grid-cols-2 items-start">
        <Section title="Статуси email">
          <StackBar title="Статуси email" items={toItems(a.subscribers?.email, EMAIL_STATUS, ST_COLORS)} />
        </Section>
        <Section title="Статуси Telegram">
          <StackBar title="Статуси Telegram" items={toItems(a.subscribers?.telegram, TG_STATUS, ST_COLORS)} />
        </Section>
        <Section title="Теми (серед підписаних на email)">
          <HBars title="Теми підписки" items={toItems(a.topics, TOPICS)} />
        </Section>
        <Section title="Джерела контактів">
          <HBars title="Джерела" items={toItems(a.sources, SOURCES)} />
        </Section>
        <Section title="RFM-сегменти" hint="Покупці за давністю, частотою й сумою покупок.">
          <HBars title="RFM-розподіл" items={toItems(a.rfm, RFM)} />
        </Section>
        <Section title="Тип контактів">
          <StackBar title="Фіз/юрособи" items={toItems(a.kinds, KINDS)} />
        </Section>
      </div>
    </>
  );
};

const CAMP_COLS = [
  {
    key: "name",
    header: "Розсилка",
    primary: true,
    render: (c) => (
      <Link to={`${BASE}/campaigns/${c._id}`} className="font-medium text-(--brand-ink) underline-offset-2 hover:underline">
        {c.name}
      </Link>
    ),
  },
  { key: "status", header: "Статус", render: (c) => <Badge meta={CAMPAIGN_STATUS[c.status]} /> },
  { key: "at", header: "Дата", className: "whitespace-nowrap", render: (c) => fmtDate(c.at) },
  { key: "sent", header: "Надіслано", align: "right", render: (c) => num(c.stats?.sent) },
  { key: "clicks", header: "Кліки", align: "right", render: (c) => num(c.stats?.clicks) },
  { key: "ctr", header: "CTR", align: "right", render: (c) => rate(c.ctr) },
  { key: "unsub", header: "Відписки", align: "right", render: (c) => rate(c.unsubRate) },
];

export const RecentCampaigns = ({ list = [] }) => (
  <Section
    title="Останні розсилки"
    actions={
      <Link to={`${BASE}/campaigns`} className="inline-flex min-h-11 items-center text-sm font-medium text-(--brand-ink) hover:underline">
        Усі розсилки
      </Link>
    }
  >
    <Table caption="Останні 10 розсилок" columns={CAMP_COLS} rows={list} rowKey="_id" dense empty={<Empty title="Розсилок ще не було" />} />
  </Section>
);

export default AnalyticsCharts;
