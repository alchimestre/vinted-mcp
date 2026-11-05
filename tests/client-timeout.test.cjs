const assert = require("node:assert/strict");
const http = require("node:http");
const { test } = require("node:test");
const { HttpAuth } = require("../dist-ts/vinted-core/auth/http-auth.js");

test("auth rejects when the upstream server never sends headers", async () => {
  const server = http.createServer(() => {});
  await new Promise((resolve) => { server.listen(0, "127.0.0.1", resolve); });
  const originalFetch = global.fetch;
  const originalTimeout = AbortSignal.timeout;
  const url = `http://127.0.0.1:${server.address().port}`;
  global.fetch = (_url, options) => originalFetch(url, options);
  AbortSignal.timeout = () => originalTimeout(50);
  let guard;

  try {
    const deadline = new Promise((_, reject) => {
      guard = setTimeout(() => reject(new Error("Auth remained pending")), 2000);
    });
    await assert.rejects(Promise.race([new HttpAuth().createSession("fr"), deadline]), {
      name: "TimeoutError"
    });
  } finally {
    clearTimeout(guard);
    global.fetch = originalFetch;
    AbortSignal.timeout = originalTimeout;
    server.closeAllConnections();
    await new Promise((resolve) => { server.close(resolve); });
  }
});
