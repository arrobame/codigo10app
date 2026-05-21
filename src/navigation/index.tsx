import { TouchableOpacity, Text, View, Platform, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types";
import { useTheme } from "../theme/ThemeContext";
import HomeScreen from "../screens/HomeScreen";
import StudyScreen from "../screens/StudyScreen";
import QuizScreen from "../screens/QuizScreen";
import ResultScreen from "../screens/ResultScreen";
import DonationScreen from "../screens/DonationScreen";
import ErrorsScreen from "../screens/ErrorsScreen";
import LeaderboardScreen from "../screens/LeaderboardScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

function BackButton({ onPress, color }: { onPress: () => void; color: string }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      style={{ paddingRight: 8 }}
    >
      <Text style={{ color, fontSize: 32, fontWeight: "200", lineHeight: 36 }}>‹</Text>
    </TouchableOpacity>
  );
}

export default function Navigation() {
  const { C, isDark } = useTheme();
  const backColor = isDark ? C.yellow : C.black;

  return (
    <View style={[styles.webWrapper, { backgroundColor: isDark ? "#000" : "#d0d0d0" }]}>
      <View style={styles.webContainer}>
    <NavigationContainer
        documentTitle={{ formatter: () => "Código 10 App" }}
      >
      <Stack.Navigator
        screenOptions={({ navigation }) => ({
          headerStyle: { backgroundColor: isDark ? C.black : C.yellow },
          headerTintColor: backColor,
          headerTitleStyle: { fontWeight: "bold", color: isDark ? C.yellow : C.black },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: C.bg },
          animation: "slide_from_right",
          headerLeftContainerStyle: { paddingLeft: 10 },
          headerRightContainerStyle: { paddingRight: 4 },
          headerLeft: ({ canGoBack }) =>
            canGoBack ? (
              <BackButton onPress={() => navigation.goBack()} color={backColor} />
            ) : null,
        })}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerTitle: () => null }} />
        <Stack.Screen name="Study" component={StudyScreen} options={{ title: "Estudiar Códigos" }} />
        <Stack.Screen name="Quiz" component={QuizScreen} options={{ title: "Trivia" }} />
        <Stack.Screen name="Result" component={ResultScreen} options={{ title: "Resultado", headerBackVisible: false, animation: "fade" }} />
        <Stack.Screen name="Donation" component={DonationScreen} options={{ title: "💛 Apoyar al Desarrollador" }} />
        <Stack.Screen name="Errors" component={ErrorsScreen} options={{ title: "📊 Mis Errores" }} />
        <Stack.Screen name="Leaderboard" component={LeaderboardScreen} options={{ title: "🏆 Ranking" }} />
      </Stack.Navigator>
    </NavigationContainer>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  webWrapper: {
    flex: 1,
    alignItems: Platform.OS === "web" ? "center" : undefined,
  },
  webContainer: {
    flex: 1,
    width: "100%",
    maxWidth: Platform.OS === "web" ? 480 : undefined,
    // Sombra sutil en web para efecto "mobile app"
    ...(Platform.OS === "web"
      ? { shadowColor: "#000", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 24 }
      : {}),
  },
});
