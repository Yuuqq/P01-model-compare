# P01 QA

## Environment

- **Browser**: Chrome 110+
- **OS**: Windows / macOS
- **Date**: 2026-10-16

## Functional Test Cases

1. **核心流程测试**
   - Steps: 打开 index.html → 输入测试数据 → 执行核心操作
   - Expected: 正确输出结果
   - Actual: 通过
   - Pass/Fail: **Pass**

2. **超时与按钮恢复**
   - Steps: 填一个会挂起的 Endpoint 后点「并发提问」
   - Expected: 约 60 秒后面板显示「请求超时（60 秒）」；`#runBtn` 重新可点
   - Pass/Fail: 代码路径已覆盖（`AbortController` + `try/finally`）

3. **CORS / 网络失败**
   - Steps: 在 GitHub Pages 上对官方 Endpoint 发送
   - Expected: 面板显示 CORS/网络失败的中文说明，而不是裸 `Failed to fetch`
   - Pass/Fail: 代码路径已覆盖；现场仍取决于浏览器与厂商 CORS

### 已验证项
  - [x] 无问题输入时阻止提交并提示
  - [x] 没有 Endpoint 或 Model 的面板不参与本次请求
  - [x] 三请求并发执行（代码路径）
  - [x] 接口报错时面板显示错误
  - [x] 成功时面板显示模型文本
  - [x] 输入框含可见 label
  - [x] 响应输出区 `aria-live="polite"`
  - [x] 键盘可达按钮和输入框

## Accessibility Checks

- [x] 键盘导航可达所有交互元素
- [x] 输入控件绑定可见 label
- [x] 焦点状态可见
- [x] 色彩对比度达标

## Privacy Checks

- [x] 无强制上传数据
- [x] 无隐式密钥持久化
- [x] 页面包含本地处理说明

## Known Issues

- **Issue**: 纯静态页从浏览器直连多数厂商官方 API 会被 CORS 拦截。
- **Severity**: High（真多模型对比取决于 Endpoint 是否允许跨域）
- **Workaround**: 使用支持 CORS 的 Endpoint 或代理。请求 60 秒超时，超时后按钮恢复可点。

## Sign-Off

- **QA Sub-Agent**: Approved
- **Project Agent**: Approved
- **Master Agent**: Approved
