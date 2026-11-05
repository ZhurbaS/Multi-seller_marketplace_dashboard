// Звіт кампанії: GET /campaigns/:id/report → {campaign, stats, ctr, byChannel, byDay, topLinks, skipped, failures}
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../../../api/api";
import { useApiGet } from "../hooks";
import { MdArrowBack, MdBlock, MdContentCopy, MdEdit, MdLink } from "react-icons/md";
import { Button } from "../../../../ui";
import { BASE, CAMPAIGN_STATUS, CRM, SKIP_REASONS, errMsg, fmtDateTime, num, pct, rate } from "../mkUtils";
import { DayBars, HBars } from "../charts";
import { Badge, Card, Confirm, Empty, ErrorBox, Page, Section, Skeleton, Stat } from "../ui";
import { CHANNEL_LABELS } from "./campaignUtils";

const SKIP_LABEL = { ...Object.fromEntries(Object.entries(SKIP_REASONS).map(([k, v]) => [k, v.label])), cancelled: "Скасовано до відправки" };

const CampaignReport = ({ id, audience, onEdit }) => {
  const navigate = useNavigate();
  const r = useApiGet(`${CRM}/campaigns/${id}/report`);
  const [ask, setAsk] = useState(null); // cancel | edit
  const [busy, setBusy] = useState(false);
  const d = r.data;
  const c = d?.campaign;
  const active = c && ["scheduled", "sending"].includes(c.status);

  // Поки відправка триває — оновлюємо кожні 15 с
  const { reload } = r;
  useEffect(() => {
    if (!active) return;
    const t = setInterval(reload, 15000);
    return () => clearInterval(t);
  }, [active, reload]);

  const cancel = async () => {
    setBusy(true);
    try {
      const { data } = await api.post(`${CRM}/campaigns/${id}/cancel`);
      toast.success(`Розсилку скасовано${data?.dequeued ? `; з черги прибрано ${num(data.dequeued)}` : ""}`);
      setAsk(null);
      r.reload();
    } catch (e) {
      toast.error(errMsg(e, "Не вдалося скасувати"));
    } finally {
      setBusy(false);
    }
  };
  const duplicate = async () => {
    setBusy(true);
    try {
      const { data } = await api.post(`${CRM}/campaigns/${id}/duplicate`);
      toast.success("Створено копію-чернетку");
      navigate(`${BASE}/campaigns/${data.campaign._id}`);
    } catch (e) {
      toast.error(errMsg(e, "Не вдалося дублювати"));
    } finally {
      setBusy(false);
    }
  };

  if (r.loading && !d)
    return (
      <Page title="Звіт розсилки">
        <Card>
          <Skeleton rows={6} label="Завантаження звіту…" />
        </Card>
      </Page>
    );
  if (!d)
    return (
      <Page title="Звіт розсилки">
        <ErrorBox error={r.error || "Звіт недоступний"} missing={r.missing} onRetry={r.reload} />
      </Page>
    );

  const s = d.stats || {};
  const skippedItems = Object.entries(d.skipped || {})
    .filter(([, n]) => n > 0)
    .map(([k, n]) => ({ label: SKIP_LABEL[k] || k, value: n, hint: SKIP_REASONS[k]?.hint }));
  const days = d.byDay || [];

  return (
    <Page
      title={c.name}
      description={c.subject ? `Тема: «${c.subject}»` : undefined}
      actions={
        <>
          <Badge meta={CAMPAIGN_STATUS[c.status]} />
          {c.status === "scheduled" && (
            <Button variant="secondary" icon={<MdEdit />} onClick={() => setAsk("edit")}>
              Змінити
            </Button>
          )}
          {active && (
            <Button variant="danger" icon={<MdBlock />} onClick={() => setAsk("cancel")}>
              Скасувати
            </Button>
          )}
          <Button variant="secondary" icon={<MdContentCopy />} onClick={duplicate} loading={busy}>
            Дублювати
          </Button>
          <Button as={Link} to={`${BASE}/campaigns`} variant="ghost" icon={<MdArrowBack />}>
            До списку
          </Button>
        </>
      }
    >
      <ErrorBox error={r.error} onRetry={r.reload} />
      {c.lastError && <ErrorBox error={`Остання помилка відправки: ${c.lastError}`} missing />}
      <Card className="flex flex-col gap-3">
        <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-xs text-(--ink-2)">Канали</dt>
            <dd className="text-(--ink)">{(c.channels || []).map((x) => CHANNEL_LABELS[x] || x).join(", ") || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-(--ink-2)">Заплановано</dt>
            <dd className="text-(--ink)">{fmtDateTime(c.scheduledAt)}</dd>
          </div>
          <div>
            <dt className="text-xs text-(--ink-2)">Старт</dt>
            <dd className="text-(--ink)">{fmtDateTime(c.startedAt)}</dd>
          </div>
          <div>
            <dt className="text-xs text-(--ink-2)">Завершено</dt>
            <dd className="text-(--ink)">{fmtDateTime(c.finishedAt)}</dd>
          </div>
        </dl>
        {audience && <p className="text-xs text-(--ink-2)">Аудиторія: {audience}</p>}
        {active && <p className="text-xs text-(--ink-2)" aria-live="polite">Звіт оновлюється автоматично кожні 15 секунд.</p>}
      </Card>

      <div className="grid gap-2 grid-cols-2 md:grid-cols-4 xl:grid-cols-8">
        <Stat label="Отримувачів" value={num(s.recipients)} />
        <Stat label="Надіслано" value={num(s.sent)} hint={s.queued ? `у черзі ${num(s.queued)}` : undefined} />
        <Stat label="Пропущено" value={num(s.skipped)} />
        <Stat label="Помилки" value={num(s.failed)} tone={s.failed ? "bad" : undefined} />
        <Stat label="Кліки" value={num(s.clicks)} hint={`CTR ${rate(d.ctr)}`} />
        <Stat label="Відписки" value={num(s.unsubscribed)} hint={pct(s.unsubscribed, s.sent)} />
        <Stat label="Скарги" value={num(s.complained)} hint={pct(s.complained, s.sent)} tone={s.sent && s.complained / s.sent > 0.003 ? "bad" : undefined} />
        <Stat label="Недоставка" value={num(s.bounced)} hint={pct(s.bounced, s.sent)} />
      </div>

      {Object.keys(d.byChannel || {}).length > 1 && (
        <Section title="За каналами">
          <div className="grid gap-2 sm:grid-cols-2">
            {Object.entries(d.byChannel).map(([ch, v]) => (
              <p key={ch} className="rounded-(--r-md) border border-(--line) bg-(--surface-2) p-2 text-sm text-(--ink)">
                <b>{CHANNEL_LABELS[ch] || ch}:</b> надіслано {num(v.sent)}, у черзі {num(v.queued)}, пропущено {num(v.skipped)}, помилки {num(v.failed)}
              </p>
            ))}
          </div>
        </Section>
      )}

      <div className="grid gap-4 lg:grid-cols-2 items-start">
        <Section title="По днях" hint="Надіслані повідомлення й кліки за датою відправки (Київ).">
          <DayBars
            title="Надіслано й кліки по днях"
            labels={days.map((x) => x.date)}
            series={[
              { label: "Надіслано", color: "var(--chart-1)", values: days.map((x) => x.sent) },
              { label: "Кліки", color: "var(--chart-2)", values: days.map((x) => x.clicks) },
            ]}
          />
        </Section>
        <Section title="Чому пропущено" hint="Контакти, яким не надсилали на момент відправки.">
          <HBars title="Пропуски за причинами" items={skippedItems} />
        </Section>
      </div>

      <Section title="Топ посилань" hint="Відкриття листів не відстежуємо (Apple MPP) — лише кліки.">
        {(d.topLinks || []).length ? (
          <ol className="flex flex-col gap-1 text-sm">
            {d.topLinks.map((l) => (
              <li key={l.url} className="flex min-w-0 items-center gap-2 rounded-(--r-md) border border-(--line) bg-(--surface-2) p-2 text-(--ink)">
                <MdLink aria-hidden="true" className="shrink-0 text-(--ink-2)" />
                <span className="flex-1 min-w-0 truncate" title={l.url}>
                  {l.url}
                </span>
                <b className="tabular-nums shrink-0">{num(l.clicks)}</b>
              </li>
            ))}
          </ol>
        ) : (
          <Empty title="Кліків ще немає" icon={<MdLink />} />
        )}
      </Section>

      {(d.failures || []).length > 0 && (
        <Section title={`Помилки відправки (${num(d.failures.length)})`}>
          <ul className="flex flex-col divide-y divide-(--line) text-sm text-(--ink)">
            {d.failures.map((f, i) => (
              <li key={`${f.contactId}-${i}`} className="py-2 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                <span className="sm:w-56 truncate">
                  {f.contactId ? (
                    <Link to={`${BASE}/crm?contact=${f.contactId}`} className="font-medium text-(--brand-ink) underline">
                      {f.name || f.email || "Контакт"}
                    </Link>
                  ) : (
                    f.email || "—"
                  )}
                </span>
                <span className="text-xs text-(--ink-2) sm:w-24">{CHANNEL_LABELS[f.channel] || f.channel}</span>
                <span className="flex-1 min-w-0 break-words text-xs font-medium text-(--danger)">{f.error || "Невідома помилка"}</span>
                <span className="shrink-0 text-xs text-(--ink-2)">
                  спроб: {num(f.attempts)} · {fmtDateTime(f.at)}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {ask === "cancel" && (
        <Confirm
          title="Скасувати розсилку?"
          text={`Повідомлення, що ще в черзі, не буде надіслано. Уже надіслані (${num(s.sent)}) не відкликаються. Дію не можна скасувати.`}
          confirmLabel="Так, скасувати"
          busy={busy}
          onConfirm={cancel}
          onCancel={() => setAsk(null)}
        />
      )}
      {ask === "edit" && (
        <Confirm
          title="Змінити заплановану розсилку?"
          text="Після збереження змін розсилка повернеться в чернетку — потрібно буде знову порахувати отримувачів і запланувати її."
          confirmLabel="Перейти до редагування"
          tone="success"
          onConfirm={() => {
            setAsk(null);
            onEdit?.();
          }}
          onCancel={() => setAsk(null)}
        />
      )}
    </Page>
  );
};

export default CampaignReport;
