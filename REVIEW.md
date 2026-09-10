# Code Review: P01-model-compare

This document outlines findings from a thorough code review of the `P01-model-compare` repository. Findings are categorized by severity (CRITICAL, HIGH, MEDIUM, LOW) and cover architecture, security, reliability, testing, and developer experience.

## 🔴 CRITICAL

*(No CRITICAL findings were identified. The application operates entirely client-side without sensitive data exposure to third-party servers.)*

## 🟠 HIGH

### 1. Stored DOM Cross-Site Scripting (XSS) Vulnerabilities
- **File:** `app.js` (lines ~142 and ~179)
- **Impact:** The application reads user input (`questionInput.value`), saves it to `localStorage`, and later injects it directly into the DOM (`historyEl.innerHTML` at L142-145) and into an HTML export blob (L179) without any sanitization or encoding. While this is primarily a local self-XSS, an attacker could theoretically craft a malicious link or payload that, if pasted by the user, executes arbitrary JavaScript when history is rendered or the exported report is viewed.
- **Fix:** Avoid direct string interpolation into HTML for user inputs. Implement a robust HTML escaping function before concatenating:
  ```javascript
  function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
  }
  // Apply escapeHTML to `h.question` and `question` before using them in innerHTML/HTML blobs.
  ```

### 2. Missing Request Timeouts for Network Calls
- **File:** `app.js` (`askModel` function, lines ~53-73)
- **Impact:** The `fetch` calls to AI model APIs do not have a timeout configured. If a custom endpoint (or a default one) is unreachable, hangs, or experiences severe latency, the promise will stall indefinitely. This causes the UI to remain stuck in a "loading" state without failing gracefully or allowing the user to retry.
- **Fix:** Implement an `AbortController` to enforce a maximum wait time (e.g., 30-60 seconds):
  ```javascript
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);
  const resp = await fetch(url, {
    // ... headers & body ...
    signal: controller.signal
  });
  clearTimeout(timeoutId);
  ```

### 3. Missing CORS Handling for Browser-Based API Calls
- **File:** `app.js` (`askModel` function)
- **Impact:** The application makes direct API calls to model endpoints from the browser. Many vendor APIs (or user-provided endpoints) do not support Cross-Origin Resource Sharing (CORS) from a browser context, which will cause requests to fail silently or with network errors, rendering the tool non-functional for those endpoints.
- **Fix:** Document the CORS limitation for users, implement a proxy service if applicable, or instruct users to only use CORS-enabled endpoints (or local proxies).

### 4. Service Worker Cache Conflict Across Projects
- **File:** `sw.js` (line 9)
- **Impact:** The `CACHE_NAME` is hardcoded as `"journalism-tool-v1"`. Since this generic worker is designed for 50 tools, if multiple tools are hosted on the same origin, they will overwrite each other's cache, leading to offline mode failures and resource mismatches.
- **Fix:** Scope the cache name uniquely for this project (e.g., `"p01-model-compare-v1"`).

## 🟡 MEDIUM

### 5. Broken External Relative Dependencies
- **File:** `index.html` (lines 14, 103), `sw.js` (line 15)
- **Impact:** The codebase relies on assets outside the repository root directory (e.g., `../shared/design-tokens.css`, `../shared/releases/v2.6/loader.js`). If a developer clones and serves this repository in isolation, these core structural and functional dependencies will result in 404 errors, breaking the UI and PWA functionality.
- **Fix:** If this repository is part of a monorepo context, document the required directory structure explicitly in `README.md`. Alternatively, bundle or vendor the shared dependencies within the repository so it can run fully standalone.

### 6. Fragile Custom Markdown / HTML Parsing
- **File:** `app.js` (`setOutput` function, lines ~38-46)
- **Impact:** The regex-based markdown parser is extremely brittle. It handles a limited subset of markdown (e.g., headers, bold, italics) and relies on strict formatting conventions. It lacks support for nested elements, lists, or code blocks, which are very common in LLM outputs. Furthermore, custom parsing is prone to rendering bugs.
- **Fix:** Remove the custom regex parser and integrate a well-maintained, lightweight Markdown rendering library (like `marked`) paired with a dedicated HTML sanitizer (like `DOMPurify`) to safely and reliably render AI responses.

### 7. Lack of Automated Test Coverage
- **File:** Entire Repository
- **Impact:** There are no unit or integration tests for core logic (API interaction, history persistence, text parsing). The `QA.md` file outlines manual test steps, which are prone to false positives/negatives, and any future refactoring or dependency updates risk silently introducing regressions.
- **Fix:** Introduce a testing framework (such as Vitest or Jest) and write unit tests for:
  - The `askModel` API wrapper (mocking `fetch`).
  - The `setOutput` text parsing logic.
  - History queue management (truncation, loading).

## 🟢 LOW

### 8. Monolithic Code Organization
- **File:** `app.js`
- **Impact:** UI state management, local storage side-effects, DOM manipulation, and network API calls are all heavily coupled within a single script file. As the application grows, this will become difficult to maintain and extend.
- **Fix:** Refactor into modular components. For instance:
  - `api.js` (for `askModel` and network requests)
  - `storage.js` (for managing local history and metrics caching)
  - `ui.js` (for DOM updates and event listeners)

### 9. Missing Local Development Documentation
- **File:** `README.md`, `SPEC.md`
- **Impact:** The `README.md` lacks clear instructions on how a developer should run the app locally. Because the app uses Service Workers, simply opening `index.html` via the `file://` protocol may cause Service Worker registration issues.
- **Fix:** Add a brief "Local Development" section in the `README.md` outlining how to serve the project (e.g., `npx serve .` or `python -m http.server`) and explicitly mentioning the requirement of being placed next to the `shared/` directory.
