export const SETTINGS_KEYS = {
  THEME: "theme",
} as const;

export const settingsStorage = {
  getTheme: (): "light" | "dark" | null => {
    return localStorage.getItem(SETTINGS_KEYS.THEME) as "light" | "dark" | null;
  },

  setTheme: (theme: "light" | "dark"): void => {
    localStorage.setItem(SETTINGS_KEYS.THEME, theme);
  },

  clearAll: (): void => {
    Object.values(SETTINGS_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  },
};
