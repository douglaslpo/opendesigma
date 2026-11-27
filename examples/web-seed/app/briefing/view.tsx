import Link from "next/link";
import { Button, Stack } from "@/components/ui";
import {
  STATUS_LABEL,
  briefing,
  promotionFromSearch,
  resolveView,
  variantById,
} from "./model.mjs";

type Query = {
  v?: string;
  filter?: string;
  state?: string;
  id?: string;
  promoted?: string;
  actor?: string;
};

function href(query: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value) params.set(key, value);
  }
  const text = params.toString();
  return text ? `/briefing?${text}` : "/briefing";
}

export function BriefingScreen(props: Query) {
  const phase =
    props.state === "loading" || props.state === "error" ? props.state : "ready";
  const view = resolveView({
    filterId: props.filter,
    phase,
    selectedId: props.id,
  });
  const decision = promotionFromSearch({
    v: props.v,
    promoted: props.promoted,
    actor: props.actor,
  });
  const variant = variantById(decision.session.variantId);
  const direction = decision.promoted ? "promoted" : "open";

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-12 sm:px-10">
      <Stack gap={6}>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-accent">
            {briefing.studio}
          </p>
          <p className="text-sm text-quiet">
            Runtime Next. O preview estático fica em outro processo.
          </p>
        </div>

        <nav aria-label="Direções visuais" className="flex flex-wrap gap-2">
          {briefing.variants.map((item) => {
            const active = item.id === variant.id;
            return (
              <Link
                key={item.id}
                href={href({ v: item.id, filter: view.filterId })}
                aria-current={active ? "true" : undefined}
                className={[
                  "rounded-md border px-4 py-2 text-sm font-medium tracking-tight",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                  active
                    ? "border-accent bg-accent text-accent-ink"
                    : "border-line text-ink hover:bg-surface",
                ].join(" ")}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <p className="max-w-xl text-sm text-quiet">{variant.when}</p>

        <section
          data-variant={variant.id}
          data-axis={variant.axis}
          data-density={variant.density}
          data-personality={variant.personality}
          data-interaction={variant.interaction}
          data-state={view.state}
          data-direction={direction}
          aria-label={variant.label}
        >
          {variant.id === "ledger" ? (
            <Ledger variantLabel={variant.label} view={view} />
          ) : variant.id === "split" ? (
            <Split view={view} />
          ) : (
            <Quiet view={view} />
          )}
        </section>

        <div className="flex flex-wrap gap-4 text-sm">
          <Link
            className="text-quiet underline-offset-4 hover:text-ink hover:underline"
            href={href({
              v: variant.id,
              filter: view.filterId,
              state: "loading",
            })}
          >
            Simular carregamento
          </Link>
          <Link
            className="text-quiet underline-offset-4 hover:text-ink hover:underline"
            href={href({ v: variant.id, filter: view.filterId, state: "error" })}
          >
            Simular falha
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-3 pb-8">
          {decision.promoted ? (
            <p className="text-sm text-accent" role="status">
              Promovida por escolha humana: <strong>{variant.label}</strong>.
            </p>
          ) : (
            <p className="text-sm text-quiet" role="status">
              Direção aberta. Nenhuma variante foi promovida.
            </p>
          )}
          <form method="get" action="/briefing">
            <input type="hidden" name="v" value={variant.id} />
            <input type="hidden" name="filter" value={view.filterId} />
            <input type="hidden" name="promoted" value={variant.id} />
            <input type="hidden" name="actor" value="human" />
            <Button type="submit">Promover esta direção</Button>
          </form>
        </div>
      </Stack>
    </main>
  );
}

function Filters({
  filterId,
  variantId,
  layout,
}: {
  filterId: string;
  variantId: string;
  layout: "quiet" | "ledger" | "split";
}) {
  return (
    <div
      role="group"
      aria-label="Filtrar briefings"
      className={
        layout === "ledger" ? "flex flex-wrap gap-2" : "flex flex-col items-start gap-1"
      }
    >
      {briefing.filters.map((filter) => {
        const active = filter.id === filterId;
        return (
          <Link
            key={filter.id}
            href={href({ v: variantId, filter: filter.id })}
            aria-current={active ? "true" : undefined}
            className={
              layout === "ledger"
                ? [
                    "rounded-md border px-2 py-1 font-mono text-xs",
                    active
                      ? "border-accent bg-accent text-accent-ink"
                      : "border-line text-ink",
                  ].join(" ")
                : [
                    "text-sm underline-offset-4",
                    active ? "text-accent" : "text-quiet hover:text-ink hover:underline",
                  ].join(" ")
            }
          >
            {filter.label}
          </Link>
        );
      })}
    </div>
  );
}

function StateCopy({
  state,
  variantId,
  filterId,
}: {
  state: string;
  variantId: string;
  filterId: string;
}) {
  if (state === "loading") {
    return (
      <p aria-busy="true" className="text-quiet">
        Carregando a fila do ateliê.
      </p>
    );
  }
  if (state === "error") {
    return (
      <Stack gap={3}>
        <p role="alert">A fila não respondeu. Nada foi gravado.</p>
        <form method="get" action="/briefing">
          <input type="hidden" name="v" value={variantId} />
          <input type="hidden" name="filter" value={filterId} />
          <Button type="submit" variant="ghost">
            Tentar de novo
          </Button>
        </form>
      </Stack>
    );
  }
  return <p>Nenhum briefing com esse filtro.</p>;
}

function Quiet({
  view,
}: {
  view: ReturnType<typeof resolveView>;
}) {
  return (
    <Stack gap={6} className="max-w-xl">
      <Filters filterId={view.filterId} variantId="quiet" layout="quiet" />
      {view.state === "list" && view.selected ? (
        <Stack gap={3}>
          <h1 className="font-display text-4xl leading-tight tracking-tight text-ink sm:text-5xl">
            {view.selected.title}
          </h1>
          <p className="font-mono text-sm text-quiet">
            {view.selected.id} · {view.selected.owner} · {STATUS_LABEL[view.selected.status]}
          </p>
          <p className="max-w-md text-lg leading-relaxed text-quiet">{view.selected.note}</p>
        </Stack>
      ) : (
        <StateCopy state={view.state} variantId="quiet" filterId={view.filterId} />
      )}
      {view.state === "list" ? (
        <ol className="m-0 list-none p-0">
          {view.items.map((brief) => (
            <li key={brief.id} className="border-b border-line">
              <Link
                href={href({ v: "quiet", filter: view.filterId, id: brief.id })}
                aria-current={brief.id === view.selected?.id ? "true" : undefined}
                className="block py-3 text-ink"
              >
                {brief.id} {brief.title}
              </Link>
            </li>
          ))}
        </ol>
      ) : null}
    </Stack>
  );
}

function Ledger({
  variantLabel,
  view,
}: {
  variantLabel: string;
  view: ReturnType<typeof resolveView>;
}) {
  return (
    <Stack gap={4}>
      <h1 className="font-mono text-base font-semibold text-ink">
        {briefing.title} · {variantLabel}
      </h1>
      <Filters filterId={view.filterId} variantId="ledger" layout="ledger" />
      {view.state === "list" && view.selected ? (
        <Stack gap={3}>
          <ol className="m-0 list-none border-t border-ink p-0">
            {view.items.map((brief) => (
              <li key={brief.id} className="border-b border-line">
                <Link
                  href={href({ v: "ledger", filter: view.filterId, id: brief.id })}
                  aria-current={brief.id === view.selected?.id ? "true" : undefined}
                  className="grid grid-cols-[5rem_1fr] gap-3 py-2 font-mono text-xs text-ink sm:grid-cols-[6rem_1.4fr_0.8fr_7rem]"
                >
                  <span>{brief.id}</span>
                  <span>{brief.title}</span>
                  <span className="hidden sm:inline">{brief.owner}</span>
                  <span className="hidden sm:inline">{STATUS_LABEL[brief.status]}</span>
                </Link>
              </li>
            ))}
          </ol>
          <p className="font-mono text-xs text-quiet">{view.selected.note}</p>
        </Stack>
      ) : (
        <StateCopy state={view.state} variantId="ledger" filterId={view.filterId} />
      )}
    </Stack>
  );
}

function Split({ view }: { view: ReturnType<typeof resolveView> }) {
  return (
    <div className="grid items-start gap-8 lg:grid-cols-[16rem_1fr]">
      <aside className="border-b border-line pb-4 lg:border-b-0 lg:border-r lg:pr-4 lg:pb-0">
        <Filters filterId={view.filterId} variantId="split" layout="split" />
        {view.state === "list" ? (
          <ol className="m-0 mt-4 list-none p-0">
            {view.items.map((brief) => (
              <li key={brief.id} className="border-b border-line">
                <Link
                  href={href({ v: "split", filter: view.filterId, id: brief.id })}
                  aria-current={brief.id === view.selected?.id ? "true" : undefined}
                  className="block py-3 text-sm text-ink"
                >
                  <span className="font-mono text-xs text-quiet">{brief.id}</span>{" "}
                  {brief.title}
                </Link>
              </li>
            ))}
          </ol>
        ) : null}
      </aside>
      <article data-pane="detail">
        {view.state === "list" && view.selected ? (
          <Stack gap={3}>
            <h1 className="font-display text-3xl tracking-tight text-ink">
              {view.selected.title}
            </h1>
            <p className="text-sm text-quiet">
              {view.selected.owner} · {STATUS_LABEL[view.selected.status]}
            </p>
            <p className="max-w-md leading-relaxed text-quiet">{view.selected.note}</p>
          </Stack>
        ) : (
          <StateCopy state={view.state} variantId="split" filterId={view.filterId} />
        )}
      </article>
    </div>
  );
}
