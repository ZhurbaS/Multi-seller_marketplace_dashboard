import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { MdGavel, MdInfoOutline, MdRestore, MdVisibility, MdVisibilityOff, MdWarningAmber } from "react-icons/md";
import api from "../../api/api";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Field,
  Input,
  PageHeader,
  Segmented,
  Skeleton,
  StatusChip,
  Tabs,
  Textarea,
  useConfirm,
} from "../../ui";
import StickyActions from "../../components/admin/StickyActions";

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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DOMAIN_RE = /^(?!https?:\/\/)[a-z0-9а-яіїєґ.-]+\.[a-z0-9а-яіїєґ-]{2,}(\/.*)?$/i;

// Безпечний показ (без HTML): ## / ### заголовки, «- » списки, **жирний**
const inline = (text, k) =>
  String(text)
    .split(/(\*\*[^*]+\*\*)/g)
    .map((part, i) =>
      part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
        <strong key={`${k}-${i}`}>{part.slice(2, -2)}</strong>
      ) : (
        <React.Fragment key={`${k}-${i}`}>{part}</React.Fragment>
      ),
    );

const Preview = ({ text }) => {
  const blocks = String(text || "")
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);
  return (
    <div className="flex max-h-[70vh] flex-col gap-3 overflow-y-auto rounded-(--r-md) border border-(--line) bg-(--surface) p-5 leading-relaxed text-(--ink) scrollbar-thin">
      {blocks.map((b, i) => {
        if (b.startsWith("### ")) return <h3 key={i} className="font-semibold">{inline(b.slice(4), i)}</h3>;
        if (b.startsWith("## ")) return <h2 key={i} className="mt-3 text-lg font-bold">{inline(b.slice(3), i)}</h2>;
        if (b.split("\n").every((l) => l.startsWith("- "))) {
          return (
            <ul key={i} className="list-disc pl-6">
              {b.split("\n").map((l, j) => (
                <li key={j}>{inline(l.slice(2), `${i}-${j}`)}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="whitespace-pre-line break-words">
            {inline(b, i)}
          </p>
        );
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
  const [confirm, confirmEl] = useConfirm();

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

  const docTabs = (
    <div className="-mx-1 overflow-x-auto px-1 scrollbar-thin">
      <Tabs
        ariaLabel="Документи"
        idPrefix="legal"
        value={slug}
        onChange={setSlug}
        tabs={DOCS.map(([id, label]) => ({
          value: id,
          label: (
            <span className="inline-flex items-center gap-1.5">
              {label}
              <span
                aria-hidden="true"
                className={`inline-block h-2 w-2 rounded-full ${statuses[id]?.published ? "bg-(--success)" : "bg-(--line-strong)"}`}
              />
              <span className="sr-only">{statuses[id]?.published ? "(показується покупцям)" : "(вимкнено)"}</span>
            </span>
          ),
        }))}
      />
    </div>
  );

  const header = (
    <PageHeader
      title="Юридичні документи"
      description="Тексти оферти, умов доставки, повернення, гарантії та політик. Покупці бачать лише опубліковану редакцію."
    />
  );

  if (!st)
    return (
      <div className="max-w-5xl">
        {header}
        {docTabs}
        <Card className="mt-4" padded>
          <div className="flex flex-col gap-4" aria-busy="true">
            <Skeleton height="1.5rem" width="40%" />
            <Skeleton lines={3} />
            <Skeleton height="20rem" />
          </div>
        </Card>
      </div>
    );

  const dirty = template !== st.template || ["brand", "domain", "claimsEmail", "hours"].some((k) => vars[k] !== st.vars[k]);

  const errors = {
    claimsEmail: vars.claimsEmail && !EMAIL_RE.test(vars.claimsEmail.trim()) ? "Перевірте формат e-mail" : "",
    domain: vars.domain && !DOMAIN_RE.test(vars.domain.trim()) ? "Вкажіть домен без http://, напр. example.ua" : "",
  };
  const hasErrors = Object.values(errors).some(Boolean);

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
  const togglePublish = async () => {
    if (st.published) {
      const ok = await confirm({
        title: "Вимкнути показ документа?",
        text: `Сторінка ${st.path} і посилання у футері зникнуть для покупців.`,
        confirmLabel: "Вимкнути",
        tone: "danger",
      });
      if (!ok) return;
    }
    run(() => api.put(`/admin/settings/legal/${slug}/published`, { published: !st.published }));
  };
  const reset = async () => {
    const ok = await confirm({
      title: "Повернути типовий текст?",
      text: "Ваші правки в тексті цього документа буде втрачено (поля й реквізити не зміняться).",
      confirmLabel: "Повернути",
      tone: "danger",
    });
    if (!ok) return;
    run(() => api.post(`/admin/settings/legal/${slug}/reset`));
  };

  const setVar = (k) => (e) => setVars({ ...vars, [k]: e.target.value });
  const missing = st.preview.missingLabels || [];
  const consent = ["oferta", "privacy"].includes(slug);

  return (
    <div className="max-w-5xl">
      {header}
      {docTabs}

      <div id={`legal-panel-${slug}`} role="tabpanel" className="mt-4 flex flex-col gap-5">
        <Card>
          <CardHeader
            icon={<MdGavel />}
            title={st.title}
            description={
              st.published
                ? `Покупці бачать сторінку ${st.path} і посилання у футері${consent ? "; при оформленні та реєстрації з'являється обов'язкова галочка згоди" : ""}.`
                : `Поки вимкнено: сторінки ${st.path} і посилання у футері немає${consent ? "; галочка згоди не вимагається" : ""}.`
            }
            actions={
              <span className="flex flex-wrap items-center gap-2">
                <StatusChip tone={st.published ? "success" : "neutral"} size="md">
                  {st.published ? "Показується покупцям" : "Вимкнено"}
                </StatusChip>
                {st.version > 0 && <Badge>редакція № {st.version}</Badge>}
              </span>
            }
          />
          <CardBody className="flex flex-col gap-3">
            {st.published && st.stale && (
              <div className="flex gap-2 rounded-(--r-md) bg-(--warning-soft) p-3 text-sm text-(--warning-ink)" role="status">
                <MdWarningAmber aria-hidden="true" className="mt-0.5 shrink-0 text-lg" />
                <span>Реквізити чи текст змінилися після публікації — покупці ще бачать попередню редакцію. Натисніть «Опублікувати нову редакцію».</span>
              </div>
            )}
            {missing.length > 0 && (
              <div className="flex gap-2 rounded-(--r-md) bg-(--warning-soft) p-3 text-sm text-(--warning-ink)" role="status">
                <MdInfoOutline aria-hidden="true" className="mt-0.5 shrink-0 text-lg" />
                <span>
                  Щоб опублікувати, заповніть: <b>{missing.join("; ")}</b>. Реквізити продавця — у розділі{" "}
                  <Link className="font-medium underline" to="/admin/dashboard/company">
                    «Реквізити для рахунків»
                  </Link>
                  .
                </span>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {st.published && st.stale && (
                <Button
                  variant="cta"
                  disabled={busy || dirty}
                  title={dirty ? "Спочатку збережіть зміни" : undefined}
                  onClick={() => run(() => api.put(`/admin/settings/legal/${slug}/published`, { published: true }))}
                >
                  Опублікувати нову редакцію
                </Button>
              )}
              <Button
                variant={st.published ? "secondary" : "primary"}
                icon={st.published ? <MdVisibilityOff /> : <MdVisibility />}
                disabled={busy || dirty}
                onClick={togglePublish}
                title={dirty ? "Спочатку збережіть зміни" : undefined}
              >
                {st.published ? "Вимкнути показ" : "Увімкнути показ"}
              </Button>
              {dirty && <span className="self-center text-xs text-(--ink-2)">Спочатку збережіть зміни</span>}
            </div>
            <p className="text-xs text-(--ink-2)">
              Текст підготовлено без участі юриста. <b className="text-(--ink)">Перед увімкненням покажіть його юристу</b> і за потреби відредагуйте. Покупці бачать і
              приймають лише ту редакцію, яку ви опублікували; замовлення й акаунти зберігають номер редакції та підпис (хеш) прийнятого тексту.
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Спільні поля" description="Бренд, домен, e-mail і години — спільні для всіх документів." />
          <CardBody className="grid gap-4 md:grid-cols-2">
            <Field label="Торговельна марка (бренд)">
              <Input value={vars.brand} onChange={setVar("brand")} maxLength={80} autoComplete="organization" />
            </Field>
            <Field label="Домен сайту" error={errors.domain}>
              <Input
                value={vars.domain}
                onChange={setVar("domain")}
                maxLength={120}
                placeholder="example.ua"
                inputMode="url"
                autoComplete="url"
                autoCapitalize="none"
                spellCheck={false}
              />
            </Field>
            <Field label="Години роботи" hint="Необов'язково">
              <Input value={vars.hours} onChange={setVar("hours")} maxLength={120} placeholder="Пн–Пт 9:00–18:00" autoComplete="off" />
            </Field>
            <Field label="E-mail для претензій і запитів" hint="За замовчуванням — e-mail з реквізитів" error={errors.claimsEmail}>
              <Input type="email" inputMode="email" autoComplete="email" value={vars.claimsEmail} onChange={setVar("claimsEmail")} maxLength={120} />
            </Field>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Текст документа"
            actions={
              <Segmented
                size="sm"
                ariaLabel="Режим"
                value={tab}
                onChange={setTab}
                options={[
                  { value: "edit", label: "Редактор" },
                  { value: "preview", label: "Як побачить покупець" },
                ]}
              />
            }
          />
          <CardBody className="flex flex-col gap-3">
            {tab === "edit" ? (
              <>
                <Textarea
                  aria-label="Текст документа"
                  className="font-mono text-xs leading-5"
                  rows={28}
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  spellCheck={false}
                />
                <details className="rounded-(--r-md) bg-(--surface-2) p-3 text-xs text-(--ink-2)">
                  <summary className="cursor-pointer font-medium text-(--ink)">Розмітка і змінні</summary>
                  <p className="mt-2">
                    <code>## Заголовок</code>, <code>### Підзаголовок</code>, <code>**жирний**</code>, список — рядки з «- », абзаци — через порожній рядок. HTML не
                    підтримується. Змінні підставляються автоматично:
                  </p>
                  <ul className="mt-1 list-disc pl-5">
                    {VARIABLES.map(([v, d]) => (
                      <li key={v}>
                        <code className="text-(--ink)">{v}</code> — {d}
                      </li>
                    ))}
                  </ul>
                </details>
              </>
            ) : (
              <>
                {dirty && <p className="text-xs text-(--warning-ink)">Перегляд показує збережений текст; є незбережені зміни.</p>}
                <Preview text={st.preview.text} />
              </>
            )}
          </CardBody>
        </Card>
      </div>

      <StickyActions hint={dirty ? "Є незбережені зміни" : "Усі зміни збережено"}>
        <Button variant="ghost" icon={<MdRestore />} disabled={busy || st.isDefaultTemplate} onClick={reset}>
          Повернути типовий текст
        </Button>
        <Button disabled={!dirty || hasErrors} loading={busy} onClick={save}>
          Зберегти
        </Button>
      </StickyActions>
      {confirmEl}
    </div>
  );
};

export default Oferta;
