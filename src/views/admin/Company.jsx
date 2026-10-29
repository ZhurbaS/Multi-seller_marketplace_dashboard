import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/api";

const inputCls =
  "px-3 py-2 focus:border-indigo-600 outline-none bg-[#6a5fdf] border border-slate-700 rounded-md text-[#d0d2d6] w-full";

const Field = ({ label, hint, children }) => (
  <div>
    <label className="text-xs block pb-1">{label}</label>
    {children}
    {hint && <span className="text-xs opacity-70">{hint}</span>}
  </div>
);

// Реквізити магазину для рахунків юридичним особам (спосіб оплати «За рахунком»)
const Company = () => {
  const [c, setC] = useState(null);
  const [configured, setConfigured] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .get("/admin/settings/company")
      .then(({ data }) => {
        setC(data.company);
        setConfigured(data.configured);
      })
      .catch((e) => toast.error(e.response?.data?.error || "Не вдалося завантажити реквізити"));
  }, []);

  if (!c) return <div className="p-7 text-[#d0d2d6]">Завантаження…</div>;
  const set = (k) => (e) => setC({ ...c, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.put("/admin/settings/company", c);
      setC(data.company);
      setConfigured(true);
      toast.success(data.message);
    } catch (err) {
      toast.error(err.response?.data?.error || "Не вдалося зберегти");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="px-2 lg:px-7 pt-5">
      <form onSubmit={save} className="w-full p-4 bg-[#6a5fdf] rounded-md text-[#d0d2d6] flex flex-col gap-4 max-w-[900px]">
        <h1 className="text-xl font-semibold">Реквізити магазину для рахунків</h1>
        <p className="text-sm opacity-80">
          Ці дані потрапляють у PDF-рахунок, який отримує юридична особа / ФОП при оплаті «За рахунком». Поки реквізити не
          заповнені, цей спосіб оплати покупцям не пропонується.{" "}
          <b>{configured ? "Реквізити заповнено — рахунки доступні." : "Реквізити ще не заповнено."}</b>
        </p>

        <div className="grid md:grid-cols-2 gap-3">
          <Field label="Повна назва (ТОВ / ФОП …)">
            <input className={inputCls} value={c.name} onChange={set("name")} maxLength={200} required />
          </Field>
          <Field label="Код ЄДРПОУ (8 цифр) / РНОКПП ФОП (10 цифр)">
            <input className={inputCls} value={c.edrpou} onChange={set("edrpou")} inputMode="numeric" maxLength={10} required />
          </Field>
          <Field label="IBAN (UA + 27 цифр)">
            <input className={inputCls} value={c.iban} onChange={set("iban")} maxLength={42} required />
          </Field>
          <Field label="Банк">
            <input className={inputCls} value={c.bank} onChange={set("bank")} maxLength={200} placeholder="напр. АТ КБ «ПРИВАТБАНК»" />
          </Field>
          <Field label="Юридична адреса">
            <input className={inputCls} value={c.address} onChange={set("address")} maxLength={300} required />
          </Field>
          <Field label="ІПН (якщо є)">
            <input className={inputCls} value={c.ipn} onChange={set("ipn")} inputMode="numeric" maxLength={12} />
          </Field>
          <Field label="Телефон">
            <input className={inputCls} value={c.phone} onChange={set("phone")} maxLength={50} />
          </Field>
          <Field label="Email">
            <input className={inputCls} type="email" value={c.email} onChange={set("email")} maxLength={100} />
          </Field>
          <Field label="Підпис «Виписав»" hint="Керівник або відповідальна особа">
            <input className={inputCls} value={c.director} onChange={set("director")} maxLength={100} />
          </Field>
          <Field label="Префікс номера рахунку" hint="Напр. РФ → РФ-00001">
            <input className={inputCls} value={c.invoicePrefix} onChange={set("invoicePrefix")} maxLength={10} />
          </Field>
          <Field label="Строк дії рахунку, днів (1–30)" hint="Після цього неоплачене замовлення скасовується автоматично, товар повертається в продаж">
            <input className={inputCls} type="number" min="1" max="30" value={c.invoiceValidDays} onChange={set("invoiceValidDays")} />
          </Field>
        </div>

        <div className="flex gap-4 items-center flex-wrap">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={c.vatPayer} onChange={set("vatPayer")} />
            Ми платник ПДВ (ціни на сайті вважаються з ПДВ)
          </label>
          {c.vatPayer && (
            <select
              className={`${inputCls} !w-[120px]`}
              value={c.vatPercent}
              onChange={(e) => setC({ ...c, vatPercent: Number(e.target.value) })}
            >
              <option value={20}>20%</option>
              <option value={7}>7%</option>
              <option value={0}>0%</option>
            </select>
          )}
        </div>

        <Field label="Додатковий текст у рахунку (необов'язково)">
          <textarea className={inputCls} rows={3} value={c.note} onChange={set("note")} maxLength={500} placeholder="Напр. умови поставки, контакт відділу продажів" />
        </Field>

        <p className="text-xs opacity-70">
          Рахунок надсилається на email покупця (з кабінету) і доступний для завантаження в його замовленні. Оплату ви
          підтверджуєте вручну в деталях замовлення після надходження коштів. Номер рахунку, дані й сума фіксуються в момент
          виставлення. Вигляд рахунку й порядок документів (накладна, акт, ПДВ) узгодьте з бухгалтером.
        </p>

        <button disabled={busy} className="self-start px-5 py-2 rounded-md bg-green-600 text-white disabled:opacity-50">
          Зберегти реквізити
        </button>
      </form>
    </div>
  );
};

export default Company;
