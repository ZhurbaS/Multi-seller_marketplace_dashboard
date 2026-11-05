import React, { useRef, useState } from "react";
import { MdCloudUpload, MdDeleteOutline, MdErrorOutline, MdSwapHoriz, MdWarningAmber } from "react-icons/md";
import { Button, cx } from "../../../ui";
import { ALLOWED_MIME, checkImage, fmtRatio, readImageSize, sizeLabel } from "./bannerUtils";

// Прев'ю обрізання: що лишиться при object-cover під цільове співвідношення + safe-zone 60% центру
export const CropPreview = ({ src, srcRatio, cropRatio, caption }) => {
  if (!src || !srcRatio || !cropRatio) return null;
  let w = 1;
  let h = 1;
  if (cropRatio < srcRatio) w = cropRatio / srcRatio;
  else h = srcRatio / cropRatio;
  const left = ((1 - w) / 2) * 100;
  const top = ((1 - h) / 2) * 100;
  return (
    <figure className="flex flex-col gap-1">
      <div className="relative w-full overflow-hidden rounded-(--r-md) border border-(--line) bg-(--surface-2)" style={{ aspectRatio: String(srcRatio) }}>
        <img src={src} alt="" className="absolute inset-0 w-full h-full object-fill" />
        {/* затемнення частин, що буде обрізано */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute bg-(--overlay)" style={{ left: 0, top: 0, width: `${left}%`, height: "100%" }} />
          <div className="absolute bg-(--overlay)" style={{ right: 0, top: 0, width: `${left}%`, height: "100%" }} />
          <div className="absolute bg-(--overlay)" style={{ left: `${left}%`, top: 0, width: `${w * 100}%`, height: `${top}%` }} />
          <div className="absolute bg-(--overlay)" style={{ left: `${left}%`, bottom: 0, width: `${w * 100}%`, height: `${top}%` }} />
          <div
            className="absolute border-2 border-(--surface)"
            style={{ left: `${left}%`, top: `${top}%`, width: `${w * 100}%`, height: `${h * 100}%` }}
          />
          <div
            className="absolute border-2 border-dashed border-(--warning)"
            style={{ left: `${left + w * 20}%`, top: `${top}%`, width: `${w * 60}%`, height: `${h * 100}%` }}
          />
        </div>
      </div>
      <figcaption className="text-xs text-(--ink-2)">
        {caption} Біла рамка — видима частина ({fmtRatio(cropRatio)}), жовта пунктирна — безпечна зона (60% центру): тримайте
        текст і логотип у ній.
      </figcaption>
    </figure>
  );
};

const ImageField = ({ id, label, target, url, file, onFile, onRemove, error, limits, required, hint, existingDims, onDims }) => {
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);
  const [localErr, setLocalErr] = useState("");
  const [warnings, setWarnings] = useState([]);
  const [dims, setDims] = useState(existingDims || null);

  const accept = async (f) => {
    if (!f) return;
    setLocalErr("");
    setWarnings([]);
    const d = await readImageSize(f);
    const res = checkImage(f, d, target, limits);
    if (res.error) {
      URL.revokeObjectURL(d.url);
      setLocalErr(res.error);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setWarnings(res.warnings);
    setDims({ width: d.width, height: d.height });
    onDims?.({ width: d.width, height: d.height });
    onFile(f, d.url);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    accept(e.dataTransfer.files?.[0]);
  };

  const shownErr = localErr || error;
  const ratio = dims?.width && dims?.height ? dims.width / dims.height : null;
  const targetRatio = target ? target.width / target.height : null;
  const mismatch = ratio && targetRatio && Math.abs(ratio - targetRatio) / targetRatio > 0.08;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <span id={`${id}-label`} className="text-sm font-medium text-(--ink)">
          {label}
          {required && (
            <span className="ml-0.5 text-(--danger)" aria-hidden="true">
              *
            </span>
          )}
        </span>
        {target && <span className="text-xs text-(--ink-2)">Рекомендовано {sizeLabel(target)}</span>}
      </div>

      {url ? (
        <div className="flex flex-col gap-2">
          {mismatch ? (
            <CropPreview src={url} srcRatio={ratio} cropRatio={targetRatio} caption="Так зображення обріжеться на сайті." />
          ) : (
            <img
              src={url}
              alt=""
              className="max-h-56 w-full rounded-(--r-md) border border-(--line) bg-(--surface-2) object-contain"
              onLoad={(e) => {
                if (!dims) {
                  const d = { width: e.currentTarget.naturalWidth, height: e.currentTarget.naturalHeight };
                  setDims(d);
                  onDims?.(d);
                }
              }}
            />
          )}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {dims?.width ? (
              <span className="mr-auto text-(--ink-2) tabular-nums">
                {dims.width}×{dims.height} px ({fmtRatio(ratio)}){file ? ` · ${(file.size / 1024).toFixed(0)} КБ` : ""}
              </span>
            ) : null}
            <Button size="sm" variant="secondary" icon={<MdSwapHoriz />} onClick={() => inputRef.current?.click()}>
              Замінити
            </Button>
            {onRemove && (
              <Button
                size="sm"
                variant="ghost"
                icon={<MdDeleteOutline />}
                className="text-(--danger)!"
                onClick={() => {
                  setDims(null);
                  setWarnings([]);
                  onRemove();
                }}
              >
                Прибрати
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          aria-labelledby={`${id}-label`}
          aria-describedby={`${id}-help`}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
          aria-invalid={!!shownErr}
          className={cx(
            "flex min-h-32 w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-(--r-md) border-2 border-dashed p-5 text-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--brand)",
            drag
              ? "border-(--brand) bg-(--brand-soft)"
              : shownErr
              ? "border-(--danger) bg-(--danger-soft)"
              : "border-(--line-strong) bg-(--surface-2) hover:border-(--brand) hover:bg-(--brand-soft)"
          )}
        >
          <MdCloudUpload className="text-3xl text-(--brand-ink)" aria-hidden="true" />
          <span className="text-sm font-medium text-(--ink)">{drag ? "Відпустіть файл" : "Перетягніть файл сюди або натисніть, щоб обрати"}</span>
          <span id={`${id}-help`} className="text-xs text-(--ink-2)">
            JPG, PNG, WebP, AVIF · до {limits?.maxImageMB || 2} МБ · ширина від {limits?.minImageWidth || 600} px
          </span>
        </div>
      )}
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={ALLOWED_MIME.join(",")}
        className="hidden"
        onChange={(e) => accept(e.target.files?.[0])}
      />
      {hint && <span className="text-xs text-(--ink-2)">{hint}</span>}
      {warnings.map((w) => (
        <span key={w} className="inline-flex items-start gap-1.5 text-xs font-medium text-(--warning-ink)" role="status">
          <MdWarningAmber aria-hidden="true" className="mt-px shrink-0 text-sm" />
          {w}
        </span>
      ))}
      {shownErr && (
        <span role="alert" className="inline-flex items-start gap-1.5 text-xs font-medium text-(--danger)">
          <MdErrorOutline aria-hidden="true" className="mt-px shrink-0 text-sm" />
          {shownErr}
        </span>
      )}
    </div>
  );
};

export default ImageField;
