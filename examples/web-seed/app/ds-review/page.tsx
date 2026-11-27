import { Suspense } from "react";
import type { Metadata } from "next";
import { ReviewBench } from "./bench";
import { normalizeState } from "./states";

export const metadata: Metadata = {
  title: "Design system review bench",
  description:
    "Worst-case queue used by break-ui, review-ui, and the design jury.",
};

export default function DsReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string | string[] }>;
}) {
  return (
    <Suspense fallback={<main id="main" aria-busy="true">Opening review bench.</main>}>
      <ResolvedBench searchParams={searchParams} />
    </Suspense>
  );
}

async function ResolvedBench({
  searchParams,
}: {
  searchParams: Promise<{ state?: string | string[] }>;
}) {
  const params = await searchParams;
  const raw = Array.isArray(params.state) ? params.state[0] : params.state;
  return <ReviewBench initialState={normalizeState(raw)} />;
}
