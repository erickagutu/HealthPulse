import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useHealth } from "@/context/HealthContext";
import { fetchHealthTips } from "@/lib/gemini";
import { storage } from "@/lib/storage";

const TIP_ICONS: Array<keyof typeof Feather.glyphMap> = [
  "heart",
  "droplet",
  "moon",
  "sun",
  "wind",
];
const TIP_COLORS = ["#00b4a0", "#3b82f6", "#8b5cf6", "#f59e0b", "#22c55e"];

export default function TipsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { entries, profile } = useHealth();

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : 0;

  const [tips, setTips] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  async function loadTips(force = false) {
    if (!user) return;

    if (!force) {
      const cached = await storage.getAITips(user.uid);
      if (cached.length > 0) {
        setTips(cached);
        setLoading(false);
        return;
      }
    }

    setRefreshing(true);
    const recentEntries = entries.slice(0, 7);
    const newTips = await fetchHealthTips(profile, recentEntries);
    await storage.saveAITips(user.uid, newTips);
    setTips(newTips);
    setLastUpdated(new Date().toLocaleDateString());
    setRefreshing(false);
    setLoading(false);
  }

  useEffect(() => {
    loadTips();
  }, [user]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topInset + 16, paddingBottom: bottomInset + 90 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <View>
            <Text style={[styles.title, { color: colors.foreground }]}>
              Health Tips
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Personalized by AI based on your data
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => loadTips(true)}
            disabled={refreshing}
            style={[
              styles.refreshBtn,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Feather name="refresh-cw" size={18} color={colors.primary} />
            )}
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.aiCard,
            {
              backgroundColor: colors.primary + "12",
              borderColor: colors.primary + "30",
              borderRadius: colors.radius,
            },
          ]}
        >
          <Feather name="cpu" size={16} color={colors.primary} />
          <Text style={[styles.aiText, { color: colors.primary }]}>
            Powered by Gemini AI · Based on your health profile and recent check-ins
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
              Generating personalized tips...
            </Text>
          </View>
        ) : (
          tips.map((tip, i) => (
            <View
              key={i}
              style={[
                styles.tipCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: colors.radius,
                  borderLeftColor: TIP_COLORS[i % TIP_COLORS.length],
                },
              ]}
            >
              <View
                style={[
                  styles.tipIconWrap,
                  { backgroundColor: TIP_COLORS[i % TIP_COLORS.length] + "18" },
                ]}
              >
                <Feather
                  name={TIP_ICONS[i % TIP_ICONS.length]}
                  size={20}
                  color={TIP_COLORS[i % TIP_COLORS.length]}
                />
              </View>
              <View style={styles.tipContent}>
                <Text style={[styles.tipNumber, { color: colors.mutedForeground }]}>
                  Tip {i + 1}
                </Text>
                <Text style={[styles.tipText, { color: colors.foreground }]}>
                  {tip}
                </Text>
              </View>
            </View>
          ))
        )}

        {lastUpdated && !loading ? (
          <Text style={[styles.updated, { color: colors.mutedForeground }]}>
            Last updated: {lastUpdated}
          </Text>
        ) : null}

        <View
          style={[
            styles.disclaimer,
            { backgroundColor: colors.muted, borderRadius: colors.radius },
          ]}
        >
          <Feather name="info" size={14} color={colors.mutedForeground} />
          <Text style={[styles.disclaimerText, { color: colors.mutedForeground }]}>
            These tips are for general wellness only. Consult a healthcare professional for medical advice.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  title: { fontSize: 24, fontFamily: "Inter_700Bold", letterSpacing: -0.5, marginBottom: 4 },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular" },
  refreshBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  aiCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  aiText: { fontSize: 12, fontFamily: "Inter_500Medium", flex: 1 },
  loadingState: { alignItems: "center", gap: 12, paddingVertical: 60 },
  loadingText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  tipCard: {
    flexDirection: "row",
    padding: 16,
    borderWidth: 1,
    borderLeftWidth: 4,
    marginBottom: 12,
    gap: 12,
  },
  tipIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  tipContent: { flex: 1 },
  tipNumber: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5, marginBottom: 4 },
  tipText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  updated: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center", marginBottom: 12 },
  disclaimer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
  },
  disclaimerText: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 18 },
});
