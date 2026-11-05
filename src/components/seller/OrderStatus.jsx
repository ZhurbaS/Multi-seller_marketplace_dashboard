import { StatusChip } from "../../ui";
import { deliveryLabel, payLabel } from "../../utils/statusLabels";
import { DELIVERY_TONE, PAYMENT_TONE } from "./orderStatusUtils";


export function DeliveryChip({ status }) {
  return <StatusChip tone={DELIVERY_TONE[status] || "neutral"}>{deliveryLabel(status)}</StatusChip>;
}

export function PaymentChip({ status }) {
  return <StatusChip tone={PAYMENT_TONE[status] || "neutral"}>{payLabel(status)}</StatusChip>;
}
