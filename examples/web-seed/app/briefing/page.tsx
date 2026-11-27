import { Suspense } from "react";
import { BriefingScreen } from "./view";

export const metadata = {
  title: "Fila de briefings — Ateliê Lume",
  description:
    "Jornada fictícia de briefing no runtime Next, separada do preview estático.",
};

type Search = { [key: string]: string | string[] | undefined };

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function BriefingPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-16">
          <p className="text-quiet" aria-busy="true">
            Carregando a fila do ateliê.
          </p>
        </main>
      }
    >
      <BriefingRoute searchParams={searchParams} />
    </Suspense>
  );
}

async function BriefingRoute({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const params = await searchParams;
  return (
    <BriefingScreen
      v={one(params.v)}
      filter={one(params.filter)}
      state={one(params.state)}
      id={one(params.id)}
      promoted={one(params.promoted)}
      actor={one(params.actor)}
    />
  );
}
