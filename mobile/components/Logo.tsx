import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";
import { colors, fontSize } from "@/constants/theme";

type Props = {
  variant?: "light" | "dark";
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
};

function LogoMark({
  size = "md",
  onPrimary = false,
}: {
  size?: "sm" | "md" | "lg";
  onPrimary?: boolean;
}) {
  const dim = size === "sm" ? 34 : size === "lg" ? 64 : 40;
  const iconSize = size === "sm" ? 18 : size === "lg" ? 32 : 22;

  if (onPrimary) {
    return (
      <View
        style={[
          styles.mark,
          { width: dim, height: dim, borderRadius: dim / 2, backgroundColor: colors.white },
        ]}
      >
        <Ionicons name="leaf" size={iconSize} color={colors.primary} />
      </View>
    );
  }

  return (
    <LinearGradient
      colors={[colors.primary, colors.primaryDark]}
      style={[styles.mark, { width: dim, height: dim, borderRadius: dim / 2 }]}
    >
      <Ionicons name="leaf" size={iconSize} color={colors.white} />
    </LinearGradient>
  );
}

export default function Logo({
  variant = "dark",
  size = "md",
  showTagline = true,
}: Props) {
  const isLight = variant === "light";
  const titleSize =
    size === "sm" ? fontSize.md : size === "lg" ? fontSize.xxl + 4 : fontSize.lg;

  return (
    <View style={[styles.row, size === "lg" && styles.rowLg]}>
      <LogoMark size={size} onPrimary={isLight} />
      <View>
        <Text
          style={[
            styles.title,
            { fontSize: titleSize, color: isLight ? colors.white : colors.primary },
          ]}
        >
          ECOTRACK
        </Text>
        {showTagline ? (
          <Text
            style={[
              styles.tagline,
              size === "lg" && styles.taglineLg,
              { color: isLight ? "rgba(255,255,255,0.85)" : colors.textMuted },
            ]}
          >
            Cleaner Jasaan, Greener Tomorrow
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export function HeaderLogo() {
  return <Logo variant="light" size="sm" />;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  rowLg: {
    gap: 16,
  },
  mark: {
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: fontSize.xs,
    marginTop: 1,
  },
  taglineLg: {
    fontSize: fontSize.sm,
    marginTop: 4,
  },
});
