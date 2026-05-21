import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { darkColors, lightColors, ThemeColors } from "./colors";

interface ThemeContextValue {
  isDark: boolean;
  C: ThemeColors;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  isDark: true,
  C: darkColors,
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(true);

  const C = useMemo(() => (isDark ? darkColors : lightColors), [isDark]);
  const toggle = useCallback(() => setIsDark((d) => !d), []);
  const value = useMemo(() => ({ isDark, C, toggle }), [isDark, C, toggle]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
