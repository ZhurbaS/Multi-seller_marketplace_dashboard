import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { MdCategory, MdPercent, MdSave, MdUndo } from "react-icons/md";
import { get_commission, update_commission, messageClear } from "../../store/Reducers/settingsSlice";
import { get_category } from "../../store/Reducers/categorySlice";
import {
  PageHeader,
  Card,
  CardHeader,
  CardBody,
  Field,
  Input,
  Button,
  EmptyState,
  Skeleton,
  FilterBar,
  StickyActions,
  useUnsavedChanges,
} from "../../ui";

// Комісія магазину і правила виплат продавцям.
// Комісія береться з ціни товару на сайті (покупець бачить одну ціну).
// Порядок: індивідуальна ставка продавця (0% — власний магазин) → ставка категорії → типова.

const pctError = (v, { required = false } = {}) => {
  if (v === "" || v === null || v === undefined) return required ? "Вкажіть значення" : "";
  const n = Number(String(v).replace(",", "."));
  if (!Number.isFinite(n)) return "Введіть число";
  if (n < 0 || n > 50) return "Від 0 до 50 %";
  return "";
};
const daysError = (v) => {
  if (v === "") return "Вкажіть кількість днів";
  const n = Number(v);
  if (!Number.isInteger(n)) return "Ціле число днів";
  if (n < 0 || n > 90) return "Від 0 до 90 днів";
  return "";
};

const fromCommission = (commission) => {
  if (!commission) return null;
  const r = {};
  for (const c of commission.categoryCommissions || []) r[String(c.categoryId)] = String(c.percent);
  return {
    defaultPercent: String(commission.defaultCommissionPercent ?? "10"),
    holdDays: String(commission.payoutHoldDays ?? "14"),
    rates: r,
  };
};

const Commission = () => {
  const dispatch = useDispatch();
  const { commission, loader, successMessage, errorMessage } = useSelector((state) => state.settings);
  const { categories } = useSelector((state) => state.category);

  const [defaultPercent, setDefaultPercent] = useState("10");
  const [holdDays, setHoldDays] = useState("14");
  const [rates, setRates] = useState({}); // categoryId -> "7"
  const [initial, setInitial] = useState(null);
  const [touched, setTouched] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    dispatch(get_commission());
    dispatch(get_category({ perPage: 1000, page: 1, searchValue: "" }));
  }, [dispatch]);

  useEffect(() => {
    const st = fromCommission(commission);
    if (!st) return;
    setDefaultPercent(st.defaultPercent);
    setHoldDays(st.holdDays);
    setRates(st.rates);
    setInitial(st);
  }, [commission]);

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(messageClear());
    }
    if (errorMessage) {
      toast.error(errorMessage);
      dispatch(messageClear());
    }
  }, [successMessage, errorMessage, dispatch]);

  const cleanRates = (r) =>
    Object.entries(r)
      .filter(([, p]) => p !== "")
      .sort(([a], [b]) => a.localeCompare(b));
  const dirty = useMemo(() => {
    if (!initial) return false;
    return (
      initial.defaultPercent !== defaultPercent ||
      initial.holdDays !== holdDays ||
      JSON.stringify(cleanRates(initial.rates)) !== JSON.stringify(cleanRates(rates))
    );
  }, [initial, defaultPercent, holdDays, rates]);
  useUnsavedChanges(dirty);

  const errors = {
    defaultPercent: pctError(defaultPercent, { required: true }),
    holdDays: daysError(holdDays),
  };
  const rateErrors = Object.fromEntries(Object.entries(rates).map(([k, v]) => [k, pctError(v)]));
  const hasErrors = !!errors.defaultPercent || !!errors.holdDays || Object.values(rateErrors).some(Boolean);

  const save = (e) => {
    e.preventDefault();
    setTouched(true);
    if (hasErrors) {
      toast.error("Перевірте виділені поля");
      return;
    }
    dispatch(
      update_commission({
        defaultCommissionPercent: defaultPercent,
        payoutHoldDays: holdDays,
        categoryCommissions: Object.entries(rates)
          .filter(([, p]) => p !== "")
          .map(([categoryId, percent]) => ({ categoryId, percent })),
      }),
    );
  };

  const reset = () => {
    if (!initial) return;
    setDefaultPercent(initial.defaultPercent);
    setHoldDays(initial.holdDays);
    setRates(initial.rates);
    setTouched(false);
  };

  const list = (categories || []).filter((c) => !q || String(c.name || "").toLowerCase().includes(q.toLowerCase()));
  const customCount = cleanRates(rates).length;
  const showErr = (k) => (touched || dirty ? errors[k] : "");

  return (
    <form onSubmit={save} noValidate>
      <PageHeader
        title="Комісії і виплати"
        description="Комісія — відсоток від суми товарів продавця, який лишається магазину. Покупець бачить одну ціну. Зміна ставки діє лише для нових замовлень."
        breadcrumbs={[{ label: "Огляд", to: "/admin/dashboard" }, { label: "Комісії" }]}
      />

      <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <Card>
          <CardHeader title="Типові правила" icon={<MdPercent />} description="Діють, якщо для категорії чи продавця не задано іншої ставки." />
          <CardBody className="space-y-4">
            {!initial ? (
              <>
                <Skeleton height={44} />
                <Skeleton height={44} />
              </>
            ) : (
              <>
                <Field label="Типова комісія, %" required error={showErr("defaultPercent")} hint="Від 0 до 50 %, крок 0,5">
                  <Input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    max="50"
                    step="0.5"
                    value={defaultPercent}
                    onChange={(e) => setDefaultPercent(e.target.value)}
                    rightSlot={<span className="text-(--ink-2)">%</span>}
                  />
                </Field>
                <Field
                  label="Утримання виплат після доставки, днів"
                  required
                  error={showErr("holdDays")}
                  hint="Кошти продавця стають доступними через цю кількість днів після статусу «Доставлено» (термін повернення). 0 — одразу."
                >
                  <Input type="number" inputMode="numeric" min="0" max="90" step="1" value={holdDays} onChange={(e) => setHoldDays(e.target.value)} />
                </Field>
                <p className="rounded-(--r-md) bg-(--surface-2) p-3 text-sm text-(--ink-2)">
                  Порядок застосування: індивідуальна ставка продавця (0 % — власний магазин, задається в картці продавця) → ставка категорії → типова.
                </p>
              </>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Комісія за категоріями"
            icon={<MdCategory />}
            description={`Порожньо — діє типова комісія.${customCount ? ` Власна ставка: ${customCount}.` : ""}`}
          />
          <CardBody className="space-y-3">
            {(categories || []).length > 8 && (
              <FilterBar search={{ value: q, onChange: setQ, placeholder: "Пошук категорії" }} />
            )}
            {!initial && !(categories || []).length ? (
              <Skeleton lines={4} />
            ) : list.length === 0 ? (
              <EmptyState
                compact
                icon={<MdCategory />}
                title={q ? "Нічого не знайдено" : "Категорій ще немає"}
                text={q ? "Спробуйте інший запит." : "Створіть категорії в розділі «Категорії»."}
              />
            ) : (
              <ul className="divide-y divide-(--line)">
                {list.map((c) => {
                  const err = rateErrors[c._id];
                  return (
                    <li key={c._id} className="flex min-w-0 flex-col gap-1 py-2.5 sm:flex-row sm:items-start sm:gap-4">
                      <label htmlFor={`rate-${c._id}`} className="min-w-0 flex-1 truncate pt-2.5 text-sm font-medium text-(--ink)">
                        {c.name}
                      </label>
                      <div className="w-full sm:w-44">
                        <Input
                          id={`rate-${c._id}`}
                          type="number"
                          inputMode="decimal"
                          min="0"
                          max="50"
                          step="0.5"
                          invalid={!!err}
                          aria-describedby={err ? `rate-${c._id}-err` : undefined}
                          placeholder={`типова (${defaultPercent || 0})`}
                          value={rates[c._id] ?? ""}
                          onChange={(e) => setRates({ ...rates, [c._id]: e.target.value })}
                          rightSlot={<span className="text-(--ink-2)">%</span>}
                        />
                        {err && (
                          <p id={`rate-${c._id}-err`} className="mt-1 text-xs text-(--danger)">
                            {err}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <StickyActions dirty={dirty}>
        <Button variant="ghost" icon={<MdUndo />} onClick={reset} disabled={!dirty || loader}>
          Скасувати
        </Button>
        <Button type="submit" icon={<MdSave />} loading={loader} disabled={!initial}>
          Зберегти
        </Button>
      </StickyActions>
    </form>
  );
};

export default Commission;
