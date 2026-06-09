import { useMemo } from "react";
import { PaperProvider } from "react-native-paper";
import { useTheme } from "./ThemeContext";
import { buildPaperTheme } from "./paperTheme";

export function PaperWrapper({ children }: { children: React.ReactNode }) {
  const { isDark } = useTheme();
  const theme = useMemo(() => buildPaperTheme(isDark), [isDark]);
  return (
    <PaperProvider theme={theme}>
      {children}
    </PaperProvider>
  );
}
