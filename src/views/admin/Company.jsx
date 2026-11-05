import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { MdAccountBalance, MdBusiness, MdContactPhone, MdReceipt, MdSave, MdUndo, MdWarningAmber } from "react-icons/md";
import api from "../../api/api";
import MessengersCard from "./MessengersCard";
import {
  PageHeader,
  Card,
  CardHeader,
  CardBody,
  Field,
  Input,
  Select,
  Textarea,
  Switch,
  Button,
  StatusChip,
  Skeleton,
  EmptyState,
  StickyActions,
  useUnsavedChanges,
} from "../../ui";

const VAT_OPTIONS = [
  { value: 20, label: "20 %" },
  { value: 7, label: "7 %" },
  { value: 0, label: "0 %" },
];

// Інлайн-валідація (м'яка, бекенд лишається джерелом істини)
function validate(c) {
  const e = {};
  const s = (v) => String(v ?? "").trim();
  if (!s(c.name)) e.name = "Вкажіть повну назву";
  const code = s(c.edrpou);
  if (!code) e.edrpou = "Вкажіть код";
  else if (!/^(\d{8}|\d{10})$/.test(code)) e.edrpou = "8 цифр (ЄДРПОУ) або 10 цифр (РНОКПП)";
  const iban = s(c.iban).replace(/\s+/g, "").toUpperCase();
  if (!iban) e.iban = "Вкажіть IBAN";
  else if (!/^UA\d{27}$/.test(iban)) e.iban = "Формат: UA і 27 цифр";
  if (!s(c.address)) e.address = "Вкажіть юридичну адресу";
  if (s(c.ipn) && !/^\d{10,12}$/.test(s(c.ipn))) e.ipn = "10–12 цифр";
  if (s(c.email) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s(c.email))) e.email = "Невірний формат e-mail";
  const days = Number(c.invoiceValidDays);
  if (c.invoiceValidDays !== "" && c.invoiceValidDays != null && (!Number.isInteger(days) || days < 1 || days > 30)) e.invoiceValidDays = "Від 1 до 30 днів";
  return e;
}

// Реквізити магазину для рахунків (спосіб оплати «За реквізитами»: фізособи, юрособи, ФОП)
const Company = () => {
  const [c, setC] = useState(null);
  const [initial, setInitial] = useState(null);
  const [configured, setConfigured] = useState(false);
  const [busy, setBusy] = useState(false);
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    api
      .get("/admin/settings/company")
      .then(({ data }) => {
        setC(data.company);
        setInitial(data.company);
        setConfigured(data.configured);
      })
      .catch((e) => {
        const msg = e.response?.data?.error || "Не вдалося завантажити реквізити";
        setLoadError(msg);
        toast.error(msg);
      });
  }, []);

  const dirty = !!c && !!initial && JSON.stringify(c) !== JSON.stringify(initial);
  useUnsavedChanges(dirty);

  const header = (
    <PageHeader
      title="Реквізити магазину"
      description="Дані для PDF-рахунку при оплаті «За реквізитами» (фізособи, юрособи, ФОП). Поки реквізити не заповнені, цей спосіб оплати покупцям не пропонується."
      breadcrumbs={[{ label: "Огляд", to: "/admin/dashboard" }, { label: "Реквізити" }]}
      actions={
        c ? <StatusChip tone={configured ? "success" : "warning"}>{configured ? "Рахунки доступні" : "Реквізити не заповнено"}</StatusChip> : null
      }
    />
  );

  if (!c) {
    return (
      <div>
        {header}
        {loadError ? (
          <EmptyState icon={<MdWarningAmber />} title="Не вдалося завантажити реквізити" text={loadError} action={<Button onClick={() => window.location.reload()}>Оновити сторінку</Button>} />
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton height={260} rounded="lg" />
            <Skeleton height={260} rounded="lg" />
          </div>
        )}
      </div>
    );
  }

  const errors = validate(c);
  const errOf = (k) => (submitted || touched[k] ? errors[k] : "");
  const set = (k) => (e) => setC({ ...c, [k]: e.target.value });
  const blur = (k) => () => setTouched((t) => ({ ...t, [k]: true }));

  const save = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length) {
      toast.error("Перевірте виділені поля");
      return;
    }
    setBusy(true);
    try {
      const { data } = await api.put("/admin/settings/company", c);
      setC(data.company);
      setInitial(data.company);
      setConfigured(true);
      setSubmitted(false);
      setTouched({});
      toast.success(data.message);
    } catch (err) {
      toast.error(err.response?.data?.error || "Не вдалося зберегти");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <form onSubmit={save} noValidate>
        {header}
        <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader title="Юридична особа" icon={<MdBusiness />} />
            <CardBody className="space-y-4">
              <Field label="Повна назва (ТОВ / ФОП …)" required error={errOf("name")}>
                <Input value={c.name} onChange={set("name")} onBlur={blur("name")} maxLength={200} autoComplete="organization" />
              </Field>
              <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Код ЄДРПОУ / РНОКПП ФОП" required hint="8 або 10 цифр" error={errOf("edrpou")}>
                  <Input value={c.edrpou} onChange={set("edrpou")} onBlur={blur("edrpou")} inputMode="numeric" maxLength={10} autoComplete="off" />
                </Field>
                <Field label="ІПН (якщо є)" error={errOf("ipn")}>
                  <Input value={c.ipn} onChange={set("ipn")} onBlur={blur("ipn")} inputMode="numeric" maxLength={12} autoComplete="off" />
                </Field>
              </div>
              <Field label="Юридична адреса" required error={errOf("address")}>
                <Input value={c.address} onChange={set("address")} onBlur={blur("address")} maxLength={300} autoComplete="street-address" />
              </Field>
              <Switch
                checked={!!c.vatPayer}
                onChange={(v) => setC({ ...c, vatPayer: v })}
                label="Ми платник ПДВ"
                description="Ціни на сайті вважаються з ПДВ."
              />
              {c.vatPayer && (
                <Field label="Ставка ПДВ">
                  <Select options={VAT_OPTIONS} value={c.vatPercent} onChange={(e) => setC({ ...c, vatPercent: Number(e.target.value) })} />
                </Field>
              )}
            </CardBody>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader title="Банк" icon={<MdAccountBalance />} />
              <CardBody className="space-y-4">
                <Field label="IBAN" required hint="UA + 27 цифр" error={errOf("iban")}>
                  <Input value={c.iban} onChange={set("iban")} onBlur={blur("iban")} maxLength={42} autoComplete="off" spellCheck={false} className="uppercase" />
                </Field>
                <Field label="Банк">
                  <Input value={c.bank} onChange={set("bank")} maxLength={200} placeholder="напр. АТ КБ «ПРИВАТБАНК»" />
                </Field>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Контакти" icon={<MdContactPhone />} />
              <CardBody className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Телефон">
                  <Input type="tel" inputMode="tel" autoComplete="tel" value={c.phone} onChange={set("phone")} maxLength={50} />
                </Field>
                <Field label="E-mail" error={errOf("email")}>
                  <Input type="email" inputMode="email" autoComplete="email" value={c.email} onChange={set("email")} onBlur={blur("email")} maxLength={100} />
                </Field>
              </CardBody>
            </Card>
          </div>

          <Card className="lg:col-span-2">
            <CardHeader title="Рахунок" icon={<MdReceipt />} />
            <CardBody className="space-y-4">
              <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-3">
                <Field label="Підпис «Виписав»" hint="Керівник або відповідальна особа">
                  <Input value={c.director} onChange={set("director")} maxLength={100} autoComplete="name" />
                </Field>
                <Field label="Префікс номера рахунку" hint="Напр. РФ → РФ-00001">
                  <Input value={c.invoicePrefix} onChange={set("invoicePrefix")} maxLength={10} autoComplete="off" />
                </Field>
                <Field label="Строк дії рахунку, днів" hint="1–30. Після цього неоплачене замовлення скасовується, товар повертається в продаж." error={errOf("invoiceValidDays")}>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min="1"
                    max="30"
                    value={c.invoiceValidDays}
                    onChange={set("invoiceValidDays")}
                    onBlur={blur("invoiceValidDays")}
                  />
                </Field>
              </div>
              <Field label="Додатковий текст у рахунку" hint="Необов'язково">
                <Textarea rows={3} value={c.note} onChange={set("note")} maxLength={500} placeholder="Напр. умови поставки, контакт відділу продажів" />
              </Field>
              <p className="rounded-(--r-md) bg-(--surface-2) p-3 text-sm text-(--ink-2)">
                Рахунок надсилається на e-mail покупця (з кабінету) і доступний для завантаження в його замовленні. Оплату ви підтверджуєте вручну в
                деталях замовлення після надходження коштів. Номер рахунку, дані й сума фіксуються в момент виставлення. Вигляд рахунку й порядок
                документів (накладна, акт, ПДВ) узгодьте з бухгалтером.
              </p>
            </CardBody>
          </Card>
        </div>

        <StickyActions dirty={dirty}>
          <Button
            variant="ghost"
            icon={<MdUndo />}
            disabled={!dirty || busy}
            onClick={() => {
              setC(initial);
              setTouched({});
              setSubmitted(false);
            }}
          >
            Скасувати
          </Button>
          <Button type="submit" icon={<MdSave />} loading={busy}>
            Зберегти реквізити
          </Button>
        </StickyActions>
      </form>

      <div className="mt-6">
        <MessengersCard />
      </div>
    </div>
  );
};

export default Company;
