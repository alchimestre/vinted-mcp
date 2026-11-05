const assert = require("node:assert/strict");
const { before, beforeEach, after, test } = require("node:test");
const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const { StdioClientTransport } = require("@modelcontextprotocol/sdk/client/stdio.js");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

let client;
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "vinted-validation-"));
const apiCallLog = path.join(tempDir, "api-calls");
fs.writeFileSync(apiCallLog, "");

before(async () => {
  const bootstrap = `
    const { VintedAPIClient } = require('./dist-ts/vinted-core');
    for (const name of ['searchItems', 'getItem', 'getSeller', 'comparePrices', 'setFavourite']) {
      VintedAPIClient.prototype[name] = async () => {
        require('node:fs').appendFileSync(process.env.API_CALL_LOG, 'call\\n');
        throw new Error('Unexpected API call');
      };
    }
    require('./dist-ts/index.js').startServer();
  `;
  const transport = new StdioClientTransport({
    command: "node",
    args: ["-e", bootstrap],
    cwd: process.cwd(),
    env: { ...process.env, VINTED_MCP_TRANSPORT: "stdio", API_CALL_LOG: apiCallLog }
  });
  client = new Client({ name: "validation-test", version: "1.0.0" });
  await client.connect(transport);
});
beforeEach(() => { fs.writeFileSync(apiCallLog, ""); });

after(async () => {
  await client?.close();
  fs.rmSync(tempDir, { recursive: true });
});

const invalidCalls = [
  ["search_items", { query: "coat", brandIds: "1" }],
  ["get_item", { itemId: -1 }],
  ["get_seller", { sellerId: 123, includeItems: "false" }],
  ["compare_prices", { query: "coat", countries: "fr" }],
  ["get_trending", { limit: -1 }],
  ["like_item", { itemId: 123, unlike: "false" }]
];

for (const [name, args] of invalidCalls) {
  test(`${name} rejects malformed input before an API call`, async () => {
    const result = await client.callTool({ name, arguments: args });
    assert.equal(result.isError, true);
    assert.equal(fs.readFileSync(apiCallLog, "utf8"), "");
  });
}

for (const [name, url] of [
  ["get_item", "https://attacker.example/vinted.fr/items/123"],
  ["get_seller", "https://vinted.unknown/member/123"],
  ["like_item", "https://www.vinted.fr/member/123"]
]) {
  test(`${name} rejects a URL outside its Vinted resource`, async () => {
    const result = await client.callTool({ name, arguments: { url } });
    assert.equal(result.isError, true);
    assert.equal(fs.readFileSync(apiCallLog, "utf8"), "");
  });
}
