import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import {
  initialWindowMetrics,
  SafeAreaProvider,
  SafeAreaView,
} from "react-native-safe-area-context";
import { Button, Stack } from "./components/ui";
import { color, space } from "./tokens";

type ExampleAction = "idle" | "prototype" | "design";

export default function App() {
  const [action, setAction] = useState<ExampleAction>("idle");

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <SafeAreaView style={styles.safe} edges={["top", "right", "bottom", "left"]}>
        <StatusBar style="dark" />
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.hero}>
            <Stack gap={8}>
              <Text style={styles.brand}>OpenDesigma</Text>
              <Stack gap={4}>
                <Text style={styles.headline}>
                  Design system first, then feel it on device.
                </Text>
                <Text style={styles.support}>
                  This seed wires Expo + React Native with the same token grammar
                  as web-seed so agents reuse real UI — not invent another Button.
                </Text>
              </Stack>
              <View style={styles.ctaRow}>
                <Button
                  onPress={() => setAction("prototype")}
                  accessibilityState={{ selected: action === "prototype" }}
                >
                  {action === "prototype" ? "Prototype started" : "Start prototype"}
                </Button>
                <Button
                  variant="ghost"
                  onPress={() => setAction("design")}
                  accessibilityState={{ selected: action === "design" }}
                >
                  Read DESIGN.md
                </Button>
              </View>
              <View accessibilityLiveRegion="polite">
                {action === "prototype" ? (
                  <Text style={styles.status}>
                    Prototype started. This screen runs on device without the API.
                  </Text>
                ) : null}
                {action === "design" ? (
                  <Text style={styles.status}>
                    DESIGN.md: targets at least 44 by 44, safe-area insets, and a
                    press state. Reuse components/ui and tokens.
                  </Text>
                ) : null}
              </View>
            </Stack>
          </View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: color.canvas,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: space[6],
    paddingVertical: space[8],
  },
  hero: {
    maxWidth: 480,
    width: "100%",
    alignSelf: "center",
  },
  brand: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 2.4,
    textTransform: "uppercase",
    color: color.accent,
  },
  headline: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "600",
    letterSpacing: -0.6,
    color: color.ink,
  },
  support: {
    fontSize: 17,
    lineHeight: 26,
    color: color.quiet,
    maxWidth: 360,
  },
  status: {
    fontSize: 16,
    lineHeight: 24,
    color: color.ink,
  },
  ctaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
    gap: space[3],
  },
});
