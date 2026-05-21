import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "../theme/ThemeContext";

export default function ThemeToggle() {
  const { isDark, toggle, C } = useTheme();

  return (
    <View style={[styles.pill, { backgroundColor: C.cardRaised, borderColor: C.border }]}>
      <TouchableOpacity
        style={[styles.option, isDark && { backgroundColor: C.yellow }]}
        onPress={() => { if (!isDark) toggle(); }}
        activeOpacity={0.8}
      >
        <Text style={[styles.label, { color: isDark ? C.black : C.textHint }]}>
          🌙 Oscuro
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.option, !isDark && { backgroundColor: C.yellow }]}
        onPress={() => { if (isDark) toggle(); }}
        activeOpacity={0.8}
      >
        <Text style={[styles.label, { color: !isDark ? C.black : C.textHint }]}>
          ☀️ Claro
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    borderRadius: 22,
    borderWidth: 1,
    padding: 3,
    alignSelf: "center",
  },
  option: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
  },
});
