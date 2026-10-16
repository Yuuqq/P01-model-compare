// P01 AI模型对比工作台 v2.0
  // 新增：预设问题、响应时间、Markdown渲染、历史保存、导出报告

  const runBtn = document.getElementById("runBtn");
  const questionInput = document.getElementById("questionInput");
  const panels = [...document.querySelectorAll(".panel")];
  const historyEl = document.getElementById("historyList");
  const exportBtn = document.getElementById("exportBtn");
  const statusEl = document.getElementById("status");

  const HISTORY_KEY = "p01_history";
  const MAX_HISTORY = 6;
  let history = [];
  try {
    const parsed = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    history = Array.isArray(parsed) ? parsed : [];
  } catch (_e) {
    history = [];
  }

  const PRESET_QUESTIONS = [
    "请说明'幸存者偏差'的概念，并举出一个新闻报道中的真实案例。",
    "如何核实一张新闻照片的真实性？请给出5个步骤。",
    "什么是信息茧房？算法推荐如何加剧这一问题？",
    "解释'统计显著性'与'实际意义'的区别，用非专业人士能理解的语言。",
    "深度伪造（Deepfake）视频有哪些常见识别特征？",
  ];

  function setStatus(t) { if (statusEl) statusEl.textContent = "状态: " + t; }

  function escapeHTML(str) {
    return String(str ?? "").replace(/[&<>'"]/g, function(ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[ch];
    });
  }

  function panelValues(panel) {
    return {
      endpoint: panel.querySelector(".endpoint")?.value.trim() || "",
      model: panel.querySelector(".model")?.value.trim() || "",
      apiKey: panel.querySelector(".apiKey")?.value.trim() || "",
      out: panel.querySelector(".out"),
      timeEl: panel.querySelector(".response-time"),
      label: panel.querySelector(".panel-label")?.textContent || "",
    };
  }

  function setOutput(el, text, state) {
    if (!el) return;
    el.dataset.source = String(text ?? "");
    el.innerHTML = "";
    el.classList.remove("status-ok", "status-error", "status-loading");
    if (state === "loading") {
      el.classList.add("status-loading");
      el.textContent = text;
      return;
    }
    if (state === "ok") {
      el.classList.add("status-ok");
      const html = text
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g, "<em>$1</em>")
        .replace(/^#{1,3} (.+)$/gm, "<b>$1</b>")
        .replace(/\n/g, "<br>");
      el.innerHTML = html;
    } else {
      el.classList.add("status-error");
      el.textContent = text;
    }
  }

  function explainNetworkError(err) {
    if (err && (err.name === "AbortError" || err.name === "TimeoutError")) {
      return "请求超时（60 秒）。请检查 Endpoint 是否可达，或稍后重试。";
    }
    if (err == null) return "请求失败";
    const msg = String(err.message || err);
    if (/failed to fetch|networkerror|load failed/i.test(msg)) {
      return "网络请求失败。浏览器直连官方 API 常被 CORS 拦截；请使用支持跨域的 Endpoint，或自建/教师提供的代理。";
    }
    return msg || "请求失败";
  }

  async function askModel(endpoint, model, apiKey, question) {
    const baseUrl = endpoint || "https://api.openai.com";
    const url = baseUrl.replace(/\/+$/, "") + "/v1/chat/completions";
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    let resp;
    try {
      resp = await fetch(url, {
        method: "POST",
        headers: Object.assign(
          { "Content-Type": "application/json" },
          apiKey ? { Authorization: "Bearer " + apiKey } : {}
        ),
        body: JSON.stringify({
          model: model || "gpt-4o-mini",
          messages: [
            { role: "system", content: "你是一位新闻素养教育专家，回答请简洁专业，使用中文，控制在300字以内。" },
            { role: "user", content: question },
          ],
          temperature: 0.7,
          max_tokens: 600,
        }),
        signal: controller.signal,
      });
    } catch (err) {
      throw new Error(explainNetworkError(err));
    } finally {
      clearTimeout(timeoutId);
    }
    if (!resp.ok) {
      const err = await resp.text();
      throw new Error("HTTP " + resp.status + ": " + err.substring(0, 200));
    }
    const data = await resp.json();
    return data.choices && data.choices[0] ? data.choices[0].message.content : JSON.stringify(data);
  }

  async function runAll() {
    const question = questionInput.value.trim();
    if (!question) { setStatus("请输入问题"); return; }

    runBtn.disabled = true;
    try {
      setStatus("发送中…");

      const activePanels = panels.filter(p =>
        p.querySelector(".endpoint")?.value.trim() || p.querySelector(".model")?.value.trim()
      );
      if (!activePanels.length) {
        setStatus("请至少填写一个模型配置");
        return;
      }

      activePanels.forEach(p => {
        const pv = panelValues(p);
        setOutput(pv.out, "⏳ 请求中…", "loading");
        if (pv.timeEl) pv.timeEl.textContent = "";
      });

      const results = await Promise.all(activePanels.map(async function(p) {
        const pv = panelValues(p);
        const t0 = Date.now();
        try {
          const ans = await askModel(pv.endpoint, pv.model, pv.apiKey, question);
          const ms = Date.now() - t0;
          setOutput(pv.out, ans, "ok");
          if (pv.timeEl) pv.timeEl.textContent = "⏱ " + (ms / 1000).toFixed(1) + "s";
          return { model: pv.model || pv.endpoint, answer: ans, time: ms };
        } catch (e) {
          const ms = Date.now() - t0;
          setOutput(pv.out, "错误: " + e.message, "error");
          if (pv.timeEl) pv.timeEl.textContent = "⏱ " + (ms / 1000).toFixed(1) + "s";
          return { model: pv.model || pv.endpoint, answer: "[错误] " + e.message, time: ms };
        }
      }));

      const entry = { question: question, results: results, time: new Date().toLocaleTimeString("zh-CN") };
      history.unshift(entry);
      if (history.length > MAX_HISTORY) history = history.slice(0, MAX_HISTORY);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
      } catch (_e) {}
      renderHistory();
      setStatus("完成，共 " + activePanels.length + " 个模型响应");
      if (exportBtn) exportBtn.disabled = false;
    } finally {
      runBtn.disabled = false;
    }
  }

  function renderHistory() {
    if (!historyEl) return;
    historyEl.replaceChildren();
    if (!history.length) {
      const li = document.createElement("li");
      li.style.cssText = "opacity:.5;font-size:13px";
      li.textContent = "暂无历史对比";
      historyEl.appendChild(li);
      return;
    }
    history.forEach(function(h, i) {
      const li = document.createElement("li");
      li.className = "hist-item";
      const qEl = document.createElement("div");
      qEl.className = "hist-q";
      const rawQ = String(h.question || "");
      qEl.textContent = rawQ.length > 60 ? rawQ.substring(0, 60) + "…" : rawQ;
      const meta = document.createElement("div");
      meta.className = "hist-meta";
      const count = Array.isArray(h.results) ? h.results.length : 0;
      meta.textContent = String(h.time || "") + " · " + count + " 个模型";
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "hist-load";
      btn.dataset.idx = String(i);
      btn.textContent = "重载";
      btn.addEventListener("click", function() {
        const item = history[Number(btn.dataset.idx)];
        if (!item) return;
        questionInput.value = item.question;
        (item.results || []).forEach(function(r, idx) {
          if (!panels[idx]) return;
          const pv = panelValues(panels[idx]);
          const answer = String(r.answer || "");
          setOutput(pv.out, answer, answer.startsWith("[错误]") ? "error" : "ok");
          if (pv.timeEl) pv.timeEl.textContent = "⏱ " + ((r.time || 0) / 1000).toFixed(1) + "s";
        });
        setStatus("已载入历史对比");
      });
      li.appendChild(qEl);
      li.appendChild(meta);
      li.appendChild(btn);
      historyEl.appendChild(li);
    });
  }

  document.querySelectorAll(".preset-btn").forEach(function(btn, i) {
    btn.addEventListener("click", function() {
      questionInput.value = PRESET_QUESTIONS[i] || PRESET_QUESTIONS[0];
      setStatus("已填入预设问题");
    });
  });

  if (exportBtn) {
    exportBtn.addEventListener("click", function() {
      const question = questionInput.value.trim();
      const panelData = panels.map(function(p) {
        const pv = panelValues(p);
        const source = pv.out ? (pv.out.dataset.source ?? pv.out.textContent) : "";
        return { label: pv.label || pv.model || "模型", content: source };
      }).filter(function(p) { return p.content; });
      const cols = panelData.map(function(p) {
        const body = escapeHTML(p.content).replace(/\n/g, "<br>");
        return '<div class="panel-card"><div class="panel-label">' + escapeHTML(p.label) + '</div><div>' + body + '</div></div>';
      }).join("");
      const html = '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"/><title>AI模型对比</title><style>body{font-family:system-ui;max-width:1200px;margin:0 auto;padding:20px;background:#f5f7fa}.grid{display:grid;grid-template-columns:repeat(' + panelData.length + ',1fr);gap:16px}.panel-card{background:#fff;border-radius:12px;padding:16px;border:1px solid #ddd}.panel-label{font-weight:700;margin-bottom:8px;font-size:.9rem;color:#555}</style></head><body><h1>问题: ' + escapeHTML(question) + '</h1><div class="grid">' + cols + '</div><p style="margin-top:20px;font-size:11px;color:#aaa">由 P01 AI模型对比工作台生成 · ' + new Date().toLocaleString("zh-CN") + '</p></body></html>';
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "ai-compare.html"; a.click();
      URL.revokeObjectURL(url);
      setStatus("已导出对比报告");
    });
  }

  runBtn.addEventListener("click", runAll);
  questionInput.addEventListener("keydown", function(e) { if (e.key === "Enter" && e.ctrlKey) runAll(); });
  renderHistory();

  (function() {
    try {
      if (!window.pmMetrics) return;
      let started = false;
      document.addEventListener("click", function(e) {
        if (started) return;
        if (e.target.closest("button")) { started = true; window.pmMetrics.markTaskStart("model_compare_task"); }
      }, { once: false });
    } catch (_) {}
  })();
  