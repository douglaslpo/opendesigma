import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_BODY_BYTES,
  readLimitedBody,
  readLimitedStream,
} from "./read-limited-body.mjs";

function chunkStream(chunks, pulls) {
  let index = 0;
  return new ReadableStream({
    pull(controller) {
      pulls.push(index);
      if (index >= chunks.length) {
        controller.close();
        return;
      }
      controller.enqueue(chunks[index]);
      index += 1;
    },
  });
}

test("MAX_BODY_BYTES is 64 KiB", () => {
  assert.equal(MAX_BODY_BYTES, 65536);
});

test("empty request body is zero bytes", async () => {
  const request = new Request("http://127.0.0.1/api/echo", { method: "POST" });
  const result = await readLimitedBody(request, 8);
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.bytes.byteLength, 0);
});

test("accepts chunks that sum to the cap", async () => {
  const pulls = [];
  const stream = chunkStream(
    [new Uint8Array([1, 2, 3]), new Uint8Array([4, 5, 6, 7, 8])],
    pulls,
  );
  const result = await readLimitedStream(stream, 8);
  assert.equal(result.ok, true);
  if (result.ok) assert.deepEqual([...result.bytes], [1, 2, 3, 4, 5, 6, 7, 8]);
});

test("cancels once the next chunk would exceed the cap", async () => {
  const pulls = [];
  const stream = chunkStream(
    [new Uint8Array(8), new Uint8Array(1), new Uint8Array(4)],
    pulls,
  );
  const result = await readLimitedStream(stream, 8);
  assert.deepEqual(result, { ok: false, error: "payload too large" });
  assert.deepEqual(pulls, [0, 1]);
});

test("a single chunk over the cap is rejected without keeping those bytes", async () => {
  const emoji = new TextEncoder().encode("😀");
  assert.equal(emoji.byteLength, 4);
  assert.equal("😀".length, 2);
  const result = await readLimitedStream(
    chunkStream([emoji, new Uint8Array([1])], []),
    3,
  );
  assert.equal(result.ok, false);
});

test("multibyte text under the string cap still fails on octets", async () => {
  const euros = "€".repeat(3);
  assert.equal(euros.length, 3);
  const bytes = new TextEncoder().encode(euros);
  assert.equal(bytes.byteLength, 9);
  const result = await readLimitedStream(chunkStream([bytes], []), 8);
  assert.equal(result.ok, false);
});
