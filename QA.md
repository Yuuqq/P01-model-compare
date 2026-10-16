# P01 QA

## Environment

- **Browser**: Chrome 110+
- **OS**: Windows / macOS
- **Date**: 2026-10-16

## Functional Test Cases

1. **核心流程测试（免密钥课堂主路径）**
   - Steps: 打开页面 → 点「数据与感受矛盾」→ 点「查看示例对比结果（无需 API Key）」
   - Expected: 三栏立即出现可对照的模拟口径；`#status` 写明是课堂模拟、非真实 API
   - Pass/Fail: 代码路径已覆盖；合入后需在浏览器点一次

2. **真请求拦截**
   - Steps: 不填 Key，点「并发对比 3 模型」
   - Expected: 提示模型 N 的 Endpoint/Model/API Key 不能为空；按钮保持可点
   - Pass/Fail: 代码路径已覆盖

3. **超时与按钮恢复**
   - Steps: 填一个会挂起的 Endpoint（或本地慢代理）后发送
   - Expected: 约 60 秒后面板显示「请求超时（60 秒）」；`#runBtn` 重新可点
   - Pass/Fail: 代码路径已覆盖（`AbortController` + `try/finally`）

4. **CORS / 网络失败**
   - Steps: 在 GitHub Pages 上对官方 OpenAI Endpoint 填 Key 发送
   - Expected: 面板显示 CORS/网络失败的中文说明，而不是裸 `Failed to fetch`；引导改用示例对比或代理
   - Pass/Fail: 代码路径已覆盖；现场仍取决于浏览器与厂商 CORS

### 已验证项（对照当前实现，不是愿望清单）

  - [x] 无问题输入时阻止提交并提示
  - [x] 三面板缺字段时阻止提交并提示
  - [x] 三请求并发执行（代码路径）
  - [x] 接口报错时面板显示错误
  - [x] 成功时面板显示模型文本（`textContent`，无 Markdown `innerHTML`）
  - [x] 输入框含可见 `label for=`
  - [x] 响应输出区 `aria-live="polite"`（`.out` 与 `#status`）
  - [x] 键盘可达按钮和输入框
  - [x] 免密钥示例对比可重复触发

## Accessibility Checks

- [x] 键盘导航可达所有交互元素
- [x] 输入控件绑定可见 label
- [x] 焦点状态可见
- [x] 色彩对比度按教材羊皮纸主题验收（暗色导航见后续 UI 修复提交）

## Privacy Checks

- [x] 无强制上传数据
- [x] 无隐式密钥持久化（Key 只在页面内存）
- [x] 页面包含本地处理说明
- [x] 不写入对比历史到 `localStorage`

## Known Issues

- **Issue**: 纯静态站从浏览器直连多数厂商官方 API 会被 CORS 拦截。这是架构限制。
- **Severity**: High（真多模型对比不可用）；课堂主路径不受影响（示例对比）。
- **Workaround**: 「查看示例对比结果」；或教师代理 / 支持 CORS 的 Endpoint。请求 60 秒超时。

- **Issue**: 孤立 clone 缺少 `../shared/*`，暗色切换等会 404。
- **Severity**: Medium（独立开发体验）
- **Workaround**: 按工具箱 monorepo 与 `shared/` 并列部署，或用 GitHub Pages 上的完整工具箱。

## Sign-Off

- **QA Sub-Agent**: 条件通过（免密钥路径与校验；真 API 受 CORS 限制）
- **Project Agent**: 待浏览器点验示例对比与超时文案
- **Master Agent**: 在 CORS 限制写进 README / UI 的前提下可合入本收尾
