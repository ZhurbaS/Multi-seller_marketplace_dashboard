// Підписи для заявок на повернення
export const RETURN_STATUS = {
  requested: "Нова заявка",
  approved: "Схвалено, очікуємо товар",
  shipped: "Товар у дорозі",
  received: "Товар отримано",
  refund_pending: "Повернення коштів",
  refunded: "Кошти повернено",
  exchanged: "Обмінено",
  rejected: "Відхилено",
  cancelled: "Відкликано",
};

export const RETURN_REASON = {
  withdrawal: "Відмова (передумав)",
  defect: "Брак / дефект",
  wrong_item: "Не той товар / некомплект",
  refused: "Відмова від отримання",
  cancel_unshipped: "Скасування до відправки",
  cancel_by_store: "Скасовано магазином",
  other: "Інше",
};

export const PAYER = {
  seller: "Продавець",
  store: "Магазин (платформа)",
  customer: "Покупець (утримати з повернення)",
};

export const REFUND_STATUS = {
  none: "—",
  pending: "Очікує рішення/виконання",
  processing: "Банк обробляє",
  success: "Виконано",
  failed: "Помилка",
};

export const fmtDate = (d, withTime = false) =>
  d
    ? new Date(d).toLocaleString("uk-UA", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
      })
    : "";
