import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api/api";
import { get_category } from "../../store/Reducers/categorySlice";
import { PAYER } from "../../utils/returnLabels";

const inputCls =
  "px-3 py-2 focus:border-indigo-600 outline-none bg-[#6a5fdf] border border-slate-700 rounded-md text-[#d0d2d6] w-full";

const Toggle = ({ checked, onChange, title, hint }) => (
  <label className="flex gap-3 items-start cursor-pointer bg-[#5b51cc] p-3 rounded-md">
    <input type="checkbox" className="mt-1 w-4 h-4" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    <span>
      <span className="font-semibold block">{title}</span>
      <span className="text-xs opacity-80">{hint}</span>
    </span>
  </label>
);

const BuyerBlock = ({ title, v, set }) => (
  <div className="bg-[#5b51cc] p-3 rounded-md flex flex-col gap-3">
    <h3 className="font-semibold">{title}</h3>
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={v.withdrawalAllowed} onChange={(e) => set({ ...v, withdrawalAllowed: e.target.checked })} />
      Дозволити відмову від товару («передумав»)
    </label>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="text-xs block pb-1">Строк відмови, днів після отримання</label>
        <input className={inputCls} type="number" min="0" value={v.withdrawalDays} onChange={(e) => set({ ...v, withdrawalDays: e.target.value })} />
      </div>
      <div>
        <label className="text-xs block pb-1">Хто платить зворотну доставку</label>
        <select className={inputCls} value={v.shippingPayerWithdrawal} onChange={(e) => set({ ...v, shippingPayerWithdrawal: e.target.value })}>
          {Object.entries(PAYER).map(([k, l]) => (
            <option key={k} value={k}>{l}</option>
          ))}
        </select>
      </div>
    </div>
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={v.defectAllowed} onChange={(e) => set({ ...v, defectAllowed: e.target.checked })} />
      Дозволити повернення брака / невідповідного товару
    </label>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="text-xs block pb-1">Строк заяви про брак, днів після отримання</label>
        <input className={inputCls} type="number" min="0" value={v.defectDays} onChange={(e) => set({ ...v, defectDays: e.target.value })} />
      </div>
      <div>
        <label className="text-xs block pb-1">Хто платить зворотну доставку (брак)</label>
        <select className={inputCls} value={v.shippingPayerDefect} onChange={(e) => set({ ...v, shippingPayerDefect: e.target.value })}>
          {Object.entries(PAYER).map(([k, l]) => (
            <option key={k} value={k}>{l}</option>
          ))}
        </select>
      </div>
    </div>
  </div>
);

// Умови повернення — повністю під контролем адміна
const ReturnsSettings = () => {
  const dispatch = useDispatch();
  const { categories } = useSelector((s) => s.category);
  const [p, setP] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    dispatch(get_category({ perPage: 1000, page: 1, searchValue: "" }));
    api
      .get("/admin/settings/returns")
      .then(({ data }) => {
        setP(data.policy);
        setWarnings(data.warnings || []);
      })
      .catch((e) => toast.error(e.response?.data?.error || "Не вдалося завантажити умови"));
  }, [dispatch]);

  if (!p) return <div className="p-7 text-[#d0d2d6]">Завантаження…</div>;

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.put("/admin/settings/returns", p);
      setP(data.policy);
      setWarnings(data.warnings || []);
      toast.success(data.message);
    } catch (err) {
      toast.error(err.response?.data?.error || "Не вдалося зберегти");
    } finally {
      setBusy(false);
    }
  };

  const toggleCat = (name) =>
    setP({
      ...p,
      nonReturnableCategories: p.nonReturnableCategories.includes(name)
        ? p.nonReturnableCategories.filter((x) => x !== name)
        : [...p.nonReturnableCategories, name],
    });

  return (
    <div className="px-2 lg:px-7 pt-5">
      <form onSubmit={save} className="w-full p-4 bg-[#6a5fdf] rounded-md text-[#d0d2d6] flex flex-col gap-4 max-w-[980px]">
        <div className="flex justify-between flex-wrap gap-2">
          <h1 className="text-xl font-semibold">Умови повернення</h1>
          <Link to="/admin/dashboard/returns" className="px-3 py-1 rounded-md text-sm bg-[#475569]">← До заявок</Link>
        </div>

        {warnings.length > 0 && (
          <div className="bg-yellow-100 text-yellow-900 p-3 rounded-md text-sm flex flex-col gap-1">
            <b>Зверніть увагу (не блокує збереження):</b>
            {warnings.map((w, i) => (
              <span key={i}>• {w}</span>
            ))}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-3">
          <Toggle
            checked={p.enabled}
            onChange={(v) => setP({ ...p, enabled: v })}
            title="Приймати заявки на повернення й скасування"
            hint="Якщо вимкнути — кнопки «Повернути / Скасувати» зникнуть, нові заявки не приймаються (адмін може створювати їх за покупця; виняток для окремого замовлення — у його деталях)."
          />
          <Toggle
            checked={p.cabinetVisible}
            onChange={(v) => setP({ ...p, cabinetVisible: v })}
            title="Показувати розділ «Мої повернення» в кабінеті покупця"
            hint="Вимкнено — покупець не бачить свої заявки й сторінку «Мої повернення». Окрему заявку можна приховати в її деталях."
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <BuyerBlock title="Фізичні особи" v={p.individual} set={(v) => setP({ ...p, individual: v })} />
          <BuyerBlock title="Юридичні особи / ФОП" v={p.company} set={(v) => setP({ ...p, company: v })} />
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs block pb-1">Строк повернення коштів, днів</label>
            <input className={inputCls} type="number" min="1" max="90" value={p.refundDeadlineDays} onChange={(e) => setP({ ...p, refundDeadlineDays: e.target.value })} />
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold block pb-1">Адреса для повернення товарів</label>
          <textarea className={inputCls} rows={3} value={p.returnAddress} onChange={(e) => setP({ ...p, returnAddress: e.target.value })} placeholder="Місто, відділення Нової пошти, отримувач, телефон" />
        </div>
        <div>
          <label className="text-sm font-semibold block pb-1">Контакти для питань щодо повернення</label>
          <textarea className={inputCls} rows={2} value={p.contactInfo} onChange={(e) => setP({ ...p, contactInfo: e.target.value })} />
        </div>
        <div>
          <label className="text-sm font-semibold block pb-1">Текст умов (відображається на сторінці «Обмін та повернення»)</label>
          <textarea className={inputCls} rows={10} value={p.policyText} onChange={(e) => setP({ ...p, policyText: e.target.value })} />
          <p className="text-xs opacity-70 pt-1">Рекомендуємо показати текст юристу перед запуском.</p>
        </div>

        <div>
          <h3 className="text-sm font-semibold pb-1">Категорії, для яких відмова від товару («передумав») не пропонується</h3>
          <p className="text-xs opacity-70 pb-2">
            Повернення за браком діє завжди. Для фізосіб закон містить власний перелік винятків — звіряйтеся з ним.
          </p>
          <div className="flex flex-wrap gap-2">
            {(categories || []).map((c) => (
              <label key={c._id} className="flex items-center gap-1 text-sm bg-[#5b51cc] px-2 py-1 rounded">
                <input type="checkbox" checked={p.nonReturnableCategories.includes(c.name)} onChange={() => toggleCat(c.name)} />
                {c.name}
              </label>
            ))}
          </div>
        </div>

        <button disabled={busy} className="self-start px-5 py-2 rounded-md bg-green-600 text-white disabled:opacity-50">
          Зберегти умови
        </button>
      </form>
    </div>
  );
};

export default ReturnsSettings;
