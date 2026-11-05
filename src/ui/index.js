// Єдина точка імпорту UI-кіта: import { Button, Card, … } from "../../ui";
// Документація props — src/ui/README.md.
export { cx } from "./cx";
export { Button, IconButton, Spinner } from "./Button";
export { Card, CardHeader, CardBody, CardFooter } from "./Card";
export { PageHeader } from "./PageHeader";
export { KpiCard, Stat } from "./KpiCard";
export { Badge, StatusChip } from "./Badge";
export { Field, Input, Select, Textarea, Checkbox, Switch } from "./Form";
export { Segmented, Tabs } from "./Segmented";
export { Table } from "./Table";
export { Pagination } from "./Pagination";
export { Modal, Drawer, ConfirmDialog } from "./Overlay";
export { useConfirm } from "./useConfirm";
export { EmptyState } from "./EmptyState";
export { Skeleton } from "./Skeleton";
export { InfoTip } from "./InfoTip";
export { Toolbar, FilterBar } from "./Toolbar";
export { DateRangePicker } from "./DateRangePicker";
export {
  DATE_PRESETS,
  COMPARE_OPTIONS,
  kyivToday,
  addDays,
  daysBetween,
  resolvePreset,
  detectPreset,
  defaultRange,
  compareRange,
  rangeFromSearch,
  rangeToSearch,
} from "./dateRange";
export { Money } from "./Money";
export { formatMoney, formatInt, formatNumber, formatPct, formatDelta, formatDate, formatBy, toDate } from "./format";

// Графіки
export { ChartCard } from "./charts/ChartCard";
export { LineAreaChart } from "./charts/LineAreaChart";
export { BarChart } from "./charts/BarChart";
export { DonutChart } from "./charts/DonutChart";
export { Heatmap } from "./charts/Heatmap";
export { DOW_LABELS } from "./charts/chartUtils";
export { FunnelChart } from "./charts/FunnelChart";
export { Sparkline } from "./charts/Sparkline";
export { useChartTheme } from "./charts/useChartTheme";

// ДОДАНО агентом «адмін: налаштування сайту/маркетинг»
export { ImageDrop } from "./ImageDrop";
export { StickyActions, useUnsavedChanges } from "./StickyActions";
