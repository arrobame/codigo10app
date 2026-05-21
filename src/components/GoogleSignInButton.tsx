import { useEffect, useMemo } from "react";
import { TouchableOpacity, Text, StyleSheet, Platform, ActivityIndicator } from "react-native";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../theme/ThemeContext";
import { ThemeColors } from "../theme/colors";

// Necesario para que el browser cierre correctamente después del login en native
WebBrowser.maybeCompleteAuthSession();

// ─── Obtené tu WEB_CLIENT_ID en:
// console.cloud.google.com → Tu proyecto Firebase → APIs & Services
// → Credentials → OAuth 2.0 Client IDs → Web client (auto-creado por Firebase)
const WEB_CLIENT_ID = "320534413841-jfe8afodid5j9rc4cbf13iae2r3m9j6o.apps.googleusercontent.com";

export default function GoogleSignInButton() {
  const { signInWithGoogleWeb, signInWithGoogleCredential } = useAuth();
  const { C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: WEB_CLIENT_ID,
  });

  useEffect(() => {
    if (response?.type === "success" && response.authentication?.idToken) {
      signInWithGoogleCredential(response.authentication.idToken).catch(console.error);
    }
  }, [response]);

  async function handlePress() {
    if (Platform.OS === "web") {
      await signInWithGoogleWeb();
    } else {
      await promptAsync();
    }
  }

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={handlePress}
      disabled={!request && Platform.OS !== "web"}
      activeOpacity={0.85}
    >
      <Text style={styles.icon}>G</Text>
      <Text style={styles.label}>Iniciar sesión con Google</Text>
    </TouchableOpacity>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    button: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#fff",
      borderRadius: 12,
      padding: 14,
      gap: 10,
      borderWidth: 1.5,
      borderColor: C.border,
    },
    icon: {
      fontSize: 16,
      fontWeight: "bold",
      color: "#4285F4",
      width: 20,
      textAlign: "center",
    },
    label: {
      color: "#333",
      fontSize: 15,
      fontWeight: "600",
    },
  });
}
