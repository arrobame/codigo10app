import { useState, useMemo, useLayoutEffect, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NavigationProp } from "../types";
import { ThemeColors } from "../theme/colors";
import { useTheme } from "../theme/ThemeContext";
import DonationModal from "../components/DonationModal";
import HeaderAuth from "../components/HeaderAuth";
import ThemeToggle from "../components/ThemeToggle";
import PWAInstallModal from "../components/PWAInstallModal";

let donationShownThisSession = false;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const [showDonation, setShowDonation] = useState(!donationShownThisSession);
  const [showInstall, setShowInstall] = useState(false);
  const installPromptRef = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const handler = (e: any) => {
      e.preventDefault();
      installPromptRef.current = e;
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (installPromptRef.current) {
      installPromptRef.current.prompt();
      const { outcome } = await installPromptRef.current.userChoice;
      if (outcome === "accepted") installPromptRef.current = null;
    } else {
      // iOS o ya instalada: mostrar tutorial manual
      setShowInstall(true);
    }
  }

  function handleCloseDonation() {
    donationShownThisSession = true;
    setShowDonation(false);
  }

  async function handleShare() {
    const url = typeof window !== "undefined" ? window.location.origin : "https://codigo10.vercel.app";
    const text = "🚒 ¡Aprendé el Código 10 del CBVP Paraguay!\nQuiz interactivo para bomberos y aspirantes. Completamente gratis:";

    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share({ title: "Código 10 App", text, url });
        return;
      } catch {}
    }
    // Fallback: abrir WhatsApp directamente
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text + "\n" + url)}`;
    if (typeof window !== "undefined") window.open(waUrl, "_blank");
  }

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => <HeaderAuth />,
      headerRight: () => (
        <View style={{ marginRight: 8 }}>
          <ThemeToggle />
        </View>
      ),
    });
  }, [navigation]);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <DonationModal
        visible={showDonation}
        onClose={handleCloseDonation}
        onGoToDonation={() => { handleCloseDonation(); navigation.navigate("Donation"); }}
      />
      <PWAInstallModal
        visible={showInstall}
        onClose={() => setShowInstall(false)}
      />

      <View style={styles.header}>
        <Text style={styles.title}>Código 10 App</Text>
        <Text style={styles.subtitle}>
          Aprende el Código 10 que usan los bomberos
        </Text>
      </View>

      <View style={styles.menu}>

        {/* ── Jugar ─────────────────────────── */}
        <Text style={styles.sectionLabel}>JUGAR</Text>
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.halfCard, styles.cardPrimary]}
            onPress={() => navigation.navigate("Quiz", { mode: "streak" })}
            activeOpacity={0.85}
          >
            <Text style={styles.halfIcon}>🔥</Text>
            <Text style={styles.halfTitle}>Racha</Text>
            <Text style={styles.halfSub}>Máxima</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.halfCard, styles.cardSpeed]}
            onPress={() => navigation.navigate("Quiz", { mode: "speed" })}
            activeOpacity={0.85}
          >
            <Text style={styles.halfIcon}>⚡</Text>
            <Text style={[styles.halfTitle, { color: "#fff" }]}>Velocidad</Text>
            <Text style={[styles.halfSub, { color: "rgba(255,255,255,0.7)" }]}>10 códigos</Text>
          </TouchableOpacity>
        </View>

        {/* ── Comunidad ─────────────────────── */}
        <Text style={styles.sectionLabel}>COMUNIDAD</Text>
        <TouchableOpacity
          style={[styles.button, styles.buttonRanking]}
          onPress={() => navigation.navigate("Leaderboard")}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonIcon}>🏆</Text>
          <View style={styles.buttonContent}>
            <Text style={styles.buttonTextOnColor}>Ranking</Text>
            <Text style={styles.buttonSubOnColor}>Los mejores de la última hora</Text>
          </View>
        </TouchableOpacity>

        {/* ── Estudiar ──────────────────────── */}
        <Text style={styles.sectionLabel}>ESTUDIAR</Text>
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.halfCard, styles.cardOutline]}
            onPress={() => navigation.navigate("Study")}
            activeOpacity={0.85}
          >
            <Text style={styles.halfIcon}>📖</Text>
            <Text style={[styles.halfTitle, { color: C.textDim }]}>Códigos</Text>
            <Text style={[styles.halfSub, { color: C.textHint }]}>Ver lista completa</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.halfCard, styles.cardErrors]}
            onPress={() => navigation.navigate("Errors")}
            activeOpacity={0.85}
          >
            <Text style={styles.halfIcon}>📊</Text>
            <Text style={[styles.halfTitle, { color: C.text }]}>Mis Errores</Text>
            <Text style={[styles.halfSub, { color: C.textDim }]}>Los más difíciles</Text>
          </TouchableOpacity>
        </View>

        {/* ── Más ───────────────────────────── */}
        <Text style={styles.sectionLabel}>MÁS</Text>
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.halfCard, styles.cardInstall]}
            onPress={handleInstall}
            activeOpacity={0.85}
          >
            <Text style={styles.halfIcon}>📥</Text>
            <Text style={[styles.halfTitle, { color: C.textDim }]}>Instalar</Text>
            <Text style={[styles.halfSub, { color: C.textHint }]}>Agregar al inicio</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.halfCard, styles.cardShare]}
            onPress={handleShare}
            activeOpacity={0.85}
          >
            <Text style={styles.halfIcon}>📲</Text>
            <Text style={[styles.halfTitle, { color: "#fff" }]}>Compartir</Text>
            <Text style={[styles.halfSub, { color: "rgba(255,255,255,0.7)" }]}>Invitá amigos</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.donateBtn}
          onPress={() => navigation.navigate("Donation")}
          activeOpacity={0.85}
        >
          <Text style={styles.donateBtnText}>💛 Apoyar al Desarrollador</Text>
        </TouchableOpacity>

      </View>
    </ScrollView>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    scroll: { flex: 1, backgroundColor: C.bg },
    container: { padding: 20, paddingBottom: 32 },
    header: { alignItems: "center", paddingVertical: 16 },
    title: { fontSize: 24, fontWeight: "bold", color: C.yellow },
    subtitle: { fontSize: 14, color: C.textDim, marginTop: 4, textAlign: "center" },
    menu: { gap: 12, marginTop: 8 },
    button: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      borderRadius: 14,
      gap: 14,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 5,
      elevation: 3,
    },
    buttonPrimary:  { backgroundColor: C.red, borderWidth: 1, borderColor: C.redDark },
    buttonSecondary:{ backgroundColor: C.card, borderWidth: 1.5, borderColor: C.red },
    buttonRanking:  { backgroundColor: "#1a1a2e", borderWidth: 1.5, borderColor: "#FFD700" },
    buttonOutline:  { backgroundColor: C.card, borderWidth: 1.5, borderColor: C.border },
    buttonErrors:   { backgroundColor: C.card, borderWidth: 1.5, borderColor: C.yellow },
    buttonInstall:  { backgroundColor: C.card, borderWidth: 1.5, borderColor: C.border },
    buttonShare:    { backgroundColor: "#25D366", borderWidth: 1, borderColor: "#128C7E" },
    buttonDonation: { backgroundColor: C.yellow, borderWidth: 1, borderColor: C.yellowDark },
    buttonIcon: { fontSize: 28 },
    buttonContent: { flex: 1 },
    buttonTextOnColor: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold" },
    buttonSubOnColor:  { color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 2 },
    buttonTextOnCard:  { color: C.text, fontSize: 16, fontWeight: "bold" },
    buttonSubOnCard:   { color: C.textDim, fontSize: 12, marginTop: 2 },
    buttonTextMuted:   { color: C.textDim, fontSize: 16, fontWeight: "bold" },
    buttonSubMuted:    { color: C.textHint, fontSize: 12, marginTop: 2 },
    buttonTextOnYellow:{ color: C.black, fontSize: 16, fontWeight: "bold" },
    buttonSubOnYellow: { color: "rgba(0,0,0,0.5)", fontSize: 12, marginTop: 2 },

    // Grid y secciones
    sectionLabel: {
      color: C.textHint,
      fontSize: 11,
      fontWeight: "bold",
      letterSpacing: 1.2,
      marginTop: 4,
    },
    row: {
      flexDirection: "row",
      gap: 12,
    },
    halfCard: {
      flex: 1,
      borderRadius: 14,
      padding: 16,
      alignItems: "center",
      gap: 4,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    cardPrimary:   { backgroundColor: C.red, borderWidth: 1, borderColor: C.redDark },
    cardSecondary: { backgroundColor: C.card, borderWidth: 1.5, borderColor: C.red },
    cardSpeed:     { backgroundColor: "#1a1a2e", borderWidth: 1.5, borderColor: "#FFD700" },
    cardOutline:   { backgroundColor: C.card, borderWidth: 1.5, borderColor: C.border },
    cardErrors:    { backgroundColor: C.card, borderWidth: 1.5, borderColor: C.yellow },
    cardInstall:   { backgroundColor: C.card, borderWidth: 1.5, borderColor: C.border },
    cardShare:     { backgroundColor: "#25D366", borderWidth: 1, borderColor: "#128C7E" },
    halfIcon: { fontSize: 26, marginBottom: 2 },
    halfTitle: { color: "#fff", fontSize: 14, fontWeight: "bold", textAlign: "center" },
    halfSub:   { color: "rgba(255,255,255,0.7)", fontSize: 11, textAlign: "center" },

    // Botón donación sutil al fondo
    donateBtn: {
      paddingVertical: 12,
      alignItems: "center",
      borderRadius: 12,
      borderWidth: 1,
      borderColor: C.yellowDark,
      backgroundColor: C.yellow,
      marginTop: 4,
    },
    donateBtnText: {
      color: C.black,
      fontSize: 14,
      fontWeight: "bold",
    },
  });
}
