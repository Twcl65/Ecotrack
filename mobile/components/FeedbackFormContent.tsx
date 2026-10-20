import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
  fetchUserFeedback,
  FEEDBACK_CATEGORIES,
  submitFeedback,
  type FeedbackCategory,
  type UserFeedback,
} from "@/lib/data/feedback";
import { fontSize, radius, spacing, type ThemeColors } from "@/constants/theme";

export default function FeedbackFormContent() {
  const { profile } = useAuth();
  const profileId = profile?.id;
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [category, setCategory] = useState<FeedbackCategory>("Collection Service");
  const [description, setDescription] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState<UserFeedback[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const showHistoryLoader = Boolean(profileId) && historyLoading;

  useEffect(() => {
    if (!profileId) return;
    let active = true;
    void fetchUserFeedback(profileId)
      .then((items) => {
        if (!active) return;
        setHistory(items);
        setFormVisible(items.length === 0);
      })
      .catch((error: unknown) => {
        if (active) {
          setHistoryError(
            error instanceof Error ? error.message : "Could not load feedback history."
          );
        }
      })
      .finally(() => {
        if (active) setHistoryLoading(false);
      });
    return () => {
      active = false;
    };
  }, [profileId, historyRefresh]);

  function retryHistory() {
    if (!profileId) return;
    setHistoryLoading(true);
    setHistoryError(null);
    setHistoryRefresh((value) => value + 1);
  }

  async function handleSubmit() {
    const message = description.trim();
    if (!message) {
      Alert.alert("Feedback required", "Please tell us about your experience.");
      return;
    }
    if (!profile?.id || !profile.role) {
      Alert.alert("Sign in required", "Sign in to submit feedback.");
      return;
    }

    setSubmitting(true);
    try {
      const error = await submitFeedback({
        userId: profile.id,
        userName: profile.fullName,
        userRole: profile.role,
        category,
        message,
        rating,
      });
      if (error) {
        Alert.alert("Could not send feedback", error);
        return;
      }

      setDescription("");
      setRating(null);
      setCategory("Collection Service");
      setFormVisible(false);
      setHistoryLoading(true);
      setHistoryRefresh((value) => value + 1);
      Alert.alert("Thank you!", "Your feedback has been sent to the ECOTRACK team.");
    } catch (error) {
      Alert.alert(
        "Could not send feedback",
        error instanceof Error ? error.message : "Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.screen}>
      <AppHeader title="Send Feedback" showBack showBell={false} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.heading}>
          <Ionicons name="chatbox-ellipses-outline" size={26} color={colors.primary} />
          <View style={styles.headingText}>
            <Text style={styles.title}>Send Feedback</Text>
            <Text style={styles.subtitle}>Help us improve ECOTRACK!</Text>
          </View>
        </View>

        {historyError && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{historyError}</Text>
            <Pressable onPress={retryHistory} accessibilityRole="button">
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        )}

        {showHistoryLoader ? (
          <ActivityIndicator color={colors.primary} style={styles.historyLoader} />
        ) : (
          <>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: formVisible }}
              onPress={() => setFormVisible((visible) => !visible)}
              style={styles.openFormButton}
            >
              <Ionicons
                name={formVisible ? "close-circle-outline" : "add-circle-outline"}
                size={20}
                color={colors.white}
              />
              <Text style={styles.openFormText}>
                {formVisible ? "Cancel Feedback" : "Send Feedback"}
              </Text>
            </Pressable>

            {formVisible && (
              <View style={styles.formCard}>
                <Text style={styles.label}>Feedback Category</Text>
                <View style={styles.categoryList}>
                  {FEEDBACK_CATEGORIES.map((item) => {
                    const selected = category === item;
                    return (
                      <Pressable
                        key={item}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: selected }}
                        onPress={() => setCategory(item)}
                        style={[styles.categoryOption, selected && styles.categorySelected]}
                      >
                        <Ionicons
                          name={selected ? "radio-button-on" : "radio-button-off"}
                          size={19}
                          color={selected ? colors.primary : colors.textMuted}
                        />
                        <Text style={[styles.categoryText, selected && styles.categorySelectedText]}>
                          {item}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Text style={styles.label}>Your Feedback</Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Tell us about your experience..."
                  placeholderTextColor={colors.textMuted}
                  style={styles.textarea}
                  multiline
                  textAlignVertical="top"
                  maxLength={2000}
                />
                <Text style={styles.characterCount}>{description.length}/2000</Text>

                <Text style={styles.label}>Rating (Optional)</Text>
                <View style={styles.ratingRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Pressable
                      key={star}
                      accessibilityRole="button"
                      accessibilityLabel={`${star} star${star === 1 ? "" : "s"}`}
                      accessibilityState={{ selected: rating === star }}
                      onPress={() => setRating(rating === star ? null : star)}
                      hitSlop={6}
                    >
                      <Ionicons
                        name={rating !== null && star <= rating ? "star" : "star-outline"}
                        size={34}
                        color={rating !== null && star <= rating ? "#f5b301" : colors.textMuted}
                      />
                    </Pressable>
                  ))}
                </View>
                <Text style={styles.ratingHint}>
                  {rating === null ? "Tap a star to rate your experience" : `${rating} out of 5 stars`}
                </Text>

                <Pressable
                  accessibilityRole="button"
                  onPress={() => void handleSubmit()}
                  disabled={submitting || !description.trim()}
                  style={[styles.submitButton, (submitting || !description.trim()) && styles.disabled]}
                >
                  {submitting ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <>
                      <Ionicons name="send-outline" size={18} color={colors.white} />
                      <Text style={styles.submitText}>Submit Feedback</Text>
                    </>
                  )}
                </Pressable>
              </View>
            )}

            <View style={styles.historySection}>
              <Text style={styles.historyTitle}>Your Sent Feedback</Text>
              {history.length === 0 ? (
                <Text style={styles.historyEmpty}>You have not sent feedback yet.</Text>
              ) : (
                history.map((item) => (
                  <View key={item.id} style={styles.historyCard}>
                    <View style={styles.historyHeader}>
                      <Text style={styles.historyCategory}>{item.category}</Text>
                      <Text style={styles.historyDate}>
                        {new Date(item.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text style={styles.historyMessage}>{item.message}</Text>
                    {item.rating !== null && (
                      <View style={styles.historyRating}>
                        {Array.from({ length: 5 }, (_, index) => (
                          <Ionicons
                            key={index}
                            name={index < item.rating! ? "star" : "star-outline"}
                            size={16}
                            color={index < item.rating! ? "#f5b301" : colors.textMuted}
                          />
                        ))}
                      </View>
                    )}
                    <Text style={styles.historyStatus}>
                      {item.status === "reviewed" ? "Reviewed by ECOTRACK" : "Received"}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md, paddingBottom: spacing.xl, gap: spacing.sm },
    formCard: {
      padding: spacing.md,
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
    },
    openFormButton: {
      minHeight: 48,
      borderRadius: radius.md,
      backgroundColor: colors.primary,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
    },
    openFormText: { color: colors.white, fontWeight: "800", fontSize: fontSize.md },
    historyLoader: { marginVertical: spacing.lg },
    errorBox: {
      padding: spacing.md,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.danger,
      gap: spacing.sm,
    },
    errorText: { color: colors.danger, fontSize: fontSize.sm },
    retryText: { color: colors.primary, fontWeight: "700", fontSize: fontSize.sm },
    historySection: { gap: spacing.sm, marginTop: spacing.md },
    historyTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: "800" },
    historyEmpty: {
      padding: spacing.md,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      color: colors.textMuted,
      fontSize: fontSize.sm,
    },
    historyCard: {
      padding: spacing.md,
      gap: spacing.sm,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    historyHeader: { flexDirection: "row", justifyContent: "space-between", gap: spacing.sm },
    historyCategory: { color: colors.primary, fontSize: fontSize.sm, fontWeight: "800" },
    historyDate: { color: colors.textMuted, fontSize: fontSize.xs },
    historyMessage: { color: colors.text, fontSize: fontSize.sm, lineHeight: 20 },
    historyRating: { flexDirection: "row", gap: 2 },
    historyStatus: { color: colors.textMuted, fontSize: fontSize.xs },
    heading: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    headingText: { gap: 2 },
    title: { fontSize: fontSize.lg, fontWeight: "800", color: colors.text },
    subtitle: { fontSize: fontSize.sm, color: colors.textMuted },
    label: {
      marginTop: spacing.sm,
      color: colors.text,
      fontWeight: "700",
      fontSize: fontSize.sm,
    },
    categoryList: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    categoryOption: {
      minHeight: 48,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    categorySelected: { backgroundColor: colors.primaryLight },
    categoryText: { color: colors.text, fontSize: fontSize.sm },
    categorySelectedText: { color: colors.primary, fontWeight: "700" },
    textarea: {
      minHeight: 140,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      padding: spacing.md,
      color: colors.text,
      fontSize: fontSize.md,
    },
    characterCount: {
      alignSelf: "flex-end",
      color: colors.textMuted,
      fontSize: fontSize.xs,
    },
    ratingRow: { flexDirection: "row", gap: spacing.sm, paddingVertical: spacing.xs },
    ratingHint: { color: colors.textMuted, fontSize: fontSize.xs },
    submitButton: {
      minHeight: 48,
      marginTop: spacing.lg,
      borderRadius: radius.md,
      backgroundColor: colors.primary,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
    },
    submitText: { color: colors.white, fontWeight: "800", fontSize: fontSize.md },
    disabled: { opacity: 0.55 },
  });
}
