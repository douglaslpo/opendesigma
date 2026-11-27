import path from "node:path";
import { fail, pass, readText } from "../lib/fs.mjs";
import { PHASES } from "../lib/harness-overlay.mjs";

export const id = "harness-overlay";
export const title = "Harness overlay maps SDD phases and keeps human decisions";

export function run(ctx) {
  const readme = readText(path.join(ctx.root, "harness-overlay", "README.md"));
  const rows = [];
  let cursor = 0;

  for (let i = 0; i < PHASES.length; i++) {
    const phase = PHASES[i];
    const marker = `| \`${phase.phase}\``;
    const at = readme.indexOf(marker, cursor);
    if (at < 0) {
      return fail(`overlay is missing the ${phase.phase} row`, { marker });
    }
    const next = PHASES[i + 1];
    const end = next ? readme.indexOf(`| \`${next.phase}\``, at + marker.length) : readme.length;
    const row = readme.slice(at, end < 0 ? readme.length : end);
    for (const skill of phase.skills) {
      if (!row.includes(skill)) {
        return fail(`${phase.phase} row does not name ${skill}`);
      }
    }
    if (!row.includes(phase.human)) {
      return fail(`${phase.phase} row drops the human decision`, { human: phase.human });
    }
    rows.push(phase.phase);
    cursor = at + marker.length;
  }

  if (!/não encadear/i.test(readme) || !/HITL|humano/i.test(readme)) {
    return fail("overlay must keep the autopilot halt on taste nodes");
  }
  if (!/sem merge automático/i.test(readme)) {
    return fail("archive must refuse automatic merge");
  }

  return pass("7 harness phases", { rows });
}
