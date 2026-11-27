import {
  briefing,
  initialSession,
  promote,
  promoteStatus,
  renderVariantHtml,
  variantById,
} from "./model.mjs";

const stage = document.getElementById("stage");
const picker = document.querySelector(".proto-picker");
const highlight = picker.querySelector(".proto-picker-highlight");
const items = [...picker.querySelectorAll(".proto-picker-item:not(.proto-picker-replay)")];
const status = document.getElementById("promote-status");
const promoteButton = document.getElementById("promote");

let session = initialSession();
let filterId = "all";
let phase = "ready";
let selectedId = briefing.briefs[0].id;
let current = 0;

function readQuery() {
  const params = new URLSearchParams(location.search);
  const requested = Number.parseInt(params.get("v") || "1", 10);
  current = requested >= 1 && requested <= briefing.variants.length ? requested - 1 : 0;
  session = { ...initialSession(), variantId: briefing.variants[current].id };
  filterId = params.get("filter") || "all";
  const state = params.get("state");
  phase = state === "loading" || state === "error" ? state : "ready";
  selectedId = params.get("id") || briefing.briefs[0].id;
}

function writeQuery() {
  const url = new URL(location.href);
  url.searchParams.set("v", String(current + 1));
  if (filterId && filterId !== "all") url.searchParams.set("filter", filterId);
  else url.searchParams.delete("filter");
  if (phase === "loading" || phase === "error") url.searchParams.set("state", phase);
  else url.searchParams.delete("state");
  if (selectedId) url.searchParams.set("id", selectedId);
  url.searchParams.delete("promoted");
  url.searchParams.delete("actor");
  history.replaceState(null, "", url);
}

function moveHighlight() {
  const el = items[current];
  highlight.style.width = `${el.offsetWidth}px`;
  highlight.style.transform = `translateX(${el.offsetLeft}px)`;
}

function paint() {
  const variant = briefing.variants[current];
  session = {
    ...session,
    variantId: variant.id,
    direction: session.promotedId ? "promoted" : "open",
  };
  stage.innerHTML = renderVariantHtml({
    variantId: variant.id,
    filterId,
    phase,
    selectedId,
  });
  stage.dataset.variant = variant.id;
  stage.dataset.direction = session.direction;
  wireStage();
  status.textContent = promoteStatus(session);
  items.forEach((el, index) => {
    el.toggleAttribute("data-active", index === current);
    if (index === current) el.setAttribute("aria-current", "true");
    else el.removeAttribute("aria-current");
  });
  moveHighlight();
}

function wireStage() {
  stage.querySelectorAll("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      filterId = button.getAttribute("data-filter") || "all";
      phase = "ready";
      writeQuery();
      paint();
    });
  });
  stage.querySelectorAll("[data-select]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedId = button.getAttribute("data-select") || selectedId;
      writeQuery();
      paint();
    });
  });
  stage.querySelector("[data-action=loading]")?.addEventListener("click", () => {
    phase = "loading";
    writeQuery();
    paint();
    window.setTimeout(() => {
      if (phase !== "loading") return;
      phase = "ready";
      writeQuery();
      paint();
    }, 700);
  });
  stage.querySelector("[data-action=error]")?.addEventListener("click", () => {
    phase = "error";
    writeQuery();
    paint();
  });
  stage.querySelector("[data-action=retry]")?.addEventListener("click", () => {
    phase = "ready";
    writeQuery();
    paint();
  });
}

function setActive(index) {
  if (index < 0 || index >= briefing.variants.length) return;
  current = index;
  session = {
    variantId: briefing.variants[current].id,
    promotedId: session.promotedId,
    direction: session.promotedId ? "promoted" : "open",
  };
  writeQuery();
  paint();
}

items.forEach((el, index) => el.addEventListener("click", () => setActive(index)));
window.addEventListener("resize", moveHighlight);
window.addEventListener("load", moveHighlight);

promoteButton.addEventListener("click", () => {
  const variant = variantById(session.variantId);
  session = promote(session, variant.id, "human");
  paint();
});

document.addEventListener("keydown", (event) => {
  const target = event.target;
  if (target instanceof Element) {
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable) return;
  }
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  const num = Number.parseInt(event.key, 10);
  if (num >= 1 && num <= briefing.variants.length) setActive(num - 1);
  else if (event.key === "ArrowRight") setActive((current + 1) % briefing.variants.length);
  else if (event.key === "ArrowLeft") {
    setActive((current - 1 + briefing.variants.length) % briefing.variants.length);
  }
});

readQuery();
setActive(current);
requestAnimationFrame(() => requestAnimationFrame(() => picker.setAttribute("data-ready", "")));
