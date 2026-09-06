// P01 AI模型对比工作台 v2.1
// 课堂口径默认可用；现场模型仅走 OpenAI 兼容端点，并要求填写 Key。

const runBtn = document.getElementById("runBtn");
const questionInput = document.getElementById("questionInput");
const panels = [...document.querySelectorAll(".panel")];
const historyEl = document.getElementById("historyList");
const exportBtn = document.getElementById("exportBtn");
const statusEl = document.getElementById("status");
const modeEls = [...document.querySelectorAll('input[name="compareMode"]')];

const HISTORY_KEY = "p01_history";
const MAX_HISTORY = 6;
let history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");

const STANCES = [
  { label: "口径甲 · 自信叙述", hint: "少对冲、爱下定论。" },
  { label: "口径乙 · 审慎核查", hint: "标明不确定，把核实写进答案。" },
  { label: "口径丙 · 框架化", hint: "同一事实被放进立场更强的叙事框。" },
];

const HEDGE = ["可能", "也许", "或许", "未必", "不一定", "建议", "需要核", "未能", "如果", "尚不能", "并不一律", "假说", "应注明"];
const CLAIM = ["一定", "必须", "就是", "基本能定", "结论很明确", "即可", "都在", "永远", "本质", "真正危险", "正确写法"];

const PRESET_QUESTIONS = [
  "请说明「幸存者偏差」的概念，并举出一个新闻报道中的真实案例。",
  "如何核实一张新闻照片的真实性？请给出 5 个步骤。",
  "什么是信息茧房？算法推荐如何加剧这一问题？",
  "解释「统计显著性」与「实际意义」的区别，用非专业人士能理解的语言。",
  "深度伪造（Deepfake）视频有哪些常见识别特征？",
];

const CLASSROOM = {
  [PRESET_QUESTIONS[0]]: [
    "幸存者偏差就是只看见活下来的样本、忽略失败样本，因而把偶然当成规律。二战时盟军研究返航飞机弹孔、准备给弹孔多的部位加装甲，亚伯拉罕·瓦尔德指出该修的是那些没能飞回来的部位。新闻里常见「成功创业者都爱早起」这类报道：采访对象全是活下来的公司，倒闭的那一批根本进不了稿。结论很明确：只看幸存者，判断一定偏。",
    "幸存者偏差指：可观察样本已经过筛选，据此推断总体容易出错。经典教学案例是二战飞机装甲，但课堂引用时最好回到原文（Wald 的损毁分析），不要把段子当史料。新闻案例需要具体篇名与数据：例如只采访上市企业创始人谈「成功习惯」，而未纳入同期失败企业。是否构成偏差，要看稿件有没有交代抽样框。建议核：原报道样本如何获得、失败案例是否被系统排除。",
    "媒体热爱成功学，本质上就是在经营幸存者偏差。头条永远是逆袭与爆发，倒闭、裁员、无人问津的项目被写成噪音。读者被训练成只相信「可见的赢家」，于是把结构性运气误认成方法论。记者若继续用成功者访谈充当行业真相，就是在给偏差做放大器——不是疏忽，是选择。",
  ],
  [PRESET_QUESTIONS[1]]: [
    "五步即可：1）反图搜（Google / TinEye / Yandex）查首发；2）看 Exif 时间、设备、GPS；3）用照片里的路牌、店招、车辆做地理定位；4）对照天气与日照方向是否匹配声称日期；5）向拍摄者或当地目击者交叉确认。做完这五步，真假基本能定。社交媒体传图不经这五步，不应发稿。",
    "核实照片没有一次过的清单，但可按风险递进：①来源链——谁第一手发出、是否可联系到拍摄者；②反图搜，注意结果只能证明「曾经出现过」，不能单独证明「此刻为真」；③元数据常被平台剥掉，缺失不等于伪造；④画面内线索（文字、建筑、阴影）做地理与时间交叉；⑤如涉及冲突或灾难，应再找第二条独立来源。无法完成时，应在稿中写明「未能独立核实」。",
    "一张图能定一篇稿的情绪，所以造假的动力从来不是技术，是传播收益。只做反图搜是给自己心理安慰：专业造假者会裁切、镜像、重压。真正该问的是——这张图在为谁的叙事服务？若编辑部把「看起来真」当成真，读者看到的就不是现场，是被选中的现场。",
  ],
  [PRESET_QUESTIONS[2]]: [
    "信息茧房是桑斯坦提出的概念：人只接触让自己舒服的信息，认知被自己的偏好封死。推荐算法用点击与停留预测下一条，等于把茧房工业化。结果是立场越看越极端，公共讨论分裂。新闻客户端、短视频、社交信息流都在用同一套逻辑。要破茧，必须主动订阅对立来源，并关闭个性化推荐。",
    "「信息茧房」常被当作已证实的社会病，但经验研究并不一律支持「算法必然使人更极端」。更稳妥的说法是：推荐系统优化的是参与度，可能提高同质内容的暴露比例，同时也可能带来意外发现。要判断某产品是否加剧茧房，需要看：默认推荐策略、用户是否可关闭个性化、以及是否存在跨立场曝光。新闻课堂宜把茧房当假说，用自己的信息流截图做小样本观察，而不是直接下判决。",
    "茧房不是用户懒，是平台把注意力卖给了广告。推荐越准，人越不必遇见反对意见，公共领域就越像隔音房。媒体若还在信息流里追热点，就是在茧房内部供稿。所谓「你关心的新闻」，常常是「能让你留下来的新闻」——二者不是一回事。",
  ],
  [PRESET_QUESTIONS[3]]: [
    "统计显著只说明：这个差异不太像纯属巧合。它不说明差异够大、够重要。一个药让血压平均降 0.3，样本很大时可以「显著」，但对病人几乎没感觉——这就没有实际意义。新闻里写「研究证实有效」，往往只报了 p<0.05，没报效应量。正确写法是同时报差异大小和不确定性。",
    "统计显著性（常被简化为 p 值小于某阈值）回答的是「若总体没差异，得到当前样本的概率有多低」。它受样本量影响很大。实际意义问的是：这个差异对当事人、政策或临床是否重要。两者独立。报道时至少应写清：比较的是什么、效应有多大、区间是多少。若原文没给效应量，记者不应把「显著」翻译成「重要」或「有效」。",
    "「显著」是科学稿里最被滥用的词之一。公关稿靠它把微小波动写成突破，媒体再把突破写成标题。读者看到的不是证据强度，是词汇的权威感。把 p 值当故事高潮，是用统计学的行话给弱效应镀金。",
  ],
  [PRESET_QUESTIONS[4]]: [
    "常见破绽包括：眨眼过少或不自然、牙齿边缘闪烁、侧脸与耳朵发际线崩坏、光线方向和脖子阴影对不上、音画口型延迟、背景在转头时出现涂抹。用这些肉眼特征再加 InVID 等工具，多数廉价伪造能看出来。高成本伪造另说，但日常谣言视频足够用这套清单。",
    "早期 Deepfake 教程确实列举过眨眼、耳廓、发丝等瑕疵，但模型迭代很快，2024 年后不少公开模型已经修掉这些「教科书破绽」。更可靠的路径是：溯源（账号、首发时间、原始文件）、多角度旁证、说话内容是否与已知行程矛盾，而不是只靠画面美学。若必须做技术鉴定，应注明工具版本与误差，避免在稿中写「经鉴定为伪造」除非有实验室级结论。",
    "真正危险的不是破绽明显的假视频，是「看起来普通」的假视频。把识别手册当成金钟罩，会让公众以为自己能靠眨眼次数打假。传播层面，一条指控视频不需要完美，只需要比辟谣更早上热搜。新闻机构若还在教「看牙齿」，就是把技术军备竞赛缩成了民俗。",
  ],
};

function currentMode() {
  const checked = modeEls.find((el) => el.checked);
  return checked ? checked.value : "classroom";
}

function setStatus(t) {
  if (statusEl) statusEl.textContent = "状态: " + t;
}

function panelValues(panel) {
  return {
    endpoint: panel.querySelector(".endpoint")?.value.trim() || "",
    model: panel.querySelector(".model")?.value.trim() || "",
    apiKey: panel.querySelector(".apiKey")?.value.trim() || "",
    out: panel.querySelector(".out"),
    timeEl: panel.querySelector(".response-time"),
    statsEl: panel.querySelector(".stance-stats"),
    labelEl: panel.querySelector(".panel-label"),
    label: panel.querySelector(".panel-label")?.dataset.base || panel.querySelector(".panel-label")?.textContent || "",
  };
}

function stanceStats(text) {
  const hedges = HEDGE.filter((w) => text.includes(w)).length;
  const claims = CLAIM.filter((w) => text.includes(w)).length;
  return { hedges, claims };
}

function setOutput(el, text, state, statsEl) {
  if (!el) return;
  el.innerHTML = "";
  el.classList.remove("status-ok", "status-error", "status-loading");
  if (statsEl) statsEl.textContent = "";
  if (state === "loading") {
    el.classList.add("status-loading");
    el.textContent = text;
    return;
  }
  if (state === "ok") {
    el.classList.add("status-ok");
    const html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/^#{1,3} (.+)$/gm, "<b>$1</b>")
      .replace(/\n/g, "<br>");
    el.innerHTML = html;
    if (statsEl) {
      const s = stanceStats(text);
      statsEl.textContent = "对冲词 " + s.hedges + " · 断言词 " + s.claims;
    }
  } else {
    el.classList.add("status-error");
    el.textContent = text;
  }
}

function explainNetworkError(err) {
  const msg = err && err.message ? String(err.message) : String(err);
  if (err && err.name === "AbortError") {
    return "请求超时。静态站直连厂商接口常被 CORS 拦住，课堂请改用「课堂口径」。";
  }
  if (/Failed to fetch|NetworkError|CORS|TypeError/i.test(msg)) {
    return "浏览器拦截了跨域请求（CORS）。GitHub Pages 无法从页面直连 OpenAI / Anthropic / Gemini。请改用课堂口径，或自建后端代理。";
  }
  return msg;
}

function assertOpenAICompatible(endpoint) {
  if (/anthropic\.com/i.test(endpoint) && !/openai/i.test(endpoint)) {
    throw new Error("Anthropic 原生接口不是 OpenAI chat/completions。请改用 OpenAI 兼容代理，或切回课堂口径。");
  }
}

async function askModel(endpoint, model, apiKey, question) {
  if (!apiKey) throw new Error("未填写 API Key。课堂请用「课堂口径」。");
  const baseUrl = endpoint || "https://api.openai.com";
  assertOpenAICompatible(baseUrl);
  const url = baseUrl.replace(/\/+$/, "") + "/v1/chat/completions";
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  let resp;
  try {
    resp = await fetch(url, {
      method: "POST",
      headers: Object.assign(
        { "Content-Type": "application/json" },
        { Authorization: "Bearer " + apiKey }
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
      signal: ctrl.signal,
    });
  } catch (err) {
    throw new Error(explainNetworkError(err));
  } finally {
    clearTimeout(timer);
  }
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error("HTTP " + resp.status + ": " + err.substring(0, 200));
  }
  const data = await resp.json();
  return data.choices && data.choices[0] ? data.choices[0].message.content : JSON.stringify(data);
}

function classroomAnswers(question) {
  if (CLASSROOM[question]) return CLASSROOM[question];
  return [
    "按「自信叙述」口径：" + question + " 会被写成已经有定论的说明，对冲很少，案例会被讲成铁证。课堂用途是观察这种语气如何把未核事实说成常识。",
    "按「审慎核查」口径：" + question + " 应拆成定义、适用边界、需要回原文献的部分。凡是举案例，都要能指出信源与反例，并写明「若原文未给数据，则不应下结论」。",
    "按「框架化」口径：" + question + " 会被放进权力或平台动机的叙事里，重点从「这是什么」变成「这是谁在获益」。适合讨论框架，不适合当百科。",
  ];
}

function applyStanceLabels(classroom) {
  panels.forEach(function (p, i) {
    const label = p.querySelector(".panel-label");
    if (!label) return;
    if (!label.dataset.base) label.dataset.base = label.textContent.trim();
    if (classroom && STANCES[i]) {
      label.textContent = STANCES[i].label;
    } else {
      label.textContent = label.dataset.base;
    }
  });
  document.querySelectorAll(".api-fields").forEach(function (el) {
    el.hidden = classroom;
  });
}

async function runAll() {
  const question = questionInput.value.trim();
  if (!question) {
    setStatus("请输入问题");
    return;
  }

  runBtn.disabled = true;
  const mode = currentMode();
  applyStanceLabels(mode === "classroom");

  if (mode === "classroom") {
    setStatus("正在对照三种课堂口径…");
    panels.forEach(function (p) {
      const pv = panelValues(p);
      setOutput(pv.out, "⏳ 生成中…", "loading", pv.statsEl);
      if (pv.timeEl) pv.timeEl.textContent = "";
    });
    const t0 = Date.now();
    await new Promise(function (r) { setTimeout(r, 220); });
    const answers = classroomAnswers(question);
    const ms = Date.now() - t0;
    const results = panels.map(function (p, i) {
      const pv = panelValues(p);
      const ans = answers[i] || answers[0];
      setOutput(pv.out, ans, "ok", pv.statsEl);
      if (pv.timeEl) pv.timeEl.textContent = "⏱ " + (ms / 1000).toFixed(1) + "s · 本地";
      return { label: STANCES[i] ? STANCES[i].label : pv.label, model: pv.model, answer: ans, time: ms };
    });
    saveHistory(question, results);
    setStatus("课堂口径已并排。对比对冲词与断言密度。");
    runBtn.disabled = false;
    if (exportBtn) exportBtn.disabled = false;
    return;
  }

  setStatus("发送中…");
  const activePanels = panels.filter(function (p) {
    const pv = panelValues(p);
    return Boolean(pv.apiKey);
  });
  if (!activePanels.length) {
    setStatus("现场模式至少要填一把 API Key。没有 Key 请改用课堂口径。");
    runBtn.disabled = false;
    return;
  }

  activePanels.forEach(function (p) {
    const pv = panelValues(p);
    setOutput(pv.out, "⏳ 请求中…", "loading", pv.statsEl);
    if (pv.timeEl) pv.timeEl.textContent = "";
  });

  const results = await Promise.all(activePanels.map(async function (p) {
    const pv = panelValues(p);
    const t0 = Date.now();
    try {
      const ans = await askModel(pv.endpoint, pv.model, pv.apiKey, question);
      const ms = Date.now() - t0;
      setOutput(pv.out, ans, "ok", pv.statsEl);
      if (pv.timeEl) pv.timeEl.textContent = "⏱ " + (ms / 1000).toFixed(1) + "s";
      return { label: pv.label, model: pv.model || pv.endpoint, answer: ans, time: ms };
    } catch (e) {
      const ms = Date.now() - t0;
      const msg = explainNetworkError(e);
      setOutput(pv.out, "错误: " + msg, "error", pv.statsEl);
      if (pv.timeEl) pv.timeEl.textContent = "⏱ " + (ms / 1000).toFixed(1) + "s";
      return { label: pv.label, model: pv.model || pv.endpoint, answer: "[错误] " + msg, time: ms };
    }
  }));

  saveHistory(question, results);
  setStatus("完成，共 " + activePanels.length + " 个模型响应");
  runBtn.disabled = false;
  if (exportBtn) exportBtn.disabled = false;
}

function saveHistory(question, results) {
  const entry = { question: question, results: results, time: new Date().toLocaleTimeString("zh-CN") };
  history.unshift(entry);
  if (history.length > MAX_HISTORY) history = history.slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  renderHistory();
}

function renderHistory() {
  if (!historyEl) return;
  if (!history.length) {
    historyEl.innerHTML = '<li style="opacity:.5;font-size:13px">暂无历史对比</li>';
    return;
  }
  historyEl.innerHTML = history.map(function (h, i) {
    const q = h.question.length > 60 ? h.question.substring(0, 60) + "…" : h.question;
    return '<li class="hist-item"><div class="hist-q">' + q + '</div><div class="hist-meta">' + h.time + " · " + h.results.length + ' 栏</div><button type="button" class="hist-load" data-idx="' + i + '">重载</button></li>';
  }).join("");
  historyEl.querySelectorAll(".hist-load").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const h = history[btn.dataset.idx];
      questionInput.value = h.question;
      h.results.forEach(function (r) {
        const panel = panels.find(function (p) {
          const pv = panelValues(p);
          return pv.label === r.label || (pv.model && pv.model === r.model);
        }) || panels[h.results.indexOf(r)];
        if (!panel) return;
        const pv = panelValues(panel);
        setOutput(pv.out, r.answer, String(r.answer).startsWith("[错误]") ? "error" : "ok", pv.statsEl);
        if (pv.timeEl) pv.timeEl.textContent = "⏱ " + (r.time / 1000).toFixed(1) + "s";
      });
      setStatus("已载入历史对比");
    });
  });
}

document.querySelectorAll(".preset-btn").forEach(function (btn, i) {
  btn.addEventListener("click", function () {
    questionInput.value = PRESET_QUESTIONS[i] || PRESET_QUESTIONS[0];
    setStatus("已填入预设问题");
  });
});

modeEls.forEach(function (el) {
  el.addEventListener("change", function () {
    const classroom = currentMode() === "classroom";
    applyStanceLabels(classroom);
    setStatus(classroom ? "课堂口径：无需 Key，点「并发提问」即可对照。" : "现场模型：仅 OpenAI 兼容端点，且必须填写 Key。");
  });
});

if (exportBtn) {
  exportBtn.addEventListener("click", function () {
    const question = questionInput.value.trim();
    const panelData = panels.map(function (p) {
      const pv = panelValues(p);
      return { label: pv.label || pv.model || "模型", content: pv.out ? pv.out.innerHTML : "" };
    }).filter(function (p) { return p.content; });
    const cols = panelData.map(function (p) {
      return '<div class="panel-card"><div class="panel-label">' + p.label + "</div><div>" + p.content + "</div></div>";
    }).join("");
    const html = '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"/><title>AI模型对比</title><style>body{font-family:system-ui;max-width:1200px;margin:0 auto;padding:20px;background:#f5f7fa}.grid{display:grid;grid-template-columns:repeat(' + panelData.length + ',1fr);gap:16px}.panel-card{background:#fff;border-radius:12px;padding:16px;border:1px solid #ddd}.panel-label{font-weight:700;margin-bottom:8px;font-size:.9rem;color:#555}</style></head><body><h1>问题: ' + question.replace(/</g, "&lt;") + '</h1><div class="grid">' + cols + '</div><p style="margin-top:20px;font-size:11px;color:#aaa">由 P01 AI模型对比工作台生成 · ' + new Date().toLocaleString("zh-CN") + "</p></body></html>";
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "ai-compare.html"; a.click();
    URL.revokeObjectURL(url);
    setStatus("已导出对比报告");
  });
}

runBtn.addEventListener("click", runAll);
questionInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter" && e.ctrlKey) runAll();
});
applyStanceLabels(true);
renderHistory();

(function () {
  try {
    if (!window.pmMetrics) return;
    let started = false;
    document.addEventListener("click", function (e) {
      if (started) return;
      if (e.target.closest("button")) {
        started = true;
        window.pmMetrics.markTaskStart("model_compare_task");
      }
    }, { once: false });
  } catch (_) {}
})();
