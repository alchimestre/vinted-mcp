const assert = require("node:assert/strict");
const { test } = require("node:test");
const { parseVintedUrl } = require("../dist-ts/tools/url.js");

test("item URLs preserve the listing ID and market", () => {
  assert.deepEqual(
    parseVintedUrl("https://www.vinted.fr/items/123-wool-coat?referrer=catalog", "items"),
    { id: 123, country: "fr" }
  );
});

test("seller URLs accept a bare multi-part Vinted domain", () => {
  assert.deepEqual(
    parseVintedUrl("https://vinted.co.uk/member/456-shop", "member"),
    { id: 456, country: "uk" }
  );
});
