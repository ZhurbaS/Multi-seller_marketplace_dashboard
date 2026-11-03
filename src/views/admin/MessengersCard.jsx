import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/api";

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

  useEffect(() => {
    api
      .get("/admin/settings/messengers")
      .then(({ data }) => setM(data.messengers))
      .catch(() => toast.error("Не вдалося завантажити налаштування месенджерів"));
  }, []);

  if (!m) return null;

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
    <div className="w-full p-4 bg-[#6a5fdf] rounded-md text-[#d0d2d6] flex flex-col gap-3 max-w-[900px] mt-4">
      <h2 className="text-lg font-semibold">Надсилання рахунку в месенджери</h2>
      <p className="text-xs opacity-80">
        За замовчуванням рахунок надсилається на e-mail. Увімкніть месенджер, щоб покупець міг обрати його на оформленні. Якщо ключі API не
        задані, рахунок у месенджер надсилаєте ви вручну (в замовленні є кнопка «Відкрити чат» і PDF); коли ключі задано — відправка
        автоматична, а у разі помилки рахунок іде на e-mail.
      </p>
      {Object.entries(META).map(([id, info]) => (
        <div key={id} className="p-3 rounded-md bg-[#5b51c9] flex flex-col gap-1">
          <label className="flex items-center gap-2 font-semibold">
            <input type="checkbox" disabled={busy} checked={m[id].enabled} onChange={() => toggle(id)} />
            {info.title}
          </label>
          <div className="text-xs">
            Автоматична відправка:{" "}
            <b className={m[id].configured ? "text-green-300" : "text-yellow-200"}>
              {m[id].configured ? "налаштовано (працює)" : "не налаштовано — надсилаєте вручну"}
            </b>
          </div>
          {!m[id].configured && (
            <div className="text-xs opacity-80">
              Змінні .env бекенда: <code>{info.env}</code>. Вебхук статусів: <code>{info.hook}</code>.
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default MessengersCard;
