# P01 Spec - 神农尝百草多模型口径对比器

## 1. Summary

- **Project ID**: P01
- **Project Name**: 神农尝百草多模型口径对比器
- **Goal**: 同一 Prompt 分发至多个 LLM API (BYOK)，并排对比回答口径差异
- **User Persona**: 调查记者 / 新闻学生

## 2. Scope

- **In scope**:
  - 同一 Prompt 分发至多个 LLM API (BYOK)
  - 并排对比回答口径差异
  - 免密钥示例对照（课堂主路径，模拟三栏口径）
- **Out of scope**:
  - 后端代理或服务端逻辑
  - API Key 持久化存储
  - 浏览器内对比历史 / HTML 导出（那是 `master` 线能力，不在本教材线）

## 3. UX

- **Core workflow**: 用户输入 → 前端处理 → 结果展示
- **Inputs**: 采访问题文本、API Key × 3、Endpoint × 3
- **Outputs**: 三栏并排模型回答
- **States**: empty (初始) / loading (处理中) / error (失败) / success (完成)

## 4. Functional Requirements

1. FR-1: 同一 Prompt 分发至多个 LLM API (BYOK)
2. FR-2: 结果可视化展示
3. FR-3: 错误状态可见提示

## 5. Non-Functional Requirements

- **Performance**: 核心任务 3 分钟内完成
- **Accessibility**: 键盘导航、aria-label、焦点可见、WCAG AA 对比度
- **Privacy**: 本地处理优先，不默认上传数据
- **Browser support**: 现代 Chromium (Chrome 110+)

## 6. Dependencies

- **Libraries/CDNs**: fetch API (OpenAI 兼容格式)
- **Local data**: 无（不把问题或模型回答写入 localStorage）

## 7. Risks & Mitigations

- **Risk**: 厂商返回非 OpenAI 兼容结构
- **Mitigation**: 提示格式不兼容并显示原始 JSON
- **Risk**: GitHub Pages 直连官方 API 被 CORS 拦截
- **Mitigation**: UI / README 说明限制；课堂用示例对照；超时 60 秒并恢复按钮
- **Risk**: 挂起的 Endpoint 让「并发对比」按钮永远灰掉
- **Mitigation**: `AbortController` + `try/finally`

## 8. Acceptance Criteria

- [ ] 三模型请求并发触发
- [ ] 成功和失败状态均可见
- [ ] 不依赖后端
- [ ] 页面支持移动端浏览
- [ ] 纯静态页面可部署 GitHub Pages
- [ ] 移动端可用
- [ ] 隐私提示清晰可见
