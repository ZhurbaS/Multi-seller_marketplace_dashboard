import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { MdAccountBalanceWallet, MdLock, MdPerson, MdStorefront, MdVisibility, MdVisibilityOff } from "react-icons/md";
import { profile_image_upload, messageClear, profile_info_add, change_password } from "../../store/Reducers/authSlice";
import { create_stripe_connect_account } from "../../store/Reducers/sellerSlice";
import { Button, Card, CardBody, CardHeader, Field, IconButton, ImageDrop, Input, PageHeader, StatusChip } from "../../ui";
import { CountHint, InfoRow } from "../../components/seller/FormKit";
import { useUnsavedChanges } from "../../components/seller/useUnsavedChanges";

const emptyShop = { city: "", district: "", address: "", shopName: "", shopWebPage: "" };
const emptyPassword = { email: "", old_password: "", new_password: "" };
const SHOP_NAME_MAX = 60;

const STATUS_TONE = { active: "success", pending: "warning", deactive: "danger" };
const STATUS_LABEL = { active: "Активний", pending: "На перевірці", deactive: "Деактивований" };
const ROLE_LABEL = { seller: "Продавець", admin: "Адміністратор" };

const isUrl = (v) => {
  if (!v.trim()) return true;
  try {
    const u = new URL(/^https?:\/\//i.test(v.trim()) ? v.trim() : `https://${v.trim()}`);
    return u.hostname.includes(".");
  } catch {
    return false;
  }
};

function validateShop(s) {
  const e = {};
  if (!s.shopName.trim()) e.shopName = "Вкажіть назву магазину";
  else if (s.shopName.length > SHOP_NAME_MAX) e.shopName = `Не більше ${SHOP_NAME_MAX} символів`;
  if (!isUrl(s.shopWebPage)) e.shopWebPage = "Невірна адреса сайту, напр. example.com";
  if (!s.city.trim()) e.city = "Вкажіть місто";
  if (!s.address.trim()) e.address = "Вкажіть адресу";
  return e;
}

function validatePassword(p, confirm) {
  const e = {};
  if (!p.email.trim()) e.email = "Вкажіть email";
  else if (!/^\S+@\S+\.\S+$/.test(p.email.trim())) e.email = "Невірний формат email";
  if (!p.old_password) e.old_password = "Вкажіть діючий пароль";
  if (!p.new_password) e.new_password = "Вкажіть новий пароль";
  else if (p.new_password.length < 8) e.new_password = "Щонайменше 8 символів";
  else if (p.new_password === p.old_password) e.new_password = "Новий пароль має відрізнятися від діючого";
  if (p.new_password && confirm !== p.new_password) e.confirm = "Паролі не збігаються";
  return e;
}

function PasswordInput({ ...props }) {
  const [show, setShow] = useState(false);
  return (
    <Input
      {...props}
      type={show ? "text" : "password"}
      rightSlot={
        <IconButton
          size="sm"
          icon={show ? <MdVisibilityOff /> : <MdVisibility />}
          label={show ? "Сховати пароль" : "Показати пароль"}
          onClick={() => setShow((v) => !v)}
        />
      }
    />
  );
}

const Profile = () => {
  const dispatch = useDispatch();
  const { userInfo, successMessage, errorMessage } = useSelector((state) => state.auth);

  const [state, setState] = useState(emptyShop);
  const [shopSubmitted, setShopSubmitted] = useState(false);
  const [passwordData, setPasswordData] = useState(emptyPassword);
  const [confirm, setConfirm] = useState("");
  const [pwSubmitted, setPwSubmitted] = useState(false);
  const [busy, setBusy] = useState(null); // 'image' | 'shop' | 'password' | 'stripe'

  const inputHandle = (e) => setState({ ...state, [e.target.name]: e.target.value });
  const passwordInputHandle = (e) => setPasswordData({ ...passwordData, [e.target.name]: e.target.value });

  const shopErrors = useMemo(() => validateShop(state), [state]);
  const pwErrors = useMemo(() => validatePassword(passwordData, confirm), [passwordData, confirm]);

  const shopDirty = !userInfo?.shopInfo && JSON.stringify(state) !== JSON.stringify(emptyShop);
  const pwDirty = !!(passwordData.old_password || passwordData.new_password);
  const { element: leaveDialog } = useUnsavedChanges((shopDirty || pwDirty) && !busy);

  const run = (key, action) => {
    setBusy(key);
    return dispatch(action).finally(() => setBusy(null));
  };

  const add_image = (file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("image", file);
    run("image", profile_image_upload(formData));
  };

  const add = (e) => {
    e.preventDefault();
    setShopSubmitted(true);
    if (Object.keys(shopErrors).length) {
      toast.error("Перевірте виділені поля");
      return;
    }
    run("shop", profile_info_add(state));
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwSubmitted(true);
    if (Object.keys(pwErrors).length) {
      toast.error("Перевірте виділені поля");
      return;
    }
    const res = await run("password", change_password(passwordData));
    if (change_password.fulfilled.match(res)) {
      setPasswordData(emptyPassword);
      setConfirm("");
      setPwSubmitted(false);
    }
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

  const se = shopSubmitted ? shopErrors : {};
  const pe = pwSubmitted ? pwErrors : {};
  const status = userInfo?.status;

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader title="Профіль" description="Особисті дані, інформація про магазин і безпека облікового запису." />

      <div className="grid min-w-0 gap-4 sm:gap-5 lg:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
          <Card as="section">
            <CardHeader title="Обліковий запис" icon={<MdPerson />} />
            <CardBody className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <div className="w-full shrink-0 sm:w-52">
                <ImageDrop
                  label="Фото або логотип"
                  value={userInfo?.image || null}
                  onChange={add_image}
                  removable={false}
                  maxSizeMb={5}
                  disabled={busy === "image"}
                  hint={busy === "image" ? "Завантаження…" : "Квадратне зображення від 200×200 px"}
                  emptyText="Перетягніть фото або натисніть"
                  previewClassName="sm:w-full aspect-square object-cover"
                />
              </div>
              <dl className="min-w-0 flex-1 divide-y divide-(--line)">
                <InfoRow label="Ім'я">{userInfo?.name}</InfoRow>
                <InfoRow label="Email">{userInfo?.email}</InfoRow>
                <InfoRow label="Телефон">{userInfo?.phone}</InfoRow>
                <InfoRow label="Роль">{ROLE_LABEL[userInfo?.role] || userInfo?.role}</InfoRow>
                <InfoRow label="Статус">
                  {status ? <StatusChip tone={STATUS_TONE[status] || "neutral"}>{STATUS_LABEL[status] || status}</StatusChip> : null}
                </InfoRow>
              </dl>
            </CardBody>
          </Card>

          <Card as="section">
            <CardHeader
              title="Рахунок для виплат"
              description="Підключіть платіжний рахунок, щоб отримувати виплати за продажі."
              icon={<MdAccountBalanceWallet />}
            />
            <CardBody className="flex flex-wrap items-center justify-between gap-3">
              {userInfo?.payment === "active" ? (
                <StatusChip tone="success">Рахунок активовано</StatusChip>
              ) : (
                <>
                  <StatusChip tone="warning">Не активовано</StatusChip>
                  <Button loading={busy === "stripe"} onClick={() => run("stripe", create_stripe_connect_account())}>
                    Активувати
                  </Button>
                </>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
          <Card as="section">
            <CardHeader
              title="Магазин"
              description={userInfo?.shopInfo ? "Дані, які бачать покупці." : "Заповніть дані магазину — вони з'являться на сторінці продавця."}
              icon={<MdStorefront />}
            />
            <CardBody>
              {!userInfo?.shopInfo ? (
                <form onSubmit={add} noValidate className="flex flex-col gap-4" aria-busy={busy === "shop" || undefined}>
                  <Field label="Назва магазину" required error={se.shopName} hint={<CountHint length={state.shopName.length} max={SHOP_NAME_MAX} />}>
                    <Input
                      name="shopName"
                      value={state.shopName}
                      onChange={inputHandle}
                      autoComplete="organization"
                      maxLength={SHOP_NAME_MAX + 10}
                      placeholder="Назва магазину"
                    />
                  </Field>
                  <Field label="Сайт" error={se.shopWebPage} hint="Необов'язково">
                    <Input
                      name="shopWebPage"
                      type="url"
                      inputMode="url"
                      autoComplete="url"
                      value={state.shopWebPage}
                      onChange={inputHandle}
                      placeholder="https://example.com"
                    />
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Місто" required error={se.city}>
                      <Input name="city" value={state.city} onChange={inputHandle} autoComplete="address-level2" placeholder="Київ" />
                    </Field>
                    <Field label="Район" error={se.district}>
                      <Input name="district" value={state.district} onChange={inputHandle} autoComplete="address-level3" placeholder="Район" />
                    </Field>
                  </div>
                  <Field label="Адреса" required error={se.address}>
                    <Input name="address" value={state.address} onChange={inputHandle} autoComplete="street-address" placeholder="вул. Хрещатик, 1" />
                  </Field>
                  <div className="flex justify-end">
                    <Button type="submit" loading={busy === "shop"} className="w-full sm:w-auto">
                      Зберегти дані магазину
                    </Button>
                  </div>
                </form>
              ) : (
                <dl className="divide-y divide-(--line)">
                  <InfoRow label="Назва магазину">{userInfo.shopInfo?.shopName}</InfoRow>
                  <InfoRow label="Сайт">
                    {userInfo.shopInfo?.shopWebPage ? (
                      <a
                        href={/^https?:\/\//i.test(userInfo.shopInfo.shopWebPage) ? userInfo.shopInfo.shopWebPage : `https://${userInfo.shopInfo.shopWebPage}`}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="break-all text-(--brand-ink) hover:underline"
                      >
                        {userInfo.shopInfo.shopWebPage}
                      </a>
                    ) : null}
                  </InfoRow>
                  <InfoRow label="Місто">{userInfo.shopInfo?.city}</InfoRow>
                  <InfoRow label="Район">{userInfo.shopInfo?.district}</InfoRow>
                  <InfoRow label="Адреса">{userInfo.shopInfo?.address}</InfoRow>
                </dl>
              )}
            </CardBody>
          </Card>

          <Card as="section">
            <CardHeader title="Змінити пароль" description="Після зміни використовуйте новий пароль для входу." icon={<MdLock />} />
            <CardBody>
              <form onSubmit={handlePasswordChange} noValidate className="flex flex-col gap-4" aria-busy={busy === "password" || undefined}>
                <Field label="Email" required error={pe.email}>
                  <Input
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="username"
                    value={passwordData.email}
                    onChange={passwordInputHandle}
                    placeholder={userInfo?.email || "you@example.com"}
                  />
                </Field>
                <Field label="Діючий пароль" required error={pe.old_password}>
                  <PasswordInput name="old_password" autoComplete="current-password" value={passwordData.old_password} onChange={passwordInputHandle} />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Новий пароль" required error={pe.new_password} hint="Щонайменше 8 символів">
                    <PasswordInput name="new_password" autoComplete="new-password" value={passwordData.new_password} onChange={passwordInputHandle} />
                  </Field>
                  <Field label="Повторіть пароль" required error={pe.confirm}>
                    <PasswordInput name="confirm_password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
                  </Field>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" loading={busy === "password"} className="w-full sm:w-auto">
                    Змінити пароль
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>
      </div>
      {leaveDialog}
    </div>
  );
};

export default Profile;
