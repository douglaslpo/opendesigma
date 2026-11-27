// Code Connect template stub — OpenDesigma web-seed Button.
// Replace the url below with a real Figma component link before publish.
// url=REPLACE_WITH_FIGMA_URL
// source=components/ui/button.tsx
// component=Button
//
// Docs: ../../docs/figma-code-connect.md  ·  Skill: skills/figma-sync
// Registry: code-connect/registry.json
//
// This file is a stub for agents and for `npx figma connect publish` once a
// Figma file exists. It is not executed by Next.js.

import figma from "figma";

const instance = figma.selectedInstance;
const label = instance.getString("Label");
const disabled = instance.getBoolean("Disabled");
const variant = instance.getEnum("Variant", {
  Primary: "primary",
  Ghost: "ghost",
});

export default {
  id: "button",
  imports: ['import { Button } from "@/components/ui"'],
  example: figma.code`<Button variant={${variant}} disabled={${disabled}}>${label}</Button>`,
  metadata: {
    nestable: true,
  },
};
