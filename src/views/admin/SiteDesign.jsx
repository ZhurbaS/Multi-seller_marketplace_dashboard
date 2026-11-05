import React, { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { MdCheckCircle, MdComputer, MdHistory, MdPalette, MdPhoneIphone, MdRestore, MdVisibility } from "react-icons/md";
import api from "../../api/api";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Segmented,
  Skeleton,
  Spinner,
  StatusChip,
  StickyActions,
  cx,
  formatDate,
  useConfirm,
  useUnsavedChanges,
} from "../../ui";

const HEX = /^#[0-9a-fA-F]{6}$/;

// Редаговані кольори (збігаються з back/utiles/theme.js → EDITABLE)
const FIELDS = [
  ["brand", "Основний колір (бренд)"],
  ["cta", "Кнопка «Купити»"],
  ["sale", "Знижка (бейдж)"],
  ["headerBg", "Фон шапки"],
  ["footerBg", "Фон підвалу"],
];
const KEYS = FIELDS.map(([k]) => k);

// ":root{--a:#fff;--b:#000;}" → { "--a": "#fff", "--b": "#000" } (без вставки CSS у DOM)
const parseCssVars = (css) => {
  const out = {};
  const re = /(--[a-zA-Z0-9-]+)\s*:\s*([^;}]+)/g;
  let m;
  while ((m = re.exec(String(css || "")))) {
    const val = m[2].trim();
    if (/^#[0-9a-fA-F]{3,8}$/.test(val)) out[m[1]] = val;
  }
  return out;
};

const presetColors = (p) => (p ? Object.fromEntries(KEYS.map((k) => [k, p[k]])) : {});

// Нейтральні кольори світлої вітрини (дані, а не стилі дашборду) — щоб прев'ю не залежало від теми адмінки
const SHOP_BASE = {
  "--page": "#f3f5f9",
  "--surface": "#ffffff",
  "--surface-2": "#eef2f7",
  "--line": "#dde3ec",
  "--ink": "#0f172a",
  "--ink-2": "#4a5568",
};

const Swatches = ({ colors }) => (
  <div className="flex gap-1" aria-hidden="true">
    {KEYS.map((k) => (
      <span key={k} className="h-6 w-6 rounded-(--r-sm) border border-(--line-strong)/40" style={{ background: colors?.[k] || "transparent" }} title={k} />
    ))}
  </div>
);

// Міні-вітрина: усі кольори — через CSS-змінні, встановлені на обгортці
const MiniShop = ({ vars, mobile }) => (
  <div
    style={{ ...SHOP_BASE, ...vars }}
    className={cx(
      "overflow-hidden border border-(--line) bg-(--page) text-sm text-(--ink) shadow-(--shadow-1) transition-[max-width]",
      mobile ? "mx-auto w-full max-w-[340px] rounded-[20px] border-4" : "w-full rounded-(--r-md)",
    )}
  >
    <div className="flex items-center justify-between gap-2 px-3 py-2" style={{ background: "var(--header-bg)", color: "var(--on-header)" }}>
      <span className="font-bold">TechScout</span>
      {!mobile && (
        <span className="hidden gap-3 sm:flex" style={{ color: "var(--on-header-2)" }}>
          <span>Каталог</span>
          <span>Доставка</span>
          <span>Контакти</span>
        </span>
      )}
      <span className="rounded-(--r-sm) px-2 py-1 text-xs" style={{ background: "var(--header-bg-2)", color: "var(--on-header)" }}>
        Кошик
      </span>
    </div>
    <div className={cx("grid gap-3 p-3", !mobile && "sm:grid-cols-2")}>
      <div className="flex flex-col gap-2 rounded-(--r-md) bg-(--surface) p-3 shadow-(--shadow-1)">
        <div className="relative flex h-24 items-center justify-center rounded-(--r-sm) bg-(--surface-2) text-(--ink-2)">
          фото
          <span className="absolute left-2 top-2 rounded-(--r-sm) px-2 py-0.5 text-xs font-semibold" style={{ background: "var(--sale)", color: "var(--on-sale)" }}>
            −15%
          </span>
        </div>
        <span className="font-medium">Ноутбук 15.6″ 16/512 ГБ</span>
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold">24 999 ₴</span>
          <span className="text-xs text-(--ink-2) line-through">29 410 ₴</span>
        </div>
        <button type="button" tabIndex={-1} className="h-10 rounded-(--r-md) px-3 font-semibold" style={{ background: "var(--cta)", color: "var(--on-cta)" }}>
          У кошик
        </button>
      </div>
      <div className="flex flex-col justify-center gap-2 rounded-(--r-md) bg-(--surface) p-3 shadow-(--shadow-1)">
        <span className="font-medium" style={{ color: "var(--brand-ink)" }}>
          Посилання брендовим кольором
        </span>
        <div className="rounded-(--r-sm) p-2 text-xs" style={{ background: "var(--brand-soft)", color: "var(--brand-ink)" }}>
          Безкоштовна доставка від 1500 ₴
        </div>
        <button type="button" tabIndex={-1} className="h-10 rounded-(--r-md) px-3 font-semibold" style={{ background: "var(--brand)", color: "var(--on-brand)" }}>
          Дивитися всі
        </button>
        <button
          type="button"
          tabIndex={-1}
          disabled
          className="h-10 cursor-not-allowed rounded-(--r-md) px-3 font-semibold"
          style={{ background: "var(--cta-disabled)", color: "var(--on-cta)" }}
        >
          Немає в наявності
        </button>
      </div>
    </div>
    <div className="flex flex-wrap gap-x-4 gap-y-1 px-3 py-3 text-xs" style={{ background: "var(--footer-bg)", color: "var(--on-footer)" }}>
      <span>© TechScout</span>
      <span>Оферта</span>
      <span>Повернення</span>
      <span>Конфіденційність</span>
    </div>
  </div>
);

// Дизайн сайту: пресет або власні кольори, живий перегляд, перевірка контрасту
const SiteDesign = () => {
  const [st, setSt] = useState(null); // відповідь GET
  const [preset, setPreset] = useState("tech-blue");
  const [basePreset, setBasePreset] = useState("tech-blue"); // від якого пресета стартував «Власний»
  const [colors, setColors] = useState({});
  const [preview, setPreview] = useState({ css: "", errors: [], warnings: [] });
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const reqId = useRef(0);

  const presets = useMemo(() => st?.presets || {}, [st]);

  const fillForm = (p, overrides, presetsMap) => {
    const list = presetsMap || presets;
    setPreset(p);
    if (p !== "custom" && list[p]) setBasePreset(p);
    if (p === "custom") {
      const base = presetColors(list["tech-blue"] || Object.values(list)[0]);
      setColors({ ...base, ...(overrides || {}) });
    } else {
      setColors(presetColors(list[p]));
    }
  };

  const load = () =>
    api
      .get("/admin/settings/theme")
      .then(({ data }) => {
        setSt(data);
        fillForm(data.theme?.preset || "tech-blue", data.theme?.overrides, data.presets || {});
        setPreview({ css: data.css, errors: data.errors || [], warnings: data.warnings || [] });
      })
      .catch((e) => toast.error(e.response?.data?.error || "Не вдалося завантажити"));

  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Локальна перевірка HEX (лише для «Власний»)
  const localErrors = useMemo(() => {
    if (preset !== "custom") return [];
    return FIELDS.filter(([k]) => !HEX.test(colors[k] || "")).map(([, label]) => `«${label}»: введіть колір у форматі #RRGGBB`);
  }, [preset, colors]);

  const body = useMemo(
    () => (preset === "custom" ? { preset, overrides: Object.fromEntries(KEYS.map((k) => [k, (colors[k] || "").toLowerCase()])) } : { preset, overrides: {} }),
    [preset, colors]
  );
  const bodyKey = JSON.stringify(body);

  // Дебаунс 300 мс; відповіді, що запізнилися, ігноруємо
  useEffect(() => {
    if (!st || localErrors.length) {
      setLoadingPreview(false);
      return undefined;
    }
    const id = ++reqId.current;
    setLoadingPreview(true);
    const t = setTimeout(() => {
      api
        .post("/admin/settings/theme/preview", JSON.parse(bodyKey))
        .then(({ data }) => {
          if (id !== reqId.current) return;
          setPreview({ css: data.css, errors: data.errors || [], warnings: data.warnings || [] });
        })
        .catch((e) => {
          if (id === reqId.current) toast.error(e.response?.data?.error || "Не вдалося оновити перегляд");
        })
        .finally(() => {
          if (id === reqId.current) setLoadingPreview(false);
        });
    }, 300);
    return () => clearTimeout(t);
  }, [bodyKey, st, localErrors.length]);

  const vars = useMemo(() => parseCssVars(preview.css), [preview.css]);

  const savedKey = st
    ? JSON.stringify(
        st.theme?.preset === "custom"
          ? { preset: "custom", overrides: Object.fromEntries(KEYS.map((k) => [k, (st.theme.overrides?.[k] || "").toLowerCase()])) }
          : { preset: st.theme?.preset, overrides: {} }
      )
    : bodyKey;
  const dirty = bodyKey !== savedKey;
  useUnsavedChanges(dirty);
  const [confirm, confirmEl] = useConfirm();
  const [device, setDevice] = useState("desktop");

  const header = (
    <PageHeader
      title="Дизайн сайту"
      description="Оберіть готову схему кольорів або задайте власні. Решта відтінків (наведення, текст на кнопках, м'які фони) обчислюються автоматично з урахуванням контрасту."
      breadcrumbs={[{ label: "Налаштування сайту" }, { label: "Дизайн" }]}
      className="mb-0 sm:mb-0"
    />
  );

  if (!st)
    return (
      <div className="flex min-w-0 flex-col gap-4">
        {header}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height={92} rounded="lg" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton height={320} rounded="lg" />
          <Skeleton height={320} rounded="lg" />
        </div>
      </div>
    );

  const errors = localErrors.length ? localErrors : preview.errors;
  const canSave = dirty && !busy && !loadingPreview && errors.length === 0;

  const choosePreset = (p) => {
    if (p === "custom") {
      // стартуємо з кольорів поточного пресета
      setColors(preset === "custom" ? colors : presetColors(presets[preset]));
      setPreset("custom");
    } else {
      fillForm(p);
    }
  };

  const setColor = (k, v) => setColors((c) => ({ ...c, [k]: v }));

  const resetToPreset = () => {
    setColors(presetColors(presets[basePreset] || presets["tech-blue"]));
  };

  const restore = async (h) => {
    if (dirty) {
      const ok = await confirm({
        title: "Замінити незбережені зміни?",
        text: "Поточні зміни у формі буде замінено кольорами обраної версії.",
        confirmLabel: "Підставити версію",
        tone: "brand",
      });
      if (!ok) return;
    }
    fillForm(h.preset === "custom" || presets[h.preset] ? h.preset : "tech-blue", h.overrides);
    toast.success("Версію підставлено у форму — перевірте й натисніть «Зберегти»");
  };

  const discard = async () => {
    const ok = await confirm({
      title: "Скасувати зміни?",
      text: "Форму буде повернуто до теми, що зараз діє на сайті.",
      confirmLabel: "Скасувати зміни",
      tone: "danger",
    });
    if (ok) fillForm(st.theme?.preset || "tech-blue", st.theme?.overrides);
  };

  const save = async () => {
    setBusy(true);
    try {
      const { data } = await api.put("/admin/settings/theme", body);
      toast.success(data.message || "Тему збережено");
      await load();
    } catch (e) {
      toast.error(e.response?.data?.error || "Не вдалося зберегти");
    } finally {
      setBusy(false);
    }
  };

  const tiles = [
    ...Object.entries(presets).map(([id, p]) => ({ id, label: p.label, colors: presetColors(p) })),
    { id: "custom", label: "Власний", colors: preset === "custom" ? colors : null },
  ];

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {header}

      <Card>
        <CardHeader icon={<MdPalette />} title="Схема кольорів" description="Готові пресети або «Власний» — 5 базових кольорів." />
        <CardBody>
          <div role="radiogroup" aria-label="Схема кольорів" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {tiles.map((t) => {
              const on = preset === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => choosePreset(t.id)}
                  className={cx(
                    "flex min-h-11 flex-col gap-2 rounded-(--r-md) border-2 p-3 text-left transition-colors",
                    on ? "border-(--brand) bg-(--brand-soft)" : "border-(--line) bg-(--surface) hover:bg-(--surface-2)",
                  )}
                >
                  <span className="flex items-center justify-between gap-2 text-sm font-semibold text-(--ink)">
                    {t.label}
                    {on && <MdCheckCircle aria-hidden="true" className="shrink-0 text-lg text-(--brand-ink)" />}
                  </span>
                  {t.colors ? <Swatches colors={t.colors} /> : <span className="text-xs text-(--ink-2)">свої 5 кольорів</span>}
                  {st.theme?.preset === t.id && (
                    <StatusChip tone="success" size="sm">
                      зараз на сайті
                    </StatusChip>
                  )}
                </button>
              );
            })}
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Кольори"
            description="Зміни з'являться у покупців протягом ~5 хвилин (кеш)."
            actions={
              <Button variant="secondary" size="sm" icon={<MdRestore />} onClick={resetToPreset} disabled={busy || preset !== "custom"}>
                Скинути до пресета{preset === "custom" && presets[basePreset] ? ` «${presets[basePreset].label}»` : ""}
              </Button>
            }
          />
          <CardBody className="flex flex-col gap-4">
            {preset === "custom" ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {FIELDS.map(([k, label]) => {
                  const val = colors[k] || "";
                  const ok = HEX.test(val);
                  return (
                    <Field key={k} label={label} error={ok ? "" : "Формат #RRGGBB"}>
                      <Input
                        id={`clr-${k}`}
                        className="font-mono"
                        invalid={!ok}
                        value={val}
                        maxLength={7}
                        onChange={(e) => {
                          let v = e.target.value.trim();
                          if (v && !v.startsWith("#")) v = `#${v}`;
                          setColor(k, v);
                        }}
                        placeholder="#RRGGBB"
                        spellCheck={false}
                        autoComplete="off"
                        rightSlot={
                          <input
                            type="color"
                            aria-label={`${label}: палітра`}
                            value={ok ? val.toLowerCase() : "#000000"}
                            onChange={(e) => setColor(k, e.target.value)}
                            className="h-9 w-9 cursor-pointer rounded-(--r-sm) border border-(--line) bg-(--surface) p-0.5"
                          />
                        }
                      />
                    </Field>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-(--r-md) bg-(--surface-2) p-3 text-sm text-(--ink)">
                Обрано пресет <b>{presets[preset]?.label}</b>. Щоб змінити окремі кольори, оберіть «Власний» — він стартує з кольорів цього пресета.
              </div>
            )}

            {errors.length > 0 && (
              <ul role="alert" className="list-disc rounded-(--r-md) border-l-4 border-(--danger) bg-(--danger-soft) p-3 pl-7 text-sm text-(--ink)">
                {errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )}
            {!localErrors.length && preview.warnings.length > 0 && (
              <ul role="status" className="list-disc rounded-(--r-md) border-l-4 border-(--warning) bg-(--warning-soft) p-3 pl-7 text-sm text-(--ink)">
                {preview.warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card className="lg:sticky lg:top-20 lg:self-start">
          <CardHeader
            icon={<MdVisibility />}
            title="Як побачить покупець"
            description={
              loadingPreview ? (
                <span className="inline-flex items-center gap-1.5">
                  <Spinner className="h-3.5 w-3.5" /> оновлення…
                </span>
              ) : (
                "Живе прев'ю — оновлюється під час редагування"
              )
            }
            actions={
              <Segmented
                size="sm"
                ariaLabel="Пристрій прев'ю"
                value={device}
                onChange={setDevice}
                options={[
                  { value: "desktop", icon: <MdComputer />, ariaLabel: "Комп'ютер" },
                  { value: "mobile", icon: <MdPhoneIphone />, ariaLabel: "Мобільний" },
                ]}
              />
            }
          />
          <CardBody className={cx(loadingPreview && "opacity-80 transition-opacity")}>
            <MiniShop vars={vars} mobile={device === "mobile"} />
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader icon={<MdHistory />} title="Історія" description="Останні 5 версій теми" />
        <CardBody>
          {(st.history || []).length === 0 ? (
            <EmptyState compact icon={<MdHistory />} title="Поки немає попередніх версій" text="Після кожного збереження тут з'явиться попередня версія, яку можна відновити." />
          ) : (
            <ul className="flex flex-col divide-y divide-(--line)">
              {st.history.slice(0, 5).map((h, i) => {
                const c = h.preset === "custom" ? { ...presetColors(presets["tech-blue"]), ...(h.overrides || {}) } : presetColors(presets[h.preset]);
                return (
                  <li key={`${h.at}-${i}`} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <Swatches colors={c} />
                      <span className="font-medium text-(--ink)">{h.preset === "custom" ? "Власний" : presets[h.preset]?.label || h.preset}</span>
                      <span className="text-xs text-(--ink-2)">{h.at ? formatDate(h.at, { withTime: true }) : ""}</span>
                    </div>
                    <Button variant="secondary" size="sm" icon={<MdRestore />} onClick={() => restore(h)}>
                      Відновити
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardBody>
      </Card>

      <StickyActions dirty={dirty}>
        <Button variant="ghost" onClick={discard} disabled={!dirty || busy}>
          Скасувати зміни
        </Button>
        <Button onClick={save} disabled={!canSave} loading={busy}>
          Зберегти
        </Button>
      </StickyActions>

      {confirmEl}
    </div>
  );
};

export default SiteDesign;
