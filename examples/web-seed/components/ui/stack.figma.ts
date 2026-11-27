// Code Connect template stub — OpenDesigma web-seed Stack.
// url=REPLACE_WITH_FIGMA_URL
// source=components/ui/stack.tsx
// component=Stack
//
// Docs: ../../docs/figma-code-connect.md  ·  Skill: skills/figma-sync

import figma from "figma";

const instance = figma.selectedInstance;
const gap = instance.getEnum("Gap", {
  "1": "1",
  "2": "2",
  "3": "3",
  "4": "4",
  "6": "6",
  "8": "8",
  "12": "12",
  "16": "16",
});

export default {
  id: "stack",
  imports: ['import { Stack } from "@/components/ui"'],
  example: figma.code`<Stack gap={${gap}}>{/* children */}</Stack>`,
  metadata: {
    nestable: true,
  },
};
