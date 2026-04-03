import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useHealth } from "@/context/HealthContext";
import { StatCard } from "@/components/StatCard";
import { CheckupCard } from "@/components/CheckupCard";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getMoodEmoji(mood: number) {
  if (mood >= 8) return "Excellent";
  if (mood >= 6) return "Good";
  if (mood >= 4) return "Fair";
  return "Poor";
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { entries, hasCheckedUpToday, notifications, unreadCount, addNotification } =
    useHealth();

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : 0;

  const recentEntry = entries[0] ?? null;
  const last7 = entries.slice(0, 7);
  const avgMood =
    last7.length > 0
      ? Math.round(last7.reduce((a, e) => a + e.mood, 0) / last7.length)
      : 0;
  const avgSleep =
    last7.length > 0
      ? (last7.reduce((a, e) => a + e.sleep, 0) / last7.length).toFixed(1)
      : "0";
  const avgWater =
    last7.length > 0
      ? Math.round(last7.reduce((a, e) => a + e.water, 0) / last7.length)
      : 0;

  useEffect(() => {
    if (!hasCheckedUpToday && user) {
      const msgs = [
        "How are you feeling today?",
        "Do you feel energetic today?",
        "Have you been drinking enough water?",
        "How is your sleep quality?",
      ];
      const msg = msgs[Math.floor(Math.random() * msgs.length)];
      addNotification({ type: "checkup", title: "Daily Check-up", body: msg });
    }
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: topInset + 16,
            paddingBottom: bottomInset + 90,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <View>
            <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
              {getGreeting()},
            </Text>
            <Text style={[styles.name, { color: colors.foreground }]}>
              {user?.displayName?.split(" ")[0] ?? "Friend"}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/(app)/profile")}
            style={[styles.notifBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Feather name="bell" size={20} color={colors.foreground} />
            {unreadCount > 0 ? (
              <View style={[styles.badge, { backgroundColor: colors.destructive }]}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>

        <CheckupCard
          hasCheckedUpToday={hasCheckedUpToday}
          onPress={() => router.push("/(app)/checkup")}
        />

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Last 7 Days
        </Text>
        <View style={styles.statsRow}>
          <StatCard
            icon="smile"
            label="Avg Mood"
            value={avgMood > 0 ? getMoodEmoji(avgMood) : "--"}
            subtitle={avgMood > 0 ? `${avgMood}/10` : "No data yet"}
            color={colors.primary}
          />
          <View style={{ width: 12 }} />
          <StatCard
            icon="moon"
            label="Avg Sleep"
            value={avgSleep !== "0" ? `${avgSleep}h` : "--"}
            subtitle="per night"
            color={colors.info}
          />
        </View>
        <View style={[styles.statsRow, { marginTop: 12 }]}>
          <StatCard
            icon="droplet"
            label="Avg Water"
            value={avgWater > 0 ? `${avgWater}` : "--"}
            subtitle="glasses/day"
            color="#3b82f6"
          />
          <View style={{ width: 12 }} />
          <StatCard
            icon="trending-up"
            label="Check-ins"
            value={entries.length}
            subtitle="total logged"
            color={colors.success}
          />
        </View>

        {recentEntry ? (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Latest Entry
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(app)/history")}
              style={[
                styles.recentCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: colors.radius,
                },
              ]}
              activeOpacity={0.9}
            >
              <View style={styles.recentRow}>
                <View>
                  <Text style={[styles.recentDate, { color: colors.mutedForeground }]}>
                    {new Date(recentEntry.date).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </Text>
                  <Text style={[styles.recentMood, { color: colors.foreground }]}>
                    Mood: {getMoodEmoji(recentEntry.mood)} · Energy: {recentEntry.energy}/10
                  </Text>
                </View>
                <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
              </View>
              {recentEntry.notes ? (
                <Text
                  style={[styles.recentNotes, { color: colors.mutedForeground }]}
                  numberOfLines={2}
                >
                  {recentEntry.notes}
                </Text>
              ) : null}
              {recentEntry.symptoms.length > 0 ? (
                <View style={styles.symptomsRow}>
                  {recentEntry.symptoms.slice(0, 3).map((s) => (
                    <View
                      key={s}
                      style={[
                        styles.symptomTag,
                        { backgroundColor: colors.warning + "20" },
                      ]}
                    >
                      <Text style={[styles.symptomText, { color: colors.warning }]}>
                        {s}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </TouchableOpacity>
          </>
        ) : (
          <View
            style={[
              styles.emptyCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius,
              },
            ]}
          >
            <Feather name="clipboard" size={32} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No health entries yet. Complete your first check-up!
            </Text>
          </View>
        )}

        <View style={styles.quickActionsRow}>
          {[
            { icon: "zap" as const, label: "Health Tips", route: "/(app)/tips" as const },
            { icon: "bar-chart-2" as const, label: "View History", route: "/(app)/history" as const },
          ].map((a) => (
            <TouchableOpacity
              key={a.label}
              style={[
                styles.quickAction,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: colors.radius,
                },
              ]}
              onPress={() => router.push(a.route)}
              activeOpacity={0.85}
            >
              <Feather name={a.icon} size={20} color={colors.primary} />
              <Text style={[styles.quickActionLabel, { color: colors.foreground }]}>
                {a.label}
              </Text>
            </TouchableOpacity>
          ))}
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
    marginBottom: 24,
  },
  greeting: { fontSize: 14, fontFamily: "Inter_400Regular" },
  name: { fontSize: 26, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  notifBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginTop: 4,
  },
  badge: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: "#fff", fontSize: 10, fontFamily: "Inter_700Bold" },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  statsRow: { flexDirection: "row" },
  recentCard: {
    padding: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  recentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  recentDate: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 4 },
  recentMood: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  recentNotes: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  symptomsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  symptomTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  symptomText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  emptyCard: {
    padding: 32,
    borderWidth: 1,
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  quickActionsRow: { flexDirection: "row", gap: 12, marginTop: 4 },
  quickAction: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 16,
    borderWidth: 1,
  },
  quickActionLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
});
