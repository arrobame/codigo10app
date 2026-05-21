import { NativeStackNavigationProp } from "@react-navigation/native-stack";

export type RootStackParamList = {
  Home: undefined;
  Study: undefined;
  Quiz: { mode: QuizMode };
  Result: {
    mode: QuizMode;
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
  Leaderboard: { initialTab?: "streak" | "speed" } | undefined;
};

export type QuizMode = "streak" | "speed";

export type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
