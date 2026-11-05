import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { MdAssignmentReturn, MdInfoOutline } from "react-icons/md";
import api from "../../api/api";
import { RETURN_STATUS, RETURN_REASON, fmtDate } from "../../utils/returnLabels";
import { Money, PageHeader, Pagination, StatusChip, Table } from "../../ui";

const PER_PAGE = 10;

const STATUS_TONE = {
  requested: "warning",
  approved: "brand",
  shipped: "brand",
  received: "brand",
  refund_pending: "warning",
  refunded: "success",
  exchanged: "success",
  rejected: "danger",
  cancelled: "neutral",
};

const INSPECTION = { ok: "Товар у порядку", damaged: "Пошкоджений", mismatch: "Невідповідність" };

// Продавець бачить заявки на повернення своїх товарів (лише перегляд) і вплив на свій баланс
const Returns = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    api
      .get("/seller/returns")
      .then(({ data }) => setList(Array.isArray(data?.requests) ? data.requests : []))
      .catch((e) => toast.error(e.response?.data?.error || "Не вдалося завантажити повернення"))
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    {
      key: "number",
      header: "Заявка",
      primary: true,
      render: (r) => (
        <div className="min-w-0">
          <p className="font-semibold tabular-nums text-(--ink)">№{r.number}</p>
          <p className="text-xs text-(--ink-2)">{fmtDate(r.createdAt)}</p>
        </div>
      ),
    },
    { key: "reason", header: "Причина", render: (r) => RETURN_REASON[r.reason] || r.reason || "—" },
    {
      key: "items",
      header: "Товари",
      className: "max-w-[18rem]",
      render: (r) => (
        <ul className="flex min-w-0 flex-col gap-0.5">
          {(r.items || []).map((i, k) => (
            <li key={k} className="break-words">
              {i.name} <span className="whitespace-nowrap text-(--ink-2) tabular-nums">× {i.quantity}</span>
            </li>
          ))}
        </ul>
      ),
    },
    {
      key: "status",
      header: "Статус",
      render: (r) => <StatusChip tone={STATUS_TONE[r.status] || "neutral"}>{RETURN_STATUS[r.status] || r.status}</StatusChip>,
    },
    {
      key: "inspection",
      header: "Огляд",
      className: "max-w-[16rem]",
      render: (r) => (
        <div className="flex min-w-0 flex-col gap-0.5 text-sm">
          <span className="break-words">
            {INSPECTION[r.inspection?.result] || "—"}
            {r.inspection?.note ? ` — ${r.inspection.note}` : ""}
          </span>
          {r.shippingCost > 0 && (
            <span className="text-xs text-(--ink-2)">
              Зворотна доставка (за ваш рахунок): <Money value={r.shippingCost} />
            </span>
          )}
          {r.deduction > 0 && (
            <span className="text-xs text-(--ink-2)">
              Утримано з покупця: <Money value={r.deduction} />
            </span>
          )}
        </div>
      ),
    },
    {
      key: "balanceImpact",
      header: "Вплив на баланс",
      align: "right",
      render: (r) => (r.balanceImpact ? <Money value={r.balanceImpact} className="font-semibold text-(--danger)" /> : "—"),
    },
  ];

  return (
    <div className="mx-auto w-full">
      <PageHeader title="Повернення" description="Заявки на повернення ваших товарів і їхній вплив на баланс." />

      <div className="mb-4 flex min-w-0 items-start gap-3 rounded-(--r-lg) border border-(--line) bg-(--surface) p-3 text-sm text-(--ink-2)">
        <MdInfoOutline aria-hidden="true" className="mt-0.5 shrink-0 text-lg text-(--brand-ink)" />
        <p className="min-w-0">
          Рішення про повернення приймає магазин. Тут видно заявки щодо ваших товарів і суми, списані з вашого балансу (повернення товару
          та, якщо передбачено умовами, зворотна доставка). Подробиці — у розділі{" "}
          <Link to="/seller/dashboard/payments" className="font-medium text-(--brand-ink) hover:underline">
            «Платежі»
          </Link>
          .
        </p>
      </div>

      <Table
        caption="Заявки на повернення"
        columns={columns}
        rows={list.slice((page - 1) * PER_PAGE, page * PER_PAGE)}
        loading={loading}
        empty={{ icon: <MdAssignmentReturn />, title: "Заявок немає", text: "Якщо покупець оформить повернення вашого товару, заявка з'явиться тут." }}
      />
      <Pagination page={page} total={list.length} perPage={PER_PAGE} onChange={setPage} />
    </div>
  );
};

export default Returns;
