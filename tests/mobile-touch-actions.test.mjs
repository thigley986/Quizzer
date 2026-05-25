import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import { constants, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import test from "node:test";

const root = process.cwd();
const publicDir = path.join(root, "public");

test("mobile touch answer shows feedback and touch next advances", async (t) => {
  const server = await startStaticServer(publicDir);
  t.after(() => server.close());

  const chrome = await launchChrome();
  t.after(() => chrome.close());

  const client = await connectToPage(chrome.port);
  t.after(() => client.close());

  await client.send("Page.enable");
  await client.send("Runtime.enable");
  await client.send("Emulation.setDeviceMetricsOverride", {
    width: 393,
    height: 664,
    deviceScaleFactor: 3,
    mobile: true,
    hasTouch: true,
  });
  await client.send("Emulation.setTouchEmulationEnabled", {
    enabled: true,
    maxTouchPoints: 5,
  });
  await client.send("Emulation.setUserAgentOverride", {
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  });

  await client.send("Page.navigate", { url: server.url });
  await waitFor(client, "button[data-action=\"start\"]");

  await touchAndClick(client, "button[data-action=\"set-category\"][data-value=\"math\"]");
  await touchAndClick(client, "button[data-action=\"start\"]");
  await waitFor(client, ".quiz-topline");

  assert.equal(await textContent(client, ".quiz-topline span"), "Question 1 of 25");

  await touchAndClick(client, "button[data-action=\"answer\"]");
  await waitFor(client, ".feedback-strip");

  const answeredState = await client.evaluate(`(() => ({
    feedback: !!document.querySelector(".feedback-strip"),
    correctVisible: !!document.querySelector(".answer-button.correct"),
    nextVisible: !!document.querySelector(".feedback-strip button[data-action='next']"),
    disabledAnswers: [...document.querySelectorAll("button[data-action='answer']")].every((button) => button.disabled)
  }))()`);

  assert.deepEqual(answeredState, {
    feedback: true,
    correctVisible: true,
    nextVisible: true,
    disabledAnswers: true,
  });

  await touchAndClick(client, ".feedback-strip button[data-action=\"next\"]");
  await waitForText(client, ".quiz-topline span", "Question 2 of 25");
  assert.equal(await client.evaluate(`!!document.querySelector(".feedback-strip")`), false);
});

test("age input keeps focus and replaces the existing age on first typing", async (t) => {
  const server = await startStaticServer(publicDir);
  t.after(() => server.close());

  const chrome = await launchChrome();
  t.after(() => chrome.close());

  const client = await connectToPage(chrome.port);
  t.after(() => client.close());

  await client.send("Page.enable");
  await client.send("Runtime.enable");
  await client.send("Emulation.setDeviceMetricsOverride", {
    width: 393,
    height: 664,
    deviceScaleFactor: 3,
    mobile: true,
    hasTouch: true,
  });

  await client.send("Page.navigate", { url: server.url });
  await waitFor(client, "input[data-action=\"age-input\"]");

  const focusedState = await client.evaluate(`new Promise((resolve) => {
    const input = document.querySelector("input[data-action='age-input']");
    input.focus();
    input.dispatchEvent(new Event("touchend", { bubbles: true, cancelable: true }));
    setTimeout(() => resolve({
      active: document.activeElement === input,
      value: input.value,
      replaceOnInput: input.dataset.replaceOnInput === "true"
    }), 50);
  })`);

  assert.deepEqual(focusedState, {
    active: true,
    value: "12",
    replaceOnInput: true,
  });

  const partialState = await client.evaluate(`(() => {
    const input = document.querySelector("input[data-action='age-input']");
    input.dataset.probe = "same-node";
    input.dispatchEvent(new InputEvent("beforeinput", {
      bubbles: true,
      cancelable: true,
      inputType: "insertText",
      data: "4"
    }));
    const currentInput = document.querySelector("input[data-action='age-input']");
    return {
      active: document.activeElement === currentInput,
      sameNode: currentInput.dataset.probe === "same-node",
      value: currentInput.value,
      errorVisible: !!document.querySelector(".error-message")
    };
  })()`);

  assert.deepEqual(partialState, {
    active: true,
    sameNode: true,
    value: "4",
    errorVisible: false,
  });

  await client.evaluate(`(() => {
    const input = document.querySelector("input[data-action='age-input']");
    input.value = "14";
    input.dispatchEvent(new Event("input", { bubbles: true }));
  })()`);
  await touchAndClick(client, "button[data-action=\"start\"]");
  await waitFor(client, ".game-header");

  assert.equal(await textContent(client, ".session-pills span"), "Age 14");
});

async function startStaticServer(directory) {
  const server = createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url ?? "/", "http://localhost");
      const pathname = decodeURIComponent(requestUrl.pathname);
      const normalizedPath = pathname === "/" ? "/index.html" : pathname;
      const filePath = path.normalize(path.join(directory, normalizedPath));

      if (!filePath.startsWith(directory)) {
        response.writeHead(403);
        response.end("Forbidden");
        return;
      }

      const body = await readFile(filePath);
      response.writeHead(200, { "content-type": contentType(filePath) });
      response.end(body);
    } catch {
      response.writeHead(404);
      response.end("Not found");
    }
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  return {
    url: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

async function launchChrome() {
  const executable = await findChromeExecutable();
  const userDataDir = await mkdtemp(path.join(tmpdir(), "quizzer-chrome-"));
  const port = 12000 + Math.floor(Math.random() * 1000);
  const chromeProcess = spawn(executable, [
    "--headless=new",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "about:blank",
  ], { stdio: "ignore" });

  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      await getJson(`http://127.0.0.1:${port}/json/version`);
      return {
        port,
        close: async () => {
          chromeProcess.kill();
          await delay(100);
          await rm(userDataDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
        },
      };
    } catch {
      await delay(100);
    }
  }

  chromeProcess.kill();
  await rm(userDataDir, { recursive: true, force: true });
  throw new Error("Chrome did not start with remote debugging enabled.");
}

async function findChromeExecutable() {
  const candidates = [
    process.env.CHROME_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      await access(candidate, constants.X_OK);
      return candidate;
    }
  }

  for (const command of ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser"]) {
    try {
      return execFileSync("which", [command], { encoding: "utf8" }).trim();
    } catch {
      // Keep trying known browser command names.
    }
  }

  throw new Error("Chrome or Chromium is required for mobile interaction tests.");
}

async function connectToPage(port) {
  const target = await getJson(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" });
  const socket = new WebSocket(target.webSocketDebuggerUrl);

  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });

  let id = 0;
  const pending = new Map();

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) return;

    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);

    if (message.error) {
      reject(new Error(JSON.stringify(message.error)));
    } else {
      resolve(message.result);
    }
  });

  return {
    close: () => socket.close(),
    send(method, params = {}) {
      const requestId = ++id;
      socket.send(JSON.stringify({ id: requestId, method, params }));
      return new Promise((resolve, reject) => pending.set(requestId, { resolve, reject }));
    },
    async evaluate(expression) {
      const result = await this.send("Runtime.evaluate", {
        expression,
        awaitPromise: true,
        returnByValue: true,
      });

      if (result.exceptionDetails) {
        throw new Error(JSON.stringify(result.exceptionDetails));
      }

      return result.result.value;
    },
  };
}

async function touchAndClick(client, selector) {
  const result = await client.evaluate(`(() => {
    const button = document.querySelector(${JSON.stringify(selector)});
    if (!button || button.disabled) return false;
    button.dispatchEvent(new Event("touchend", { bubbles: true, cancelable: true }));
    button.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    return true;
  })()`);

  assert.equal(result, true, `${selector} should be touchable`);
}

async function waitFor(client, selector) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (await client.evaluate(`!!document.querySelector(${JSON.stringify(selector)})`)) {
      return;
    }
    await delay(50);
  }

  throw new Error(`Timed out waiting for ${selector}`);
}

async function waitForText(client, selector, expectedText) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (await textContent(client, selector) === expectedText) {
      return;
    }
    await delay(50);
  }

  throw new Error(`Timed out waiting for ${selector} to equal ${expectedText}`);
}

function textContent(client, selector) {
  return client.evaluate(`document.querySelector(${JSON.stringify(selector)})?.textContent ?? null`);
}

async function getJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}`);
  }
  return response.json();
}

function contentType(filePath) {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (filePath.endsWith(".json")) return "application/json; charset=utf-8";
  if (filePath.endsWith(".png")) return "image/png";
  if (filePath.endsWith(".m4a")) return "audio/mp4";
  return "application/octet-stream";
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
