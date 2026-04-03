import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

interface CheckupCardProps {
  hasCheckedUpToday: boolean;
  onPress: () => void;
}

export function CheckupCard({ hasCheckedUpToday, onPress }: CheckupCardProps) {
  const colors = useColors();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        styles.card,
        {
          backgroundColor: hasCheckedUpToday
            ? colors.success + "18"
            : colors.primary,
          borderRadius: colors.radius,
        },
      ]}
    >
      <View style={styles.row}>
        <View>
          <Text
            style={[
              styles.title,
              {
                color: hasCheckedUpToday
                  ? colors.success
                  : colors.primaryForeground,
              },
            ]}
          >
            {hasCheckedUpToday ? "Check-up complete!" : "Daily Check-up"}
          </Text>
          <Text
            style={[
              styles.sub,
              {
                color: hasCheckedUpToday
                  ? colors.mutedForeground
                  : colors.primaryForeground + "cc",
              },
            ]}
          >
            {hasCheckedUpToday
              ? "Great job staying on top of your health"
              : "How are you feeling today?"}
          </Text>
        </View>
        <View
          style={[
            styles.iconWrap,
            {
              backgroundColor: hasCheckedUpToday
                ? colors.success + "28"
                : colors.primaryForeground + "28",
            },
          ]}
        >
          <Feather
            name={hasCheckedUpToday ? "check-circle" : "activity"}
            size={24}
            color={
              hasCheckedUpToday ? colors.success : colors.primaryForeground
            }
          />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { padding: 20, marginBottom: 16 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 4 },
  sub: { fontSize: 13, fontFamily: "Inter_400Regular", maxWidth: "80%" },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
});
