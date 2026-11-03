import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api/api";

const inputCls =
  "px-3 py-2 focus:border-indigo-600 outline-none bg-[#6a5fdf] border border-slate-700 rounded-md text-[#d0d2d6] w-full";

// Документи: slug збігається з бекендом (utiles/legalDocs.js)
const DOCS = [
  ["oferta", "Публічна оферта"],
  ["delivery", "Доставка й оплата"],
  ["returns", "Обмін і повернення"],
  ["warranty", "Гарантія"],
  ["privacy", "Конфіденційність"],
  ["cookies", "Cookies"],
];

const VARIABLES = [
  ["{{date}}", "дата редакції (ставиться при публікації)"],
  ["{{seller_name}}, {{edrpou}}, {{address}}, {{email}}", "з «Реквізити для рахунків»"],
  ["{{brand}}, {{domain}}, {{claims_email}}, {{hours_line}}", "поля нижче (спільні для всіх документів)"],
  ["{{vat_text}}, {{vat_status}}", "залежать від галочки «платник ПДВ» у реквізитах"],
  ["{{invoice_days}}", "строк дії рахунку з реквізитів"],
  ["{{card_days}}", "через скільки днів скасовується неоплачене замовлення"],
  ["{{withdrawal_days}}, {{refund_days}}", "з «Умови повернення»"],
];

// Безпечний показ (без HTML): ## / ### заголовки, «- » списки, **жирний**
const inline = (text, k) =>
  String(text)
    .split(/(\*\*[^*]+\*\*)/g)
    .map((part, i) =>
      part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
        <strong key={`${k}-${i}`}>{part.slice(2, -2)}</strong>
      ) : (
        <React.Fragment key={`${k}-${i}`}>{part}</React.Fragment>
      )
    );

const Preview = ({ text }) => {
  const blocks = String(text || "").split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className="flex flex-col gap-3 leading-relaxed bg-white text-slate-800 rounded-md p-5 max-h-[70vh] overflow-y-auto">
      {blocks.map((b, i) => {
        if (b.startsWith("### ")) return <h3 key={i} className="font-semibold">{inline(b.slice(4), i)}</h3>;
        if (b.startsWith("## ")) return <h2 key={i} className="text-lg font-bold mt-3">{inline(b.slice(3), i)}</h2>;
        if (b.split("\n").every((l) => l.startsWith("- "))) {
          return (
            <ul key={i} className="list-disc pl-6">
              {b.split("\n").map((l, j) => (
                <li key={j}>{inline(l.slice(2), `${i}-${j}`)}</li>
              ))}
            </ul>
          );
        }
        return <p key={i} className="whitespace-pre-line">{inline(b, i)}</p>;
      })}
    </div>
  );
};

// Юридичні документи: текст, спільні поля, перегляд і вимикач показу покупцям
const Oferta = () => {
  const [slug, setSlug] = useState("oferta");
  const [statuses, setStatuses] = useState({});
  const [st, setSt] = useState(null);
  const [template, setTemplate] = useState("");
  const [vars, setVars] = useState({ brand: "", domain: "", claimsEmail: "", hours: "" });
  const [tab, setTab] = useState("edit");
  const [busy, setBusy] = useState(false);

  const refreshStatuses = () =>
    api
      .get("/home/legal/status")
      .then(({ data }) => setStatuses(data.docs || {}))
      .catch(() => {});

  const apply = (data) => {
    setSt(data);
    setTemplate(data.template);
    setVars(data.vars);
    refreshStatuses();
  };

  useEffect(() => {
    setSt(null);
    setTab("edit");
    api
      .get(`/admin/settings/legal/${slug}`)
      .then(({ data }) => apply(data))
      .catch((e) => toast.error(e.response?.data?.error || "Не вдалося завантажити"));
  }, [slug]); // eslint-disable-line react-hooks/exhaustive-deps

  const tabs = (
    <div className="flex gap-2 flex-wrap">
      {DOCS.map(([id, label]) => (
        <button
          key={id}
          onClick={() => setSlug(id)}
          className={`px-3 py-1 rounded-md text-sm ${slug === id ? "bg-slate-900 text-white" : "bg-[#5b51c9]"}`}
        >
          {label}
          <span className={`ml-2 inline-block w-2 h-2 rounded-full ${statuses[id]?.published ? "bg-green-400" : "bg-slate-400"}`} title={statuses[id]?.published ? "показується покупцям" : "вимкнено"} />
        </button>
      ))}
    </div>
  );

  if (!st)
    return (
      <div className="px-2 lg:px-7 pt-5">
        <div className="w-full p-4 bg-[#6a5fdf] rounded-md text-[#d0d2d6] max-w-[1000px] flex flex-col gap-4">
          {tabs}
          <div>Завантаження…</div>
        </div>
      </div>
    );

  const dirty = template !== st.template || ["brand", "domain", "claimsEmail", "hours"].some((k) => vars[k] !== st.vars[k]);

  const run = async (fn, okMsg) => {
    setBusy(true);
    try {
      const { data } = await fn();
      apply(data);
      toast.success(okMsg || data.message);
    } catch (e) {
      toast.error(e.response?.data?.error || "Не вдалося виконати дію");
    } finally {
      setBusy(false);
    }
  };

  const save = () => run(() => api.put(`/admin/settings/legal/${slug}`, { template, vars }));
  const togglePublish = () => run(() => api.put(`/admin/settings/legal/${slug}/published`, { published: !st.published }));
  const reset = () => {
    if (!window.confirm("Повернути типовий текст цього документа? Ваші правки в тексті буде втрачено (поля й реквізити не зміняться).")) return;
    run(() => api.post(`/admin/settings/legal/${slug}/reset`));
  };

  const setVar = (k) => (e) => setVars({ ...vars, [k]: e.target.value });
  const missing = st.preview.missingLabels || [];

  return (
    <div className="px-2 lg:px-7 pt-5">
      <div className="w-full p-4 bg-[#6a5fdf] rounded-md text-[#d0d2d6] flex flex-col gap-4 max-w-[1000px]">
        <h1 className="text-xl font-semibold">Юридичні документи</h1>
        {tabs}
        <h2 className="text-lg font-semibold">{st.title}</h2>

        <div className="flex items-center justify-between gap-4 flex-wrap p-3 rounded-md bg-[#5b51c9]">
          <div className="text-sm">
            <div className="font-semibold">
              Показ покупцям: {st.published ? "увімкнено" : "вимкнено"}
              {st.version > 0 && <span className="opacity-80 font-normal"> · редакція № {st.version}</span>}
            </div>
            <div className="opacity-80">
              {st.published
                ? `Покупці бачать сторінку ${st.path} і посилання у футері${["oferta", "privacy"].includes(slug) ? "; при оформленні та реєстрації з'являється обов'язкова галочка згоди" : ""}.`
                : `Поки вимкнено: сторінки ${st.path} і посилання у футері немає${["oferta", "privacy"].includes(slug) ? "; галочка згоди не вимагається" : ""}.`}
            </div>
            {st.published && st.stale && (
              <div className="text-yellow-200 mt-1">
                Реквізити чи текст змінилися після публікації — покупці ще бачать попередню редакцію. Натисніть «Опублікувати нову редакцію».
              </div>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            {st.published && st.stale && (
              <button
                disabled={busy || dirty}
                onClick={() => run(() => api.put(`/admin/settings/legal/${slug}/published`, { published: true }))}
                className="px-4 py-2 rounded-md bg-yellow-500 text-black disabled:opacity-50"
              >
                Опублікувати нову редакцію
              </button>
            )}
            <button
              disabled={busy || dirty}
              onClick={togglePublish}
              title={dirty ? "Спочатку збережіть зміни" : ""}
              className={`px-4 py-2 rounded-md text-white disabled:opacity-50 ${st.published ? "bg-red-600" : "bg-green-600"}`}
            >
              {st.published ? "Вимкнути показ" : "Увімкнути показ"}
            </button>
          </div>
        </div>

        {missing.length > 0 && (
          <div className="p-3 rounded-md bg-yellow-100 text-yellow-900 text-sm">
            Щоб опублікувати, заповніть: <b>{missing.join("; ")}</b>. Реквізити продавця — у розділі{" "}
            <Link className="underline" to="/admin/dashboard/company">
              «Реквізити для рахунків»
            </Link>
            .
          </div>
        )}

        <p className="text-xs opacity-80">
          Текст підготовлено без участі юриста. <b>Перед увімкненням покажіть його юристу</b> і за потреби відредагуйте. Покупці бачать
          і приймають лише ту редакцію, яку ви опублікували; замовлення й акаунти зберігають номер редакції та підпис (хеш) прийнятого тексту.
          Поля «бренд, домен, e-mail, години» спільні для всіх документів.
        </p>

        <div className="grid md:grid-cols-4 max-md:grid-cols-1 gap-3">
          <div>
            <label className="text-xs block pb-1">Торговельна марка (бренд)</label>
            <input className={inputCls} value={vars.brand} onChange={setVar("brand")} maxLength={80} />
          </div>
          <div>
            <label className="text-xs block pb-1">Домен сайту</label>
            <input className={inputCls} value={vars.domain} onChange={setVar("domain")} maxLength={120} placeholder="example.ua" />
          </div>
          <div>
            <label className="text-xs block pb-1">Години роботи (необов'язково)</label>
            <input className={inputCls} value={vars.hours} onChange={setVar("hours")} maxLength={120} placeholder="Пн–Пт 9:00–18:00" />
          </div>
          <div>
            <label className="text-xs block pb-1">E-mail для претензій і запитів</label>
            <input className={inputCls} type="email" value={vars.claimsEmail} onChange={setVar("claimsEmail")} maxLength={120} placeholder="за замовчуванням — email з реквізитів" />
          </div>
        </div>

        <div className="flex gap-2">
          {[["edit", "Редактор"], ["preview", "Як побачить покупець"]].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-3 py-1 rounded-md text-sm ${tab === id ? "bg-slate-900 text-white" : "bg-[#5b51c9]"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "edit" ? (
          <>
            <textarea
              className={`${inputCls} font-mono text-xs`}
              rows={28}
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              spellCheck={false}
            />
            <details className="text-xs opacity-90">
              <summary className="cursor-pointer">Розмітка і змінні</summary>
              <p className="mt-2">
                <code>## Заголовок</code>, <code>### Підзаголовок</code>, <code>**жирний**</code>, список — рядки з «- », абзаци — через порожній рядок.
                HTML не підтримується. Змінні підставляються автоматично:
              </p>
              <ul className="list-disc pl-5 mt-1">
                {VARIABLES.map(([v, d]) => (
                  <li key={v}>
                    <code>{v}</code> — {d}
                  </li>
                ))}
              </ul>
            </details>
          </>
        ) : (
          <Preview text={st.preview.text} />
        )}
        {tab === "preview" && dirty && <p className="text-xs text-yellow-200">Перегляд показує збережений текст; є незбережені зміни.</p>}

        <div className="flex gap-3 flex-wrap items-center">
          <button disabled={busy || !dirty} onClick={save} className="px-5 py-2 rounded-md bg-green-600 text-white disabled:opacity-50">
            Зберегти
          </button>
          <button disabled={busy || st.isDefaultTemplate} onClick={reset} className="px-4 py-2 rounded-md bg-slate-700 text-white disabled:opacity-40">
            Повернути типовий текст
          </button>
          {dirty && <span className="text-xs text-yellow-200">Є незбережені зміни</span>}
        </div>
      </div>
    </div>
  );
};

export default Oferta;
