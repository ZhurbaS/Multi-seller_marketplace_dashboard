import { MdAdd, MdDeleteOutline, MdInventory2, MdListAlt, MdNotes, MdPayments, MdTune } from "react-icons/md";
import { Button, Field, IconButton, Input, Select, Textarea } from "../../ui";
import CommissionHint from "../CommissionHint";
import SaleRulesFields from "../SaleRulesFields";
import { CountHint, FormSection } from "./FormKit";

import {
  BRAND_MAX,
  DESCRIPTION_GOOD,
  DESCRIPTION_MAX,
  NAME_MAX,
  SPEC_KEY_MAX,
  SPEC_VALUE_MAX,
} from "./productFormUtils";

/**
 * Поля форми товару, згруповані в секції-картки.
 * imagesSection — вузол секції зображень (додавання та редагування різні).
 */
export default function ProductFormFields({
  state,
  onField,
  category,
  onCategory,
  categories = [],
  specifications,
  setSpecifications,
  rules,
  setRules,
  errors = {},
  disabled = false,
  imagesSection,
}) {
  const inputHandle = (e) => onField(e.target.name, e.target.value);
  const categoryName = categories.find((c) => c._id === category)?.name;

  const specChange = (index, field, value) => {
    const updated = [...specifications];
    updated[index] = { ...updated[index], [field]: value };
    setSpecifications(updated);
  };
  const addSpecRow = () => setSpecifications([...specifications, { key: "", value: "" }]);
  const removeSpecRow = (index) => {
    const next = specifications.filter((_, i) => i !== index);
    setSpecifications(next.length ? next : [{ key: "", value: "" }]);
  };

  const descLen = state.description.length;

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
      <FormSection title="Основне" description="Назва, бренд і категорія — так покупці знаходять товар." icon={<MdInventory2 />}>
        <Field
          label="Назва товару"
          required
          error={errors.name}
          hint={<CountHint text="Бренд + модель + ключова характеристика, напр. «Ноутбук Lenovo IdeaPad 5 15.6″ 16/512 ГБ»" length={state.name.length} max={NAME_MAX} />}
        >
          <Input
            name="name"
            value={state.name}
            onChange={inputHandle}
            disabled={disabled}
            maxLength={NAME_MAX + 20}
            autoComplete="off"
            placeholder="Назва товару"
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Бренд" required error={errors.brand} hint={<CountHint length={state.brand.length} max={BRAND_MAX} />}>
            <Input
              name="brand"
              value={state.brand}
              onChange={inputHandle}
              disabled={disabled}
              maxLength={BRAND_MAX + 10}
              autoComplete="off"
              placeholder="Напр. Lenovo"
            />
          </Field>
          <Field label="Категорія" required error={errors.category} hint={categories.length ? undefined : "Завантаження категорій…"}>
            <Select
              name="category"
              value={category || ""}
              onChange={(e) => onCategory(e.target.value)}
              disabled={disabled || !categories.length}
              placeholder="Оберіть категорію"
              options={categories.map((c) => ({ value: c._id, label: c.name }))}
            />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Ціна й склад" description="Ціна за 1 шт у гривнях; знижка — у відсотках від ціни." icon={<MdPayments />}>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Ціна, ₴" required error={errors.price}>
            <Input
              name="price"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              value={state.price}
              onChange={inputHandle}
              disabled={disabled}
              placeholder="0"
              rightSlot={<span className="pr-3 text-sm text-(--ink-2)" aria-hidden="true">₴</span>}
            />
          </Field>
          <Field label="Знижка, %" required error={errors.discount} hint="0 — без знижки">
            <Input
              name="discount"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              value={state.discount}
              onChange={inputHandle}
              disabled={disabled}
              placeholder="0"
              rightSlot={<span className="pr-3 text-sm text-(--ink-2)" aria-hidden="true">%</span>}
            />
          </Field>
          <Field label="У наявності, шт" required error={errors.stock} hint="0 — немає в наявності">
            <Input
              name="stock"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              value={state.stock}
              onChange={inputHandle}
              disabled={disabled}
              placeholder="0"
            />
          </Field>
        </div>
        <CommissionHint price={state.price} discount={state.discount} categoryName={categoryName} />
      </FormSection>

      {imagesSection}

      <FormSection title="Опис" description="Розкажіть про переваги, комплектацію та сумісність." icon={<MdNotes />}>
        <Field
          label="Опис товару"
          required
          error={errors.description}
          hint={
            <CountHint
              text={descLen < DESCRIPTION_GOOD ? `Рекомендуємо від ${DESCRIPTION_GOOD} символів — так картка вища в пошуку` : "Чудовий розгорнутий опис"}
              length={descLen}
              max={DESCRIPTION_MAX}
            />
          }
        >
          <Textarea
            name="description"
            rows={8}
            value={state.description}
            onChange={inputHandle}
            disabled={disabled}
            placeholder="Опис"
          />
        </Field>
      </FormSection>

      <FormSection
        title="Характеристики"
        description="Пари «назва — значення», напр. «Екран — 15.6″». Порожні рядки не зберігаються."
        icon={<MdListAlt />}
        actions={
          <Button size="sm" variant="secondary" icon={<MdAdd />} onClick={addSpecRow} disabled={disabled}>
            Додати
          </Button>
        }
      >
        <ul className="flex flex-col gap-3">
          {specifications.map((spec, i) => (
            <li key={i} className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)_auto] sm:gap-3">
              <Field label={i === 0 ? "Назва" : undefined} error={errors[`spec${i}key`]} className="col-span-2 sm:col-span-1">
                <Input
                  aria-label={`Назва характеристики ${i + 1}`}
                  value={spec.key}
                  maxLength={SPEC_KEY_MAX}
                  autoComplete="off"
                  onChange={(e) => specChange(i, "key", e.target.value)}
                  disabled={disabled}
                  placeholder="Напр. Екран"
                />
              </Field>
              <Field label={i === 0 ? "Значення" : undefined} error={errors[`spec${i}value`]}>
                <Input
                  aria-label={`Значення характеристики ${i + 1}`}
                  value={spec.value}
                  maxLength={SPEC_VALUE_MAX}
                  autoComplete="off"
                  onChange={(e) => specChange(i, "value", e.target.value)}
                  disabled={disabled}
                  placeholder="Напр. 15.6″"
                />
              </Field>
              <IconButton
                icon={<MdDeleteOutline />}
                label={`Видалити характеристику ${i + 1}`}
                onClick={() => removeSpecRow(i)}
                disabled={disabled || (specifications.length === 1 && !spec.key && !spec.value)}
                className={i === 0 ? "mt-7 text-(--danger)" : "text-(--danger)"}
              />
            </li>
          ))}
        </ul>
      </FormSection>

      <FormSection title="Умови продажу" description="Мінімальне замовлення, знижки за кількість, передзамовлення." icon={<MdTune />}>
        <SaleRulesFields rules={rules} onChange={setRules} errors={errors} disabled={disabled} />
      </FormSection>
    </div>
  );
}

