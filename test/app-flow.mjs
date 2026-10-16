import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

class El {
  constructor(id, extras = {}) {
    this.id = id;
    this.className = extras.className || "";
    this.value = extras.value || "";
    this.textContent = extras.textContent || "";
    this.innerHTML = "";
    this.disabled = false;
    this.style = {};
    this.parentNode = extras.parentNode || null;
    this.children = [];
    this.dataset = {};
    this.listeners = {};
    this.attrs = { ...(extras.attrs || {}) };
    this.classList = {
      _s: new Set(),
      add: (c) => this.classList._s.add(c),
      remove: (c) => this.classList._s.delete(c)
    };
  }
  addEventListener(type, fn) {
    (this.listeners[type] ||= []).push(fn);
  }
  setAttribute(k, v) {
    this.attrs[k] = v;
  }
  querySelector(sel) {
    return this.children.find((c) => c.className === sel.slice(1) || c.id === sel.slice(1)) || null;
  }
}

function makePanel(endpoint = "", model = "", apiKey = "") {
  const panel = new El(null, { className: "panel" });
  const out = new El(null, { className: "out", textContent: "等待输入..." });
  panel.children = [
    new El(null, { className: "endpoint", value: endpoint }),
    new El(null, { className: "model", value: model }),
    new El(null, { className: "apiKey", value: apiKey }),
    out
  ];
  return { panel, out };
}

const status = new El("status", { textContent: "状态: 等待输入" });
const questionInput = new El("questionInput");
const runBtn = new El("runBtn");
const questionSection = new El(null, { className: "question" });
questionSection.append = (n) => {
  n.parentNode = questionSection;
  questionSection.children.push(n);
};
questionSection.insertBefore = (node) => {
  node.parentNode = questionSection;
  questionSection.children.push(node);
  return node;
};
runBtn.parentNode = questionSection;
runBtn.nextSibling = null;

const a = makePanel();
const b = makePanel();
const c = makePanel();
const panels = [a.panel, b.panel, c.panel];
const created = [];

const document = {
  getElementById(id) {
    if (id === "runBtn") return runBtn;
    if (id === "questionInput") return questionInput;
    if (id === "status") return status;
    return null;
  },
  querySelector(sel) {
    if (sel === ".question") return questionSection;
    if (sel === "main") return questionSection;
    return null;
  },
  querySelectorAll(sel) {
    if (sel === ".panel") return panels;
    if (sel === ".panel .out, .out") return [a.out, b.out, c.out];
    return [];
  },
  createElement(tag) {
    const el = new El(null, { className: tag });
    created.push(el);
    return el;
  },
  addEventListener() {}
};

let fetchImpl = async () => {
  throw new TypeError("Failed to fetch");
};

const context = vm.createContext({
  document,
  window: { pmMetrics: null },
  fetch: (...args) => fetchImpl(...args),
  AbortController,
  setTimeout,
  clearTimeout,
  console
});

const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "app.js"), "utf8");
vm.runInContext(src, context);

assert.equal(created.length, 1, "demo button is inserted");
const demoBtn = created[0];
assert.match(demoBtn.textContent, /无需 API Key/);

questionInput.value = "";
await runBtn.listeners.click[0]();
assert.match(status.textContent, /请先输入采访问题/);
assert.equal(runBtn.disabled, false);

questionInput.value = "测试问题";
await runBtn.listeners.click[0]();
assert.match(status.textContent, /不能为空/);
assert.equal(runBtn.disabled, false);

demoBtn.listeners.click[0]();
assert.match(a.out.textContent, /课堂示例/);
assert.match(b.out.textContent, /课堂示例|社区文化/);
assert.match(c.out.textContent, /课堂示例|幻觉/);
assert.match(status.textContent, /课堂模拟数据/);

for (const p of [a, b, c]) {
  p.panel.children[0].value = "https://example.invalid/chat/completions";
  p.panel.children[1].value = "demo";
  p.panel.children[2].value = "sk-test";
}

fetchImpl = () => Promise.reject(new TypeError("Failed to fetch"));
await runBtn.listeners.click[0]();
assert.match(a.out.textContent, /CORS/);
assert.equal(runBtn.disabled, false);

fetchImpl = () =>
  new Promise((_, reject) => {
    setTimeout(() => reject(Object.assign(new Error("aborted"), { name: "AbortError" })), 5);
  });
const origAbort = context.AbortController;
context.AbortController = class {
  constructor() {
    this.signal = { aborted: false };
  }
  abort() {
    this.signal.aborted = true;
  }
};
fetchImpl = (_url, opts) =>
  new Promise((_, reject) => {
    const t = setInterval(() => {
      if (opts.signal && opts.signal.aborted) {
        clearInterval(t);
        reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
      }
    }, 5);
  });

const shortSrc = `
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20);
  try {
    await fetch("https://example.invalid", { signal: controller.signal });
  } catch (err) {
    globalThis.__explained = explainNetworkError(err);
  } finally {
    clearTimeout(timeoutId);
  }
`;
await vm.runInContext(`(async () => { ${shortSrc} })()`, context);
assert.match(context.__explained, /请求超时（60 秒）|请求超时/);

context.AbortController = origAbort;

console.log("app-flow: classroom demo, validation, CORS, timeout mapping passed");
