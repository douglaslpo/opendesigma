export const briefing: {
  studio: string;
  title: string;
  briefs: Array<{
    id: string;
    title: string;
    owner: string;
    status: string;
    note: string;
  }>;
  filters: Array<{ id: string; label: string }>;
  variants: Array<{
    id: string;
    label: string;
    axis: string;
    density: string;
    personality: string;
    interaction: string;
    when: string;
    cost: string;
  }>;
};

export const STATUS_LABEL: Record<string, string>;

export function escapeHtml(value: unknown): string;

export function variantById(id: string): {
  id: string;
  label: string;
  axis: string;
  density: string;
  personality: string;
  interaction: string;
  when: string;
  cost: string;
};

export function filterBriefs<T extends { status: string }>(briefs: T[], filterId: string): T[];

export function initialSession(): {
  variantId: string;
  promotedId: string | null;
  direction: "open" | "promoted";
};

export function promote(
  session: { variantId: string; promotedId: string | null; direction: string },
  variantId: string,
  actor: string,
): { variantId: string; promotedId: string; direction: "promoted" };

export function resolveView(input?: {
  filterId?: string;
  phase?: string;
  selectedId?: string | null;
}): {
  state: "loading" | "error" | "empty" | "list";
  items: Array<{
    id: string;
    title: string;
    owner: string;
    status: string;
    note: string;
  }>;
  selected: {
    id: string;
    title: string;
    owner: string;
    status: string;
    note: string;
  } | null;
  filterId: string;
};

export function promotionFromSearch(params?: {
  v?: string;
  promoted?: string;
  actor?: string;
}): {
  session: {
    variantId: string;
    promotedId: string | null;
    direction: string;
  };
  promoted: boolean;
};

export function renderVariantHtml(input?: {
  variantId?: string;
  filterId?: string;
  phase?: string;
  selectedId?: string | null;
}): string;

export function promoteStatus(session: {
  variantId: string;
  promotedId: string | null;
  direction: string;
}): string;
