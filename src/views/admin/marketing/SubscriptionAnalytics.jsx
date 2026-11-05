// «Підписка: налаштування й аналітика» — health, графіки, останні розсилки, налаштування (MARKETING_SPEC.md §10.6)
import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../../api/api";
import { useApiGet } from "./hooks";
import { MdRefresh, MdCalculate } from "react-icons/md";
import { Button } from "../../../ui";
import { CRM, errMsg } from "./mkUtils";
import { Card, ErrorBox, Page, Segmented, Skeleton } from "./ui";
import HealthPanel from "./subscription/HealthPanel";
import SettingsForm from "./subscription/SettingsForm";
import AnalyticsCharts, { Kpis, RecentCampaigns } from "./subscription/AnalyticsCharts";

const TABS = [
  ["overview", "Огляд і стан"],
  ["settings", "Налаштування"],
];

const SubscriptionAnalytics = () => {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "settings" ? "settings" : "overview";
  const health = useApiGet(`${CRM}/health`);
  const analytics = useApiGet(tab === "overview" ? `${CRM}/analytics` : null);
  const settings = useApiGet(tab === "settings" ? `${CRM}/settings` : null);
  const [rfmBusy, setRfmBusy] = useState(false);

  const recompute = async () => {
    setRfmBusy(true);
    try {
      await api.post(`${CRM}/rfm/recompute`);
      toast.success("RFM-сегменти перераховано");
      analytics.reload();
    } catch (e) {
      toast.error(errMsg(e, "Не вдалося перерахувати RFM"));
    } finally {
      setRfmBusy(false);
    }
  };

  const a = analytics.data;
  return (
    <Page
      title="Підписка: налаштування й аналітика"
      description="Стан відправки, динаміка бази підписників і правила розсилок."
      actions={
        <>
          <Button variant="secondary" icon={<MdCalculate />} onClick={recompute} loading={rfmBusy}>
            {rfmBusy ? "Перерахунок…" : "Перерахувати RFM"}
          </Button>
          <Button
            variant="secondary"
            icon={<MdRefresh />}
            onClick={() => {
              health.reload();
              analytics.reload();
            }}
          >
            Оновити
          </Button>
        </>
      }
    >
      <Segmented label="Розділ" value={tab} onChange={(v) => setParams(v === "overview" ? {} : { tab: v })} options={TABS} />

      <ErrorBox error={health.error} missing={health.missing} onRetry={health.reload} />
      {health.loading && !health.data ? (
        <Card>
          <Skeleton rows={4} label="Перевіряємо стан…" />
        </Card>
      ) : (
        <HealthPanel health={health.data} />
      )}

      {tab === "overview" ? (
        <>
          <ErrorBox error={analytics.error} missing={analytics.missing} onRetry={analytics.reload} />
          {analytics.loading && !a ? (
            <Card>
              <Skeleton rows={6} label="Завантаження аналітики…" />
            </Card>
          ) : a ? (
            <>
              <Kpis a={a} />
              <AnalyticsCharts a={a} />
              <RecentCampaigns list={a.campaigns} />
            </>
          ) : null}
        </>
      ) : (
        <>
          <ErrorBox error={settings.error} missing={settings.missing} onRetry={settings.reload} />
          {settings.loading && !settings.data ? (
            <Card>
              <Skeleton rows={6} label="Завантаження налаштувань…" />
            </Card>
          ) : settings.data ? (
            <SettingsForm data={settings.data} onSaved={health.reload} />
          ) : null}
        </>
      )}
    </Page>
  );
};

export default SubscriptionAnalytics;
