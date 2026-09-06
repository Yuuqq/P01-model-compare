# P01 QA

## Environment

- **Browser**: Chrome 110+ / Firefox / Safari
- **OS**: Windows / macOS / 机房无 Key 环境
- **Date**: 2026-09-07

## Functional Test Cases

1. **课堂口径（默认，无 Key）**
   - Steps: 打开页面 → 点「幸存者偏差」→ 点「并发提问」
   - Expected: 三栏在 1 秒内出现自信 / 审慎 / 框架化三种口径，并显示对冲词与断言词计数
   - Pass/Fail: 待测

2. **自定义问题的课堂回退**
   - Steps: 输入非预设问题，课堂口径下发送
   - Expected: 三栏仍给出三种人格化说明，不请求网络
   - Pass/Fail: 待测

3. **现场模式无 Key**
   - Steps: 切到「现场模型」→ 不填 Key → 发送
   - Expected: 状态提示「至少要填一把 API Key」，不发网络请求
   - Pass/Fail: 待测

4. **Anthropic 原生端点**
   - Steps: 现场模式，Endpoint 填 `https://api.anthropic.com`，填任意 Key
   - Expected: 该栏显示「不是 OpenAI chat/completions」错误，而不是 CORS 红屏
   - Pass/Fail: 待测

5. **CORS 失败可读**
   - Steps: 现场模式填 OpenAI 真 Key（若有）或假 Key
   - Expected: 失败文案明确写 CORS / 请改用课堂口径，而不是空白
   - Pass/Fail: 待测

6. **历史重载按标签对齐**
   - Steps: 跑一次课堂对照 → 点历史「重载」
   - Expected: 答案回到对应口径栏，不串栏
   - Pass/Fail: 待测

7. **共享资源**
   - Steps: 在独立 GitHub Pages（非兄弟目录）打开
   - Expected: `design-tokens.css` / `loader.js` 能从 `yuuqq.github.io/shared` 回退加载，不 404 白壳
   - Pass/Fail: 待测

## Accessibility Checks

- [ ] 键盘导航可达所有交互元素
- [ ] 输入控件绑定可见 label
- [ ] 焦点状态可见
- [ ] 状态区 `aria-live="polite"`
- [ ] 对照方式使用 fieldset/legend

## Privacy Checks

- [ ] 课堂口径不发网络
- [ ] Key 不写入 localStorage
- [ ] 页脚不再声称「现场请求不经过任何服务器」而不提厂商

## Known Issues

- **Issue**: 现场模式在纯静态 Pages 上仍会遇到 CORS。这是架构限制，不是回归。
- **Severity**: major（已用课堂口径绕开）
- **Workaround**: 默认课堂口径；真对比需自建后端代理。
