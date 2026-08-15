import { Ionicons } from "@expo/vector-icons";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { colors, fontSize, radius, spacing } from "@/constants/theme";

type Props = TextInputProps & {
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
};

export default function AppInput({
  label,
  icon,
  rightIcon,
  onRightIconPress,
  style,
  ...props
}: Props) {
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.inputWrap}>
        {icon ? (
          <Ionicons
            name={icon}
            size={18}
            color={colors.textMuted}
            style={styles.leftIcon}
          />
        ) : null}
        <TextInput
          placeholderTextColor={colors.textMuted}
          style={[styles.input, icon && styles.inputWithIcon, style]}
          {...props}
        />
        {rightIcon ? (
          <Pressable onPress={onRightIconPress} style={styles.rightIcon}>
            <Ionicons name={rightIcon} size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.text,
  },
  inputWrap: {
    position: "relative",
    justifyContent: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#f9fafb",
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: fontSize.md,
    color: colors.text,
  },
  inputWithIcon: {
    paddingLeft: 42,
  },
  leftIcon: {
    position: "absolute",
    left: 14,
    zIndex: 1,
  },
  rightIcon: {
    position: "absolute",
    right: 14,
    padding: 4,
  },
});
