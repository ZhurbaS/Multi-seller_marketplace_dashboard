import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { MdAdd, MdAssignmentReturn, MdSettings, MdVisibility, MdVisibilityOff, MdWarningAmber } from "react-icons/md";
import api from "../../api/api";
import { orderNo } from "../../utils/statusLabels";
import { RETURN_STATUS, RETURN_REASON, PAYER, REFUND_STATUS, fmtDate } from "../../utils/returnLabels";
import {
  PageHeader,
  FilterBar,
  Tabs,
  Table,
  Pagination,
  StatusChip,
  Badge,
  Money,
  Button,
  Modal,
  Drawer,
  Field,
  Input,
  Select,
  Checkbox,
  Skeleton,
  useConfirm,
  cx,
} from "../../ui";

const TABS = [
  ["open", "Відкриті"],
  ["requested", "Нові"],
  ["refund_pending", "До повернення коштів"],
  ["overdue", "Прострочені"],
  ["refunded", "Повернено"],
  ["rejected", "Відхилені"],
  ["all", "Усі"],
];

const PAYER_OPTIONS = Object.entries(PAYER).map(([value, label]) => ({ value, label }));
const REASON_OPTIONS = [
  { value: "refused", label: "Відмовився від отримання на пошті" },
  { value: "withdrawal", label: "Відмова від товару" },
  { value: "defect", label: "Брак" },
  { value: "wrong_item", label: "Не той товар" },
  { value: "other", label: "Інше" },
];
const INSPECTION_OPTIONS = [
  { value: "ok", label: "Нормальний, в комплекті" },
  { value: "damaged", label: "Пошкоджений / є сліди використання" },
  { value: "mismatch", label: "Не відповідає заявці / некомплект" },
];

const statusTone = (s) =>
  s === "refunded" || s === "exchanged" || s === "closed"
    ? "success"
    : s === "rejected" || s === "cancelled"
      ? "danger"
      : s === "requested"
        ? "warning"
        : s === "refund_pending"
          ? "warning"
          : "brand";

const Section = ({ title, children, className }) => (
  <section className={cx("min-w-0 rounded-(--r-md) border border-(--line) bg-(--surface) p-3 sm:p-4", className)}>
    {title && <h3 className="mb-3 text-sm font-semibold text-(--ink)">{title}</h3>}
    {children}
  </section>
);

// ---------------------------------------------------------------- деталі заявки
const Details = ({ id, onChanged }) => {
  const [d, setD] = useState(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [ttn, setTtn] = useState("");
  const [insp, setInsp] = useState({ result: "ok", note: "", shippingCost: "", shippingPayer: "", restock: true });
  const [ref, setRef] = useState({ deduction: "", deductionReason: "", shippingCost: "", shippingPayer: "", manualNote: "" });
  const [confirm, confirmEl] = useConfirm();

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/admin/returns/${id}`);
      setD(data);
      const r = data.request;
      // Платник зворотної доставки за замовчуванням — з умов повернення (залежить від типу покупця і причини)
      const cfg = data.policy?.[r.buyerKind === "company" ? "company" : "individual"] || {};
      const defPayer = (r.reason === "withdrawal" || r.reason === "refused" ? cfg.shippingPayerWithdrawal : cfg.shippingPayerDefect) || "seller";
      const payer = r.shipment?.receivedAt ? r.refund?.shippingPayer || defPayer : defPayer;
      setRef((x) => ({
        ...x,
        deduction: r.refund?.deduction || "",
        deductionReason: r.refund?.deductionReason || "",
        shippingCost: r.refund?.shippingCost || "",
        shippingPayer: payer,
      }));
      setInsp((x) => ({ ...x, shippingCost: r.refund?.shippingCost || "", shippingPayer: defPayer }));
    } catch (e) {
      toast.error(e.response?.data?.error || "Не вдалося завантажити заявку");
    }
  }, [id]);

  useEffect(() => {
    setD(null);
    load();
  }, [load]);

  const call = async (method, path, body) => {
    setBusy(true);
    try {
      const { data } = await api[method](`/admin/returns/${id}${path}`, body);
      toast.success(data.message || "Готово");
      await load();
      onChanged();
    } catch (e) {
      toast.error(e.response?.data?.error || "Не вдалося виконати дію");
      load();
    } finally {
      setBusy(false);
    }
  };

  if (!d) {
    return (
      <div className="space-y-3">
        <Skeleton height={28} width="60%" />
        <Skeleton lines={4} />
        <Skeleton height={120} rounded="md" />
      </div>
    );
  }
  const { request: r, order, customer, preview } = d;
  const isReturn = r.kind === "return";
  const preReceive = ["requested", "approved", "shipped"].includes(r.status);
  const refundPending = r.status === "refund_pending";
  const rs = r.refund?.status;
  const final = (() => {
    const goods = preview?.goodsAmount ?? 0;
    const ded = Number(ref.deduction) || 0;
    const ship = ref.shippingPayer === "customer" ? Number(ref.shippingCost) || 0 : 0;
    return Math.max(0, Math.round((goods - ded - ship) * 100) / 100);
  })();
  const dedErr = Number(ref.deduction) < 0 ? "Не може бути від'ємним" : Number(ref.deduction) > 0 && !String(ref.deductionReason).trim() ? "Вкажіть причину утримання" : "";

  const itemColumns = [
    { key: "name", header: "Товар", primary: true, render: (i) => <span className="break-words">{i.name}</span> },
    { key: "q", header: "К-ть", align: "right", render: (i) => <span className="tabular-nums">{i.quantity}</span> },
    { key: "v", header: "Вартість", align: "right", render: (i) => <Money value={i.value} /> },
    { key: "c", header: "Комісія (повертається)", align: "right", render: (i) => <Money value={i.commission || 0} /> },
  ];

  return (
    <div className="space-y-4 text-sm">
      {confirmEl}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <StatusChip tone={statusTone(r.status)}>{RETURN_STATUS[r.status] || r.status}</StatusChip>
          <Badge tone="neutral">{r.kind === "cancellation" ? "Скасування" : "Повернення"}</Badge>
          {d.overdue && (
            <Badge tone="danger" icon={<MdWarningAmber />}>
              прострочено
            </Badge>
          )}
        </div>
        <p className="mt-2 text-(--ink)">{RETURN_REASON[r.reason]}</p>
        <p className="mt-1 text-(--ink-2)">
          Подано {fmtDate(r.createdAt, true)} ({r.createdBy === "customer" ? "покупцем" : r.createdBy}); крайній строк повернення коштів:{" "}
          {fmtDate(r.refundDueAt)}
        </p>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2">
        <Section title="Покупець і замовлення">
          <dl className="space-y-1.5">
            <div className="break-words">
              <dt className="inline text-(--ink-2)">Покупець: </dt>
              <dd className="inline">
                {customer?.name} · {customer?.email} {customer?.phone}
              </dd>
            </div>
            <div className="break-words">
              <dt className="inline text-(--ink-2)">Тип: </dt>
              <dd className="inline">
                {r.buyerKind === "company"
                  ? `Юрособа: ${order?.buyer?.companyName || ""}, ЄДРПОУ ${order?.buyer?.edrpou || ""}${order?.buyer?.ipn ? `, ІПН ${order.buyer.ipn}` : ""}`
                  : "Фізична особа"}
              </dd>
            </div>
            <div className="break-words">
              <dt className="inline text-(--ink-2)">Замовлення: </dt>
              <dd className="inline">
                <Link className="font-medium text-(--brand-ink) underline" to={`/admin/dashboard/order/details/${r.orderId}`}>
                  {orderNo({ orderNumber: r.orderNumber, _id: r.orderId })}
                </Link>{" "}
                · сплачено <Money value={order?.price} /> ({order?.payment?.provider || order?.payment_method}) · вже повернено{" "}
                <Money value={order?.refunded_total || 0} />
              </dd>
            </div>
          </dl>
        </Section>
        <Section title="Доставка і побажання">
          <dl className="space-y-1.5">
            <div className="break-words">
              <dt className="inline text-(--ink-2)">Накладна: </dt>
              <dd className="inline">{r.shipment?.ttn ? `${r.shipment.carrier} ${r.shipment.ttn}` : "—"}</dd>
            </div>
            <div>
              <dt className="inline text-(--ink-2)">Бажане рішення: </dt>
              <dd className="inline">{r.resolution === "exchange" ? "обмін" : "повернення коштів"}</dd>
            </div>
            {r.comment && (
              <div className="break-words">
                <dt className="inline text-(--ink-2)">Коментар покупця: </dt>
                <dd className="inline">{r.comment}</dd>
              </div>
            )}
          </dl>
        </Section>
      </div>

      <Table caption="Товари в заявці" dense columns={itemColumns} rows={r.items || []} rowKey={(_, k) => k} />

      {/* Рішення по заявці */}
      {r.status === "requested" && (
        <Section title="Рішення по заявці">
          <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Field label="Коментар покупцю" hint="Необов'язково">
                <Input value={note} onChange={(e) => setNote(e.target.value)} />
              </Field>
              <Button loading={busy} onClick={() => call("put", "/approve", { note })}>
                {r.kind === "cancellation" ? "Схвалити: скасувати і повернути кошти" : "Схвалити повернення"}
              </Button>
            </div>
            <div className="flex flex-col gap-2">
              <Field
                label="Причина відмови"
                hint="Побачить покупець. Мінімум 3 символи."
                error={rejectReason && rejectReason.trim().length < 3 ? "Щонайменше 3 символи" : ""}
              >
                <Input value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
              </Field>
              <Button variant="danger" disabled={busy || rejectReason.trim().length < 3} onClick={() => call("put", "/reject", { reason: rejectReason })}>
                Відхилити
              </Button>
            </div>
          </div>
        </Section>
      )}

      {isReturn && ["approved", "shipped"].includes(r.status) && (
        <Section title="Накладна">
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-end">
            <Field label="Номер накладної (якщо покупець не вказав)" className="min-w-0 flex-1">
              <Input inputMode="numeric" autoComplete="off" value={ttn} onChange={(e) => setTtn(e.target.value)} />
            </Field>
            <Button variant="secondary" disabled={busy || ttn.trim().length < 5} onClick={() => call("put", "/shipment", { ttn, carrier: "Нова пошта" })}>
              Зберегти ТТН
            </Button>
          </div>
        </Section>
      )}

      {isReturn && preReceive && r.status !== "requested" && (
        <Section title="Товар отримано — огляд">
          <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Стан товару">
              <Select options={INSPECTION_OPTIONS} value={insp.result} onChange={(e) => setInsp({ ...insp, result: e.target.value })} />
            </Field>
            <Field label="Вартість зворотної доставки, ₴">
              <Input type="number" inputMode="decimal" min="0" value={insp.shippingCost} onChange={(e) => setInsp({ ...insp, shippingCost: e.target.value })} />
            </Field>
            <Field label="Хто платить за доставку">
              <Select options={PAYER_OPTIONS} value={insp.shippingPayer} onChange={(e) => setInsp({ ...insp, shippingPayer: e.target.value })} />
            </Field>
            <Field label="Нотатка">
              <Input value={insp.note} onChange={(e) => setInsp({ ...insp, note: e.target.value })} />
            </Field>
          </div>
          <div className="mt-3 flex min-w-0 flex-wrap items-center justify-between gap-3">
            <Checkbox
              label="Повернути придатний товар на склад (+ до залишку)"
              checked={insp.restock}
              disabled={insp.result !== "ok"}
              onChange={(e) => setInsp({ ...insp, restock: e.target.checked })}
            />
            <Button loading={busy} onClick={() => call("put", "/receive", insp)}>
              Підтвердити отримання
            </Button>
          </div>
        </Section>
      )}

      {isReturn && r.status === "received" && (
        <Section title="Рішення щодо коштів">
          <p className="text-(--ink)">
            Товарів на <Money value={r.itemsValue} />, до повернення за товари{" "}
            {preview?.goodsAmount != null ? <Money value={preview.goodsAmount} /> : "—"} (частку знижки/купона вже віднято).
          </p>
          <p className="mt-1 text-(--ink-2)">
            Огляд: {r.inspection?.result === "ok" ? "товар у порядку" : r.inspection?.result === "damaged" ? "товар пошкоджений" : "невідповідність"}
            {r.inspection?.note ? ` — ${r.inspection.note}` : ""}. Закон не дозволяє утримувати плату за «використання» товару при відмові від договору —
            утримання застосовуйте лише за реальне погіршення товарних властивостей і вказуйте причину.
          </p>
          <div className="mt-3 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Утримання, ₴" error={dedErr}>
              <Input type="number" inputMode="decimal" min="0" value={ref.deduction} onChange={(e) => setRef({ ...ref, deduction: e.target.value })} />
            </Field>
            <Field label="Причина утримання">
              <Input value={ref.deductionReason} onChange={(e) => setRef({ ...ref, deductionReason: e.target.value })} />
            </Field>
            <Field label="Доставка, ₴">
              <Input type="number" inputMode="decimal" min="0" value={ref.shippingCost} onChange={(e) => setRef({ ...ref, shippingCost: e.target.value })} />
            </Field>
            <Field label="Платник доставки">
              <Select options={PAYER_OPTIONS} value={ref.shippingPayer} onChange={(e) => setRef({ ...ref, shippingPayer: e.target.value })} />
            </Field>
          </div>
          <div className="mt-3 rounded-(--r-md) bg-(--surface-2) p-3">
            <span className="text-(--ink-2)">Покупець отримає: </span>
            <Money value={final} className="text-base font-bold" />
            {ref.shippingPayer === "seller" && Number(ref.shippingCost) > 0 && (
              <span className="text-(--ink-2)">
                {" "}
                · доставку <Money value={ref.shippingCost} /> буде списано з балансу продавця
              </span>
            )}
            {ref.shippingPayer === "store" && Number(ref.shippingCost) > 0 && (
              <span className="text-(--ink-2)">
                {" "}
                · доставку <Money value={ref.shippingCost} /> оплачує магазин
              </span>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button loading={busy} disabled={!!dedErr && Number(ref.deduction) < 0} onClick={() => call("post", "/refund", { ...ref, confirmRefund: true })}>
              Повернути кошти (monobank / LiqPay)
            </Button>
            <Button
              variant="secondary"
              disabled={busy}
              onClick={async () => {
                if (await confirm({ title: "Повернено вручну?", text: "Ви вже переказали кошти покупцю вручну?", confirmLabel: "Так, повернено", tone: "brand" }))
                  call("post", "/refund", { ...ref, confirmRefund: true, manual: true, manualNote: "вручну" });
              }}
            >
              Повернено вручну
            </Button>
            <Button variant="secondary" disabled={busy} onClick={() => call("put", "/exchange", { note })}>
              Обмін на інший товар
            </Button>
          </div>
        </Section>
      )}

      {refundPending && (
        <Section title="Повернення коштів">
          <p className="flex flex-wrap items-center gap-2">
            <Money value={r.refund.amount} className="font-semibold" />
            <StatusChip tone={rs === "failed" ? "danger" : "warning"}>{REFUND_STATUS[rs] || rs}</StatusChip>
            {r.refund.provider && <span className="text-(--ink-2)">{r.refund.provider}</span>}
          </p>
          {r.refund.error && <p className="mt-2 break-words text-(--danger)">{r.refund.error}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            {["pending", "failed"].includes(rs) && (
              <Button loading={busy} onClick={() => call("post", "/refund/retry")}>
                {rs === "failed" ? "Повторити повернення" : "Виконати повернення"}
              </Button>
            )}
            {rs === "processing" && (
              <Button variant="secondary" disabled={busy} onClick={() => call("post", "/refund/sync")}>
                Оновити статус у банку
              </Button>
            )}
            {["pending", "failed", "processing"].includes(rs) && (
              <Button
                variant="secondary"
                disabled={busy}
                onClick={async () => {
                  if (
                    await confirm({
                      title: "Повернено вручну?",
                      text: "Підтвердити, що кошти покупцю вже повернено вручну (переказом / у кабінеті банку)?",
                      confirmLabel: "Підтвердити",
                      tone: "brand",
                    })
                  )
                    call("post", "/refund/manual", { note: "вручну" });
                }}
              >
                Повернено вручну
              </Button>
            )}
          </div>
          {r.refund.provider === "manual" && <p className="mt-2 text-xs text-(--ink-2)">Для оплати при отриманні переведіть кошти покупцю вручну й підтвердіть.</p>}
        </Section>
      )}

      {/* Видимість у кабінеті покупця — окремо для кожної заявки */}
      <Section>
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
          <span>
            Показується в кабінеті покупця:{" "}
            <StatusChip tone={r.visibleToCustomer ? "success" : "neutral"}>{r.visibleToCustomer ? "так" : "ні"}</StatusChip>
          </span>
          <Button
            size="sm"
            variant="secondary"
            icon={r.visibleToCustomer ? <MdVisibilityOff /> : <MdVisibility />}
            disabled={busy}
            onClick={() => call("put", "/visibility", { visible: !r.visibleToCustomer })}
          >
            {r.visibleToCustomer ? "Приховати від покупця" : "Показати покупцю"}
          </Button>
        </div>
      </Section>

      <Section title="Історія">
        <ol className="space-y-2 border-l border-(--line) pl-4">
          {[...(r.timeline || [])].reverse().map((t, k) => (
            <li key={k} className="break-words">
              <span className="text-xs text-(--ink-2) tabular-nums">{fmtDate(t.at, true)}</span>
              <span className="block">
                <b className="font-medium">{t.by}</b> · {t.action}
                {t.note ? ` — ${t.note}` : ""}
              </span>
            </li>
          ))}
        </ol>
      </Section>
    </div>
  );
};

// ---------------------------------------------------------------- список
const Returns = () => {
  const [params] = useSearchParams();
  const fromOrder = params.get("order") || "";
  const [tab, setTab] = useState(fromOrder ? "all" : "open");
  const [q, setQ] = useState(fromOrder);
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ requests: [], total: 0, counts: {} });
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState(null);
  const [create, setCreate] = useState(null); // { orderId, reason, comment }
  const [creating, setCreating] = useState(false);
  const perPage = 15;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: d } = await api.get("/admin/returns", { params: { status: tab, q, page, perPage } });
      setData(d);
    } catch (e) {
      toast.error(e.response?.data?.error || "Не вдалося завантажити заявки");
    } finally {
      setLoading(false);
    }
  }, [tab, q, page]);

  useEffect(() => {
    load();
  }, [load]);

  const createReq = async (e) => {
    e.preventDefault();
    if (!create.orderId) return;
    setCreating(true);
    try {
      const { data: d } = await api.post("/admin/returns", create);
      toast.success(d.message);
      setCreate(null);
      setSel(d.request._id);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || "Не вдалося створити заявку");
    } finally {
      setCreating(false);
    }
  };

  const c = data.counts || {};
  const badge = (k) => (k === "open" ? c.open : k === "overdue" ? c.overdue : k === "all" ? null : c[k]);
  const selRow = (data.requests || []).find((r) => r._id === sel);

  const columns = [
    {
      key: "number",
      header: "№",
      primary: true,
      render: (r) => (
        <button type="button" className="text-left font-semibold text-(--brand-ink) hover:underline" onClick={() => setSel(r._id)}>
          {r.number}
        </button>
      ),
    },
    { key: "date", header: "Дата", render: (r) => <span className="tabular-nums">{fmtDate(r.createdAt)}</span> },
    {
      key: "kind",
      header: "Тип / причина",
      render: (r) => (
        <span className="flex min-w-0 flex-wrap items-center justify-end gap-1 md:justify-start">
          <span className="break-words">
            {r.kind === "cancellation" ? "Скасування" : "Повернення"} · {RETURN_REASON[r.reason]}
          </span>
          {r.buyerKind === "company" && (
            <Badge size="sm" tone="neutral">
              юрособа
            </Badge>
          )}
        </span>
      ),
    },
    { key: "sum", header: "Сума", align: "right", render: (r) => <Money value={r.refund?.amount || r.itemsValue} className="font-semibold" /> },
    {
      key: "status",
      header: "Статус",
      render: (r) => (
        <span className="flex flex-wrap items-center justify-end gap-1 md:justify-start">
          <StatusChip tone={statusTone(r.status)}>{RETURN_STATUS[r.status] || r.status}</StatusChip>
          {r.overdue && (
            <Badge size="sm" tone="danger" icon={<MdWarningAmber />}>
              прострочено
            </Badge>
          )}
        </span>
      ),
    },
    { key: "visible", header: "Видима покупцю", render: (r) => (r.visibleToCustomer ? "так" : "ні") },
    {
      key: "act",
      header: "Дії",
      align: "right",
      cardLabel: " ",
      render: (r) => (
        <Button size="sm" variant="secondary" onClick={() => setSel(r._id)}>
          Відкрити
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Повернення та скасування"
        description="Заявки покупців на повернення товару та скасування замовлень."
        breadcrumbs={[{ label: "Огляд", to: "/admin/dashboard" }, { label: "Повернення" }]}
        actions={
          <>
            <Button variant="secondary" as={Link} to="/admin/dashboard/returns-settings" icon={<MdSettings />}>
              Умови повернення
            </Button>
            <Button icon={<MdAdd />} onClick={() => setCreate({ orderId: "", reason: "refused", comment: "" })}>
              Заявка за покупця
            </Button>
          </>
        }
      />

      <Tabs
        ariaLabel="Статус заявок"
        className="mb-4"
        value={tab}
        onChange={(k) => {
          setTab(k);
          setPage(1);
        }}
        tabs={TABS.map(([value, label]) => ({ value, label, count: badge(value) || undefined }))}
      />

      <FilterBar
        search={{
          value: q,
          onChange: (v) => {
            setQ(v);
            setPage(1);
          },
          placeholder: "№ заявки / ID замовлення",
        }}
      />

      <Table
        caption="Заявки на повернення"
        columns={columns}
        rows={data.requests || []}
        loading={loading && !(data.requests || []).length}
        onRowClick={(r) => setSel(r._id)}
        empty={{
          icon: <MdAssignmentReturn />,
          title: q ? "Нічого не знайдено" : "Заявок немає",
          text: q ? "Спробуйте інший запит." : "Тут з'являться заявки покупців у цьому статусі.",
        }}
      />

      <Pagination page={page} total={data.total || 0} perPage={perPage} onChange={setPage} />

      <Drawer open={!!sel} onClose={() => setSel(null)} title={selRow ? `Заявка ${selRow.number}` : "Заявка"} width="min(760px, 100vw)">
        {sel && <Details id={sel} onChanged={load} />}
      </Drawer>

      <Modal
        open={!!create}
        onClose={() => setCreate(null)}
        title="Заявка за покупця"
        description="У заявку потраплять усі товари замовлення, які ще не в інших заявках. Підходить для оплачених замовлень (передоплата). Для неоплаченого замовлення (оплата при отриманні) просто скасуйте замовлення."
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreate(null)}>
              Скасувати
            </Button>
            <Button type="submit" form="create-return" loading={creating} disabled={!create?.orderId}>
              Створити
            </Button>
          </>
        }
      >
        {create && (
          <form id="create-return" onSubmit={createReq} className="space-y-4" noValidate>
            <Field label="ID замовлення" required>
              <Input value={create.orderId} onChange={(e) => setCreate({ ...create, orderId: e.target.value.trim() })} autoComplete="off" spellCheck={false} />
            </Field>
            <Field label="Причина">
              <Select options={REASON_OPTIONS} value={create.reason} onChange={(e) => setCreate({ ...create, reason: e.target.value })} />
            </Field>
            <Field label="Коментар">
              <Input value={create.comment} onChange={(e) => setCreate({ ...create, comment: e.target.value })} />
            </Field>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default Returns;
