import React, { useEffect, useState } from "react";
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
import { auth, AppUser } from "@/lib/firebase";
import { storage, HealthEntry, UserProfile } from "@/lib/storage";
import { MoodBar } from "@/components/MoodBar";

interface UserData {
  user: AppUser;
  entries: HealthEntry[];
  profile: UserProfile | null;
}

export default function AdminScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : 0;

  const [userData, setUserData] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.isAdmin) return;
    loadAllData();
  }, [user]);

  async function loadAllData() {
    setLoading(true);
    try {
      const users = await auth.getAllUsers();
      const data = await Promise.all(
        users.map(async (u) => ({
          user: u,
          entries: await storage.getHealthEntries(u.uid),
          profile: await storage.getUserProfile(u.uid),
        }))
      );
      setUserData(data);
    } catch {
    } finally {
      setLoading(false);
    }
  }

  if (!user?.isAdmin) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Feather name="lock" size={40} color={colors.mutedForeground} />
        <Text style={[styles.noAccess, { color: colors.mutedForeground }]}>
          Admin access required
        </Text>
      </View>
    );
  }

  const totalUsers = userData.length;
  const totalEntries = userData.reduce((a, u) => a + u.entries.length, 0);
  const avgMoodAll =
    totalEntries > 0
      ? (
          userData.reduce(
            (a, u) => a + u.entries.reduce((b, e) => b + e.mood, 0),
            0
          ) / totalEntries
        ).toFixed(1)
      : "0";

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
          <Text style={[styles.title, { color: colors.foreground }]}>
            Admin Dashboard
          </Text>
          <TouchableOpacity
            onPress={loadAllData}
            style={[styles.refreshBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Feather name="refresh-cw" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.summaryCard,
            { backgroundColor: colors.primary, borderRadius: colors.radius },
          ]}
        >
          <Text style={[styles.summaryTitle, { color: colors.primaryForeground }]}>
            Platform Overview
          </Text>
          <View style={styles.summaryStats}>
            {[
              { label: "Total Users", value: totalUsers, icon: "users" as const },
              { label: "Total Check-ins", value: totalEntries, icon: "clipboard" as const },
              { label: "Avg Mood", value: avgMoodAll, icon: "smile" as const },
            ].map((s) => (
              <View key={s.label} style={styles.summaryItem}>
                <Feather name={s.icon} size={16} color={colors.primaryForeground + "cc"} />
                <Text style={[styles.summaryValue, { color: colors.primaryForeground }]}>
                  {s.value}
                </Text>
                <Text style={[styles.summaryLabel, { color: colors.primaryForeground + "cc" }]}>
                  {s.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
              Loading user data from Firestore...
            </Text>
          </View>
        ) : (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              All Users ({totalUsers})
            </Text>
            {userData.map((u) => {
              const isSelected = selected === u.user.uid;
              const avgMood =
                u.entries.length > 0
                  ? (u.entries.reduce((a, e) => a + e.mood, 0) / u.entries.length).toFixed(1)
                  : null;
              const lastEntry = u.entries[0] ?? null;

              return (
                <TouchableOpacity
                  key={u.user.uid}
                  onPress={() => setSelected(isSelected ? null : u.user.uid)}
                  style={[
                    styles.userCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: isSelected ? colors.primary : colors.border,
                      borderRadius: colors.radius,
                    },
                  ]}
                  activeOpacity={0.9}
                >
                  <View style={styles.userRow}>
                    <View
                      style={[
                        styles.userAvatar,
                        { backgroundColor: colors.primary + "20" },
                      ]}
                    >
                      <Text style={[styles.userAvatarText, { color: colors.primary }]}>
                        {(u.user.displayName ?? u.user.email).charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.userInfo}>
                      <View style={styles.userNameRow}>
                        <Text style={[styles.userName, { color: colors.foreground }]}>
                          {u.user.displayName ?? "Unnamed"}
                        </Text>
                        {u.user.isAdmin ? (
                          <View style={[styles.adminBadge, { backgroundColor: colors.primary + "20" }]}>
                            <Text style={[styles.adminBadgeText, { color: colors.primary }]}>
                              Admin
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={[styles.userEmail, { color: colors.mutedForeground }]}>
                        {u.user.email}
                      </Text>
                    </View>
                    <View style={styles.userStats}>
                      <Text style={[styles.userStatValue, { color: colors.foreground }]}>
                        {u.entries.length}
                      </Text>
                      <Text style={[styles.userStatLabel, { color: colors.mutedForeground }]}>
                        check-ins
                      </Text>
                    </View>
                    <Feather
                      name={isSelected ? "chevron-up" : "chevron-down"}
                      size={16}
                      color={colors.mutedForeground}
                    />
                  </View>

                  {isSelected && (
                    <View style={[styles.expandedSection, { borderTopColor: colors.border }]}>
                      {u.profile ? (
                        <View style={styles.profileGrid}>
                          {[
                            { label: "Age", value: u.profile.age },
                            { label: "Height", value: u.profile.height ? `${u.profile.height}cm` : null },
                            { label: "Weight", value: u.profile.weight ? `${u.profile.weight}kg` : null },
                            { label: "Blood Type", value: u.profile.bloodType },
                            { label: "Occupation", value: u.profile.occupation },
                            { label: "Goal", value: u.profile.goal },
                          ]
                            .filter((f) => f.value)
                            .map((f) => (
                              <View key={f.label} style={styles.profileField}>
                                <Text style={[styles.profileFieldLabel, { color: colors.mutedForeground }]}>
                                  {f.label}
                                </Text>
                                <Text style={[styles.profileFieldValue, { color: colors.foreground }]}>
                                  {f.value}
                                </Text>
                              </View>
                            ))}
                        </View>
                      ) : (
                        <Text style={[styles.noProfile, { color: colors.mutedForeground }]}>
                          No health profile set up yet.
                        </Text>
                      )}

                      {avgMood ? (
                        <View style={styles.moodSection}>
                          <Text style={[styles.expandLabel, { color: colors.mutedForeground }]}>
                            Average Health Metrics
                          </Text>
                          <MoodBar
                            label="Avg Mood"
                            value={Number(avgMood)}
                            color={colors.primary}
                          />
                        </View>
                      ) : null}

                      {lastEntry ? (
                        <View style={styles.lastEntrySection}>
                          <Text style={[styles.expandLabel, { color: colors.mutedForeground }]}>
                            Last Check-in: {new Date(lastEntry.date).toLocaleDateString()}
                          </Text>
                          {lastEntry.symptoms.length > 0 ? (
                            <View style={styles.symptomsRow}>
                              {lastEntry.symptoms.map((s) => (
                                <View
                                  key={s}
                                  style={[styles.symptomTag, { backgroundColor: colors.warning + "20" }]}
                                >
                                  <Text style={[styles.symptomText, { color: colors.warning }]}>
                                    {s}
                                  </Text>
                                </View>
                              ))}
                            </View>
                          ) : null}
                        </View>
                      ) : null}

                      {u.profile?.conditions ? (
                        <View style={[styles.conditionsBox, { backgroundColor: colors.destructive + "10", borderRadius: 8 }]}>
                          <Feather name="alert-triangle" size={12} color={colors.destructive} />
                          <Text style={[styles.conditionsText, { color: colors.destructive }]}>
                            Conditions: {u.profile.conditions}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}

            {userData.length === 0 ? (
              <View
                style={[
                  styles.empty,
                  { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius },
                ]}
              >
                <Feather name="users" size={32} color={colors.mutedForeground} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  No users registered yet.
                </Text>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  scroll: { paddingHorizontal: 20 },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: { fontSize: 24, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  refreshBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  summaryCard: { padding: 20, marginBottom: 20 },
  summaryTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 16, opacity: 0.8 },
  summaryStats: { flexDirection: "row", justifyContent: "space-around" },
  summaryItem: { alignItems: "center", gap: 4 },
  summaryValue: { fontSize: 24, fontFamily: "Inter_700Bold" },
  summaryLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 12 },
  loadingState: { alignItems: "center", gap: 12, paddingVertical: 40 },
  loadingText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  noAccess: { fontSize: 16, fontFamily: "Inter_400Regular", marginTop: 12 },
  userCard: { padding: 16, borderWidth: 1, marginBottom: 12 },
  userRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  userAvatarText: { fontSize: 18, fontFamily: "Inter_700Bold" },
  userInfo: { flex: 1 },
  userNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  userName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  userEmail: { fontSize: 12, fontFamily: "Inter_400Regular" },
  adminBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  adminBadgeText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  userStats: { alignItems: "center" },
  userStatValue: { fontSize: 18, fontFamily: "Inter_700Bold" },
  userStatLabel: { fontSize: 10, fontFamily: "Inter_400Regular" },
  expandedSection: { borderTopWidth: 1, marginTop: 14, paddingTop: 14 },
  profileGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 14 },
  profileField: { width: "47%" },
  profileFieldLabel: { fontSize: 10, fontFamily: "Inter_500Medium", marginBottom: 2 },
  profileFieldValue: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  noProfile: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 12 },
  expandLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.4, marginBottom: 8 },
  moodSection: { marginBottom: 12 },
  lastEntrySection: { marginBottom: 12 },
  symptomsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  symptomTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  symptomText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  conditionsBox: { flexDirection: "row", alignItems: "center", gap: 6, padding: 8 },
  conditionsText: { fontSize: 12, fontFamily: "Inter_500Medium", flex: 1 },
  empty: { padding: 40, alignItems: "center", gap: 10, borderWidth: 1 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
});
