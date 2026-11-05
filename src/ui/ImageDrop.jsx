// ДОДАНО (агент «адмін: налаштування сайту/маркетинг»): drag&drop зображення з прев'ю.
import { useEffect, useId, useRef, useState } from "react";
import { MdCloudUpload, MdDelete, MdSwapHoriz } from "react-icons/md";
import { cx } from "./cx";
import { Button } from "./Button";

/**
 * ImageDrop({ value: File|string|null, onChange(file|null), accept="image/*", maxSizeMb,
 *             label, hint, error, required, disabled, previewClassName, removable=true,
 *             validate?(file) → string|"" , emptyText })
 * Зона перетягування + клік/Enter, прев'ю (object URL для File), кнопки «Замінити»/«Прибрати».
 */
export function ImageDrop({
  value,
  onChange,
  accept = "image/*",
  maxSizeMb,
  label,
  hint,
  error,
  required = false,
  disabled = false,
  removable = true,
  validate,
  previewClassName,
  emptyText = "Перетягніть зображення сюди або натисніть, щоб обрати",
  className,
  id,
}) {
  const auto = useId();
  const fid = id || `img${auto}`;
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);
  const [localErr, setLocalErr] = useState("");
  const [objUrl, setObjUrl] = useState("");

  useEffect(() => {
    if (value && typeof value === "object" && "size" in value) {
      const u = URL.createObjectURL(value);
      setObjUrl(u);
      return () => URL.revokeObjectURL(u);
    }
    setObjUrl("");
    return undefined;
  }, [value]);

  const src = typeof value === "string" ? value : objUrl;

  const take = (file) => {
    if (!file || disabled) return;
    setLocalErr("");
    if (accept && accept.startsWith("image") && !String(file.type || "").startsWith("image/")) {
      setLocalErr("Оберіть файл зображення (JPG, PNG, WebP, SVG).");
      return;
    }
    if (maxSizeMb && file.size > maxSizeMb * 1024 * 1024) {
      setLocalErr(`Файл завеликий: максимум ${maxSizeMb} МБ.`);
      return;
    }
    const v = validate?.(file);
    if (v) {
      setLocalErr(v);
      return;
    }
    onChange?.(file);
  };

  const shownErr = localErr || error;
  const helpId = `${fid}-help`;
  const errId = `${fid}-err`;

  return (
    <div className={cx("flex min-w-0 flex-col gap-1.5", className)}>
      {label && (
        <span id={`${fid}-label`} className="text-sm font-medium text-(--ink)">
          {label}
          {required && (
            <span className="ml-0.5 text-(--danger)" aria-hidden="true">
              *
            </span>
          )}
        </span>
      )}
      {src ? (
        <div className="flex min-w-0 flex-col gap-2 rounded-(--r-md) border border-(--line) bg-(--surface-2) p-2 sm:flex-row sm:items-center">
          <img
            src={src}
            alt={label ? `Прев'ю: ${label}` : "Прев'ю зображення"}
            className={cx("max-h-40 w-full rounded-(--r-sm) bg-(--surface) object-contain sm:w-48", previewClassName)}
          />
          <div className="flex min-w-0 flex-wrap gap-2 sm:flex-col">
            {value && typeof value === "object" && (
              <span className="truncate text-xs text-(--ink-2)" title={value.name}>
                {value.name} · {Math.round(value.size / 1024)} КБ
              </span>
            )}
            <Button size="sm" variant="secondary" icon={<MdSwapHoriz />} disabled={disabled} onClick={() => inputRef.current?.click()}>
              Замінити
            </Button>
            {removable && (
              <Button size="sm" variant="ghost" icon={<MdDelete />} disabled={disabled} onClick={() => onChange?.(null)} className="text-(--danger)">
                Прибрати
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-disabled={disabled || undefined}
          aria-labelledby={label ? `${fid}-label` : undefined}
          aria-label={label ? undefined : emptyText}
          aria-describedby={[hint && helpId, shownErr && errId].filter(Boolean).join(" ") || undefined}
          onClick={() => !disabled && inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              if (!disabled) inputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            take(e.dataTransfer.files?.[0]);
          }}
          className={cx(
            "flex min-h-28 w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-(--r-md) border-2 border-dashed p-4 text-center transition-colors",
            drag ? "border-(--brand) bg-(--brand-soft)" : shownErr ? "border-(--danger)" : "border-(--line-strong)/60 hover:bg-(--surface-2)",
            disabled && "cursor-not-allowed opacity-60",
          )}
        >
          <MdCloudUpload aria-hidden="true" className="text-3xl text-(--ink-2)" />
          <span className="text-sm font-medium text-(--ink)">{emptyText}</span>
          {maxSizeMb && <span className="text-xs text-(--ink-2)">до {maxSizeMb} МБ</span>}
        </div>
      )}
      <input
        ref={inputRef}
        id={fid}
        type="file"
        accept={accept}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          take(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {hint && !shownErr && (
        <p id={helpId} className="text-xs text-(--ink-2)">
          {hint}
        </p>
      )}
      {shownErr && (
        <p id={errId} role="alert" className="text-xs font-medium text-(--danger)">
          {shownErr}
        </p>
      )}
    </div>
  );
}
