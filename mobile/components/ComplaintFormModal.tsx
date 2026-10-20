import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import AppButton from "@/components/AppButton";
import AppSelect from "@/components/AppSelect";
import { useTheme } from "@/context/ThemeContext";
import { fetchBarangayNames } from "@/lib/data/barangays";
import { COMPLAINT_TYPES } from "@/lib/data/complaints";
import { fontSize, radius, spacing, type ThemeColors } from "@/constants/theme";

export type ComplaintFormValues = {
  complaintType: string;
  barangay: string;
  description: string;
};

type Props = {
  visible: boolean;
  loading: boolean;
  onClose: () => void;
  onSubmit: (values: ComplaintFormValues) => void;
};

export default function ComplaintFormModal({
  visible,
  loading,
  onClose,
  onSubmit,
}: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [barangays, setBarangays] = useState<string[]>([]);
  const [barangaysLoading, setBarangaysLoading] = useState(false);
  const [complaintType, setComplaintType] = useState(COMPLAINT_TYPES[0]);
  const [barangay, setBarangay] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!visible) return;

    setComplaintType(COMPLAINT_TYPES[0]);
    setDescription("");
    setBarangay("");
    setBarangaysLoading(true);

    fetchBarangayNames()
      .then((names) => {
        setBarangays(names);
        setBarangay(names[0] ?? "");
      })
      .finally(() => setBarangaysLoading(false));
  }, [visible]);

  function handleSubmit() {
    onSubmit({ complaintType, barangay, description });
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.sheetWrap}
        >
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Submit Complaint</Text>
              <Pressable onPress={onClose} hitSlop={8}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </Pressable>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.form}>
              <AppSelect
                label="Complaint Type"
                value={complaintType}
                options={[...COMPLAINT_TYPES]}
                onChange={setComplaintType}
              />

              {barangaysLoading ? (
                <View style={styles.loadingField}>
                  <Text style={styles.label}>Location</Text>
                  <View style={styles.loadingBox}>
                    <ActivityIndicator color={colors.primary} size="small" />
                    <Text style={styles.loadingText}>Loading barangays...</Text>
                  </View>
                </View>
              ) : (
                <AppSelect
                  label="Location"
                  value={barangay}
                  options={barangays}
                  placeholder="Select barangay"
                  onChange={setBarangay}
                />
              )}

              <View style={styles.field}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={styles.textarea}
                  multiline
                  numberOfLines={5}
                  placeholder="Enter your complaint here..."
                  placeholderTextColor={colors.textMuted}
                  value={description}
                  onChangeText={setDescription}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.upload}>
                <Ionicons name="camera-outline" size={22} color={colors.primary} />
                <Text style={styles.uploadText}>Upload Photo (Optional)</Text>
              </View>

              <AppButton
                label="Submit Complaint"
                onPress={handleSubmit}
                loading={loading}
                disabled={!barangay || barangaysLoading}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheetWrap: { maxHeight: "92%" },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingBottom: spacing.lg,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sheetTitle: {
    fontSize: fontSize.lg,
    fontWeight: "800",
    color: colors.text,
  },
  form: {
    padding: spacing.md,
    gap: spacing.md,
  },
  field: { gap: spacing.sm },
  loadingField: { gap: spacing.sm },
  label: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.text,
  },
  loadingBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: fontSize.md,
  },
  textarea: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
  },
  upload: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    backgroundColor: colors.background,
  },
  uploadText: {
    color: colors.primary,
    fontWeight: "600",
  },
  });
}
