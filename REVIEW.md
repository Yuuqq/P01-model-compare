# P01 审查收尾（相对当前 `main`）

本文是 changelog，不是对另一条产品线的开卷考试。二次审查（Cursor/Grok，PR #2）看的是默认分支 `master` @ `355cda7`（v2.0 工作台：历史 / Markdown / 导出）。Jules PR #3 把那套补丁整文件搬到了教材线 `main`，并删掉教学 README、demo、`modern-styles.css`。第三次审查因此 request-changes。

本收尾把产品恢复为最新 `main`（教材 + 羊皮纸 + 免密钥示例），只保留**这条线上仍然成立**的修复。

## 已修（本树 `app.js` / `index.html` / `sw.js`）

| 项 | 位置 | 做法 |
|---|---|---|
| 请求超时 | `askModel` | `AbortController` 60s；`AbortError` 映射为「请求超时（60 秒）」 |
| 按钮卡死 | 并发点击处理 | `runBtn.disabled` 包在 `try/finally` |
| CORS 对人话 | `explainNetworkError`、hero 备注、README 课前准备 | `Failed to fetch` 不再原样甩出；引导用示例对比 |
| SW 误删同源其它工具缓存 | `sw.js` `activate` | 只删 `journalism-tool-P01*` / `p01-model-compare*` / `journalism-tool-v*` |
| SW 缓存刷新 | `CACHE_NAME` | `...-r20261016`，让旧客户端拿到新 `app.js` |
| 示例按钮错字 | `index.html` | 「城市坟地复拍政策」→「城市拆迁政策」 |

`event.waitUntil(fetchPromise)` 保留（Jules 曾删掉，这是回归）。缓存名维持 P01 前缀，不改成 `p01-model-compare-v1`（`main` 在 Jules 之前已是 `journalism-tool-P01-v2` / 现 `v3-parchment`）。

## 不适用于当前 `main`（不要再移植）

| 二次审查项 | 原因 |
|---|---|
| 历史列表 / 导出 HTML XSS | 本树 `setOutput` 只用 `textContent`，没有 history DOM sink |
| `panelIndex` 历史错位 | 没有历史重载 |
| Boot `JSON.parse(localStorage)` | 不持久化对比历史 |
| Anthropic placeholder | 三栏已是 DeepSeek / Moonshot / OpenAI 完整 chat/completions URL |
| 把 Endpoint 改成 base + `/v1/chat/completions` | 会破坏教材里的完整 URL 填法 |

## 仍开放（诚实记录，本收尾不扩 scope）

- **HIGH / 架构**：纯静态 Pages 直连多数厂商 API 仍会 CORS 失败。需要后端代理才是真多模型对比；课堂主路径是示例对照。
- **MEDIUM / 依赖**：`../shared/*` 在孤立 clone 里 404。本仓库按工具箱 monorepo 部署。
- **MEDIUM / QA 历史**：旧 QA 曾写「暂无已知严重问题」且三签 Approved，与 CORS 现实不符。见更新后的 `QA.md`。
- **LOW**：`app.js` 单文件。对 ~200 行课堂脚本拆模块没有收益。
- **不做**：不引入 `marked` / `DOMPurify` / Vitest（与零依赖 Pages 口径冲突）。

## 行号（以本收尾 HEAD 为准，合入后请再对一下）

- `explainNetworkError`：`app.js` 约 L21
- `askModel` + `AbortController`：`app.js` 约 L32
- `runBtn` `try/finally`：`app.js` L113–L137
- `sw.js` `CACHE_NAME`：L11
- `sw.js` `activate` 过滤：约 L52
- CORS 用户说明：`index.html` hero `.note`；README「课前准备」

## 合入建议

1. 先把本收尾合进 Jules 分支，再把 PR #3 rebase / 改 base 到当前 `main`，使 #3 的 diff 只剩上述外科改动。
2. 不要把 `master` 的 v2.0 工作台整份盖到 `main`。
3. 二次审查里该修 `master` 的 XSS / `panelIndex`，应另开对着 `master`（或 PR #1）的 PR，不要绑在这条教材线上。
