import { useState, useEffect } from "react";
import { TouchableOpacity, Text, View, Platform, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types";
import { useTheme } from "../theme/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { getUnseenBroadcast, markBroadcastSeen, Broadcast } from "../utils/inAppNotifications";
import BroadcastModal from "../components/BroadcastModal";
import HomeScreen from "../screens/HomeScreen";
import StudyScreen from "../screens/StudyScreen";
import QuizScreen from "../screens/QuizScreen";
import ResultScreen from "../screens/ResultScreen";
import DonationScreen from "../screens/DonationScreen";
import ErrorsScreen from "../screens/ErrorsScreen";
import LeaderboardScreen from "../screens/LeaderboardScreen";
import FeedbackScreen from "../screens/FeedbackScreen";
import ProfileScreen from "../screens/ProfileScreen";
import SalidasScreen from "../screens/SalidasScreen";
import SalidaDetailScreen from "../screens/SalidaDetailScreen";
import CantosScreen from "../screens/CantosScreen";
import CantoDetailScreen from "../screens/CantoDetailScreen";
import CantoSuggestScreen from "../screens/CantoSuggestScreen";
import CantosModerationScreen from "../screens/CantosModerationScreen";

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
  const { user } = useAuth();
  const backColor = C.yellow; // acento rojo

  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [showReconnected, setShowReconnected] = useState(false);
  const [broadcast, setBroadcast] = useState<Broadcast | null>(null);

  useEffect(() => {
    if (!user) return;
    getUnseenBroadcast(user.uid).then(setBroadcast);
  }, [user?.uid]);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 3000);
    };
    const handleOffline = () => { setIsOnline(false); setShowReconnected(false); };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <View style={[styles.webWrapper, { backgroundColor: isDark ? "#000" : "#d0d0d0" }]}>
      <BroadcastModal
        broadcast={broadcast}
        onClose={() => {
          if (broadcast) markBroadcastSeen(broadcast.id);
          setBroadcast(null);
        }}
      />
      <View style={styles.webContainer}>
        {!isOnline && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineText}>Sin conexión · el ranking no está disponible</Text>
          </View>
        )}
        {showReconnected && (
          <View style={styles.onlineBanner}>
            <Text style={styles.onlineText}>Conexión restaurada</Text>
          </View>
        )}
    <NavigationContainer
        documentTitle={{ formatter: () => "Código 10 App" }}
      >
      <Stack.Navigator
        screenOptions={({ navigation }) => ({
          headerStyle: { backgroundColor: C.card },
          headerTintColor: backColor,
          headerTitleStyle: { fontWeight: "700", color: C.text },
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
        <Stack.Screen name="Donation" component={DonationScreen} options={{ title: "Apoyar al Desarrollador" }} />
        <Stack.Screen name="Errors" component={ErrorsScreen} options={{ title: "Mis Errores" }} />
        <Stack.Screen name="Leaderboard" component={LeaderboardScreen} options={{ title: "Ranking" }} />
        <Stack.Screen name="Feedback" component={FeedbackScreen} options={{ title: "Reportar / Sugerir" }} />
        <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: "Mis Estadísticas" }} />
        <Stack.Screen name="Salidas" component={SalidasScreen} options={{ title: "Radio en Código 10" }} />
        <Stack.Screen name="SalidaDetail" component={SalidaDetailScreen} options={{ title: "Salida" }} />
        <Stack.Screen name="Cantos" component={CantosScreen} options={{ title: "Cantos de Marcha" }} />
        <Stack.Screen name="CantoDetail" component={CantoDetailScreen} options={{ title: "Canto" }} />
        <Stack.Screen name="CantoSuggest" component={CantoSuggestScreen} options={{ title: "Sugerir un canto" }} />
        <Stack.Screen name="CantosModeration" component={CantosModerationScreen} options={{ title: "Moderar cantos" }} />
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
    ...(Platform.OS === "web"
      ? { shadowColor: "#000", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 24 }
      : {}),
  },
  offlineBanner: {
    backgroundColor: "#B71C1C",
    paddingVertical: 8,
    alignItems: "center",
    zIndex: 999,
  },
  offlineText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  onlineBanner: {
    backgroundColor: "#2E7D32",
    paddingVertical: 8,
    alignItems: "center",
    zIndex: 999,
  },
  onlineText: { color: "#fff", fontSize: 13, fontWeight: "600" },
});
