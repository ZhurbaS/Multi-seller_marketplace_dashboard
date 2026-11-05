import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { MdOutlinePercent, MdOutlinePerson, MdOutlineStorefront, MdOutlineVerifiedUser } from "react-icons/md";
import {
  get_seller,
  seller_status_update,
  messageClear,
} from "./../../store/Reducers/sellerSlice";
import {
  update_seller_commission,
  messageClear as settingsMessageClear,
} from "../../store/Reducers/settingsSlice";
import { Button, Card, CardBody, CardHeader, Field, Input, PageHeader, Select, Skeleton, useConfirm } from "../../ui";
import { SellerPaymentChip, SellerStatusChip } from "../../components/admin/SellersList";

function InfoList({ items, loading }) {
  return (
    <dl className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)] sm:gap-x-4">
      {items.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-sm text-(--ink-2)">{label}</dt>
          <dd className="-mt-2 min-w-0 break-words text-sm font-medium text-(--ink) sm:mt-0">
            {loading ? <Skeleton width="60%" /> : value || "—"}
          </dd>
        </div>
      ))}
    </dl>
  );
}

const STATUS_OPTIONS = [
  { value: "active", label: "Активний" },
  { value: "deactive", label: "Неактивний" },
];

const SellerDetails = () => {
  const dispatch = useDispatch();
  const { seller, successMessage } = useSelector((state) => state.seller);
  const { sellerId } = useParams();
  const [confirm, confirmEl] = useConfirm();
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingCommission, setSavingCommission] = useState(false);

  useEffect(() => {
    dispatch(get_seller(sellerId));
  }, [dispatch, sellerId]);

  const [status, setStatus] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    if (!status) return;
    if (status === "deactive" && seller?.status !== "deactive") {
      const ok = await confirm({
        title: "Деактивувати продавця?",
        text: "Товари продавця перестануть показуватися в магазині, доки ви знову не активуєте його.",
        confirmLabel: "Деактивувати",
        tone: "danger",
      });
      if (!ok) return;
    }
    setSavingStatus(true);
    Promise.resolve(
      dispatch(
        seller_status_update({
          sellerId,
          status,
        }),
      ),
    ).finally(() => setSavingStatus(false));
  };

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(messageClear());
    }
  }, [successMessage, dispatch]);

  // Індивідуальна комісія: порожньо — за категорією/типова, 0 — власний магазин
  const [commission, setCommission] = useState("");
  const { successMessage: settingsOk, errorMessage: settingsErr } = useSelector((state) => state.settings);
  const commissionError =
    commission !== "" && (!Number.isFinite(Number(commission)) || Number(commission) < 0 || Number(commission) > 50)
      ? "Вкажіть значення від 0 до 50 %"
      : "";
  const saveCommission = (value) => {
    setSavingCommission(true);
    Promise.resolve(
      dispatch(
        update_seller_commission({
          sellerId,
          percent: value === "" ? null : Number(value),
        }),
      ),
    ).finally(() => setSavingCommission(false));
  };

  useEffect(() => {
    if (settingsOk) {
      toast.success(settingsOk);
      dispatch(settingsMessageClear());
    }
    if (settingsErr) {
      toast.error(settingsErr);
      dispatch(settingsMessageClear());
    }
  }, [settingsOk, settingsErr, dispatch]);

  useEffect(() => {
    if (seller) {
      setStatus(seller.status);
      setCommission(typeof seller.commissionPercent === "number" ? String(seller.commissionPercent) : "");
    }
  }, [seller]);

  const loading = !seller || (seller._id && String(seller._id) !== String(sellerId));
  const shopName = seller?.shopInfo?.shopName;

  return (
    <>
      {confirmEl}
      <PageHeader
        title={loading ? "Дані продавця" : shopName || seller?.name || "Дані продавця"}
        description={loading ? undefined : seller?.name && shopName ? `Власник: ${seller.name}` : undefined}
        breadcrumbs={[
          { label: "Головна", to: "/admin/dashboard" },
          { label: "Продавці", to: "/admin/dashboard/sellers" },
          { label: "Дані продавця" },
        ]}
        actions={
          !loading && (
            <div className="flex flex-wrap gap-2">
              <SellerStatusChip status={seller?.status} />
              <SellerPaymentChip payment={seller?.payment} />
            </div>
          )
        }
      />

      <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5">
        <Card className="lg:col-span-1">
          <CardBody className="flex flex-col items-center gap-3 text-center">
            {loading ? (
              <Skeleton width="6rem" height="6rem" rounded="full" />
            ) : seller?.image ? (
              <img src={seller.image} alt={`Фото продавця ${seller?.name || ""}`} className="h-24 w-24 rounded-full border border-(--line) object-cover" />
            ) : (
              <span aria-hidden="true" className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-(--brand-soft) text-3xl font-bold text-(--brand-ink)">
                {String(seller?.name || "?").slice(0, 1).toUpperCase()}
              </span>
            )}
            <div className="min-w-0">
              <p className="break-words text-lg font-semibold text-(--ink)">{loading ? <Skeleton width="8rem" /> : seller?.name}</p>
              <p className="break-all text-sm text-(--ink-2)">{loading ? null : seller?.email}</p>
              {!loading && !seller?.image && <p className="mt-1 text-xs text-(--ink-2)">Зображення не завантажено</p>}
            </div>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Основна інформація" icon={<MdOutlinePerson />} />
          <CardBody>
            <InfoList
              loading={loading}
              items={[
                ["Ім'я", seller?.name],
                ["Email", seller?.email],
                ["Телефон", seller?.phone],
                ["Роль", seller?.role === "seller" ? "Продавець" : seller?.role],
                ["Статус", <SellerStatusChip key="s" status={seller?.status} />],
                ["Виплати", <SellerPaymentChip key="p" payment={seller?.payment} />],
              ]}
            />
          </CardBody>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader title="Магазин і адреса" icon={<MdOutlineStorefront />} />
          <CardBody>
            <InfoList
              loading={loading}
              items={[
                ["Назва магазину", seller?.shopInfo?.shopName],
                [
                  "Сайт",
                  seller?.shopInfo?.shopWebPage ? (
                    <a
                      key="w"
                      href={/^https?:\/\//i.test(seller.shopInfo.shopWebPage) ? seller.shopInfo.shopWebPage : `https://${seller.shopInfo.shopWebPage}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all text-(--brand-ink) hover:underline"
                    >
                      {seller.shopInfo.shopWebPage}
                    </a>
                  ) : null,
                ],
                ["Місто", seller?.shopInfo?.city],
                ["Район", seller?.shopInfo?.district],
                ["Адреса", seller?.shopInfo?.address],
              ]}
            />
          </CardBody>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader title="Статус продавця" description="Неактивний продавець не може продавати." icon={<MdOutlineVerifiedUser />} />
          <CardBody>
            <form onSubmit={submit} className="flex flex-col gap-3">
              <Field label="Статус" required>
                <Select value={status} onChange={(e) => setStatus(e.target.value)} placeholder="Оберіть статус" options={STATUS_OPTIONS} disabled={loading} />
              </Field>
              <Button type="submit" loading={savingStatus} disabled={loading || !status || status === seller?.status} fullWidth>
                Зберегти статус
              </Button>
            </form>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Комісія магазину для цього продавця"
            description="Порожньо — діє ставка категорії або типова. 0 — власний магазин (комісія не нараховується). Змінюється лише для нових замовлень."
            icon={<MdOutlinePercent />}
          />
          <CardBody>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!commissionError) saveCommission(commission);
              }}
              className="flex flex-col gap-3 sm:flex-row sm:items-start"
            >
              <Field label="Комісія, %" hint="Від 0 до 50, крок 0,5" error={commissionError} className="sm:w-56">
                <Input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  max="50"
                  step="0.5"
                  placeholder="за категорією"
                  value={commission}
                  onChange={(e) => setCommission(e.target.value)}
                  disabled={loading}
                />
              </Field>
              <div className="flex flex-wrap gap-2 sm:mt-7">
                <Button type="submit" loading={savingCommission} disabled={loading || !!commissionError}>
                  Зберегти
                </Button>
                <Button
                  variant="secondary"
                  disabled={loading || savingCommission}
                  onClick={() => {
                    setCommission("0");
                    saveCommission("0");
                  }}
                >
                  Власний магазин (0 %)
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </>
  );
};

export default SellerDetails;
