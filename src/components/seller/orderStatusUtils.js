export const DELIVERY_TONE = {
  pending: "warning",
  placed: "brand",
  processing: "brand",
  packing: "brand",
  shipped: "brand",
  delivered: "success",
  cancelled: "danger",
};

export const PAYMENT_TONE = { paid: "success", unpaid: "warning" };

/** Короткий номер підзамовлення продавця (останні 6 символів id). */
export const shortId = (id) => `№${String(id || "").slice(-6).toUpperCase()}`;
