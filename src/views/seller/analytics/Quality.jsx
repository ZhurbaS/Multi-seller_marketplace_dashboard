// Аналітика → Якість карток: GET /seller/analytics/quality — індекс 0–100 і підказки, як покращити.
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MdCheckCircle, MdEdit, MdFactCheck, MdTipsAndUpdates } from "react-icons/md";
import { Badge, Button, Card, CardBody, CardHeader, Drawer, KpiCard, Segmented, Skeleton, Table, formatInt, formatNumber } from "../../../ui";
import { AnalyticsPage, ProductCell } from "./shared/AnalyticsPage";
import { useAnalytics } from "./shared/useAnalytics";
import { usePeriod } from "./shared/period";
import { INFO, editProductLink, qualityLabel, qualityTip, qualityTone } from "./shared/labels";

// Ключ проблеми без конкретних чисел («Додайте фото: зараз 2…» → «Додайте фото»)
const issueKey = (s) => String(s || "").replace(/:\s*(зараз\s*)?\d.*$/, "").trim();

function ScoreBar({ score }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <span className="h-2 w-16 shrink-0 overflow-hidden rounded-full bg-(--surface-2)" aria-hidden="true">
        <span className={`block h-full rounded-full ${score >= 80 ? "bg-(--success)" : score >= 60 ? "bg-(--warning)" : "bg-(--danger)"}`} style={{ width: `${Math.max(0, Math.min(100, score))}%` }} />
      </span>
      <Badge tone={qualityTone(score)} size="sm">
        {formatInt(score)} · {qualityLabel(score)}
      </Badge>
    </span>
  );
}

function IssueList({ issues }) {
  if (!issues?.length)
    return (
      <p className="flex items-center gap-2 text-sm text-(--success)">
        <MdCheckCircle aria-hidden="true" /> Картка заповнена добре
      </p>
    );
  return (
    <ul className="flex flex-col gap-3">
      {issues.map((it) => {
        const tip = qualityTip(it);
        return (
          <li key={it} className="min-w-0 rounded-(--r-md) border border-(--line) p-3">
            <p className="break-words font-medium text-(--ink)">{it}</p>
            {tip && (
              <p className="mt-1 flex items-start gap-1.5 break-words text-sm text-(--ink-2)">
                <MdTipsAndUpdates aria-hidden="true" className="mt-0.5 shrink-0 text-(--brand-ink)" />
                <span className="min-w-0">{tip}</span>
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default function Quality() {
  const period = usePeriod();
  const { data, loading, refreshing, error, reload } = useAnalytics("quality", period.query);
  const [filter, setFilter] = useState("weak");
  const [detail, setDetail] = useState(null);
  const all = useMemo(() => data?.rows || [], [data]);
  const weak = all.filter((r) => r.score < 60).length;
  const good = all.filter((r) => r.score >= 80).length;
  const rows = filter === "weak" ? all.filter((r) => r.score < 60) : filter === "mid" ? all.filter((r) => r.score >= 60 && r.score < 80) : all;

  const common = useMemo(() => {
    const m = new Map();
    for (const r of all) for (const it of r.issues || []) {
      const k = issueKey(it);
      const e = m.get(k) || { key: k, sample: it, count: 0 };
      e.count++;
      m.set(k, e);
    }
    return [...m.values()].sort((a, b) => b.count - a.count).slice(0, 5);
  }, [all]);

  const columns = [
    { key: "name", header: "Товар", primary: true, sortable: true, render: (r) => <ProductCell name={r.name} image={r.image} /> },
    { key: "score", header: "Індекс", sortable: true, render: (r) => <ScoreBar score={r.score} /> },
    {
      key: "issues",
      header: "Що покращити",
      sortable: true,
      sortValue: (r) => (r.issues || []).length,
      render: (r) => (r.issues?.length ? <span className="line-clamp-2 break-words text-sm text-(--ink-2)">{r.issues.map(issueKey).join(" · ")}</span> : "—"),
    },
  ];

  return (
    <AnalyticsPage title="Якість карток" description="Наскільки повно заповнені картки товарів і що додати, щоб їх частіше купували" period={period} error={error} onRetry={reload} refreshing={refreshing} allowCompare={false}>
      <section aria-label="Підсумок якості" className="grid min-w-0 grid-cols-1 gap-3 min-[420px]:grid-cols-3">
        <KpiCard label="Середній індекс" value={data?.avg === null || data?.avg === undefined ? "—" : `${formatNumber(data.avg, 0)} / 100`} info={INFO.quality} icon={<MdFactCheck />} loading={loading} />
        <KpiCard label="Слабкі картки (< 60)" value={weak} format="int" hint="Їх варто доповнити насамперед" loading={loading} />
        <KpiCard label="Добрі картки (≥ 80)" value={good} format="int" loading={loading} />
      </section>

      <Card className="min-w-0">
        <CardHeader title="Найчастіші проблеми" description="Виправлення цих пунктів дасть найбільший приріст індексу" icon={<MdTipsAndUpdates />} />
        <CardBody>
          {loading ? (
            <Skeleton lines={4} />
          ) : !common.length ? (
            <p className="text-sm text-(--ink-2)">{all.length ? "Проблем не знайдено — усі картки заповнені добре." : "Товарів ще немає."}</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {common.map((c) => (
                <li key={c.key} className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 font-medium text-(--ink)">
                    <span className="min-w-0 break-words">{c.key}</span>
                    <Badge size="sm">{formatInt(c.count)} тов.</Badge>
                  </p>
                  {qualityTip(c.sample) && <p className="mt-0.5 break-words text-sm text-(--ink-2)">{qualityTip(c.sample)}</p>}
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <Card className="min-w-0">
        <CardBody className="flex min-w-0 flex-col gap-3">
          <div className="max-w-full overflow-x-auto">
            <Segmented
              ariaLabel="Фільтр карток"
              size="sm"
              value={filter}
              onChange={setFilter}
              options={[
                { value: "weak", label: `Слабкі (${formatInt(weak)})` },
                { value: "mid", label: `Середні (${formatInt(all.length - weak - good)})` },
                { value: "all", label: `Усі (${formatInt(all.length)})` },
              ]}
            />
          </div>
          <Table
            caption="Якість карток товарів"
            columns={columns}
            rows={rows}
            rowKey="productId"
            loading={loading}
            onRowClick={setDetail}
            empty={
              all.length
                ? { icon: <MdCheckCircle aria-hidden="true" />, title: "У цій групі карток немає" }
                : { title: "Товарів ще немає", action: <Button as={Link} to="/seller/dashboard/add-product">Додати товар</Button> }
            }
          />
        </CardBody>
      </Card>

      <Drawer
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.name || "Картка товару"}
        footer={
          detail && (
            <div className="flex flex-wrap gap-2">
              <Button as={Link} to={editProductLink(detail.productId)} icon={<MdEdit aria-hidden="true" />}>
                Редагувати картку
              </Button>
              <Button variant="ghost" onClick={() => setDetail(null)}>
                Закрити
              </Button>
            </div>
          )
        }
      >
        {detail && (
          <div className="flex min-w-0 flex-col gap-4">
            <ScoreBar score={detail.score} />
            <IssueList issues={detail.issues} />
          </div>
        )}
      </Drawer>
    </AnalyticsPage>
  );
}
