import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { MdClose, MdDeleteForever, MdDownload, MdLabel, MdLabelOff, MdPeopleOutline, MdPersonAdd, MdRefresh, MdSearchOff, MdUnsubscribe, MdUploadFile } from "react-icons/md";
import { Button } from "../../../ui";
import api from "../../../api/api";
import { resetSuggestions, useApiGet, useSuggestions } from "./hooks";
import { CRM, cleanParams, downloadFile, errMsg, inputCls, listOf, num } from "./mkUtils";
import { Card, Confirm, Empty, ErrorBox, Field, Page, Pagination, Skeleton } from "./ui";
import ContactsFilters from "./crm/ContactsFilters";
import ContactsList from "./crm/ContactsList";
import AddContactDialog from "./crm/AddContactDialog";
import ImportWizard from "./crm/ImportWizard";
import ContactDrawer from "./crm/ContactDrawer";

const KEYS = ["q", "status", "topic", "kind", "city", "tag", "source", "rfm", "telegram", "segmentId", "sort", "page"];
const LIMIT = 25;

const Crm = () => {
  const [params, setParams] = useSearchParams();
  const values = useMemo(() => Object.fromEntries(KEYS.map((k) => [k, params.get(k) || ""])), [params]);
  const query = useMemo(() => cleanParams({ ...values, page: values.page || 1, limit: LIMIT }), [values]);
  const list = useApiGet(`${CRM}/contacts`, query);
  const segs = useApiGet(`${CRM}/segments`);
  const sug = useSuggestions();
  const [selected, setSelected] = useState(() => new Set());
  const [dialog, setDialog] = useState(null); // add | import | bulk:<action>
  const [bulkTag, setBulkTag] = useState("");
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const contactId = params.get("contact");

  const contacts = listOf(list.data, "contacts");
  const total = list.data?.total ?? contacts.length;
  const pages = list.data?.pages ?? 1;
  const page = Number(values.page) || 1;

  const update = useCallback(
    (patch) =>
      setParams((p) => {
        const n = new URLSearchParams(p);
        Object.entries(patch).forEach(([k, v]) => (v ? n.set(k, v) : n.delete(k)));
        if (!("page" in patch)) n.delete("page");
        return n;
      }),
    [setParams]
  );
  const reset = () => setParams((p) => (p.get("contact") ? new URLSearchParams({ contact: p.get("contact") }) : new URLSearchParams()));
  const openContact = (id) => update({ contact: id, page: values.page });
  const closeContact = useCallback(() => update({ contact: "", page: values.page }), [update, values.page]);

  useEffect(() => {
    // скидаємо вибір при зміні фільтрів (не сторінки)
    setSelected(new Set());
  }, [values.q, values.status, values.topic, values.kind, values.city, values.tag, values.source, values.rfm, values.telegram, values.segmentId]);

  const toggle = (id) =>
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const toggleAll = (on) =>
    setSelected((s) => {
      const n = new Set(s);
      contacts.forEach((c) => (on ? n.add(c._id) : n.delete(c._id)));
      return n;
    });

  const exportCsv = async () => {
    setExporting(true);
    const q = { ...query };
    delete q.page;
    delete q.limit;
    const err = await downloadFile(`${CRM}/contacts/export.csv`, q, `contacts-${new Date().toISOString().slice(0, 10)}.csv`);
    setExporting(false);
    err ? toast.error(err) : toast.success("Файл CSV завантажено");
  };

  const recomputeRfm = async () => {
    setBusy(true);
    try {
      const { data } = await api.post(`${CRM}/rfm/recompute`);
      toast.success(data?.message || "RFM перераховано");
      list.reload();
    } catch (e) {
      toast.error(errMsg(e, "Не вдалося перерахувати RFM"));
    } finally {
      setBusy(false);
    }
  };

  const runBulk = async (action) => {
    const tag = bulkTag.trim().toLowerCase();
    if ((action === "addTag" || action === "removeTag") && !tag) return toast.error("Вкажіть тег");
    setBusy(true);
    try {
      const { data } = await api.post(`${CRM}/contacts/bulk`, { ids: [...selected], action, tag: tag || undefined });
      toast.success(data?.message || `Готово: ${num(data?.modified ?? data?.count ?? selected.size)}`);
      setSelected(new Set());
      setDialog(null);
      setBulkTag("");
      if (action.includes("Tag")) resetSuggestions();
      list.reload();
    } catch (e) {
      toast.error(errMsg(e, "Масова дія не вдалася"));
    } finally {
      setBusy(false);
    }
  };

  const bulkAction = dialog?.startsWith("bulk:") ? dialog.slice(5) : null;
  const bulkTitles = {
    addTag: ["Додати тег", "Тег буде додано до вибраних контактів."],
    removeTag: ["Прибрати тег", "Тег буде прибрано з вибраних контактів."],
    unsubscribe: ["Відписати від маркетингу", "Контакти буде відписано від усіх маркетингових розсилок (email і Telegram). Дію буде записано в журнал згод."],
    delete: ["Анонімізувати контакти", "Персональні дані вибраних контактів буде видалено назавжди. Дію не можна скасувати."],
  };
  const filtered = Object.entries(values).some(([k, v]) => v && !["page", "sort"].includes(k));

  return (
    <Page
      title="Клієнти (CRM)"
      description="Усі контакти: покупці, підписники й додані вручну. Маркетинг отримують лише ті, хто дав згоду; транзакційні листи — усі покупці."
      actions={
        <>
          <Button icon={<MdPersonAdd />} onClick={() => setDialog("add")}>
            Додати контакт
          </Button>
          <Button variant="secondary" icon={<MdUploadFile />} onClick={() => setDialog("import")}>
            Імпорт CSV
          </Button>
          <Button variant="secondary" icon={<MdDownload />} loading={exporting} onClick={exportCsv}>
            {exporting ? "Готуємо файл…" : "Експорт CSV"}
          </Button>
          <Button variant="ghost" icon={<MdRefresh />} disabled={busy} onClick={recomputeRfm} title="Перерахувати RFM-сегменти для всієї бази">
            Перерахувати RFM
          </Button>
        </>
      }
    >
      <Card>
        <ContactsFilters values={values} onChange={update} segments={listOf(segs.data, "segments")} tags={sug.tags} onReset={reset} />
      </Card>

      {selected.size > 0 && (
        <div
          className="sticky top-[72px] z-[5] flex flex-wrap items-center gap-2 rounded-(--r-lg) border border-(--brand) bg-(--surface) p-3 text-(--ink) shadow-(--shadow-2)"
          role="region"
          aria-label="Масові дії"
        >
          <span className="mr-2 text-sm font-semibold">Вибрано: {num(selected.size)}</span>
          <Button size="sm" variant="secondary" icon={<MdLabel />} onClick={() => setDialog("bulk:addTag")}>
            Додати тег
          </Button>
          <Button size="sm" variant="secondary" icon={<MdLabelOff />} onClick={() => setDialog("bulk:removeTag")}>
            Прибрати тег
          </Button>
          <Button size="sm" variant="secondary" icon={<MdUnsubscribe />} onClick={() => setDialog("bulk:unsubscribe")}>
            Відписати
          </Button>
          <Button size="sm" variant="danger" icon={<MdDeleteForever />} onClick={() => setDialog("bulk:delete")}>
            Анонімізувати
          </Button>
          <Button size="sm" variant="ghost" icon={<MdClose />} className="ml-auto" onClick={() => setSelected(new Set())}>
            Зняти вибір
          </Button>
        </div>
      )}

      <Card className="flex flex-col gap-3">
        <ErrorBox error={list.error} missing={list.missing} onRetry={list.reload} />
        {list.loading && !list.data ? (
          <Skeleton rows={8} label="Завантаження контактів…" />
        ) : contacts.length === 0 && !list.error ? (
          filtered ? (
            <Empty icon={<MdSearchOff />} title="Нічого не знайдено" action={<Button variant="secondary" onClick={reset}>Скинути фільтри</Button>}>
              Жоден контакт не відповідає пошуку чи фільтрам.
            </Empty>
          ) : (
            <Empty icon={<MdPeopleOutline />} title="Контактів поки немає" action={<Button icon={<MdPersonAdd />} onClick={() => setDialog("add")}>Додати перший контакт</Button>}>
              Контакти з'являться автоматично після реєстрацій, замовлень і підписок у футері сайту. Також можна імпортувати базу з CSV (з обов'язковою відміткою про згоду).
            </Empty>
          )
        ) : (
          <div aria-busy={list.loading} className={list.loading ? "opacity-60 transition-opacity" : ""}>
            <ContactsList contacts={contacts} selected={selected} onToggle={toggle} onToggleAll={toggleAll} onOpen={openContact} />
          </div>
        )}
        <Pagination page={page} pages={pages} total={total} onPage={(p) => update({ page: String(p) })} />
      </Card>

      {dialog === "add" && (
        <AddContactDialog
          onClose={() => setDialog(null)}
          onCreated={(c) => {
            setDialog(null);
            resetSuggestions();
            list.reload();
            if (c?._id) openContact(c._id);
          }}
        />
      )}
      {dialog === "import" && <ImportWizard onClose={() => setDialog(null)} onDone={() => (resetSuggestions(), list.reload())} />}
      {bulkAction && (
        <Confirm
          title={`${bulkTitles[bulkAction][0]} (${num(selected.size)})`}
          text={bulkTitles[bulkAction][1]}
          tone={bulkAction === "addTag" || bulkAction === "removeTag" ? "success" : "danger"}
          confirmLabel={bulkTitles[bulkAction][0]}
          busy={busy}
          onConfirm={() => runBulk(bulkAction)}
          onCancel={() => setDialog(null)}
        >
          {(bulkAction === "addTag" || bulkAction === "removeTag") && (
            <Field id="bulk-tag" label="Тег">
              <input id="bulk-tag" data-autofocus className={inputCls} list="bulk-tag-dl" value={bulkTag} onChange={(e) => setBulkTag(e.target.value)} maxLength={40} />
              <datalist id="bulk-tag-dl">
                {sug.tags.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </Field>
          )}
        </Confirm>
      )}
      {contactId && <ContactDrawer key={contactId} id={contactId} onClose={closeContact} onChanged={list.reload} />}
    </Page>
  );
};

export default Crm;
