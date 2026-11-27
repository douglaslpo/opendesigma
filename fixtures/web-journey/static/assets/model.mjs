/**
 * Pure briefing journey. Shared by the static preview and the Next route.
 * Keep this file identical to examples/web-seed/app/briefing/model.mjs.
 * The Next bundler does not resolve imports outside the seed, so the test
 * compares the two copies.
 */

export const briefing = {
  studio: "Ateliê Lume",
  title: "Fila de briefings",
  briefs: [
    {
      id: "BL-104",
      title: "Capa do catálogo de outono",
      owner: "Marina Alves",
      status: "waiting",
      note: "A capa leva o nome da coleção e a data da abertura. Ainda não há foto de produto.",
    },
    {
      id: "BL-118",
      title: "Paleta da vitrine de inverno",
      owner: "Hugo Pires",
      status: "review",
      note: "Três amostras de tecido estão na mesa. A escolha fica entre o verde-lume e o cinza-névoa.",
    },
    {
      id: "BL-121",
      title: "Texto do convite de abertura",
      owner: "Marina Alves",
      status: "blocked",
      note: "O endereço do galpão ainda não foi confirmado. O texto espera esse dado.",
    },
    {
      id: "BL-130",
      title: "Grade de tamanhos do casaco",
      owner: "Lina Rocha",
      status: "ready",
      note: "A tabela vai de PP a GG, com uma nota sobre a manga longa.",
    },
  ],
  filters: [
    { id: "all", label: "Todos" },
    { id: "waiting", label: "Em espera" },
    { id: "review", label: "Em revisão" },
    { id: "blocked", label: "Bloqueados" },
    { id: "archive", label: "Arquivo" },
  ],
  variants: [
    {
      id: "quiet",
      label: "Quiet",
      axis: "editorial-sparse",
      density: "sparse",
      personality: "editorial",
      interaction: "read-one",
      when: "Quando o briefing pede leitura calma, um de cada vez.",
      cost: "A fila inteira sai da primeira vista.",
    },
    {
      id: "ledger",
      label: "Ledger",
      axis: "compact-scan",
      density: "compact",
      personality: "instrument",
      interaction: "scan-rows",
      when: "Quando a tarefa é varrer a fila e achar um status.",
      cost: "O texto longo do briefing perde presença.",
    },
    {
      id: "split",
      label: "Split",
      axis: "master-detail",
      density: "mixed",
      personality: "workspace",
      interaction: "select-detail",
      when: "Quando se compara a fila com o briefing aberto.",
      cost: "Em largura estreita o detalhe desce para baixo da fila.",
    },
  ],
};

export const STATUS_LABEL = {
  waiting: "Em espera",
  review: "Em revisão",
  blocked: "Bloqueado",
  ready: "Pronto",
};

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}

export function variantById(id) {
  return briefing.variants.find((variant) => variant.id === id) || briefing.variants[0];
}

export function filterBriefs(briefs, filterId) {
  if (!filterId || filterId === "all") return briefs.slice();
  return briefs.filter((brief) => brief.status === filterId);
}

export function initialSession() {
  return { variantId: "quiet", promotedId: null, direction: "open" };
}

/**
 * Promotion is a human act. Any other actor is rejected so a script,
 * a reload, or a default render cannot close the visual direction.
 */
export function promote(session, variantId, actor) {
  if (actor !== "human") {
    throw new Error("promote requires a human choice");
  }
  const variant = briefing.variants.find((item) => item.id === variantId);
  if (!variant) throw new Error(`unknown variant: ${variantId}`);
  return {
    variantId: variant.id,
    promotedId: variant.id,
    direction: "promoted",
  };
}

export function resolveView({ filterId = "all", phase = "ready", selectedId = null } = {}) {
  const knownFilter = briefing.filters.some((filter) => filter.id === filterId)
    ? filterId
    : "all";
  if (phase === "loading") {
    return { state: "loading", items: [], selected: null, filterId: knownFilter };
  }
  if (phase === "error") {
    return { state: "error", items: [], selected: null, filterId: knownFilter };
  }
  const items = filterBriefs(briefing.briefs, knownFilter);
  if (items.length === 0) {
    return { state: "empty", items: [], selected: null, filterId: knownFilter };
  }
  const selected = items.find((item) => item.id === selectedId) || items[0];
  return { state: "list", items, selected, filterId: knownFilter };
}

/**
 * The Next form sends actor=human together with the variant id.
 * A bare reload, or a promoted id that does not match the visible variant,
 * leaves the direction open.
 */
export function promotionFromSearch(params = {}) {
  const requested = variantById(params.v || params.promoted || "quiet");
  const session = { ...initialSession(), variantId: requested.id };
  if (!params.promoted && !params.actor) {
    return { session, promoted: false };
  }
  if (params.actor !== "human" || params.promoted !== requested.id) {
    return { session, promoted: false };
  }
  return { session: promote(session, params.promoted, "human"), promoted: true };
}

function filterGroup(view) {
  const buttons = briefing.filters
    .map((filter) => {
      const pressed = filter.id === view.filterId ? "true" : "false";
      return `<button type="button" data-filter="${escapeHtml(filter.id)}" aria-pressed="${pressed}">${escapeHtml(filter.label)}</button>`;
    })
    .join("");
  return `<div class="filters" role="group" aria-label="Filtrar briefings">${buttons}</div>`;
}

function stateRegion(view) {
  if (view.state === "loading") {
    return `<p class="state" data-state="loading" aria-busy="true">Carregando a fila do ateliê.</p>`;
  }
  if (view.state === "error") {
    return `<div class="state" data-state="error" role="alert"><p>A fila não respondeu. Nada foi gravado.</p><button type="button" data-action="retry">Tentar de novo</button></div>`;
  }
  if (view.state === "empty") {
    return `<p class="state" data-state="empty">Nenhum briefing com esse filtro.</p>`;
  }
  return "";
}

function simGroup() {
  return `<div class="sim" role="group" aria-label="Simular estado da fila"><button type="button" data-action="loading">Simular carregamento</button><button type="button" data-action="error">Simular falha</button></div>`;
}

function axisLine(variant) {
  return `<p class="axis" data-density="${escapeHtml(variant.density)}" data-personality="${escapeHtml(variant.personality)}" data-interaction="${escapeHtml(variant.interaction)}">${escapeHtml(variant.when)}</p>`;
}

function quietQueue(view) {
  if (view.state !== "list") return "";
  const items = view.items
    .map((brief) => {
      const current = brief.id === view.selected.id ? "true" : "false";
      return `<li><button type="button" data-select="${escapeHtml(brief.id)}" aria-current="${current}">${escapeHtml(brief.id)} ${escapeHtml(brief.title)}</button></li>`;
    })
    .join("");
  return `<ol class="quiet-queue">${items}</ol>`;
}

function renderQuiet(variant, view) {
  const sheet =
    view.state === "list"
      ? `<article class="quiet-sheet-body"><h1>${escapeHtml(view.selected.title)}</h1><p class="meta">${escapeHtml(view.selected.id)} · ${escapeHtml(view.selected.owner)} · ${escapeHtml(STATUS_LABEL[view.selected.status])}</p><p class="note">${escapeHtml(view.selected.note)}</p></article>`
      : stateRegion(view);
  return `<section class="quiet-sheet" data-variant="quiet" data-axis="${escapeHtml(variant.axis)}" data-state="${escapeHtml(view.state)}"><p class="eyebrow">${escapeHtml(briefing.studio)}</p>${axisLine(variant)}${filterGroup(view)}${sheet}${quietQueue(view)}${simGroup()}</section>`;
}

function renderLedger(variant, view) {
  const rows =
    view.state === "list"
      ? `<ol class="ledger-rows">${view.items
          .map((brief) => {
            const current = brief.id === view.selected.id ? "true" : "false";
            return `<li><button type="button" data-select="${escapeHtml(brief.id)}" aria-current="${current}"><span class="ledger-id">${escapeHtml(brief.id)}</span><span class="ledger-title">${escapeHtml(brief.title)}</span><span class="ledger-owner">${escapeHtml(brief.owner)}</span><span class="ledger-status">${escapeHtml(STATUS_LABEL[brief.status])}</span></button></li>`;
          })
          .join("")}</ol><p class="note">${escapeHtml(view.selected.note)}</p>`
      : stateRegion(view);
  return `<section class="ledger" data-variant="ledger" data-axis="${escapeHtml(variant.axis)}" data-state="${escapeHtml(view.state)}"><header class="ledger-head"><p class="eyebrow">${escapeHtml(briefing.studio)}</p><h1>${escapeHtml(briefing.title)}</h1></header>${axisLine(variant)}${filterGroup(view)}${rows}${simGroup()}</section>`;
}

function renderSplit(variant, view) {
  const rail =
    view.state === "list"
      ? `<ol class="split-list">${view.items
          .map((brief) => {
            const current = brief.id === view.selected.id ? "true" : "false";
            return `<li><button type="button" data-select="${escapeHtml(brief.id)}" aria-current="${current}"><span>${escapeHtml(brief.id)}</span> ${escapeHtml(brief.title)}</button></li>`;
          })
          .join("")}</ol>`
      : "";
  const detail =
    view.state === "list"
      ? `<h1>${escapeHtml(view.selected.title)}</h1><p class="meta">${escapeHtml(view.selected.owner)} · ${escapeHtml(STATUS_LABEL[view.selected.status])}</p><p class="note">${escapeHtml(view.selected.note)}</p>`
      : stateRegion(view);
  return `<section class="split" data-variant="split" data-axis="${escapeHtml(variant.axis)}" data-state="${escapeHtml(view.state)}"><aside class="split-rail" aria-label="Fila de briefings"><p class="eyebrow">${escapeHtml(briefing.studio)}</p>${filterGroup(view)}${rail}</aside><article data-pane="detail">${axisLine(variant)}${detail}${simGroup()}</article></section>`;
}

export function renderVariantHtml({ variantId, filterId, phase, selectedId } = {}) {
  const variant = variantById(variantId);
  const view = resolveView({ filterId, phase, selectedId });
  if (variant.id === "ledger") return renderLedger(variant, view);
  if (variant.id === "split") return renderSplit(variant, view);
  return renderQuiet(variant, view);
}

export function promoteStatus(session) {
  if (session.direction === "promoted" && session.promotedId) {
    const picked = variantById(session.promotedId);
    return `Promovida por escolha humana: ${picked.label}.`;
  }
  const visible = variantById(session.variantId);
  return `Direção aberta. Nenhuma variante foi promovida. Agora: ${visible.label}.`;
}
