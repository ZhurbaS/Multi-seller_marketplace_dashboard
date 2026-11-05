import { MdSearch, MdClose } from "react-icons/md";
import { cx } from "./cx";
import { Input } from "./Form";
import { Button, IconButton } from "./Button";

/** Toolbar({ children, sticky, className }) — горизонтальна панель дій, що переноситься. */
export function Toolbar({ children, sticky = false, className }) {
  return (
    <div
      className={cx(
        "flex min-w-0 flex-wrap items-center gap-2",
        sticky && "sticky top-(--topbar-h) z-20 -mx-4 bg-(--page)/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * FilterBar({ search:{value,onChange(value),placeholder}, children (фільтри), onReset, resetLabel, actions })
 */
export function FilterBar({ search, children, onReset, resetLabel = "Скинути", actions, className }) {
  return (
    <div
      role="search"
      className={cx(
        "mb-4 flex min-w-0 flex-col gap-2 rounded-(--r-lg) border border-(--line) bg-(--surface) p-3 sm:flex-row sm:flex-wrap sm:items-center",
        className,
      )}
    >
      {search && (
        <Input
          type="search"
          inputMode="search"
          autoComplete="off"
          aria-label={search.placeholder || "Пошук"}
          placeholder={search.placeholder || "Пошук"}
          value={search.value ?? ""}
          onChange={(e) => search.onChange?.(e.target.value)}
          leftIcon={<MdSearch />}
          rightSlot={
            search.value ? <IconButton size="sm" icon={<MdClose />} label="Очистити пошук" onClick={() => search.onChange?.("")} /> : null
          }
          className="sm:max-w-xs sm:flex-1"
        />
      )}
      {children && <div className="flex min-w-0 flex-wrap items-center gap-2">{children}</div>}
      {(onReset || actions) && (
        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          {onReset && (
            <Button variant="ghost" size="sm" onClick={onReset}>
              {resetLabel}
            </Button>
          )}
          {actions}
        </div>
      )}
    </div>
  );
}
