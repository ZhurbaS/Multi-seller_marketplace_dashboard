# UI-кіт дашборду

Імпорт лише з барелю: `import { Button, Card, KpiCard, LineAreaChart, formatMoney } from "../../ui";`

Кольори — тільки токени: `bg-(--surface) text-(--ink) border-(--line)` або alias-и `bg-surface text-ink border-line bg-brand text-brand-ink bg-success-soft text-warning-ink text-chart-1 …`. Радіуси `rounded-(--r-sm|md|lg)`, тіні `shadow-(--shadow-1|2|3)`. Жодних hex у класах.
Темна тема: `<html data-theme="dark">` (перемикач у шапці). Тема магазину (brand/cta) підтягується автоматично.

Конвенції: `delta` = відсотки (12.5 → «+12,5 %»), `null` → «—». Частки 0..1 — формат `'ratio'` або `{ ratio: true }`.
`format` (KpiCard/Stat/графіки): `'money' | 'int' | 'pct' | 'ratio' | 'number' | 'raw' | (v) => string`.
Дати періодів — рядки `'YYYY-MM-DD'` (Europe/Kyiv).

## Базові

| Компонент | Props |
|---|---|
| `Button` | `variant: primary\|secondary\|ghost\|danger\|cta` (primary), `size: sm\|md\|lg` (md = 44px), `loading`, `icon`, `iconRight`, `fullWidth`, `as` (напр. `Link` + `to`), `type` (button), `disabled`, + нативні |
| `IconButton` | `icon`, **`label`** (aria-label+title, обов'язково), `variant` (ghost), `size`, `badge` (число/текст), `loading`, `as` |
| `Spinner` | `className`, `label` |
| `Card` | `as` (div), `padded` (bool), `interactive` (hover-тінь), `className` |
| `CardHeader` | `title`, `description`, `icon`, `actions`, `as` (h2) |
| `CardBody` / `CardFooter` | `className`, children |
| `PageHeader` | `title`, `description`, `actions`, `breadcrumbs: [{label, to?}]` |
| `KpiCard` | `label`, `value` (число або вузол), `delta` (% або null), `deltaLabel` («vs попередній період»), `hint`, `icon`, `loading`, `format` (raw), `compact` (12,3 тис. ₴), `invertDelta` (ріст = погано), `sparkline: number[]`, `info` (tooltip «що це»), `onClick` |
| `Stat` | ті самі, що `KpiCard` (без `sparkline`/`onClick`), компактний вигляд без рамки |
| `Badge` | `tone: neutral\|brand\|success\|warning\|danger`, `size: sm\|md`, `icon`, children (текст обов'язковий) |
| `StatusChip` | `tone`, `size`, children — з крапкою-індикатором |
| `Money` | `value`, `compact`, `digits`, `currency` (UAH), `as` (span), `className` — однорядково, `truncate`, повна сума в `title` |
| `EmptyState` | `icon`, `title`, `text`, `action`, `compact` |
| `Skeleton` | `className`, `width`, `height`, `rounded: sm\|md\|lg\|full`, `lines` |
| `InfoTip` | `text`, `label` («Що це?») |

## Форми

| Компонент | Props |
|---|---|
| `Field` | `label`, `hint`, `error`, `required`, `htmlFor`, children — одній дитині сам додає `id`, `aria-describedby`, `aria-invalid`, `required` |
| `Input` | `invalid`, `leftIcon`, `rightSlot`, `size: md\|sm`, `ref`, + нативні (`type`, `inputMode`, `autoComplete`…) |
| `Select` | `options: [{value,label,disabled?}]` або `<option>` дітьми, `placeholder`, `invalid`, `size`, + нативні (`onChange(e)`) |
| `Textarea` | `invalid`, `rows` (4), + нативні |
| `Checkbox` | `label`, `description`, `checked`, **`onChange(event)` — нативна подія**, `invalid`, `disabled` |
| `Switch` | `checked`, **`onChange(boolean)`**, `label`, `description`, `disabled`, `size: md\|sm` |
| `Segmented` | `options: [{value,label?,icon?,ariaLabel?,disabled?}]`, `value`, `onChange(value)`, `size: sm\|md`, `ariaLabel`, `fullWidth` |
| `Tabs` | `tabs: [{value,label,count?,icon?,disabled?}]`, `value`, `onChange(value)`, `ariaLabel`, `idPrefix` (панель: `id={`${idPrefix}-panel-${value}`}`) |
| `Toolbar` | `sticky`, `className`, children |
| `FilterBar` | `search: {value, onChange(value), placeholder}`, children (фільтри), `onReset`, `resetLabel`, `actions` |
| `DateRangePicker` | `value: {from, to, compare, preset?}`, `onChange({from,to,compare,preset})`, `allowCompare` (true), `align: left\|right` |

Пресети `DATE_PRESETS`: `today | 7d | 30d | 90d | month (з 1-го числа) | year (365 дн.) | custom`. `compare`: `prev | yoy | none`.
Хелпери: `defaultRange()` (30 дн. + prev), `resolvePreset(p)`, `detectPreset(from,to)`, `compareRange(range)`, `rangeFromSearch(URLSearchParams)`, `rangeToSearch(range, params)`, `kyivToday()`, `addDays`, `daysBetween`.

## Дані та оверлеї

| Компонент | Props |
|---|---|
| `Table` | `columns: [{key, header, render?(row,i), align?: left\|right\|center, sortable?, sortValue?(row), width?, className?, primary? (заголовок картки), cardLabel?, hideOnCard?}]`, `rows`, `rowKey` (`"_id"` або fn), `renderCard?(row,i)`, `empty` (вузол або `{icon,title,text,action}`), `loading`, `skeletonRows` (5), `sort: {key, dir:'asc'\|'desc'}`, `onSort(next)` (без нього — сортування на клієнті), `onRowClick(row)`, `caption`, `dense`. На `<md` — картки. |
| `Pagination` | `page` (з 1), `total`, `perPage` (10), `onChange(page)`, `siblingCount` (1), `showSummary` (true) |
| `Modal` | `open`, `onClose`, `title`, `description`, children, `footer`, `size: sm\|md\|lg\|xl`, `closeOnBackdrop` (true), `hideClose`, `initialFocusRef` |
| `Drawer` | `open`, `onClose`, `title`, `side: right\|left\|bottom`, children, `footer`, `width`, `ariaLabel` |
| `ConfirmDialog` | `open`, `title`, `text`, `confirmLabel`, `cancelLabel`, `tone: danger\|brand`, `loading`, `onConfirm`, `onClose` |
| `useConfirm()` | `const [confirm, el] = useConfirm(); if (await confirm({title, text, tone})) …` — `{el}` відрендерити в компоненті |

## Форматери

`formatMoney(v, {compact, digits})` → «12 345 ₴» / «12,3 тис. ₴» · `formatInt(v, {compact})` → «12 345» · `formatNumber(v, digits=1)` → «4,6» · `formatPct(v, {digits=1, ratio})` → «12,5 %» · `formatDelta(v, {digits, ratio})` → «+12,5 %» / «−3 %» / «—» · `formatDate(d, {short|withTime|month})` → «04.11.2026» / «4 лист.» / «04.11.2026, 14:05» · `formatBy(format, v)` · `toDate(v)`. Усе безпечне до null → «—».

## Графіки (кольори з `--chart-1…6`, темна тема, порожній стан «Даних поки мало…»)

| Компонент | Props |
|---|---|
| `ChartCard` | `title`, `description`, `info`, `actions`, `loading`, `empty`, `emptyText`, `height` (280), `footer`, children (графік) |
| `LineAreaChart` | `series: [{name, data:number[], axis?:'left'\|'right', format?, dashed? (порівняння), color?, type?:'area'\|'line'}]`, `categories: string[]`, `type: area\|line`, `height` (280), `yFormat` (int), `ariaLabel`, `loading`, `emptyText`, `minPoints` (2), `stacked`, `showLegend` |
| `BarChart` | `series: [{name, data, color?}]`, `categories`, `horizontal`, `stacked`, `distributed`, `height`, `yFormat`, `ariaLabel`, `loading`, `emptyText`, `showLegend`, `dataLabels` |
| `DonutChart` | `data: [{label, value, color?}]`, `height` (260), `format`, `totalLabel` («Всього»), `ariaLabel`, `loading`, `emptyText`, `legendPosition: bottom\|right` |
| `Heatmap` | `data` (за замовч. `[{dow:1-7, hour:0-23, orders}]`), `xKey` (hour), `yKey` (dow), `valueKey` (orders), `xValues`, `yValues`, `xLabel(v)`, `yLabel(v)`, `format`, `valueLabel`, `ariaLabel`, `loading`, `emptyText` |
| `FunnelChart` | `steps: [{label, value, rate?}]` (rate — частка 0..1; `null` → «мало даних»), `format`, `minSample` (30), `ariaLabel`, `loading`, `emptyText` |
| `Sparkline` | `data: number[]`, `color` (`var(--chart-1)`), `height` (32), `width` (120), `area` (true), `ariaLabel` |

`useChartTheme()` — розв'язані кольори токенів (для власних графіків). `DOW_LABELS` — `{1:'Пн',…,7:'Нд'}`.

Приклад виручка + замовлення з порівнянням:

```jsx
<ChartCard title="Виручка і замовлення" loading={loading}>
  <LineAreaChart
    categories={series.map((p) => formatDate(p.date, { short: true }))}
    yFormat="money"
    series={[
      { name: "Виручка", data: series.map((p) => p.revenue), format: "money" },
      { name: "Виручка (попер.)", data: prevSeries.map((p) => p.revenue), format: "money", dashed: true },
      { name: "Замовлення", data: series.map((p) => p.orders), axis: "right", format: "int", type: "line" },
    ]}
  />
</ChartCard>
```

Оболонка: `layout/MainLayout` (Sidebar + Header + `<main class="max-w-[1400px] pb-safe">`); сторінкам не потрібен верхній відступ під шапку (вона sticky в потоці).

## Додано (агент «адмін: налаштування сайту/маркетинг»)

| Компонент | Props |
|---|---|
| `ImageDrop` | `value: File\|string(url)\|null`, `onChange(file\|null)`, `accept` (image/*), `maxSizeMb`, `label`, `hint`, `error`, `required`, `disabled`, `removable` (true), `validate(file)→рядок помилки`, `previewClassName`, `emptyText` — drag&drop + клік/Enter, прев'ю, «Замінити»/«Прибрати» |
| `StickyActions` | `dirty`, `status` (вузол замість стандартного), `savedText`, `dirtyText`, children (кнопки) — sticky-панель внизу сторінки (рендерити на рівні сторінки, не всередині Card) |
| `useUnsavedChanges(dirty, message?)` | `beforeunload`-застереження при закритті вкладки з незбереженими змінами |
