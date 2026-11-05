// Майстер розсилки: 1 Основне → 2 Кому → 3 Зміст → 4 Відправлення (MARKETING_SPEC.md §10.4)
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../../../api/api";
import { MdArrowBack, MdCheck, MdChevronLeft, MdChevronRight, MdSave } from "react-icons/md";
import { Button, StickyActions, useUnsavedChanges } from "../../../../ui";
import { BASE, CRM, errMsg } from "../mkUtils";
import { Badge, Card, ErrorBox, Page } from "../ui";
import { CAMPAIGN_STATUS } from "../mkUtils";
import { STEPS, audienceKey, emptyForm, stepErrors, toBody, toForm } from "./campaignUtils";
import StepBasics from "./StepBasics";
import StepAudience from "./StepAudience";
import StepContent from "./StepContent";
import StepSend from "./StepSend";

const Stepper = ({ step, onGo, done }) => (
  <nav aria-label="Кроки майстра">
    <ol className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {STEPS.map((s) => {
        const cur = s.id === step;
        return (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => onGo(s.id)}
              aria-current={cur ? "step" : undefined}
              className={`flex min-h-11 w-full items-center gap-2 rounded-(--r-md) border p-2 text-left text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-(--brand) ${
                cur ? "border-(--brand) bg-(--brand-soft) font-semibold text-(--brand-ink)" : "border-(--line) bg-(--surface) text-(--ink) hover:bg-(--surface-2)"
              }`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  cur ? "bg-(--brand) text-(--on-brand)" : done[s.id] ? "bg-(--success) text-(--on-brand)" : "bg-(--surface-2) text-(--ink-2)"
                }`}
                aria-hidden="true"
              >
                {done[s.id] && !cur ? <MdCheck /> : s.id}
              </span>
              <span>
                <span className="sr-only">Крок {s.id}: </span>
                {s.label}
                {done[s.id] && !cur && <span className="sr-only"> (заповнено)</span>}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  </nav>
);

const CampaignWizard = ({ campaign, segmentIdParam = "", onReload }) => {
  const navigate = useNavigate();
  const [id, setId] = useState(campaign?._id ? String(campaign._id) : null);
  const [form, setForm] = useState(() => (campaign ? toForm(campaign) : emptyForm(segmentIdParam)));
  const [step, setStep] = useState(1);
  const [tried, setTried] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  // Запланована розсилка після першого збереження повертається в чернетку (бекенд) — тому одразу «не збережено»
  const [savedKey, setSavedKey] = useState(() => (campaign && campaign.status === "draft" ? JSON.stringify(toBody(toForm(campaign))) : ""));
  const [estimate, setEstimate] = useState({ data: null, key: "", loading: false, error: "" });
  const [testSent, setTestSent] = useState(false);
  const creating = useRef(null);

  const set = useCallback((patch) => setForm((f) => ({ ...f, ...(typeof patch === "function" ? patch(f) : patch) })), []);
  const bodyKey = JSON.stringify(toBody(form));
  const dirty = bodyKey !== savedKey;

  useUnsavedChanges(dirty);

  // Зберегти (створити чернетку, якщо її ще немає). Повертає id або null
  const save = useCallback(
    async ({ silent = true } = {}) => {
      const body = toBody(form);
      const key = JSON.stringify(body);
      setSaveError("");
      if (id && key === savedKey) return id;
      if (!id && creating.current) return creating.current;
      setSaving(true);
      const run = (async () => {
        try {
          if (id) {
            await api.put(`${CRM}/campaigns/${id}`, body);
            setSavedKey(key);
            if (!silent) toast.success("Чернетку збережено");
            return id;
          }
          const { data } = await api.post(`${CRM}/campaigns`, body);
          const nid = String(data.campaign._id);
          setId(nid);
          setSavedKey(key);
          if (!silent) toast.success("Чернетку створено");
          return nid;
        } catch (e) {
          const m = errMsg(e, "Не вдалося зберегти розсилку");
          setSaveError(m);
          toast.error(m);
          return null;
        } finally {
          setSaving(false);
          creating.current = null;
        }
      })();
      if (!id) creating.current = run;
      return run;
    },
    [form, id, savedKey]
  );

  // Після автостворення чернетки адреса /campaigns/new → /campaigns/:id без перемонтування майстра
  // (стан роутера в history.state зберігаємо, щоб «Назад»/оновлення сторінки працювали)
  useEffect(() => {
    if (id && !campaign?._id && !window.location.pathname.endsWith(`/campaigns/${id}`)) {
      window.history.replaceState(window.history.state, "", `${BASE}/campaigns/${id}`);
    }
  }, [id, campaign]);

  const validStep = (s) => !Object.keys(stepErrors(form, s)).length;
  const go = async (to) => {
    if (to === step) return;
    if (to > step) {
      for (let s = step; s < to; s++) {
        if (!validStep(s)) {
          setTried((t) => ({ ...t, [s]: true }));
          setStep(s);
          toast.error(`Перевірте крок «${STEPS[s - 1].label}»`);
          return;
        }
      }
    }
    if (dirty || !id) {
      const ok = await save();
      if (!ok) return;
    }
    setStep(to);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const runEstimate = async () => {
    if (!validStep(1) || !validStep(2)) {
      setTried((t) => ({ ...t, 1: true, 2: true }));
      return toast.error("Заповніть основне й аудиторію");
    }
    const key = audienceKey(form);
    setEstimate((e) => ({ ...e, loading: true, error: "" }));
    const cid = await save();
    if (!cid) return setEstimate((e) => ({ ...e, loading: false }));
    try {
      const { data } = await api.post(`${CRM}/campaigns/${cid}/estimate`);
      setEstimate({ data, key, loading: false, error: "" });
    } catch (e) {
      setEstimate({ data: null, key: "", loading: false, error: errMsg(e, "Не вдалося порахувати отримувачів") });
    }
  };

  const estimateFresh = estimate.data && estimate.key === audienceKey(form);
  const done = { 1: validStep(1) && !!id, 2: validStep(2) && !!estimateFresh, 3: validStep(3) && !!id, 4: false };
  const status = campaign?.status || "draft";

  return (
    <Page
      title={id ? form.name || "Розсилка" : "Нова розсилка"}
      description="Чотири кроки: основне, аудиторія, зміст і відправлення. Чернетка зберігається при переході між кроками."
      actions={
        <>
          <Badge meta={CAMPAIGN_STATUS[status]} />
          <Button as={Link} to={`${BASE}/campaigns`} variant="ghost" icon={<MdArrowBack />}>
            До списку
          </Button>
        </>
      }
    >
      <Card>
        <Stepper step={step} onGo={go} done={done} />
      </Card>
      <ErrorBox error={saveError} />
      <div className="flex min-w-0 flex-col gap-4">
        {step === 1 && <StepBasics form={form} set={set} errors={tried[1] ? stepErrors(form, 1) : {}} />}
        {step === 2 && (
          <StepAudience form={form} set={set} errors={tried[2] ? stepErrors(form, 2) : {}} estimate={estimate} fresh={!!estimateFresh} onEstimate={runEstimate} />
        )}
        {step === 3 && (
          <StepContent
            form={form}
            set={set}
            id={id}
            ensureId={save}
            showErrors={!!tried[3]}
            errors={tried[3] ? stepErrors(form, 3) : {}}
            testSent={testSent}
            onTestSent={() => setTestSent(true)}
          />
        )}
        {step === 4 && (
          <StepSend
            form={form}
            id={id}
            save={save}
            estimate={estimate}
            fresh={!!estimateFresh}
            onEstimate={runEstimate}
            setEstimate={(data) => setEstimate({ data, key: audienceKey(form), loading: false, error: "" })}
            testSent={testSent}
            valid={{ 1: validStep(1), 2: validStep(2), 3: validStep(3) }}
            onGo={go}
            onSent={() => {
              setSavedKey(bodyKey);
              if (campaign?._id) onReload?.();
              else navigate(`${BASE}/campaigns/${id}`, { replace: true });
            }}
          />
        )}
      </div>
      <StickyActions dirty={dirty || !id} dirtyText={id ? "Є незбережені зміни" : "Чернетку ще не збережено"} savedText="Чернетку збережено">
        <Button variant="secondary" icon={<MdChevronLeft />} disabled={step === 1 || saving} onClick={() => go(step - 1)}>
          Назад
        </Button>
        <Button variant="secondary" icon={!dirty && id ? <MdCheck /> : <MdSave />} loading={saving} disabled={saving || (!dirty && !!id)} onClick={() => save({ silent: false })}>
          {saving ? "Збереження…" : dirty || !id ? "Зберегти чернетку" : "Збережено"}
        </Button>
        {step < 4 && (
          <Button iconRight={<MdChevronRight />} disabled={saving} onClick={() => (setTried((t) => ({ ...t, [step]: true })), go(step + 1))}>
            {`Далі: ${STEPS[step].label}`}
          </Button>
        )}
      </StickyActions>
    </Page>
  );
};

export default CampaignWizard;
