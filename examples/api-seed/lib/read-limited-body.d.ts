export const MAX_BODY_BYTES: number;

export type LimitedBodyResult =
  | { ok: true; bytes: Uint8Array }
  | { ok: false; error: "payload too large" };

export function readLimitedStream(
  stream: ReadableStream<Uint8Array>,
  maxBytes: number,
): Promise<LimitedBodyResult>;

export function readLimitedBody(
  request: Request,
  maxBytes?: number,
): Promise<LimitedBodyResult>;
