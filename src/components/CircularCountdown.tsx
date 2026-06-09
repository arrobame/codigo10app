import { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { ThemeColors } from "../theme/colors";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  progressAnim: Animated.Value; // 1 → 0 a lo largo del tiempo
  remaining: number;            // segundos restantes (para el texto y el color)
  label: string;                // ej. "3 / 10"
  C: ThemeColors;
  size?: number;
  strokeWidth?: number;
}

function urgencyColor(remaining: number): string {
  if (remaining > 8) return "#2ecc71";
  if (remaining > 3) return "#f39c12";
  return "#e74c3c";
}

export default function CircularCountdown({
  progressAnim, remaining, label, C, size = 150, strokeWidth = 9,
}: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const color = urgencyColor(remaining);

  // El anillo se vacía: progress 1 → offset 0 (lleno), progress 0 → offset C (vacío)
  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  // Pulso sutil en los últimos 3 segundos
  const pulse = useRef(new Animated.Value(1)).current;
  const urgent = remaining <= 3 && remaining > 0;
  useEffect(() => {
    if (!urgent) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.05, duration: 450, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 450, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => { loop.stop(); pulse.setValue(1); };
  }, [urgent]);

  return (
    <View style={styles.wrap}>
      <Animated.View style={{ width: size, height: size, transform: [{ scale: pulse }] }}>
        <Svg width={size} height={size} style={{ transform: [{ rotate: "-90deg" }] }}>
          {/* Pista de fondo */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={C.cardRaised}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progreso */}
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </Svg>
        {/* Número al centro */}
        <View style={styles.center} pointerEvents="none">
          <View style={styles.numberRow}>
            <Text style={[styles.number, { color }]}>{remaining.toFixed(2)}</Text>
            <Text style={[styles.unit, { color }]}>s</Text>
          </View>
        </View>
      </Animated.View>
      <Text style={[styles.label, { color: C.textHint }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", gap: 8 },
  center: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  numberRow: { flexDirection: "row", alignItems: "flex-end" },
  number: { fontSize: 40, fontWeight: "800", lineHeight: 46, fontVariant: ["tabular-nums"] as any },
  unit: { fontSize: 18, fontWeight: "700", marginBottom: 6, marginLeft: 2 },
  label: { fontSize: 12, letterSpacing: 0.5 },
});
