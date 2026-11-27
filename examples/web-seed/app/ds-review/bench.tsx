"use client";

import { useState } from "react";
import { Button, Stack } from "@/components/ui";
import { STATES, type State } from "./states";

type Row = {
  id: string;
  name: string;
  email: string;
  countLabel: string;
  dir?: "auto";
};

const ROWS: Row[] = [
  {
    id: "long",
    name: "Aleksandra Wiśniewska-Kowalczyk",
    email: "bartholomew.fitzgerald@northwind-industries-holdings.example.com",
    countLabel: "1,284 notes",
  },
  {
    id: "diacritic",
    name: "Đặng Thị Ngọc Hân",
    email: "a@b.test",
    countLabel: "1 note",
  },
  {
    id: "rtl",
    name: "نور الهدى عبد الرحمن",
    email: "ops@sub.department.region.example.test",
    countLabel: "12 notes",
    dir: "auto",
  },
  {
    id: "emoji",
    name: "🦊 Fox",
    email: "first.last+billing-notifications@example.com",
    countLabel: "0 notes",
  },
];

const EMPTY_COPY = "No reviews in this queue.";
const ERROR_COPY = "Couldn't load reviews. Try again.";
const LOADING_COPY = "Loading reviews…";

const LONG_NOTE =
  "The autumn catalog cover stayed in review after the printer sent a longer note than the field was drawn for. Benachrichtigungseinstellungen is one word, and the rest of the note has to wrap inside the column at a narrow width and at large text without opening a horizontal scrollbar. The same note keeps its diacritics on the line instead of clipping them.";

const STATE_LABEL: Record<State, string> = {
  ready: "Ready",
  empty: "Empty",
  error: "Error",
  loading: "Loading",
};

export function ReviewBench({ initialState = "ready" }: { initialState?: State }) {
  const [state, setState] = useState<State>(initialState);
  const [feedback, setFeedback] = useState("");

  function selectState(next: State) {
    setState(next);
    const url = new URL(window.location.href);
    url.searchParams.set("state", next);
    window.history.replaceState(null, "", url);
  }

  return (
    <main id="main" className="ds-bench relative mx-auto flex w-full max-w-xl flex-col px-4 py-8">
      <a id="skip" className="ds-skip" href="#main">
        Skip to review
      </a>
      <Stack gap={6}>
        <Stack gap={3}>
          <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-ink">
            OpenDesigma
          </p>
          <h1 className="font-display text-3xl leading-tight text-ink">Review bench</h1>
          <p className="text-base leading-relaxed text-quiet">
            Worst-case queue for the design system. Same tokens and Button as the seed.
          </p>
        </Stack>

        <div role="group" aria-label="Queue state" className="flex flex-wrap gap-3">
          {STATES.map((item) => (
            <Button
              key={item}
              id={`state-${item}`}
              variant="ghost"
              aria-pressed={state === item}
              onClick={() => selectState(item)}
            >
              {STATE_LABEL[item]}
            </Button>
          ))}
        </div>

        <div id="panel" data-state={state} aria-busy={state === "loading" ? true : undefined}>
          {state === "ready" ? (
            <Stack gap={4}>
              <ul className="ds-bench-list">
                {ROWS.map((row) => (
                  <li key={row.id} className="ds-bench-row">
                    <p className="ds-bench-name text-ink" dir={row.dir}>
                      {row.name}
                    </p>
                    <p className="ds-bench-email font-mono text-sm text-quiet">{row.email}</p>
                    <p className="ds-count text-sm">{row.countLabel}</p>
                  </li>
                ))}
              </ul>
              <p className="ds-bench-note text-base text-ink">{LONG_NOTE}</p>
            </Stack>
          ) : null}
          {state === "empty" ? <p>{EMPTY_COPY}</p> : null}
          {state === "error" ? <p role="alert">{ERROR_COPY}</p> : null}
          {state === "loading" ? <p>{LOADING_COPY}</p> : null}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button id="ack" onClick={() => setFeedback("Review acknowledged.")}>
            Acknowledge review
          </Button>
          <Button id="dismiss" variant="ghost" onClick={() => setFeedback("Review dismissed.")}>
            Dismiss
          </Button>
          <Button id="locked" variant="ghost" disabled>
            Archive locked
          </Button>
        </div>
        <p id="feedback" role="status" aria-live="polite">
          {feedback}
        </p>
        <p id="token-note" className="text-sm text-quiet">
          <a id="token-source" href="#token-note">
            Token source
          </a>
          . Canonical tokens live in tokens.css. Mobile mirrors the shared semantics.
        </p>
      </Stack>
    </main>
  );
}
