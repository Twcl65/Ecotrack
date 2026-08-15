import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AppHeader from "@/components/AppHeader";
import ComplaintFormModal, { type ComplaintFormValues } from "@/components/ComplaintFormModal";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import {
  fetchUserComplaints,
  submitComplaint,
  type UserComplaint,
} from "@/lib/data/complaints";
import { fontSize, radius, spacing, type ThemeColors } from "@/constants/theme";

export default function ComplaintScreen() {
  const { profile } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const statusColors = useMemo(
    () => ({
      pending: colors.warning,
      in_progress: colors.info,
      resolved: colors.primary,
      declined: colors.danger,
    }),
    [colors]
  );
  const [complaints, setComplaints] = useState<UserComplaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const items = await fetchUserComplaints(
      profile?.fullName ?? "",
      profile?.phone ?? ""
    );
    setComplaints(items);
  }, [profile?.fullName, profile?.phone]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function handleSubmit(values: ComplaintFormValues) {
    if (!values.description.trim()) {
      Alert.alert("Required", "Please describe your complaint.");
      return;
    }

    setSubmitting(true);
    const result = await submitComplaint({
      complainantName: profile?.fullName ?? "Resident",
      phone: profile?.phone ?? "N/A",
      barangay: values.barangay,
      complaintType: values.complaintType,
      issue: values.description,
    });
    setSubmitting(false);

    if (!result.success) {
      Alert.alert("Error", result.error ?? "Could not submit complaint.");
      return;
    }

    setModalVisible(false);
    Alert.alert("Submitted", "Your complaint has been sent to the LGU team.");
    if (result.complaint) {
      setComplaints((prev) => [result.complaint!, ...prev]);
    } else {
      await load();
    }
  }

  return (
    <View style={styles.screen}>
      <AppHeader />
      <View style={styles.body}>
        <Pressable style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Ionicons name="add-circle-outline" size={22} color={colors.white} />
          <Text style={styles.addBtnText}>Add New Complaint</Text>
        </Pressable>

        <Text style={styles.sectionTitle}>My Complaints</Text>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : (
          <FlatList
            data={complaints}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
              />
            }
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <Text style={styles.empty}>
                You have not filed any complaints yet.
              </Text>
            }
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.code}>{item.complaintCode}</Text>
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: `${statusColors[item.status as keyof typeof statusColors] ?? colors.textMuted}22` },
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        { color: statusColors[item.status as keyof typeof statusColors] ?? colors.textMuted },
                      ]}
                    >
                      {item.statusLabel}
                    </Text>
                  </View>
                </View>
                <Text style={styles.issue} numberOfLines={3}>
                  {item.issue}
                </Text>
                <Text style={styles.meta}>
                  {item.barangay} · {item.dateLabel} at {item.timeLabel}
                </Text>
              </View>
            )}
          />
        )}
      </View>

      <ComplaintFormModal
        visible={modalVisible}
        loading={submitting}
        onClose={() => setModalVisible(false)}
        onSubmit={handleSubmit}
      />
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  body: { flex: 1, padding: spacing.md },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  addBtnText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: fontSize.md,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  loader: { marginTop: spacing.xl },
  list: { paddingBottom: spacing.xl, gap: spacing.sm },
  empty: {
    textAlign: "center",
    color: colors.textMuted,
    paddingVertical: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  code: {
    fontWeight: "800",
    color: colors.text,
    fontSize: fontSize.sm,
  },
  badge: {
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: "700",
  },
  issue: {
    color: colors.text,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  meta: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  });
}
