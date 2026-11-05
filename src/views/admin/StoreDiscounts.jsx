import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { MdAdd, MdDeleteOutline, MdLocalOffer, MdWarningAmber } from "react-icons/md";
import {
  get_discounts,
  get_commission,
  update_discounts,
  messageClear,
} from "../../store/Reducers/settingsSlice";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Field,
  IconButton,
  Input,
  PageHeader,
  Skeleton,
  StickyActions,
  useUnsavedChanges,
} from "../../ui";

const toForm = (list) => (list || []).map((t) => ({ minTotal: String(t.minTotal), percent: String(t.percent) }));
const sig = (list) => JSON.stringify(list.filter((t) => t.minTotal !== "" || t.percent !== ""));

// Інлайн-валідація рядка порогу
const tierErrors = (tiers) =>
  tiers.map((t, i) => {
    const e = {};
    if (t.minTotal === "" && t.percent === "") return e;
    const m = Number(t.minTotal);
    const p = Number(t.percent);
    if (t.minTotal === "" || !Number.isFinite(m) || m < 1) e.minTotal = "Сума від 1 ₴";
    else if (tiers.some((o, j) => j < i && o.minTotal !== "" && Number(o.minTotal) === m)) e.minTotal = "Такий поріг уже є";
    if (t.percent === "" || !Number.isFinite(p) || p < 1 || p > 50) e.percent = "Від 1 до 50 %";
    return e;
  });

// Знижки за сумою замовлення для всього магазину.
// Покупець бачить у кошику: «Додайте ще на ₴X і отримайте знижку Y%».
// Знижку фінансує магазин: продавцям нараховується повна сума їхніх товарів.
const StoreDiscounts = () => {
  const dispatch = useDispatch();
  const { orderDiscountTiers, commission, loader, successMessage, errorMessage } =
    useSelector((state) => state.settings);
  const [tiers, setTiers] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    Promise.resolve(dispatch(get_discounts())).finally(() => setLoaded(true));
    dispatch(get_commission());
  }, [dispatch]);

  // Знижку фінансує магазин із комісії: якщо вона більша за типову комісію, замовлення буде збитковим.
  const defaultCommission = commission?.defaultCommissionPercent;
  const tooHigh =
    typeof defaultCommission === "number" &&
    tiers.some((t) => Number(t.percent) > defaultCommission);

  useEffect(() => {
    setTiers(toForm(orderDiscountTiers));
  }, [orderDiscountTiers]);

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(messageClear());
      setTouched(false);
    }
    if (errorMessage) {
      toast.error(errorMessage);
      dispatch(messageClear());
    }
  }, [successMessage, errorMessage, dispatch]);

  const errors = useMemo(() => tierErrors(tiers), [tiers]);
  const hasErrors = errors.some((e) => e.minTotal || e.percent);
  const dirty = sig(tiers) !== sig(toForm(orderDiscountTiers));
  useUnsavedChanges(dirty);

  const setTier = (i, field, value) =>
    setTiers(tiers.map((t, idx) => (idx === i ? { ...t, [field]: value } : t)));

  const save = (e) => {
    e.preventDefault();
    setTouched(true);
    if (hasErrors) {
      toast.error("Виправте помилки у порогах");
      return;
    }
    dispatch(
      update_discounts(
        tiers.filter((t) => t.minTotal !== "" || t.percent !== "")
      )
    );
  };

  const addTier = () => setTiers([...tiers, { minTotal: "", percent: "" }]);

  return (
    <form onSubmit={save} noValidate className="flex min-w-0 flex-col gap-4">
      <PageHeader
        title="Знижки за сумою замовлення"
        description="Діють на весь магазин і застосовуються автоматично до суми товарів (без доставки). Знижки за кількість окремого товару продавець задає у картці товару."
        breadcrumbs={[{ label: "Налаштування сайту" }, { label: "Знижки" }]}
        className="mb-0 sm:mb-0"
      />

      <Card className="max-w-[760px]">
        <CardHeader
          icon={<MdLocalOffer />}
          title="Пороги знижок"
          description="Знижка фінансується магазином — продавцям нараховується повна сума їхніх товарів. Покупець бачить у кошику: «Додайте ще на ₴X і отримайте знижку Y%»."
        />
        <CardBody className="flex flex-col gap-3">
          {!loaded ? (
            <div className="flex flex-col gap-2">
              <Skeleton height={44} />
              <Skeleton height={44} />
            </div>
          ) : tiers.length === 0 ? (
            <EmptyState
              compact
              icon={<MdLocalOffer />}
              title="Знижок за сумою немає"
              text="Приклад: від ₴5000 — 3%, від ₴10000 — 5%."
              action={
                <Button variant="secondary" icon={<MdAdd />} onClick={addTier}>
                  Додати поріг
                </Button>
              }
            />
          ) : (
            <ul className="flex flex-col gap-3">
              {tiers.map((t, i) => {
                const er = touched || (t.minTotal !== "" && t.percent !== "") ? errors[i] : {};
                return (
                  <li
                    key={i}
                    className="grid grid-cols-[1fr_1fr_auto] items-start gap-3 rounded-(--r-md) border border-(--line) bg-(--surface-2) p-3"
                  >
                    <Field label="Сума замовлення від, ₴" error={er.minTotal}>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min="1"
                        placeholder="5000"
                        value={t.minTotal}
                        invalid={!!er.minTotal}
                        onChange={(e) => setTier(i, "minTotal", e.target.value)}
                      />
                    </Field>
                    <Field label="Знижка, %" error={er.percent}>
                      <Input
                        type="number"
                        inputMode="decimal"
                        min="1"
                        max="50"
                        placeholder="3"
                        value={t.percent}
                        invalid={!!er.percent}
                        onChange={(e) => setTier(i, "percent", e.target.value)}
                      />
                    </Field>
                    <IconButton
                      className="mt-7"
                      icon={<MdDeleteOutline />}
                      label={`Видалити поріг ${i + 1}`}
                      onClick={() => setTiers(tiers.filter((_, idx) => idx !== i))}
                    />
                  </li>
                );
              })}
            </ul>
          )}

          {tooHigh && (
            <p role="status" className="flex items-start gap-2 rounded-(--r-md) border-l-4 border-(--warning) bg-(--warning-soft) p-3 text-sm text-(--ink)">
              <MdWarningAmber aria-hidden="true" className="mt-0.5 shrink-0 text-lg text-(--warning-ink)" />
              <span>
                Увага: знижка більша за типову комісію ({defaultCommission}%) — на
                замовленнях зі сторонніх продавців магазин піде в мінус.
              </span>
            </p>
          )}

          {tiers.length > 0 && (
            <Button variant="secondary" icon={<MdAdd />} onClick={addTier} className="self-start">
              Додати поріг
            </Button>
          )}
        </CardBody>
      </Card>

      <StickyActions dirty={dirty}>
        <Button
          variant="ghost"
          disabled={!dirty || loader}
          onClick={() => {
            setTiers(toForm(orderDiscountTiers));
            setTouched(false);
          }}
        >
          Скасувати зміни
        </Button>
        <Button type="submit" loading={loader} disabled={loader}>
          Зберегти
        </Button>
      </StickyActions>
    </form>
  );
};

export default StoreDiscounts;
