import { cx } from "./cx";
import { formatMoney } from "./format";

/**
 * Money({ value, compact, digits, currency, className, as })
 * Сума ₴ uk-UA, tabular-nums; ніколи не виходить за межі блоку:
 * однорядкова, truncate, повне значення в title (коли compact або обрізано).
 */
export function Money({ value, compact = false, digits, currency = "UAH", as = "span", className, ...rest }) {
  const Comp = as;
  const text = formatMoney(value, { compact, digits, currency });
  const full = formatMoney(value, { currency });
  return (
    <Comp
      className={cx("inline-block max-w-full min-w-0 truncate whitespace-nowrap align-bottom tabular-nums", className)}
      title={full}
      data-num=""
      {...rest}
    >
      {text}
    </Comp>
  );
}
