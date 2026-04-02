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

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });

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
    statusEl.style.color = "var(--error)";
    return;
  }

  statusEl.textContent = "状态: 正在并发请求模型...";
  statusEl.style.color = "var(--text)";

  const values = panels.map(panelValues);
  for (let i = 0; i < values.length; i += 1) {
    const v = values[i];
    if (!v.endpoint || !v.model || !v.apiKey) {
      statusEl.textContent = `错误：模型 ${i + 1} 的 Endpoint/Model/API Key 不能为空。`;
      statusEl.style.color = "var(--error)";
      return;
    }
  }

  runBtn.disabled = true;
  values.forEach(v => setOutput(v.out, "请求中...", ""));

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

  runBtn.disabled = false;
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
