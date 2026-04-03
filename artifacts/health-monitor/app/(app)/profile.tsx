import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useHealth } from "@/context/HealthContext";
import { UserProfile } from "@/lib/storage";
import * as Haptics from "expo-haptics";

const FIELDS: Array<{
  key: keyof UserProfile;
  label: string;
  placeholder: string;
  icon: keyof typeof Feather.glyphMap;
  keyboardType?: "default" | "numeric" | "email-address";
}> = [
  { key: "age", label: "Age", placeholder: "e.g. 28", icon: "calendar", keyboardType: "numeric" },
  { key: "height", label: "Height (cm)", placeholder: "e.g. 175", icon: "maximize-2", keyboardType: "numeric" },
  { key: "weight", label: "Weight (kg)", placeholder: "e.g. 70", icon: "trending-up", keyboardType: "numeric" },
  { key: "occupation", label: "Occupation", placeholder: "e.g. Software Engineer", icon: "briefcase" },
  { key: "gender", label: "Gender", placeholder: "e.g. Male / Female / Other", icon: "user" },
  { key: "bloodType", label: "Blood Type", placeholder: "e.g. O+", icon: "droplet" },
  { key: "conditions", label: "Medical Conditions", placeholder: "e.g. Diabetes, Hypertension", icon: "activity" },
  { key: "medications", label: "Current Medications", placeholder: "e.g. Metformin 500mg", icon: "package" },
  { key: "goal", label: "Health Goal", placeholder: "e.g. Lose weight, Reduce stress", icon: "target" },
];

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const { profile, saveProfile, entries } = useHealth();

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : 0;

  const [form, setForm] = useState<Partial<UserProfile>>({});
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm(profile);
    } else if (user) {
      setForm({
        uid: user.uid,
        displayName: user.displayName ?? "",
        email: user.email,
      });
    }
  }, [profile, user]);

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    try {
      await saveProfile({
        uid: user.uid,
        displayName: user.displayName ?? "",
        email: user.email,
        age: form.age ?? "",
        height: form.height ?? "",
        weight: form.weight ?? "",
        occupation: form.occupation ?? "",
        gender: form.gender ?? "",
        bloodType: form.bloodType ?? "",
        conditions: form.conditions ?? "",
        medications: form.medications ?? "",
        goal: form.goal ?? "",
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setEditMode(false);
      Alert.alert("Saved", "Your profile has been updated.");
    } catch {
      Alert.alert("Error", "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  }

  const bmi =
    form.height && form.weight
      ? (
          Number(form.weight) /
          ((Number(form.height) / 100) * (Number(form.height) / 100))
        ).toFixed(1)
      : null;

  const bmiCategory = bmi
    ? Number(bmi) < 18.5
      ? "Underweight"
      : Number(bmi) < 25
      ? "Normal"
      : Number(bmi) < 30
      ? "Overweight"
      : "Obese"
    : null;

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
            My Profile
          </Text>
          <TouchableOpacity
            onPress={() => (editMode ? handleSave() : setEditMode(true))}
            disabled={saving}
            style={[
              styles.editBtn,
              { backgroundColor: editMode ? colors.primary : colors.card, borderColor: colors.border },
            ]}
          >
            <Feather
              name={editMode ? "check" : "edit-2"}
              size={16}
              color={editMode ? colors.primaryForeground : colors.foreground}
            />
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.avatarCard,
            { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius },
          ]}
        >
          <View
            style={[
              styles.avatar,
              { backgroundColor: colors.primary + "20" },
            ]}
          >
            <Text style={[styles.avatarText, { color: colors.primary }]}>
              {(user?.displayName ?? "U").charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.avatarInfo}>
            <Text style={[styles.avatarName, { color: colors.foreground }]}>
              {user?.displayName}
            </Text>
            <Text style={[styles.avatarEmail, { color: colors.mutedForeground }]}>
              {user?.email}
            </Text>
            {user?.isAdmin ? (
              <View style={[styles.adminBadge, { backgroundColor: colors.primary + "20" }]}>
                <Feather name="shield" size={10} color={colors.primary} />
                <Text style={[styles.adminBadgeText, { color: colors.primary }]}>
                  Admin
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {bmi ? (
          <View
            style={[
              styles.bmiCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius,
              },
            ]}
          >
            <View style={styles.bmiRow}>
              <Text style={[styles.bmiLabel, { color: colors.mutedForeground }]}>
                BMI
              </Text>
              <Text style={[styles.bmiValue, { color: colors.primary }]}>
                {bmi}
              </Text>
              <View
                style={[
                  styles.bmiCategory,
                  {
                    backgroundColor:
                      bmiCategory === "Normal"
                        ? colors.success + "20"
                        : colors.warning + "20",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.bmiCategoryText,
                    {
                      color:
                        bmiCategory === "Normal"
                          ? colors.success
                          : colors.warning,
                    },
                  ]}
                >
                  {bmiCategory}
                </Text>
              </View>
            </View>
            <View style={styles.statsRowSmall}>
              <Text style={[styles.statSmall, { color: colors.mutedForeground }]}>
                {entries.length} total check-ins
              </Text>
            </View>
          </View>
        ) : null}

        <View
          style={[
            styles.formCard,
            { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Health Information
          </Text>
          {FIELDS.map((field) => (
            <View key={field.key} style={styles.fieldRow}>
              <View style={styles.fieldIcon}>
                <Feather name={field.icon} size={14} color={colors.mutedForeground} />
              </View>
              <View style={styles.fieldContent}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                  {field.label}
                </Text>
                {editMode ? (
                  <TextInput
                    style={[
                      styles.fieldInput,
                      { color: colors.foreground, borderBottomColor: colors.primary },
                    ]}
                    value={String(form[field.key] ?? "")}
                    onChangeText={(v) =>
                      setForm((prev) => ({ ...prev, [field.key]: v }))
                    }
                    placeholder={field.placeholder}
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType={field.keyboardType ?? "default"}
                  />
                ) : (
                  <Text style={[styles.fieldValue, { color: colors.foreground }]}>
                    {String(form[field.key] ?? "") || "Not set"}
                  </Text>
                )}
              </View>
            </View>
          ))}
          {editMode ? (
            <TouchableOpacity
              style={[
                styles.saveBtn,
                { backgroundColor: colors.primary, borderRadius: colors.radius - 4 },
                saving && { opacity: 0.7 },
              ]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>
                {saving ? "Saving..." : "Save Profile"}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity
          style={[
            styles.signOutBtn,
            { borderColor: colors.destructive, borderRadius: colors.radius },
          ]}
          onPress={handleSignOut}
          activeOpacity={0.85}
        >
          <Feather name="log-out" size={16} color={colors.destructive} />
          <Text style={[styles.signOutText, { color: colors.destructive }]}>
            Sign Out
          </Text>
        </TouchableOpacity>
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
    alignItems: "center",
    marginBottom: 20,
  },
  title: { fontSize: 24, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  editBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  avatarCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 24, fontFamily: "Inter_700Bold" },
  avatarInfo: { flex: 1 },
  avatarName: { fontSize: 17, fontFamily: "Inter_700Bold", marginBottom: 2 },
  avatarEmail: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 6 },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  adminBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  bmiCard: {
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  bmiRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  bmiLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  bmiValue: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -1, flex: 1 },
  bmiCategory: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  bmiCategoryText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  statsRowSmall: { marginTop: 8 },
  statSmall: { fontSize: 12, fontFamily: "Inter_400Regular" },
  formCard: { padding: 16, borderWidth: 1, marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 16 },
  fieldRow: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  fieldIcon: { paddingTop: 2, width: 20 },
  fieldContent: { flex: 1 },
  fieldLabel: { fontSize: 11, fontFamily: "Inter_500Medium", marginBottom: 2 },
  fieldValue: { fontSize: 14, fontFamily: "Inter_400Regular" },
  fieldInput: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    borderBottomWidth: 1,
    paddingBottom: 2,
  },
  saveBtn: {
    marginTop: 16,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 50,
    borderWidth: 1.5,
    marginBottom: 20,
  },
  signOutText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
