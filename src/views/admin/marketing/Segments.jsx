import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { MdAdd, MdDelete, MdFilterAlt, MdPeopleOutline, MdSave, MdSend } from "react-icons/md";
import { Badge as KitBadge, Button, StickyActions, useUnsavedChanges } from "../../../ui";
import api from "../../../api/api";
import { useApiGet } from "./hooks";
import { BASE, CRM, errMsg, fmtDate, inputCls, isSystemSegment, listOf, num, pick } from "./mkUtils";
import { describeFilter, emptyFilter, normalizeFilter, validateFilter } from "./segmentFields";
import { LivePreview, RuleBuilder } from "./RuleBuilder";
import { Card, Confirm, Counter, Empty, ErrorBox, Field, Notice, Page, Section, Skeleton } from "./ui";

const SegmentItem = ({ s, active, onSelect }) => (
  <li>
    <button
      type="button"
      onClick={() => onSelect(s._id)}
      aria-current={active ? "true" : undefined}
      className={`flex min-h-11 w-full flex-col gap-0.5 rounded-(--r-md) border p-3 text-left text-(--ink) transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--brand) ${
        active ? "border-(--brand) bg-(--brand-soft)" : "border-(--line) bg-(--surface) hover:bg-(--surface-2)"
      }`}
    >
      <span className="flex flex-wrap items-center gap-2 font-semibold">
        {s.name}
        {isSystemSegment(s) && (
          <KitBadge tone={active ? "brand" : "neutral"} size="sm">
            системний
          </KitBadge>
        )}
      </span>
      <span className="text-xs text-(--ink-2) truncate">{s.description || describeFilter(s.filter)}</span>
      {s.cachedCount != null && (
        <span className="text-[11px] text-(--ink-2)">
          ≈ {num(s.cachedCount)} контактів{s.cachedAt ? ` · ${fmtDate(s.cachedAt)}` : ""}
        </span>
      )}
    </button>
  </li>
);

const Editor = ({ segment, onSaved, onDeleted, onCopy }) => {
  const system = segment && isSystemSegment(segment);
  const [name, setName] = useState(segment?.name || "");
  const [description, setDescription] = useState(segment?.description || "");
  const [filter, setFilter] = useState(segment ? normalizeFilter(segment.filter) : emptyFilter());
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [askDel, setAskDel] = useState(false);
  const [initial] = useState(() => JSON.stringify([segment?.name || "", segment?.description || "", segment ? normalizeFilter(segment.filter) : emptyFilter()]));
  const dirty = !system && (!segment?._id || JSON.stringify([name, description, filter]) !== initial);
  useUnsavedChanges(!!segment?._id && dirty);

  const save = async () => {
    setTried(true);
    if (!name.trim()) return toast.error("Вкажіть назву сегмента");
    if (Object.keys(validateFilter(filter)).length) return toast.error("Перевірте умови");
    setBusy(true);
    try {
      const body = { name: name.trim(), description: description.trim(), filter };
      const { data } = segment?._id ? await api.put(`${CRM}/segments/${segment._id}`, body) : await api.post(`${CRM}/segments`, body);
      toast.success(data?.message || "Сегмент збережено");
      onSaved(pick(data, "segment"));
    } catch (e) {
      toast.error(errMsg(e, "Не вдалося зберегти"));
    } finally {
      setBusy(false);
    }
  };
  const del = async () => {
    setBusy(true);
    try {
      await api.delete(`${CRM}/segments/${segment._id}`);
      toast.success("Сегмент видалено");
      onDeleted();
    } catch (e) {
      toast.error(errMsg(e, "Не вдалося видалити (можливо, він використовується в розсилці)"));
      setBusy(false);
      setAskDel(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {system && (
        <Notice>
          Системний сегмент — лише для читання. Щоб змінити умови, <button type="button" className="font-semibold text-(--brand-ink) underline" onClick={() => onCopy(segment)}>створіть копію</button>.
        </Notice>
      )}
      <Section title={segment?._id ? (system ? segment.name : "Редагування сегмента") : "Новий сегмент"}>
        {!system && (
          <div className="grid sm:grid-cols-2 gap-3">
            <Field id="seg-name" label="Назва *" error={tried && !name.trim() ? "Вкажіть назву" : ""} counter={<Counter value={name} max={80} />}>
              <input id="seg-name" className={inputCls} value={name} maxLength={80} onChange={(e) => setName(e.target.value)} placeholder="Напр.: Юрособи з Києва" />
            </Field>
            <Field id="seg-desc" label="Опис" counter={<Counter value={description} max={200} />}>
              <input id="seg-desc" className={inputCls} value={description} maxLength={200} onChange={(e) => setDescription(e.target.value)} />
            </Field>
          </div>
        )}
        <RuleBuilder filter={filter} onChange={setFilter} readOnly={system} showErrors={tried} />
      </Section>
      <Section title="Живий лічильник">
        <LivePreview filter={filter} />
      </Section>
      <StickyActions className="mx-0! rounded-(--r-lg) border px-3! sm:mx-0! lg:mx-0!" dirty={dirty} status={system ? <span className="text-(--ink-2)">Системний сегмент — лише перегляд</span> : undefined}>
        {segment?._id && !system && (
          <Button variant="danger" icon={<MdDelete />} onClick={() => setAskDel(true)}>
            Видалити
          </Button>
        )}
        {segment?._id && (
          <>
            <Button as={Link} to={`${BASE}/crm?segmentId=${segment._id}`} variant="secondary" icon={<MdPeopleOutline />}>
              Контакти
            </Button>
            <Button as={Link} to={`${BASE}/campaigns/new?segmentId=${segment._id}`} variant="secondary" icon={<MdSend />}>
              Створити розсилку
            </Button>
          </>
        )}
        {!system && (
          <Button icon={<MdSave />} loading={busy} onClick={save}>
            {busy ? "Збереження…" : "Зберегти сегмент"}
          </Button>
        )}
      </StickyActions>
      {askDel && (
        <Confirm
          title="Видалити сегмент?"
          text={`Сегмент «${segment.name}» буде видалено. Контакти не постраждають; розсилки, що вже використовують сегмент, можуть стати недійсними.`}
          confirmLabel="Видалити"
          busy={busy}
          onConfirm={del}
          onCancel={() => setAskDel(false)}
        />
      )}
    </div>
  );
};

const Segments = () => {
  const [params, setParams] = useSearchParams();
  const res = useApiGet(`${CRM}/segments`);
  const segments = listOf(res.data, "segments");
  const [draft, setDraft] = useState(null); // копія системного
  const sel = params.get("id") || "";
  const select = (id) => {
    setDraft(null);
    setParams(id ? { id } : {});
  };
  const { system, own } = useMemo(
    () => ({ system: segments.filter(isSystemSegment), own: segments.filter((s) => !isSystemSegment(s)) }),
    [segments]
  );
  const current = sel === "new" ? draft : segments.find((s) => s._id === sel) || null;
  useEffect(() => {
    if (!sel && segments.length && window.innerWidth >= 1024) setParams({ id: segments[0]._id }, { replace: true });
  }, [sel, segments, setParams]);

  return (
    <Page
      title="Сегменти"
      description="Збережені вибірки контактів за правилами. Використовуються в розсилках і фільтрі клієнтів; кількість рахується на момент відправки."
      actions={
        <Button icon={<MdAdd />} onClick={() => select("new")}>
          Новий сегмент
        </Button>
      }
    >
      <ErrorBox error={res.error} missing={res.missing} onRetry={res.reload} />
      <div className="grid lg:grid-cols-[320px_minmax(0,1fr)] gap-4 items-start">
        <Card className="flex flex-col gap-4">
          {res.loading && !res.data ? (
            <Skeleton rows={6} />
          ) : (
            <>
              <div>
                <h2 className="pb-2 text-xs font-semibold uppercase tracking-wide text-(--ink-2)">Власні</h2>
                {own.length ? (
                  <ul className="flex flex-col gap-2">
                    {own.map((s) => (
                      <SegmentItem key={s._id} s={s} active={s._id === sel} onSelect={select} />
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-(--ink-2)">Ще немає власних сегментів. Створіть новий або скопіюйте системний.</p>
                )}
              </div>
              <div>
                <h2 className="pb-2 text-xs font-semibold uppercase tracking-wide text-(--ink-2)">Системні шаблони</h2>
                {system.length ? (
                  <ul className="flex flex-col gap-2">
                    {system.map((s) => (
                      <SegmentItem key={s._id} s={s} active={s._id === sel} onSelect={select} />
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-(--ink-2)">Системні сегменти з'являться після першого запуску сервера з модулем маркетингу.</p>
                )}
              </div>
            </>
          )}
        </Card>
        <div className="min-w-0">
          {sel === "new" || current ? (
            <Editor
              key={sel === "new" ? `new-${draft?.name || ""}` : current._id}
              segment={current}
              onCopy={(s) => {
                setDraft({ name: `${s.name} (копія)`, description: s.description, filter: s.filter });
                setParams({ id: "new" });
              }}
              onSaved={(s) => {
                res.reload();
                if (s?._id) select(s._id);
              }}
              onDeleted={() => {
                res.reload();
                select("");
              }}
            />
          ) : (
            <Empty icon={<MdFilterAlt />} title="Оберіть сегмент" action={<Button icon={<MdAdd />} onClick={() => select("new")}>Створити сегмент</Button>}>
              Оберіть сегмент зі списку, щоб переглянути правила і кількість контактів, або створіть новий.
            </Empty>
          )}
        </div>
      </div>
    </Page>
  );
};

export default Segments;
