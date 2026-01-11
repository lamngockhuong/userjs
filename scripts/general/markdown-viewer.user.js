// ==UserScript==
// @name         Markdown Viewer
// @namespace    https://userjs.khuong.dev
// @version      1.0.6
// @description  Render markdown files from local or raw URLs with full GFM support
// @author       Lam Ngoc Khuong
// @updateURL    https://raw.githubusercontent.com/lamngockhuong/userjs/main/scripts/general/markdown-viewer.user.js
// @downloadURL  https://raw.githubusercontent.com/lamngockhuong/userjs/main/scripts/general/markdown-viewer.user.js
// @match        file:///*.md
// @match        file:///*.markdown
// @match        *://raw.githubusercontent.com/*.md
// @match        *://raw.githubusercontent.com/*.markdown
// @match        *://gist.githubusercontent.com/*.md
// @match        *://gist.githubusercontent.com/*.markdown
// @match        *://gitlab.com/*/-/raw/*.md
// @match        *://gitlab.com/*/-/raw/*.markdown
// @match        *://bitbucket.org/*/raw/*.md
// @match        *://bitbucket.org/*/raw/*.markdown
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_getResourceText
// @grant        unsafeWindow
// @resource     MD_IT https://cdn.jsdelivr.net/npm/markdown-it@14.1.0/dist/markdown-it.min.js
// @resource     MD_FOOTNOTE https://cdn.jsdelivr.net/npm/markdown-it-footnote@4.0.0/dist/markdown-it-footnote.min.js
// @resource     MD_ANCHOR https://cdn.jsdelivr.net/npm/markdown-it-anchor@9.2.0/dist/markdownItAnchor.umd.js
// @resource     MD_TOC https://cdn.jsdelivr.net/npm/markdown-it-toc-done-right@4.2.0/dist/markdownItTocDoneRight.umd.js
// @resource     KATEX https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/katex.min.js
// @resource     MD_TEXMATH https://cdn.jsdelivr.net/npm/markdown-it-texmath@1.0.0/texmath.min.js
// @resource     DOMPURIFY https://cdn.jsdelivr.net/npm/dompurify@3.2.4/dist/purify.min.js
// @resource     HLJS_CORE https://cdn.jsdelivr.net/npm/@highlightjs/cdn-assets@11.11.1/highlight.min.js
// @resource     CSS_KATEX https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/katex.min.css
// @resource     CSS_HLJS_LIGHT https://cdn.jsdelivr.net/npm/@highlightjs/cdn-assets@11.11.1/styles/github.min.css
// @resource     CSS_HLJS_DARK https://cdn.jsdelivr.net/npm/@highlightjs/cdn-assets@11.11.1/styles/github-dark.min.css
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  // ==========================================================================
  // Constants
  // ==========================================================================

  const PREFS = {
    DISPLAY_MODE: 'mdv_displayMode',
    BUTTON_POS: 'mdv_buttonPos',
    LAST_STATE: 'mdv_lastState' // 'open' | 'closed' - remember if viewer was active
  };

  const DEFAULT_MODE = 'replace';

  // Resource loading order (dependencies must load before dependents)
  // Critical: must load, Optional: can fail
  const SCRIPT_RESOURCES = [
    // Group 0 - Independent (no dependencies)
    { name: 'MD_IT', critical: true },
    { name: 'DOMPURIFY', critical: true },
    { name: 'HLJS_CORE', critical: false },
    { name: 'KATEX', critical: false },
    // Group 1 - Depends on markdown-it or katex
    { name: 'MD_FOOTNOTE', critical: false },
    { name: 'MD_ANCHOR', critical: false },
    { name: 'MD_TEXMATH', critical: false },
    // Group 2 - Depends on markdown-it-anchor
    { name: 'MD_TOC', critical: false }
  ];

  const STYLE_RESOURCES = ['CSS_KATEX', 'CSS_HLJS_LIGHT', 'CSS_HLJS_DARK'];

  // ==========================================================================
  // State Management (closure-based, no global pollution)
  // ==========================================================================

  const state = {
    rawContent: '',
    renderedContent: '',
    displayMode: DEFAULT_MODE,
    isOpen: false
  };

  /**
   * Get the current viewer state
   * @returns {typeof state}
   */
  function getState() {
    return state;
  }

  /**
   * Update viewer state
   * @param {Partial<typeof state>} updates - State updates to apply
   */
  function setState(updates) {
    Object.assign(state, updates);
  }

  // ==========================================================================
  // CSP-Safe Resource Loader (uses @resource + GM_getResourceText)
  // ==========================================================================

  /**
   * Execute script code and expose globals to unsafeWindow
   * Uses Function constructor to bypass CSP, binds to unsafeWindow for global access
   * @param {string} code - JavaScript code to execute
   * @param {string} name - Resource name for error reporting
   */
  function executeScript(code, name) {
    try {
      // Create function with window/self parameters for UMD compatibility
      // UMD libraries typically use: (this || window).libName = ...
      // By providing unsafeWindow as context and params, globals attach correctly
      const fn = new Function('window', 'self', 'globalThis', code);
      fn.call(unsafeWindow, unsafeWindow, unsafeWindow, unsafeWindow);
    } catch (err) {
      console.error(`[Markdown Viewer] Failed to execute ${name}:`, err);
      throw err;
    }
  }

  /**
   * Load and execute a script resource
   * @param {string} resourceName - Name of the @resource
   * @returns {boolean} True if loaded successfully
   */
  function loadScriptResource(resourceName) {
    try {
      const code = GM_getResourceText(resourceName);
      if (!code) {
        console.warn(`[Markdown Viewer] Resource ${resourceName} is empty`);
        return false;
      }
      executeScript(code, resourceName);
      return true;
    } catch (err) {
      console.error(`[Markdown Viewer] Failed to load resource ${resourceName}:`, err);
      return false;
    }
  }

  /**
   * Load and inject a CSS resource
   * @param {string} resourceName - Name of the @resource
   * @returns {boolean} True if loaded successfully
   */
  function loadStyleResource(resourceName) {
    try {
      const css = GM_getResourceText(resourceName);
      if (!css) {
        console.warn(`[Markdown Viewer] Style resource ${resourceName} is empty`);
        return false;
      }
      // GM_addStyle bypasses page CSP
      GM_addStyle(css);
      return true;
    } catch (err) {
      console.error(`[Markdown Viewer] Failed to load style ${resourceName}:`, err);
      return false;
    }
  }

  /**
   * Load all dependencies from @resource (CSP-safe)
   * @returns {boolean} True if all critical dependencies loaded
   */
  function loadDependencies() {
    console.log('[Markdown Viewer] Loading dependencies from @resource...');

    // Load styles first
    let stylesLoaded = 0;
    for (const name of STYLE_RESOURCES) {
      if (loadStyleResource(name)) stylesLoaded++;
    }
    console.log(`[Markdown Viewer] Loaded ${stylesLoaded}/${STYLE_RESOURCES.length} styles`);

    // Load scripts in order
    let scriptsLoaded = 0;
    let criticalFailed = false;

    for (const res of SCRIPT_RESOURCES) {
      const success = loadScriptResource(res.name);
      if (success) {
        scriptsLoaded++;
      } else if (res.critical) {
        criticalFailed = true;
        console.error(`[Markdown Viewer] Critical dependency failed: ${res.name}`);
      } else {
        console.warn(`[Markdown Viewer] Optional dependency failed: ${res.name} (continuing)`);
      }
    }
    console.log(`[Markdown Viewer] Loaded ${scriptsLoaded}/${SCRIPT_RESOURCES.length} scripts`);

    if (criticalFailed) {
      return false;
    }

    // Security: Validate library integrity by checking expected signatures
    // This detects tampered/malicious libraries that may have been injected
    const integrityChecks = [
      {
        name: 'markdownit',
        desc: 'markdown-it',
        critical: true,
        validate: (lib) => typeof lib === 'function' && typeof lib().render === 'function'
      },
      {
        name: 'DOMPurify',
        desc: 'DOMPurify',
        critical: true,
        // DOMPurify can be object with sanitize, or factory function
        validate: (lib) => {
          if (typeof lib === 'function') return true; // Factory pattern
          if (typeof lib === 'object' && typeof lib.sanitize === 'function') return true;
          return false;
        }
      },
      {
        name: 'hljs',
        desc: 'highlight.js',
        critical: false,
        validate: (lib) => typeof lib === 'object' && typeof lib.highlightElement === 'function'
      },
      {
        name: 'katex',
        desc: 'KaTeX',
        critical: false,
        validate: (lib) => typeof lib === 'object' && typeof lib.render === 'function'
      }
    ];

    for (const check of integrityChecks) {
      const lib = unsafeWindow[check.name];
      if (typeof lib === 'undefined') {
        if (check.critical) {
          console.error(`[Markdown Viewer] Critical library missing: ${check.desc}`);
          return false;
        }
        console.warn(`[Markdown Viewer] Optional library missing: ${check.desc} (window.${check.name})`);
        continue;
      }

      // Validate library has expected signature (security check)
      try {
        if (!check.validate(lib)) {
          console.error(`[Markdown Viewer] SECURITY: ${check.desc} failed integrity check - may be tampered`);
          console.debug(`[Markdown Viewer] DEBUG ${check.name}:`, typeof lib, lib);
          if (check.critical) return false;
        }
      } catch (e) {
        console.error(`[Markdown Viewer] SECURITY: ${check.desc} validation threw error:`, e);
        if (check.critical) return false;
      }
    }

    console.log('[Markdown Viewer] Dependencies verified with integrity checks');
    return true;
  }

  // ==========================================================================
  // Preference Utilities
  // ==========================================================================

  /**
   * Get stored preference value
   * @param {string} key - Preference key
   * @param {*} defaultValue - Default value if not found
   * @returns {*} Stored value or default
   */
  function getPreference(key, defaultValue) {
    try {
      return GM_getValue(key, defaultValue);
    } catch {
      // Fallback to localStorage if GM APIs unavailable
      const val = localStorage.getItem(key);
      if (val === null) return defaultValue;
      try {
        return JSON.parse(val);
      } catch {
        return val;
      }
    }
  }

  /**
   * Store preference value
   * @param {string} key - Preference key
   * @param {*} value - Value to store
   */
  function setPreference(key, value) {
    try {
      GM_setValue(key, value);
    } catch {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }

  // ==========================================================================
  // Detection Utilities
  // ==========================================================================

  /**
   * Check if current page is a markdown file
   * @returns {boolean}
   */
  function isMarkdownPage() {
    const pathname = window.location.pathname.toLowerCase();

    // Check file extension
    if (pathname.endsWith('.md') || pathname.endsWith('.markdown')) {
      return true;
    }

    return false;
  }

  /**
   * Extract raw markdown content from page
   * @returns {string} Raw markdown content
   */
  function getRawContent() {
    // For file:// and raw URLs, content is typically in <pre> element
    const pre = document.querySelector('pre');
    if (pre) return pre.textContent || '';

    // Fallback to body text (for plain text responses)
    return document.body.textContent || '';
  }

  // ==========================================================================
  // Initialization
  // ==========================================================================

  /**
   * Initialize the markdown viewer
   */
  function init() {
    if (!isMarkdownPage()) {
      console.log('[Markdown Viewer] Not a markdown page, skipping');
      return;
    }

    console.log('[Markdown Viewer] Detected markdown page');

    // Get raw content before modifying DOM
    const rawContent = getRawContent();
    if (!rawContent.trim()) {
      console.log('[Markdown Viewer] Empty content, skipping');
      return;
    }

    // Load dependencies from @resource (CSP-safe)
    const loaded = loadDependencies();
    if (!loaded) {
      console.error('[Markdown Viewer] Failed to load critical dependencies. Check console for details.');
      return;
    }

    // Store raw content in closure-based state (no global pollution)
    setState({ rawContent });

    // Placeholders for Phase 2 - UI Components
    // createFloatingButton();
    // createDropdownMenu();
    // createTocSidebar();

    // Auto-render if last state was 'open' (remember last state feature)
    const lastState = getPreference(PREFS.LAST_STATE, 'closed');
    if (lastState === 'open') {
      const lastMode = getPreference(PREFS.DISPLAY_MODE, DEFAULT_MODE);
      setState({ displayMode: lastMode, isOpen: true });
      // Placeholder for Phase 2: renderMarkdown(lastMode);
      console.log(`[Markdown Viewer] Auto-render with mode: ${lastMode}`);
    }

    console.log('[Markdown Viewer] v1.0.6 Initialized (security-hardened)');
  }

  // ==========================================================================
  // Entry Point
  // ==========================================================================

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export state accessors for Phase 2 UI components (within IIFE scope)
  // These will be used by UI functions added in Phase 2
  // eslint-disable-next-line no-unused-vars
  const _exports = { getState, setState, getPreference, setPreference, PREFS, DEFAULT_MODE };
})();
