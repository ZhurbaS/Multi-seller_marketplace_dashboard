import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  MdAdd,
  MdArrowDownward,
  MdArrowUpward,
  MdDeleteOutline,
  MdEdit,
  MdImage,
  MdInfoOutline,
  MdLocationOn,
  MdMap,
  MdPhone,
  MdSchedule,
  MdStore,
} from "react-icons/md";
import api from "../../api/api";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Checkbox,
  Field,
  IconButton,
  Input,
  PageHeader,
  Skeleton,
  StatusChip,
  StickyActions,
  Switch,
  Table,
  Textarea,
  useConfirm,
  useUnsavedChanges,
} from "../../ui";

const EMPTY = {
  name: "",
  city: "",
  address: "",
  phone: "",
  email: "",
  hours: "",
  description: "",
  mapUrl: "",
  lat: "",
  lng: "",
  pickup: false,
  photo: "",
};

const HTTP = /^https?:\/\//i;
const IMG = /^(https?:\/\/|\/(?!\/))/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const toForm = (s) => ({
  ...EMPTY,
  ...Object.fromEntries(Object.keys(EMPTY).map((k) => [k, s[k] ?? EMPTY[k]])),
  lat: s.lat ?? "",
  lng: s.lng ?? "",
});

// Інлайн-валідація форми (сервер валідує остаточно)
const validate = (f) => {
  const e = {};
  if (!f.name.trim()) e.name = "Вкажіть назву";
  if (!f.city.trim()) e.city = "Вкажіть місто";
  if (!f.address.trim()) e.address = "Вкажіть адресу";
  if (f.email && !EMAIL.test(f.email.trim())) e.email = "Невірний формат e-mail";
  if (f.mapUrl && !HTTP.test(f.mapUrl.trim())) e.mapUrl = "Посилання має починатися з https://";
  if (f.photo && !IMG.test(f.photo.trim())) e.photo = "Посилання https://… або шлях /…";
  const lat = String(f.lat).trim();
  const lng = String(f.lng).trim();
  if (lat && (!Number.isFinite(Number(lat)) || Math.abs(Number(lat)) > 90)) e.lat = "Число від −90 до 90";
  if (lng && (!Number.isFinite(Number(lng)) || Math.abs(Number(lng)) > 180)) e.lng = "Число від −180 до 180";
  return e;
};

const StoreForm = ({ initial, onSaved, onCancel, onDirty }) => {
  const start = useMemo(() => (initial ? toForm(initial) : EMPTY), [initial]);
  const [f, setF] = useState(start);
  const [busy, setBusy] = useState(false);
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [photoErr, setPhotoErr] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  const blur = (k) => () => setTouched((t) => ({ ...t, [k]: true }));

  const errors = validate(f);
  const err = (k) => (submitted || touched[k] ? errors[k] : "");
  const dirty = JSON.stringify(f) !== JSON.stringify(start);
  useUnsavedChanges(dirty);
  useEffect(() => onDirty(dirty), [dirty, onDirty]);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length) {
      toast.error("Перевірте виділені поля");
      return;
    }
    if (f.mapUrl && !HTTP.test(f.mapUrl.trim())) return toast.error("Посилання на карту має починатися з https://");
    if (f.photo && !IMG.test(f.photo.trim())) return toast.error("Фото: посилання https://… або шлях /…");
    setBusy(true);
    try {
      const { data } = initial
        ? await api.put(`/admin/stores/${initial._id}`, f)
        : await api.post("/admin/stores", f);
      toast.success(data.message);
      onDirty(false);
      onSaved(data.store, !initial);
    } catch (err) {
      toast.error(err.response?.data?.error || "Не вдалося зберегти");
    } finally {
      setBusy(false);
    }
  };

  const photo = f.photo.trim();

  return (
    <form onSubmit={submit} noValidate className="flex min-w-0 flex-col gap-4" aria-label={initial ? "Редагування магазину" : "Новий магазин"}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-(--ink)">{initial ? `Редагувати: ${initial.name}` : "Новий магазин"}</h2>
        {!initial && (
          <p className="text-sm text-(--ink-2)">Новий магазин спочатку прихований — увімкніть «Показувати на сайті», коли все перевірите.</p>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader icon={<MdStore />} title="Основне" />
          <CardBody className="flex flex-col gap-4">
            <Field label="Назва" required error={err("name")}>
              <Input value={f.name} onChange={set("name")} onBlur={blur("name")} invalid={!!err("name")} maxLength={120} placeholder="напр. TechScout на Хрещатику" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
              <Field label="Місто" required error={err("city")}>
                <Input value={f.city} onChange={set("city")} onBlur={blur("city")} invalid={!!err("city")} maxLength={80} placeholder="Київ" autoComplete="address-level2" />
              </Field>
              <Field label="Адреса" required error={err("address")}>
                <Input value={f.address} onChange={set("address")} onBlur={blur("address")} invalid={!!err("address")} maxLength={250} placeholder="вул. Хрещатик, 1" autoComplete="street-address" />
              </Field>
            </div>
            <Checkbox checked={f.pickup} onChange={set("pickup")} label="Є самовивіз замовлень у цьому магазині" />
          </CardBody>
        </Card>

        <Card>
          <CardHeader icon={<MdPhone />} title="Контакти" />
          <CardBody className="flex flex-col gap-4">
            <Field label="Телефон">
              <Input type="tel" inputMode="tel" value={f.phone} onChange={set("phone")} maxLength={30} placeholder="+380 44 123 45 67" autoComplete="tel" />
            </Field>
            <Field label="E-mail" error={err("email")}>
              <Input type="email" inputMode="email" value={f.email} onChange={set("email")} onBlur={blur("email")} invalid={!!err("email")} maxLength={120} autoComplete="email" />
            </Field>
          </CardBody>
        </Card>

        <Card>
          <CardHeader icon={<MdSchedule />} title="Графік і опис" />
          <CardBody className="flex flex-col gap-4">
            <Field label="Графік роботи" hint="Кожен рядок — окремий день або період, напр. «Пн–Пт 10:00–19:00», «Сб 10:00–16:00», «Нд — вихідний»">
              <Textarea rows={3} value={f.hours} onChange={set("hours")} maxLength={500} placeholder={"Пн–Пт 10:00–19:00\nСб 10:00–16:00\nНд — вихідний"} />
            </Field>
            <Field label="Опис" hint={`${f.description.length}/2000`}>
              <Textarea rows={3} value={f.description} onChange={set("description")} maxLength={2000} placeholder="Як знайти, вхід, парковка…" />
            </Field>
          </CardBody>
        </Card>

        <Card>
          <CardHeader icon={<MdMap />} title="Розташування" />
          <CardBody className="flex flex-col gap-4">
            <Field label="Посилання на Google Maps" hint="Відкрийте місце в Google Maps → Поділитися → Копіювати посилання і вставте сюди" error={err("mapUrl")}>
              <Input inputMode="url" value={f.mapUrl} onChange={set("mapUrl")} onBlur={blur("mapUrl")} invalid={!!err("mapUrl")} maxLength={1000} placeholder="https://maps.app.goo.gl/…" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Широта" hint="Необов'язково" error={err("lat")}>
                <Input inputMode="decimal" value={f.lat} onChange={set("lat")} onBlur={blur("lat")} invalid={!!err("lat")} placeholder="50.4501" />
              </Field>
              <Field label="Довгота" hint="Необов'язково" error={err("lng")}>
                <Input inputMode="decimal" value={f.lng} onChange={set("lng")} onBlur={blur("lng")} invalid={!!err("lng")} placeholder="30.5234" />
              </Field>
            </div>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader icon={<MdImage />} title="Фото" description="Посилання https://… або шлях на сайті /images/…; необов'язково" />
          <CardBody className="grid gap-4 md:grid-cols-[1fr_minmax(0,320px)]">
            <Field label="Фото (URL)" error={err("photo")}>
              <Input
                inputMode="url"
                value={f.photo}
                onChange={(e) => {
                  setPhotoErr(false);
                  set("photo")(e);
                }}
                onBlur={blur("photo")}
                invalid={!!err("photo")}
                maxLength={500}
                placeholder="https://…/shop.jpg"
              />
            </Field>
            {photo && IMG.test(photo) ? (
              photoErr ? (
                <div role="alert" className="flex h-40 items-center justify-center rounded-(--r-md) border border-dashed border-(--danger) bg-(--danger-soft) p-3 text-center text-xs text-(--danger)">
                  Не вдалося завантажити зображення за цим посиланням.
                </div>
              ) : (
                <img src={photo} alt="Прев'ю фото магазину" onError={() => setPhotoErr(true)} className="h-40 w-full rounded-(--r-md) border border-(--line) object-cover" />
              )
            ) : (
              <div className="flex h-40 items-center justify-center rounded-(--r-md) border border-dashed border-(--line-strong) bg-(--surface-2) text-xs text-(--ink-2)">
                Прев'ю з'явиться тут
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <StickyActions dirty={dirty}>
        <Button variant="ghost" onClick={onCancel} disabled={busy}>
          Скасувати
        </Button>
        <Button type="submit" loading={busy} disabled={busy}>
          {initial ? "Зберегти зміни" : "Додати магазин"}
        </Button>
      </StickyActions>
    </form>
  );
};

const StoreLocations = () => {
  const [stores, setStores] = useState(null);
  const [editing, setEditing] = useState(null); // null | "new" | store
  const [busyId, setBusyId] = useState("");
  const [confirm, confirmEl] = useConfirm();
  const formDirty = useRef(false);
  const setFormDirty = useCallback((v) => {
    formDirty.current = v;
  }, []);

  useEffect(() => {
    api
      .get("/admin/stores")
      .then(({ data }) => setStores(data.stores))
      .catch((e) => {
        setStores([]);
        toast.error(e.response?.data?.error || "Не вдалося завантажити магазини");
      });
  }, []);

  // Перехід між формами / закриття — з підтвердженням, якщо є незбережені зміни
  const openEditor = async (next) => {
    if (editing !== null && formDirty.current) {
      const ok = await confirm({
        title: "Скасувати незбережені зміни?",
        text: "Зміни у формі магазину буде втрачено.",
        confirmLabel: "Скасувати зміни",
        cancelLabel: "Продовжити редагування",
        tone: "danger",
      });
      if (!ok) return;
    }
    formDirty.current = false;
    setEditing(next);
    if (next !== null) window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onSaved = (store, isNew) => {
    setStores((list) => (isNew ? [...list, store] : list.map((s) => (s._id === store._id ? store : s))));
    formDirty.current = false;
    setEditing(null);
  };

  const setActive = async (s, active) => {
    setBusyId(s._id);
    try {
      const { data } = await api.put(`/admin/stores/${s._id}/active`, { active });
      setStores((list) => list.map((x) => (x._id === s._id ? data.store : x)));
      toast.success(data.message);
    } catch (err) {
      toast.error(err.response?.data?.error || "Не вдалося змінити");
    } finally {
      setBusyId("");
    }
  };

  const move = async (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= stores.length) return;
    const next = [...stores];
    [next[i], next[j]] = [next[j], next[i]];
    const prev = stores;
    setStores(next);
    try {
      const { data } = await api.put("/admin/stores/reorder", { ids: next.map((s) => s._id) });
      setStores(data.stores);
    } catch (err) {
      setStores(prev);
      toast.error(err.response?.data?.error || "Не вдалося змінити порядок");
    }
  };

  const askDelete = async (s) => {
    const ok = await confirm({
      title: "Видалити магазин?",
      text: `«${s.name}» (${s.city}) буде видалено назавжди. Якщо потрібно лише тимчасово сховати його — вимкніть «Показувати на сайті».`,
      confirmLabel: "Видалити",
      tone: "danger",
    });
    if (!ok) return;
    setBusyId(s._id);
    try {
      const { data } = await api.delete(`/admin/stores/${s._id}`);
      setStores((list) => list.filter((x) => x._id !== s._id));
      toast.success(data.message);
      if (editing && editing._id === s._id) setEditing(null);
    } catch (err) {
      toast.error(err.response?.data?.error || "Не вдалося видалити");
    } finally {
      setBusyId("");
    }
  };

  const activeCount = (stores || []).filter((s) => s.active).length;

  const nameCell = (s) => (
    <div className="flex min-w-0 items-center gap-3">
      {s.photo ? (
        <img src={s.photo} alt="" className="h-12 w-16 shrink-0 rounded-(--r-sm) border border-(--line) object-cover" loading="lazy" />
      ) : (
        <span aria-hidden="true" className="inline-flex h-12 w-16 shrink-0 items-center justify-center rounded-(--r-sm) bg-(--surface-2) text-xl text-(--ink-2)">
          <MdStore />
        </span>
      )}
      <div className="min-w-0">
        <div className="break-words font-semibold text-(--ink)">{s.name}</div>
        <div className="break-words text-sm text-(--ink-2)">
          {s.city}, {s.address}
        </div>
      </div>
    </div>
  );

  const statusCell = (s) => (
    <div className="flex flex-wrap gap-1.5">
      <StatusChip tone={s.active ? "success" : "neutral"}>{s.active ? "На сайті" : "Прихований"}</StatusChip>
      {s.pickup && <StatusChip tone="brand">Самовивіз</StatusChip>}
    </div>
  );

  const actions = (s, i) => (
    <div className="flex items-center gap-1">
      <IconButton icon={<MdArrowUpward />} label={`Перемістити «${s.name}» вище`} disabled={i === 0} onClick={() => move(i, -1)} />
      <IconButton icon={<MdArrowDownward />} label={`Перемістити «${s.name}» нижче`} disabled={i === stores.length - 1} onClick={() => move(i, 1)} />
      <IconButton icon={<MdEdit />} label={`Редагувати «${s.name}»`} onClick={() => openEditor(s)} />
      <IconButton icon={<MdDeleteOutline />} label={`Видалити «${s.name}»`} disabled={busyId === s._id} onClick={() => askDelete(s)} className="hover:text-(--danger)" />
    </div>
  );

  const visibleSwitch = (s) => (
    <Switch checked={!!s.active} disabled={busyId === s._id} onChange={(v) => setActive(s, v)} label="Показувати на сайті" size="sm" />
  );

  const columns = [
    { key: "order", header: "№", width: 48, render: (_, i) => <span className="tabular-nums text-(--ink-2)">{i + 1}</span> },
    { key: "name", header: "Магазин", primary: true, render: nameCell },
    {
      key: "contacts",
      header: "Контакти і графік",
      render: (s) => (
        <div className="flex min-w-0 flex-col gap-0.5 text-sm">
          {s.phone && <span>{s.phone}</span>}
          {s.hours && <span className="whitespace-pre-line text-xs text-(--ink-2)">{s.hours}</span>}
          {s.mapUrl && (
            <a href={s.mapUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 self-start text-xs text-(--brand-ink) underline">
              <MdLocationOn aria-hidden="true" /> Відкрити на карті
            </a>
          )}
          {!s.phone && !s.hours && !s.mapUrl && "—"}
        </div>
      ),
    },
    { key: "status", header: "Статус", render: statusCell },
    { key: "active", header: "На сайті", render: visibleSwitch },
    { key: "actions", header: <span className="sr-only">Дії</span>, align: "right", render: actions },
  ];

  const renderCard = (s, i) => (
    <div className="flex min-w-0 flex-col gap-3">
      {nameCell(s)}
      {statusCell(s)}
      {(s.phone || s.hours) && (
        <div className="flex flex-col gap-0.5 text-sm">
          {s.phone && <span>{s.phone}</span>}
          {s.hours && <span className="whitespace-pre-line text-xs text-(--ink-2)">{s.hours}</span>}
        </div>
      )}
      {s.mapUrl && (
        <a href={s.mapUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1 self-start text-sm text-(--brand-ink) underline">
          <MdLocationOn aria-hidden="true" /> Відкрити на карті
        </a>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {visibleSwitch(s)}
        {actions(s, i)}
      </div>
    </div>
  );

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <PageHeader
        title="Магазини"
        description="Фізичні точки продажу та самовивозу. Покупці бачать на сторінці «Магазини» лише ті, де увімкнено «Показувати на сайті», у порядку цього списку."
        breadcrumbs={[{ label: "Налаштування сайту" }, { label: "Магазини" }]}
        className="mb-0 sm:mb-0"
        actions={
          editing === null && (
            <Button icon={<MdAdd />} onClick={() => openEditor("new")}>
              Додати магазин
            </Button>
          )
        }
      />

      {editing !== null && (
        <StoreForm
          key={editing === "new" ? "new" : editing._id}
          initial={editing === "new" ? null : editing}
          onSaved={onSaved}
          onCancel={() => openEditor(null)}
          onDirty={setFormDirty}
        />
      )}

      <Card>
        <CardHeader
          icon={<MdStore />}
          title="Список магазинів"
          description={
            stores ? (
              <span className="inline-flex items-center gap-1">
                <MdInfoOutline aria-hidden="true" /> Зараз на сайті: <b className="tabular-nums">{activeCount}</b> з {stores.length}
              </span>
            ) : undefined
          }
        />
        <CardBody className="p-0 sm:p-0">
          {!stores ? (
            <div className="flex flex-col gap-2 p-4">
              <Skeleton height={56} />
              <Skeleton height={56} />
              <Skeleton height={56} />
            </div>
          ) : (
            <Table
              caption="Магазини"
              columns={columns}
              rows={stores}
              renderCard={renderCard}
              empty={{
                icon: <MdLocationOn />,
                title: "Ще немає жодного магазину",
                text: "Додайте адресу, графік роботи й посилання на Google Maps, щоб покупці могли прийти до вас або забрати замовлення самостійно. Поки немає активних магазинів, посилання «Магазини» в шапці сайту (у режимі «Автоматично») не показується.",
                action:
                  editing === null ? (
                    <Button icon={<MdAdd />} onClick={() => openEditor("new")}>
                      Додати перший магазин
                    </Button>
                  ) : null,
              }}
            />
          )}
        </CardBody>
      </Card>

      {confirmEl}
    </div>
  );
};

export default StoreLocations;
