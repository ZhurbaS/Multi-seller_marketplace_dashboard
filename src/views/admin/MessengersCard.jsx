import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { MdChat } from "react-icons/md";
import api from "../../api/api";
import { Card, CardHeader, CardBody, Switch, StatusChip, Skeleton } from "../../ui";

const META = {
  whatsapp: {
    title: "WhatsApp (Business Cloud API, Meta)",
    env: "WHATSAPP_TOKEN, WHATSAPP_PHONE_ID, WHATSAPP_TEMPLATE_INVOICE (+ WHATSAPP_APP_SECRET, WHATSAPP_VERIFY_TOKEN для вебхука)",
    hook: "/api/webhooks/whatsapp",
  },
  viber: {
    title: "Viber (Business Messages через партнера)",
    env: "VIBER_API_URL, VIBER_TOKEN, VIBER_SENDER (+ VIBER_WEBHOOK_SECRET для вебхука)",
    hook: "/api/webhooks/viber",
  },
};

// Куди покупець може попросити надіслати рахунок. За замовчуванням — лише e-mail.
// Перемикач керує показом варіанта на оформленні; автоматична відправка працює, коли в .env бекенда задано ключі провайдера.
const MessengersCard = () => {
  const [m, setM] = useState(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    api
      .get("/admin/settings/messengers")
      .then(({ data }) => setM(data.messengers))
      .catch(() => {
        setFailed(true);
        toast.error("Не вдалося завантажити налаштування месенджерів");
      });
  }, []);

  if (failed) return null;

  const toggle = async (id) => {
    const next = Object.fromEntries(Object.keys(m).map((k) => [k, k === id ? !m[k].enabled : m[k].enabled]));
    setBusy(true);
    try {
      const { data } = await api.put("/admin/settings/messengers", next);
      setM(data.messengers);
      toast.success("Збережено");
    } catch (e) {
      toast.error(e.response?.data?.error || "Не вдалося зберегти");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader
        title="Надсилання рахунку в месенджери"
        icon={<MdChat />}
        description="За замовчуванням рахунок надсилається на e-mail. Увімкніть месенджер, щоб покупець міг обрати його на оформленні. Без ключів API рахунок надсилаєте ви вручну (у замовленні є «Відкрити чат» і PDF); з ключами — автоматично, а при помилці рахунок іде на e-mail."
      />
      <CardBody className="space-y-3">
        {!m ? (
          <>
            <Skeleton height={64} rounded="md" />
            <Skeleton height={64} rounded="md" />
          </>
        ) : (
          Object.entries(META).map(([id, info]) => (
            <div key={id} className="min-w-0 rounded-(--r-md) border border-(--line) p-3 sm:p-4">
              <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
                <Switch checked={!!m[id]?.enabled} disabled={busy} onChange={() => toggle(id)} label={info.title} />
                <StatusChip tone={m[id]?.configured ? "success" : "warning"}>
                  {m[id]?.configured ? "Автовідправка налаштована" : "Надсилаєте вручну"}
                </StatusChip>
              </div>
              {!m[id]?.configured && (
                <p className="mt-2 break-words text-xs text-(--ink-2)">
                  Змінні .env бекенда: <code className="break-all">{info.env}</code>. Вебхук статусів: <code>{info.hook}</code>.
                </p>
              )}
            </div>
          ))
        )}
      </CardBody>
    </Card>
  );
};

export default MessengersCard;
