export interface ThemeColors {
  // "yellow*" se mantienen por compatibilidad, pero ahora apuntan al ACENTO ROJO
  // (diseño monocromático + acento rojo CBVP). No representan amarillo.
  yellow: string;
  yellowLight: string;
  yellowDark: string;
  red: string;
  redDark: string;
  black: string;
  onAccent: string; // texto/ícono legible SOBRE un relleno de acento
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

// Acento único = rojo CBVP. Neutros en escala de grises (estilo Linear/Vercel).
export const darkColors: ThemeColors = {
  yellow: "#E5484D",      // acento (rojo, legible sobre negro)
  yellowLight: "#FF6369", // acento claro / hover
  yellowDark: "#B7282E",  // acento profundo
  red: "#E5484D",
  redDark: "#B7282E",
  black: "#0A0A0A",
  onAccent: "#FFFFFF",
  bg: "#0A0A0A",
  card: "#161616",
  cardRaised: "#1F1F1F",
  border: "#272727",
  text: "#FAFAFA",
  textDim: "rgba(255,255,255,0.56)",
  textHint: "rgba(255,255,255,0.32)",
  correctBg: "rgba(46,125,50,0.22)",
  correctBorder: "#3FB950",
  wrongBg: "rgba(229,72,77,0.20)",
  wrongBorder: "#E5484D",
  nearMissBg: "rgba(230,81,0,0.20)",
  nearMissBorder: "#E08600",
  redHighlight: "#FF8A85",
};

export const lightColors: ThemeColors = {
  yellow: "#CC0000",      // acento (rojo CBVP, legible sobre blanco)
  yellowLight: "#E5332B",
  yellowDark: "#990000",
  red: "#CC0000",
  redDark: "#990000",
  black: "#0A0A0A",
  onAccent: "#FFFFFF",
  bg: "#FAFAFA",
  card: "#FFFFFF",
  cardRaised: "#F4F4F5",
  border: "#E4E4E7",
  text: "#0A0A0A",
  textDim: "rgba(0,0,0,0.56)",
  textHint: "rgba(0,0,0,0.40)",
  correctBg: "rgba(46,125,50,0.10)",
  correctBorder: "#2E7D32",
  wrongBg: "rgba(204,0,0,0.10)",
  wrongBorder: "#CC0000",
  nearMissBg: "rgba(230,81,0,0.10)",
  nearMissBorder: "#E65100",
  redHighlight: "#B71C1C",
};

// Re-export default (dark) para archivos que no usan el hook todavía
export const C = darkColors;
