import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { MdPayments, MdCheck } from "react-icons/md";
import {
  confirm_payment_request,
  get_payment_requests,
  messageClear,
} from "../../store/Reducers/paymentSlice";
import {
  PageHeader,
  Table,
  StatusChip,
  Money,
  Button,
  Card,
  Stat,
  Pagination,
  useConfirm,
  formatDate,
} from "../../ui";

const STATUS = { pending: "Очікує підтвердження", success: "Виплачено" };
const PER_PAGE = 20;

const PaymentRequest = () => {
  const dispatch = useDispatch();
  const [confirm, confirmEl] = useConfirm();

  const { successMessage, errorMessage, pendingWithdrawals, loader } = useSelector((state) => state.payment);
  const [paymentId, setPaymentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    Promise.resolve(dispatch(get_payment_requests())).finally(() => setLoading(false));
  }, [dispatch]);

  const confirm_request = async (w) => {
    const ok = await confirm({
      title: "Підтвердити виплату?",
      text: `Підтвердіть, що кошти (${new Intl.NumberFormat("uk-UA").format(Number(w.amount) || 0)} ₴) переказано продавцю. Дію не можна скасувати.`,
      confirmLabel: "Підтвердити виплату",
      tone: "brand",
    });
    if (!ok) return;
    setPaymentId(w._id);
    dispatch(confirm_payment_request(w._id));
  };

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(messageClear());
    }
    if (errorMessage) {
      toast.error(errorMessage);
      dispatch(messageClear());
    }
  }, [successMessage, errorMessage, dispatch]);

  const list = pendingWithdrawals || [];
  const total = list.reduce((s, w) => s + (Number(w?.amount) || 0), 0);
  const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  const cur = Math.min(page, pages);
  const rows = list.slice((cur - 1) * PER_PAGE, cur * PER_PAGE);

  const columns = [
    { key: "no", header: "№", width: "4rem", hideOnCard: true, render: (_, i) => <span className="tabular-nums text-(--ink-2)">{(cur - 1) * PER_PAGE + i + 1}</span> },
    { key: "amount", header: "Сума", primary: true, render: (w) => <Money value={w.amount} className="font-semibold" /> },
    {
      key: "status",
      header: "Статус",
      render: (w) => <StatusChip tone={w.status === "pending" ? "warning" : "success"}>{STATUS[w.status] || w.status || "—"}</StatusChip>,
    },
    { key: "createdAt", header: "Дата заявки", render: (w) => formatDate(w.createdAt, { withTime: true }) },
    {
      key: "action",
      header: "Дія",
      align: "right",
      cardLabel: " ",
      render: (w) => (
        <Button
          size="sm"
          icon={<MdCheck />}
          loading={loader && paymentId === w._id}
          disabled={loader}
          onClick={() => confirm_request(w)}
        >
          Підтвердити
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Заявки на виплату"
        description="Запити продавців на виведення коштів. Підтверджуйте лише після фактичного переказу."
        breadcrumbs={[{ label: "Огляд", to: "/admin/dashboard" }, { label: "Заявки на виплату" }]}
      />

      <Card padded className="mb-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Stat label="Заявок очікує" value={list.length} format="int" loading={loading && !list.length} icon={<MdPayments />} />
          <Stat label="Сума до виплати" value={total} format="money" loading={loading && !list.length} />
        </div>
      </Card>

      <Table
        caption="Заявки на виплату"
        columns={columns}
        rows={rows}
        loading={loading && !list.length}
        empty={{ icon: <MdPayments />, title: "Немає заявок на виплату", text: "Коли продавці запросять виведення коштів, заявки з'являться тут." }}
      />
      <Pagination page={cur} total={list.length} perPage={PER_PAGE} onChange={setPage} />
      {confirmEl}
    </div>
  );
};

export default PaymentRequest;
