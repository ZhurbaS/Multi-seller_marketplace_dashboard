import React, { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/api";
import { fmtDate } from "../../utils/returnLabels";

const inputCls =
  "px-3 py-2 focus:border-indigo-600 outline-none bg-[#6a5fdf] border border-slate-700 rounded-md text-[#d0d2d6] w-full";
const btn = "px-3 py-1 rounded-md text-sm bg-[#475569] text-[#d0d2d6] hover:bg-[#566377]";

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

const toDateInput = (d) => {
  if (!d) return "";
  const x = new Date(d);
  const p = (n) => String(n).padStart(2, "0");
  return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}`;
};

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
  const perPage = 20;

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/admin/coupons", { params: { status, q, page, perPage } });
      setList(data.coupons);
      setTotal(data.total);
    } catch (e) {
      toast.error(e.response?.data?.error || "Не вдалося завантажити купони");
    }
  }, [status, q, page]);

  useEffect(() => {
    load();
  }, [load]);

  const openNew = async () => {
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

  const set = (k) => (e) =>
    setForm({ ...form, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  const save = async (e) => {
    e.preventDefault();
    const body = {
      ...form,
      startsAt: form.startsAt ? new Date(`${form.startsAt}T00:00:00`).toISOString() : null,
      // діє до кінця вказаного дня
      endsAt: form.endsAt ? new Date(`${form.endsAt}T23:59:59`).toISOString() : null,
    };
    try {
      const { data } = editId
        ? await api.put(`/admin/coupons/${editId}`, body)
        : await api.post("/admin/coupons", body);
      toast.success(data.message);
      setForm(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || "Не вдалося зберегти купон");
    }
  };

  const toggle = async (c) => {
    try {
      await api.put(`/admin/coupons/${c._id}/active`, { active: !c.active });
      load();
    } catch (e) {
      toast.error(e.response?.data?.error || "Помилка");
    }
  };

  const remove = async (c) => {
    if (!window.confirm(`Видалити купон ${c.code}?`)) return;
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
    if (!c.active) return ["Вимкнено", "bg-slate-500"];
    if (c.endsAt && new Date(c.endsAt) < now) return ["Завершено", "bg-slate-500"];
    if (c.startsAt && new Date(c.startsAt) > now) return ["Очікує старту", "bg-yellow-600"];
    if (c.totalLimit != null && c.usedCount >= c.totalLimit) return ["Ліміт вичерпано", "bg-orange-600"];
    return ["Діє", "bg-green-600"];
  };

  const pages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="px-2 lg:px-7 pt-5">
      <div className="w-full p-4 bg-[#6a5fdf] rounded-md text-[#d0d2d6]">
        <div className="flex justify-between items-center flex-wrap gap-2 pb-3">
          <h1 className="text-xl font-semibold">Купони</h1>
          <button onClick={openNew} className="px-4 py-2 rounded-md bg-green-600 text-white text-sm">
            + Новий купон
          </button>
        </div>
        <p className="text-sm opacity-80 pb-3">
          Знижку по купону фінансує магазин: продавець отримує повну суму за свої товари, комісія не змінюється.
          Купон і знижка за сумою замовлення не складаються — діє більша з двох. Один купон на замовлення.
        </p>

        {form && (
          <form onSubmit={save} className="bg-[#5b51cc] p-4 rounded-md mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-1">
              <label className="text-xs">Код</label>
              <div className="flex gap-2">
                <input
                  className={inputCls}
                  value={form.code}
                  onChange={set("code")}
                  disabled={!!editId}
                  maxLength={32}
                  required
                />
                {!editId && (
                  <button
                    type="button"
                    className={btn}
                    onClick={async () => {
                      const { data } = await api.get("/admin/coupons/generate-code");
                      setForm({ ...form, code: data.code });
                    }}
                  >
                    Згенерувати
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="text-xs">Назва (для себе)</label>
              <input className={inputCls} value={form.title} onChange={set("title")} maxLength={100} />
            </div>
            <div>
              <label className="text-xs">Кампанія (для аналітики)</label>
              <input className={inputCls} value={form.campaign} onChange={set("campaign")} maxLength={50} />
            </div>
            <div>
              <label className="text-xs">Тип знижки</label>
              <select className={inputCls} value={form.type} onChange={set("type")}>
                <option value="percent">Відсоток</option>
                <option value="fixed">Фіксована сума, ₴</option>
              </select>
            </div>
            <div>
              <label className="text-xs">{form.type === "percent" ? "Відсоток (1–90)" : "Сума, ₴"}</label>
              <input className={inputCls} type="number" min="1" value={form.value} onChange={set("value")} required />
            </div>
            {form.type === "percent" && (
              <div>
                <label className="text-xs">Максимум знижки, ₴ (необов'язково)</label>
                <input className={inputCls} type="number" min="1" value={form.maxDiscount} onChange={set("maxDiscount")} />
              </div>
            )}
            <div>
              <label className="text-xs">Мінімальна сума замовлення, ₴</label>
              <input className={inputCls} type="number" min="0" value={form.minSubtotal} onChange={set("minSubtotal")} />
            </div>
            <div>
              <label className="text-xs">Діє з</label>
              <input className={inputCls} type="date" value={form.startsAt} onChange={set("startsAt")} />
            </div>
            <div>
              <label className="text-xs">Діє до (включно)</label>
              <input className={inputCls} type="date" value={form.endsAt} onChange={set("endsAt")} />
            </div>
            <div>
              <label className="text-xs">Загальний ліміт використань</label>
              <input className={inputCls} type="number" min="1" value={form.totalLimit} onChange={set("totalLimit")} placeholder="без обмежень" />
            </div>
            <div>
              <label className="text-xs">Ліміт на одного покупця</label>
              <input
                className={inputCls}
                type="number"
                min="1"
                value={form.firstOrderOnly ? 1 : form.perCustomerLimit}
                disabled={form.firstOrderOnly}
                onChange={set("perCustomerLimit")}
                placeholder="без обмежень"
              />
            </div>
            <div className="flex flex-col gap-2 justify-end">
              <label className="text-sm flex items-center gap-2">
                <input type="checkbox" checked={form.firstOrderOnly} onChange={set("firstOrderOnly")} />
                Лише для першого замовлення
              </label>
              <label className="text-sm flex items-center gap-2">
                <input type="checkbox" checked={form.active} onChange={set("active")} />
                Активний
              </label>
            </div>
            <div className="md:col-span-3 flex gap-2">
              <button className="px-4 py-2 rounded-md bg-green-600 text-white text-sm">Зберегти</button>
              <button type="button" className={btn} onClick={() => setForm(null)}>
                Скасувати
              </button>
            </div>
          </form>
        )}

        <div className="flex gap-2 flex-wrap pb-3">
          <select className={`${inputCls} !w-auto`} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="all">Усі</option>
            <option value="active">Діючі</option>
            <option value="inactive">Вимкнені</option>
            <option value="expired">Завершені</option>
          </select>
          <input
            className={`${inputCls} !w-[240px]`}
            placeholder="Пошук: код, назва, кампанія"
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase border-b border-slate-700">
              <tr>
                <th className="py-2 pr-3">Код</th>
                <th className="pr-3">Знижка</th>
                <th className="pr-3">Умови</th>
                <th className="pr-3">Використано</th>
                <th className="pr-3">Знижок надано / дохід</th>
                <th className="pr-3">Статус</th>
                <th>Дії</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => {
                const [label, color] = state(c);
                return (
                  <tr key={c._id} className="border-b border-slate-700/50">
                    <td className="py-2 pr-3">
                      <div className="font-semibold">{c.code}</div>
                      <div className="text-xs opacity-70">{[c.title, c.campaign].filter(Boolean).join(" · ")}</div>
                    </td>
                    <td className="pr-3">
                      {c.type === "percent" ? `${c.value}%` : `₴${c.value}`}
                      {c.maxDiscount ? ` (до ₴${c.maxDiscount})` : ""}
                    </td>
                    <td className="pr-3 text-xs">
                      {c.minSubtotal > 0 && <div>від ₴{c.minSubtotal}</div>}
                      {(c.startsAt || c.endsAt) && (
                        <div>
                          {fmtDate(c.startsAt) || "…"} – {fmtDate(c.endsAt) || "…"}
                        </div>
                      )}
                      {c.firstOrderOnly && <div>перше замовлення</div>}
                      {c.perCustomerLimit != null && !c.firstOrderOnly && <div>{c.perCustomerLimit} на покупця</div>}
                    </td>
                    <td className="pr-3">
                      {c.usedCount}
                      {c.totalLimit != null ? ` / ${c.totalLimit}` : ""}
                    </td>
                    <td className="pr-3">
                      ₴{c.stats.discount} / ₴{Math.round(c.stats.revenue)}
                      <div className="text-xs opacity-70">замовлень: {c.stats.orders}</div>
                    </td>
                    <td className="pr-3">
                      <span className={`px-2 py-1 rounded text-xs text-white ${color}`}>{label}</span>
                    </td>
                    <td>
                      <div className="flex gap-1 flex-wrap">
                        <button className={btn} onClick={() => openEdit(c)}>Змінити</button>
                        <button className={btn} onClick={() => toggle(c)}>{c.active ? "Вимкнути" : "Увімкнути"}</button>
                        <button className={btn} onClick={() => showUsage(c)}>Історія</button>
                        <button className={btn} onClick={() => remove(c)}>Видалити</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {list.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center opacity-70">
                    Купонів поки немає
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="flex gap-2 pt-3 items-center">
            <button className={btn} disabled={page <= 1} onClick={() => setPage(page - 1)}>←</button>
            <span className="text-sm">{page} / {pages}</span>
            <button className={btn} disabled={page >= pages} onClick={() => setPage(page + 1)}>→</button>
          </div>
        )}

        {usage && (
          <div className="mt-4 bg-[#5b51cc] p-4 rounded-md">
            <div className="flex justify-between">
              <h2 className="font-semibold">Використання купона {usage.coupon.code}</h2>
              <button className={btn} onClick={() => setUsage(null)}>Закрити</button>
            </div>
            <table className="w-full text-sm mt-2">
              <thead className="text-xs uppercase">
                <tr>
                  <th className="text-left">Дата</th>
                  <th className="text-left">Замовлення</th>
                  <th className="text-left">Знижка</th>
                  <th className="text-left">Сума замовлення</th>
                  <th className="text-left">Статус</th>
                </tr>
              </thead>
              <tbody>
                {usage.list.map((r) => (
                  <tr key={r._id} className="border-t border-slate-700/50">
                    <td>{fmtDate(r.createdAt, true)}</td>
                    <td>#{String(r.orderId).slice(-8).toUpperCase()}</td>
                    <td>₴{r.amount}</td>
                    <td>₴{r.orderTotal}</td>
                    <td>{{ reserved: "Резерв (очікує оплати)", redeemed: "Використано", released: "Скасовано" }[r.status] || r.status}</td>
                  </tr>
                ))}
                {usage.list.length === 0 && (
                  <tr><td colSpan={5} className="py-3 opacity-70">Ще не використовувався</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Coupons;
