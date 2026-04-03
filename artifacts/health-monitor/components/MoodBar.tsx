import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";

interface MoodBarProps {
  label: string;
  value: number;
  max?: number;
  color?: string;
}

export function MoodBar({ label, value, max = 10, color }: MoodBarProps) {
  const colors = useColors();
  const pct = Math.min(Math.max(value / max, 0), 1);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>
          {label}
        </Text>
        <Text style={[styles.value, { color: colors.foreground }]}>
          {value}/{max}
        </Text>
      </View>
      <View
        style={[styles.track, { backgroundColor: colors.muted }]}
      >
        <View
          style={[
            styles.fill,
            {
              width: `${pct * 100}%`,
              backgroundColor: color || colors.primary,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 12 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  label: { fontSize: 13, fontFamily: "Inter_500Medium" },
  value: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  track: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: 4 },
});
