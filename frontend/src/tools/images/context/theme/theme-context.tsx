import { createContext, ReactNode, useState } from "react";

interface Theme {
  actionbarBgColor: string;
  mainbarBgColor: string;
  sidebarBgColor: string;
}

const defaultTheme: Theme = {
  actionbarBgColor: "#FFFFFF",
  mainbarBgColor: "#F8F8F8",
  sidebarBgColor: "#F8F8F8",
};

const whiteTheme: Theme = {
  actionbarBgColor: "#FFFFFF",
  mainbarBgColor: "#FFFFFF",
  sidebarBgColor: "#FFFFFF",
};

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (theme: Theme) => void;
}>({
  theme: defaultTheme,
  setTheme: () => {},
});

export { ThemeContext };

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(defaultTheme);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
};
