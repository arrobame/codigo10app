import { NativeStackNavigationProp } from "@react-navigation/native-stack";

export type RootStackParamList = {
  Home: undefined;
  Study: undefined;
  Quiz: { mode: QuizMode };
  Result: {
    score: number;
    total: number;
    mode: QuizMode;
    points: number;
    maxStreak: number;
  };
  Donation: undefined;
  Errors: undefined;
  Leaderboard: undefined;
};

export type QuizMode = "codigo_a_descripcion" | "descripcion_a_codigo";

export type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
