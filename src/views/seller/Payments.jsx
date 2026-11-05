import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { MdAccountBalanceWallet, MdHistory, MdHourglassTop, MdInfoOutline, MdPayments, MdSend, MdTrendingUp } from "react-icons/md";
import { get_seller_payment_details, messageClear, send_withdrawal_request } from "../../store/Reducers/paymentSlice";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Field,
  Input,
  KpiCard,
  Money,
  PageHeader,
  Pagination,
  StatusChip,
  Table,
  formatDate,
  formatMoney,
} from "../../ui";

// Після виведення на балансі має лишитися більше 10 ₴ (правило, як і раніше).
const MIN_REST = 10;
const PER_PAGE = 8;

const WITHDRAW_STATUS = {
  pending: { tone: "warning", label: "Очікує" },
  success: { tone: "success", label: "Виплачено" },
  rejected: { tone: "danger", label: "Відхилено" },
};

function WithdrawStatus({ status }) {
  const s = WITHDRAW_STATUS[status] || { tone: "neutral", label: status || "—" };
  return <StatusChip tone={s.tone}>{s.label}</StatusChip>;
}

function WithdrawTable({ rows, loading, emptyTitle, emptyText }) {
  const [page, setPage] = useState(1);
  const slice = rows.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const columns = [
    { key: "createdAt", header: "Дата", primary: true, render: (r) => formatDate(r.createdAt) },
    { key: "amount", header: "Сума", align: "right", render: (r) => <Money value={r.amount} className="font-semibold" /> },
    { key: "status", header: "Статус", align: "right", render: (r) => <WithdrawStatus status={r.status} /> },
  ];
  return (
    <>
      <Table
        columns={columns}
        rows={slice}
        rowKey={(r, i) => r._id || i}
        loading={loading}
        skeletonRows={3}
        dense
        empty={{ icon: <MdHistory />, title: emptyTitle, text: emptyText }}
        className="border-0 rounded-none"
      />
      <Pagination page={page} total={rows.length} perPage={PER_PAGE} onChange={setPage} showSummary={false} className="px-4 pb-4" />
    </>
  );
}

const Payment = () => {
  const dispatch = useDispatch();

  const { userInfo } = useSelector((state) => state.auth);
  const {
    successMessage,
    errorMessage,
    loader,
    totalAmount,
    pendingAmount,
    withdrawalAmount,
    availableAmount,
    holdAmount,
    successWithdrawals,
    pendingWithdrawals,
  } = useSelector((state) => state.payment);

  const [amount, setAmount] = useState("");
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(true);

  const maxAmount = Math.max(0, Math.ceil((Number(availableAmount) || 0) - MIN_REST) - 1);

  const amountError = useMemo(() => {
    const v = String(amount).trim();
    if (!v) return "Вкажіть суму";
    if (!/^\d+$/.test(v) || Number(v) <= 0) return "Ціле число гривень, більше 0";
    if (!(availableAmount - Number(v) > MIN_REST)) return maxAmount > 0 ? `Недостатній залишок: максимум ${formatMoney(maxAmount)}` : "Недостатній залишок";
    return "";
  }, [amount, availableAmount, maxAmount]);

  const sendRequest = (e) => {
    e.preventDefault();
    setTouched(true);
    if (amountError) {
      toast.error(amountError);
      return;
    }
    if (availableAmount - amount > MIN_REST) {
      dispatch(send_withdrawal_request({ amount, sellerId: userInfo._id }));
      setAmount("");
      setTouched(false);
    } else {
      toast.error("Недостатній залишок");
    }
  };

  useEffect(() => {
    if (!userInfo?._id) return;
    setLoading(true);
    dispatch(get_seller_payment_details(userInfo._id)).finally(() => setLoading(false));
  }, [dispatch, userInfo?._id]);

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

  return (
    <div className="mx-auto w-full">
      <PageHeader title="Платежі" description="Баланс, запити на виведення коштів та історія виплат." />

      <div className="mb-5 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <KpiCard label="Загальні продажі" value={totalAmount} format="money" icon={<MdTrendingUp />} loading={loading} info="Сума всіх ваших продажів за весь час" />
        <KpiCard label="Доступно до виведення" value={availableAmount} format="money" icon={<MdAccountBalanceWallet />} loading={loading} />
        <KpiCard label="Виплачено" value={withdrawalAmount} format="money" icon={<MdPayments />} loading={loading} info="Сума успішно виведених коштів" />
        <KpiCard label="Очікує виплати" value={pendingAmount} format="money" icon={<MdHourglassTop />} loading={loading} info="Сума запитів на виведення, що ще обробляються" />
      </div>

      {holdAmount > 0 && (
        <div className="mb-5 flex min-w-0 items-start gap-3 rounded-(--r-lg) border border-(--warning)/30 bg-(--warning-soft) p-3 text-sm text-(--ink)">
          <MdInfoOutline aria-hidden="true" className="mt-0.5 shrink-0 text-lg text-(--warning-ink)" />
          <p className="min-w-0">
            На утриманні: <b className="tabular-nums">{formatMoney(holdAmount)}</b> — кошти за замовленнями, які ще не доставлені або у терміні
            повернення. Вони стануть доступними автоматично.
          </p>
        </div>
      )}

      <div className="grid min-w-0 gap-4 sm:gap-5 lg:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
          <Card as="section">
            <CardHeader title="Запит на виведення" description={`На балансі має залишитися більше ${formatMoney(MIN_REST)}.`} icon={<MdSend />} />
            <CardBody>
              <form onSubmit={sendRequest} noValidate className="flex flex-col gap-3 sm:flex-row sm:items-start">
                <Field
                  label="Сума, ₴"
                  required
                  error={touched ? amountError : ""}
                  hint={
                    maxAmount > 0 ? (
                      <span>
                        Можна вивести до <span className="tabular-nums">{formatMoney(maxAmount)}</span> ·{" "}
                        <button
                          type="button"
                          className="font-medium text-(--brand-ink) underline-offset-2 hover:underline"
                          onClick={() => setAmount(String(maxAmount))}
                          disabled={loader}
                        >
                          Вказати максимум
                        </button>
                      </span>
                    ) : (
                      "Поки немає коштів для виведення"
                    )
                  }
                  className="flex-1"
                >
                  <Input
                    name="amount"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="off"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))}
                    onBlur={() => amount && setTouched(true)}
                    placeholder="0"
                    disabled={loader}
                  />
                </Field>
                <Button type="submit" icon={<MdSend />} loading={loader} disabled={maxAmount <= 0} className="sm:mt-7">
                  Надіслати запит
                </Button>
              </form>
            </CardBody>
          </Card>

          <Card as="section">
            <CardHeader title="Запити в очікуванні" description={pendingWithdrawals.length ? `Кількість: ${pendingWithdrawals.length}` : undefined} icon={<MdHourglassTop />} />
            <div className="mt-3">
              <WithdrawTable rows={pendingWithdrawals} loading={loading} emptyTitle="Немає запитів в очікуванні" emptyText="Надіслані запити з'являться тут до виплати." />
            </div>
          </Card>
        </div>

        <Card as="section">
          <CardHeader title="Історія виплат" description={successWithdrawals.length ? `Кількість: ${successWithdrawals.length}` : undefined} icon={<MdHistory />} />
          <div className="mt-3">
            <WithdrawTable rows={successWithdrawals} loading={loading} emptyTitle="Виплат ще не було" emptyText="Успішні виведення коштів з'являться тут." />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Payment;
