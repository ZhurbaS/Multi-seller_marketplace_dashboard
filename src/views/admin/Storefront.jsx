import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { MdDashboard, MdImage, MdStorefront } from "react-icons/md";
import api from "../../api/api";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Field,
  Input,
  PageHeader,
  Skeleton,
  StatusChip,
  StickyActions,
  cx,
  useUnsavedChanges,
} from "../../ui";

const MODES = [
  ["auto", "Автоматично", "Компактна головна, поки товарів менше за поріг; коли асортимент виросте — повна."],
  ["compact", "Компактний (мало товарів)", "Головна без порожніх блоків: один список товарів, менше секцій і каруселей."],
  ["full", "Повний", "Усі блоки головної: новинки, рейтинг, знижки, каруселі категорій."],
];
const LINK_MODES = [
  ["auto", "Автоматично", "Показувати, якщо є хоча б один магазин з увімкненим «Показувати на сайті»"],
  ["on", "Завжди", ""],
  ["off", "Ніколи", ""],
];
const IMG = /^(https?:\/\/|\/(?!\/))\S+$/i;

// Локальний розрахунок (дзеркало back/utiles/storefront.js) — щоб результат оновлювався до збереження
const calcCompact = (sf, productCount) =>
  sf.mode === "compact" || (sf.mode === "auto" && productCount < (Number(sf.autoThreshold) || 24));
const calcLink = (sf, storesCount) => sf.showStoresLink === "on" || (sf.showStoresLink === "auto" && storesCount > 0);

const thresholdError = (v) => {
  const t = Number(v);
  return !Number.isInteger(t) || t < 4 || t > 200 ? "Ціле число від 4 до 200" : "";
};
const urlError = (v) => {
  const u = String(v || "").trim();
  return u && !IMG.test(u) ? "Посилання https://… або шлях /…" : "";
};

// Радіо-картка (вибір режиму)
const RadioCard = ({ name, value, current, onChange, label, hint }) => {
  const on = current === value;
  return (
    <label
      className={cx(
        "flex min-h-11 cursor-pointer items-start gap-3 rounded-(--r-md) border p-3 text-sm transition-colors",
        on ? "border-(--brand) bg-(--brand-soft)" : "border-(--line) bg-(--surface) hover:bg-(--surface-2)",
      )}
    >
      <input
        type="radio"
        className="mt-0.5 h-5 w-5 shrink-0 accent-(--brand)"
        name={name}
        value={value}
        checked={on}
        onChange={() => onChange(value)}
      />
      <span className="min-w-0">
        <span className="block font-medium text-(--ink)">{label}</span>
        {hint && <span className="block text-xs text-(--ink-2)">{hint}</span>}
      </span>
    </label>
  );
};

const Storefront = () => {
  const [sf, setSf] = useState(null);
  const [saved, setSaved] = useState(null);
  const [counts, setCounts] = useState({ productCount: 0, storesCount: 0 });
  const [busy, setBusy] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [loadError, setLoadError] = useState("");

  const apply = (data) => {
    const next = { ...data.storefront, autoThreshold: String(data.storefront.autoThreshold) };
    setSf(next);
    setSaved(next);
    setCounts({ productCount: data.productCount, storesCount: data.storesCount ?? 0 });
  };

  const load = () => {
    setLoadError("");
    api
      .get("/admin/settings/storefront")
      .then(({ data }) => apply(data))
      .catch((e) => {
        const msg = e.response?.data?.error || "Не вдалося завантажити налаштування";
        setLoadError(msg);
        toast.error(msg);
      });
  };
  useEffect(load, []);

  const dirty = !!sf && JSON.stringify(sf) !== JSON.stringify(saved);
  useUnsavedChanges(dirty);

  const header = (
    <PageHeader
      title="Вітрина"
      description="Як виглядає головна сторінка та меню сайту для покупців."
      breadcrumbs={[{ label: "Налаштування сайту" }, { label: "Вітрина" }]}
      className="mb-0 sm:mb-0"
    />
  );

  if (!sf)
    return (
      <div className="flex min-w-0 flex-col gap-4">
        {header}
        {loadError ? (
          <Card padded className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-(--danger)">{loadError}</span>
            <Button variant="secondary" onClick={load}>
              Спробувати ще раз
            </Button>
          </Card>
        ) : (
          <div className="flex max-w-[900px] flex-col gap-4" aria-busy="true">
            <Skeleton height={220} rounded="lg" />
            <Skeleton height={260} rounded="lg" />
          </div>
        )}
      </div>
    );

  const set = (k) => (v) => setSf({ ...sf, [k]: v });
  const tErr = sf.mode === "auto" ? thresholdError(sf.autoThreshold) : "";
  const uErr = urlError(sf.catalogBgUrl);

  const save = async (e) => {
    e.preventDefault();
    const t = Number(sf.autoThreshold);
    if (!Number.isInteger(t) || t < 4 || t > 200) return toast.error("Поріг: ціле число від 4 до 200");
    const url = sf.catalogBgUrl.trim();
    if (url && !IMG.test(url)) return toast.error("Фонове зображення: посилання https://… або шлях /…");
    setBusy(true);
    try {
      const { data } = await api.put("/admin/settings/storefront", { ...sf, autoThreshold: t, catalogBgUrl: url });
      apply(data);
      toast.success(data.message);
    } catch (err) {
      toast.error(err.response?.data?.error || "Не вдалося зберегти");
    } finally {
      setBusy(false);
    }
  };

  const compact = calcCompact(sf, counts.productCount);
  const showLink = calcLink(sf, counts.storesCount);
  const bg = sf.catalogBgUrl.trim();

  return (
    <form onSubmit={save} noValidate className="flex min-w-0 flex-col gap-4">
      {header}
      <div className="flex max-w-[900px] flex-col gap-4">
        <Card>
          <CardHeader
            icon={<MdDashboard />}
            title="Режим головної"
            description="Коли товарів небагато, повна головна виглядає порожньою (однакові товари повторюються в кількох блоках). Компактний режим показує їх один раз, без зайвих секцій."
          />
          <CardBody className="flex flex-col gap-4">
            <fieldset className="grid gap-2 sm:grid-cols-3">
              <legend className="sr-only">Режим головної</legend>
              {MODES.map(([v, label, hint]) => (
                <RadioCard key={v} name="mode" value={v} current={sf.mode} onChange={set("mode")} label={label} hint={hint} />
              ))}
            </fieldset>
            <div className="flex flex-col gap-2 rounded-(--r-md) bg-(--surface-2) p-3 text-sm sm:flex-row sm:items-center sm:gap-4">
              <span>
                Товарів на сайті: <b className="tabular-nums">{counts.productCount}</b>
              </span>
              <span className="inline-flex flex-wrap items-center gap-2">
                Зараз діє:
                <StatusChip tone={compact ? "warning" : "success"}>{compact ? "Компактний" : "Повний"}</StatusChip>
                {sf.mode === "auto" && <span className="text-(--ink-2)">(автоматично)</span>}
              </span>
            </div>
            <Field
              label="Поріг автоперемикання (товарів)"
              hint="За замовчуванням 24. У режимі «Автоматично»: менше — компактна, стільки або більше — повна."
              error={tErr}
              className="max-w-[320px]"
            >
              <Input
                type="number"
                inputMode="numeric"
                min="4"
                max="200"
                step="1"
                value={sf.autoThreshold}
                invalid={!!tErr}
                onChange={(e) => set("autoThreshold")(e.target.value)}
                disabled={sf.mode !== "auto"}
              />
            </Field>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            icon={<MdImage />}
            title="Фонове зображення меню «Каталог»"
            description="Обирайте спокійне світле або темне зображення без дрібних деталей — поверх нього відображаються назви категорій."
          />
          <CardBody className="grid gap-4 md:grid-cols-[1fr_minmax(0,320px)]">
            <Field
              label="Посилання на зображення"
              hint="Рекомендовано 1200×600 px, WebP або JPG до 200 КБ. Порожнє поле — стандартний візерунок."
              error={uErr}
            >
              <Input
                value={sf.catalogBgUrl}
                maxLength={500}
                inputMode="url"
                invalid={!!uErr}
                onChange={(e) => {
                  setImgError(false);
                  set("catalogBgUrl")(e.target.value);
                }}
                placeholder="https://…/catalog-bg.webp або /images/catalog-bg.webp"
              />
            </Field>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-(--ink)">Прев'ю</span>
              {bg && IMG.test(bg) ? (
                imgError ? (
                  <div
                    role="alert"
                    className="flex aspect-[2/1] w-full items-center justify-center rounded-(--r-md) border border-dashed border-(--danger) bg-(--danger-soft) p-3 text-center text-xs text-(--danger)"
                  >
                    Не вдалося завантажити зображення за цим посиланням.
                  </div>
                ) : (
                  <img
                    src={bg}
                    alt="Прев'ю фону каталогу"
                    onError={() => setImgError(true)}
                    className="aspect-[2/1] w-full rounded-(--r-md) border border-(--line) object-cover"
                  />
                )
              ) : (
                <div
                  className="flex aspect-[2/1] w-full items-center justify-center rounded-(--r-md) border border-dashed border-(--line-strong) bg-(--surface-2) text-xs text-(--ink-2)"
                  style={{ backgroundImage: "repeating-linear-gradient(45deg, var(--line) 0 2px, transparent 2px 14px)" }}
                >
                  Стандартний візерунок
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader icon={<MdStorefront />} title="Посилання «Магазини» у шапці" />
          <CardBody className="flex flex-col gap-4">
            <fieldset className="grid gap-2 sm:grid-cols-3">
              <legend className="sr-only">Посилання «Магазини» у шапці</legend>
              {LINK_MODES.map(([v, label, hint]) => (
                <RadioCard
                  key={v}
                  name="showStoresLink"
                  value={v}
                  current={sf.showStoresLink}
                  onChange={set("showStoresLink")}
                  label={label}
                  hint={hint}
                />
              ))}
            </fieldset>
            <div className="flex flex-wrap items-center gap-2 rounded-(--r-md) bg-(--surface-2) p-3 text-sm">
              Активних магазинів: <b className="tabular-nums">{counts.storesCount}</b> · Посилання зараз:
              <StatusChip tone={showLink ? "success" : "neutral"}>{showLink ? "показується" : "приховане"}</StatusChip>
            </div>
          </CardBody>
        </Card>
      </div>

      <StickyActions dirty={dirty}>
        <Button
          variant="ghost"
          disabled={!dirty || busy}
          onClick={() => {
            setSf(saved);
            setImgError(false);
          }}
        >
          Скасувати зміни
        </Button>
        <Button type="submit" loading={busy} disabled={busy || !!tErr || !!uErr}>
          Зберегти
        </Button>
      </StickyActions>
    </form>
  );
};

export default Storefront;
