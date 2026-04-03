import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useHealth } from "@/context/HealthContext";
import { SYMPTOMS } from "@/lib/storage";
import * as Haptics from "expo-haptics";

interface SliderProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  icon: keyof typeof Feather.glyphMap;
  color: string;
}

function ScaleSelector({ label, value, onChange, icon, color }: SliderProps) {
  const colors = useColors();
  return (
    <View style={selectorStyles.container}>
      <View style={selectorStyles.header}>
        <Feather name={icon} size={16} color={color} />
        <Text style={[selectorStyles.label, { color: colors.foreground }]}>
          {label}
        </Text>
        <Text style={[selectorStyles.value, { color: color }]}>{value}/10</Text>
      </View>
      <View style={selectorStyles.row}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
          <TouchableOpacity
            key={n}
            onPress={() => {
              onChange(n);
              Haptics.selectionAsync();
            }}
            style={[
              selectorStyles.dot,
              {
                backgroundColor: n <= value ? color : colors.muted,
                borderColor: n === value ? color : "transparent",
              },
            ]}
          >
            <Text
              style={[
                selectorStyles.dotText,
                { color: n <= value ? "#fff" : colors.mutedForeground },
              ]}
            >
              {n}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const selectorStyles = StyleSheet.create({
  container: { marginBottom: 20 },
  header: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  label: { flex: 1, fontSize: 14, fontFamily: "Inter_600SemiBold" },
  value: { fontSize: 14, fontFamily: "Inter_700Bold" },
  row: { flexDirection: "row", gap: 6 },
  dot: {
    flex: 1,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  dotText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
});

function WaterSelector({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const colors = useColors();
  return (
    <View style={waterStyles.container}>
      <View style={waterStyles.header}>
        <Feather name="droplet" size={16} color="#3b82f6" />
        <Text style={[waterStyles.label, { color: colors.foreground }]}>Water Intake</Text>
        <Text style={[waterStyles.value, { color: "#3b82f6" }]}>{value} glasses</Text>
      </View>
      <View style={waterStyles.row}>
        {[2, 4, 6, 8, 10, 12].map((n) => (
          <TouchableOpacity
            key={n}
            onPress={() => {
              onChange(n);
              Haptics.selectionAsync();
            }}
            style={[
              waterStyles.btn,
              {
                backgroundColor: value === n ? "#3b82f6" : colors.muted,
                borderRadius: colors.radius - 4,
              },
            ]}
          >
            <Feather
              name="droplet"
              size={12}
              color={value === n ? "#fff" : colors.mutedForeground}
            />
            <Text
              style={[
                waterStyles.btnText,
                { color: value === n ? "#fff" : colors.mutedForeground },
              ]}
            >
              {n}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const waterStyles = StyleSheet.create({
  container: { marginBottom: 20 },
  header: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  label: { flex: 1, fontSize: 14, fontFamily: "Inter_600SemiBold" },
  value: { fontSize: 14, fontFamily: "Inter_700Bold" },
  row: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  btnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
});

export default function CheckupScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addEntry, markCheckedUpToday, addNotification, hasCheckedUpToday } = useHealth();

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : 0;

  const [mood, setMood] = useState(7);
  const [energy, setEnergy] = useState(7);
  const [sleep, setSleep] = useState(7);
  const [water, setWater] = useState(6);
  const [steps, setSteps] = useState(5000);
  const [notes, setNotes] = useState("");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  function toggleSymptom(s: string) {
    Haptics.selectionAsync();
    setSelectedSymptoms((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  async function handleSubmit() {
    setSaving(true);
    try {
      await addEntry({
        date: new Date().toDateString(),
        mood,
        energy,
        sleep,
        water,
        steps,
        notes,
        symptoms: selectedSymptoms,
      });
      await markCheckedUpToday();
      await addNotification({
        type: "tip",
        title: "Check-up saved!",
        body: "Your health data has been logged. Keep it up!",
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Saved!", "Your check-up has been recorded.", [
        { text: "View Tips", onPress: () => router.push("/(app)/tips") },
        { text: "OK", onPress: () => router.push("/(app)/") },
      ]);
    } catch {
      Alert.alert("Error", "Failed to save check-up.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topInset + 16, paddingBottom: bottomInset + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>
          Daily Check-up
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </Text>

        {hasCheckedUpToday ? (
          <View
            style={[
              styles.doneBox,
              { backgroundColor: colors.success + "18", borderRadius: colors.radius },
            ]}
          >
            <Feather name="check-circle" size={20} color={colors.success} />
            <Text style={[styles.doneText, { color: colors.success }]}>
              You&apos;ve already checked in today. You can log another entry below.
            </Text>
          </View>
        ) : null}

        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            How are you feeling?
          </Text>
          <ScaleSelector
            label="Mood"
            value={mood}
            onChange={setMood}
            icon="smile"
            color={colors.primary}
          />
          <ScaleSelector
            label="Energy Level"
            value={energy}
            onChange={setEnergy}
            icon="zap"
            color={colors.warning}
          />
          <ScaleSelector
            label="Sleep Quality"
            value={sleep}
            onChange={setSleep}
            icon="moon"
            color={colors.info}
          />
          <WaterSelector value={water} onChange={setWater} />
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Any symptoms today?
          </Text>
          <View style={styles.symptomsGrid}>
            {SYMPTOMS.map((s) => {
              const selected = selectedSymptoms.includes(s);
              return (
                <TouchableOpacity
                  key={s}
                  onPress={() => toggleSymptom(s)}
                  style={[
                    styles.symptomBtn,
                    {
                      backgroundColor: selected
                        ? colors.warning + "20"
                        : colors.muted,
                      borderColor: selected ? colors.warning : "transparent",
                      borderRadius: colors.radius - 6,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.symptomText,
                      { color: selected ? colors.warning : colors.mutedForeground },
                    ]}
                  >
                    {s}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Additional Notes
          </Text>
          <TextInput
            style={[
              styles.notesInput,
              {
                color: colors.foreground,
                backgroundColor: colors.muted,
                borderRadius: colors.radius - 4,
              },
            ]}
            placeholder="How was your day? Any other health observations..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={4}
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.submitBtn,
            { backgroundColor: colors.primary, borderRadius: colors.radius },
            saving && { opacity: 0.7 },
          ]}
          onPress={handleSubmit}
          disabled={saving}
          activeOpacity={0.85}
        >
          <Feather name="check" size={18} color={colors.primaryForeground} />
          <Text style={[styles.submitText, { color: colors.primaryForeground }]}>
            {saving ? "Saving..." : "Save Check-up"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  title: { fontSize: 24, fontFamily: "Inter_700Bold", letterSpacing: -0.5, marginBottom: 4 },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 20 },
  doneBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    marginBottom: 16,
  },
  doneText: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  card: {
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 16 },
  symptomsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  symptomBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1.5,
  },
  symptomText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  notesInput: {
    padding: 12,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    minHeight: 100,
    textAlignVertical: "top",
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 54,
  },
  submitText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
