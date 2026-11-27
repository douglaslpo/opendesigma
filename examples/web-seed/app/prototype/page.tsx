"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, Stack } from "@/components/ui";

type VariantId = "calm" | "dense" | "split";

const variants: {
  id: VariantId;
  label: string;
  blurb: string;
}[] = [
  {
    id: "calm",
    label: "Calm",
    blurb: "Uma coluna, ritmo generoso — boa para onboarding.",
  },
  {
    id: "dense",
    label: "Dense",
    blurb: "Mais informação acima da dobra — boa para power users.",
  },
  {
    id: "split",
    label: "Split",
    blurb: "Texto + ação lado a lado — boa para desktop.",
  },
];

function Preview({ id }: { id: VariantId }) {
  if (id === "dense") {
    return (
      <Stack gap={3} className="od-rise">
        <p className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-accent">
          Reserva · demo
        </p>
        <h2 className="font-display text-2xl tracking-tight text-ink">
          Mesa para 2 · sexta, 20h
        </h2>
        <p className="text-sm leading-relaxed text-quiet">
          Confirme o nome, telefone e preferência de ambiente. Tokens e{" "}
          <code className="font-mono text-ink">Button</code> do seed — sem hex
          inventado.
        </p>
        <ul className="grid gap-2 text-sm text-ink sm:grid-cols-2">
          <li className="border-b border-line pb-2">Nome · Ana Costa</li>
          <li className="border-b border-line pb-2">Tel · (11) 98888-0000</li>
          <li className="border-b border-line pb-2">Ambiente · Salão</li>
          <li className="border-b border-line pb-2">Notas · Aniversário</li>
        </ul>
        <div className="flex flex-wrap gap-3 pt-2">
          <Button type="button">Confirmar</Button>
          <Button type="button" variant="ghost">
            Editar
          </Button>
        </div>
      </Stack>
    );
  }

  if (id === "split") {
    return (
      <div className="grid gap-8 od-rise sm:grid-cols-2 sm:items-end">
        <Stack gap={3}>
          <p className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-accent">
            Reserva · demo
          </p>
          <h2 className="font-display text-3xl leading-tight tracking-tight text-ink">
            Mesa para 2
          </h2>
          <p className="text-base leading-relaxed text-quiet">
            Sexta · 20h · salão principal. Layout split para comparar com a
            variante calm.
          </p>
        </Stack>
        <Stack gap={3}>
          <Button type="button" className="w-full sm:w-auto">
            Confirmar reserva
          </Button>
          <Button type="button" variant="ghost" className="w-full sm:w-auto">
            Trocar horário
          </Button>
        </Stack>
      </div>
    );
  }

  return (
    <Stack gap={6} className="od-rise max-w-md">
      <Stack gap={3}>
        <p className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-accent">
          Reserva · demo
        </p>
        <h2 className="font-display text-3xl leading-tight tracking-tight text-ink sm:text-4xl">
          Mesa para 2
        </h2>
        <p className="text-base leading-relaxed text-quiet">
          Sexta, 20h · salão principal. Um CTA claro, sem cards no hero.
        </p>
      </Stack>
      <div className="flex flex-wrap gap-3">
        <Button type="button">Confirmar reserva</Button>
        <Button type="button" variant="ghost">
          Ver cardápio
        </Button>
      </div>
    </Stack>
  );
}

export default function PrototypePage() {
  const [picked, setPicked] = useState<VariantId>("calm");
  const [shipped, setShipped] = useState(false);
  const current = variants.find((v) => v.id === picked)!;

  return (
    <main className="relative flex flex-1 flex-col overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_10%,rgba(12,124,114,0.12),transparent_50%),linear-gradient(165deg,#d7e4ec_0%,#e6eef3_50%,#f0f5f8_100%)]"
      />

      <div className="relative mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-6 py-12 sm:px-10 sm:py-16">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-accent transition-[filter] duration-[var(--motion-fast)] hover:brightness-110"
          >
            OpenDesigma
          </Link>
          <Link
            href="/"
            className="text-sm text-quiet underline-offset-4 hover:text-ink hover:underline"
          >
            Voltar ao seed
          </Link>
        </div>

        <Stack gap={4} className="od-rise max-w-xl">
          <h1 className="font-display text-3xl tracking-tight text-ink sm:text-4xl">
            Exemplo vivo: picker de protótipo
          </h1>
          <p className="text-base leading-relaxed text-quiet">
            Escolha uma variante. O preview abaixo reusa{" "}
            <code className="font-mono text-ink">Button</code> +{" "}
            <code className="font-mono text-ink">Stack</code> e os tokens do{" "}
            <code className="font-mono text-ink">DESIGN.md</code>.
          </p>
        </Stack>

        <div
          role="listbox"
          aria-label="Variantes de protótipo"
          className="flex flex-wrap gap-2 od-rise-delay"
        >
          {variants.map((v) => {
            const active = v.id === picked;
            return (
              <button
                key={v.id}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  setPicked(v.id);
                  setShipped(false);
                }}
                className={[
                  "rounded-md border px-4 py-2 text-sm font-medium tracking-tight",
                  "transition-[background-color,border-color,color] duration-[var(--motion-fast)] ease-[var(--ease-out)]",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                  active
                    ? "border-accent bg-accent text-accent-ink"
                    : "border-line bg-transparent text-ink hover:bg-surface",
                ].join(" ")}
              >
                {v.label}
              </button>
            );
          })}
        </div>

        <p className="text-sm text-quiet od-rise-delay">{current.blurb}</p>

        <section
          aria-live="polite"
          className="rounded-md border border-line bg-surface/80 px-6 py-8 sm:px-8 sm:py-10"
        >
          <Preview id={picked} />
        </section>

        <div className="flex flex-wrap items-center gap-3 pb-8">
          <Button
            type="button"
            onClick={() => setShipped(true)}
          >
            Usar variante {current.label}
          </Button>
          {shipped ? (
            <p className="text-sm text-accent od-rise" role="status">
              Selecionada: <strong>{current.label}</strong> — pronta para
              ship-preview.
            </p>
          ) : null}
        </div>
      </div>
    </main>
  );
}
