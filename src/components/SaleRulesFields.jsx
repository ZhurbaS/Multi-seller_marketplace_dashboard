import { MdAdd, MdDeleteOutline } from "react-icons/md";
import { Button, Checkbox, Field, IconButton, Input } from "../ui";

// Хелпери (defaultRules, rulesFromProduct, rulesToPayload, appendRulesToFormData, validateRules) — у ./saleRules.js

// Умови продажу товару: упаковки/комплекти (мін. замовлення і крок), знижки за кількість,
// терміни поставки й передзамовлення. Використовується у формах додавання й редагування.

/**
 * Поля «Умови продажу». rules/onChange — як раніше; errors — результат validateRules (показується інлайн).
 */
const SaleRulesFields = ({ rules, onChange, errors = {}, disabled = false }) => {
  const set = (patch) => onChange({ ...rules, ...patch });

  const setTier = (i, field, value) => {
    const tiers = rules.priceTiers.map((t, idx) => (idx === i ? { ...t, [field]: value } : t));
    set({ priceTiers: tiers });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <p className="text-sm text-(--ink-2)">
          Ціна й кількість на складі — за 1 шт. Для упаковок і комплектів задайте мінімальне замовлення й крок:
          наприклад, «мін. 100, крок 100» — покупець зможе замовити лише 100, 200, 300 шт.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Мінімальне замовлення, шт" error={errors.minOrderQty}>
            <Input
              type="number"
              inputMode="numeric"
              min="1"
              step="1"
              disabled={disabled}
              value={rules.minOrderQty}
              onChange={(e) => set({ minOrderQty: e.target.value })}
            />
          </Field>
          <Field label="Крок (кратність), шт" error={errors.orderStep}>
            <Input
              type="number"
              inputMode="numeric"
              min="1"
              step="1"
              disabled={disabled}
              value={rules.orderStep}
              onChange={(e) => set({ orderStep: e.target.value })}
            />
          </Field>
          <Field label="Підпис для покупця" hint={`Необов'язково · ${rules.packLabel.length} / 60`}>
            <Input
              type="text"
              maxLength={60}
              autoComplete="off"
              disabled={disabled}
              placeholder="Упаковка по 100 шт"
              value={rules.packLabel}
              onChange={(e) => set({ packLabel: e.target.value })}
            />
          </Field>
        </div>
      </div>

      <fieldset className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <legend className="text-sm font-semibold text-(--ink)">Знижки за кількість</legend>
          <Button
            size="sm"
            variant="secondary"
            icon={<MdAdd />}
            disabled={disabled}
            onClick={() => set({ priceTiers: [...rules.priceTiers, { minQty: "", percent: "" }] })}
          >
            Додати поріг
          </Button>
        </div>
        {rules.priceTiers.length === 0 && (
          <p className="rounded-(--r-md) border border-dashed border-(--line) bg-(--surface-2) px-3 py-2.5 text-sm text-(--ink-2)">
            Без знижок за кількість. Приклад: від 10 шт — 5 %, від 50 шт — 10 %.
          </p>
        )}
        {rules.priceTiers.map((t, i) => (
          <div key={i} className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-start gap-3">
            <Field label={`Від, шт`} error={errors[`tier${i}minQty`]}>
              <Input
                type="number"
                inputMode="numeric"
                min="2"
                placeholder="10"
                disabled={disabled}
                value={t.minQty}
                onChange={(e) => setTier(i, "minQty", e.target.value)}
              />
            </Field>
            <Field label="Знижка, %" error={errors[`tier${i}percent`]}>
              <Input
                type="number"
                inputMode="decimal"
                min="1"
                max="90"
                placeholder="5"
                disabled={disabled}
                value={t.percent}
                onChange={(e) => setTier(i, "percent", e.target.value)}
              />
            </Field>
            <IconButton
              icon={<MdDeleteOutline />}
              label={`Видалити поріг ${i + 1}`}
              disabled={disabled}
              className="mt-7 text-(--danger)"
              onClick={() => set({ priceTiers: rules.priceTiers.filter((_, idx) => idx !== i) })}
            />
          </div>
        ))}
        {rules.priceTiers.length > 0 && (
          <p className="text-xs text-(--ink-2)">
            Знижка додається до знижки самого товару. Відсоток має зростати разом з кількістю.
          </p>
        )}
      </fieldset>

      <fieldset className="flex min-w-0 flex-col gap-3">
        <legend className="text-sm font-semibold text-(--ink)">Коли товару немає в наявності</legend>
        <p className="text-sm text-(--ink-2)">Покупець побачить «Очікується через …» і зможе підписатися на сповіщення.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Термін поставки: від, днів" error={errors.restockDaysMin}>
            <Input
              type="number"
              inputMode="numeric"
              min="1"
              max="365"
              placeholder="20"
              disabled={disabled}
              value={rules.restockDaysMin}
              onChange={(e) => set({ restockDaysMin: e.target.value })}
            />
          </Field>
          <Field label="до, днів" error={errors.restockDaysMax}>
            <Input
              type="number"
              inputMode="numeric"
              min="1"
              max="365"
              placeholder="30"
              disabled={disabled}
              value={rules.restockDaysMax}
              onChange={(e) => set({ restockDaysMax: e.target.value })}
            />
          </Field>
        </div>
        <Checkbox
          label="Приймати передзамовлення, поки товару немає"
          checked={rules.allowPreorder}
          disabled={disabled}
          onChange={(e) => set({ allowPreorder: e.target.checked })}
        />
      </fieldset>
    </div>
  );
};

export default SaleRulesFields;
