export type State = "ready" | "empty" | "error" | "loading";

export const STATES: State[] = ["ready", "empty", "error", "loading"];

export function normalizeState(value: string | null | undefined): State {
  return STATES.includes(value as State) ? (value as State) : "ready";
}
