import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { MdClose, MdErrorOutline, MdWarningAmber, MdCheckCircleOutline } from "react-icons/md";
import { Button, IconButton, useUnsavedChanges, cx } from "../../../ui";
import api from "../../../api/api";
import {
  AUDIENCE_LABEL,
  DEVICE_LABEL,
  contrastRatio,
  errMsg,
  fromLocalInput,
  inputCls,
  isHex,
  toLocalInput,
  validateBanner,
} from "./bannerUtils";
import { ConfirmDialog, Counter, Field, Segmented, Toggle } from "./ui";
import ImageField, { CropPreview } from "./ImageField";
import LinkField from "./LinkField";
import { BannerVisual, PlacementFrame } from "./BannerPreview";

const toForm = (b, placement) => ({
  name: b?.name || "",
  kind: b?.kind || placement.kind || "image",
  alt: b?.alt || "",
  headline: b?.headline || "",
  subline: b?.subline || "",
  ctaLabel: b?.ctaLabel || "",
  bgColor: b?.bgColor || "#1e293b",
  textColor: b?.textColor || "#ffffff",
  linkType: b?.linkType || "none",
  productId: b?.productId ? String(b.productId._id || b.productId) : "",
  productName: b?.productName || b?.productId?.name || "",
  productSlug: b?.productSlug || "",
  productImage: "",
  categoryName: b?.categoryName || "",
  pagePath: b?.pagePath || "",
  url: b?.url || "",
  newTab: b ? Boolean(b.newTab) : false,
  startAt: toLocalInput(b?.startAt),
  endAt: toLocalInput(b?.endAt),
  device: b?.device || "all",
  audience: b?.audience || "all",
  categories: Array.isArray(b?.categories) ? b.categories : [],
  active: Boolean(b?.active),
});

const Section = ({ title, children, hint }) => (
  <section className="flex min-w-0 flex-col gap-4 rounded-(--r-lg) border border-(--line) bg-(--surface) p-4 shadow-(--shadow-1) sm:p-5">
    <div className="min-w-0">
      <h3 className="text-base font-semibold text-(--ink)">{title}</h3>
      {hint && <p className="mt-0.5 text-sm text-(--ink-2)">{hint}</p>}
    </div>
    {children}
  </section>
);

const ColorInput = ({ id, label, value, onChange, error }) => (
  <Field id={id} label={label} error={error}>
    <div className="flex gap-2 items-center">
      <input
        type="color"
        aria-label={`${label} — палітра`}
        value={isHex(value) ? value : "#000000"}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-12 shrink-0 cursor-pointer rounded-(--r-md) border border-(--line) bg-(--surface) p-1"
      />
      <input
        id={id}
        className={`${inputCls} font-mono`}
        value={value}
        maxLength={7}
        onChange={(e) => onChange(e.target.value.trim())}
        aria-invalid={!!error}
        placeholder="#rrggbb"
      />
    </div>
  </Field>
);

const ContrastBadge = ({ bg, fg, onFix }) => {
  const r = contrastRatio(bg, fg);
  if (r == null) return null;
  const v = r.toFixed(2).replace(".", ",");
  const ok = r >= 4.5;
  const large = r >= 3;
  return (
    <div
      role="status"
      aria-live="polite"
      className={cx(
        "flex flex-col gap-2 rounded-(--r-md) border-l-4 p-3 text-sm text-(--ink)",
        ok ? "border-(--success) bg-(--success-soft)" : "border-(--danger) bg-(--danger-soft)"
      )}
    >
      <span className="inline-flex items-start gap-2">
        {ok ? (
          <MdCheckCircleOutline aria-hidden="true" className="mt-0.5 shrink-0 text-lg text-(--success)" />
        ) : (
          <MdErrorOutline aria-hidden="true" className="mt-0.5 shrink-0 text-lg text-(--danger)" />
        )}
        <span>
        Контраст: <b className="tabular-nums">{v}:1</b> —{" "}
        {ok
          ? r >= 7
            ? "відмінно (WCAG AAA)"
            : "достатньо (WCAG AA ≥ 4,5:1)"
          : large
          ? "недостатньо для звичайного тексту (потрібно ≥ 4,5:1)"
          : "текст погано читається (потрібно ≥ 4,5:1)"}
        </span>
      </span>
      {!ok && (
        <Button size="sm" variant="secondary" onClick={onFix} className="self-start">
          Підібрати колір тексту автоматично (чорний або білий)
        </Button>
      )}
    </div>
  );
};

const CategoryMulti = ({ all, value, onChange, error }) => {
  const [q, setQ] = useState("");
  const shown = all.filter((c) => c.toLowerCase().includes(q.trim().toLowerCase()));
  const toggle = (c) => onChange(value.includes(c) ? value.filter((x) => x !== c) : [...value, c]);
  return (
    <Field
      id="bn-cats-q"
      label="Категорії, де показувати"
      error={error}
      hint="Нічого не обрано — банер показується в каталозі для всіх категорій і в пошуку. Банер, прив'язаний до категорії, має пріоритет над загальним."
    >
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1 pb-2">
          {value.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => toggle(c)}
              className="inline-flex min-h-8 items-center gap-1 rounded-full bg-(--brand-soft) px-3 text-xs font-medium text-(--brand-ink) hover:bg-(--danger-soft) hover:text-(--danger)"
              aria-label={`Прибрати категорію ${c}`}
            >
              {c} <MdClose aria-hidden="true" />
            </button>
          ))}
          <button type="button" onClick={() => onChange([])} className="min-h-8 rounded-(--r-sm) px-2 text-xs font-medium text-(--brand-ink) hover:bg-(--brand-soft)">
            Очистити
          </button>
        </div>
      )}
      <input id="bn-cats-q" className={inputCls} placeholder="Фільтр категорій…" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="mt-2 grid max-h-48 gap-1 overflow-auto rounded-(--r-md) border border-(--line) bg-(--surface-2) p-2 sm:grid-cols-2" role="group" aria-label="Список категорій">
        {shown.length === 0 && <span className="text-sm text-(--ink-2)">Нічого не знайдено</span>}
        {shown.map((c) => (
          <label key={c} className="flex min-h-9 cursor-pointer items-center gap-2 rounded-(--r-sm) px-1 text-sm text-(--ink) hover:bg-(--surface)">
            <input type="checkbox" className="h-5 w-5 shrink-0 accent-(--brand)" checked={value.includes(c)} onChange={() => toggle(c)} />
            <span className="truncate">{c}</span>
          </label>
        ))}
      </div>
    </Field>
  );
};

const BannerForm = ({ placement, banner, categories, catError, limits, settings, onSaved, onClose }) => {
  const isNew = !banner;
  const initial = useMemo(() => toForm(banner, placement), [banner, placement]);
  const [f, setF] = useState(initial);
  const [desk, setDesk] = useState({ file: null, url: banner?.imageDesktop?.url || "" });
  const [mob, setMob] = useState({ file: null, url: banner?.imageMobile?.url || "" });
  const [removeMobile, setRemoveMobile] = useState(false);
  const [deskDims, setDeskDims] = useState(
    banner?.imageDesktop?.width ? { width: banner.imageDesktop.width, height: banner.imageDesktop.height } : null
  );
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState("desktop");
  const [askClose, setAskClose] = useState(false);
  const panelRef = useRef(null);
  const titleRef = useRef(null);

  const cancelClose = useCallback(() => setAskClose(false), []);
  const patch = (p) => setF((x) => ({ ...x, ...p }));
  const set = (k) => (e) => patch({ [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  const isImage = f.kind === "image";
  const dirty = JSON.stringify(f) !== JSON.stringify(initial) || desk.file || mob.file || removeMobile;
  useUnsavedChanges(!!dirty);

  // Живе оновлення помилок після першої спроби збереження
  useEffect(() => {
    if (submitted) setErrors(validateBanner(f, placement, { hasDesktop: !!desk.url }));
  }, [f, desk.url, submitted, placement]);

  const requestClose = useCallback(() => {
    if (dirty) setAskClose(true);
    else onClose();
  }, [dirty, onClose]);

  useEffect(() => {
    const prev = document.activeElement;
    titleRef.current?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
      prev?.focus?.();
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && !askClose) requestClose();
      // Простий фокус-трап
      if (e.key === "Tab" && panelRef.current && !askClose) {
        const els = panelRef.current.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]):not([type="hidden"]):not(.hidden), select, textarea, [tabindex="0"]'
        );
        const list = [...els].filter((el) => el.offsetParent !== null);
        if (!list.length) return;
        const first = list[0];
        const last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [requestClose, askClose]);

  // Звільнення objectURL
  useEffect(() => () => desk.file && URL.revokeObjectURL(desk.url), [desk]);
  useEffect(() => () => mob.file && URL.revokeObjectURL(mob.url), [mob]);

  const save = async (activate) => {
    setSubmitted(true);
    const payload = activate ? { ...f, active: true } : f;
    const e = validateBanner(payload, placement, { hasDesktop: !!desk.url });
    setErrors(e);
    if (Object.keys(e).length) {
      toast.error("Перевірте позначені поля");
      const firstKey = Object.keys(e)[0];
      const map = {
        name: "bn-name",
        alt: "bn-alt",
        headline: "bn-headline",
        subline: "bn-subline",
        ctaLabel: "bn-cta",
        imageDesktop: "bn-img-desktop",
        bgColor: "bn-bg",
        textColor: "bn-fg",
        endAt: "bn-end",
        categories: "bn-cats-q",
        link: { product: "bn-product", category: "bn-cat", page: "bn-page", url: "bn-url" }[f.linkType],
      };
      const el = document.getElementById(map[firstKey] || "");
      if (el) {
        el.scrollIntoView({ block: "center", behavior: "smooth" });
        if (el.type !== "file") el.focus({ preventScroll: true });
      }
      return;
    }
    const fd = new FormData();
    const lt = payload.linkType;
    const fields = {
      name: payload.name.trim(),
      placement: placement.id,
      kind: payload.kind,
      alt: payload.alt.trim(),
      headline: payload.headline.trim(),
      subline: payload.subline.trim(),
      ctaLabel: payload.ctaLabel.trim(),
      bgColor: payload.kind === "text" ? payload.bgColor : "",
      textColor: payload.kind === "text" ? payload.textColor : "",
      linkType: lt,
      productId: lt === "product" ? payload.productId : "",
      categoryName: lt === "category" ? payload.categoryName : "",
      pagePath: lt === "page" ? payload.pagePath.trim() : "",
      url: lt === "url" ? payload.url.trim() : "",
      newTab: lt !== "none" && payload.newTab ? "true" : "false",
      startAt: fromLocalInput(payload.startAt),
      endAt: fromLocalInput(payload.endAt),
      device: payload.device,
      audience: payload.audience,
      categories: JSON.stringify(placement.categories ? payload.categories : []),
      active: payload.active ? "true" : "false",
    };
    Object.entries(fields).forEach(([k, v]) => fd.append(k, v));
    if (isImage && desk.file) fd.append("imageDesktop", desk.file);
    if (isImage && mob.file) fd.append("imageMobile", mob.file);
    if (removeMobile && !mob.file && banner?.imageMobile?.url) fd.append("removeImageMobile", "1");
    setBusy(true);
    try {
      const { data } = isNew ? await api.post("/admin/banners", fd) : await api.put(`/admin/banners/${banner._id}`, fd);
      toast.success(data.message || (isNew ? "Банер створено" : "Зміни збережено"));
      onSaved(data.banner, isNew);
    } catch (err) {
      toast.error(errMsg(err, "Не вдалося зберегти банер"));
    } finally {
      setBusy(false);
    }
  };

  const bestText = () => {
    const w = contrastRatio(f.bgColor, "#ffffff") || 0;
    const b = contrastRatio(f.bgColor, "#000000") || 0;
    patch({ textColor: w >= b ? "#ffffff" : "#000000" });
  };

  const deskRatio = deskDims?.width ? deskDims.width / deskDims.height : null;
  const mobRatio = placement.mobile ? placement.mobile.width / placement.mobile.height : null;
  const showMobileCrop = isImage && desk.url && !mob.url && mobRatio && deskRatio;
  const altBad = /банер|banner/i.test(f.alt);

  const visual = (
    <BannerVisual
      b={f}
      placement={placement}
      mode={mode}
      desktopUrl={desk.url}
      mobileUrl={mob.url}
      dismissible={placement.id === "announcement" && settings?.announcement?.dismissible !== false}
    />
  );

  return (
    <div className="fixed inset-0 z-[10000] flex justify-end bg-(--overlay)" onMouseDown={(e) => e.target === e.currentTarget && requestClose()}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bn-form-title"
        className="flex h-full w-full max-w-[1180px] flex-col bg-(--page) text-(--ink) shadow-(--shadow-3)"
      >
        <header className="flex items-center justify-between gap-3 border-b border-(--line) bg-(--surface) px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <h2 id="bn-form-title" ref={titleRef} tabIndex={-1} className="text-lg font-semibold outline-none truncate">
              {isNew ? "Новий банер" : `Редагування: ${banner.name}`}
            </h2>
            <p className="truncate text-sm text-(--ink-2)">{placement.name}</p>
          </div>
          <IconButton icon={<MdClose />} label="Закрити" onClick={requestClose} className="-mr-2" />
        </header>

        <div className="flex-1 overflow-auto">
          <div className="grid gap-4 p-3 sm:p-5 lg:grid-cols-[minmax(0,1fr)_400px]">
            <form
              className="flex flex-col gap-4 min-w-0"
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                save(false);
              }}
            >
              <Section title="Основне">
                <Field
                  id="bn-name"
                  label="Внутрішня назва"
                  required
                  error={errors.name}
                  hint="Бачите лише ви в адмінці, напр. «Чорна п'ятниця — ноутбуки»."
                  counter={<Counter value={f.name} max={80} />}
                >
                  <input id="bn-name" className={inputCls} value={f.name} onChange={set("name")} maxLength={80} aria-invalid={!!errors.name} />
                </Field>
                <div className="text-sm text-(--ink-2)">
                  Тип: <b className="text-(--ink)">{isImage ? "Зображення" : "Текстова смуга"}</b> (визначається місцем розміщення)
                </div>
              </Section>

              {isImage && (
                <Section
                  title="Зображення"
                  hint="Окреме мобільне зображення (art direction) дає кращий результат, ніж автоматичне обрізання."
                >
                  <ImageField
                    id="bn-img-desktop"
                    label="Зображення для ПК"
                    required
                    target={placement.desktop}
                    url={desk.url}
                    file={desk.file}
                    limits={limits}
                    existingDims={deskDims}
                    onDims={setDeskDims}
                    error={errors.imageDesktop}
                    onFile={(file, url) => setDesk({ file, url })}
                  />
                  <ImageField
                    id="bn-img-mobile"
                    label="Зображення для мобільного (необов'язково)"
                    target={placement.mobile}
                    url={mob.url}
                    file={mob.file}
                    limits={limits}
                    existingDims={
                      banner?.imageMobile?.width ? { width: banner.imageMobile.width, height: banner.imageMobile.height } : null
                    }
                    hint="Якщо не завантажено — на телефонах показується зображення для ПК, обрізане по центру."
                    onFile={(file, url) => {
                      setMob({ file, url });
                      setRemoveMobile(false);
                    }}
                    onRemove={() => {
                      setMob({ file: null, url: "" });
                      setRemoveMobile(true);
                    }}
                  />
                  {showMobileCrop && (
                    <div className="max-w-[520px]">
                      <span className="block pb-1 text-sm font-medium text-(--ink)">Як обріжеться на мобільному</span>
                      <CropPreview src={desk.url} srcRatio={deskRatio} cropRatio={mobRatio} caption="" />
                    </div>
                  )}
                  <Field
                    id="bn-alt"
                    label="Альтернативний текст (alt)"
                    required
                    error={errors.alt}
                    counter={<Counter value={f.alt} max={160} />}
                    hint="Опишіть зміст і пропозицію, як для людини, що не бачить зображення: «Знижка 20% на ноутбуки Lenovo до 30 листопада». Не пишіть «банер» чи «картинка»."
                  >
                    <input id="bn-alt" className={inputCls} value={f.alt} onChange={set("alt")} maxLength={160} aria-invalid={!!errors.alt} />
                  </Field>
                  {altBad && !errors.alt && (
                    <span className="inline-flex items-start gap-1.5 text-xs font-medium text-(--warning-ink)" role="status">
                      <MdWarningAmber aria-hidden="true" className="mt-px shrink-0 text-sm" />
                      Слово «банер» в alt зайве — екранні читачі й так повідомляють, що це зображення.</span>
                  )}
                </Section>
              )}

              <Section
                title={isImage ? "Текст поверх зображення (необов'язково)" : "Текст смуги"}
                hint={isImage ? "Краще, коли текст уже є на зображенні, — тоді залиште поля порожніми." : "Коротко: одна думка, до 80 символів."}
              >
                <Field id="bn-headline" label="Заголовок"
                  required={!isImage} error={errors.headline} counter={<Counter value={f.headline} max={80} />}>
                  <input id="bn-headline" className={inputCls} value={f.headline} onChange={set("headline")} maxLength={80} aria-invalid={!!errors.headline} />
                </Field>
                <Field id="bn-subline" label="Підзаголовок" error={errors.subline} counter={<Counter value={f.subline} max={160} />}>
                  <input id="bn-subline" className={inputCls} value={f.subline} onChange={set("subline")} maxLength={160} />
                </Field>
                <Field
                  id="bn-cta"
                  label="Текст кнопки"
                  error={errors.ctaLabel}
                  counter={<Counter value={f.ctaLabel} max={30} />}
                  hint="Дієслово: «Купити», «Дивитися знижки». Показується лише, якщо є посилання."
                >
                  <input id="bn-cta" className={inputCls} value={f.ctaLabel} onChange={set("ctaLabel")} maxLength={30} />
                </Field>
                {!isImage && (
                  <>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <ColorInput id="bn-bg" label="Колір фону" value={f.bgColor} error={errors.bgColor} onChange={(v) => patch({ bgColor: v })} />
                      <ColorInput id="bn-fg" label="Колір тексту" value={f.textColor} error={errors.textColor} onChange={(v) => patch({ textColor: v })} />
                    </div>
                    <ContrastBadge bg={f.bgColor} fg={f.textColor} onFix={bestText} />
                  </>
                )}
              </Section>

              <Section title="Посилання">
                <LinkField f={f} set={set} patch={patch} categories={categories} catError={catError} errors={errors} />
              </Section>

              <Section title="Розклад" hint="Час — за вашим часовим поясом; сервер перевіряє дати сам, вмикати вручну не потрібно.">
                <div className="grid sm:grid-cols-2 gap-3">
                  <Field id="bn-start" label="Початок показу" hint="Порожньо — одразу після увімкнення.">
                    <input id="bn-start" type="datetime-local" className={inputCls} value={f.startAt} onChange={set("startAt")} />
                  </Field>
                  <Field id="bn-end" label="Кінець показу" error={errors.endAt} hint="Порожньо — безстроково.">
                    <input
                      id="bn-end"
                      type="datetime-local"
                      className={inputCls}
                      value={f.endAt}
                      min={f.startAt || undefined}
                      onChange={set("endAt")}
                      aria-invalid={!!errors.endAt}
                    />
                  </Field>
                </div>
                {(f.startAt || f.endAt) && (
                  <Button size="sm" variant="ghost" onClick={() => patch({ startAt: "", endAt: "" })} className="self-start">
                    Очистити дати
                  </Button>
                )}
              </Section>

              <Section title="Кому показувати">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-(--ink)">Пристрої</span>
                  <Segmented label="Пристрої" value={f.device} onChange={(v) => patch({ device: v })} options={Object.entries(DEVICE_LABEL)} size="sm" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-(--ink)">Аудиторія</span>
                  <Segmented
                    label="Аудиторія"
                    value={f.audience}
                    onChange={(v) => patch({ audience: v })}
                    options={Object.entries(AUDIENCE_LABEL)}
                    size="sm"
                  />
                </div>
                {placement.categories && (
                  <CategoryMulti all={categories} value={f.categories} onChange={(v) => patch({ categories: v })} error={errors.categories} />
                )}
                <Toggle checked={f.active} onChange={(v) => patch({ active: v })} label="Увімкнено (показувати на сайті за розкладом)" />
              </Section>
            </form>

            <aside className="flex min-w-0 flex-col gap-3 self-start rounded-(--r-lg) border border-(--line) bg-(--surface) p-4 shadow-(--shadow-1) lg:sticky lg:top-0" aria-label="Попередній перегляд">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h3 className="text-base font-semibold">Як це виглядатиме</h3>
                <Segmented
                  label="Режим перегляду"
                  value={mode}
                  onChange={setMode}
                  options={[
                    ["desktop", "ПК"],
                    ["mobile", "Мобільний"],
                  ]}
                  size="sm"
                />
              </div>
              <PlacementFrame placementId={placement.id} mode={mode}>
                {visual}
              </PlacementFrame>
              <p className="text-xs text-(--ink-2)">
                Схематичне прев'ю. {placement.where}
                {f.device !== "all" && ` · Показ: ${DEVICE_LABEL[f.device].toLowerCase()}.`}
              </p>
            </aside>
          </div>
        </div>

        <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-(--line) bg-(--surface) px-4 py-3 pb-[max(0.75rem,var(--sab))] shadow-(--shadow-2) sm:px-5">
          <div className="mr-auto min-w-0 text-sm" aria-live="polite">
            {Object.keys(errors).length > 0 ? (
              <span className="inline-flex items-center gap-1.5 font-medium text-(--danger)" role="status">
                <MdErrorOutline aria-hidden="true" className="shrink-0 text-lg" />
                Помилок у формі: {Object.keys(errors).length}
              </span>
            ) : dirty ? (
              <span className="inline-flex items-center gap-1.5 font-medium text-(--warning-ink)">
                <MdWarningAmber aria-hidden="true" className="shrink-0 text-lg" />
                Є незбережені зміни
              </span>
            ) : null}
          </div>
          <Button variant="secondary" onClick={requestClose}>
            Скасувати
          </Button>
          <Button variant={f.active ? "primary" : "secondary"} loading={busy} onClick={() => save(false)}>
            Зберегти
          </Button>
          {!f.active && (
            <Button loading={busy} onClick={() => save(true)}>
              Зберегти й увімкнути
            </Button>
          )}
        </footer>
      </div>

      {askClose && (
        <ConfirmDialog
          title="Закрити без збереження?"
          text="Внесені зміни буде втрачено."
          confirmLabel="Закрити"
          onConfirm={onClose}
          onCancel={cancelClose}
        />
      )}
    </div>
  );
};

export default BannerForm;
