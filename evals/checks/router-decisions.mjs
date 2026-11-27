import path from "node:path";
import { fail, pass, readText } from "../lib/fs.mjs";
import { CASES, route } from "../lib/router.mjs";

export const id = "router-decisions";
export const title = "Router decisions for web, repo, Expo, API and Figma";

export function run(ctx) {
  const skill = readText(path.join(ctx.root, "skills", "ask-desigma", "SKILL.md"));
  const prototype = readText(path.join(ctx.root, "skills", "prototype", "SKILL.md"));
  const figma = readText(path.join(ctx.root, "skills", "figma-sync", "SKILL.md"));
  const quickstart = readText(path.join(ctx.root, "docs", "quickstart.md"));
  const decided = [];

  for (const item of CASES) {
    const got = route(item.brief);
    if (got.skill !== item.skill || got.next !== item.next || got.humanGate !== item.humanGate) {
      return fail(`router mismatch for ${item.id}`, { expected: item, got });
    }
    if (!got.uiOnlyRemainsDefault) {
      return fail(`${item.id} must keep UI-only as the default`);
    }
    for (const phrase of item.skillMustContain) {
      if (!skill.includes(phrase)) {
        return fail(`ask-desigma is missing the phrase for ${item.id}`, { phrase });
      }
    }
    if (!quickstart.includes(item.skill)) {
      return fail(`quickstart does not name ${item.skill}`);
    }
    decided.push({ id: item.id, skill: got.skill, next: got.next, humanGate: got.humanGate });
  }

  const web = route(CASES.find((item) => item.id === "web-new").brief);
  if (web.skill === "scaffold-web") {
    return fail("a new web brief with an open look must stop at prototype for a human promote");
  }
  if (!prototype.includes("explicit") || !prototype.includes("promote")) {
    return fail("prototype must wait for an explicit promote");
  }
  if (!figma.includes("fileKey") || !/Do not publish/i.test(figma)) {
    return fail("figma-sync must keep live query and publish behind a real file and an explicit ask");
  }
  if (!/não force backend/.test(skill)) {
    return fail("ask-desigma must keep the API path opt-in");
  }

  return pass("5 router decisions", { decided });
}
