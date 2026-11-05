import React, { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { MdDeleteForever, MdErrorOutline } from "react-icons/md";
import { Button, useUnsavedChanges } from "../../../../ui";
import api from "../../../../api/api";
import { useSuggestions } from "../hooks";
import { CRM, KINDS, SOURCES, TOPICS, contactName, errMsg, fmtDate, inputCls, isMissing } from "../mkUtils";
import { Confirm, Counter, Drawer, ErrorBox, Field, Notice, Section, Skeleton, TagInput } from "../ui";
import { ChannelsSection, ConsentTimeline, MessagesSection, OrdersSection, RfmSection } from "./ContactSections";

const toForm = (c) => ({
  name: c?.name || "",
  kind: c?.kind || "unknown",
  city: c?.city || "",
  tags: c?.tags || [],
  notes: c?.notes || "",
  topics: { promo: false, news: false, restock: false, tips: false, ...(c?.channels?.email?.topics || {}) },
});

const ContactDrawer = ({ id, onClose, onChanged }) => {
  const sug = useSuggestions();
  const [st, setSt] = useState({ loading: true, error: "", missing: false, data: null });
  const [f, setF] = useState(toForm(null));
  const [busy, setBusy] = useState(false);
  const [askAnon, setAskAnon] = useState(false);
  const [anonWord, setAnonWord] = useState("");
  const [askClose, setAskClose] = useState(false);

  const load = useCallback(async () => {
    setSt((s) => ({ ...s, loading: true, error: "" }));
    try {
      const { data } = await api.get(`${CRM}/contacts/${id}`);
      const d = data?.contact ? data : { contact: data };
      setSt({ loading: false, error: "", missing: false, data: d });
      setF(toForm(d.contact));
    } catch (e) {
      setSt({ loading: false, error: errMsg(e, "Не вдалося завантажити контакт"), missing: isMissing(e), data: null });
    }
  }, [id]);
  useEffect(() => {
    load();
  }, [load]);

  const c = st.data?.contact;
  const dirty = useMemo(() => c && JSON.stringify(toForm(c)) !== JSON.stringify(f), [c, f]);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e?.target ? e.target.value : e }));
  useUnsavedChanges(!!dirty);
  const requestClose = useCallback(() => (dirty ? setAskClose(true) : onClose()), [dirty, onClose]);

  const save = async () => {
    if (f.notes.length > 1000) return toast.error("Нотатки — до 1000 символів");
    setBusy(true);
    try {
      const body = { ...f, name: f.name.trim(), city: f.city.trim() };
      // Теми — лише якщо змінились (кожна зміна пишеться в журнал згод)
      if (JSON.stringify(f.topics) === JSON.stringify(toForm(c).topics)) delete body.topics;
      const { data } = await api.put(`${CRM}/contacts/${id}`, body);
      toast.success(data?.message || "Збережено");
      const nc = data?.contact || (data?._id ? data : null);
      if (nc) {
        setSt((s) => ({ ...s, data: { ...s.data, contact: nc } }));
        setF(toForm(nc));
      } else load();
      onChanged();
    } catch (err) {
      toast.error(errMsg(err, "Не вдалося зберегти"));
    } finally {
      setBusy(false);
    }
  };

  const anonymize = async () => {
    setBusy(true);
    try {
      await api.delete(`${CRM}/contacts/${id}`);
      toast.success("Контакт анонімізовано");
      onChanged();
      onClose();
    } catch (err) {
      toast.error(errMsg(err, "Не вдалося анонімізувати"));
      setBusy(false);
    }
  };

  const emailStatus = c?.channels?.email?.status;

  return (
    <Drawer
      title={c ? contactName(c) : "Картка клієнта"}
      subtitle={c && `${SOURCES[c.source] || c.source || "—"} · у базі з ${fmtDate(c.createdAt)}${c.lastActivityAt ? ` · активність ${fmtDate(c.lastActivityAt)}` : ""}`}
      onClose={requestClose}
      footer={
        c && (
          <>
            <span className="mr-auto self-center text-sm" aria-live="polite">
              {dirty ? (
                <span className="inline-flex items-center gap-1.5 font-medium text-(--warning-ink)">
                  <MdErrorOutline aria-hidden="true" className="text-lg" />
                  Є незбережені зміни
                </span>
              ) : null}
            </span>
            <Button variant="secondary" onClick={requestClose}>
              Закрити
            </Button>
            <Button disabled={!dirty} loading={busy} onClick={save}>
              {busy ? "Збереження…" : "Зберегти"}
            </Button>
          </>
        )
      }
    >
      {st.loading && !c && <Skeleton rows={6} label="Завантаження картки…" />}
      <ErrorBox error={st.error} missing={st.missing} onRetry={load} />
      {c && (
        <>
          {c.erasureRequested && (
            <Notice tone="warn">
              Клієнт запросив видалення своїх даних. Перевірте, чи немає незавершених замовлень, і натисніть «Анонімізувати» внизу картки.
            </Notice>
          )}
          <Section title="Профіль">
            <div className="grid sm:grid-cols-2 gap-3">
              <Field id="cd-email" label="Email">
                <input id="cd-email" className={inputCls} value={c.email || "—"} readOnly disabled />
              </Field>
              <Field id="cd-phone" label="Телефон">
                <input id="cd-phone" className={inputCls} value={c.phone || "—"} readOnly disabled />
              </Field>
              <Field id="cd-name" label="Ім'я / назва">
                <input id="cd-name" className={inputCls} value={f.name} onChange={set("name")} maxLength={120} />
              </Field>
              <Field id="cd-city" label="Місто">
                <input id="cd-city" className={inputCls} value={f.city} onChange={set("city")} maxLength={80} />
              </Field>
              <Field id="cd-kind" label="Тип">
                <select id="cd-kind" className={inputCls} value={f.kind} onChange={set("kind")}>
                  {Object.entries(KINDS).map(([v, t]) => (
                    <option key={v} value={v}>
                      {t}
                    </option>
                  ))}
                </select>
              </Field>
              <Field id="cd-tags" label="Теги" hint="Enter — додати; до 30 тегів.">
                <TagInput id="cd-tags" value={f.tags} onChange={set("tags")} suggestions={sug.tags} />
              </Field>
            </div>
            <Field id="cd-notes" label="Нотатки (бачать лише адміністратори)" counter={<Counter value={f.notes} max={1000} />}>
              <textarea id="cd-notes" rows={3} className={inputCls} value={f.notes} onChange={set("notes")} maxLength={1000} />
            </Field>
          </Section>

          <ChannelsSection contact={c} onChanged={() => (load(), onChanged())} />

          <Section title="Теми email-розсилок" hint={emailStatus === "subscribed" ? "Отримує лише розсилки з увімкненими темами." : "Теми діють лише для підписаних контактів."}>
            <div className="grid sm:grid-cols-2 gap-2">
              {Object.entries(TOPICS).map(([k, label]) => (
                <label key={k} className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-(--r-md) border border-(--line) px-3 text-sm text-(--ink) hover:bg-(--surface-2)">
                  <input type="checkbox" className="h-5 w-5 accent-(--brand)" checked={!!f.topics[k]} onChange={(e) => setF((x) => ({ ...x, topics: { ...x.topics, [k]: e.target.checked } }))} />
                  {label}
                </label>
              ))}
            </div>
          </Section>

          <OrdersSection orders={st.data.orders} contact={c} />
          <RfmSection contact={c} />
          <MessagesSection messages={st.data.messages || []} />
          <ConsentTimeline consents={st.data.consents || []} />

          <Section title="Небезпечна зона" className="border-(--danger)!">
            <p className="text-sm text-(--ink-2)">
              Анонімізація видаляє ім'я, email, телефон, нотатки й теги. Хеш email залишиться у стоп-списку, щоб адресу не можна було імпортувати знову. Дію не
              можна скасувати; замовлення залишаться в обліку.
            </p>
            <Button variant="danger" icon={<MdDeleteForever />} className="self-start" onClick={() => (setAnonWord(""), setAskAnon(true))}>
              Анонімізувати…
            </Button>
          </Section>
        </>
      )}
      {askAnon && (
        <Confirm
          title="Анонімізувати контакт?"
          text={`Персональні дані «${contactName(c)}» буде видалено назавжди.`}
          confirmLabel="Анонімізувати"
          busy={busy}
          disabled={anonWord.trim().toLowerCase() !== "видалити"}
          onConfirm={anonymize}
          onCancel={() => setAskAnon(false)}
        >
          <Field id="anon-word" label="Щоб підтвердити, введіть слово «видалити»">
            <input id="anon-word" data-autofocus className={inputCls} value={anonWord} onChange={(e) => setAnonWord(e.target.value)} autoComplete="off" />
          </Field>
        </Confirm>
      )}
      {askClose && (
        <Confirm title="Закрити без збереження?" text="Внесені зміни буде втрачено." confirmLabel="Закрити" onConfirm={onClose} onCancel={() => setAskClose(false)} />
      )}
    </Drawer>
  );
};

export default ContactDrawer;
