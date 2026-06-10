import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "../context/theme-context";
import type { ThemeMode } from "../context/theme-context";

const THEME_OPTIONS: Array<{
  mode: ThemeMode;
  label: string;
  Icon: typeof Sun;
}> = [
  { mode: "light", label: "Light mode", Icon: Sun },
  { mode: "dark", label: "Dark mode", Icon: Moon },
  { mode: "auto", label: "Use system theme", Icon: Monitor },
];

export function ThemeSwitcher() {
  const { mode, setMode, resolvedTheme } = useTheme();

  return (
    <div className="theme-switcher" role="radiogroup" aria-label="Color theme">
      {THEME_OPTIONS.map(({ mode: optionMode, label, Icon }) => (
        <button
          key={optionMode}
          type="button"
          className={mode === optionMode ? "active" : ""}
          role="radio"
          aria-checked={mode === optionMode}
          aria-label={label}
          title={optionMode === "auto" ? `${label}: ${resolvedTheme}` : label}
          onClick={() => setMode(optionMode)}
        >
          <Icon size={16} aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
