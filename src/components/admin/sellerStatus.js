// Статуси продавця (sellerModel.status / payment) — з текстом, не лише кольором
export const SELLER_STATUS = {
  active: { label: "Активний", tone: "success" },
  deactive: { label: "Неактивний", tone: "danger" },
  pending: { label: "На модерації", tone: "warning" },
};
export const SELLER_PAYMENT = {
  active: { label: "Виплати підключено", tone: "success" },
  inactive: { label: "Виплати не підключено", tone: "neutral" },
};
