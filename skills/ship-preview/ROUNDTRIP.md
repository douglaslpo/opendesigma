# ROUNDTRIP — promote preview → commit/PR

Companion for `ship-preview`. Full product note:
[`docs/round-trip.md`](../../docs/round-trip.md).

## When

After a **promote** (prototype picker or explicit “ship this”) when the user
wants the accepted surface in git review — not only a local URL.

## Steps (light)

1. Confirm promote target paths (UI and/or `app/api` stubs).
2. Preflight build/lint; list gate debt.
3. Start preview (prefer host `:4173` for static; label `:3000` for Next API).
4. Create feature branch → commit → push → open PR.
5. PR body: summary · preview URL · verify · gates.
6. **Stop before merge** unless the user explicitly asks to merge.

## Don’t

- Merge compulsório
- Secrets in preview root or PR screenshots
- Claim production ship from a draft preview
- Serve Next route handlers via the static preview host (use Next/deploy for API)
