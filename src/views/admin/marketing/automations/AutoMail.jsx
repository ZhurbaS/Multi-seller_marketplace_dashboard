// Лист автоматизації: тема + блоковий редактор + схематичне прев'ю (окремого серверного прев'ю для автоматизацій немає)
import React, { useState } from "react";
import { MdVisibility, MdVisibilityOff } from "react-icons/md";
import { Button } from "../../../../ui";
import { inputCls, num, pct } from "../mkUtils";
import { Counter, Field } from "../ui";
import BlockEditor from "../blocks/BlockEditor";
import EmailPreview from "../blocks/EmailPreview";
import { useProductsMap } from "../blocks/productsCache";
import { blocksToText, renderPreviewHtml } from "../blocks/blockUtils";

export const SUBJECT_MAX = 200;

export const StatLine = ({ s }) =>
  s ? (
    <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-(--ink-2)">
      <span>
        надіслано <b className="tabular-nums text-(--ink)">{num(s.sent)}</b>
      </span>
      <span>
        у черзі <b className="tabular-nums text-(--ink)">{num(s.queued)}</b>
      </span>
      <span>
        пропущено <b className="tabular-nums text-(--ink)">{num(s.skipped)}</b>
      </span>
      {s.failed > 0 && <span className="font-medium text-(--danger)">помилки {num(s.failed)}</span>}
      <span>
        кліки <b className="tabular-nums text-(--ink)">{num(s.clicks)}</b> ({pct(s.clicks, s.sent)})
      </span>
    </p>
  ) : (
    <p className="text-xs text-(--ink-2)">За 30 днів надсилань не було.</p>
  );

const AutoMail = ({ idBase, subject, blocks, onChange, showErrors, subjectError }) => {
  const [preview, setPreview] = useState(false);
  const productsMap = useProductsMap(preview ? blocks.flatMap((b) => (b.type === "products" ? b.productIds || [] : [])) : []);
  return (
    <div className="flex flex-col gap-3">
      <Field id={`${idBase}-subj`} label="Тема листа"
        required error={subjectError} counter={<Counter value={subject} max={SUBJECT_MAX} />}>
        <input
          id={`${idBase}-subj`}
          className={inputCls}
          value={subject}
          maxLength={SUBJECT_MAX}
          aria-invalid={subjectError ? true : undefined}
          aria-describedby={subjectError ? `${idBase}-subj-err` : undefined}
          onChange={(e) => onChange({ subject: e.target.value })}
        />
      </Field>
      <div className="grid gap-4 xl:grid-cols-2 items-start">
        <div className="min-w-0">
          <BlockEditor value={blocks} onChange={(b) => onChange({ blocks: b })} showErrors={showErrors} />
        </div>
        <div className="min-w-0 flex flex-col gap-2">
          <Button size="sm" variant="secondary" className="self-start" aria-expanded={preview} icon={preview ? <MdVisibilityOff /> : <MdVisibility />} onClick={() => setPreview((v) => !v)}>
            {preview ? "Сховати прев'ю" : "Показати прев'ю"}
          </Button>
          {preview && (
            <EmailPreview
              html={renderPreviewHtml({ subject, blocks, productsMap })}
              text={blocksToText(blocks)}
              subject={subject}
              note="Схематичне прев'ю: кольори теми магазину, реквізити й посилання відписки підставить сервер під час відправки."
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AutoMail;
