import type { ReactNode } from "react";
import { View, type StyleProp, type ViewProps, type ViewStyle } from "react-native";
import { space, type SpaceKey } from "../../tokens";

export type StackProps = ViewProps & {
  gap?: SpaceKey;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * Vertical rhythm helper keyed to the DESIGN.md spacing scale.
 */
export function Stack({ gap = 4, children, style, ...rest }: StackProps) {
  return (
    <View style={[{ flexDirection: "column", gap: space[gap] }, style]} {...rest}>
      {children}
    </View>
  );
}
