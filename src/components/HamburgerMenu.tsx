import { useState, useRef, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Pressable,
  Animated,
} from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { ThemeColors } from "../theme/colors";
import ThemeToggle from "./ThemeToggle";
import GoogleSignInButton from "./GoogleSignInButton";

export default function HamburgerMenu() {
  const [open, setOpen] = useState(false);
  const { C, isDark } = useTheme();
  const { user, signOut } = useAuth();
  const styles = useMemo(() => makeStyles(C), [C]);
  const slideAnim = useRef(new Animated.Value(320)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: open ? 0 : 320,
      useNativeDriver: true,
      bounciness: 0,
      speed: 20,
    }).start();
  }, [open]);

  function close() {
    setOpen(false);
  }

  return (
    <>
      {/* Botón trigger estilo card */}
      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={[
          styles.triggerBtn,
          { borderColor: isDark ? C.yellow + "55" : C.black + "33" },
        ]}
        activeOpacity={0.75}
      >
        {user ? (
          <View style={styles.triggerAvatar}>
            <Text style={styles.triggerAvatarText}>
              {user.username.charAt(0).toUpperCase()}
            </Text>
          </View>
        ) : (
          <Text style={[styles.triggerIcon, { color: isDark ? C.yellow : C.black }]}>
            ≡
          </Text>
        )}
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={close}
      >
        <Pressable style={styles.overlay} onPress={close}>
          <Animated.View
            style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}
          >
            <Pressable onPress={() => {}} style={{ flex: 1 }}>
              {/* Header */}
              <View style={styles.drawerHeader}>
                <Text style={styles.drawerTitle}>Menú</Text>
                <TouchableOpacity
                  onPress={close}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.closeIconBtn}
                >
                  <Text style={styles.closeIcon}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Cuenta */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>CUENTA</Text>
                {user ? (
                  <View style={styles.userBox}>
                    <View style={styles.userAvatarCircle}>
                      <Text style={styles.userAvatarText}>
                        {user.username.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.username} numberOfLines={1}>
                        {user.username}
                      </Text>
                      <Text style={styles.userEmail} numberOfLines={1}>
                        {user.email}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.signOutBtn}
                      onPress={() => { signOut(); close(); }}
                    >
                      <Text style={styles.signOutText}>Salir</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.loginBox}>
                    <Text style={styles.loginHint}>
                      Iniciá sesión para aparecer en el ranking
                    </Text>
                    <GoogleSignInButton />
                  </View>
                )}
              </View>

              <View style={styles.divider} />

              {/* Tema */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>TEMA</Text>
                <ThemeToggle />
              </View>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
    </>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    // Botón trigger
    triggerBtn: {
      backgroundColor: C.cardRaised,
      borderRadius: 20,
      borderWidth: 1,
      paddingHorizontal: 12,
      paddingVertical: 6,
      alignItems: "center",
      justifyContent: "center",
      minWidth: 38,
      minHeight: 32,
    },
    triggerIcon: {
      fontSize: 20,
      lineHeight: 22,
      fontWeight: "300",
    },
    triggerAvatar: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: C.yellow,
      alignItems: "center",
      justifyContent: "center",
    },
    triggerAvatarText: {
      color: C.onAccent,
      fontWeight: "bold",
      fontSize: 13,
    },

    // Drawer
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.55)",
      flexDirection: "row",
      justifyContent: "flex-end",
    },
    drawer: {
      width: 300,
      backgroundColor: C.card,
      height: "100%",
      borderLeftWidth: 1,
      borderLeftColor: C.border,
      shadowColor: "#000",
      shadowOffset: { width: -4, height: 0 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 20,
    },
    drawerHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 20,
      paddingTop: 52,
      borderBottomWidth: 1,
      borderBottomColor: C.border,
    },
    drawerTitle: {
      color: C.text,
      fontSize: 18,
      fontWeight: "bold",
    },
    closeIconBtn: {
      backgroundColor: C.cardRaised,
      borderRadius: 16,
      width: 32,
      height: 32,
      alignItems: "center",
      justifyContent: "center",
    },
    closeIcon: {
      color: C.textDim,
      fontSize: 14,
    },
    section: {
      padding: 20,
      gap: 12,
    },
    sectionLabel: {
      color: C.textHint,
      fontSize: 11,
      fontWeight: "bold",
      letterSpacing: 1.2,
    },
    userBox: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: C.cardRaised,
      borderRadius: 14,
      padding: 14,
      gap: 12,
      borderWidth: 1,
      borderColor: C.border,
    },
    userAvatarCircle: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: C.yellow,
      alignItems: "center",
      justifyContent: "center",
    },
    userAvatarText: {
      color: C.onAccent,
      fontWeight: "bold",
      fontSize: 18,
    },
    username: { color: C.text, fontWeight: "bold", fontSize: 14 },
    userEmail: { color: C.textHint, fontSize: 11, marginTop: 1 },
    signOutBtn: {
      backgroundColor: C.wrongBg,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: C.wrongBorder,
    },
    signOutText: { color: C.wrongBorder, fontSize: 12, fontWeight: "bold" },
    loginBox: { gap: 10 },
    loginHint: { color: C.textDim, fontSize: 13, lineHeight: 18 },
    divider: { height: 1, backgroundColor: C.border, marginHorizontal: 20 },
  });
}
