const test = require("node:test");
const assert = require("node:assert/strict");
const { brandHtml, brandCss } = require("../src/mvx-branding");

test("brandHtml replaces only product-facing AutoSocial identity", () => {
  const input = `<!doctype html><html><head><title>AutoSocial Studio</title></head><body><div class="brand-icon">A</div><h1>AutoSocial</h1><p>AutoSocial Studio contributors</p></body></html>`;
  const output = brandHtml(input);
  assert.match(output, /<title>MVX Social — MVX Ads Master<\/title>/);
  assert.match(output, /<div class="brand-icon">M<\/div>/);
  assert.match(output, /<h1>MVX Social<\/h1>/);
  assert.match(output, /application-name" content="MVX Social"/);
  assert.match(output, /AutoSocial Studio contributors/);
});

test("brandCss appends MVX tokens without deleting upstream styles", () => {
  const input = ":root { --primary: #3b82f6; }\n.brand { display:flex; }";
  const output = brandCss(input);
  assert.match(output, /\.brand \{ display:flex; \}/);
  assert.match(output, /--primary: #2dc9f7/);
  assert.match(output, /MVX Ads Master branding overlay/);
});
