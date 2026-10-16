const runBtn = document.getElementById("runBtn");
const questionInput = document.getElementById("questionInput");
const panels = [...document.querySelectorAll(".panel")];

function panelValues(panel) {
  return {
    endpoint: panel.querySelector(".endpoint").value.trim(),
    model: panel.querySelector(".model").value.trim(),
    apiKey: panel.querySelector(".apiKey").value.trim(),
    out: panel.querySelector(".out")
  };
}

function setOutput(el, text, state) {
  el.textContent = text;
  el.classList.remove("status-ok", "status-error");
  if (state === "ok") el.classList.add("status-ok");
  if (state === "error") el.classList.add("status-error");
}

function explainNetworkError(err) {
  if (err && (err.name === "AbortError" || err.name === "TimeoutError")) {
    return "请求超时（60 秒）。请检查 Endpoint 是否可达，或稍后重试。";
  }
  if (err == null) return "请求失败";
  const msg = String(err.message || err);
  if (/failed to fetch|networkerror|load failed/i.test(msg)) {
    return "网络请求失败。浏览器直连官方 API 常被 CORS 拦截；请使用支持跨域的 Endpoint，或自建/教师提供的代理。无密钥课堂请改用「查看示例对比结果」。";
  }
  return msg || "请求失败";
}

async function askModel({ endpoint, model, apiKey, question }) {
  const payload = {
    model,
    messages: [
      {
        role: "system",
        content:
          "You are assisting journalism students. Be explicit about uncertainty and avoid fabrications."
      },
      { role: "user", content: question }
    ],
    temperature: 0.7
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);
  let res;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
  } catch (err) {
    throw new Error(explainNetworkError(err));
  } finally {
    clearTimeout(timeoutId);
  }

  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch (_err) {
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);
    return text;
  }

  if (!res.ok) {
    const message = json?.error?.message || text || `HTTP ${res.status}`;
    throw new Error(message);
  }

  const content = json?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("响应格式无法识别，未找到 choices[0].message.content。");
  }
  return content;
}

runBtn?.addEventListener("click", async () => {
  const question = questionInput.value.trim();
  const statusEl = document.getElementById("status");
  
  if (!question) {
    statusEl.textContent = "错误：请先输入采访问题。";
    statusEl.style.color = "var(--bad)";
    return;
  }

  statusEl.textContent = "状态: 正在并发请求模型...";
  statusEl.style.color = "var(--ink)";

  const values = panels.map(panelValues);
  for (let i = 0; i < values.length; i += 1) {
    const v = values[i];
    if (!v.endpoint || !v.model || !v.apiKey) {
      statusEl.textContent = `错误：模型 ${i + 1} 的 Endpoint/Model/API Key 不能为空。`;
      statusEl.style.color = "var(--bad)";
      return;
    }
  }

  runBtn.disabled = true;
  values.forEach(v => setOutput(v.out, "请求中...", ""));

  try {
    await Promise.all(
      values.map(async v => {
        try {
          const answer = await askModel({
            endpoint: v.endpoint,
            model: v.model,
            apiKey: v.apiKey,
            question
          });
          setOutput(v.out, answer, "ok");
        } catch (err) {
          setOutput(v.out, `请求失败: ${err.message}`, "error");
        }
      })
    );
  } finally {
    runBtn.disabled = false;
  }
});

// === PM Metrics Integration ===
(function() {
  try {
    if (!window.pmMetrics) return;
    // Auto mark task start on first meaningful interaction
    let taskStarted = false;
    document.addEventListener('click', function(e) {
      if (taskStarted) return;
      const btn = e.target.closest('button');
      if (btn) {
        taskStarted = true;
        window.pmMetrics.markTaskStart('model_compare_task');
      }
    }, { once: false });
  } catch (_e) {}
})();


// === Demo Mode: Show simulated results without API keys ===
(function() {
  const demoBtn = document.createElement('button');
  demoBtn.id = 'demoBtn';
  demoBtn.type = 'button';
  demoBtn.textContent = '查看示例对比结果（无需 API Key）';
  demoBtn.setAttribute('aria-label', '查看示例对比结果（无需 API Key）');
  demoBtn.style.cssText = 'margin-top:8px;min-height:44px;border:2px dashed var(--cinnabar,#A2402F);border-radius:6px;padding:10px 16px;font-weight:700;cursor:pointer;color:var(--cinnabar,#A2402F);background:transparent;width:100%;font-size:1rem;animation:none;';
  const runBtn = document.getElementById('runBtn');
  if (runBtn && runBtn.parentNode) {
    runBtn.parentNode.insertBefore(demoBtn, runBtn.nextSibling);
  } else {
    const question = document.querySelector('.question') || document.querySelector('main');
    if (question) question.appendChild(demoBtn);
  }

  function showDemoCompare() {
    const q = document.getElementById('questionInput');
    if (q && !q.value.trim()) q.value = '请分别用支持与反对视角评价城市拆迁政策。';
    const outs = document.querySelectorAll('.panel .out, .out');
    const demoResponses = [
      '【模型 A · DeepSeek】\n\n从支持角度看，城市拆迁政策有助于推动城市现代化建设，改善老旧城区的基础设施和居住环境。许多城市通过拆迁实现了交通网络升级和商业区域扩展。\n\n然而，反对者指出拆迁过程中常出现补偿不公、强制执行等问题。据《中国城市发展报告》数据，约32%的被拆迁户对补偿标准表示不满。\n\n⚠️ 课堂示例：以下为模拟对比口径，不是真实 API 返回。建议记者在报道时明确具体城市和时间范围。',
      '【模型 B · Moonshot】\n\n支持方观点：\n1. 城市更新是现代化必经之路\n2. 拆迁后土地利用效率显著提高\n3. 部分居民通过拆迁改善了住房条件\n\n反对方观点：\n1. 拆迁补偿标准往往低于市场价\n2. 社区文化纽带被强行切断\n3. 弱势群体（老年人、低收入者）缺乏议价能力\n\n📌 课堂示例提示：报道此类议题时，应同时采访政府、开发商和居民三方，避免单一信源。',
      '【模型 C · GPT-4o】\n\n这是一个典型的"发展 vs 权利"议题框架。\n\n支持论据：城市拆迁在经济学上可以通过"帕累托改进"来论证——如果补偿充分，理论上可以实现多方共赢。深圳、上海等城市的城中村改造案例常被援引。\n\n反对论据：实际操作中，信息不对称和权力不均衡导致"帕累托改进"难以实现。学者于建嵘的研究指出，土地纠纷是中国群体性事件的主要诱因之一。\n\n⚠️ 课堂示例：上述引用需要进一步验证。AI 模型可能会"幻觉"出不存在的具体数据或引用。'
    ];
    if (!outs.length) {
      const st = document.getElementById('status');
      if (st) {
        st.textContent = '状态: 未找到对比输出面板';
        st.style.color = 'var(--bad,#A2402F)';
      }
      return;
    }
    outs.forEach(function(el, i) {
      el.textContent = demoResponses[i] || demoResponses[demoResponses.length - 1];
      el.classList.remove('status-error');
      el.classList.add('status-ok');
    });
    const st = document.getElementById('status');
    if (st) {
      st.textContent = '状态: 已加载示例对比结果（课堂模拟数据，非真实 API 调用）';
      st.style.color = 'var(--ok,#0b7a3b)';
    }
  }

  demoBtn.addEventListener('click', showDemoCompare);
})();
