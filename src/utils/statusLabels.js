// Підписи статусів і адреси доставки (українською)
export const PAYMENT_STATUS = { paid: "Оплачено", unpaid: "Не оплачено" };

export const DELIVERY_STATUS = {
  pending: "Очікує обробки",
  placed: "Розміщено",
  processing: "Опрацьовується",
  packing: "Готується до відправки",
  shipped: "Відправлено",
  delivered: "Доставлено",
  cancelled: "Скасовано",
};

export const payLabel = (s) => PAYMENT_STATUS[s] || s || "—";
export const deliveryLabel = (s) => DELIVERY_STATUS[s] || s || "—";

export const DELIVERY_TYPE = {
  nova_poshta_warehouse: "Нова пошта — у відділення",
  nova_poshta_courier: "Нова пошта — кур'єр",
  ukrposhta: "Укрпошта",
  pickup: "Самовивіз",
};

// Адреса доставки одним рядком (підтримує старі замовлення з іншим набором полів)
export const formatAddress = (si) => {
  if (!si || typeof si !== "object") return String(si || "");
  const parts = [
    si.district,
    si.city,
    si.warehouse ? `відділення № ${si.warehouse}` : "",
    si.area,
    si.address,
    si.post,
  ].filter(Boolean);
  return parts.join(", ");
};

export const recipientText = (si) => {
  const r = si?.recipient;
  if (!r?.other) return "";
  return `${r.lastName} ${r.firstName}${r.middleName ? ` ${r.middleName}` : ""}, ${r.phone}`;
};
