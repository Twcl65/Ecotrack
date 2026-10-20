import { useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from "react-native";
import { useTheme } from "@/context/ThemeContext";
import { fontSize, radius, type ThemeColors } from "@/constants/theme";

type Props = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "outline" | "ghost" | "danger";
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

export default function AppButton({
  label,
  onPress,
  variant = "primary",
  loading,
  disabled,
  style,
  textStyle,
}: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isPrimary = variant === "primary";
  const isOutline = variant === "outline";
  const isDanger = variant === "danger";

  return (
    <Pressable
      onPress={onPress}
      disabled={loading || disabled}
      style={({ pressed }) => [
        styles.base,
        isPrimary && styles.primary,
        isOutline && styles.outline,
        isDanger && styles.danger,
        variant === "ghost" && styles.ghost,
        pressed && !disabled && !loading && styles.pressed,
        (loading || disabled) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={isOutline || variant === "ghost" ? colors.primary : colors.white}
        />
      ) : (
        <Text
          style={[
            styles.label,
            (isPrimary || isDanger) && styles.labelLight,
            (isOutline || variant === "ghost") && styles.labelPrimary,
            textStyle,
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    base: {
      borderRadius: radius.md,
      paddingVertical: 14,
      paddingHorizontal: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    primary: {
      backgroundColor: colors.primary,
    },
    outline: {
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: colors.primary,
    },
    danger: {
      backgroundColor: colors.danger,
    },
    ghost: {
      backgroundColor: "transparent",
    },
    pressed: {
      opacity: 0.9,
    },
    disabled: {
      opacity: 0.6,
    },
    label: {
      fontSize: fontSize.md,
      fontWeight: "700",
    },
    labelLight: {
      color: colors.white,
    },
    labelPrimary: {
      color: colors.primary,
    },
  });
}
