/**
 * Headless Chrome probe for the review bench.
 * Automation only: keyboard, focus, accessible name, contrast, feedback,
 * 320px, 200% root font, and the critical states. Screen readers are out.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { contrastRatio, requiredRatio } from "./contrast.mjs";

const SAMPLE_EXPRESSION = `(() => {
  function parse(input) {
    const m = String(input).match(/rgba?\\(([^)]+)\\)/);
    if (!m) return null;
    const parts = m[1].split(/[,\\s/]+/).filter(Boolean).map(Number);
    return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
  }
  function composite(front, back) {
    const a = front.a + back.a * (1 - front.a);
    if (a <= 0) return { r: 0, g: 0, b: 0, a: 0 };
    return {
      r: (front.r * front.a + back.r * back.a * (1 - front.a)) / a,
      g: (front.g * front.a + back.g * back.a * (1 - front.a)) / a,
      b: (front.b * front.a + back.b * back.a * (1 - front.a)) / a,
      a,
    };
  }
  function backdrop(el) {
    const layers = [];
    let node = el;
    while (node && node !== document.documentElement.parentElement) {
      const bg = parse(getComputedStyle(node).backgroundColor);
      if (bg) layers.push(bg);
      if (bg && bg.a >= 0.99) break;
      node = node.parentElement;
    }
    let acc = { r: 230, g: 238, b: 243, a: 1 };
    for (let i = layers.length - 1; i >= 0; i--) acc = composite(layers[i], acc);
    return acc;
  }
  function rgb(c) {
    return "rgb(" + Math.round(c.r) + ", " + Math.round(c.g) + ", " + Math.round(c.b) + ")";
  }
  const samples = [];
  const nodes = document.querySelectorAll("h1, p, a, button");
  for (const el of nodes) {
    if (el.closest("[disabled], [aria-disabled='true']") || el.hasAttribute("disabled")) continue;
    const text = (el.innerText || "").trim().slice(0, 80);
    if (!text) continue;
    const style = getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") continue;
    const color = parse(style.color);
    if (!color) continue;
    samples.push({
      text,
      color: rgb(color),
      background: rgb(backdrop(el)),
      fontSize: parseFloat(style.fontSize),
      fontWeight: style.fontWeight,
    });
  }
  const ack = document.getElementById("ack");
  const ackStyle = ack ? getComputedStyle(ack) : null;
  return {
    samples,
    outline: ackStyle ? {
      style: ackStyle.outlineStyle,
      width: ackStyle.outlineWidth,
      color: ackStyle.outlineColor,
    } : null,
    canvas: getComputedStyle(document.body).backgroundColor,
    overflow: {
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    },
    emails: [...document.querySelectorAll(".ds-bench-email")].map((el) => ({
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
    })),
    text: document.body.innerText,
    feedback: document.getElementById("feedback")?.textContent || "",
    state: document.getElementById("panel")?.getAttribute("data-state"),
    lockedDisabled: document.getElementById("locked")?.disabled === true,
    active: document.activeElement?.id || document.activeElement?.tagName || "",
    transitionMs: ackStyle ? ackStyle.transitionDuration : "",
  };
})()`;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForJson(port) {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) return res.json();
    } catch {
      // Chrome is still booting.
    }
    await sleep(100);
  }
  throw new Error("Chrome DevTools did not open");
}

function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const pending = new Map();
  const opened = new Promise((resolve, reject) => {
    ws.addEventListener("open", () => resolve());
    ws.addEventListener("error", () => reject(new Error("Chrome socket failed")));
  });
  ws.addEventListener("message", (event) => {
    const msg = JSON.parse(event.data);
    if (!msg.id || !pending.has(msg.id)) return;
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) reject(new Error(JSON.stringify(msg.error)));
    else resolve(msg.result);
  });
  return {
    ready: opened,
    send(method, params = {}) {
      const msgId = ++id;
      ws.send(JSON.stringify({ id: msgId, method, params }));
      return new Promise((resolve, reject) => pending.set(msgId, { resolve, reject }));
    },
    close() {
      ws.close();
    },
  };
}

async function evaluate(client, expression) {
  const result = await client.send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text || "page evaluation failed");
  }
  return result.result?.value;
}

async function waitFor(client, expression, timeout = 10_000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const value = await evaluate(client, expression);
    if (value) return true;
    await sleep(100);
  }
  return false;
}

async function key(client, name, code, vk) {
  const base = { key: name, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk };
  await client.send("Input.dispatchKeyEvent", { type: "rawKeyDown", ...base });
  if (name === "Enter" || name === " ") {
    await client.send("Input.dispatchKeyEvent", {
      type: "char",
      key: name,
      code,
      text: name === "Enter" ? "\r" : " ",
      windowsVirtualKeyCode: vk,
    });
  }
  await client.send("Input.dispatchKeyEvent", { type: "keyUp", ...base });
}

async function shot(client, shotsDir, name) {
  if (!shotsDir) return null;
  fs.mkdirSync(shotsDir, { recursive: true });
  const { data } = await client.send("Page.captureScreenshot", { format: "png" });
  const file = path.join(shotsDir, name);
  fs.writeFileSync(file, Buffer.from(data, "base64"));
  return file;
}

function push(failures, id, ok, message) {
  if (!ok) failures.push({ id, message });
}

export async function runBrowser({ baseUrl, shotsDir }) {
  const failures = [];
  const shots = [];
  const port = 9222 + (process.pid % 1000);
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), "od-jury-chrome-"));
  const chromeBin = process.env.CHROME_PATH || "google-chrome";
  const chrome = spawn(
    chromeBin,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--no-first-run",
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${userData}`,
      "--window-size=1280,900",
      "about:blank",
    ],
    { stdio: "ignore" },
  );

  let client;
  try {
    const version = await waitForJson(port);
    let created = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" });
    if (!created.ok) {
      created = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`);
    }
    const target = created.ok ? await created.json() : null;
    const list = target?.webSocketDebuggerUrl
      ? target
      : (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(
          (row) => row.type === "page",
        );
    if (!list?.webSocketDebuggerUrl) {
      throw new Error("Chrome did not expose a page target");
    }
    client = connect(list.webSocketDebuggerUrl || version.webSocketDebuggerUrl);
    await client.ready;
    await client.send("Page.enable");
    await client.send("Runtime.enable");
    await client.send("Accessibility.enable");
    await client.send("Emulation.setFocusEmulationEnabled", { enabled: true });

    const open = async (search, expectState) => {
      await client.send("Page.navigate", { url: `${baseUrl}/ds-review${search}` });
      // PPR puts the resolved tree in a hidden container until hydration.
      const ready = await waitFor(
        client,
        `(() => {
          const ack = document.getElementById("ack");
          const panel = document.getElementById("panel");
          return Boolean(
            ack &&
            panel &&
            !ack.closest("[hidden]") &&
            panel.getAttribute("data-state") === ${JSON.stringify(expectState)}
          );
        })()`,
        15_000,
      );
      if (!ready) throw new Error(`bench did not reach a visible ${expectState}`);
    };

    await open("", "ready");
    await client.send("Emulation.setDeviceMetricsOverride", {
      width: 1280,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });

    await client.send("Page.bringToFront");
    const sequence = [];
    for (let i = 0; i < 10; i++) {
      await key(client, "Tab", "Tab", 9);
      await sleep(30);
      const active = await evaluate(client, "document.activeElement?.id || ''");
      sequence.push(active);
      if (active === "token-source") break;
    }
    const expected = [
      "skip",
      "state-ready",
      "state-empty",
      "state-error",
      "state-loading",
      "ack",
      "dismiss",
      "token-source",
    ];
    push(
      failures,
      "keyboard",
      sequence.join(",") === expected.join(","),
      `tab order ${sequence.join(" → ") || "(empty)"}`,
    );
    push(failures, "disabled-skipped", !sequence.includes("locked"), "disabled control was in the tab order");

    await client.send("Page.bringToFront");
    for (let i = 0; i < 12 && (await evaluate(client, "document.activeElement?.id || ''")) !== "ack"; i++) {
      await key(client, "Tab", "Tab", 9);
    }
    const outline = await evaluate(client, `(() => {
      const el = document.getElementById("ack");
      const s = getComputedStyle(el);
      return { style: s.outlineStyle, width: s.outlineWidth, color: s.outlineColor, active: document.activeElement?.id || "" };
    })()`);
    const width = Number.parseFloat(outline?.width || "0");
    push(
      failures,
      "focus",
      outline?.active === "ack" && outline?.style !== "none" && width >= 2,
      `focus ring style=${outline?.style} width=${outline?.width} active=${outline?.active}`,
    );
    const ringRatio = contrastRatio(outline?.color, "rgb(230, 238, 243)");
    push(
      failures,
      "focus-contrast",
      ringRatio != null && ringRatio >= 3,
      `focus ring contrast ${ringRatio?.toFixed?.(2) ?? "n/a"}`,
    );

    await key(client, "Enter", "Enter", 13);
    const entered = await waitFor(
      client,
      `document.getElementById("feedback")?.textContent?.includes("Review acknowledged.")`,
      2_000,
    );
    let activation = "enter";
    if (!entered) {
      activation = "space";
      await key(client, " ", "Space", 32);
    }
    const afterEnter = await evaluate(client, "document.getElementById('feedback')?.textContent || ''");
    push(failures, "keyboard-feedback", afterEnter.includes("Review acknowledged."), `feedback was "${afterEnter}"`);

    const box = await evaluate(client, `(() => {
      const r = document.getElementById("dismiss").getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    })()`);
    await client.send("Input.dispatchMouseEvent", {
      type: "mousePressed",
      x: box.x,
      y: box.y,
      button: "left",
      clickCount: 1,
    });
    await client.send("Input.dispatchMouseEvent", {
      type: "mouseReleased",
      x: box.x,
      y: box.y,
      button: "left",
      clickCount: 1,
    });
    await sleep(50);
    const afterClick = await evaluate(client, "document.getElementById('feedback')?.textContent || ''");
    push(failures, "click-feedback", afterClick.includes("Review dismissed."), `feedback was "${afterClick}"`);

    const tree = await client.send("Accessibility.getFullAXTree");
    const names = new Set();
    for (const node of tree.nodes || []) {
      const role = node.role?.value;
      const name = node.name?.value || "";
      if ((role === "button" || role === "link") && name) names.add(name);
    }
    for (const required of [
      "Skip to review",
      "Ready",
      "Empty",
      "Error",
      "Loading",
      "Acknowledge review",
      "Dismiss",
      "Archive locked",
      "Token source",
    ]) {
      push(failures, "name", names.has(required), `accessible name missing: ${required}`);
    }

    const ready = await evaluate(client, SAMPLE_EXPRESSION);
    for (const sample of ready.samples || []) {
      const ratio = contrastRatio(sample.color, sample.background);
      const need = requiredRatio(sample.fontSize, sample.fontWeight);
      push(
        failures,
        "contrast",
        ratio != null && ratio + 0.05 >= need,
        `"${sample.text.slice(0, 42)}" ${ratio?.toFixed?.(2) ?? "n/a"} < ${need}`,
      );
    }
    push(
      failures,
      "extreme",
      ["Aleksandra Wiśniewska-Kowalczyk", "Đặng Thị Ngọc Hân", "🦊 Fox", "1,284 notes", "1 note"].every(
        (needle) => (ready.text || "").includes(needle),
      ),
      "ready state is missing an extreme row",
    );
    push(
      failures,
      "overflow-1280",
      ready.overflow.scrollWidth <= ready.overflow.clientWidth + 1,
      `horizontal overflow at 1280 (${ready.overflow.scrollWidth} > ${ready.overflow.clientWidth})`,
    );

    const motion = await evaluate(client, "getComputedStyle(document.getElementById('ack')).transitionDuration");
    await client.send("Emulation.setEmulatedMedia", {
      features: [{ name: "prefers-reduced-motion", value: "reduce" }],
    });
    await sleep(30);
    const reduced = await evaluate(client, "getComputedStyle(document.getElementById('ack')).transitionDuration");
    const reducedMs = Number.parseFloat(reduced) * (String(reduced).endsWith("ms") ? 1 : 1000);
    push(failures, "reduced-motion", reducedMs < 1, `reduced transition ${reduced} (was ${motion})`);
    await client.send("Emulation.setEmulatedMedia", { features: [] });

    shots.push(await shot(client, shotsDir, "ready-1280.png"));

    await client.send("Emulation.setDeviceMetricsOverride", {
      width: 320,
      height: 900,
      deviceScaleFactor: 1,
      mobile: true,
    });
    await sleep(50);
    const narrow = await evaluate(client, SAMPLE_EXPRESSION);
    const emailOverflow = (narrow.emails || []).some((row) => row.scrollWidth > row.clientWidth + 1);
    push(
      failures,
      "width-320",
      narrow.overflow.scrollWidth <= narrow.overflow.clientWidth + 1 && !emailOverflow,
      `overflow at 320px page=${narrow.overflow.scrollWidth}/${narrow.overflow.clientWidth}`,
    );
    shots.push(await shot(client, shotsDir, "ready-320.png"));

    await evaluate(client, "document.documentElement.style.fontSize = '32px'");
    await sleep(50);
    const large = await evaluate(client, SAMPLE_EXPRESSION);
    const largeEmail = (large.emails || []).some((row) => row.scrollWidth > row.clientWidth + 1);
    push(
      failures,
      "large-text",
      large.overflow.scrollWidth <= large.overflow.clientWidth + 1 && !largeEmail,
      `overflow at 320px and 32px root page=${large.overflow.scrollWidth}/${large.overflow.clientWidth}`,
    );
    const diacritic = await evaluate(client, `(() => {
      const el = [...document.querySelectorAll(".ds-bench-name")].find((n) => n.textContent.includes("Đặng"));
      if (!el) return null;
      const s = getComputedStyle(el);
      return { lineHeight: s.lineHeight, overflow: s.overflow, fontSize: s.fontSize };
    })()`);
    const line = Number.parseFloat(diacritic?.lineHeight || "0");
    const size = Number.parseFloat(diacritic?.fontSize || "0");
    push(
      failures,
      "diacritics",
      diacritic && diacritic.overflow !== "hidden" && line >= size,
      `diacritic line box ${JSON.stringify(diacritic)}`,
    );
    shots.push(await shot(client, shotsDir, "ready-320-large.png"));

    await evaluate(client, "document.documentElement.style.fontSize = ''");
    await client.send("Emulation.setDeviceMetricsOverride", {
      width: 1280,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });

    for (const [search, expectState, needle, file] of [
      ["?state=empty", "empty", "No reviews in this queue.", "empty-1280.png"],
      ["?state=error", "error", "Couldn't load reviews. Try again.", "error-1280.png"],
      ["?state=loading", "loading", "Loading reviews", "loading-1280.png"],
    ]) {
      await open(search, expectState);
      const text = await evaluate(client, "document.body.innerText");
      push(failures, expectState, text.includes(needle), `${expectState} copy missing`);
      if (expectState === "error") {
        const role = await evaluate(client, "document.querySelector('[role=alert]')?.textContent || ''");
        push(failures, "alert", role.includes("Couldn't"), "error state has no alert");
      }
      if (expectState === "loading") {
        const busy = await evaluate(client, "document.getElementById('panel')?.getAttribute('aria-busy')");
        push(failures, "busy", busy === "true", "loading state is not aria-busy");
      }
      shots.push(await shot(client, shotsDir, file));
    }

    return {
      ok: failures.length === 0,
      failures,
      checks: {
        tabOrder: sequence,
        names: [...names],
        outline,
        ringRatio,
        activation,
      },
      shots: shots.filter(Boolean),
    };
  } catch (err) {
    failures.push({ id: "browser", message: String(err.message || err) });
    return { ok: false, failures, checks: {}, shots };
  } finally {
    client?.close();
    chrome.kill("SIGKILL");
    fs.rmSync(userData, { recursive: true, force: true });
  }
}
