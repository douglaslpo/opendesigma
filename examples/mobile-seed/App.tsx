import { StatusBar } from "expo-status-bar";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Button, Stack } from "./components/ui";
import { color, space } from "./tokens";

export default function App() {
  return (
    <SafeAreaView style={styles.safe}>
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
              <Button onPress={() => {}}>Start prototype</Button>
              <Button variant="ghost" onPress={() => {}}>
                Read DESIGN.md
              </Button>
            </View>
          </Stack>
        </View>
      </ScrollView>
    </SafeAreaView>
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
    paddingVertical: space[12],
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
  ctaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space[3],
  },
});
