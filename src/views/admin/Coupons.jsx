import React, { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { MdAdd, MdAutorenew, MdDeleteOutline, MdEdit, MdHistory, MdLocalOffer } from "react-icons/md";
import api from "../../api/api";
import { fmtDate } from "../../utils/returnLabels";
import {
  Button,
  Checkbox,
  Field,
  FilterBar,
  IconButton,
  Input,
  Modal,
  Money,
  PageHeader,
  Pagination,
  Select,
  StatusChip,
  Switch,
  Table,
  useConfirm,
} from "../../ui";

const EMPTY = {
  code: "",
  title: "",
  campaign: "",
  type: "percent",
  value: "10",
  maxDiscount: "",
  minSubtotal: "",
  startsAt: "",
  endsAt: "",
  totalLimit: "",
  perCustomerLimit: "1",
  firstOrderOnly: false,
  active: true,
};

const STATUS_OPTIONS = [
  { value: "all", label: "Усі купони" },
  { value: "active", label: "Діючі" },
  { value: "inactive", label: "Вимкнені" },
  { value: "expired", label: "Завершені" },
];

const REDEMPTION_STATUS = {
  reserved: ["Резерв (очікує оплати)", "warning"],
  redeemed: ["Використано", "success"],
  released: ["Скасовано", "neutral"],
};

const toDateInput = (d) => {
  if (!d) return "";
  const x = new Date(d);
  const p = (n) => String(n).padStart(2, "0");
  return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}`;
};

// Інлайн-валідація (дзеркалить серверні правила, бекенд — джерело правди).
function validate(f) {
  const e = {};
  const code = String(f.code || "").trim().toUpperCase().replace(/\s+/g, "");
  if (code && !/^[A-Z0-9_-]{3,32}$/.test(code)) e.code = "3–32 символи: латиниця, цифри, «-» та «_»";
  const v = Number(f.value);
  if (!f.value || !Number.isFinite(v) || v <= 0) e.value = "Вкажіть значення більше 0";
  else if (f.type === "percent" && (v < 1 || v > 90)) e.value = "Відсоток — від 1 до 90";
  if (f.maxDiscount !== "" && Number(f.maxDiscount) <= 0) e.maxDiscount = "Має бути більше 0";
  if (f.minSubtotal !== "" && Number(f.minSubtotal) < 0) e.minSubtotal = "Не може бути від'ємною";
  if (f.startsAt && f.endsAt && f.endsAt < f.startsAt) e.endsAt = "Дата завершення раніше за дату старту";
  if (f.totalLimit !== "" && (!Number.isInteger(Number(f.totalLimit)) || Number(f.totalLimit) < 1)) e.totalLimit = "Ціле число від 1";
  if (!f.firstOrderOnly && f.perCustomerLimit !== "" && (!Number.isInteger(Number(f.perCustomerLimit)) || Number(f.perCustomerLimit) < 1))
    e.perCustomerLimit = "Ціле число від 1";
  return e;
}

// Купони: створює й веде адмін. Знижку по купону фінансує магазин — продавець отримує повну суму.
const Coupons = () => {
  const [list, setList] = useState([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(null); // null — форма закрита
  const [editId, setEditId] = useState(null);
  const [usage, setUsage] = useState(null); // { coupon, list }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState(false);
  const [confirm, confirmEl] = useConfirm();
  const perPage = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/coupons", { params: { status, q, page, perPage } });
      setList(data.coupons);
      setTotal(data.total);
    } catch (e) {
      toast.error(e.response?.data?.error || "Не вдалося завантажити купони");
    } finally {
      setLoading(false);
    }
  }, [status, q, page]);

  useEffect(() => {
    load();
  }, [load]);

  const openNew = async () => {
    setErrors({});
    setTouched(false);
    try {
      const { data } = await api.get("/admin/coupons/generate-code");
      setForm({ ...EMPTY, code: data.code });
      setEditId(null);
    } catch {
      setForm({ ...EMPTY });
      setEditId(null);
    }
  };

  const openEdit = (c) => {
    setErrors({});
    setTouched(false);
    setEditId(c._id);
    setForm({
      code: c.code,
      title: c.title || "",
      campaign: c.campaign || "",
      type: c.type,
      value: String(c.value),
      maxDiscount: c.maxDiscount ?? "",
      minSubtotal: c.minSubtotal || "",
      startsAt: toDateInput(c.startsAt),
      endsAt: toDateInput(c.endsAt),
      totalLimit: c.totalLimit ?? "",
      perCustomerLimit: c.perCustomerLimit ?? "",
      firstOrderOnly: !!c.firstOrderOnly,
      active: c.active,
    });
  };

  const update = (patch) => {
    const next = { ...form, ...patch };
    setForm(next);
    if (touched) setErrors(validate(next));
  };
  const set = (k) => (e) => update({ [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  const save = async (e) => {
    e?.preventDefault();
    setTouched(true);
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const body = {
      ...form,
      startsAt: form.startsAt ? new Date(`${form.startsAt}T00:00:00`).toISOString() : null,
      // діє до кінця вказаного дня
      endsAt: form.endsAt ? new Date(`${form.endsAt}T23:59:59`).toISOString() : null,
    };
    setSaving(true);
    try {
      const { data } = editId ? await api.put(`/admin/coupons/${editId}`, body) : await api.post("/admin/coupons", body);
      toast.success(data.message);
      setForm(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || "Не вдалося зберегти купон");
    } finally {
      setSaving(false);
    }
  };

  const regenerate = async () => {
    try {
      const { data } = await api.get("/admin/coupons/generate-code");
      update({ code: data.code });
    } catch {
      toast.error("Не вдалося згенерувати код");
    }
  };

  const toggle = async (c) => {
    setBusyId(c._id);
    try {
      await api.put(`/admin/coupons/${c._id}/active`, { active: !c.active });
      toast.success(c.active ? `Купон ${c.code} вимкнено` : `Купон ${c.code} увімкнено`);
      load();
    } catch (e) {
      toast.error(e.response?.data?.error || "Помилка");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (c) => {
    const ok = await confirm({
      title: `Видалити купон ${c.code}?`,
      text: "Купон зникне зі списку. Уже оформлені замовлення не зміняться.",
      confirmLabel: "Видалити",
      tone: "danger",
    });
    if (!ok) return;
    try {
      const { data } = await api.delete(`/admin/coupons/${c._id}`);
      toast.success(data.message);
      load();
    } catch (e) {
      toast.error(e.response?.data?.error || "Помилка");
    }
  };

  const showUsage = async (c) => {
    try {
      const { data } = await api.get(`/admin/coupons/${c._id}/redemptions`);
      setUsage({ coupon: c, list: data.redemptions });
    } catch (e) {
      toast.error(e.response?.data?.error || "Помилка");
    }
  };

  const state = (c) => {
    const now = new Date();
    if (!c.active) return ["Вимкнено", "neutral"];
    if (c.endsAt && new Date(c.endsAt) < now) return ["Завершено", "neutral"];
    if (c.startsAt && new Date(c.startsAt) > now) return ["Очікує старту", "warning"];
    if (c.totalLimit != null && c.usedCount >= c.totalLimit) return ["Ліміт вичерпано", "danger"];
    return ["Діє", "success"];
  };

  const columns = [
    {
      key: "code",
      header: "Код",
      primary: true,
      render: (c) => (
        <span className="block min-w-0">
          <span className="block break-all font-mono font-semibold">{c.code}</span>
          {(c.title || c.campaign) && <span className="block break-words text-xs text-(--ink-2)">{[c.title, c.campaign].filter(Boolean).join(" · ")}</span>}
        </span>
      ),
    },
    {
      key: "value",
      header: "Знижка",
      render: (c) => (
        <span className="tabular-nums">
          {c.type === "percent" ? `${c.value} %` : <Money value={c.value} />}
          {c.maxDiscount ? (
            <span className="block text-xs text-(--ink-2)">
              до <Money value={c.maxDiscount} />
            </span>
          ) : null}
        </span>
      ),
    },
    {
      key: "cond",
      header: "Умови",
      render: (c) => {
        const parts = [];
        if (c.minSubtotal > 0) parts.push(<span key="m">від <Money value={c.minSubtotal} /></span>);
        if (c.startsAt || c.endsAt) parts.push(<span key="d">{fmtDate(c.startsAt) || "…"} – {fmtDate(c.endsAt) || "…"}</span>);
        if (c.firstOrderOnly) parts.push(<span key="f">перше замовлення</span>);
        if (c.perCustomerLimit != null && !c.firstOrderOnly) parts.push(<span key="p">{c.perCustomerLimit} на покупця</span>);
        return parts.length ? <span className="flex flex-col text-xs text-(--ink-2)">{parts}</span> : <span className="text-(--ink-2)">—</span>;
      },
    },
    {
      key: "used",
      header: "Використано",
      align: "right",
      sortable: true,
      sortValue: (c) => c.usedCount,
      render: (c) => (
        <span className="tabular-nums">
          {c.usedCount}
          {c.totalLimit != null ? ` / ${c.totalLimit}` : ""}
        </span>
      ),
    },
    {
      key: "stats",
      header: "Знижок / дохід",
      align: "right",
      render: (c) => (
        <span className="inline-flex flex-col items-end">
          <span>
            <Money value={c.stats?.discount} /> / <Money value={Math.round(c.stats?.revenue || 0)} />
          </span>
          <span className="text-xs text-(--ink-2)">замовлень: {c.stats?.orders ?? 0}</span>
        </span>
      ),
    },
    {
      key: "status",
      header: "Статус",
      render: (c) => {
        const [label, tone] = state(c);
        return <StatusChip tone={tone}>{label}</StatusChip>;
      },
    },
    {
      key: "actions",
      header: "Дії",
      align: "right",
      render: (c) => (
        <span className="inline-flex flex-wrap items-center justify-end gap-1">
          <Switch size="sm" checked={!!c.active} disabled={busyId === c._id} onChange={() => toggle(c)} aria-label={c.active ? `Вимкнути ${c.code}` : `Увімкнути ${c.code}`} />
          <IconButton size="sm" icon={<MdEdit />} label={`Змінити ${c.code}`} onClick={() => openEdit(c)} />
          <IconButton size="sm" icon={<MdHistory />} label={`Історія використання ${c.code}`} onClick={() => showUsage(c)} />
          <IconButton size="sm" icon={<MdDeleteOutline />} label={`Видалити ${c.code}`} className="text-(--danger)" onClick={() => remove(c)} />
        </span>
      ),
    },
  ];

  const usageColumns = [
    { key: "createdAt", header: "Дата", render: (r) => fmtDate(r.createdAt, true) },
    { key: "orderId", header: "Замовлення", primary: true, render: (r) => <span className="font-mono">#{String(r.orderId).slice(-8).toUpperCase()}</span> },
    { key: "amount", header: "Знижка", align: "right", render: (r) => <Money value={r.amount} /> },
    { key: "orderTotal", header: "Сума замовлення", align: "right", render: (r) => <Money value={r.orderTotal} /> },
    {
      key: "status",
      header: "Статус",
      render: (r) => {
        const [label, tone] = REDEMPTION_STATUS[r.status] || [r.status, "neutral"];
        return <StatusChip tone={tone}>{label}</StatusChip>;
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="Купони"
        description="Знижку по купону фінансує магазин: продавець отримує повну суму за свої товари, комісія не змінюється. Купон і знижка за сумою замовлення не складаються — діє більша з двох. Один купон на замовлення."
        actions={
          <Button icon={<MdAdd />} onClick={openNew}>
            Новий купон
          </Button>
        }
      />

      <FilterBar
        search={{
          value: q,
          onChange: (v) => {
            setQ(v);
            setPage(1);
          },
          placeholder: "Код, назва, кампанія",
        }}
      >
        <Select
          aria-label="Статус купона"
          options={STATUS_OPTIONS}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="w-48"
        />
      </FilterBar>

      <Table
        caption="Купони"
        columns={columns}
        rows={list}
        loading={loading && !list.length}
        empty={{
          icon: <MdLocalOffer />,
          title: q || status !== "all" ? "Нічого не знайдено" : "Купонів поки немає",
          text: q || status !== "all" ? "Змініть пошук або фільтр." : "Створіть перший купон для акції чи розсилки.",
          action:
            !q && status === "all" ? (
              <Button icon={<MdAdd />} onClick={openNew}>
                Новий купон
              </Button>
            ) : null,
        }}
      />
      <Pagination page={page} total={total} perPage={perPage} onChange={setPage} />

      <Modal
        open={!!form}
        onClose={() => !saving && setForm(null)}
        size="xl"
        title={editId ? `Купон ${form?.code || ""}` : "Новий купон"}
        description="Поля з * — обов'язкові. Дати — включно, за часом магазину."
        footer={
          <>
            <Button variant="secondary" onClick={() => setForm(null)} disabled={saving}>
              Скасувати
            </Button>
            <Button type="submit" form="coupon-form" loading={saving}>
              {editId ? "Зберегти зміни" : "Створити купон"}
            </Button>
          </>
        }
      >
        {form && (
          <form id="coupon-form" onSubmit={save} noValidate className="flex flex-col gap-6">
            <section className="flex flex-col gap-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-(--ink-2)">Основне</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Код" error={errors.code} hint={editId ? "Код не можна змінити після створення" : "Порожньо — згенерується автоматично"}>
                  <Input
                    value={form.code}
                    onChange={(e) => update({ code: e.target.value.toUpperCase() })}
                    disabled={!!editId}
                    maxLength={32}
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    className="font-mono"
                    rightSlot={
                      !editId ? <IconButton size="sm" icon={<MdAutorenew />} label="Згенерувати код" onClick={regenerate} /> : null
                    }
                  />
                </Field>
                <Field label="Назва (для себе)">
                  <Input value={form.title} onChange={set("title")} maxLength={100} autoComplete="off" placeholder="Напр., Знижка до Дня народження" />
                </Field>
                <Field label="Кампанія (для аналітики)">
                  <Input value={form.campaign} onChange={set("campaign")} maxLength={50} autoComplete="off" placeholder="Напр., black-friday" />
                </Field>
              </div>
            </section>

            <section className="flex flex-col gap-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-(--ink-2)">Знижка</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Тип знижки">
                  <Select
                    value={form.type}
                    onChange={set("type")}
                    options={[
                      { value: "percent", label: "Відсоток" },
                      { value: "fixed", label: "Фіксована сума, ₴" },
                    ]}
                  />
                </Field>
                <Field label={form.type === "percent" ? "Відсоток (1–90)" : "Сума, ₴"} required error={errors.value}>
                  <Input type="number" inputMode="decimal" min="1" max={form.type === "percent" ? 90 : undefined} value={form.value} onChange={set("value")} />
                </Field>
                {form.type === "percent" && (
                  <Field label="Максимум знижки, ₴" hint="Необов'язково" error={errors.maxDiscount}>
                    <Input type="number" inputMode="decimal" min="1" value={form.maxDiscount} onChange={set("maxDiscount")} placeholder="без обмежень" />
                  </Field>
                )}
                <Field label="Мінімальна сума замовлення, ₴" error={errors.minSubtotal}>
                  <Input type="number" inputMode="decimal" min="0" value={form.minSubtotal} onChange={set("minSubtotal")} placeholder="0" />
                </Field>
              </div>
            </section>

            <section className="flex flex-col gap-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-(--ink-2)">Строк і ліміти</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Діє з">
                  <Input type="date" value={form.startsAt} onChange={set("startsAt")} />
                </Field>
                <Field label="Діє до (включно)" error={errors.endsAt}>
                  <Input type="date" value={form.endsAt} min={form.startsAt || undefined} onChange={set("endsAt")} />
                </Field>
                <Field label="Загальний ліміт використань" error={errors.totalLimit}>
                  <Input type="number" inputMode="numeric" min="1" step="1" value={form.totalLimit} onChange={set("totalLimit")} placeholder="без обмежень" />
                </Field>
                <Field label="Ліміт на одного покупця" error={errors.perCustomerLimit} hint={form.firstOrderOnly ? "Для першого замовлення — завжди 1" : undefined}>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min="1"
                    step="1"
                    value={form.firstOrderOnly ? 1 : form.perCustomerLimit}
                    disabled={form.firstOrderOnly}
                    onChange={set("perCustomerLimit")}
                    placeholder="без обмежень"
                  />
                </Field>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-8">
                <Checkbox label="Лише для першого замовлення" checked={form.firstOrderOnly} onChange={set("firstOrderOnly")} />
                <Switch label="Активний" description="Вимкнений купон не приймається на оформленні" checked={!!form.active} onChange={(v) => update({ active: v })} />
              </div>
            </section>
          </form>
        )}
      </Modal>

      <Modal open={!!usage} onClose={() => setUsage(null)} size="lg" title={usage ? `Використання купона ${usage.coupon.code}` : ""}>
        {usage && (
          <Table
            caption="Використання купона"
            columns={usageColumns}
            rows={usage.list}
            dense
            empty={{ icon: <MdHistory />, title: "Ще не використовувався" }}
          />
        )}
      </Modal>
      {confirmEl}
    </div>
  );
};

export default Coupons;
