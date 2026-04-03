import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useHealth } from "@/context/HealthContext";
import { HealthEntry } from "@/lib/storage";
import { MoodBar } from "@/components/MoodBar";

function getMoodLabel(v: number) {
  if (v >= 8) return "Excellent";
  if (v >= 6) return "Good";
  if (v >= 4) return "Fair";
  return "Poor";
}

function getMoodColor(v: number, colors: { success: string; primary: string; warning: string; destructive: string }) {
  if (v >= 8) return colors.success;
  if (v >= 6) return colors.primary;
  if (v >= 4) return colors.warning;
  return colors.destructive;
}

function EntryCard({ entry }: { entry: HealthEntry }) {
  const colors = useColors();
  const [expanded, setExpanded] = useState(false);
  const moodColor = getMoodColor(entry.mood, colors);

  return (
    <TouchableOpacity
      onPress={() => setExpanded((v) => !v)}
      style={[
        styles.entryCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: colors.radius,
        },
      ]}
      activeOpacity={0.9}
    >
      <View style={styles.entryHeader}>
        <View style={styles.entryLeft}>
          <View
            style={[
              styles.moodBadge,
              { backgroundColor: moodColor + "20" },
            ]}
          >
            <Text style={[styles.moodBadgeText, { color: moodColor }]}>
              {getMoodLabel(entry.mood)}
            </Text>
          </View>
          <Text style={[styles.entryDate, { color: colors.mutedForeground }]}>
            {new Date(entry.date).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </Text>
        </View>
        <Feather
          name={expanded ? "chevron-up" : "chevron-down"}
          size={16}
          color={colors.mutedForeground}
        />
      </View>

      <View style={styles.metricsRow}>
        {[
          { label: "Mood", value: entry.mood, icon: "smile" as const, color: colors.primary },
          { label: "Energy", value: entry.energy, icon: "zap" as const, color: colors.warning },
          { label: "Sleep", value: entry.sleep, icon: "moon" as const, color: colors.info },
        ].map((m) => (
          <View key={m.label} style={styles.metric}>
            <Feather name={m.icon} size={12} color={m.color} />
            <Text style={[styles.metricValue, { color: colors.foreground }]}>
              {m.value}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>
              {m.label}
            </Text>
          </View>
        ))}
        <View style={styles.metric}>
          <Feather name="droplet" size={12} color="#3b82f6" />
          <Text style={[styles.metricValue, { color: colors.foreground }]}>
            {entry.water}
          </Text>
          <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>
            Water
          </Text>
        </View>
      </View>

      {expanded && (
        <View style={[styles.expandedSection, { borderTopColor: colors.border }]}>
          <MoodBar label="Mood" value={entry.mood} color={colors.primary} />
          <MoodBar label="Energy" value={entry.energy} color={colors.warning} />
          <MoodBar label="Sleep Quality" value={entry.sleep} color={colors.info} />
          <MoodBar label="Water (glasses)" value={entry.water} max={12} color="#3b82f6" />

          {entry.symptoms.length > 0 ? (
            <View style={styles.symptomsSection}>
              <Text style={[styles.expandLabel, { color: colors.mutedForeground }]}>
                Symptoms
              </Text>
              <View style={styles.tagsRow}>
                {entry.symptoms.map((s) => (
                  <View
                    key={s}
                    style={[
                      styles.tag,
                      { backgroundColor: colors.warning + "18" },
                    ]}
                  >
                    <Text style={[styles.tagText, { color: colors.warning }]}>
                      {s}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {entry.notes ? (
            <View style={styles.notesSection}>
              <Text style={[styles.expandLabel, { color: colors.mutedForeground }]}>
                Notes
              </Text>
              <Text style={[styles.notesText, { color: colors.foreground }]}>
                {entry.notes}
              </Text>
            </View>
          ) : null}
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function HistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { entries, loadingEntries } = useHealth();

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : 0;

  if (loadingEntries) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.loading, { color: colors.mutedForeground }]}>
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <EntryCard entry={item} />}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: topInset + 16, paddingBottom: bottomInset + 90 },
        ]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground }]}>
              Health History
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {entries.length} {entries.length === 1 ? "entry" : "entries"} logged
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={[styles.empty, { borderColor: colors.border, borderRadius: colors.radius, backgroundColor: colors.card }]}>
            <Feather name="clipboard" size={36} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              No entries yet
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Complete your daily check-up to start tracking your health.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingHorizontal: 20 },
  loading: { textAlign: "center", marginTop: 100, fontFamily: "Inter_400Regular" },
  header: { marginBottom: 20 },
  title: { fontSize: 24, fontFamily: "Inter_700Bold", letterSpacing: -0.5, marginBottom: 4 },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular" },
  entryCard: { padding: 16, borderWidth: 1, marginBottom: 12 },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  entryLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  moodBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  moodBadgeText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  entryDate: { fontSize: 13, fontFamily: "Inter_400Regular" },
  metricsRow: { flexDirection: "row", gap: 16 },
  metric: { alignItems: "center", gap: 2 },
  metricValue: { fontSize: 16, fontFamily: "Inter_700Bold" },
  metricLabel: { fontSize: 10, fontFamily: "Inter_400Regular" },
  expandedSection: { borderTopWidth: 1, marginTop: 14, paddingTop: 14 },
  expandLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5, marginBottom: 6 },
  symptomsSection: { marginBottom: 12 },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  tagText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  notesSection: { marginBottom: 8 },
  notesText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  empty: {
    padding: 40,
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    marginTop: 20,
  },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
});
