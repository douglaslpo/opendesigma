/**
 * Phases the harness overlay must map, in order, and the human decision each
 * one preserves. The check reads these phrases back from harness-overlay/README.md.
 */
export const PHASES = [
  {
    phase: "explore",
    skills: ["ask-desigma"],
    human: "Roteia; não promove sozinho",
  },
  {
    phase: "propose",
    skills: ["prototype"],
    human: "Promote exige escolha humana",
  },
  {
    phase: "apply",
    skills: ["pick-stack", "scaffold-web", "scaffold-mobile", "scaffold-backend", "figma-sync"],
    human: "Promote só depois da escolha humana",
  },
  {
    phase: "test",
    skills: ["smoke"],
    human: "Smoke não substitui o veredito humano",
  },
  {
    phase: "verify",
    skills: ["break-ui", "review-ui", "design-jury", "mobile-feel"],
    human: "Correção do `break-ui` exige humano",
  },
  {
    phase: "review",
    skills: ["review-ui", "design-jury"],
    human: "Veredito do jury permanece humano",
  },
  {
    phase: "archive",
    skills: ["ship-preview"],
    human: "Sem merge automático",
  },
];
