import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import AppButton from "@/components/AppButton";
import AppHeader from "@/components/AppHeader";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { fontSize, radius, spacing, type ThemeColors } from "@/constants/theme";
import {
  fetchAssignedVehicle,
  fetchDriverVehicleMaintenanceRequests,
  submitVehicleMaintenanceRequest,
  VEHICLE_MAINTENANCE_REQUEST_TYPES,
  type DriverVehicle,
  type DriverVehicleMaintenanceRequest,
} from "@/lib/data/vehicles";

function formatDate(value: string | null) {
  if (!value) return "Not scheduled";
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function DriverVehicleScreen() {
  const { profile } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [vehicle, setVehicle] = useState<DriverVehicle | null>(null);
  const [requests, setRequests] = useState<DriverVehicleMaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [requestType, setRequestType] =
    useState<(typeof VEHICLE_MAINTENANCE_REQUEST_TYPES)[number]>(
      VEHICLE_MAINTENANCE_REQUEST_TYPES[0]
    );
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!profile?.id || !profile.fullName) {
      setVehicle(null);
      setRequests([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const assigned = await fetchAssignedVehicle(profile.fullName);
      setVehicle(assigned);
      setRequests(
        assigned
          ? await fetchDriverVehicleMaintenanceRequests(assigned.id, profile.id)
          : []
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load vehicle information."
      );
    } finally {
      setLoading(false);
    }
  }, [profile?.fullName, profile?.id]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const activeRequest = requests.find((request) =>
    ["pending", "approved", "in_progress"].includes(request.status)
  );

  async function sendRequest() {
    if (!vehicle) return;
    setSaving(true);
    setError("");
    const requestError = await submitVehicleMaintenanceRequest({
      vehicleId: vehicle.id,
      requestType,
      description,
    });
    setSaving(false);
    if (requestError) {
      setError(requestError);
      return;
    }
    setDescription("");
    setModalOpen(false);
    await load();
  }

  return (
    <View style={styles.screen}>
      <AppHeader title="Manage Vehicle" showBack module="driver" />
      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : vehicle ? (
          <>
            <View style={styles.vehicleCard}>
              <View style={styles.vehicleHeading}>
                <View style={styles.vehicleIcon}>
                  <Ionicons name="bus" size={25} color={colors.primary} />
                </View>
                <View style={styles.vehicleTitle}>
                  <Text style={styles.vehicleCode}>{vehicle.vehicleCode}</Text>
                  <Text style={styles.vehicleModel}>
                    {vehicle.plateNumber} · {vehicle.vehicleType}
                  </Text>
                  <Text style={styles.vehicleModel}>{vehicle.model}</Text>
                </View>
              </View>
              <View style={styles.odometerCard}>
                <Text style={styles.label}>Current odometer</Text>
                <Text style={styles.odometerValue}>
                  {vehicle.currentOdometerKm.toLocaleString(undefined, {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  })}{" "}
                  <Text style={styles.km}>km</Text>
                </Text>
                <Text style={styles.helper}>
                  Updated after completed collections using accepted GPS readings.
                </Text>
              </View>
              <View style={styles.maintenanceSection}>
                <Text style={styles.sectionTitle}>Maintenance</Text>
                <InfoRow
                  label="Last service"
                  value={`${formatDate(vehicle.lastMaintenanceDate)}${
                    vehicle.lastMaintenanceOdometerKm === null
                      ? ""
                      : ` · ${vehicle.lastMaintenanceOdometerKm.toLocaleString()} km`
                  }`}
                  styles={styles}
                />
                <InfoRow
                  label="Next service"
                  value={`${vehicle.maintenanceType ?? "Service"} · ${formatDate(
                    vehicle.nextMaintenanceDate
                  )}${
                    vehicle.nextMaintenanceOdometerKm === null
                      ? ""
                      : ` · ${vehicle.nextMaintenanceOdometerKm.toLocaleString()} km`
                  }`}
                  styles={styles}
                />
              </View>
            </View>

            {activeRequest ? (
              <View style={styles.notice}>
                <Ionicons name="time-outline" size={19} color={colors.warning} />
                <Text style={styles.noticeText}>
                  You already have a {activeRequest.status.replace("_", " ")} maintenance request.
                </Text>
              </View>
            ) : (
              <AppButton
                label="Request Maintenance"
                onPress={() => setModalOpen(true)}
                variant="primary"
              />
            )}

            <View style={styles.requestList}>
              <Text style={styles.sectionTitle}>Maintenance Requests</Text>
              {requests.length ? (
                requests.map((request) => (
                  <View key={request.id} style={styles.requestCard}>
                    <View style={styles.requestTop}>
                      <Text style={styles.requestType}>{request.requestType}</Text>
                      <Text style={styles.requestStatus}>
                        {request.status.replace("_", " ")}
                      </Text>
                    </View>
                    <Text style={styles.requestDescription}>{request.description}</Text>
                    <Text style={styles.requestDate}>
                      {formatDate(request.requestedAt.slice(0, 10))}
                    </Text>
                    {request.scheduledMaintenanceDate ? (
                      <Text style={styles.adminNote}>
                        Scheduled maintenance:{" "}
                        {formatDate(request.scheduledMaintenanceDate)}
                      </Text>
                    ) : null}
                    {request.adminNote ? (
                      <Text style={styles.adminNote}>
                        Admin: {request.adminNote}
                      </Text>
                    ) : null}
                  </View>
                ))
              ) : (
                <Text style={styles.helper}>No maintenance requests yet.</Text>
              )}
            </View>
          </>
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons name="bus-outline" size={32} color={colors.textMuted} />
            <Text style={styles.sectionTitle}>No vehicle assigned</Text>
            <Text style={styles.helper}>
              Ask an administrator to assign an active vehicle to your driver account.
            </Text>
          </View>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      <Modal
        visible={modalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modal}>
            <Text style={styles.sectionTitle}>Request vehicle maintenance</Text>
            <Text style={styles.label}>Request type</Text>
            <View style={styles.typeList}>
              {VEHICLE_MAINTENANCE_REQUEST_TYPES.map((type) => (
                <Pressable
                  key={type}
                  onPress={() => setRequestType(type)}
                  style={[
                    styles.typeOption,
                    requestType === type && styles.typeOptionSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.typeOptionText,
                      requestType === type && styles.typeOptionTextSelected,
                    ]}
                  >
                    {type}
                  </Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              multiline
              maxLength={2000}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe the issue or service needed"
              placeholderTextColor={colors.textMuted}
              style={styles.description}
              textAlignVertical="top"
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <AppButton
              label="Send Request"
              onPress={() => void sendRequest()}
              loading={saving}
              disabled={!description.trim()}
            />
            <AppButton
              label="Cancel"
              onPress={() => setModalOpen(false)}
              variant="ghost"
              disabled={saving}
            />
          </View>
        </View>
      </Modal>
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
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
    vehicleCard: {
      padding: spacing.md,
      gap: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    vehicleHeading: { flexDirection: "row", alignItems: "center", gap: spacing.md },
    vehicleIcon: {
      width: 52,
      height: 52,
      borderRadius: radius.md,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primaryLight,
    },
    vehicleTitle: { flex: 1, gap: 2 },
    vehicleCode: { color: colors.text, fontSize: fontSize.lg, fontWeight: "800" },
    vehicleModel: { color: colors.textMuted, fontSize: fontSize.sm },
    odometerCard: {
      padding: spacing.md,
      borderRadius: radius.md,
      backgroundColor: colors.background,
      gap: spacing.xs,
    },
    label: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: "600" },
    odometerValue: { color: colors.text, fontSize: fontSize.xxl, fontWeight: "800" },
    km: { color: colors.textMuted, fontSize: fontSize.md, fontWeight: "600" },
    helper: { color: colors.textMuted, fontSize: fontSize.sm, lineHeight: 19 },
    maintenanceSection: { gap: spacing.sm },
    sectionTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: "800" },
    infoRow: {
      gap: 3,
      paddingVertical: spacing.xs,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    infoValue: { color: colors.text, fontSize: fontSize.sm, fontWeight: "600" },
    notice: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    noticeText: { flex: 1, color: colors.text, fontSize: fontSize.sm },
    requestList: { gap: spacing.sm },
    requestCard: {
      gap: spacing.xs,
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    requestTop: { flexDirection: "row", justifyContent: "space-between", gap: spacing.sm },
    requestType: { color: colors.text, fontSize: fontSize.sm, fontWeight: "700" },
    requestStatus: {
      color: colors.primary,
      fontSize: fontSize.xs,
      fontWeight: "800",
      textTransform: "capitalize",
    },
    requestDescription: { color: colors.text, fontSize: fontSize.sm, lineHeight: 19 },
    requestDate: { color: colors.textMuted, fontSize: fontSize.xs },
    adminNote: { color: colors.primary, fontSize: fontSize.sm },
    emptyCard: {
      alignItems: "center",
      gap: spacing.sm,
      padding: spacing.lg,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    error: { color: colors.danger, fontSize: fontSize.sm },
    modalBackdrop: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "#0008",
    },
    modal: {
      gap: spacing.md,
      padding: spacing.lg,
      paddingBottom: spacing.xl,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      backgroundColor: colors.surface,
    },
    typeList: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
    typeOption: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: colors.border,
    },
    typeOptionSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryLight,
    },
    typeOptionText: { color: colors.textMuted, fontSize: fontSize.xs },
    typeOptionTextSelected: { color: colors.primary, fontWeight: "700" },
    description: {
      minHeight: 110,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: spacing.md,
      color: colors.text,
      backgroundColor: colors.background,
      fontSize: fontSize.md,
    },
  });
}
