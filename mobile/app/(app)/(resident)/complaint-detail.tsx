import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import AppHeader from "@/components/AppHeader";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import {
  fetchComplaintMessages,
  fetchResidentComplaint,
  type ComplaintMessage,
  type UserComplaint,
  sendResidentComplaintMessage,
} from "@/lib/data/complaints";
import { fontSize, radius, spacing, type ThemeColors } from "@/constants/theme";

const STATUS_COLORS: Record<string, string> = {
  pending: "#d97706",
  in_progress: "#2563eb",
  resolved: "#059669",
  declined: "#6b7280",
};

function messageTime(value: string): string {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ResidentComplaintDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useAuth();
  const residentId = profile?.id;
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [complaint, setComplaint] = useState<UserComplaint | null>(null);
  const [messages, setMessages] = useState<ComplaintMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    if (!residentId) return;
    const [record, thread] = await Promise.all([
      fetchResidentComplaint(id, residentId),
      fetchComplaintMessages(id),
    ]);
    setComplaint(record);
    setMessages(thread);
  }, [id, residentId]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void load()
        .catch((error) => {
          Alert.alert(
            "Could not load complaint",
            error instanceof Error ? error.message : "Please try again."
          );
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, [load])
  );

  async function sendMessage() {
    const message = draft.trim();
    if (!message || !complaint || complaint.status === "resolved") return;
    setSending(true);
    const error = await sendResidentComplaintMessage(
      complaint.id,
      message,
      profile?.fullName ?? "Resident"
    );
    setSending(false);
    if (error) {
      Alert.alert("Message not sent", error);
      return;
    }
    setDraft("");
    try {
      await load();
    } catch (loadError) {
      Alert.alert(
        "Message sent",
        loadError instanceof Error
          ? `Your message was sent, but the thread could not refresh: ${loadError.message}`
          : "Your message was sent, but the thread could not refresh."
      );
    }
  }

  return (
    <View style={styles.screen}>
      <AppHeader title="Complaint Details" showBack showBell={false} />
      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : !complaint ? (
        <Text style={styles.empty}>Complaint not found.</Text>
      ) : (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.detailCard}>
              <View style={styles.heading}>
                <View style={styles.flex}>
                  <Text style={styles.code}>{complaint.complaintCode}</Text>
                  <Text style={styles.issue}>{complaint.issue}</Text>
                </View>
                <Text
                  style={[
                    styles.status,
                    { color: STATUS_COLORS[complaint.status] ?? colors.textMuted },
                  ]}
                >
                  {complaint.statusLabel}
                </Text>
              </View>
              <InfoRow label="Barangay" value={complaint.barangay} styles={styles} />
              <InfoRow
                label="Date filed"
                value={`${complaint.dateLabel} at ${complaint.timeLabel}`}
                styles={styles}
              />
              {complaint.attachmentUrl ? (
                <InfoRow label="Attachment" value={complaint.attachmentUrl} styles={styles} />
              ) : null}
            </View>

            <Text style={styles.sectionTitle}>Messages with Admin</Text>
            {messages.length === 0 ? (
              <Text style={styles.emptyThread}>
                Send a message if you want to add information to this complaint.
              </Text>
            ) : (
              messages.map((message) => {
                const isResident = message.senderRole === "resident";
                return (
                  <View
                    key={message.id}
                    style={[
                      styles.messageCard,
                      isResident ? styles.residentMessage : styles.adminMessage,
                    ]}
                  >
                    <Text style={styles.sender}>
                      {isResident ? "You" : message.senderName || "Admin"}
                    </Text>
                    <Text style={styles.messageText}>{message.message}</Text>
                    <Text style={styles.messageTime}>{messageTime(message.createdAt)}</Text>
                  </View>
                );
              })
            )}
          </ScrollView>
          {complaint.status === "resolved" ? (
            <Text style={styles.resolvedNote}>
              This complaint is resolved. Messaging is closed.
            </Text>
          ) : (
            <View style={styles.composer}>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder="Message the admin..."
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                multiline
                maxLength={2000}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Send message"
                onPress={() => void sendMessage()}
                disabled={sending || !draft.trim()}
                style={[styles.sendButton, (!draft.trim() || sending) && styles.disabled]}
              >
                {sending ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Ionicons name="send" size={18} color={colors.white} />
                )}
              </Pressable>
            </View>
          )}
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

function InfoRow({
  label,
  value,
  styles,
}: {
  label: string;
  value: string;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    flex: { flex: 1 },
    loader: { marginTop: spacing.xl },
    content: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.lg },
    detailCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      gap: spacing.md,
    },
    heading: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
    code: { fontSize: fontSize.sm, fontWeight: "800", color: colors.text },
    issue: { marginTop: spacing.xs, color: colors.text, fontSize: fontSize.md, lineHeight: 22 },
    status: { fontSize: fontSize.xs, fontWeight: "800" },
    infoRow: { gap: 2 },
    infoLabel: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: "700" },
    infoValue: { color: colors.text, fontSize: fontSize.sm },
    sectionTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: "800" },
    emptyThread: {
      color: colors.textMuted,
      fontSize: fontSize.sm,
      backgroundColor: colors.surface,
      padding: spacing.md,
      borderRadius: radius.md,
    },
    messageCard: {
      maxWidth: "88%",
      borderRadius: radius.md,
      padding: spacing.md,
      gap: spacing.xs,
    },
    residentMessage: { alignSelf: "flex-end", backgroundColor: colors.primaryLight },
    adminMessage: {
      alignSelf: "flex-start",
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sender: { color: colors.primary, fontSize: fontSize.xs, fontWeight: "800" },
    messageText: { color: colors.text, fontSize: fontSize.sm, lineHeight: 20 },
    messageTime: { color: colors.textMuted, fontSize: 10, alignSelf: "flex-end" },
    composer: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: spacing.sm,
      padding: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.surface,
    },
    input: {
      flex: 1,
      maxHeight: 120,
      minHeight: 44,
      color: colors.text,
      backgroundColor: colors.background,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontSize: fontSize.sm,
    },
    sendButton: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primary,
    },
    disabled: { opacity: 0.5 },
    resolvedNote: {
      color: colors.textMuted,
      textAlign: "center",
      padding: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.surface,
    },
    empty: { textAlign: "center", marginTop: spacing.xl, color: colors.textMuted },
  });
}
