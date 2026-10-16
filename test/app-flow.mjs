import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

class El {
  constructor(extras = {}) {
    this.className = extras.className || "";
    this.id = extras.id || "";
    this.value = extras.value || "";
    this.textContent = extras.textContent || "";
    this.innerHTML = "";
    this.disabled = false;
    this.style = {};
    this.children = [];
    this.listeners = {};
    this.dataset = {};
    this.classList = {
      add() {},
      remove() {}
    };
  }
  addEventListener(type, fn) {
    (this.listeners[type] ||= []).push(fn);
  }
  appendChild(child) {
    this.children.push(child);
    return child;
  }
  replaceChildren(...nodes) {
    this.children = [...nodes];
  }
  querySelector(sel) {
    const key = sel.slice(1);
    return this.children.find((c) => c.className === key || c.id === key) || null;
  }
  querySelectorAll() {
    return [];
  }
}

function makePanel(endpoint = "", model = "") {
  const panel = new El({ className: "panel" });
  const out = new El({ className: "out" });
  const timeEl = new El({ className: "response-time" });
  panel.children = [
    new El({ className: "endpoint", value: endpoint }),
    new El({ className: "model", value: model }),
    new El({ className: "apiKey", value: "" }),
    out,
    timeEl,
    new El({ className: "panel-label", textContent: "模型" })
  ];
  return { panel, out };
}

const status = new El({ id: "status", textContent: "状态: 填写模型配置后点击发送" });
const questionInput = new El({ id: "questionInput" });
const runBtn = new El({ id: "runBtn" });
const exportBtn = new El({ id: "exportBtn" });
const historyList = new El({ id: "historyList" });
const a = makePanel();
const b = makePanel();
const c = makePanel("https://example.invalid", "demo");

const store = {};
const document = {
  getElementById(id) {
    if (id === "runBtn") return runBtn;
    if (id === "questionInput") return questionInput;
    if (id === "exportBtn") return exportBtn;
    if (id === "historyList") return historyList;
    if (id === "status") return status;
    return null;
  },
  querySelectorAll(sel) {
    if (sel === ".panel") return [a.panel, b.panel, c.panel];
    if (sel === ".preset-btn") return [];
    return [];
  },
  addEventListener() {},
  createElement() {
    return new El();
  }
};

let fetchImpl = async () => {
  throw new TypeError("Failed to fetch");
};

const realSetTimeout = setTimeout;
const realClearTimeout = clearTimeout;
const context = vm.createContext({
  document,
  window: {},
  localStorage: {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => {
      store[k] = String(v);
    }
  },
  fetch: (...args) => fetchImpl(...args),
  AbortController,
  setTimeout: (fn, ms, ...rest) => realSetTimeout(fn, ms === 60000 ? 20 : ms, ...rest),
  clearTimeout: realClearTimeout,
  console,
  URL: { createObjectURL: () => "blob:test", revokeObjectURL() {} }
});

const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "app.js"), "utf8");
vm.runInContext(src, context);

await runBtn.listeners.click[0]();
assert.match(status.textContent, /请输入问题/);
assert.equal(runBtn.disabled, false);

questionInput.value = "测试问题";
fetchImpl = () => Promise.reject(new TypeError("Failed to fetch"));
await runBtn.listeners.click[0]();
assert.match(c.out.textContent, /CORS/);
assert.equal(runBtn.disabled, false);

fetchImpl = (_url, opts) =>
  new Promise((_, reject) => {
    const check = () => {
      if (opts.signal && opts.signal.aborted) {
        reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
        return;
      }
      realSetTimeout(check, 5);
    };
    realSetTimeout(check, 5);
  });
await runBtn.listeners.click[0]();
assert.match(c.out.textContent, /请求超时（60 秒）/);
assert.equal(runBtn.disabled, false);
assert.equal(exportBtn.disabled, false);

console.log("app-flow: empty question, CORS, timeout, button recovery passed");
