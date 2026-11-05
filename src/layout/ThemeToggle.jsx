import { MdDarkMode, MdLightMode, MdSettingsBrightness } from "react-icons/md";
import { Segmented } from "../ui";
import { useThemeMode } from "../utils/themeMode";

const OPTIONS = [
  { value: "light", icon: <MdLightMode />, ariaLabel: "Світла тема" },
  { value: "dark", icon: <MdDarkMode />, ariaLabel: "Темна тема" },
  { value: "system", icon: <MdSettingsBrightness />, ariaLabel: "Як у системі" },
];

/** Перемикач Світла / Темна / Система. */
export default function ThemeToggle({ className, withLabels = false }) {
  const [mode, setMode] = useThemeMode();
  const options = withLabels
    ? OPTIONS.map((o) => ({ ...o, label: o.ariaLabel === "Як у системі" ? "Система" : o.ariaLabel.replace(" тема", "") }))
    : OPTIONS;
  return <Segmented size="sm" ariaLabel="Тема оформлення" options={options} value={mode} onChange={setMode} className={className} />;
}
