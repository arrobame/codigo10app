export interface ThemeColors {
  yellow: string;
  yellowLight: string;
  yellowDark: string;
  red: string;
  redDark: string;
  black: string;
  bg: string;
  card: string;
  cardRaised: string;
  border: string;
  text: string;
  textDim: string;
  textHint: string;
  correctBg: string;
  correctBorder: string;
  wrongBg: string;
  wrongBorder: string;
  nearMissBg: string;
  nearMissBorder: string;
  redHighlight: string; // rojo legible sobre cualquier fondo
}

export const darkColors: ThemeColors = {
  yellow: "#FFC107",
  yellowLight: "#FFD54F",
  yellowDark: "#FF8F00",
  red: "#CC0000",
  redDark: "#8B0000",
  black: "#0D0D0D",
  bg: "#111111",
  card: "#1C1C1C",
  cardRaised: "#262626",
  border: "#2E2E2E",
  text: "#FFFFFF",
  textDim: "rgba(255,255,255,0.6)",
  textHint: "rgba(255,255,255,0.35)",
  correctBg: "rgba(27,94,32,0.25)",
  correctBorder: "#2E7D32",
  wrongBg: "rgba(183,28,28,0.25)",
  wrongBorder: "#C62828",
  nearMissBg: "rgba(230,81,0,0.2)",
  nearMissBorder: "#E65100",
  redHighlight: "#EF9A9A",
};

export const lightColors: ThemeColors = {
  yellow: "#FFC107",
  yellowLight: "#FFD54F",
  yellowDark: "#FF8F00",
  red: "#CC0000",
  redDark: "#8B0000",
  black: "#0D0D0D",
  bg: "#F5F5F5",
  card: "#FFFFFF",
  cardRaised: "#EEEEEE",
  border: "#DEDEDE",
  text: "#0D0D0D",
  textDim: "rgba(0,0,0,0.6)",
  textHint: "rgba(0,0,0,0.38)",
  correctBg: "rgba(27,94,32,0.1)",
  correctBorder: "#2E7D32",
  wrongBg: "rgba(183,28,28,0.1)",
  wrongBorder: "#C62828",
  nearMissBg: "rgba(230,81,0,0.1)",
  nearMissBorder: "#E65100",
  redHighlight: "#B71C1C",
};

// Re-export default (dark) para archivos que no usan el hook todavía
export const C = darkColors;
