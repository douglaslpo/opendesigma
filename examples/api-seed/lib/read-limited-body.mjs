/** 64 KiB. Compared as octets while the body is read, never as string length. */
export const MAX_BODY_BYTES = 64 * 1024;

/**
 * Read a Web ReadableStream until `maxBytes` octets.
 * The next chunk that would pass the cap is not kept, and the stream is cancelled
 * so later chunks are not pulled.
 *
 * @param {ReadableStream<Uint8Array>} stream
 * @param {number} maxBytes
 * @returns {Promise<{ ok: true, bytes: Uint8Array } | { ok: false, error: "payload too large" }>}
 */
export async function readLimitedStream(stream, maxBytes) {
  if (!Number.isFinite(maxBytes) || maxBytes < 0) {
    throw new TypeError("maxBytes must be a non-negative finite number");
  }

  const reader = stream.getReader();
  /** @type {Uint8Array[]} */
  const chunks = [];
  let received = 0;
  let released = false;

  const release = () => {
    if (released) return;
    released = true;
    try {
      reader.releaseLock();
    } catch {
      // cancel() may already have released the lock
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const size = value?.byteLength ?? 0;
      if (size === 0) continue;
      if (received + size > maxBytes) {
        try {
          await reader.cancel();
        } catch {
          // the caller still receives the size rejection
        }
        release();
        return { ok: false, error: "payload too large" };
      }
      chunks.push(value);
      received += size;
    }
  } finally {
    release();
  }

  const bytes = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { ok: true, bytes };
}

/**
 * Read `request.body`, counting octets as they arrive.
 * A missing body is an empty payload (0 bytes), which callers may treat as
 * "no JSON value" rather than invalid JSON.
 *
 * When the platform does not expose a stream but `Content-Length` is greater
 * than zero, fall back to `arrayBuffer()` and still compare `byteLength`.
 *
 * @param {Request} request
 * @param {number} [maxBytes]
 * @returns {Promise<{ ok: true, bytes: Uint8Array } | { ok: false, error: "payload too large" }>}
 */
export async function readLimitedBody(request, maxBytes = MAX_BODY_BYTES) {
  const stream = request.body;
  if (stream && typeof stream.getReader === "function") {
    return readLimitedStream(stream, maxBytes);
  }

  const declared = Number(request.headers.get("content-length"));
  if (!Number.isFinite(declared) || declared <= 0) {
    return { ok: true, bytes: new Uint8Array(0) };
  }
  if (declared > maxBytes) {
    return { ok: false, error: "payload too large" };
  }

  const buf = await request.arrayBuffer();
  if (buf.byteLength > maxBytes) {
    return { ok: false, error: "payload too large" };
  }
  return { ok: true, bytes: new Uint8Array(buf) };
}
