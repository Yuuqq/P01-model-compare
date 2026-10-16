import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

function extractFunction(src, name) {
  const start = src.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} should exist in app.js`);
  const open = src.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < src.length; i += 1) {
    if (src[i] === "{") depth += 1;
    else if (src[i] === "}") {
      depth -= 1;
      if (depth === 0) return src.slice(start, i + 1);
    }
  }
  throw new Error(`unclosed ${name}`);
}

const appJs = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "app.js"), "utf8");
const explainNetworkError = eval(`(${extractFunction(appJs, "explainNetworkError")})`);

assert.match(explainNetworkError({ name: "AbortError", message: "The user aborted a request." }), /请求超时（60 秒）/);
assert.match(explainNetworkError({ name: "TimeoutError", message: "The operation was aborted due to timeout" }), /请求超时/);
assert.match(explainNetworkError({ name: "TypeError", message: "Failed to fetch" }), /CORS/);
assert.match(explainNetworkError({ message: "NetworkError when attempting to fetch resource." }), /CORS/);
assert.equal(explainNetworkError({ message: "HTTP 401: invalid_api_key" }), "HTTP 401: invalid_api_key");
assert.equal(explainNetworkError(null), "请求失败");

console.log("explainNetworkError: 6 checks passed");
