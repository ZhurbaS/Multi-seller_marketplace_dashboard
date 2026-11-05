import { useId, useRef, useState } from "react";
import { MdClose, MdOutlineCloudUpload } from "react-icons/md";
import { cx, IconButton } from "../../ui";

/**
 * ImageDropzone — вибір зображення кліком або drag&drop, з прев'ю.
 * onFile(file) — обраний File; preview — URL для показу (поточне або нове зображення);
 * onClear — прибрати (необов'язково); accept (image/*); maxSizeMb (5); label/hint; invalid; disabled.
 * Підтримує клавіатуру (Enter/Пробіл). Помилки типу/розміру — інлайн.
 */
export default function ImageDropzone({
  onFile,
  preview,
  onClear,
  accept = "image/*",
  maxSizeMb = 5,
  label = "Перетягніть зображення сюди або натисніть, щоб обрати",
  hint = "PNG, JPG або WEBP",
  invalid = false,
  disabled = false,
  className,
  heightClass = "h-48",
  id,
  ...rest
}) {
  const auto = useId();
  const inputId = id || `drop${auto}`;
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);
  const [err, setErr] = useState("");

  const take = (file) => {
    if (!file) return;
    if (accept === "image/*" && !String(file.type || "").startsWith("image/")) {
      setErr("Оберіть файл зображення");
      return;
    }
    if (maxSizeMb && file.size > maxSizeMb * 1024 * 1024) {
      setErr(`Файл завеликий (максимум ${maxSizeMb} МБ)`);
      return;
    }
    setErr("");
    onFile?.(file);
  };

  return (
    <div className={cx("min-w-0", className)}>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled || undefined}
        aria-label={preview ? "Замінити зображення" : label}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
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
          if (!disabled) take(e.dataTransfer?.files?.[0]);
        }}
        className={cx(
          "relative flex w-full min-w-0 cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-(--r-lg) border-2 border-dashed bg-(--surface-2) p-4 text-center transition-colors",
          heightClass,
          drag ? "border-(--brand) bg-(--brand-soft)" : invalid || err ? "border-(--danger)" : "border-(--line) hover:border-(--brand)",
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        {preview ? (
          <>
            <img src={preview} alt="Прев'ю зображення" className="h-full w-full object-contain" />
            <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-(--surface)/90 px-3 py-1 text-xs font-medium text-(--ink) shadow-(--shadow-1)">
              Натисніть або перетягніть, щоб замінити
            </span>
          </>
        ) : (
          <>
            <MdOutlineCloudUpload aria-hidden="true" className="text-3xl text-(--ink-2)" />
            <span className="text-sm font-medium text-(--ink)">{label}</span>
            {hint && <span className="text-xs text-(--ink-2)">{hint}{maxSizeMb ? ` · до ${maxSizeMb} МБ` : ""}</span>}
          </>
        )}
        {preview && onClear && !disabled && (
          <IconButton
            icon={<MdClose />}
            label="Прибрати зображення"
            size="sm"
            variant="secondary"
            className="absolute right-2 top-2"
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
          />
        )}
      </div>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        className="sr-only"
        tabIndex={-1}
        disabled={disabled}
        onChange={(e) => {
          take(e.target.files?.[0]);
          e.target.value = "";
        }}
        {...rest}
      />
      {err && (
        <p role="alert" className="mt-1.5 text-xs font-medium text-(--danger)">
          {err}
        </p>
      )}
    </div>
  );
}
