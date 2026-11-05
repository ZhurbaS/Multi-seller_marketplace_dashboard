import React, { useRef, useState } from "react";
import { MdArrowBack, MdCheck, MdCheckCircle, MdDownload, MdUploadFile } from "react-icons/md";
import { Button, cx } from "../../../../ui";
import toast from "react-hot-toast";
import api from "../../../../api/api";
import { CRM, errMsg, inputCls, num, saveBlob, toCsv } from "../mkUtils";
import { Counter, Field, Modal, Notice } from "../ui";

const COLUMNS = ["email", "name", "phone", "city", "kind", "tags"];
const MAX_ROWS = 5000;
const MAX_BYTES = 5 * 1024 * 1024;

const StepDots = ({ step }) => (
  <ol className="flex flex-wrap gap-2 text-xs" aria-label="Кроки імпорту">
    {["Файл і згода", "Перевірка", "Готово"].map((t, i) => {
      const cur = step === i + 1;
      const done = step > i + 1;
      return (
        <li
          key={t}
          aria-current={cur ? "step" : undefined}
          className={cx(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-medium",
            cur ? "border-(--brand) bg-(--brand-soft) text-(--brand-ink)" : done ? "border-(--success) bg-(--success-soft) text-(--success)" : "border-(--line) bg-(--surface-2) text-(--ink-2)",
          )}
        >
          <span aria-hidden="true">{done ? <MdCheck /> : `${i + 1}.`}</span>
          {t}
          {done && <span className="sr-only">(виконано)</span>}
        </li>
      );
    })}
  </ol>
);

// Зона вибору CSV: перетягування або клік/Enter
const CsvDrop = ({ id, file, error, onFile }) => {
  const ref = useRef(null);
  const [drag, setDrag] = useState(false);
  return (
    <div
      role="button"
      tabIndex={0}
      data-autofocus
      aria-describedby={`${id}-hint`}
      aria-invalid={!!error || undefined}
      onClick={() => ref.current?.click()}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), ref.current?.click())}
      onDragOver={(e) => (e.preventDefault(), setDrag(true))}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        onFile(e.dataTransfer.files?.[0]);
      }}
      className={cx(
        "flex min-h-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-(--r-md) border-2 border-dashed p-4 text-center text-sm outline-none focus-visible:ring-2 focus-visible:ring-(--brand)",
        drag ? "border-(--brand) bg-(--brand-soft)" : error ? "border-(--danger) bg-(--danger-soft)" : "border-(--line-strong)/60 bg-(--surface) hover:bg-(--surface-2)",
      )}
    >
      <MdUploadFile aria-hidden="true" className="text-3xl text-(--brand-ink)" />
      <span className="font-medium text-(--ink)">{file ? file.name : "Перетягніть CSV сюди або натисніть, щоб обрати"}</span>
      {file && <span className="text-xs text-(--ink-2)">Натисніть, щоб замінити файл</span>}
      <input
        ref={ref}
        id={id}
        type="file"
        accept=".csv,text/csv"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          onFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
};

const Report = ({ r, dry }) => (
  <div className="flex flex-col gap-2">
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {[
        ["Буде створено", "Створено", r.created],
        ["Буде оновлено", "Оновлено", r.updated],
        ["Пропущено", "Пропущено", r.skipped],
        ["З помилками", "З помилками", r.invalidCount ?? (r.invalid?.length || 0)],
      ].map(([a, b, v]) => (
        <div key={a} className="rounded-(--r-md) border border-(--line) bg-(--surface) p-3">
          <span className="block text-xs text-(--ink-2)">{dry ? a : b}</span>
          <span className="text-lg font-semibold text-(--ink) tabular-nums">{num(v || 0)}</span>
        </div>
      ))}
    </div>
    {r.invalid?.length > 0 && (
      <div>
        <div className="flex items-center justify-between gap-2 pb-1">
          <span className="text-xs font-semibold text-(--danger)">Рядки з помилками (не імпортуються):</span>
          <Button
            size="sm"
            variant="secondary"
            icon={<MdDownload />}
            onClick={() => saveBlob(new Blob([toCsv([["row", "reason"], ...r.invalid.map((x) => [x.row, x.reason])])], { type: "text/csv;charset=utf-8" }), "import-errors.csv")}
          >
            Завантажити звіт CSV
          </Button>
        </div>
        <ul className="max-h-48 divide-y divide-(--line) overflow-auto rounded-(--r-md) border border-(--line) bg-(--surface) text-xs text-(--ink)">
          {r.invalid.slice(0, 200).map((x, i) => (
            <li key={i} className="px-3 py-1.5">
              Рядок {x.row}: {x.reason}
            </li>
          ))}
        </ul>
        {r.invalid.length > 200 && <p className="text-xs text-(--ink-2)">…та ще {r.invalid.length - 200} — у звіті CSV.</p>}
      </div>
    )}
  </div>
);

const ImportWizard = ({ onClose, onDone }) => {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [info, setInfo] = useState(null); // {rows, header, missing}
  const [proof, setProof] = useState("");
  const [note, setNote] = useState("");
  const [ack, setAck] = useState(false);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [dry, setDry] = useState(null);
  const [result, setResult] = useState(null);

  const onFile = async (fl) => {
    setFile(null);
    setInfo(null);
    setErrors({});
    if (!fl) return;
    if (!/\.csv$/i.test(fl.name)) return setErrors({ file: "Потрібен файл .csv" });
    if (fl.size > MAX_BYTES) return setErrors({ file: "Файл більший за 5 МБ" });
    const text = await fl.text();
    const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim());
    const header = (lines[0] || "").split(/[;,]/).map((h) => h.trim().replace(/^"|"$/g, "").toLowerCase());
    const rows = Math.max(0, lines.length - 1);
    if (!header.includes("email") && !header.includes("phone")) return setErrors({ file: "У першому рядку мають бути назви колонок, щонайменше email або phone" });
    if (rows > MAX_ROWS) return setErrors({ file: `Забагато рядків: ${num(rows)} (максимум ${num(MAX_ROWS)}). Розділіть файл.` });
    if (!rows) return setErrors({ file: "Файл порожній" });
    setFile(fl);
    setInfo({ rows, header, unknown: header.filter((h) => !COLUMNS.includes(h)) });
  };

  const validate = () => {
    const e = {};
    if (!file) e.file = errors.file || "Оберіть файл";
    if (!proof) e.proof = "Оберіть варіант";
    if (proof === "yes" && note.trim().length < 5) e.note = "Опишіть джерело/доказ згоди";
    if (note.length > 500) e.note = "До 500 символів";
    if (proof === "yes" && !ack) e.ack = "Підтвердіть, що маєте згоду кожного контакту";
    return e;
  };

  const send = async (dryRun) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("consentProof", proof === "yes" ? "true" : "false");
    fd.append("consentNote", note.trim());
    fd.append("dryRun", dryRun ? "true" : "false");
    const { data } = await api.post(`${CRM}/contacts/import`, fd, { headers: { "Content-Type": "multipart/form-data" } });
    return { created: 0, updated: 0, skipped: 0, invalid: [], ...(data?.result || data) };
  };

  const check = async () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      setDry(await send(true));
      setStep(2);
    } catch (err) {
      toast.error(errMsg(err, "Не вдалося перевірити файл"));
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    setBusy(true);
    try {
      const r = await send(false);
      setResult(r);
      setStep(3);
      toast.success("Імпорт завершено");
      onDone?.();
    } catch (err) {
      toast.error(errMsg(err, "Імпорт не вдався"));
    } finally {
      setBusy(false);
    }
  };

  const template = () => saveBlob(new Blob([toCsv([COLUMNS, ["olena@example.com", "Олена Коваль", "+380501234567", "Київ", "person", "vip;опт"]])], { type: "text/csv;charset=utf-8" }), "contacts-template.csv");

  const footer =
    step === 1 ? (
      <>
        <Button variant="secondary" onClick={onClose}>
          Скасувати
        </Button>
        <Button loading={busy} onClick={check}>
          {busy ? "Перевіряємо…" : "Перевірити файл (без змін)"}
        </Button>
      </>
    ) : step === 2 ? (
      <>
        <Button variant="secondary" icon={<MdArrowBack />} onClick={() => setStep(1)}>
          Назад
        </Button>
        <Button loading={busy} disabled={!(dry.created + dry.updated)} onClick={confirm}>
          {busy ? "Імпортуємо…" : `Імпортувати ${num(dry.created + dry.updated)} контактів`}
        </Button>
      </>
    ) : (
      <Button onClick={onClose}>Закрити</Button>
    );

  return (
    <Modal title="Імпорт контактів із CSV" onClose={onClose} width="max-w-[680px]" footer={footer}>
      <StepDots step={step} />
      {step === 1 && (
        <>
          <Notice tone="warn">
            <b>Важливо.</b> Згідно зі ст. 14-3 Закону «Про рекламу» розсилати рекламу можна лише тим, хто <b>заздалегідь дав згоду</b>. Куплені, зібрані з
            сайтів або «старі» бази без підтвердженої згоди імпортуйте як «Без згоди» — вони будуть лише в CRM. Розсилка без згоди — це штрафи, скарги на спам
            і блокування домену відправника.
          </Notice>
          <Field id="imp-file" label="Файл CSV (UTF-8, до 5000 рядків)" required error={errors.file} hint={`Колонки: ${COLUMNS.join(", ")}. Теги — через «;». kind: person або company.`}>
            <CsvDrop id="imp-file" file={file} error={errors.file} onFile={onFile} />
          </Field>
          <Button size="sm" variant="secondary" icon={<MdDownload />} className="self-start" onClick={template}>
            Завантажити шаблон CSV
          </Button>
          {info && (
            <p className="inline-flex flex-wrap items-center gap-1 text-xs text-(--ink)" role="status">
              <MdCheckCircle aria-hidden="true" className="text-(--success)" /> {file.name}: {num(info.rows)} рядків, колонки: {info.header.join(", ")}
              {info.unknown.length > 0 && <span className="font-medium text-(--warning-ink)"> · будуть проігноровані: {info.unknown.join(", ")}</span>}
            </p>
          )}
          <fieldset className="flex flex-col gap-3 rounded-(--r-md) border border-(--line) bg-(--surface-2) p-3 sm:p-4">
            <legend className="px-1 text-sm font-semibold text-(--ink)">Чи мають ці контакти згоду на рекламу? *</legend>
            <label className="flex min-h-11 cursor-pointer items-start gap-2.5 rounded-(--r-md) border border-(--line) bg-(--surface) p-3 has-[:checked]:border-(--brand) has-[:checked]:bg-(--brand-soft)">
              <input type="radio" name="imp-proof" className="mt-0.5 h-5 w-5 shrink-0 accent-(--brand)" checked={proof === "no"} onChange={() => (setProof("no"), setErrors((x) => ({ ...x, proof: undefined })))} />
              <span>
                <b>Ні / не впевнений</b> — імпортувати зі статусом «Без згоди» (лише CRM, без маркетингу). Рекомендовано.
              </span>
            </label>
            <label className="flex min-h-11 cursor-pointer items-start gap-2.5 rounded-(--r-md) border border-(--line) bg-(--surface) p-3 has-[:checked]:border-(--brand) has-[:checked]:bg-(--brand-soft)">
              <input type="radio" name="imp-proof" className="mt-0.5 h-5 w-5 shrink-0 accent-(--brand)" checked={proof === "yes"} onChange={() => (setProof("yes"), setErrors((x) => ({ ...x, proof: undefined })))} />
              <span>
                <b>Так, є документальний доказ згоди кожного</b> — статус «Підписаний», запис у журналі згод (дія «імпорт»).
              </span>
            </label>
            {errors.proof && (
              <span role="alert" className="inline-flex items-center gap-1 text-xs font-medium text-(--danger)">
                {errors.proof}
              </span>
            )}
            <Field
              id="imp-note"
              label={proof === "yes" ? "Джерело/доказ згоди *" : "Примітка (джерело бази)"}
              error={errors.note}
              counter={<Counter value={note} max={500} />}
            >
              <textarea
                id="imp-note"
                rows={2}
                className={inputCls}
                value={note}
                maxLength={500}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Напр.: підписники розсилки старого сайту, форма з галочкою згоди, експорт 01.09.2026"
              />
            </Field>
            {proof === "yes" && (
              <label className="flex min-h-11 cursor-pointer items-start gap-2.5 text-sm text-(--ink)">
                <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-(--brand)" checked={ack} onChange={(e) => (setAck(e.target.checked), setErrors((x) => ({ ...x, ack: undefined })))} aria-invalid={!!errors.ack} />
                <span>
                  Підтверджую, що кожен контакт у файлі дав згоду на рекламні розсилки, і я можу це довести. Розумію, що відповідальність за імпорт без згоди несе
                  магазин.
                  {errors.ack && <span className="mt-1 block text-xs font-medium text-(--danger)">{errors.ack}</span>}
                </span>
              </label>
            )}
          </fieldset>
        </>
      )}
      {step === 2 && dry && (
        <>
          <p>
            Перевірка файлу <b>{file?.name}</b> — у базі ще нічого не змінено. Статус нових контактів: <b>{proof === "yes" ? "Підписаний" : "Без згоди"}</b>.
          </p>
          <Report r={dry} dry />
          {!(dry.created + dry.updated) && <Notice tone="warn">Немає жодного рядка для імпорту. Виправте файл і спробуйте знову.</Notice>}
        </>
      )}
      {step === 3 && result && (
        <>
          <p role="status" className="inline-flex items-center gap-1.5 font-medium text-(--success)">
            <MdCheckCircle aria-hidden="true" /> Імпорт завершено.
          </p>
          <Report r={result} />
        </>
      )}
    </Modal>
  );
};

export default ImportWizard;
