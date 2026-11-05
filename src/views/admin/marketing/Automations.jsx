// Автоматизації: GET/PUT /automations ({automations:{welcome, abandonedCart, winback}}), GET /automations/stats
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../../api/api";
import { useApiGet } from "./hooks";
import { CRM, errMsg } from "./mkUtils";
import { Button, StickyActions, useUnsavedChanges } from "../../../ui";
import { Card, ErrorBox, Notice, Page, Skeleton } from "./ui";
import { stripKeys, uid, withKeys } from "./blocks/blockUtils";
import AutomationCard from "./automations/AutomationCard";

const META = {
  welcome: {
    title: "Вітальний ланцюжок",
    statsKey: "welcome",
    description: "Листи новим підписникам після підтвердження підписки (double opt-in або галочка при реєстрації/оформленні).",
  },
  abandonedCart: {
    title: "Покинутий кошик",
    statsKey: "abandoned_cart",
    description: "Нагадування підписникам (тема «Акції»), які залишили товари в кошику й не оформили замовлення. Не частіше 1 разу на 14 днів.",
    paramLabel: "Надіслати через",
    paramHint: "Скільки годин кошик має бути без змін (1–720).",
  },
  winback: {
    title: "Повернення клієнтів (winback)",
    statsKey: "winback",
    description: "Лист покупцям-підписникам, які давно нічого не купували. Не частіше 1 разу на 90 днів.",
    paramLabel: "Не купували вже",
    paramHint: "Кількість днів від останньої покупки (7–1095).",
  },
};
const KEYS = Object.keys(META);

// Сервер → форма (внутрішні ключі блоків/кроків)
const toForm = (a = {}) => ({
  welcome: { ...a.welcome, steps: (a.welcome?.steps || []).map((s) => ({ ...s, _k: uid(), blocks: withKeys(s.blocks) })) },
  abandonedCart: { ...a.abandonedCart, blocks: withKeys(a.abandonedCart?.blocks) },
  winback: { ...a.winback, blocks: withKeys(a.winback?.blocks) },
});
const toBody = (key, v) =>
  key === "welcome"
    ? { enabled: !!v.enabled, steps: (v.steps || []).map(({ _k, ...s }) => ({ ...s, blocks: stripKeys(s.blocks) })) } // eslint-disable-line no-unused-vars
    : { ...v, blocks: stripKeys(v.blocks) };
const sig = (key, v) => JSON.stringify(toBody(key, v));

const Automations = () => {
  const res = useApiGet(`${CRM}/automations`);
  const st = useApiGet(`${CRM}/automations/stats`);
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState({});
  const [saving, setSaving] = useState("");

  useEffect(() => {
    const a = res.data?.automations;
    if (!a) return;
    const f = toForm(a);
    setForm(f);
    setSaved(Object.fromEntries(KEYS.map((k) => [k, sig(k, f[k])])));
  }, [res.data]);

  const dirtyAny = form && KEYS.some((k) => sig(k, form[k]) !== saved[k]);
  useUnsavedChanges(!!dirtyAny);
  const dirtyKeys = form ? KEYS.filter((k) => sig(k, form[k]) !== saved[k]) : [];

  const save = async (key) => {
    setSaving(key);
    try {
      const { data } = await api.put(`${CRM}/automations`, { automations: { [key]: toBody(key, form[key]) } });
      const next = toForm(data.automations)[key];
      setForm((f) => ({ ...f, [key]: next }));
      setSaved((s) => ({ ...s, [key]: sig(key, next) }));
      toast.success(`«${META[key].title}» збережено`);
    } catch (e) {
      toast.error(errMsg(e, "Не вдалося зберегти автоматизацію"));
    } finally {
      setSaving("");
    }
  };

  const stats = st.data?.stats || {};

  return (
    <Page
      title="Автоматизації"
      description="Автоматичні листи за подіями. Діють ті самі правила, що й для розсилок: лише підписані контакти, ліміт частоти, вікно відправки й денний ліміт."
    >
      <ErrorBox error={res.error} missing={res.missing} onRetry={res.reload} />
      {st.error && !res.error && <Notice tone="warn">Статистика недоступна: {st.error}</Notice>}
      {!form ? (
        res.loading ? (
          <Card>
            <Skeleton rows={6} label="Завантаження автоматизацій…" />
          </Card>
        ) : null
      ) : (
        KEYS.map((k) => (
          <AutomationCard
            key={k}
            akey={k}
            meta={META[k]}
            value={form[k]}
            onChange={(v) => setForm((f) => ({ ...f, [k]: v }))}
            onSave={() => save(k)}
            saving={saving === k}
            dirty={sig(k, form[k]) !== saved[k]}
            stats={stats[META[k].statsKey]}
          />
        ))
      )}
      {dirtyKeys.length > 0 && (
        <StickyActions dirty dirtyText={`Не збережено: ${dirtyKeys.map((k) => `«${META[k].title}»`).join(", ")}`}>
          {dirtyKeys.map((k) => (
            <Button key={k} size="sm" loading={saving === k} disabled={!!saving && saving !== k} onClick={() => save(k)}>
              {dirtyKeys.length > 1 ? `Зберегти «${META[k].title}»` : "Зберегти"}
            </Button>
          ))}
        </StickyActions>
      )}
    </Page>
  );
};

export default Automations;
