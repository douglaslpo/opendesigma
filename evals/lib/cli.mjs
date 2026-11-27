/**
 * Argument parsing and JSON summary shape for `evals/run.mjs`.
 * Usage errors are data (`errors[]`); the runner turns them into exit code 2
 * and still prints one JSON document on stdout.
 */

export const USAGE =
  "Usage: node evals/run.mjs [--skip-build] [--only <id>] [--out <file>] [--help]";

function takeValue(argv, index, flag, errors) {
  const next = argv[index + 1];
  if (next === undefined || next.startsWith("-") || next === "") {
    errors.push(`${flag} requires a value`);
    return null;
  }
  return next;
}

/**
 * @param {string[]} argv
 * @returns {{ opts: { skipBuild: boolean, only: string | null, out: string | null, help: boolean }, errors: string[] }}
 */
export function parseArgs(argv) {
  const opts = { skipBuild: false, only: null, out: null, help: false };
  const errors = [];
  let sawOnly = false;
  let sawOut = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      opts.help = true;
      continue;
    }
    if (arg === "--skip-build") {
      opts.skipBuild = true;
      continue;
    }
    if (arg === "--only" || arg.startsWith("--only=")) {
      if (sawOnly) errors.push("option --only repeated");
      sawOnly = true;
      if (arg === "--only") {
        const value = takeValue(argv, i, "--only", errors);
        if (value !== null) {
          opts.only = value;
          i++;
        }
      } else {
        const value = arg.slice("--only=".length);
        if (!value) errors.push("--only requires a value");
        else opts.only = value;
      }
      continue;
    }
    if (arg === "--out" || arg.startsWith("--out=")) {
      if (sawOut) errors.push("option --out repeated");
      sawOut = true;
      if (arg === "--out") {
        const value = takeValue(argv, i, "--out", errors);
        if (value !== null) {
          opts.out = value;
          i++;
        }
      } else {
        const value = arg.slice("--out=".length);
        if (!value) errors.push("--out requires a value");
        else opts.out = value;
      }
      continue;
    }
    if (arg.startsWith("-")) {
      errors.push(`unknown option: ${arg}`);
      continue;
    }
    errors.push(`unexpected argument: ${arg}`);
  }

  return { opts, errors };
}

/**
 * Stable summary for consumers. Executed checks stay in `results` with
 * `id` + boolean `ok`. Skipped checks stay in `skippedChecks` with `reason`
 * and are not counted as passed or failed.
 */
export function buildSummary({
  ok,
  sha = null,
  results = [],
  skippedChecks = [],
  error,
  message,
  knownIds,
  help = false,
}) {
  const passed = results.filter((row) => row.ok).length;
  const body = {
    ok,
    executed: results.length,
    passed,
    failed: results.length - passed,
    skipped: skippedChecks.length,
    total: results.length,
    sha,
    results,
    skippedChecks,
  };
  if (error) body.error = error;
  if (message) body.message = message;
  if (help) body.help = true;
  if (knownIds) body.knownIds = knownIds;
  return body;
}
