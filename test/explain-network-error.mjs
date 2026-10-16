import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const appJs = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "app.js"), "utf8");
const match = appJs.match(/function explainNetworkError\(err\) \{[\s\S]*?\n\}/);
assert.ok(match, "explainNetworkError should exist in app.js");
const explainNetworkError = eval(`(${match[0]})`);

assert.match(explainNetworkError({ name: "AbortError", message: "The user aborted a request." }), /请求超时（60 秒）/);
assert.match(explainNetworkError({ name: "TimeoutError", message: "The operation was aborted due to timeout" }), /请求超时/);
assert.match(explainNetworkError({ name: "TypeError", message: "Failed to fetch" }), /CORS/);
assert.match(explainNetworkError({ message: "NetworkError when attempting to fetch resource." }), /CORS/);
assert.equal(explainNetworkError({ message: "HTTP 401: invalid_api_key" }), "HTTP 401: invalid_api_key");
assert.equal(explainNetworkError(null), "请求失败");

console.log("explainNetworkError: 6 checks passed");
