import type { ReactNode } from "react";
import {
  Pressable,
  Text,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { color, motion, space } from "../../tokens";

type Variant = "primary" | "ghost";

export type ButtonProps = Omit<PressableProps, "children" | "style"> & {
  variant?: Variant;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * Canonical action control (RN). Agents must reuse this instead of inventing
 * another button with one-off hex styles.
 */
export function Button({
  variant = "primary",
  children,
  style,
  disabled,
  ...rest
}: ButtonProps) {
  const isPrimary = variant === "primary";

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        isPrimary ? styles.primary : styles.ghost,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
      {...rest}
    >
      <Text
        style={[styles.label, isPrimary ? styles.labelPrimary : styles.labelGhost]}
      >
        {children}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    minWidth: 44,
    // 20px ≈ web-seed Button px-5 (between space-4 and space-6)
    paddingHorizontal: space[4] + space[1],
    paddingVertical: space[3],
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: {
    backgroundColor: color.accent,
  },
  ghost: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: color.line,
  },
  pressed: {
    opacity: 0.88,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  labelPrimary: {
    color: color.accentInk,
  },
  labelGhost: {
    color: color.ink,
  },
});

// Keep motion token referenced so agents see the DS hook (press timing).
export const BUTTON_PRESS_MS = motion.fastMs;
