import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import AppHeader from "@/components/AppHeader";
import AppSelect from "@/components/AppSelect";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { filterDriverSchedules } from "@/lib/data/driver";
import {
  deleteGarbageMaterial,
  fetchGarbageMaterials,
  fetchGarbageMaterialPriceDefaults,
  fetchSavedGarbageScheduleDates,
  saveGarbageMaterial,
  saveGarbageMaterialPriceDefault,
  saveGarbageCollection,
  type GarbageMaterialEntry,
  type GarbageMaterialUnit,
} from "@/lib/data/garbage";
import { fetchSchedules, type ScheduleItem } from "@/lib/data/schedules";
import { exportGarbageExcel, exportGarbagePdf } from "@/lib/garbageExport";
import { fontSize, radius, spacing, type ThemeColors } from "@/constants/theme";

type MaterialDraft = {
  id: string;
  name: string;
  unit: GarbageMaterialUnit;
  rate: string;
  quantity: string;
};

const INITIAL_MATERIALS: MaterialDraft[] = [
  { id: "cans", name: "Cans", unit: "kg", rate: "", quantity: "" },
  { id: "cardboard", name: "Cardboard Box", unit: "kg", rate: "", quantity: "" },
  { id: "sack", name: "Sack", unit: "piece", rate: "", quantity: "" },
];

function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function formatPrice(value: number) {
  return `₱${value.toFixed(2)}`;
}

function sanitizeNumericInput(value: string) {
  const sanitized = value.replace(/[^0-9.]/g, "");
  const [whole, ...decimals] = sanitized.split(".");
  return decimals.length > 0 ? `${whole}.${decimals.join("")}` : whole;
}

export default function SegregatedCollectionScreen() {
  const router = useRouter();
  const { session, profile } = useAuth();
  const driverName = profile?.fullName;
  const driverId = session?.user.id;
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [materials, setMaterials] = useState(INITIAL_MATERIALS);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [savedScheduleDates, setSavedScheduleDates] = useState<string[]>([]);
  const [defaultPrices, setDefaultPrices] = useState<Record<string, number>>({});
  const [scheduleId, setScheduleId] = useState("");
  const [loadingSchedules, setLoadingSchedules] = useState(true);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const saveInProgress = useRef(false);
  const editedRateIds = useRef(new Set<string>());
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [savingMaterial, setSavingMaterial] = useState(false);
  const [deletingMaterialId, setDeletingMaterialId] = useState<string | null>(
    null
  );
  const [newMaterialName, setNewMaterialName] = useState("");
  const [newMaterialUnit, setNewMaterialUnit] =
    useState<GarbageMaterialUnit>("kg");

  const selectedSchedule = schedules.find((item) => item.id === scheduleId);
  const total = materials.reduce(
    (sum, material) =>
      sum + toNumber(material.rate) * toNumber(material.quantity),
    0
  );

  const loadSchedules = useCallback(async () => {
    try {
      const request = driverName && driverId
        ? Promise.all([
            fetchSchedules(true),
            fetchSavedGarbageScheduleDates(driverId),
            fetchGarbageMaterialPriceDefaults(driverId),
            fetchGarbageMaterials(driverId),
          ]).then(([all, savedDates, defaults, customMaterials]) => ({
            all,
            savedDates,
            defaults,
            customMaterials,
            driverName,
          }))
        : Promise.reject(new Error("Could not load your driver profile."));
      const {
        all,
        savedDates,
        defaults,
        customMaterials,
        driverName: assignedDriver,
      } = await request;
      const defaultPriceMap = Object.fromEntries(
        defaults.map((item) => [item.materialKey, item.rate])
      );
      const savedDateSet = new Set(savedDates);
      const assigned = filterDriverSchedules(all, assignedDriver)
        .filter((schedule) => !savedDateSet.has(schedule.date))
        .sort((a, b) => b.date.localeCompare(a.date));
      setSavedScheduleDates(savedDates);
      setDefaultPrices(defaultPriceMap);
      setMaterials((current) => {
        const existingById = new Map(
          current.map((material) => [material.id, material])
        );
        const builtInMaterials = INITIAL_MATERIALS.map((material) => {
          const existing = existingById.get(material.id);
          const defaultRate =
            defaultPriceMap[getMaterialKey(material.name, material.unit)];
          return {
            ...material,
            rate:
              existing?.rate ||
              (defaultRate === undefined ? "" : String(defaultRate)),
            quantity: existing?.quantity ?? "",
          };
        });
        const savedCustomMaterials = customMaterials.map((material) => {
          const existing = existingById.get(
            getCustomMaterialId(material.materialKey)
          );
          const defaultRate = defaultPriceMap[material.materialKey];
          return {
            id: getCustomMaterialId(material.materialKey),
            name: material.materialName,
            unit: material.unit,
            rate:
              existing?.rate ||
              (defaultRate === undefined ? "" : String(defaultRate)),
            quantity: existing?.quantity ?? "",
          };
        });
        return [...builtInMaterials, ...savedCustomMaterials];
      });
      setSchedules(assigned);
      setScheduleError(null);
      setScheduleId((current) =>
        assigned.some((schedule) => schedule.id === current)
          ? current
          : assigned[0]?.id ?? ""
      );
    } catch (error) {
      setScheduleError(
        error instanceof Error ? error.message : "Could not load schedules."
      );
    } finally {
      setLoadingSchedules(false);
    }
  }, [driverId, driverName]);

  useFocusEffect(
    useCallback(() => {
    void loadSchedules();
    }, [loadSchedules])
  );

  function updateMaterial(
    id: string,
    field: "rate" | "quantity",
    value: string
  ) {
    setMaterials((current) =>
      current.map((material) =>
        material.id === id
          ? { ...material, [field]: sanitizeNumericInput(value) }
          : material
      )
    );
  }

  function getMaterialKey(name: string, unit: GarbageMaterialUnit) {
    return `${name.trim().toLowerCase()}|${unit}`;
  }

  function getCustomMaterialId(materialKey: string) {
    return `custom-${materialKey}`;
  }

  function promptSaveDefaultPrice(material: MaterialDraft, value: string) {
    if (!editedRateIds.current.delete(material.id)) return;
    const rate = toNumber(value);
    if (rate <= 0) return;

    Alert.alert(
      "Save this as default price?",
      `Use ${formatPrice(rate)} as the default rate for ${material.name}?`,
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          onPress: () => {
            void (async () => {
              if (!driverId) {
                Alert.alert(
                  "Sign in required",
                  "Please sign in again to save a default price."
                );
                return;
              }
              try {
                const saved = await saveGarbageMaterialPriceDefault(
                  driverId,
                  material.name,
                  material.unit,
                  rate
                );
                setDefaultPrices((current) => ({
                  ...current,
                  [saved.materialKey]: saved.rate,
                }));
                Alert.alert(
                  "Default price saved",
                  `${material.name} will use ${formatPrice(rate)} as its default rate.`
                );
              } catch (error) {
                Alert.alert(
                  "Could not save default price",
                  error instanceof Error ? error.message : "Please try again."
                );
              }
            })();
          },
        },
      ]
    );
  }

  async function addMaterial() {
    if (savingMaterial) return;
    const name = newMaterialName.trim();
    if (!name) {
      Alert.alert("Material name required", "Enter a name for the material.");
      return;
    }
    if (
      materials.some(
        (material) =>
          getMaterialKey(material.name, material.unit) ===
          getMaterialKey(name, newMaterialUnit)
      )
    ) {
      Alert.alert("Material already exists", "Choose a different material name.");
      return;
    }

    if (!driverId) {
      Alert.alert("Sign in required", "Please sign in again to save a material.");
      return;
    }

    setSavingMaterial(true);
    try {
      const saved = await saveGarbageMaterial(
        driverId,
        name,
        newMaterialUnit
      );
      const defaultRate = defaultPrices[saved.materialKey];
      setMaterials((current) => [
        ...current,
        {
          id: getCustomMaterialId(saved.materialKey),
          name: saved.materialName,
          unit: saved.unit,
          rate: defaultRate === undefined ? "" : String(defaultRate),
          quantity: "",
        },
      ]);
      setNewMaterialName("");
      setNewMaterialUnit("kg");
      setShowAddMaterial(false);
    } catch (error) {
      Alert.alert(
        "Could not save material",
        error instanceof Error ? error.message : "Please try again."
      );
    } finally {
      setSavingMaterial(false);
    }
  }

  async function removeMaterial(material: MaterialDraft) {
    if (!driverId || deletingMaterialId) return;
    setDeletingMaterialId(material.id);
    try {
      await deleteGarbageMaterial(
        driverId,
        material.id.replace(/^custom-/, "")
      );
      setMaterials((current) =>
        current.filter((item) => item.id !== material.id)
      );
    } catch (error) {
      Alert.alert(
        "Could not remove material",
        error instanceof Error ? error.message : "Please try again."
      );
    } finally {
      setDeletingMaterialId(null);
    }
  }

  async function shareExport(
    record: Awaited<ReturnType<typeof saveGarbageCollection>>,
    format: "pdf" | "excel"
  ): Promise<string | null> {
    try {
      if (format === "pdf") await exportGarbagePdf(record);
      else await exportGarbageExcel(record);
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : "Could not export this record.";
    }
  }

  function showSavedConfirmation(exportError?: string | null) {
    Alert.alert(
      "Successfully saved",
      exportError
        ? `Collected garbage was saved successfully, but the export failed: ${exportError}`
        : "Collected garbage was saved successfully and the form has been reset."
    );
  }

  async function finishSave(
    record: Awaited<ReturnType<typeof saveGarbageCollection>>,
    format?: "pdf" | "excel"
  ) {
    const exportError = format ? await shareExport(record, format) : null;
    showSavedConfirmation(exportError);
  }

  function resetEntries() {
    editedRateIds.current.clear();
    setMaterials((current) => current.map((material) => ({
      ...material,
      rate: String(
        defaultPrices[getMaterialKey(material.name, material.unit)] ?? ""
      ),
      quantity: "",
    })));
  }

  function markDateUnavailable(date: string) {
    setSavedScheduleDates((current) =>
      current.includes(date) ? current : [...current, date]
    );
    const remainingSchedules = schedules.filter(
      (schedule) => schedule.date !== date
    );
    setSchedules(remainingSchedules);
    setScheduleId(remainingSchedules[0]?.id ?? "");
  }

  function showDuplicateDateError() {
    Alert.alert(
      "Date already saved",
      "Collected garbage has already been saved for this schedule date. Select another date."
    );
  }

  function getSaveErrorMessage(error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      return null;
    }
    return error instanceof Error ? error.message : "Please try again.";
  }

  async function saveAndExport() {
    if (saveInProgress.current) return;
    if (!session?.user.id) {
      Alert.alert("Sign in required", "Please sign in again to save this record.");
      return;
    }
    if (!selectedSchedule) {
      Alert.alert("Schedule required", "Choose the collection schedule first.");
      return;
    }
    const collectedMaterials: GarbageMaterialEntry[] = materials
      .filter((material) => toNumber(material.quantity) > 0)
      .map((material) => {
        const rate = toNumber(material.rate);
        const quantity = toNumber(material.quantity);
        return {
          id: material.id,
          name: material.name,
          unit: material.unit,
          rate,
          quantity,
          price: rate * quantity,
        };
      });
    if (collectedMaterials.length === 0) {
      Alert.alert(
        "No collected materials",
        "Enter a collected amount for at least one material."
      );
      return;
    }

    saveInProgress.current = true;
    setSaving(true);
    try {
      const record = await saveGarbageCollection({
        scheduleId: selectedSchedule.id,
        scheduleDate: selectedSchedule.date,
        barangay: selectedSchedule.barangay,
        driverId: session.user.id,
        materials: collectedMaterials,
        totalPrice: collectedMaterials.reduce((sum, item) => sum + item.price, 0),
      });
      markDateUnavailable(selectedSchedule.date);
      resetEntries();
      Alert.alert(
        "Collection saved",
        "Your form has been reset. Choose an export format, or select Not now.",
        [
          {
            text: "Not now",
            style: "cancel",
            onPress: () => showSavedConfirmation(),
          },
          {
            text: "Export PDF",
            onPress: () => void finishSave(record, "pdf"),
          },
          {
            text: "Export Excel",
            onPress: () => void finishSave(record, "excel"),
          },
        ]
      );
    } catch (error) {
      const message = getSaveErrorMessage(error);
      if (message === null) {
        showDuplicateDateError();
        void loadSchedules();
      }
      else Alert.alert("Could not save collection", message);
    } finally {
      saveInProgress.current = false;
      setSaving(false);
    }
  }

  return (
    <View style={styles.screen}>
      <AppHeader title="Segregated Garbage Collection" module="driver" />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topActions}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setShowAddMaterial(true)}
            style={styles.addButton}
          >
            <Ionicons name="add-circle-outline" size={19} color={colors.primary} />
            <Text style={styles.addButtonText}>Add material</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/(app)/(driver)/garbage-history" as never)}
            style={styles.historyButton}
          >
            <Ionicons name="time-outline" size={18} color={colors.primary} />
            <Text style={styles.addButtonText}>History</Text>
          </Pressable>
        </View>

        <View style={styles.intro}>
          <Text style={styles.heading}>Collected recyclables</Text>
          <Text style={styles.description}>
            Choose a schedule, enter rates and amounts, then save the collection.
          </Text>
        </View>

        <View style={styles.scheduleCard}>
          {loadingSchedules ? (
            <ActivityIndicator color={colors.primary} />
          ) : scheduleError ? (
            <View style={styles.scheduleError}>
              <Text style={styles.errorText}>{scheduleError}</Text>
              <Pressable
                onPress={() => {
                  setLoadingSchedules(true);
                  void loadSchedules();
                }}
              >
                <Text style={styles.retryText}>Try again</Text>
              </Pressable>
            </View>
          ) : schedules.length === 0 ? (
            <Text style={styles.emptyText}>
              {savedScheduleDates.length > 0
                ? "All assigned schedule dates have already been saved."
                : "No schedules are assigned to you."}
            </Text>
          ) : (
            <AppSelect
              label="Collection schedule"
              options={schedules.map(
                (schedule) => `${schedule.dateLabel} · ${schedule.barangay}`
              )}
              onChange={(value) => {
                const schedule = schedules.find(
                  (item) =>
                    `${item.dateLabel} · ${item.barangay}` === value
                );
                if (schedule) setScheduleId(schedule.id);
              }}
              value={
                selectedSchedule
                  ? `${selectedSchedule.dateLabel} · ${selectedSchedule.barangay}`
                  : ""
              }
            />
          )}
        </View>

        {materials.map((material) => {
          const price = toNumber(material.rate) * toNumber(material.quantity);
          const unitName = material.unit === "piece" ? "piece" : "kg";
          return (
            <View key={material.id} style={styles.materialCard}>
              <View style={styles.cardHeader}>
                <View style={styles.materialInfo}>
                  <Text style={styles.materialName}>{material.name}</Text>
                  <Text style={styles.unit}>
                    {material.unit === "piece" ? "pcs" : "kg"}
                  </Text>
                </View>
                {material.id.startsWith("custom-") ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${material.name}`}
                    disabled={deletingMaterialId !== null}
                    onPress={() => void removeMaterial(material)}
                    hitSlop={8}
                  >
                    {deletingMaterialId === material.id ? (
                      <ActivityIndicator color={colors.primary} size="small" />
                    ) : (
                      <Ionicons
                        name="close-circle-outline"
                        size={20}
                        color={colors.textMuted}
                      />
                    )}
                  </Pressable>
                ) : null}
                <View style={styles.priceBadge}>
                  <Text style={styles.priceLabel}>Price</Text>
                  <Text style={styles.price}>{formatPrice(price)}</Text>
                </View>
              </View>
              <View style={styles.fieldsRow}>
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Rate / {unitName}</Text>
                  <TextInput
                    accessibilityLabel={`${material.name} rate per ${unitName}`}
                    keyboardType="decimal-pad"
                    onChangeText={(value) => {
                      editedRateIds.current.add(material.id);
                      updateMaterial(material.id, "rate", value);
                    }}
                    onEndEditing={({ nativeEvent }) =>
                      promptSaveDefaultPrice(material, nativeEvent.text)
                    }
                    placeholder="0.00"
                    placeholderTextColor={colors.textMuted}
                    style={styles.input}
                    value={material.rate}
                  />
                </View>
                <Text style={styles.multiply}>×</Text>
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>
                    Collected ({material.unit === "piece" ? "pcs" : "kg"})
                  </Text>
                  <TextInput
                    accessibilityLabel={`${material.name} collected`}
                    keyboardType="decimal-pad"
                    onChangeText={(value) =>
                      updateMaterial(material.id, "quantity", value)
                    }
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    style={styles.input}
                    value={material.quantity}
                  />
                </View>
              </View>
            </View>
          );
        })}

        <View style={styles.totalCard}>
          <View>
            <Text style={styles.totalLabel}>Total Price</Text>
            <Text style={styles.totalHint}>All collected materials</Text>
          </View>
          <Text style={styles.totalPrice}>{formatPrice(total)}</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={saving || loadingSchedules || schedules.length === 0}
          onPress={() => void saveAndExport()}
          style={[styles.saveButton, saving && styles.disabledButton]}
        >
          {saving ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Ionicons name="save-outline" size={19} color={colors.white} />
              <Text style={styles.saveButtonText}>
                Export & Save Collected Garbage
              </Text>
            </>
          )}
        </Pressable>
        {saving ? (
          <View
            accessibilityLiveRegion="polite"
            style={styles.savingIndicator}
          >
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.savingText}>Saving collection… Please wait.</Text>
          </View>
        ) : null}
      </ScrollView>

      <Modal
        animationType="fade"
        onRequestClose={() => {
          if (!savingMaterial) setShowAddMaterial(false);
        }}
        transparent
        visible={showAddMaterial}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add a material</Text>
            <Text style={styles.fieldLabel}>Material name</Text>
            <TextInput
              autoCapitalize="words"
              onChangeText={setNewMaterialName}
              placeholder="e.g. Plastic bottles"
              placeholderTextColor={colors.textMuted}
              style={styles.modalInput}
              value={newMaterialName}
            />
            <AppSelect
              label="Measured by"
              options={["Kilogram (kg)", "Piece"]}
              onChange={(value) =>
                setNewMaterialUnit(value === "Piece" ? "piece" : "kg")
              }
              value={newMaterialUnit === "kg" ? "Kilogram (kg)" : "Piece"}
            />
            <View style={styles.modalActions}>
              <Pressable
                disabled={savingMaterial}
                onPress={() => setShowAddMaterial(false)}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                disabled={savingMaterial}
                onPress={() => void addMaterial()}
                style={[
                  styles.modalAddButton,
                  savingMaterial && styles.disabledButton,
                ]}
              >
                {savingMaterial ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.modalAddButtonText}>Add material</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: {
      padding: spacing.md,
      gap: spacing.md,
      paddingBottom: spacing.xl,
    },
    topActions: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    addButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.primary,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    historyButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      borderRadius: radius.md,
      backgroundColor: colors.primaryLight,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    addButtonText: {
      color: colors.primary,
      fontSize: fontSize.sm,
      fontWeight: "700",
    },
    intro: { gap: spacing.xs },
    heading: {
      color: colors.text,
      fontSize: fontSize.lg,
      fontWeight: "800",
    },
    description: {
      color: colors.textMuted,
      fontSize: fontSize.sm,
      lineHeight: 19,
    },
    scheduleCard: {
      gap: spacing.xs,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    scheduleError: { gap: spacing.xs },
    errorText: { color: colors.danger, fontSize: fontSize.sm },
    retryText: { color: colors.primary, fontWeight: "700" },
    emptyText: { color: colors.textMuted, fontSize: fontSize.sm },
    materialCard: {
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: spacing.sm,
    },
    materialInfo: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    priceBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      backgroundColor: colors.primaryLight,
      borderRadius: radius.full,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    materialName: {
      flexShrink: 1,
      color: colors.text,
      fontSize: fontSize.md,
      fontWeight: "700",
    },
    unit: {
      color: colors.textMuted,
      fontSize: fontSize.xs,
      backgroundColor: colors.background,
      overflow: "hidden",
      borderRadius: radius.sm,
      paddingHorizontal: spacing.xs,
      paddingVertical: 2,
    },
    priceLabel: { color: colors.textMuted, fontSize: fontSize.xs },
    price: {
      color: colors.primary,
      fontSize: fontSize.sm,
      fontWeight: "800",
    },
    fieldsRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: spacing.sm,
    },
    field: { flex: 1, gap: spacing.xs },
    fieldLabel: {
      color: colors.textMuted,
      fontSize: fontSize.xs,
      fontWeight: "600",
    },
    multiply: {
      color: colors.textMuted,
      fontSize: fontSize.md,
      fontWeight: "700",
      paddingBottom: 10,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.sm,
      color: colors.text,
      backgroundColor: colors.background,
      fontSize: fontSize.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: 10,
      textAlign: "right",
    },
    totalCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.primary,
      backgroundColor: colors.primaryLight,
      padding: spacing.md,
    },
    totalLabel: {
      color: colors.text,
      fontSize: fontSize.md,
      fontWeight: "800",
    },
    totalHint: {
      color: colors.textMuted,
      fontSize: fontSize.xs,
      marginTop: 2,
    },
    totalPrice: {
      color: colors.primary,
      fontSize: fontSize.xl,
      fontWeight: "800",
    },
    saveButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
      borderRadius: radius.md,
      backgroundColor: colors.primary,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
    },
    saveButtonText: {
      color: colors.white,
      fontSize: fontSize.sm,
      fontWeight: "800",
    },
    savingIndicator: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: spacing.sm,
      paddingVertical: spacing.xs,
    },
    savingText: {
      color: colors.textMuted,
      fontSize: fontSize.sm,
      fontWeight: "600",
    },
    disabledButton: { opacity: 0.6 },
    modalBackdrop: {
      flex: 1,
      justifyContent: "center",
      padding: spacing.lg,
      backgroundColor: "rgba(0,0,0,0.45)",
    },
    modalCard: {
      gap: spacing.sm,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      padding: spacing.lg,
    },
    modalTitle: {
      color: colors.text,
      fontSize: fontSize.lg,
      fontWeight: "800",
      marginBottom: spacing.xs,
    },
    modalInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.sm,
      color: colors.text,
      backgroundColor: colors.background,
      fontSize: fontSize.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    modalActions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    cancelButton: {
      borderRadius: radius.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    cancelButtonText: {
      color: colors.textMuted,
      fontWeight: "700",
    },
    modalAddButton: {
      borderRadius: radius.sm,
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    modalAddButtonText: {
      color: colors.white,
      fontWeight: "700",
    },
  });
}
