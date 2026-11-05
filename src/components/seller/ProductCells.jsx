import { MdImageNotSupported } from "react-icons/md";
import { StatusChip, cx } from "../../ui";

/** Мініатюра товару (з плейсхолдером, якщо фото немає). */
export function ProductThumb({ src, alt = "", size = "md", className }) {
  const s = size === "sm" ? "h-10 w-10" : size === "lg" ? "h-16 w-16" : "h-12 w-12";
  return src ? (
    <img src={src} alt={alt} loading="lazy" className={cx(s, "shrink-0 rounded-(--r-md) border border-(--line) bg-(--surface-2) object-cover", className)} />
  ) : (
    <span aria-hidden="true" className={cx(s, "inline-flex shrink-0 items-center justify-center rounded-(--r-md) border border-(--line) bg-(--surface-2) text-xl text-(--ink-2)", className)}>
      <MdImageNotSupported />
    </span>
  );
}

/** Статус залишку текстом + кольором. */
export function StockChip({ stock }) {
  const n = Number(stock) || 0;
  if (n <= 0) return <StatusChip tone="danger">Немає в наявності</StatusChip>;
  if (n <= 3) return <StatusChip tone="warning">Закінчується: {n}</StatusChip>;
  return <StatusChip tone="success">{n} шт</StatusChip>;
}
