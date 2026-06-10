import { NativeStackNavigationProp } from "@react-navigation/native-stack";

export type RootStackParamList = {
  Home: undefined;
  Study: undefined;
  Quiz: { mode: QuizMode; direction: QuizDirection; practiceCodes?: string[] };
  Result: {
    mode: QuizMode;
    direction: QuizDirection;
    streak: number;
    avgSpeed: number;
    score: number;
    total: number;
    missedCode: string | null;
    missedDesc: string | null;
    isNewRecord: boolean;
  };
  Donation: undefined;
  Errors: undefined;
  Leaderboard: { initialTab?: "streak" | "speed"; initialDirection?: QuizDirection } | undefined;
  Feedback: undefined;
  Profile: { uid: string; username: string };
  Salidas: undefined;
  SalidaDetail: { salidaId: string };
  Cantos: undefined;
  CantoDetail: { title: string; letra: string };
  CantoSuggest: undefined;
  CantosModeration: undefined;
};

export type QuizMode = "streak" | "speed" | "practice";
export type QuizDirection = "codigo_a_descripcion" | "descripcion_a_codigo";

export type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
