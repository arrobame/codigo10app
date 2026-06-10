import { useMemo, useLayoutEffect } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useTheme } from "../theme/ThemeContext";
import { ThemeColors } from "../theme/colors";
import { NavigationProp } from "../types";

export default function CantoDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<NavigationProp>();
  const { title, letra } = route.params as { title: string; letra: string };
  const { C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);

  useLayoutEffect(() => {
    navigation.setOptions({ title });
  }, [navigation, title]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.letra}>{letra}</Text>
    </ScrollView>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    content: { padding: 24, paddingBottom: 40 },
    letra: { color: C.text, fontSize: 18, lineHeight: 30 },
  });
}
