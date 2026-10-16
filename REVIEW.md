# 把教材线修复接到 master

`main` 上的收尾没有进默认分支 `master`。两条线的页面不同：`master` 仍是 v2.0 工作台（预设问题、历史、导出）。这次只把仍然适用的行为补上，不把教材页整份盖过来。

- `askModel`：60 秒 `AbortController`；超时和 `Failed to fetch` 改成人话。Endpoint 仍是 `base + /v1/chat/completions`。
- `runAll`：`try/finally`，异常后「并发提问」会重新可点。
- 损坏的历史 JSON，或 `localStorage` 写入失败，不再把整页脚本打崩。
- `sw.js`：缓存名改为 `journalism-tool-P01-v1-r20261016`；`activate` 只删本工具前缀；后台更新保留 `waitUntil`。
