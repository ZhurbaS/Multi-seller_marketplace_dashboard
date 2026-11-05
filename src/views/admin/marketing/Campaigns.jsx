// Список розсилок: GET /campaigns?status=&page=&limit= → {campaigns, total, page, pages}
import React, { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../../api/api";
import { useApiGet } from "./hooks";
import { MdAdd, MdBarChart, MdContentCopy, MdDeleteOutline, MdEdit, MdOutlineCampaign } from "react-icons/md";
import { Button, IconButton, Table } from "../../../ui";
import { BASE, CAMPAIGN_STATUS, CAMPAIGN_TOPICS, CRM, cleanParams, errMsg, fmtDateTime, listOf, num, pct } from "./mkUtils";
import { Badge, Card, Confirm, ErrorBox, Page, Pagination, Segmented } from "./ui";
import { CHANNEL_LABELS } from "./campaigns/campaignUtils";

const LIMIT = 20;
const FILTERS = [["", "Усі"], ...Object.entries(CAMPAIGN_STATUS).map(([k, v]) => [k, v.label])];
const when = (c) => c.finishedAt || c.startedAt || c.scheduledAt || c.updatedAt || c.createdAt;
const deletable = (c) => !["scheduled", "sending"].includes(c.status);

const Metrics = ({ s = {} }) => (
  <>
    <span>
      надіслано <b className="tabular-nums text-(--ink)">{num(s.sent)}</b>
      {s.recipients ? <span className="text-(--ink-2)"> / {num(s.recipients)}</span> : null}
    </span>
    <span>
      кліки <b className="tabular-nums text-(--ink)">{num(s.clicks)}</b> <span className="text-(--ink-2)">({pct(s.clicks, s.sent)})</span>
    </span>
    <span>
      відписки <b className="tabular-nums text-(--ink)">{num(s.unsubscribed)}</b>
    </span>
    {s.failed > 0 && <span className="font-medium text-(--danger)">помилки {num(s.failed)}</span>}
  </>
);

const Actions = ({ c, onDuplicate, onDelete, busy }) => (
  <div className="flex flex-wrap justify-end gap-1">
    <Button as={Link} to={`${BASE}/campaigns/${c._id}`} size="sm" variant="secondary" icon={c.status === "draft" ? <MdEdit /> : <MdBarChart />}>
      {c.status === "draft" ? "Редагувати" : "Звіт"}
    </Button>
    <IconButton size="sm" variant="secondary" icon={<MdContentCopy />} label={`Дублювати «${c.name}»`} onClick={() => onDuplicate(c)} disabled={busy} />
    {deletable(c) && <IconButton size="sm" variant="secondary" className="hover:text-(--danger)" icon={<MdDeleteOutline />} label={`Видалити «${c.name}»`} onClick={() => onDelete(c)} />}
  </div>
);

const channelsOf = (c) => (c.channels || []).map((x) => CHANNEL_LABELS[x] || x).join(", ");

const Campaigns = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const status = params.get("status") || "";
  const page = Number(params.get("page")) || 1;
  const query = useMemo(() => cleanParams({ status, page, limit: LIMIT }), [status, page]);
  const res = useApiGet(`${CRM}/campaigns`, query);
  const [del, setDel] = useState(null);
  const [busy, setBusy] = useState(false);
  const list = listOf(res.data, "campaigns");

  const setQ = (patch) =>
    setParams((p) => {
      const n = new URLSearchParams(p);
      Object.entries(patch).forEach(([k, v]) => (v ? n.set(k, v) : n.delete(k)));
      return n;
    });

  const duplicate = async (c) => {
    setBusy(true);
    try {
      const { data } = await api.post(`${CRM}/campaigns/${c._id}/duplicate`);
      toast.success("Створено копію-чернетку");
      navigate(`${BASE}/campaigns/${data.campaign._id}`);
    } catch (e) {
      toast.error(errMsg(e, "Не вдалося дублювати"));
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    setBusy(true);
    try {
      await api.delete(`${CRM}/campaigns/${del._id}`);
      toast.success("Розсилку видалено");
      setDel(null);
      res.reload();
    } catch (e) {
      toast.error(errMsg(e, "Не вдалося видалити"));
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    {
      key: "name",
      header: "Назва / тема",
      primary: true,
      render: (c) => (
        <div className="max-w-[280px]">
          <Link to={`${BASE}/campaigns/${c._id}`} className="break-words font-semibold text-(--ink) hover:underline">
            {c.name}
          </Link>
          {c.subject && <div className="truncate text-xs text-(--ink-2)">«{c.subject}»</div>}
        </div>
      ),
    },
    { key: "status", header: "Статус", render: (c) => <Badge meta={CAMPAIGN_STATUS[c.status]} /> },
    {
      key: "topic",
      header: "Тема й канали",
      render: (c) => (
        <span className="text-xs">
          {CAMPAIGN_TOPICS[c.topic] || c.topic}
          <span className="block text-(--ink-2)">{channelsOf(c)}</span>
        </span>
      ),
    },
    {
      key: "sent",
      header: "Надіслано",
      align: "right",
      render: (c) => {
        const s = c.stats || {};
        return (
          <span className="tabular-nums">
            {num(s.sent)}
            {s.recipients ? <span className="block text-xs text-(--ink-2)">з {num(s.recipients)}</span> : null}
            {s.failed > 0 && <span className="block text-xs font-medium text-(--danger)">помилки {num(s.failed)}</span>}
          </span>
        );
      },
    },
    {
      key: "clicks",
      header: "Кліки (CTR)",
      align: "right",
      render: (c) => (
        <span className="tabular-nums">
          {num(c.stats?.clicks)} <span className="text-xs text-(--ink-2)">({pct(c.stats?.clicks, c.stats?.sent)})</span>
        </span>
      ),
    },
    { key: "unsub", header: "Відписки", align: "right", render: (c) => <span className="tabular-nums">{num(c.stats?.unsubscribed)}</span> },
    { key: "date", header: "Дата", render: (c) => <span className="whitespace-nowrap text-xs">{fmtDateTime(when(c))}</span> },
    {
      key: "actions",
      header: <span className="sr-only">Дії</span>,
      align: "right",
      render: (c) => <Actions c={c} busy={busy} onDuplicate={duplicate} onDelete={setDel} />,
    },
  ];

  return (
    <Page
      title="Розсилки"
      description="Email і Telegram-розсилки для підписників. Відправка — лише контактам із активною згодою, з урахуванням тем і ліміту частоти."
      actions={
        <Button as={Link} to={`${BASE}/campaigns/new`} icon={<MdAdd />}>
          Нова розсилка
        </Button>
      }
    >
      <Card className="flex flex-col gap-3">
        <div className="overflow-x-auto">
          <Segmented label="Фільтр за статусом" size="sm" value={status} onChange={(v) => setQ({ status: v, page: "" })} options={FILTERS} />
        </div>
        <ErrorBox error={res.error} missing={res.missing} onRetry={res.reload} />
        <Table
          caption="Розсилки"
          rows={list}
          loading={res.loading && !res.data}
          columns={columns}
          renderCard={(c) => (
            <div className="flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <Link to={`${BASE}/campaigns/${c._id}`} className="min-w-0 break-words font-semibold text-(--ink) underline-offset-2 hover:underline">
                  {c.name}
                </Link>
                <Badge meta={CAMPAIGN_STATUS[c.status]} />
              </div>
              {c.subject && <p className="truncate text-xs text-(--ink-2)">«{c.subject}»</p>}
              <p className="text-xs text-(--ink-2)">
                {CAMPAIGN_TOPICS[c.topic] || c.topic} · {channelsOf(c)} · {fmtDateTime(when(c))}
              </p>
              <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-(--ink-2)">
                <Metrics s={c.stats} />
              </p>
              <Actions c={c} busy={busy} onDuplicate={duplicate} onDelete={setDel} />
            </div>
          )}
          empty={{
            icon: <MdOutlineCampaign />,
            title: status ? "Немає розсилок із таким статусом" : "Розсилок ще немає",
            text: status ? "Спробуйте інший фільтр." : "Створіть розсилку: оберіть сегмент, зберіть лист із блоків і надішліть тест собі.",
            action: !status && (
              <Button as={Link} to={`${BASE}/campaigns/new`} icon={<MdAdd />}>
                Створити першу розсилку
              </Button>
            ),
          }}
        />
        <Pagination page={res.data?.page || page} pages={res.data?.pages} total={res.data?.total} onPage={(p) => setQ({ page: p > 1 ? String(p) : "" })} />
      </Card>
      {del && (
        <Confirm
          title="Видалити розсилку?"
          text={`«${del.name}» буде видалено${del.status === "draft" ? "" : " разом зі звітом"}. Дію не можна скасувати.`}
          confirmLabel="Видалити"
          busy={busy}
          onConfirm={remove}
          onCancel={() => setDel(null)}
        />
      )}
    </Page>
  );
};

export default Campaigns;
