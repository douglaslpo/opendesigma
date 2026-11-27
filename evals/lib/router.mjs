/**
 * Deterministic encoding of skills/ask-desigma.
 * First matching rule wins. This is the contract the router-decisions check
 * locks to the skill text; it is not an LLM.
 *
 * @typedef {{ id: string, brief: string, skill: string, next: string | null, humanGate: string | null, skillMustContain: string[] }} RouterCase
 */

/** @type {RouterCase[]} */
export const CASES = [
  {
    id: "web-new",
    brief: "Briefing web novo. Não sei o look. Greenfield, o app ainda não existe.",
    skill: "prototype",
    next: "scaffold-web",
    humanGate: "promote",
    skillMustContain: ["prototype", "scaffold-web", "promote explícito"],
  },
  {
    id: "repo-existing",
    brief: "O repositório Next já existe. A UI funciona mas preciso de review. Sem scaffold novo.",
    skill: "review-ui",
    next: "design-jury",
    humanGate: null,
    skillMustContain: ["review-ui", "codebase que já existe"],
  },
  {
    id: "expo",
    brief: "Cria o app Expo em React Native.",
    skill: "scaffold-mobile",
    next: "mobile-feel",
    humanGate: null,
    skillMustContain: ["scaffold-mobile", "Expo"],
  },
  {
    id: "api-opt-in",
    brief: "Quero stubs de API e health. É opt-in; o default continua só-UI.",
    skill: "scaffold-backend",
    next: null,
    humanGate: null,
    skillMustContain: ["scaffold-backend", "não force backend"],
  },
  {
    id: "figma-linked",
    brief: "O arquivo Figma está vinculado. Code Connect e tokens.",
    skill: "figma-sync",
    next: "break-ui",
    humanGate: "file-and-auth",
    skillMustContain: ["figma-sync", "Code Connect"],
  },
];

/**
 * @param {string} brief
 * @returns {{ skill: string, next: string | null, humanGate: string | null, uiOnlyRemainsDefault: boolean }}
 */
export function route(brief) {
  const text = brief.toLowerCase();
  if (/figma|code connect/.test(text)) {
    return { skill: "figma-sync", next: "break-ui", humanGate: "file-and-auth", uiOnlyRemainsDefault: true };
  }
  if (/expo|react native/.test(text)) {
    return { skill: "scaffold-mobile", next: "mobile-feel", humanGate: null, uiOnlyRemainsDefault: true };
  }
  if (/api|backend|health/.test(text)) {
    return { skill: "scaffold-backend", next: null, humanGate: null, uiOnlyRemainsDefault: true };
  }
  if (/já existe|ja existe|repositório|repositorio|sem scaffold/.test(text)) {
    return { skill: "review-ui", next: "design-jury", humanGate: null, uiOnlyRemainsDefault: true };
  }
  if (/briefing|não sei o look|nao sei o look|greenfield|ainda não existe|ainda nao existe|app web/.test(text)) {
    return { skill: "prototype", next: "scaffold-web", humanGate: "promote", uiOnlyRemainsDefault: true };
  }
  return { skill: "ask-desigma", next: null, humanGate: null, uiOnlyRemainsDefault: true };
}
