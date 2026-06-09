import { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../theme/ThemeContext";
import { NavigationProp } from "../types";
import Icon from "./Icon";

WebBrowser.maybeCompleteAuthSession();

const WEB_CLIENT_ID =
  "320534413841-jfe8afodid5j9rc4cbf13iae2r3m9j6o.apps.googleusercontent.com";

export default function HeaderAuth() {
  const { user, signOut, signInWithGoogleWeb, signInWithGoogleCredential } = useAuth();
  const { C, isDark } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const textColor = C.text;
  const dimColor = C.textDim;

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
      <TouchableOpacity
        onPress={() => navigation.navigate("Profile", { uid: user.uid, username: user.username })}
        activeOpacity={0.75}
        style={[styles.profileBtn, { borderColor: C.border, backgroundColor: C.cardRaised }]}
      >
        <Icon name="account-circle" size={15} color={C.yellow} />
        <Text style={[styles.profileBtnText, { color: textColor }]} numberOfLines={1}>
          {user.username}
        </Text>
      </TouchableOpacity>
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
  profileBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    borderWidth: 1.5, borderRadius: 8,
    paddingHorizontal: 9, paddingVertical: 5,
    maxWidth: 160,
  },
  profileBtnIcon: { fontSize: 13 },
  profileBtnText: { fontSize: 13, fontWeight: "bold", flexShrink: 1 },
  signInBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderWidth: 1, borderRadius: 7, paddingHorizontal: 10, paddingVertical: 5,
  },
  gLetter: { fontSize: 13, fontWeight: "bold" },
  signInText: { fontSize: 13, fontWeight: "600" },
});
