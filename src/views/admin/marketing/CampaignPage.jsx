// Маршрути …/campaigns/new і …/campaigns/:id: чернетка → майстер; інакше → звіт
import React, { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useApiGet } from "./hooks";
import { CRM } from "./mkUtils";
import { Card, ErrorBox, Page, Skeleton } from "./ui";
import CampaignWizard from "./campaigns/CampaignWizard";
import CampaignReport from "./campaigns/CampaignReport";

const Existing = ({ id }) => {
  const res = useApiGet(`${CRM}/campaigns/${id}`);
  const [edit, setEdit] = useState(false);
  const c = res.data?.campaign;
  if (res.loading && !c)
    return (
      <Page title="Розсилка">
        <Card>
          <Skeleton rows={5} label="Завантаження розсилки…" />
        </Card>
      </Page>
    );
  if (!c)
    return (
      <Page title="Розсилка">
        <ErrorBox error={res.error || "Розсилку не знайдено"} missing={res.missing} onRetry={res.reload} />
      </Page>
    );
  if (c.status === "draft" || (edit && c.status === "scheduled"))
    return (
      <CampaignWizard
        key={`${c._id}-${c.status}`}
        campaign={c}
        onReload={() => {
          setEdit(false);
          res.reload();
        }}
      />
    );
  return <CampaignReport id={id} audience={res.data?.audience} onEdit={() => setEdit(true)} />;
};

const CampaignPage = () => {
  const { id } = useParams();
  const [params] = useSearchParams();
  if (!id || id === "new") return <CampaignWizard segmentIdParam={params.get("segmentId") || ""} />;
  if (!/^[a-f\d]{24}$/i.test(id))
    return (
      <Page title="Розсилка">
        <ErrorBox error="Некоректна адреса розсилки" />
      </Page>
    );
  return <Existing key={id} id={id} />;
};

export default CampaignPage;
