import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from "react-native";
import AppHeader from "@/components/AppHeader";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { fontSize, radius, spacing, type ThemeColors } from "@/constants/theme";
import { updateUserProfile } from "@/lib/auth";

export default function ProfileScreen() {
  const { profile, refreshProfile } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | undefined>();
  const [fullName, setFullName] = useState(profile?.fullName ?? "");
  const [email, setEmail] = useState(profile?.email ?? "");
  const [username, setUsername] = useState(profile?.username ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");

  function startEditing() {
    setFullName(profile?.fullName ?? "");
    setEmail(profile?.email ?? "");
    setUsername(profile?.username ?? "");
    setPhone(profile?.phone ?? "");
    setEditing(true);
  }

  async function chooseAvatar() {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Photo access needed", "Allow photo library access to choose a profile picture.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled) setAvatarUri(result.assets[0]?.uri);
    } catch (error) {
      Alert.alert(
        "Could not open photos",
        error instanceof Error ? error.message : "Please try again."
      );
    }
  }

  async function saveProfile() {
    if (!profile) {
      Alert.alert("Unable to save", "Your profile could not be loaded.");
      return;
    }
    setSaving(true);
    try {
      const result = await updateUserProfile(
        { fullName, email, username, phone },
        avatarUri
      );
      if (result.error) {
        Alert.alert("Unable to save profile", result.error);
        return;
      }
      await refreshProfile();
      setAvatarUri(undefined);
      setEditing(false);
      Alert.alert(
        result.emailConfirmationRequired ? "Confirm your new email" : "Profile updated",
        result.emailConfirmationRequired
          ? "Your other profile details were saved. Follow the confirmation link sent to your new email address to complete the email change."
          : "Your profile information has been updated."
      );
    } catch (error) {
      Alert.alert(
        "Unable to save profile",
        error instanceof Error ? error.message : "Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  function cancelEditing() {
    setFullName(profile?.fullName ?? "");
    setEmail(profile?.email ?? "");
    setUsername(profile?.username ?? "");
    setPhone(profile?.phone ?? "");
    setAvatarUri(undefined);
    setEditing(false);
  }

  const avatarSource = avatarUri
    ? { uri: avatarUri }
    : profile?.avatarUrl
      ? { uri: profile.avatarUrl }
      : null;

  return (
    <View style={styles.screen}>
      <AppHeader title="Profile" showBack showBell={false} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.avatarWrap}>
          <Pressable
            accessibilityRole={editing ? "button" : undefined}
            accessibilityLabel={editing ? "Change profile picture" : undefined}
            disabled={!editing || saving}
            onPress={() => void chooseAvatar()}
            style={styles.avatar}
          >
            {avatarSource ? (
              <Image
                source={avatarSource}
                style={styles.avatarImage}
                alt="Resident profile picture"
                accessibilityLabel="Resident profile picture"
              />
            ) : (
              <Ionicons name="person" size={40} color={colors.primary} />
            )}
            {editing ? (
              <View style={styles.cameraBadge}>
                <Ionicons name="camera" size={15} color={colors.white} />
              </View>
            ) : null}
          </Pressable>
          <Text style={styles.role}>Resident</Text>
          {editing ? (
            <Text style={styles.photoHint}>Tap your photo to change it</Text>
          ) : (
            <Text style={styles.name}>{profile?.fullName ?? "Resident"}</Text>
          )}
        </View>

        <View style={styles.card}>
          {editing ? (
            <>
              <ProfileField label="Full Name" value={fullName} onChangeText={setFullName} colors={colors} styles={styles} autoCapitalize="words" />
              <ProfileField label="Email" value={email} onChangeText={setEmail} colors={colors} styles={styles} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
              <ProfileField label="Username" value={username} onChangeText={setUsername} colors={colors} styles={styles} autoCapitalize="none" autoCorrect={false} />
              <ProfileField label="Phone" value={phone} onChangeText={setPhone} colors={colors} styles={styles} keyboardType="phone-pad" />
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Role</Text>
                <Text style={styles.rowValue}>Resident</Text>
              </View>
            </>
          ) : (
            [
              { label: "Full Name", value: profile?.fullName ?? "—" },
              { label: "Email", value: profile?.email ?? "—" },
              { label: "Username", value: profile?.username ?? "—" },
              { label: "Phone", value: profile?.phone || "Not set" },
              { label: "Role", value: "Resident" },
            ].map((row) => (
              <View key={row.label} style={styles.row}>
                <Text style={styles.rowLabel}>{row.label}</Text>
                <Text style={styles.rowValue}>{row.value}</Text>
              </View>
            ))
          )}
        </View>

        {editing ? (
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              disabled={saving}
              onPress={cancelEditing}
              style={[styles.actionButton, styles.cancelButton]}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={saving}
              onPress={() => void saveProfile()}
              style={[styles.actionButton, styles.saveButton, saving && styles.disabled]}
            >
              {saving ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.saveText}>Save Changes</Text>
              )}
            </Pressable>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            onPress={startEditing}
            style={[styles.actionButton, styles.saveButton]}
          >
            <Ionicons name="create-outline" size={18} color={colors.white} />
            <Text style={styles.saveText}>Edit Profile</Text>
          </Pressable>
        )}

        <Text style={styles.note}>
          Password changes are managed through Supabase Auth. Contact your LGU
          administrator if you need help resetting your account.
        </Text>
      </ScrollView>
    </View>
  );
}

function ProfileField({
  label,
  value,
  onChangeText,
  colors,
  styles,
  ...inputProps
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  colors: ThemeColors;
  styles: ReturnType<typeof createStyles>;
} & Pick<TextInputProps, "autoCapitalize" | "autoCorrect" | "keyboardType">) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        autoCapitalize={inputProps.autoCapitalize}
        autoCorrect={inputProps.autoCorrect}
        keyboardType={inputProps.keyboardType}
        onChangeText={onChangeText}
        placeholder={label}
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        value={value}
      />
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md, gap: spacing.lg, paddingBottom: spacing.xl },
    avatarWrap: { alignItems: "center", gap: spacing.sm },
    avatar: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: colors.primaryLight,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarImage: { width: "100%", height: "100%", borderRadius: 44 },
    cameraBadge: {
      position: "absolute",
      right: 0,
      bottom: 0,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.primary,
      borderWidth: 2,
      borderColor: colors.background,
      alignItems: "center",
      justifyContent: "center",
    },
    role: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: "600" },
    name: { fontSize: fontSize.xl, fontWeight: "800", color: colors.text },
    photoHint: { color: colors.textMuted, fontSize: fontSize.sm },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    row: {
      padding: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: 6,
    },
    rowLabel: {
      fontSize: fontSize.xs,
      color: colors.textMuted,
      fontWeight: "600",
      textTransform: "uppercase",
    },
    rowValue: { fontSize: fontSize.md, color: colors.text, fontWeight: "600" },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.sm,
      color: colors.text,
      backgroundColor: colors.background,
      paddingHorizontal: spacing.sm,
      paddingVertical: 10,
      fontSize: fontSize.md,
    },
    actions: { flexDirection: "row", gap: spacing.sm },
    actionButton: {
      minHeight: 48,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
    },
    cancelButton: { flex: 1, borderWidth: 1, borderColor: colors.border },
    cancelText: { color: colors.text, fontWeight: "700" },
    saveButton: { flex: 1, backgroundColor: colors.primary },
    saveText: { color: colors.white, fontWeight: "800", fontSize: fontSize.md },
    disabled: { opacity: 0.6 },
    note: {
      color: colors.textMuted,
      fontSize: fontSize.sm,
      lineHeight: 20,
      textAlign: "center",
    },
  });
}
