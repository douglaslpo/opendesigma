import { Button, Stack } from "@/components/ui";

export default function Home() {
  return (
    <main className="relative flex flex-1 flex-col overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(12,124,114,0.14),transparent_55%),linear-gradient(160deg,#d7e4ec_0%,#e6eef3_45%,#f0f5f8_100%)]"
      />
      <div className="relative mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-20 sm:px-10">
        <Stack gap={8} className="od-rise max-w-xl">
          <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-accent">
            OpenDesigma
          </p>
          <Stack gap={4}>
            <h1 className="font-display text-4xl leading-tight tracking-tight text-ink sm:text-5xl">
              Design system first, then ship the prototype.
            </h1>
            <p className="max-w-md text-lg leading-relaxed text-quiet od-rise-delay">
              This seed wires Next (App Router), Tailwind,{" "}
              <code className="font-mono text-[0.95em] text-ink">DESIGN.md</code>
              , and{" "}
              <code className="font-mono text-[0.95em] text-ink">tokens.css</code>{" "}
              so agents reuse real UI — not invent another Button.
            </p>
          </Stack>
          <div className="flex flex-wrap gap-3 od-rise-delay">
            <Button href="/prototype">Start prototype</Button>
            <Button
              href="https://github.com/douglaslpo/opendesigma/blob/main/examples/web-seed/DESIGN.md"
              variant="ghost"
            >
              Read DESIGN.md
            </Button>
          </div>
        </Stack>
      </div>
    </main>
  );
}
