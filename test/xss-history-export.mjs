import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const PAYLOAD_Q = '<img src=x onerror="alert(1)">';
const PAYLOAD_TIME = "<script>alert(2)</script>";
const PAYLOAD_ANSWER = "line1\n<svg/onload=alert(3)>";
const PAYLOAD_LABEL = "<b>模型</b>";

class El {
  constructor() {
    this.className = "";
    this.id = "";
    this.value = "";
    this.textContent = "";
    this.innerHTML = "";
    this.disabled = false;
    this.type = "";
    this.style = {};
    this.children = [];
    this.listeners = {};
    this.dataset = {};
    this.tagName = "div";
    this.href = "";
    this.download = "";
    this.classList = { add() {}, remove() {} };
  }
  addEventListener(type, fn) {
    (this.listeners[type] ||= []).push(fn);
  }
  click() {
    (this.listeners.click || []).forEach((fn) => fn());
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
}

function makePanel() {
  const panel = new El();
  panel.className = "panel";
  const out = new El();
  out.className = "out";
  const label = new El();
  label.className = "panel-label";
  label.textContent = PAYLOAD_LABEL;
  panel.children = [
    Object.assign(new El(), { className: "endpoint", value: "https://example.invalid" }),
    Object.assign(new El(), { className: "model", value: "demo" }),
    Object.assign(new El(), { className: "apiKey", value: "" }),
    out,
    Object.assign(new El(), { className: "response-time" }),
    label
  ];
  return { panel, out };
}

const status = new El();
const questionInput = new El();
const runBtn = new El();
const exportBtn = new El();
const historyList = new El();
const panels = [makePanel(), makePanel(), makePanel()];
const created = [];

const store = {
  p01_history: JSON.stringify([
    {
      question: PAYLOAD_Q,
      time: PAYLOAD_TIME,
      results: [{ model: "demo", answer: PAYLOAD_ANSWER, time: 1200 }]
    }
  ])
};

let exported = "";
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
    if (sel === ".panel") return panels.map((p) => p.panel);
    if (sel === ".preset-btn") return [];
    return [];
  },
  addEventListener() {},
  createElement(tag) {
    const el = new El();
    el.tagName = String(tag).toLowerCase();
    created.push(el);
    return el;
  }
};

const context = vm.createContext({
  document,
  window: {},
  localStorage: {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => {
      store[k] = String(v);
    }
  },
  fetch: async () => {
    throw new TypeError("Failed to fetch");
  },
  AbortController,
  setTimeout,
  clearTimeout,
  console,
  URL: { createObjectURL: () => "blob:test", revokeObjectURL() {} },
  Blob: class {
    constructor(parts) {
      exported = parts.join("");
    }
  }
});

const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "app.js"), "utf8");
vm.runInContext(src, context);

const forbidden = created.filter((el) => ["img", "script", "svg", "iframe"].includes(el.tagName));
assert.equal(forbidden.length, 0, "history render must not create executable tags");

const item = historyList.children[0];
const questionNode = item.children.find((el) => el.className === "hist-q");
const metaNode = item.children.find((el) => el.className === "hist-meta");
assert.equal(questionNode.textContent, PAYLOAD_Q);
assert.match(metaNode.textContent, /<script>alert\(2\)<\/script>/);
assert.equal(item.children.some((el) => el.tagName === "script"), false);

const reload = item.children.find((el) => el.className === "hist-load");
reload.listeners.click[0]();
assert.equal(questionInput.value, PAYLOAD_Q);
assert.match(panels[0].out.innerHTML, /&lt;svg/);
assert.doesNotMatch(panels[0].out.innerHTML, /<svg/i);

questionInput.value = PAYLOAD_Q;
panels[0].out.textContent = PAYLOAD_ANSWER;
exportBtn.listeners.click[0]();
assert.match(exported, /&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;/);
assert.match(exported, /line1<br>&lt;svg\/onload=alert\(3\)&gt;/);
assert.match(exported, /&lt;b&gt;模型&lt;\/b&gt;/);
assert.doesNotMatch(exported, /<(img|svg|script|iframe|b)\b/i);

console.log("xss-history-export: history text and escaped report passed");
