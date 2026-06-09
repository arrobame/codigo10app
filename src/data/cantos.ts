// Cantos de marcha (para marchar al trote).
// Formato llamada y respuesta: el GUÍA dice una frase y la TROPA la repite.
//
//   voice "guia"  → quien dirige el canto (dice la frase)
//   voice "tropa" → todos los que marchan (repiten la frase)
//
// Normalmente cada frase del guía va seguida de la misma frase de la tropa,
// pero el modelo es flexible por si algún canto no sigue el 1:1 exacto.

export type CantoVoice = "guia" | "tropa";

export interface CantoLine {
  voice: CantoVoice;
  text: string;
}

export interface Canto {
  id: string;
  title: string;
  description: string;
  category: string; // ej. "Trote", "Motivación", "Tradicional"
  lines: CantoLine[];
}

export const cantos: Canto[] = [
  // ⚠️ EJEMPLO de demostración del formato. Reemplazar por cantos reales.
  {
    id: "ejemplo",
    title: "Canto de ejemplo",
    description: "Ejemplo del formato llamada y respuesta. Reemplazar por cantos reales del CBVP.",
    category: "Trote",
    lines: [
      { voice: "guia",  text: "Suena la corneta" },
      { voice: "tropa", text: "Suena la corneta" },
      { voice: "guia",  text: "y salimos al trote" },
      { voice: "tropa", text: "y salimos al trote" },
      { voice: "guia",  text: "con la frente en alto" },
      { voice: "tropa", text: "con la frente en alto" },
      { voice: "guia",  text: "y el corazón al frente" },
      { voice: "tropa", text: "y el corazón al frente" },
    ],
  },
];
