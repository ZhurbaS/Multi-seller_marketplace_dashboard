import React, { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { MdAdd, MdArrowDownward, MdArrowUpward, MdContentCopy, MdDeleteOutline, MdEdit, MdImage, MdRestartAlt, MdWarningAmber } from "react-icons/md";
import { Button, ConfirmDialog, EmptyState, IconButton, Badge } from "../../../ui";
import api from "../../../api/api";
import {
  AUDIENCE_LABEL,
  DEVICE_LABEL,
  PLACEMENT_COLORS,
  ctrOf,
  errMsg,
  fmtDate,
  fmtNum,
  linkSummary,
  sizeLabel,
  statusOf,
} from "./bannerUtils";
import { BannerVisual } from "./BannerPreview";
import { Card, Notice, Segmented, StatusChip, Toggle } from "./ui";

const IconBtn = ({ label, onClick, disabled, danger, children }) => (
  <IconButton
    icon={children}
    label={label}
    disabled={disabled}
    onClick={onClick}
    variant="secondary"
    className={danger ? "text-(--danger)! hover:bg-(--danger-soft)!" : undefined}
  />
);

const BannerCard = ({ b, i, count, placement, overLimit, busy, settings, onToggle, onMove, onEdit, onDuplicate, onDelete, onReset }) => {
  const [mode, setMode] = useState("desktop");
  const status = statusOf(b);
  const hasMobile = b.kind === "image" && (placement.mobile || b.imageMobile?.url);
  const ctr = ctrOf(b);
  return (
    <li className="flex w-full min-w-0 flex-col gap-4 rounded-(--r-lg) border border-(--line) bg-(--surface) p-4 text-(--ink) shadow-(--shadow-1) md:flex-row">
      <div className="w-full md:w-72 shrink-0 flex flex-col gap-2">
        <div className={mode === "mobile" ? "w-[55%] mx-auto" : ""}>
          <BannerVisual
            b={b}
            placement={placement}
            mode={mode}
            desktopUrl={b.imageDesktop?.url}
            mobileUrl={b.imageMobile?.url}
            dismissible={placement.id === "announcement" && settings?.announcement?.dismissible !== false}
            compact
          />
        </div>
        {hasMobile && (
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <Segmented
              label={`Прев'ю банера ${b.name}`}
              value={mode}
              onChange={setMode}
              size="sm"
              options={[
                ["desktop", "ПК"],
                ["mobile", "Мобільний"],
              ]}
            />
            {mode === "mobile" && !b.imageMobile?.url && <span className="text-xs text-(--ink-2)">обрізано з ПК-версії</span>}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium tabular-nums text-(--ink-2)" title="Пріоритет (порядок показу)">
            #{i + 1}
          </span>
          <h3 className="font-semibold break-words">{b.name}</h3>
          <StatusChip status={status} />
          {overLimit && (
            <Badge tone="danger" icon={<MdWarningAmber />}>
              понад ліміт — не показується
            </Badge>
          )}
        </div>
        <div className="flex flex-col gap-0.5 text-sm text-(--ink-2)">
          <span>
            {b.startAt ? `З ${fmtDate(b.startAt)}` : "Одразу"} · {b.endAt ? `до ${fmtDate(b.endAt)}` : "безстроково"}
          </span>
          <span>
            {DEVICE_LABEL[b.device] || DEVICE_LABEL.all} · {AUDIENCE_LABEL[b.audience] || AUDIENCE_LABEL.all}
            {placement.categories && (b.categories?.length ? ` · Категорії: ${b.categories.join(", ")}` : " · Усі категорії")}
          </span>
          <span className="break-all">{linkSummary(b)}</span>
          {b.kind === "image" && !b.alt && (
            <span className="inline-flex items-center gap-1 font-medium text-(--warning-ink)">
              <MdWarningAmber aria-hidden="true" /> Немає alt-тексту
            </span>
          )}
        </div>
        <dl className="grid grid-cols-3 gap-2 text-center mt-1 max-w-[360px]">
          {[
            ["Перегляди", fmtNum(b.impressions)],
            ["Кліки", fmtNum(b.clicks)],
            ["CTR", `${ctr.toFixed(1).replace(".", ",")}%`],
          ].map(([k, v]) => (
            <div key={k} className="rounded-(--r-md) bg-(--surface-2) px-2 py-1.5">
              <dt className="text-xs text-(--ink-2)">{k}</dt>
              <dd className="font-semibold tabular-nums text-sm">{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="flex md:flex-col items-center md:items-end justify-between gap-2 flex-wrap">
        <Toggle checked={!!b.active} disabled={busy} onChange={(v) => onToggle(b, v)} label="Увімкнено" srLabel={`Увімкнено: ${b.name}`} />
        <div className="flex gap-1 flex-wrap justify-end">
          <IconBtn label="Вище (вищий пріоритет)" disabled={i === 0 || busy} onClick={() => onMove(i, -1)}>
            <MdArrowUpward />
          </IconBtn>
          <IconBtn label="Нижче" disabled={i === count - 1 || busy} onClick={() => onMove(i, 1)}>
            <MdArrowDownward />
          </IconBtn>
          <IconBtn label="Редагувати" onClick={() => onEdit(b)}>
            <MdEdit />
          </IconBtn>
          <IconBtn label="Дублювати" disabled={busy} onClick={() => onDuplicate(b)}>
            <MdContentCopy />
          </IconBtn>
          <IconBtn label="Скинути статистику" disabled={busy} onClick={() => onReset(b)}>
            <MdRestartAlt />
          </IconBtn>
          <IconBtn label="Видалити" danger disabled={busy} onClick={() => onDelete(b)}>
            <MdDeleteOutline />
          </IconBtn>
        </div>
      </div>
    </li>
  );
};

const PlacementTab = ({ placement, banners, setBanners, onEdit, onCreate, settings, legacyCount }) => {
  const [busyId, setBusyId] = useState("");
  const [confirm, setConfirm] = useState(null); // {type:'delete'|'reset', b}
  const closeConfirm = useCallback(() => setConfirm(null), []);

  const list = banners; // уже відсортовано за sort
  const liveIds = list.filter((b) => statusOf(b) === "live").map((b) => b._id);
  const overIds = new Set(liveIds.slice(placement.max));
  const color = PLACEMENT_COLORS[placement.id] || "var(--chart-1)";

  const replace = (nb) => setBanners((all) => all.map((x) => (x._id === nb._id ? nb : x)));

  const onToggle = async (b, active) => {
    setBusyId(b._id);
    try {
      const { data } = await api.put(`/admin/banners/${b._id}/active`, { active });
      replace(data.banner || { ...b, active, status: undefined });
      toast.success(data.message || (active ? "Банер увімкнено" : "Банер вимкнено"));
    } catch (err) {
      toast.error(errMsg(err, "Не вдалося змінити"));
    } finally {
      setBusyId("");
    }
  };

  const onMove = async (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    const sorted = next.map((b, k) => ({ ...b, sort: k }));
    let prev;
    setBanners((all) => {
      prev = all;
      const others = all.filter((b) => b.placement !== placement.id);
      return [...others, ...sorted];
    });
    try {
      await api.put("/admin/banners/reorder", { placement: placement.id, ids: sorted.map((b) => b._id) });
    } catch (err) {
      if (prev) setBanners(prev);
      toast.error(errMsg(err, "Не вдалося змінити порядок"));
    }
  };

  const onDuplicate = async (b) => {
    setBusyId(b._id);
    try {
      const { data } = await api.post(`/admin/banners/${b._id}/duplicate`);
      const copy = { ...data.banner, sort: data.banner?.sort ?? b.sort + 0.5 };
      setBanners((all) => {
        const idx = all.findIndex((x) => x._id === b._id);
        const out = [...all];
        out.splice(idx + 1, 0, copy);
        return out;
      });
      toast.success(data.message || "Створено копію (вимкнена)");
    } catch (err) {
      toast.error(errMsg(err, "Не вдалося дублювати"));
    } finally {
      setBusyId("");
    }
  };

  const doConfirm = async () => {
    const { type, b } = confirm;
    setBusyId(b._id);
    try {
      if (type === "delete") {
        const { data } = await api.delete(`/admin/banners/${b._id}`);
        setBanners((all) => all.filter((x) => x._id !== b._id));
        toast.success(data?.message || "Банер видалено");
      } else {
        const { data } = await api.post(`/admin/banners/${b._id}/reset-stats`);
        replace(data?.banner || { ...b, impressions: 0, clicks: 0, ctr: 0 });
        toast.success(data?.message || "Статистику скинуто");
      }
      setConfirm(null);
    } catch (err) {
      toast.error(errMsg(err, "Не вдалося виконати дію"));
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-4" style={{ borderLeft: `6px solid ${color}` }}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold">{placement.name}</h2>
            <p className="mt-0.5 text-sm text-(--ink-2)">{placement.where}</p>
          </div>
          <Button icon={<MdAdd />} onClick={onCreate} className="shrink-0">
            Додати банер
          </Button>
        </div>
        <dl className="grid sm:grid-cols-3 gap-2 text-sm">
          {placement.kind === "text" ? (
            <div className="rounded-(--r-md) bg-(--surface-2) p-3 sm:col-span-2">
              <dt className="text-xs text-(--ink-2)">Формат</dt>
              <dd>Текстова смуга: колір фону, текст і посилання. Тримайте текст коротким (до ~80 символів).</dd>
            </div>
          ) : (
            <>
              <div className="rounded-(--r-md) bg-(--surface-2) p-3">
                <dt className="text-xs text-(--ink-2)">ПК</dt>
                <dd className="font-medium">{sizeLabel(placement.desktop)}</dd>
              </div>
              <div className="rounded-(--r-md) bg-(--surface-2) p-3">
                <dt className="text-xs text-(--ink-2)">Мобільний</dt>
                <dd className="font-medium">{sizeLabel(placement.mobile)}</dd>
              </div>
            </>
          )}
          <div className="rounded-(--r-md) bg-(--surface-2) p-3">
            <dt className="text-xs text-(--ink-2)">Показується одночасно</dt>
            <dd className="font-medium">
              до {placement.max} · зараз «живих»: {liveIds.length}
            </dd>
          </div>
        </dl>
        <p className="text-xs text-(--ink-2)">
          Порядок у списку = пріоритет: банер №1 показується першим
          {placement.id === "home_hero" ? " (саме перший слайд бачать найчастіше — ставте туди найважливіше)" : ""}.
          {placement.kind === "image" && " Важливий текст і логотип тримайте в центральних 60% ширини — на телефонах краї обрізаються."}
        </p>
      </Card>

      {liveIds.length > placement.max && (
        <Notice tone="warn">
          Увімкнено й діє {liveIds.length} банерів, а це місце показує щонайбільше {placement.max}.{" "}
          <b>Показуватимуться перші {placement.max}</b> за порядком (з урахуванням пристрою, аудиторії
          {placement.categories ? " і категорії" : ""}); решту позначено «понад ліміт».
        </Notice>
      )}
      {list.length > 0 && liveIds.length === 0 && (
        <Notice tone="warn">
          Зараз у цьому місці не показується жоден банер.
          {placement.id === "home_hero" && legacyCount > 0
            ? " На головній як запасний варіант показуються старі банери продавців."
            : " Увімкніть банер або перевірте дати показу."}
        </Notice>
      )}

      {list.length === 0 ? (
        <Card>
          <EmptyState
            icon={<MdImage />}
            title="Тут ще немає банерів"
            action={
              <Button icon={<MdAdd />} onClick={onCreate}>
                Додати перший банер
              </Button>
            }
            text={
              <>
            {placement.kind === "text"
              ? "Стрічка оголошення — тонка смуга над шапкою для важливих новин: безкоштовна доставка, графік у свята, акція."
              : `Підготуйте зображення ${sizeLabel(placement.desktop)} для ПК і, за бажання, окреме ${sizeLabel(placement.mobile)} для телефонів.`}{" "}
            Новий банер можна зберегти вимкненим і увімкнути, коли все перевірите.
            {placement.id === "home_hero" && legacyCount > 0 && " Поки тут порожньо, на головній показуються старі банери продавців."}
              </>
            }
          />
        </Card>
      ) : (
        <ul className="flex flex-col gap-3" aria-label={`Банери: ${placement.name}`}>
          {list.map((b, i) => (
            <BannerCard
              key={b._id}
              b={b}
              i={i}
              count={list.length}
              placement={placement}
              overLimit={overIds.has(b._id)}
              busy={busyId === b._id}
              settings={settings}
              onToggle={onToggle}
              onMove={onMove}
              onEdit={onEdit}
              onDuplicate={onDuplicate}
              onDelete={(x) => setConfirm({ type: "delete", b: x })}
              onReset={(x) => setConfirm({ type: "reset", b: x })}
            />
          ))}
        </ul>
      )}

      {confirm && (
        <ConfirmDialog
          open
          title={confirm.type === "delete" ? "Видалити банер?" : "Скинути статистику?"}
          text={
            confirm.type === "delete"
              ? `«${confirm.b.name}» і його зображення буде видалено назавжди. Щоб лише тимчасово сховати банер — вимкніть перемикач «Увімкнено».`
              : `Перегляди й кліки банера «${confirm.b.name}» буде обнулено. Корисно перед новою кампанією.`
          }
          confirmLabel={confirm.type === "delete" ? "Видалити" : "Скинути"}
          tone={confirm.type === "delete" ? "danger" : "brand"}
          loading={busyId === confirm.b._id}
          onConfirm={doConfirm}
          onClose={closeConfirm}
        />
      )}
    </div>
  );
};

export default PlacementTab;
