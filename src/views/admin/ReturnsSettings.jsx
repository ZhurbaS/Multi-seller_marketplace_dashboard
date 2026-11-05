import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { MdArrowBack, MdBusiness, MdPerson, MdSave, MdSettings, MdUndo, MdWarningAmber, MdCategory, MdDescription } from "react-icons/md";
import api from "../../api/api";
import { get_category } from "../../store/Reducers/categorySlice";
import { PAYER } from "../../utils/returnLabels";
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
  Checkbox,
  Button,
  Skeleton,
  EmptyState,
  StickyActions,
  useUnsavedChanges,
} from "../../ui";

const PAYER_OPTIONS = Object.entries(PAYER).map(([value, label]) => ({ value, label }));

const daysErr = (v, { min = 0, max = 365 } = {}) => {
  if (v === "" || v === null || v === undefined) return "Вкажіть кількість днів";
  const n = Number(v);
  if (!Number.isInteger(n)) return "Ціле число днів";
  if (n < min || n > max) return `Від ${min} до ${max}`;
  return "";
};

const BuyerBlock = ({ title, icon, v, set, show }) => {
  const wErr = v.withdrawalAllowed ? daysErr(v.withdrawalDays) : "";
  const dErr = v.defectAllowed ? daysErr(v.defectDays) : "";
  return (
    <Card>
      <CardHeader title={title} icon={icon} />
      <CardBody className="space-y-5">
        <div className="space-y-3">
          <Switch
            checked={!!v.withdrawalAllowed}
            onChange={(c) => set({ ...v, withdrawalAllowed: c })}
            label="Відмова від товару («передумав»)"
            description="Покупець може повернути належний товар у визначений строк."
          />
          <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Строк відмови, днів після отримання" error={show ? wErr : ""}>
              <Input
                type="number"
                inputMode="numeric"
                min="0"
                disabled={!v.withdrawalAllowed}
                value={v.withdrawalDays}
                onChange={(e) => set({ ...v, withdrawalDays: e.target.value })}
              />
            </Field>
            <Field label="Хто платить зворотну доставку">
              <Select
                options={PAYER_OPTIONS}
                disabled={!v.withdrawalAllowed}
                value={v.shippingPayerWithdrawal}
                onChange={(e) => set({ ...v, shippingPayerWithdrawal: e.target.value })}
              />
            </Field>
          </div>
        </div>
        <div className="space-y-3 border-t border-(--line) pt-4">
          <Switch
            checked={!!v.defectAllowed}
            onChange={(c) => set({ ...v, defectAllowed: c })}
            label="Повернення браку / невідповідного товару"
          />
          <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Строк заяви про брак, днів після отримання" error={show ? dErr : ""}>
              <Input
                type="number"
                inputMode="numeric"
                min="0"
                disabled={!v.defectAllowed}
                value={v.defectDays}
                onChange={(e) => set({ ...v, defectDays: e.target.value })}
              />
            </Field>
            <Field label="Хто платить зворотну доставку (брак)">
              <Select
                options={PAYER_OPTIONS}
                disabled={!v.defectAllowed}
                value={v.shippingPayerDefect}
                onChange={(e) => set({ ...v, shippingPayerDefect: e.target.value })}
              />
            </Field>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

const blockHasErr = (v) => (v.withdrawalAllowed && !!daysErr(v.withdrawalDays)) || (v.defectAllowed && !!daysErr(v.defectDays));

// Умови повернення — повністю під контролем адміна
const ReturnsSettings = () => {
  const dispatch = useDispatch();
  const { categories } = useSelector((s) => s.category);
  const [p, setP] = useState(null);
  const [initial, setInitial] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [busy, setBusy] = useState(false);
  const [touched, setTouched] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    dispatch(get_category({ perPage: 1000, page: 1, searchValue: "" }));
    api
      .get("/admin/settings/returns")
      .then(({ data }) => {
        setP(data.policy);
        setInitial(data.policy);
        setWarnings(data.warnings || []);
      })
      .catch((e) => {
        const msg = e.response?.data?.error || "Не вдалося завантажити умови";
        setLoadError(msg);
        toast.error(msg);
      });
  }, [dispatch]);

  const dirty = !!p && !!initial && JSON.stringify(p) !== JSON.stringify(initial);
  useUnsavedChanges(dirty);

  const header = (
    <PageHeader
      title="Умови повернення"
      description="Правила відмови від товару, повернення браку та відображення заявок покупцям."
      breadcrumbs={[{ label: "Огляд", to: "/admin/dashboard" }, { label: "Повернення", to: "/admin/dashboard/returns" }, { label: "Умови" }]}
      actions={
        <Button variant="secondary" as={Link} to="/admin/dashboard/returns" icon={<MdArrowBack />}>
          До заявок
        </Button>
      }
    />
  );

  if (!p) {
    return (
      <div>
        {header}
        {loadError ? (
          <EmptyState icon={<MdWarningAmber />} title="Не вдалося завантажити умови" text={loadError} action={<Button onClick={() => window.location.reload()}>Оновити сторінку</Button>} />
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton height={180} rounded="lg" />
            <Skeleton height={180} rounded="lg" />
            <Skeleton height={260} rounded="lg" className="md:col-span-2" />
          </div>
        )}
      </div>
    );
  }

  const refundErr = daysErr(p.refundDeadlineDays, { min: 1, max: 90 });
  const hasErrors = !!refundErr || blockHasErr(p.individual) || blockHasErr(p.company);
  const show = touched || dirty;

  const save = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (hasErrors) {
      toast.error("Перевірте виділені поля");
      return;
    }
    setBusy(true);
    try {
      const { data } = await api.put("/admin/settings/returns", p);
      setP(data.policy);
      setInitial(data.policy);
      setWarnings(data.warnings || []);
      setTouched(false);
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
    <form onSubmit={save} noValidate>
      {header}

      <div className="space-y-6">
        {warnings.length > 0 && (
          <div role="status" className="flex min-w-0 gap-3 rounded-(--r-lg) border border-(--warning) bg-(--surface) p-4 text-sm text-(--ink)">
            <MdWarningAmber className="mt-0.5 shrink-0 text-xl text-(--warning-ink)" aria-hidden="true" />
            <div className="min-w-0">
              <p className="font-semibold">Зверніть увагу (не блокує збереження):</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-(--ink-2)">
                {warnings.map((w, i) => (
                  <li key={i} className="break-words">
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <Card>
          <CardHeader title="Загальні" icon={<MdSettings />} />
          <CardBody className="grid min-w-0 grid-cols-1 gap-5 md:grid-cols-2">
            <Switch
              checked={!!p.enabled}
              onChange={(v) => setP({ ...p, enabled: v })}
              label="Приймати заявки на повернення й скасування"
              description="Якщо вимкнути — кнопки «Повернути / Скасувати» зникнуть, нові заявки не приймаються (адмін може створювати їх за покупця; виняток для окремого замовлення — у його деталях)."
            />
            <Switch
              checked={!!p.cabinetVisible}
              onChange={(v) => setP({ ...p, cabinetVisible: v })}
              label="Показувати «Мої повернення» в кабінеті покупця"
              description="Вимкнено — покупець не бачить свої заявки й сторінку «Мої повернення». Окрему заявку можна приховати в її деталях."
            />
            <Field label="Строк повернення коштів, днів" required error={show ? refundErr : ""} hint="Від 1 до 90 днів">
              <Input
                type="number"
                inputMode="numeric"
                min="1"
                max="90"
                value={p.refundDeadlineDays}
                onChange={(e) => setP({ ...p, refundDeadlineDays: e.target.value })}
              />
            </Field>
          </CardBody>
        </Card>

        <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-2">
          <BuyerBlock title="Фізичні особи" icon={<MdPerson />} v={p.individual} set={(v) => setP({ ...p, individual: v })} show={show} />
          <BuyerBlock title="Юридичні особи / ФОП" icon={<MdBusiness />} v={p.company} set={(v) => setP({ ...p, company: v })} show={show} />
        </div>

        <Card>
          <CardHeader title="Адреса, контакти й текст умов" icon={<MdDescription />} />
          <CardBody className="space-y-4">
            <Field label="Адреса для повернення товарів">
              <Textarea
                rows={3}
                value={p.returnAddress}
                onChange={(e) => setP({ ...p, returnAddress: e.target.value })}
                placeholder="Місто, відділення Нової пошти, отримувач, телефон"
              />
            </Field>
            <Field label="Контакти для питань щодо повернення">
              <Textarea rows={2} value={p.contactInfo} onChange={(e) => setP({ ...p, contactInfo: e.target.value })} />
            </Field>
            <Field label="Текст умов" hint="Відображається на сторінці «Обмін та повернення». Рекомендуємо показати текст юристу перед запуском.">
              <Textarea rows={10} value={p.policyText} onChange={(e) => setP({ ...p, policyText: e.target.value })} />
            </Field>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Категорії без відмови («передумав»)"
            icon={<MdCategory />}
            description={`Повернення за браком діє завжди. Для фізосіб закон містить власний перелік винятків — звіряйтеся з ним.${
              p.nonReturnableCategories.length ? ` Обрано: ${p.nonReturnableCategories.length}.` : ""
            }`}
          />
          <CardBody>
            {(categories || []).length === 0 ? (
              <EmptyState compact icon={<MdCategory />} title="Категорій ще немає" />
            ) : (
              <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {(categories || []).map((c) => (
                  <Checkbox
                    key={c._id}
                    label={c.name}
                    checked={p.nonReturnableCategories.includes(c.name)}
                    onChange={() => toggleCat(c.name)}
                  />
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <StickyActions dirty={dirty}>
        <Button
          variant="ghost"
          icon={<MdUndo />}
          disabled={!dirty || busy}
          onClick={() => {
            setP(initial);
            setTouched(false);
          }}
        >
          Скасувати
        </Button>
        <Button type="submit" icon={<MdSave />} loading={busy}>
          Зберегти умови
        </Button>
      </StickyActions>
    </form>
  );
};

export default ReturnsSettings;
