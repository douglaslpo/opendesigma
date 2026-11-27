#!/usr/bin/env node
/**
 * Print executed / passed / failed / skipped counts and the SHA.
 * Appends the same text to GITHUB_STEP_SUMMARY when that file is set.
 *
 * Usage: node evals/report-summary.mjs <report.json>
 */
import fs from "node:fs";

const file = process.argv[2];
const title = process.env.OD_REPORT_TITLE || "Evals";
const fallbackSha = process.env.GITHUB_SHA || "n/d";

function emit(text) {
  console.log(text);
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${text}\n`);
  }
}

if (!file) {
  console.error("usage: node evals/report-summary.mjs <report.json>");
  process.exit(2);
}

if (!fs.existsSync(file)) {
  emit(`### ${title}\n\nRelatório ausente (\`${file}\`).\n\nSHA: \`${fallbackSha}\``);
  process.exit(0);
}

let summary;
try {
  summary = JSON.parse(fs.readFileSync(file, "utf8"));
} catch (err) {
  emit(`### ${title}\n\nJSON inválido em \`${file}\`: ${err.message}\n\nSHA: \`${fallbackSha}\``);
  process.exit(1);
}

const sha = summary.sha || fallbackSha;
const lines = [
  `### ${title}`,
  "",
  `SHA: \`${sha}\``,
  `Executados: ${summary.executed ?? 0}`,
  `Aprovados: ${summary.passed ?? 0}`,
  `Reprovados: ${summary.failed ?? 0}`,
  `Pulados: ${summary.skipped ?? 0}`,
];

if (summary.error) lines.push(`Erro: \`${summary.error}\` — ${summary.message || ""}`);

for (const row of summary.skippedChecks || []) {
  lines.push(`- pulado \`${row.id}\`: ${row.reason}`);
}
for (const row of summary.results || []) {
  if (row.ok) continue;
  lines.push(`- reprovado \`${row.id}\`: ${row.message || ""}`);
}

emit(lines.join("\n"));
