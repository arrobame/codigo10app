import { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../theme/ThemeContext";
import { NavigationProp } from "../types";

WebBrowser.maybeCompleteAuthSession();

const WEB_CLIENT_ID =
  "320534413841-jfe8afodid5j9rc4cbf13iae2r3m9j6o.apps.googleusercontent.com";

export default function HeaderAuth() {
  const { user, signOut, signInWithGoogleWeb, signInWithGoogleCredential } = useAuth();
  const { C, isDark } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const textColor = isDark ? C.yellow : C.black;
  const dimColor = isDark ? "rgba(255,193,7,0.6)" : "rgba(0,0,0,0.45)";

  const [, response, promptAsync] = Google.useAuthRequest({ webClientId: WEB_CLIENT_ID });

  useEffect(() => {
    if (response?.type === "success" && response.authentication?.idToken) {
      signInWithGoogleCredential(response.authentication.idToken).catch(console.error);
    }
  }, [response]);

  async function handleSignIn() {
    if (Platform.OS === "web") {
      await signInWithGoogleWeb();
    } else {
      await promptAsync();
    }
  }

  if (user) {
    return (
      <View style={styles.row}>
        <TouchableOpacity
          onPress={() => navigation.navigate("Profile", { uid: user.uid, username: user.username })}
          activeOpacity={0.7}
        >
          <Text style={[styles.username, { color: textColor }]} numberOfLines={1}>
            👤 {user.username}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={signOut} style={[styles.signOutBtn, { borderColor: dimColor }]}>
          <Text style={[styles.signOutText, { color: dimColor }]}>Salir</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity onPress={handleSignIn} style={[styles.signInBtn, { borderColor: dimColor }]} activeOpacity={0.75}>
      <Text style={[styles.gLetter, { color: "#4285F4" }]}>G</Text>
      <Text style={[styles.signInText, { color: textColor }]}>Iniciar sesión</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  username: { fontSize: 13, fontWeight: "bold", maxWidth: 140 },
  signOutBtn: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  signOutText: { fontSize: 11, fontWeight: "600" },
  signInBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderWidth: 1, borderRadius: 7, paddingHorizontal: 10, paddingVertical: 5,
  },
  gLetter: { fontSize: 13, fontWeight: "bold" },
  signInText: { fontSize: 13, fontWeight: "600" },
});
