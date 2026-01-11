# Userscript Local Testing Guide

Guide for testing userscripts during local development without deploying.

## Prerequisites

- Userscript manager installed (Tampermonkey or Violentmonkey)
- Browser with DevTools access
- Text editor/IDE

## Setup

### 1. Start Dev Server

```bash
pnpm dev
```

Server runs at `http://localhost:5173/`.

### 2. Create Dev Wrapper Script

Create `scripts/<category>/<name>.dev.user.js` alongside original script:

```javascript
// ==UserScript==
// @name         [DEV] Your Script Name
// @namespace    https://userjs.khuong.dev
// @version      0.0.1-dev
// @description  Development version - loads from local dev server
// @author       Lam Ngoc Khuong
// @match        https://example.com/*
// @require      http://localhost:5173/scripts/category/your-script.user.js
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

// Wrapper only - actual code loaded via @require from local dev server
// Start dev server with: pnpm dev
```

**Naming convention:** `*.dev.user.js` files are gitignored.

### 3. Install Wrapper in Tampermonkey

1. Open Tampermonkey → Create new script
2. Copy contents from your `.dev.user.js` file
3. Save (Ctrl+S)

### Alternative: File URL (No Server)

If you prefer not running a dev server, enable file access:

**Chrome/Edge (Tampermonkey):**

1. Go to `chrome://extensions`
2. Find Tampermonkey → Click "Details"
3. Enable "Allow access to file URLs"

**Firefox (Tampermonkey):**

1. Go to `about:addons`
2. Click Tampermonkey → Permissions
3. Enable "Access your data for all websites"

Then use `file://` URL in `@require`:

```javascript
// @require      file:///path/to/userjs/scripts/category/your-script.user.js
```

## Testing Approaches

### Approach 1: Local Server (Recommended)

**Workflow:**

1. Start dev server: `pnpm dev`
2. Install dev wrapper in Tampermonkey
3. Edit script in IDE → Save → Refresh target page

**Pros:** No browser permission needed, reliable

**Cons:** Server must be running

### Approach 2: File URL

**Workflow:**

1. Enable file URL access in browser
2. Use `file://` path in `@require`
3. Edit script in IDE → Save → Refresh target page

**Pros:** No server needed

**Cons:** Requires browser permission, may have security restrictions

### Approach 3: Tampermonkey Editor

**Workflow:**

1. Open Tampermonkey Dashboard
2. Create/Edit script directly
3. Ctrl+S to save
4. Page auto-reloads (if enabled)

**Pros:** Zero setup, instant feedback

**Cons:** Code not synced with file system

## Debugging

### Console Logging

Add debug logs to your script:

```javascript
const DEBUG = true;

function log(...args) {
  if (DEBUG) console.log("[ScriptName]", ...args);
}

log("Script initialized");
log("Found elements:", elements.length);
```

### Browser DevTools

1. Press F12 to open DevTools
2. Go to Console tab for logs/errors
3. Go to Sources tab for breakpoints
4. Go to Network tab for request monitoring

### Setting Breakpoints

1. Open DevTools → Sources
2. Press Ctrl+P → Search for your script name
3. Click line number to set breakpoint
4. Refresh page to trigger

### Disable Cache

When DevTools is open:

1. Go to Network tab
2. Check "Disable cache"
3. This ensures fresh script loads

## Common Issues

### Script Not Loading

| Symptom             | Cause                  | Solution               |
| ------------------- | ---------------------- | ---------------------- |
| No console output   | File path wrong        | Check `@require` path  |
| 404 in console      | File access disabled   | Enable file URL access |
| Script not matching | `@match` pattern wrong | Fix URL pattern        |

### Script Errors

| Error                  | Cause             | Solution                      |
| ---------------------- | ----------------- | ----------------------------- |
| `GM_* is not defined`  | Missing `@grant`  | Add required grants           |
| `Cannot read property` | Element not found | Add null checks               |
| `Unexpected token`     | Syntax error      | Check console for line number |

### Timing Issues

If script runs before DOM is ready:

```javascript
// Wait for DOMContentLoaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

// Or wait for specific element
function waitForElement(selector, callback, maxAttempts = 50) {
  let attempts = 0;
  const interval = setInterval(() => {
    const element = document.querySelector(selector);
    if (element || attempts >= maxAttempts) {
      clearInterval(interval);
      if (element) callback(element);
    }
    attempts++;
  }, 100);
}
```

## Test File Template

Create test HTML/MD files to test your script:

```markdown
# Test Document

## Features to Test

### Basic Formatting

**Bold**, _italic_, `code`

### Code Block

\`\`\`javascript function hello() { console.log('Hello'); } \`\`\`

### Table

| Header 1 | Header 2 |
| -------- | -------- |
| Cell 1   | Cell 2   |

### Math (if supported)

$E = mc^2$

### Mermaid (if supported)

\`\`\`mermaid graph TD A --> B \`\`\`
```

## Quick Reference

### Development Cycle

```bash
pnpm dev                    # Start dev server (once)
Edit → Save → Refresh → Test → Repeat
```

### Useful Console Commands

```javascript
// Check if script loaded
console.log(typeof YourMainFunction);

// Inspect GM storage
GM_getValue("key");

// Manual trigger
YourMainFunction();
```

### Performance Check

```javascript
console.time("render");
// ... your code ...
console.timeEnd("render");
```

## Checklist Before Commit

- [ ] Remove or disable DEBUG flag
- [ ] Test on all `@match` patterns
- [ ] Test with cache disabled
- [ ] Check console for errors
- [ ] Verify GM storage works
- [ ] Test edge cases (empty content, large files)
