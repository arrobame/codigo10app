import { PlayerRecord } from "./scores";

export interface Achievement {
  id: string;
  emoji: string;
  name: string;
  description: string;
  check: (r: PlayerRecord) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_game",
    emoji: "🪖",
    name: "Pre Aspirante",
    description: "Completá tu primera partida",
    check: (r) => r.gamesPlayed >= 1,
  },
  {
    id: "games_10",
    emoji: "🚒",
    name: "Aspirante",
    description: "Jugá 10 partidas",
    check: (r) => r.gamesPlayed >= 10,
  },
  {
    id: "games_50",
    emoji: "⛑️",
    name: "Voluntario",
    description: "Jugá 50 partidas",
    check: (r) => r.gamesPlayed >= 50,
  },
  {
    id: "correct_50",
    emoji: "📡",
    name: "Teniente",
    description: "50 respuestas correctas",
    check: (r) => r.totalCorrect >= 50,
  },
  {
    id: "correct_200",
    emoji: "🧯",
    name: "Capitán",
    description: "200 respuestas correctas",
    check: (r) => r.totalCorrect >= 200,
  },
  {
    id: "correct_500",
    emoji: "🏅",
    name: "Presidente",
    description: "500 respuestas correctas",
    check: (r) => r.totalCorrect >= 500,
  },
  {
    id: "precision_80",
    emoji: "📻",
    name: "Señal Clara",
    description: "80% de precisión (mín. 50 preguntas)",
    check: (r) => r.totalQuestions >= 50 && r.totalCorrect / r.totalQuestions >= 0.8,
  },
  {
    id: "streak_10",
    emoji: "🔥",
    name: "Mi Primer Servicio",
    description: "Racha de 10 correctas seguidas",
    check: (r) => Math.max(r.bestStreak_ctd ?? 0, r.bestStreak_dtc ?? 0) >= 10,
  },
  {
    id: "streak_25",
    emoji: "🌊",
    name: "Halligan",
    description: "Racha de 25 correctas seguidas",
    check: (r) => Math.max(r.bestStreak_ctd ?? 0, r.bestStreak_dtc ?? 0) >= 25,
  },
  {
    id: "streak_50",
    emoji: "🚨",
    name: "Hacha",
    description: "Racha de 50 correctas seguidas",
    check: (r) => Math.max(r.bestStreak_ctd ?? 0, r.bestStreak_dtc ?? 0) >= 50,
  },
  {
    id: "speed_5",
    emoji: "⚡",
    name: "Escala",
    description: "Promedio menor a 5s en Velocidad",
    check: (r) => {
      const speeds = ([r.bestAvgSpeed_ctd, r.bestAvgSpeed_dtc].filter((v) => v != null)) as number[];
      return speeds.length > 0 && Math.min(...speeds) < 5;
    },
  },
  {
    id: "speed_3",
    emoji: "🪓",
    name: "Alpha",
    description: "Promedio menor a 3s en Velocidad",
    check: (r) => {
      const speeds = ([r.bestAvgSpeed_ctd, r.bestAvgSpeed_dtc].filter((v) => v != null)) as number[];
      return speeds.length > 0 && Math.min(...speeds) < 3;
    },
  },
];
