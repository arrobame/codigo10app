import { MD3DarkTheme, MD3LightTheme, configureFonts } from "react-native-paper";
import type { MD3Theme } from "react-native-paper";
import { darkColors, lightColors } from "./colors";

const fonts = configureFonts({ config: { fontFamily: "Geist" } });

export function buildPaperTheme(isDark: boolean): MD3Theme {
  const base = isDark ? MD3DarkTheme : MD3LightTheme;
  const P = isDark ? darkColors : lightColors;
  return {
    ...base,
    fonts,
    colors: {
      ...base.colors,
      // Acento único: rojo CBVP
      primary: P.yellow,
      onPrimary: P.onAccent,
      primaryContainer: isDark ? "#3A1416" : "#FBE4E4",
      onPrimaryContainer: isDark ? "#FF8A85" : "#990000",
      // Secundario/terciario neutros (monocromático)
      secondary: P.textDim,
      onSecondary: P.onAccent,
      secondaryContainer: P.cardRaised,
      onSecondaryContainer: P.text,
      tertiary: P.yellow,
      onTertiary: P.onAccent,
      tertiaryContainer: isDark ? "#3A1416" : "#FBE4E4",
      onTertiaryContainer: isDark ? "#FF8A85" : "#990000",
      background: P.bg,
      onBackground: P.text,
      surface: P.card,
      onSurface: P.text,
      surfaceVariant: P.cardRaised,
      onSurfaceVariant: P.textDim,
      outline: P.border,
      outlineVariant: isDark ? "#1F1F1F" : "#ECECEE",
      error: P.red,
      onError: P.onAccent,
      errorContainer: P.wrongBg,
      onErrorContainer: P.redHighlight,
      shadow: "#000000",
      scrim: "#000000",
      inverseSurface: isDark ? "#FAFAFA" : "#161616",
      inverseOnSurface: isDark ? "#161616" : "#FAFAFA",
      inversePrimary: P.yellowDark,
      surfaceDisabled: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)",
      onSurfaceDisabled: isDark ? "rgba(255,255,255,0.38)" : "rgba(0,0,0,0.38)",
      backdrop: "rgba(0,0,0,0.6)",
      elevation: {
        level0: "transparent",
        level1: P.card,
        level2: P.cardRaised,
        level3: isDark ? "#262626" : "#EFEFF1",
        level4: isDark ? "#2A2A2A" : "#ECECEE",
        level5: isDark ? "#2F2F2F" : "#E8E8EA",
      },
    },
  };
}
