import React, { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api/api";
import { RETURN_STATUS, RETURN_REASON, PAYER, REFUND_STATUS, fmtDate } from "../../utils/returnLabels";

const inputCls =
  "px-3 py-2 focus:border-indigo-600 outline-none bg-[#6a5fdf] border border-slate-700 rounded-md text-[#d0d2d6] w-full";
const btn = "px-3 py-1 rounded-md text-sm bg-[#475569] text-[#d0d2d6] hover:bg-[#566377] disabled:opacity-50";
const btnMain = "px-3 py-1 rounded-md text-sm bg-green-600 text-white disabled:opacity-50";
const btnDanger = "px-3 py-1 rounded-md text-sm bg-red-600 text-white disabled:opacity-50";

const TABS = [
  ["open", "Відкриті"],
  ["requested", "Нові"],
  ["refund_pending", "До повернення коштів"],
  ["overdue", "Прострочені"],
  ["refunded", "Повернено"],
  ["rejected", "Відхилені"],
  ["all", "Усі"],
];

const Field = ({ label, children }) => (
  <div>
    <label className="text-xs block pb-1">{label}</label>
    {children}
  </div>
);

// ---------------------------------------------------------------- деталі заявки
const Details = ({ id, onClose, onChanged }) => {
  const [d, setD] = useState(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [ttn, setTtn] = useState("");
  const [insp, setInsp] = useState({ result: "ok", note: "", shippingCost: "", shippingPayer: "", restock: true });
  const [ref, setRef] = useState({ deduction: "", deductionReason: "", shippingCost: "", shippingPayer: "", manualNote: "" });

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/admin/returns/${id}`);
      setD(data);
      const r = data.request;
      // Платник зворотної доставки за замовчуванням — з умов повернення (залежить від типу покупця і причини)
      const cfg = data.policy?.[r.buyerKind === "company" ? "company" : "individual"] || {};
      const defPayer =
        (r.reason === "withdrawal" || r.reason === "refused" ? cfg.shippingPayerWithdrawal : cfg.shippingPayerDefect) || "seller";
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

  if (!d) return <div className="p-4 text-[#d0d2d6]">Завантаження…</div>;
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

  return (
    <div className="bg-[#5b51cc] rounded-md p-4 text-[#d0d2d6] flex flex-col gap-3">
      <div className="flex justify-between items-start flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-semibold">
            {r.number} · {r.kind === "cancellation" ? "Скасування" : "Повернення"}
          </h2>
          <div className="text-sm">
            {RETURN_REASON[r.reason]} · <b>{RETURN_STATUS[r.status]}</b>
            {d.overdue && <span className="ml-2 px-2 py-[1px] bg-red-600 text-white rounded text-xs">прострочено</span>}
          </div>
          <div className="text-sm opacity-80">
            Подано {fmtDate(r.createdAt, true)} ({r.createdBy === "customer" ? "покупцем" : r.createdBy}); крайній строк
            повернення коштів: {fmtDate(r.refundDueAt)}
          </div>
        </div>
        <button className={btn} onClick={onClose}>Закрити</button>
      </div>

      <div className="grid md:grid-cols-2 gap-3 text-sm">
        <div>
          <b>Покупець:</b> {customer?.name} · {customer?.email} {customer?.phone}
          <br />
          {r.buyerKind === "company" ? (
            <>
              <b>Юрособа:</b> {order?.buyer?.companyName}, ЄДРПОУ {order?.buyer?.edrpou}
              {order?.buyer?.ipn ? `, ІПН ${order.buyer.ipn}` : ""}
            </>
          ) : (
            "Фізична особа"
          )}
          <br />
          <b>Замовлення:</b>{" "}
          <Link className="underline" to={`/admin/dashboard/order/details/${r.orderId}`}>
            #{String(r.orderId).slice(-8).toUpperCase()}
          </Link>{" "}
          · сплачено ₴{order?.price} ({order?.payment?.provider || order?.payment_method}) · вже повернено ₴
          {order?.refunded_total || 0}
        </div>
        <div>
          <b>Накладна:</b> {r.shipment?.ttn ? `${r.shipment.carrier} ${r.shipment.ttn}` : "—"}
          <br />
          <b>Бажане рішення:</b> {r.resolution === "exchange" ? "обмін" : "повернення коштів"}
          <br />
          {r.comment && (
            <>
              <b>Коментар покупця:</b> {r.comment}
            </>
          )}
        </div>
      </div>

      <table className="w-full text-sm">
        <thead className="text-xs uppercase">
          <tr>
            <th className="text-left">Товар</th>
            <th className="text-left">К-ть</th>
            <th className="text-left">Вартість</th>
            <th className="text-left">Комісія (повертається)</th>
          </tr>
        </thead>
        <tbody>
          {r.items.map((i, k) => (
            <tr key={k} className="border-t border-slate-700/50">
              <td>{i.name}</td>
              <td>{i.quantity}</td>
              <td>₴{i.value}</td>
              <td>₴{i.commission || 0}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Рішення по заявці */}
      {r.status === "requested" && (
        <div className="grid md:grid-cols-2 gap-3 bg-[#6a5fdf] p-3 rounded-md">
          <div className="flex flex-col gap-2">
            <Field label="Коментар покупцю (необов'язково)">
              <input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} />
            </Field>
            <button className={btnMain} disabled={busy} onClick={() => call("put", "/approve", { note })}>
              {r.kind === "cancellation" ? "Схвалити: скасувати замовлення і повернути кошти" : "Схвалити повернення"}
            </button>
          </div>
          <div className="flex flex-col gap-2">
            <Field label="Причина відмови (побачить покупець)">
              <input className={inputCls} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
            </Field>
            <button
              className={btnDanger}
              disabled={busy || rejectReason.trim().length < 3}
              onClick={() => call("put", "/reject", { reason: rejectReason })}
            >
              Відхилити
            </button>
          </div>
        </div>
      )}

      {isReturn && ["approved", "shipped"].includes(r.status) && (
        <div className="flex gap-2 items-end bg-[#6a5fdf] p-3 rounded-md flex-wrap">
          <Field label="Номер накладної (якщо покупець не вказав)">
            <input className={inputCls} value={ttn} onChange={(e) => setTtn(e.target.value)} />
          </Field>
          <button className={btn} disabled={busy || ttn.trim().length < 5} onClick={() => call("put", "/shipment", { ttn, carrier: "Нова пошта" })}>
            Зберегти ТТН
          </button>
        </div>
      )}

      {isReturn && preReceive && r.status !== "requested" && (
        <div className="bg-[#6a5fdf] p-3 rounded-md grid md:grid-cols-4 gap-3">
          <div className="md:col-span-4 font-semibold">Товар отримано — огляд</div>
          <Field label="Стан товару">
            <select className={inputCls} value={insp.result} onChange={(e) => setInsp({ ...insp, result: e.target.value })}>
              <option value="ok">Нормальний, в комплекті</option>
              <option value="damaged">Пошкоджений / є сліди використання</option>
              <option value="mismatch">Не відповідає заявці / некомплект</option>
            </select>
          </Field>
          <Field label="Вартість зворотної доставки, ₴">
            <input className={inputCls} type="number" min="0" value={insp.shippingCost} onChange={(e) => setInsp({ ...insp, shippingCost: e.target.value })} />
          </Field>
          <Field label="Хто платить за доставку">
            <select className={inputCls} value={insp.shippingPayer} onChange={(e) => setInsp({ ...insp, shippingPayer: e.target.value })}>
              {Object.entries(PAYER).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </Field>
          <Field label="Нотатка">
            <input className={inputCls} value={insp.note} onChange={(e) => setInsp({ ...insp, note: e.target.value })} />
          </Field>
          <label className="text-sm flex items-center gap-2 md:col-span-3">
            <input type="checkbox" checked={insp.restock} disabled={insp.result !== "ok"} onChange={(e) => setInsp({ ...insp, restock: e.target.checked })} />
            Повернути придатний товар на склад (+ до залишку)
          </label>
          <button className={btnMain} disabled={busy} onClick={() => call("put", "/receive", insp)}>
            Підтвердити отримання
          </button>
        </div>
      )}

      {isReturn && r.status === "received" && (
        <div className="bg-[#6a5fdf] p-3 rounded-md grid md:grid-cols-4 gap-3">
          <div className="md:col-span-4 font-semibold">
            Рішення щодо коштів · товарів на ₴{r.itemsValue}, до повернення за товари ₴{preview?.goodsAmount ?? "—"} (частку
            знижки/купона вже віднято)
          </div>
          <div className="md:col-span-4 text-sm opacity-90">
            Огляд: {r.inspection?.result === "ok" ? "товар у порядку" : r.inspection?.result === "damaged" ? "товар пошкоджений" : "невідповідність"}
            {r.inspection?.note ? ` — ${r.inspection.note}` : ""}. Закон не дозволяє утримувати плату за «використання» товару при
            відмові від договору — утримання застосовуйте лише за реальне погіршення товарних властивостей і вказуйте причину.
          </div>
          <Field label="Утримання, ₴">
            <input className={inputCls} type="number" min="0" value={ref.deduction} onChange={(e) => setRef({ ...ref, deduction: e.target.value })} />
          </Field>
          <Field label="Причина утримання">
            <input className={inputCls} value={ref.deductionReason} onChange={(e) => setRef({ ...ref, deductionReason: e.target.value })} />
          </Field>
          <Field label="Доставка, ₴">
            <input className={inputCls} type="number" min="0" value={ref.shippingCost} onChange={(e) => setRef({ ...ref, shippingCost: e.target.value })} />
          </Field>
          <Field label="Платник доставки">
            <select className={inputCls} value={ref.shippingPayer} onChange={(e) => setRef({ ...ref, shippingPayer: e.target.value })}>
              {Object.entries(PAYER).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </Field>
          <div className="md:col-span-4 text-sm">
            Покупець отримає: <b>₴{final}</b>
            {ref.shippingPayer === "seller" && Number(ref.shippingCost) > 0 && <span> · доставку ₴{ref.shippingCost} буде списано з балансу продавця</span>}
            {ref.shippingPayer === "store" && Number(ref.shippingCost) > 0 && <span> · доставку ₴{ref.shippingCost} оплачує магазин</span>}
          </div>
          <div className="md:col-span-4 flex gap-2 flex-wrap">
            <button className={btnMain} disabled={busy} onClick={() => call("post", "/refund", { ...ref, confirmRefund: true })}>
              Повернути кошти (monobank / LiqPay)
            </button>
            <button
              className={btn}
              disabled={busy}
              onClick={() => window.confirm("Ви вже переказали кошти покупцю вручну?") && call("post", "/refund", { ...ref, confirmRefund: true, manual: true, manualNote: "вручну" })}
            >
              Повернено вручну
            </button>
            <button className={btn} disabled={busy} onClick={() => call("put", "/exchange", { note })}>
              Обмін на інший товар
            </button>
          </div>
        </div>
      )}

      {refundPending && (
        <div className="bg-[#6a5fdf] p-3 rounded-md flex flex-col gap-2">
          <div className="font-semibold">
            Повернення коштів: ₴{r.refund.amount} · {REFUND_STATUS[rs]}
            {r.refund.provider ? ` · ${r.refund.provider}` : ""}
          </div>
          {r.refund.error && <div className="text-sm text-yellow-200">{r.refund.error}</div>}
          <div className="flex gap-2 flex-wrap">
            {["pending", "failed"].includes(rs) && (
              <button className={btnMain} disabled={busy} onClick={() => call("post", "/refund/retry")}>
                {rs === "failed" ? "Повторити повернення" : "Виконати повернення"}
              </button>
            )}
            {rs === "processing" && (
              <button className={btn} disabled={busy} onClick={() => call("post", "/refund/sync")}>
                Оновити статус у банку
              </button>
            )}
            {["pending", "failed", "processing"].includes(rs) && (
              <button
                className={btn}
                disabled={busy}
                onClick={() =>
                  window.confirm("Підтвердити, що кошти покупцю вже повернено вручну (переказом / у кабінеті банку)?") &&
                  call("post", "/refund/manual", { note: "вручну" })
                }
              >
                Повернено вручну
              </button>
            )}
          </div>
          {r.refund.provider === "manual" && <p className="text-xs opacity-80">Для оплати при отриманні переведіть кошти покупцю вручну й підтвердіть.</p>}
        </div>
      )}

      {/* Видимість у кабінеті покупця — окремо для кожної заявки */}
      <div className="flex items-center gap-3 flex-wrap text-sm">
        <span>
          Показується в кабінеті покупця: <b>{r.visibleToCustomer ? "так" : "ні"}</b>
        </span>
        <button className={btn} disabled={busy} onClick={() => call("put", "/visibility", { visible: !r.visibleToCustomer })}>
          {r.visibleToCustomer ? "Приховати від покупця" : "Показати покупцю"}
        </button>
      </div>

      <div>
        <div className="font-semibold pb-1">Історія</div>
        <ul className="text-sm flex flex-col gap-[2px]">
          {[...(r.timeline || [])].reverse().map((t, k) => (
            <li key={k}>
              <span className="opacity-70">{fmtDate(t.at, true)}</span> · {t.by} · {t.action}
              {t.note ? ` — ${t.note}` : ""}
            </li>
          ))}
        </ul>
      </div>
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
  const [sel, setSel] = useState(null);
  const [create, setCreate] = useState(null); // { orderId, reason, comment }
  const perPage = 15;

  const load = useCallback(async () => {
    try {
      const { data: d } = await api.get("/admin/returns", { params: { status: tab, q, page, perPage } });
      setData(d);
    } catch (e) {
      toast.error(e.response?.data?.error || "Не вдалося завантажити заявки");
    }
  }, [tab, q, page]);

  useEffect(() => {
    load();
  }, [load]);

  const createReq = async (e) => {
    e.preventDefault();
    try {
      const { data: d } = await api.post("/admin/returns", create);
      toast.success(d.message);
      setCreate(null);
      setSel(d.request._id);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || "Не вдалося створити заявку");
    }
  };

  const pages = Math.max(1, Math.ceil(data.total / perPage));
  const c = data.counts || {};
  const badge = (k) => (k === "open" ? c.open : k === "overdue" ? c.overdue : k === "all" ? null : c[k]);

  return (
    <div className="px-2 lg:px-7 pt-5">
      <div className="w-full p-4 bg-[#6a5fdf] rounded-md text-[#d0d2d6]">
        <div className="flex justify-between items-center flex-wrap gap-2 pb-3">
          <h1 className="text-xl font-semibold">Повернення та скасування</h1>
          <div className="flex gap-2">
            <Link to="/admin/dashboard/returns-settings" className={btn}>Умови повернення</Link>
            <button className={btnMain} onClick={() => setCreate({ orderId: "", reason: "refused", comment: "" })}>
              + Заявка за покупця
            </button>
          </div>
        </div>

        {create && (
          <form onSubmit={createReq} className="bg-[#5b51cc] p-3 rounded-md mb-3 grid md:grid-cols-4 gap-3 items-end">
            <Field label="ID замовлення">
              <input className={inputCls} value={create.orderId} onChange={(e) => setCreate({ ...create, orderId: e.target.value.trim() })} required />
            </Field>
            <Field label="Причина">
              <select className={inputCls} value={create.reason} onChange={(e) => setCreate({ ...create, reason: e.target.value })}>
                <option value="refused">Відмовився від отримання на пошті</option>
                <option value="withdrawal">Відмова від товару</option>
                <option value="defect">Брак</option>
                <option value="wrong_item">Не той товар</option>
                <option value="other">Інше</option>
              </select>
            </Field>
            <Field label="Коментар">
              <input className={inputCls} value={create.comment} onChange={(e) => setCreate({ ...create, comment: e.target.value })} />
            </Field>
            <div className="flex gap-2">
              <button className={btnMain}>Створити</button>
              <button type="button" className={btn} onClick={() => setCreate(null)}>Скасувати</button>
            </div>
            <p className="md:col-span-4 text-xs opacity-80">
              У заявку потраплять усі товари замовлення, які ще не в інших заявках. Підходить для оплачених замовлень
              (передоплата). Для неоплаченого замовлення (оплата при отриманні) просто скасуйте замовлення.
            </p>
          </form>
        )}

        <div className="flex gap-2 flex-wrap pb-3">
          {TABS.map(([k, label]) => (
            <button
              key={k}
              onClick={() => { setTab(k); setPage(1); }}
              className={`px-3 py-1 rounded-md text-sm ${tab === k ? "bg-indigo-800 text-white" : "bg-[#475569]"} ${k === "overdue" && c.overdue ? "ring-1 ring-red-400" : ""}`}
            >
              {label}
              {badge(k) ? ` (${badge(k)})` : ""}
            </button>
          ))}
          <input
            className={`${inputCls} !w-[220px]`}
            placeholder="№ заявки / ID замовлення"
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
          />
        </div>

        {sel && (
          <div className="mb-4">
            <Details id={sel} onClose={() => setSel(null)} onChanged={load} />
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase border-b border-slate-700">
              <tr>
                <th className="py-2 pr-3">№</th>
                <th className="pr-3">Дата</th>
                <th className="pr-3">Тип / причина</th>
                <th className="pr-3">Сума</th>
                <th className="pr-3">Статус</th>
                <th className="pr-3">Видима покупцю</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.requests.map((r) => (
                <tr key={r._id} className={`border-b border-slate-700/50 ${r.overdue ? "bg-red-900/30" : ""}`}>
                  <td className="py-2 pr-3 font-semibold">{r.number}</td>
                  <td className="pr-3">{fmtDate(r.createdAt)}</td>
                  <td className="pr-3">
                    {r.kind === "cancellation" ? "Скасування" : "Повернення"} · {RETURN_REASON[r.reason]}
                    {r.buyerKind === "company" && <span className="ml-1 text-xs px-1 bg-slate-600 rounded">юрособа</span>}
                  </td>
                  <td className="pr-3">₴{r.refund?.amount || r.itemsValue}</td>
                  <td className="pr-3">
                    {RETURN_STATUS[r.status]}
                    {r.overdue && <span className="ml-1 text-red-300">⚠ прострочено</span>}
                  </td>
                  <td className="pr-3">{r.visibleToCustomer ? "так" : "ні"}</td>
                  <td>
                    <button className={btn} onClick={() => { setSel(r._id); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                      Відкрити
                    </button>
                  </td>
                </tr>
              ))}
              {data.requests.length === 0 && (
                <tr><td colSpan={7} className="py-6 text-center opacity-70">Заявок немає</td></tr>
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
      </div>
    </div>
  );
};

export default Returns;
