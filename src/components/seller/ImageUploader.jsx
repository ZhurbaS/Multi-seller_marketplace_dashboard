import { useId, useRef, useState } from "react";
import toast from "react-hot-toast";
import { MdAddPhotoAlternate, MdChevronLeft, MdChevronRight, MdDeleteOutline, MdDragIndicator, MdSwapHoriz } from "react-icons/md";
import { IconButton, Spinner, cx } from "../../ui";

const DRAG_TYPE = "application/x-ts-image-index";

function pickImages(fileList, maxSizeMb) {
  const files = Array.from(fileList || []);
  const ok = [];
  let skippedType = 0;
  let skippedSize = 0;
  for (const f of files) {
    if (!f.type?.startsWith("image/")) skippedType++;
    else if (maxSizeMb && f.size > maxSizeMb * 1024 * 1024) skippedSize++;
    else ok.push(f);
  }
  if (skippedType) toast.error(`Пропущено файлів не-зображень: ${skippedType}`);
  if (skippedSize) toast.error(`Пропущено файлів понад ${maxSizeMb} МБ: ${skippedSize}`);
  return ok;
}

/**
 * ImageUploader — сітка прев'ю з drag&drop.
 * items: [{ url }]; onAdd(files[]) — додати (якщо немає — зона додавання не показується);
 * onRemove(i); onReplace(i, file); onMove(from, to) — перевпорядкування (перетягування або стрілки);
 * max — ліміт кількості; busyIndex — індекс плитки зі спінером; invalid — червона рамка зони.
 * id — для Field (фокус на зону додавання), aria-describedby передається на кнопку додавання.
 */
export default function ImageUploader({
  items = [],
  onAdd,
  onRemove,
  onReplace,
  onMove,
  max = 10,
  maxSizeMb = 10,
  busyIndex = null,
  disabled = false,
  invalid = false,
  id,
  addLabel = "Додати фото",
  mainLabel = "Головне",
  "aria-describedby": describedBy,
}) {
  const auto = useId();
  const inputId = id || `img${auto}`;
  const addInputRef = useRef(null);
  const replaceRefs = useRef({});
  const [dragOverZone, setDragOverZone] = useState(false);
  const [dragOverTile, setDragOverTile] = useState(null);
  const canAdd = !!onAdd && items.length < max && !disabled;

  const add = (fileList) => {
    const files = pickImages(fileList, maxSizeMb);
    if (!files.length) return;
    const room = max - items.length;
    if (files.length > room) toast.error(`Можна додати ще ${Math.max(0, room)} фото (максимум ${max})`);
    const slice = files.slice(0, Math.max(0, room));
    if (slice.length) onAdd(slice);
  };

  const onZoneDrop = (e) => {
    e.preventDefault();
    setDragOverZone(false);
    if (!canAdd) return;
    if (e.dataTransfer.files?.length) add(e.dataTransfer.files);
  };

  const onTileDragStart = (e, i) => {
    if (!onMove) return;
    e.dataTransfer.setData(DRAG_TYPE, String(i));
    e.dataTransfer.effectAllowed = "move";
  };

  const onTileDrop = (e, i) => {
    e.preventDefault();
    setDragOverTile(null);
    if (disabled) return;
    const from = e.dataTransfer.getData(DRAG_TYPE);
    if (from !== "" && onMove) {
      const f = Number(from);
      if (Number.isInteger(f) && f !== i) onMove(f, i);
      return;
    }
    if (e.dataTransfer.files?.length && onReplace) {
      const [file] = pickImages(e.dataTransfer.files, maxSizeMb);
      if (file) onReplace(i, file);
    }
  };

  return (
    <div className="min-w-0">
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" aria-label="Зображення товару">
        {items.map((img, i) => {
          const busy = busyIndex === i;
          return (
            <li
              key={`${img.url}-${i}`}
              draggable={!!onMove && !disabled}
              onDragStart={(e) => onTileDragStart(e, i)}
              onDragOver={(e) => {
                if (disabled || (!onMove && !onReplace)) return;
                e.preventDefault();
                setDragOverTile(i);
              }}
              onDragLeave={() => setDragOverTile((t) => (t === i ? null : t))}
              onDrop={(e) => onTileDrop(e, i)}
              className={cx(
                "group relative aspect-square min-w-0 overflow-hidden rounded-(--r-md) border bg-(--surface-2)",
                dragOverTile === i ? "border-(--brand) ring-2 ring-(--brand)/30" : "border-(--line)",
                onMove && !disabled && "cursor-grab active:cursor-grabbing",
              )}
            >
              <img src={img.url} alt={`Фото ${i + 1}`} className="h-full w-full object-cover" loading="lazy" draggable={false} />
              {i === 0 && items.length > 1 && (
                <span className="absolute left-2 top-2 rounded-full bg-(--brand) px-2 py-0.5 text-xs font-semibold text-(--on-brand) shadow-(--shadow-1)">
                  {mainLabel}
                </span>
              )}
              {onMove && !disabled && (
                <span aria-hidden="true" className="absolute right-2 top-2 hidden rounded-(--r-sm) bg-(--surface)/90 p-0.5 text-(--ink-2) sm:group-hover:inline-flex">
                  <MdDragIndicator />
                </span>
              )}
              {busy && (
                <span className="absolute inset-0 flex items-center justify-center bg-(--overlay) text-2xl text-(--on-brand)">
                  <Spinner label="Завантаження фото" />
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-(--surface)/90 p-1 backdrop-blur-sm">
                <div className="flex items-center">
                  {onMove && (
                    <>
                      <IconButton size="sm" icon={<MdChevronLeft />} label={`Посунути фото ${i + 1} ліворуч`} disabled={disabled || i === 0} onClick={() => onMove(i, i - 1)} />
                      <IconButton size="sm" icon={<MdChevronRight />} label={`Посунути фото ${i + 1} праворуч`} disabled={disabled || i === items.length - 1} onClick={() => onMove(i, i + 1)} />
                    </>
                  )}
                </div>
                <div className="flex items-center">
                  {onReplace && (
                    <>
                      <IconButton
                        size="sm"
                        icon={<MdSwapHoriz />}
                        label={`Замінити фото ${i + 1}`}
                        disabled={disabled || busy}
                        onClick={() => replaceRefs.current[i]?.click()}
                      />
                      <input
                        ref={(n) => {
                          replaceRefs.current[i] = n;
                        }}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        tabIndex={-1}
                        onChange={(e) => {
                          const [file] = pickImages(e.target.files, maxSizeMb);
                          if (file) onReplace(i, file);
                          e.target.value = "";
                        }}
                      />
                    </>
                  )}
                  {onRemove && (
                    <IconButton
                      size="sm"
                      icon={<MdDeleteOutline />}
                      label={`Видалити фото ${i + 1}`}
                      disabled={disabled || busy}
                      onClick={() => onRemove(i)}
                      className="text-(--danger)"
                    />
                  )}
                </div>
              </div>
            </li>
          );
        })}

        {onAdd && (
          <li className="min-w-0">
            <button
              id={inputId}
              type="button"
              disabled={!canAdd}
              aria-describedby={describedBy}
              aria-invalid={invalid || undefined}
              onClick={() => addInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                if (canAdd) setDragOverZone(true);
              }}
              onDragLeave={() => setDragOverZone(false)}
              onDrop={onZoneDrop}
              className={cx(
                "flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-(--r-md) border-2 border-dashed p-3 text-center transition-colors",
                "disabled:cursor-not-allowed disabled:opacity-55",
                dragOverZone
                  ? "border-(--brand) bg-(--brand-soft) text-(--brand-ink)"
                  : invalid
                    ? "border-(--danger) bg-(--danger-soft) text-(--danger)"
                    : "border-(--line-strong)/60 bg-(--surface-2) text-(--ink-2) hover:border-(--brand) hover:text-(--brand-ink)",
              )}
            >
              <MdAddPhotoAlternate aria-hidden="true" className="text-3xl" />
              <span className="text-sm font-semibold">{addLabel}</span>
              <span className="text-xs">
                {dragOverZone ? "Відпустіть, щоб додати" : "Перетягніть сюди або натисніть"}
                <br />
                {items.length} / {max}
              </span>
            </button>
            <input
              ref={addInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              tabIndex={-1}
              onChange={(e) => {
                add(e.target.files);
                e.target.value = "";
              }}
            />
          </li>
        )}
      </ul>
    </div>
  );
}
