import { MdShowChart } from "react-icons/md";
import { Skeleton } from "../Skeleton";

export const DEFAULT_EMPTY = "Даних поки мало — з'являться після перших замовлень";

/** Внутрішнє: skeleton або порожній стан замість графіка. */
export function ChartPlaceholder({ loading, height = 260, emptyText = DEFAULT_EMPTY }) {
  if (loading) return <Skeleton height={height} className="w-full" />;
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 rounded-(--r-md) border border-dashed border-(--line) bg-(--surface-2)/50 px-4 text-center"
      style={{ minHeight: height }}
    >
      <MdShowChart aria-hidden="true" className="text-3xl text-(--ink-2)" />
      <p className="max-w-xs text-sm text-(--ink-2)">{emptyText}</p>
    </div>
  );
}
