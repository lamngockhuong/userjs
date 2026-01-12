// ==UserScript==
// @name         Markdown Viewer
// @namespace    https://userjs.khuong.dev
// @version      1.4.0
// @description  Render and edit markdown files from local or raw URLs with full GFM support
// @author       Lam Ngoc Khuong
// @icon         https://cdn.simpleicons.org/markdown
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
// @grant        GM_getResourceURL
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @connect      cdn.jsdelivr.net
// @resource     MD_IT https://cdn.jsdelivr.net/npm/markdown-it@14.1.0/dist/markdown-it.min.js
// @resource     MD_FOOTNOTE https://cdn.jsdelivr.net/npm/markdown-it-footnote@4.0.0/dist/markdown-it-footnote.min.js
// @resource     MD_ANCHOR https://cdn.jsdelivr.net/npm/markdown-it-anchor@9.2.0/dist/markdownItAnchor.umd.js
// @resource     MD_TOC https://cdn.jsdelivr.net/npm/markdown-it-toc-done-right@4.2.0/dist/markdownItTocDoneRight.umd.js
// @resource     KATEX https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/katex.min.js
// @resource     MD_TEXMATH https://cdn.jsdelivr.net/npm/markdown-it-texmath@1.0.0/texmath.min.js
// @resource     DOMPURIFY https://cdn.jsdelivr.net/npm/dompurify@3.2.4/dist/purify.min.js
// @resource     HLJS_CORE https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/highlight.min.js
// @resource     MERMAID https://cdn.jsdelivr.net/npm/mermaid@10.9.0/dist/mermaid.min.js
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
    LAST_STATE: 'mdv_lastState', // 'open' | 'closed' - remember if viewer was active
    THEME: 'mdv_theme' // 'light' | 'dark' | 'auto' - theme preference
  };

  const THEMES = {
    AUTO: 'auto',
    LIGHT: 'light',
    DARK: 'dark'
  };

  const DEFAULT_MODE = 'replace';

  // UI Element IDs
  const UI_IDS = {
    BUTTON: 'mdv-floating-btn',
    DROPDOWN: 'mdv-dropdown',
    REPLACE: 'mdv-replace-container',
    SPLIT: 'mdv-split-container',
    MODAL: 'mdv-modal-container',
    TOC: 'mdv-toc-sidebar',
    HELP: 'mdv-help-modal',
    EDITOR: 'mdv-editor-container'
  };

  // Resource loading order (dependencies must load before dependents)
  // Critical: must load, Optional: can fail
  const SCRIPT_RESOURCES = [
    // Group 0 - Independent (no dependencies)
    { name: 'MD_IT', critical: true },
    { name: 'DOMPURIFY', critical: true },
    { name: 'HLJS_CORE', critical: false },
    { name: 'KATEX', critical: false },
    { name: 'MERMAID', critical: false },
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
    isOpen: false,
    originalBody: null,
    currentMode: null,
    isDragging: false,
    theme: THEMES.AUTO,
    isEditing: false,
    editedContent: '',
    hasUnsavedChanges: false
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

  // Global references for libraries (accessible in sandbox)
  let markdownit, DOMPurify, hljs, katex, texmath, mermaid;
  let markdownitFootnote, markdownItAnchor, markdownItTocDoneRight;

  // Storage for libraries when eval is used (CSP sites)
  const evalLibraries = {};

  /**
   * Execute script code - tries script tag first, falls back to eval for CSP sites
   * @param {string} code - JavaScript code to execute
   * @param {string} name - Resource name for error reporting
   */
  function executeScript(code, name) {
    try {
      // Try script tag injection first (works for non-CSP sites)
      const script = document.createElement('script');
      script.textContent = code;
      (document.head || document.documentElement).appendChild(script);
      script.remove();
    } catch (err) {
      console.error(`[Markdown Viewer] Failed to execute ${name}:`, err);
      throw err;
    }
  }

  /**
   * Execute script code using eval (for CSP-protected sites)
   * UMD libraries detect module/exports and use CommonJS mode
   * @param {string} code - JavaScript code to execute
   * @param {string} name - Resource name for error reporting
   * @param {string} globalName - Expected global name the library creates
   */
  function executeScriptWithEval(code, name, globalName) {
    try {
      // Create fake CommonJS environment - UMD will detect this and use it
      const fakeModule = { exports: {} };

      // Create function with module/exports parameters
      // UMD pattern: if (typeof exports === 'object' && typeof module !== 'undefined')
      // This makes UMD use CommonJS mode and assign to module.exports
      const fn = new Function('module', 'exports', code);
      fn(fakeModule, fakeModule.exports);

      // Get result - could be function, object, or assigned to exports
      const result = fakeModule.exports;
      const resultType = typeof result;


      // Check if we got something useful
      if (result && (resultType === 'function' || (resultType === 'object' && Object.keys(result).length > 0))) {
        evalLibraries[globalName] = result;
      } else if (result && resultType === 'object' && result.default) {
        // ES module style default export
        evalLibraries[globalName] = result.default;
      } else {
      }
    } catch (err) {
      console.error(`[Markdown Viewer] Failed to execute ${name} via eval:`, err);
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
      let css = GM_getResourceText(resourceName);
      if (!css) {
        return false;
      }

      // For KaTeX CSS, we'll inject custom @font-face rules separately
      // Remove the original font references as they'll be blocked by CSP
      if (resourceName === 'CSS_KATEX') {
        // Remove @font-face rules from original CSS (we'll inject our own)
        css = css.replace(/@font-face\s*\{[^}]+\}/g, '');
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
   * KaTeX font configuration - URLs and font-face properties
   */
  const KATEX_FONT_BASE = 'https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/fonts';
  const KATEX_FONTS = [
    { file: 'KaTeX_Main-Regular.woff2', family: 'KaTeX_Main', weight: 'normal', style: 'normal' },
    { file: 'KaTeX_Main-Bold.woff2', family: 'KaTeX_Main', weight: 'bold', style: 'normal' },
    { file: 'KaTeX_Main-Italic.woff2', family: 'KaTeX_Main', weight: 'normal', style: 'italic' },
    { file: 'KaTeX_Main-BoldItalic.woff2', family: 'KaTeX_Main', weight: 'bold', style: 'italic' },
    { file: 'KaTeX_Math-Italic.woff2', family: 'KaTeX_Math', weight: 'normal', style: 'italic' },
    { file: 'KaTeX_Math-BoldItalic.woff2', family: 'KaTeX_Math', weight: 'bold', style: 'italic' },
    { file: 'KaTeX_Size1-Regular.woff2', family: 'KaTeX_Size1', weight: 'normal', style: 'normal' },
    { file: 'KaTeX_Size2-Regular.woff2', family: 'KaTeX_Size2', weight: 'normal', style: 'normal' },
    { file: 'KaTeX_Size3-Regular.woff2', family: 'KaTeX_Size3', weight: 'normal', style: 'normal' },
    { file: 'KaTeX_Size4-Regular.woff2', family: 'KaTeX_Size4', weight: 'normal', style: 'normal' },
    { file: 'KaTeX_AMS-Regular.woff2', family: 'KaTeX_AMS', weight: 'normal', style: 'normal' },
    { file: 'KaTeX_Caligraphic-Regular.woff2', family: 'KaTeX_Caligraphic', weight: 'normal', style: 'normal' },
    { file: 'KaTeX_Caligraphic-Bold.woff2', family: 'KaTeX_Caligraphic', weight: 'bold', style: 'normal' },
    { file: 'KaTeX_Fraktur-Regular.woff2', family: 'KaTeX_Fraktur', weight: 'normal', style: 'normal' },
    { file: 'KaTeX_Fraktur-Bold.woff2', family: 'KaTeX_Fraktur', weight: 'bold', style: 'normal' },
    { file: 'KaTeX_SansSerif-Regular.woff2', family: 'KaTeX_SansSerif', weight: 'normal', style: 'normal' },
    { file: 'KaTeX_SansSerif-Bold.woff2', family: 'KaTeX_SansSerif', weight: 'bold', style: 'normal' },
    { file: 'KaTeX_SansSerif-Italic.woff2', family: 'KaTeX_SansSerif', weight: 'normal', style: 'italic' },
    { file: 'KaTeX_Script-Regular.woff2', family: 'KaTeX_Script', weight: 'normal', style: 'normal' },
    { file: 'KaTeX_Typewriter-Regular.woff2', family: 'KaTeX_Typewriter', weight: 'normal', style: 'normal' }
  ];

  /**
   * Fetch a font file via GM_xmlhttpRequest and return ArrayBuffer
   * @param {string} url - Font URL
   * @returns {Promise<ArrayBuffer>} Font data as ArrayBuffer
   */
  function fetchFontAsArrayBuffer(url) {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: 'GET',
        url: url,
        responseType: 'arraybuffer',
        onload: (response) => {
          if (response.status === 200) {
            resolve(response.response);
          } else {
            reject(new Error(`HTTP ${response.status}`));
          }
        },
        onerror: (err) => reject(err)
      });
    });
  }

  /**
   * Load KaTeX fonts via JavaScript FontFace API
   * This bypasses CSP by loading fonts programmatically instead of via CSS
   */
  async function loadKaTeXFonts() {
    if (typeof GM_xmlhttpRequest !== 'function' || typeof FontFace !== 'function') {
      return;
    }

    // Load fonts in parallel
    const promises = KATEX_FONTS.map(async (font) => {
      try {
        const url = `${KATEX_FONT_BASE}/${font.file}`;
        const buffer = await fetchFontAsArrayBuffer(url);
        const fontFace = new FontFace(font.family, buffer, {
          weight: font.weight,
          style: font.style,
          display: 'swap'
        });
        await fontFace.load();
        document.fonts.add(fontFace);
      } catch {
        // Silently fail - font will use fallback
      }
    });

    await Promise.all(promises);
  }

  /**
   * Load all dependencies from @resource (CSP-safe)
   * @returns {Promise<boolean>} True if all critical dependencies loaded
   */
  async function loadDependencies() {

    // Load styles first
    let stylesLoaded = 0;
    for (const name of STYLE_RESOURCES) {
      if (loadStyleResource(name)) stylesLoaded++;
    }

    // Load KaTeX fonts via blob URLs (CSP-safe) - don't await, load in background
    loadKaTeXFonts().catch(() => {});

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
      }
    }

    if (criticalFailed) {
      return false;
    }

    // Check unsafeWindow first (script tag injection exposes libraries there)

    // Check if script tag injection worked (libraries on unsafeWindow)
    const scriptTagWorked = typeof unsafeWindow.markdownit === 'function';

    if (scriptTagWorked) {
      markdownit = unsafeWindow.markdownit;
      DOMPurify = unsafeWindow.DOMPurify;
      hljs = unsafeWindow.hljs;
      katex = unsafeWindow.katex;
      texmath = unsafeWindow.texmath;
      mermaid = unsafeWindow.mermaid;
      markdownitFootnote = unsafeWindow.markdownitFootnote;
      markdownItAnchor = unsafeWindow.markdownItAnchor;
      markdownItTocDoneRight = unsafeWindow.markdownItTocDoneRight;
    } else {
      // CSP blocked script tags, fall back to eval method

      // Mapping of resource names to global names
      const resourceToGlobal = {
        MD_IT: 'markdownit',
        DOMPURIFY: 'DOMPurify',
        HLJS_CORE: 'hljs',
        KATEX: 'katex',
        MD_TEXMATH: 'texmath',
        MERMAID: 'mermaid',
        MD_FOOTNOTE: 'markdownitFootnote',
        MD_ANCHOR: 'markdownItAnchor',
        MD_TOC: 'markdownItTocDoneRight'
      };

      // Re-execute all scripts with eval method
      for (const res of SCRIPT_RESOURCES) {
        try {
          const code = GM_getResourceText(res.name);
          if (code) {
            const globalName = resourceToGlobal[res.name];
            if (globalName) {
              executeScriptWithEval(code, res.name, globalName);
            }
          }
        } catch (err) {
        }
      }


      // Assign from evalLibraries
      markdownit = evalLibraries.markdownit;
      DOMPurify = evalLibraries.DOMPurify;
      hljs = evalLibraries.hljs;
      katex = evalLibraries.katex;
      texmath = evalLibraries.texmath;
      mermaid = evalLibraries.mermaid;
      markdownitFootnote = evalLibraries.markdownitFootnote;
      markdownItAnchor = evalLibraries.markdownItAnchor;
      markdownItTocDoneRight = evalLibraries.markdownItTocDoneRight;
    }

    // Security: Validate library integrity by checking expected signatures
    const integrityChecks = [
      {
        name: 'markdownit',
        lib: markdownit,
        desc: 'markdown-it',
        critical: true,
        validate: (lib) => typeof lib === 'function' && typeof lib().render === 'function'
      },
      {
        name: 'DOMPurify',
        lib: DOMPurify,
        desc: 'DOMPurify',
        critical: true,
        validate: (lib) => {
          if (typeof lib === 'function') return true;
          if (typeof lib === 'object' && typeof lib.sanitize === 'function') return true;
          return false;
        }
      },
      {
        name: 'hljs',
        lib: hljs,
        desc: 'highlight.js',
        critical: false,
        validate: (lib) => typeof lib === 'object' && typeof lib.highlightElement === 'function'
      },
      {
        name: 'katex',
        lib: katex,
        desc: 'KaTeX',
        critical: false,
        validate: (lib) => typeof lib === 'object' && typeof lib.render === 'function'
      },
      {
        name: 'mermaid',
        lib: mermaid,
        desc: 'Mermaid',
        critical: false,
        validate: (lib) => typeof lib === 'object' && typeof lib.initialize === 'function'
      }
    ];

    for (const check of integrityChecks) {
      const lib = check.lib;
      if (typeof lib === 'undefined') {
        if (check.critical) {
          console.error(`[Markdown Viewer] Critical library missing: ${check.desc}`);
          return false;
        }
        continue;
      }

      // Validate library has expected signature (security check)
      try {
        if (!check.validate(lib)) {
          console.error(`[Markdown Viewer] SECURITY: ${check.desc} failed integrity check - may be tampered`);
          if (check.critical) return false;
        }
      } catch (e) {
        console.error(`[Markdown Viewer] SECURITY: ${check.desc} validation threw error:`, e);
        if (check.critical) return false;
      }
    }

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
  // Theme Management
  // ==========================================================================

  /**
   * Get the current effective theme (resolves 'auto' to actual theme)
   * @returns {'light' | 'dark'}
   */
  function getEffectiveTheme() {
    if (state.theme === THEMES.AUTO) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return state.theme;
  }

  /**
   * Apply theme to document
   * @param {'light' | 'dark' | 'auto'} theme
   */
  function applyTheme(theme) {
    state.theme = theme;
    setPreference(PREFS.THEME, theme);

    const effectiveTheme = getEffectiveTheme();
    document.documentElement.setAttribute('data-mdv-theme', effectiveTheme);

    // Update theme toggle button icon if exists
    updateThemeToggleIcon();
  }

  /**
   * Cycle through themes: auto -> light -> dark -> auto
   */
  function cycleTheme() {
    const order = [THEMES.AUTO, THEMES.LIGHT, THEMES.DARK];
    const currentIndex = order.indexOf(state.theme);
    const nextIndex = (currentIndex + 1) % order.length;
    applyTheme(order[nextIndex]);
  }

  /**
   * Get theme icon and label
   * @param {'light' | 'dark' | 'auto'} theme
   */
  function getThemeInfo(theme) {
    const info = {
      [THEMES.AUTO]: { icon: '🔄', label: 'Auto (System)' },
      [THEMES.LIGHT]: { icon: '☀️', label: 'Light' },
      [THEMES.DARK]: { icon: '🌙', label: 'Dark' }
    };
    return info[theme] || info[THEMES.AUTO];
  }

  /**
   * Update theme toggle button icon in dropdown
   */
  function updateThemeToggleIcon() {
    const themeBtn = document.getElementById('mdv-theme-toggle');
    if (themeBtn) {
      const info = getThemeInfo(state.theme);
      themeBtn.innerHTML = `<span style="width:20px;display:inline-block">${info.icon}</span> Theme: ${info.label}`;
    }
  }

  /**
   * Listen for system theme changes (when in auto mode)
   */
  function setupThemeListener() {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (state.theme === THEMES.AUTO) {
        applyTheme(THEMES.AUTO); // Re-apply to update effective theme
      }
    });
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
   * Check if current page is a local file (file:// protocol)
   * @returns {boolean}
   */
  function isLocalFile() {
    return window.location.protocol === 'file:';
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
  // UI Components - Floating Button
  // ==========================================================================

  /**
   * Create the floating button with Markdown icon
   */
  function createFloatingButton() {
    // Remove existing button if any
    const existing = document.getElementById(UI_IDS.BUTTON);
    if (existing) existing.remove();

    const btn = document.createElement('button');
    btn.id = UI_IDS.BUTTON;
    btn.setAttribute('aria-label', 'Markdown Viewer');
    btn.setAttribute('aria-haspopup', 'true');
    btn.setAttribute('aria-expanded', 'false');

    // Markdown icon SVG
    btn.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 208 128" fill="currentColor">
        <rect x="5" y="5" width="198" height="118" rx="10" fill="none" stroke="currentColor" stroke-width="10"/>
        <path d="M30 98V30h20l20 25 20-25h20v68H90V59L70 84 50 59v39zm125 0l-30-33h20V30h20v35h20z"/>
      </svg>
    `;

    // Position from preferences or default
    const pos = getPreference(PREFS.BUTTON_POS, { right: 20, bottom: 20 });
    Object.assign(btn.style, {
      position: 'fixed',
      right: `${pos.right}px`,
      bottom: `${pos.bottom}px`,
      zIndex: '999999',
      width: '48px',
      height: '48px',
      borderRadius: '50%',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      transition: 'transform 0.2s, box-shadow 0.2s',
      background: '#4a5568',
      color: '#fff'
    });

    btn.addEventListener('click', (e) => {
      if (!state.isDragging) {
        toggleDropdown();
      }
    });

    makeDraggable(btn);
    document.body.appendChild(btn);
    return btn;
  }

  /**
   * Make an element draggable with position persistence
   */
  function makeDraggable(element) {
    let startX, startY, startRight, startBottom;
    let hasMoved = false;

    element.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return; // Left click only
      hasMoved = false;
      state.isDragging = false;
      startX = e.clientX;
      startY = e.clientY;
      const rect = element.getBoundingClientRect();
      startRight = window.innerWidth - rect.right;
      startBottom = window.innerHeight - rect.bottom;

      const onMove = (e) => {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
          hasMoved = true;
          state.isDragging = true;
        }

        if (hasMoved) {
          const newRight = Math.max(0, startRight - dx);
          const newBottom = Math.max(0, startBottom - dy);
          element.style.right = `${newRight}px`;
          element.style.bottom = `${newBottom}px`;
          element.style.left = 'auto';
          element.style.top = 'auto';
        }
      };

      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);

        if (hasMoved) {
          // Save position
          const rect = element.getBoundingClientRect();
          setPreference(PREFS.BUTTON_POS, {
            right: window.innerWidth - rect.right,
            bottom: window.innerHeight - rect.bottom
          });
        }

        // Reset drag state after a short delay to allow click to be processed
        setTimeout(() => {
          state.isDragging = false;
        }, 50);
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  }

  // ==========================================================================
  // UI Components - Dropdown Menu
  // ==========================================================================

  /**
   * Create dropdown menu with display mode options
   */
  function createDropdownMenu() {
    // Remove existing dropdown if any
    const existing = document.getElementById(UI_IDS.DROPDOWN);
    if (existing) existing.remove();

    const dropdown = document.createElement('div');
    dropdown.id = UI_IDS.DROPDOWN;
    dropdown.setAttribute('role', 'menu');
    Object.assign(dropdown.style, {
      position: 'fixed',
      zIndex: '999998',
      minWidth: '160px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      overflow: 'hidden',
      display: 'none',
      background: '#fff'
    });

    const modes = [
      { id: 'replace', label: 'Replace Page', icon: '📄' },
      { id: 'split', label: 'Split View', icon: '◧' },
      { id: 'modal', label: 'Modal View', icon: '⬜' }
    ];

    modes.forEach(mode => {
      const item = createMenuItem(mode.icon, mode.label, () => {
        setDisplayMode(mode.id);
        hideDropdown();
      });
      dropdown.appendChild(item);
    });

    // Separator
    const sep1 = document.createElement('div');
    sep1.style.cssText = 'height: 1px; background: #e2e8f0; margin: 4px 0;';
    dropdown.appendChild(sep1);

    // Edit button (only for local files)
    if (isLocalFile()) {
      const editBtn = createMenuItem('✏️', 'Edit File', () => {
        toggleEditMode();
        hideDropdown();
      });
      editBtn.id = 'mdv-edit-toggle';
      dropdown.appendChild(editBtn);

      const sep1b = document.createElement('div');
      sep1b.style.cssText = 'height: 1px; background: #e2e8f0; margin: 4px 0;';
      dropdown.appendChild(sep1b);
    }

    // Theme toggle button
    const themeInfo = getThemeInfo(state.theme);
    const themeBtn = createMenuItem(themeInfo.icon, `Theme: ${themeInfo.label}`, () => {
      cycleTheme();
    });
    themeBtn.id = 'mdv-theme-toggle';
    dropdown.appendChild(themeBtn);

    // Separator
    const sep2 = document.createElement('div');
    sep2.style.cssText = 'height: 1px; background: #e2e8f0; margin: 4px 0;';
    dropdown.appendChild(sep2);

    // Help button
    const helpBtn = createMenuItem('?', 'Keyboard Shortcuts', () => {
      showHelpModal();
      hideDropdown();
    });
    dropdown.appendChild(helpBtn);

    // Close button
    const closeBtn = createMenuItem('✕', 'Close Viewer', () => {
      closeViewer();
      hideDropdown();
    });
    dropdown.appendChild(closeBtn);

    document.body.appendChild(dropdown);
    return dropdown;
  }

  /**
   * Create a menu item button
   */
  function createMenuItem(icon, label, onClick) {
    const item = document.createElement('button');
    item.setAttribute('role', 'menuitem');
    item.innerHTML = `<span style="width:20px;display:inline-block">${icon}</span> ${label}`;
    Object.assign(item.style, {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      width: '100%',
      padding: '10px 16px',
      border: 'none',
      cursor: 'pointer',
      textAlign: 'left',
      fontSize: '14px',
      background: 'transparent',
      color: '#1a202c'
    });
    item.addEventListener('mouseenter', () => item.style.background = '#f7fafc');
    item.addEventListener('mouseleave', () => item.style.background = 'transparent');
    item.addEventListener('click', onClick);
    return item;
  }

  /**
   * Toggle dropdown visibility
   */
  function toggleDropdown() {
    const dropdown = document.getElementById(UI_IDS.DROPDOWN);
    const btn = document.getElementById(UI_IDS.BUTTON);
    if (!dropdown || !btn) return;

    if (dropdown.style.display === 'none') {
      // Position dropdown above button
      const btnRect = btn.getBoundingClientRect();
      dropdown.style.right = `${window.innerWidth - btnRect.right}px`;
      dropdown.style.bottom = `${window.innerHeight - btnRect.top + 8}px`;
      dropdown.style.display = 'block';
      btn.setAttribute('aria-expanded', 'true');

      // Close on outside click
      setTimeout(() => {
        document.addEventListener('click', hideDropdownOnOutside);
      }, 0);
    } else {
      hideDropdown();
    }
  }

  /**
   * Hide dropdown menu
   */
  function hideDropdown() {
    const dropdown = document.getElementById(UI_IDS.DROPDOWN);
    const btn = document.getElementById(UI_IDS.BUTTON);
    if (dropdown) dropdown.style.display = 'none';
    if (btn) btn.setAttribute('aria-expanded', 'false');
    document.removeEventListener('click', hideDropdownOnOutside);
  }

  /**
   * Hide dropdown when clicking outside
   */
  function hideDropdownOnOutside(e) {
    const dropdown = document.getElementById(UI_IDS.DROPDOWN);
    const btn = document.getElementById(UI_IDS.BUTTON);
    if (dropdown && btn && !dropdown.contains(e.target) && !btn.contains(e.target)) {
      hideDropdown();
    }
  }

  // ==========================================================================
  // UI Components - Display Mode Containers
  // ==========================================================================

  /**
   * Set the display mode and render content
   */
  function setDisplayMode(mode) {
    // Store original body content first time
    if (!state.originalBody) {
      state.originalBody = document.body.innerHTML;
    }

    // Remove existing containers
    closeViewer();

    state.currentMode = mode;
    state.isOpen = true;
    setPreference(PREFS.DISPLAY_MODE, mode);
    setPreference(PREFS.LAST_STATE, 'open');

    // Show loading indicator
    showLoading();

    // Render markdown with full plugin support
    const renderedHTML = renderMarkdown(state.rawContent);

    // Hide loading
    hideLoading();

    let container;
    switch (mode) {
      case 'replace':
        container = createReplaceContainer(renderedHTML);
        break;
      case 'split':
        container = createSplitContainer(state.rawContent, renderedHTML);
        break;
      case 'modal':
        container = createModalContainer(renderedHTML);
        break;
    }

    // Setup keyboard shortcuts
    setupKeyboardShortcuts();

    // Post-render processing
    const contentEl = document.querySelector('.mdv-content');
    if (contentEl) {
      // Add copy buttons to code blocks
      addCopyButtons(contentEl);

      // Render Mermaid diagrams if content has any
      if (hasMermaid(state.rawContent)) {
        renderMermaidDiagrams(contentEl);
      }
    }

    // Create and update TOC sidebar
    createTocSidebar();
    if (contentEl) {
      const headings = extractHeadings(contentEl);
      updateTocSidebar(headings);
      if (headings.length > 0) {
        showTocSidebar();
      }
    }
  }

  // ==========================================================================
  // Content Detection Utilities
  // ==========================================================================

  /**
   * Check if content contains math expressions
   */
  function hasMath(content) {
    // Block: $$...$$ or inline: $...$
    return /\$\$.+?\$\$/s.test(content) || /(?<!\$)\$(?!\$).+?(?<!\$)\$(?!\$)/s.test(content);
  }

  /**
   * Check if content contains footnotes
   */
  function hasFootnotes(content) {
    return /\[\^.+?\]/.test(content);
  }

  /**
   * Check if content contains Mermaid diagrams
   */
  function hasMermaid(content) {
    return /```mermaid/i.test(content);
  }

  // ==========================================================================
  // Markdown Rendering (Phase 3)
  // ==========================================================================

  // Render cache for performance
  const renderCache = new Map();
  let mdInstance = null;

  /**
   * Setup markdown-it instance with all available plugins
   */
  function setupMarkdownIt(raw) {
    const needsMath = hasMath(raw);

    // Create markdown-it instance with highlight.js integration
    const md = markdownit({
      html: true,
      linkify: true,
      typographer: true,
      highlight: function(str, lang) {
        // Use highlight.js if available
        if (lang && hljs) {
          try {
            // Try specific language first
            if (hljs.getLanguage(lang)) {
              return hljs.highlight(str, { language: lang }).value;
            }
            // Fallback to auto-detect
            return hljs.highlightAuto(str).value;
          } catch (e) {
          }
        }
        return ''; // Use default escaping
      }
    });

    // Add footnotes plugin
    if (markdownitFootnote) {
      md.use(markdownitFootnote);
    }

    // Add anchor plugin for heading IDs
    if (markdownItAnchor) {
      md.use(markdownItAnchor, {
        permalink: markdownItAnchor.permalink?.linkInsideHeader?.({
          symbol: '🔗',
          placement: 'before'
        }) || false,
        slugify: slugify
      });
    }

    // Add TOC plugin (requires anchor plugin)
    if (markdownItTocDoneRight) {
      md.use(markdownItTocDoneRight, {
        slugify: slugify,
        listType: 'ul',
        level: [1, 2, 3, 4]
      });
    }

    // Add math support with KaTeX via texmath
    if (needsMath && texmath && katex) {
      md.use(texmath, {
        engine: katex,
        delimiters: 'dollars',
        katexOptions: {
          throwOnError: false,
          displayMode: false
        }
      });
    }

    return md;
  }

  /**
   * Post-process HTML to render math expressions with KaTeX
   * Fallback when texmath plugin is not available
   * @param {string} html - Rendered HTML
   * @returns {string} HTML with rendered math
   */
  function renderMathExpressions(html) {
    if (!katex) return html;

    const katex = katex;

    // Render display math: $$...$$ (block)
    html = html.replace(/\$\$([^$]+)\$\$/g, (match, math) => {
      try {
        return katex.renderToString(math.trim(), {
          displayMode: true,
          throwOnError: false
        });
      } catch (e) {
        return match;
      }
    });

    // Render inline math: $...$ (not preceded or followed by $)
    // Use negative lookbehind/lookahead to avoid matching $$
    html = html.replace(/(?<!\$)\$(?!\$)([^$\n]+?)(?<!\$)\$(?!\$)/g, (match, math) => {
      try {
        return katex.renderToString(math.trim(), {
          displayMode: false,
          throwOnError: false
        });
      } catch (e) {
        return match;
      }
    });

    return html;
  }

  /**
   * Generate slug from text
   */
  function slugify(str) {
    return str
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\u4e00-\u9fff\-]+/g, '') // Keep CJK characters
      .replace(/\-\-+/g, '-');
  }

  /**
   * Render markdown to HTML with full plugin support
   */
  function renderMarkdown(raw) {
    // Check cache
    const cacheKey = raw.length + ':' + raw.substring(0, 100);
    if (renderCache.has(cacheKey)) {
      return renderCache.get(cacheKey);
    }

    // Check if markdown-it is available
    if (typeof markdownit !== 'function') {
      return `<pre style="white-space:pre-wrap">${escapeHTML(raw)}</pre>`;
    }

    try {
      // Setup markdown-it with plugins
      mdInstance = setupMarkdownIt(raw);

      // Render markdown
      let html = mdInstance.render(raw);

      // Post-process math if texmath plugin wasn't available (fallback)
      const needsMath = hasMath(raw);
      if (needsMath && !texmath && katex) {
        html = renderMathExpressions(html);
      }

      // Sanitize with DOMPurify
      if (DOMPurify) {
        const purify = typeof DOMPurify.sanitize === 'function'
          ? DOMPurify
          : DOMPurify(window); // Factory pattern

        html = purify.sanitize(html, {
          ADD_TAGS: ['math', 'mrow', 'mi', 'mo', 'mn', 'msup', 'msub', 'mfrac', 'semantics', 'annotation', 'mtext', 'mspace', 'mover', 'munder', 'span'],
          ADD_ATTR: ['xmlns', 'encoding', 'mathvariant', 'displaystyle', 'scriptlevel', 'class', 'style'],
          ALLOW_DATA_ATTR: true
        });
      }

      // Cache result
      renderCache.set(cacheKey, html);
      return html;
    } catch (err) {
      console.error('[Markdown Viewer] Render error:', err);
      return `<pre style="white-space:pre-wrap">${escapeHTML(raw)}</pre>`;
    }
  }

  // ==========================================================================
  // Mermaid Diagram Rendering
  // ==========================================================================

  let mermaidInitialized = false;

  /**
   * Initialize Mermaid with theme-aware config
   */
  function initMermaid() {
    if (mermaidInitialized || !mermaid) return;

    const isDark = getEffectiveTheme() === 'dark';
    mermaid.initialize({
      startOnLoad: false,
      theme: isDark ? 'dark' : 'default',
      securityLevel: 'loose',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif'
    });
    mermaidInitialized = true;
  }

  /**
   * Render Mermaid diagrams in container
   * @param {HTMLElement} container
   */
  function renderMermaidDiagrams(container) {
    if (!mermaid) return;

    initMermaid();

    // Find all mermaid code blocks (rendered by markdown-it as <pre><code class="language-mermaid">)
    const mermaidBlocks = container.querySelectorAll('pre > code.language-mermaid, code.language-mermaid');
    if (mermaidBlocks.length === 0) return;

    // Process each mermaid block
    mermaidBlocks.forEach((codeEl, index) => {
      const preEl = codeEl.parentElement;
      const code = codeEl.textContent || '';

      // Create container div
      const mermaidDiv = document.createElement('div');
      mermaidDiv.className = 'mermaid-diagram';
      const diagramId = `mermaid-diagram-${Date.now()}-${index}`;

      // Replace the pre/code block first
      if (preEl && preEl.tagName === 'PRE') {
        preEl.replaceWith(mermaidDiv);
      } else {
        codeEl.replaceWith(mermaidDiv);
      }

      // Mermaid v10.x: render() always returns Promise<{svg: string}>
      mermaid.render(diagramId, code).then(({ svg }) => {
        mermaidDiv.innerHTML = svg;
      }).catch((err) => {
        mermaidDiv.innerHTML = `<pre class="mermaid-error">${escapeHTML(code)}</pre>`;
        mermaidDiv.classList.add('mermaid-error');
      });
    });
  }

  // ==========================================================================
  // Code Block Copy Button
  // ==========================================================================

  /**
   * Add copy buttons to all code blocks in container
   * @param {HTMLElement} container
   */
  function addCopyButtons(container) {
    const codeBlocks = container.querySelectorAll('pre > code');

    codeBlocks.forEach((codeEl) => {
      const preEl = codeEl.parentElement;
      if (!preEl || preEl.querySelector('.mdv-copy-btn')) return; // Already has button

      const btn = document.createElement('button');
      btn.className = 'mdv-copy-btn';
      btn.textContent = 'Copy';
      btn.setAttribute('aria-label', 'Copy code to clipboard');

      btn.addEventListener('click', async () => {
        const code = codeEl.textContent || '';
        try {
          await navigator.clipboard.writeText(code);
          btn.textContent = 'Copied!';
          btn.classList.add('copied');
          setTimeout(() => {
            btn.textContent = 'Copy';
            btn.classList.remove('copied');
          }, 2000);
        } catch (err) {
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = code;
          textArea.style.cssText = 'position:fixed;left:-9999px';
          document.body.appendChild(textArea);
          textArea.select();
          try {
            document.execCommand('copy');
            btn.textContent = 'Copied!';
            btn.classList.add('copied');
            setTimeout(() => {
              btn.textContent = 'Copy';
              btn.classList.remove('copied');
            }, 2000);
          } catch (e) {
            btn.textContent = 'Failed';
            setTimeout(() => {
              btn.textContent = 'Copy';
            }, 2000);
          }
          document.body.removeChild(textArea);
        }
      });

      preEl.appendChild(btn);
    });
  }

  // ==========================================================================
  // TOC Sidebar
  // ==========================================================================

  /**
   * Create TOC sidebar
   */
  function createTocSidebar() {
    // Remove existing
    const existing = document.getElementById(UI_IDS.TOC);
    if (existing) existing.remove();

    const sidebar = document.createElement('div');
    sidebar.id = UI_IDS.TOC;
    Object.assign(sidebar.style, {
      position: 'fixed',
      top: '80px',
      left: '20px',
      width: '220px',
      maxHeight: 'calc(100vh - 160px)',
      overflow: 'auto',
      background: '#fff',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      zIndex: '999995',
      display: 'none',
      fontSize: '13px'
    });

    sidebar.innerHTML = `
      <div class="mdv-toc-header" style="padding:12px 16px;border-bottom:1px solid #e2e8f0;font-weight:600;display:flex;justify-content:space-between;align-items:center">
        <span>Contents</span>
        <button class="mdv-toc-toggle" style="border:none;background:none;cursor:pointer;font-size:12px;color:#718096">▼</button>
      </div>
      <nav class="mdv-toc-content" style="padding:8px 0" aria-label="Table of contents"></nav>
    `;

    // Toggle collapse
    const toggle = sidebar.querySelector('.mdv-toc-toggle');
    const content = sidebar.querySelector('.mdv-toc-content');
    let collapsed = false;

    toggle.addEventListener('click', () => {
      collapsed = !collapsed;
      content.style.display = collapsed ? 'none' : 'block';
      toggle.textContent = collapsed ? '▶' : '▼';
    });

    document.body.appendChild(sidebar);
    return sidebar;
  }

  /**
   * Extract headings from rendered content
   */
  function extractHeadings(container) {
    const headings = [];
    container.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(h => {
      const id = h.id || slugify(h.textContent);
      if (!h.id) h.id = id;
      headings.push({
        level: parseInt(h.tagName[1]),
        text: h.textContent.replace(/^🔗\s*/, ''),
        id: id
      });
    });
    return headings;
  }

  /**
   * Update TOC sidebar with headings
   */
  function updateTocSidebar(headings) {
    const sidebar = document.getElementById(UI_IDS.TOC);
    if (!sidebar) return;

    const content = sidebar.querySelector('.mdv-toc-content');
    if (!headings || headings.length === 0) {
      content.innerHTML = '<p style="padding:8px 16px;color:#718096;margin:0">No headings</p>';
      return;
    }

    const minLevel = Math.min(...headings.map(h => h.level));
    const html = headings.map(h => {
      const indent = (h.level - minLevel) * 12;
      return `<a href="#${h.id}" class="mdv-toc-link" style="display:block;padding:6px 16px 6px ${16 + indent}px;color:#4a5568;text-decoration:none;border-left:2px solid transparent">${escapeHTML(h.text)}</a>`;
    }).join('');

    content.innerHTML = html;

    // Add click handlers
    content.querySelectorAll('.mdv-toc-link').forEach(link => {
      link.addEventListener('mouseenter', () => {
        link.style.background = '#f7fafc';
        link.style.borderLeftColor = '#3182ce';
      });
      link.addEventListener('mouseleave', () => {
        link.style.background = 'transparent';
        link.style.borderLeftColor = 'transparent';
      });
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.getElementById(link.getAttribute('href').slice(1));
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  /**
   * Show/hide TOC sidebar
   */
  function showTocSidebar() {
    const sidebar = document.getElementById(UI_IDS.TOC);
    if (sidebar) sidebar.style.display = 'block';
  }

  function hideTocSidebar() {
    const sidebar = document.getElementById(UI_IDS.TOC);
    if (sidebar) sidebar.style.display = 'none';
  }

  // ==========================================================================
  // Help Modal (Keyboard Shortcuts)
  // ==========================================================================

  /**
   * Keyboard shortcuts configuration
   */
  const SHORTCUTS = [
    { keys: ['?'], desc: 'Show this help' },
    { keys: ['Esc'], desc: 'Close viewer / Close editor' },
    { keys: ['Ctrl', 'Shift', 'M'], desc: 'Toggle viewer' },
    { keys: ['Ctrl', 'Shift', 'E'], desc: 'Toggle editor (local files)' },
    { keys: ['Ctrl', 'Shift', 'T'], desc: 'Cycle theme' },
    { keys: ['Ctrl', 'S'], desc: 'Download file (in editor)' },
    { keys: ['Ctrl', 'B'], desc: 'Bold (in editor)' },
    { keys: ['Ctrl', 'I'], desc: 'Italic (in editor)' },
    { keys: ['Ctrl', 'K'], desc: 'Insert link (in editor)' }
  ];

  /**
   * Create help modal with keyboard shortcuts
   */
  function createHelpModal() {
    // Remove existing
    const existing = document.getElementById(UI_IDS.HELP);
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = UI_IDS.HELP;
    Object.assign(modal.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      zIndex: '999999',
      display: 'none',
      alignItems: 'center',
      justifyContent: 'center'
    });

    const shortcutsHTML = SHORTCUTS.map(s => {
      const keysHTML = s.keys.map(k => `<kbd class="mdv-kbd">${k}</kbd>`).join(' + ');
      return `
        <tr>
          <td class="mdv-help-keys">${keysHTML}</td>
          <td class="mdv-help-desc">${s.desc}</td>
        </tr>
      `;
    }).join('');

    modal.innerHTML = `
      <div class="mdv-help-backdrop" style="position:absolute;inset:0;background:rgba(0,0,0,0.5)"></div>
      <div class="mdv-help-content" style="position:relative;width:90%;max-width:400px;border-radius:12px;background:#fff;box-shadow:0 25px 50px rgba(0,0,0,0.25);overflow:hidden">
        <div class="mdv-help-header" style="padding:16px 20px;border-bottom:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center">
          <h3 style="margin:0;font-size:16px;font-weight:600">Keyboard Shortcuts</h3>
          <button class="mdv-help-close" aria-label="Close" style="border:none;background:none;cursor:pointer;font-size:20px;color:#718096;padding:0 4px;line-height:1">×</button>
        </div>
        <div class="mdv-help-body" style="padding:16px 20px">
          <table class="mdv-help-table" style="width:100%;border-collapse:collapse">
            <tbody>${shortcutsHTML}</tbody>
          </table>
        </div>
        <div class="mdv-help-footer" style="padding:12px 20px;background:#f8f9fa;border-top:1px solid #e2e8f0;font-size:12px;color:#718096;text-align:center">
          Press <kbd class="mdv-kbd">?</kbd> anytime to show this help
        </div>
      </div>
    `;

    // Close handlers
    modal.querySelector('.mdv-help-backdrop').addEventListener('click', hideHelpModal);
    modal.querySelector('.mdv-help-close').addEventListener('click', hideHelpModal);

    document.body.appendChild(modal);
    return modal;
  }

  /**
   * Show help modal
   */
  function showHelpModal() {
    let modal = document.getElementById(UI_IDS.HELP);
    if (!modal) {
      modal = createHelpModal();
    }
    modal.style.display = 'flex';
    // Focus close button for accessibility
    const closeBtn = modal.querySelector('.mdv-help-close');
    if (closeBtn) closeBtn.focus();
  }

  /**
   * Hide help modal
   */
  function hideHelpModal() {
    const modal = document.getElementById(UI_IDS.HELP);
    if (modal) modal.style.display = 'none';
  }

  /**
   * Check if help modal is visible
   */
  function isHelpModalVisible() {
    const modal = document.getElementById(UI_IDS.HELP);
    return modal && modal.style.display === 'flex';
  }

  // ==========================================================================
  // Editor Mode (Phase 5)
  // ==========================================================================

  /**
   * Editor toolbar configuration
   */
  const EDITOR_TOOLBAR = [
    { id: 'bold', icon: 'B', label: 'Bold', shortcut: 'Ctrl+B', before: '**', after: '**' },
    { id: 'italic', icon: 'I', label: 'Italic', shortcut: 'Ctrl+I', before: '*', after: '*' },
    { id: 'strikethrough', icon: 'S', label: 'Strikethrough', shortcut: 'Ctrl+Shift+S', before: '~~', after: '~~' },
    { id: 'sep1', type: 'separator' },
    { id: 'h1', icon: 'H1', label: 'Heading 1', before: '# ', after: '', lineStart: true },
    { id: 'h2', icon: 'H2', label: 'Heading 2', before: '## ', after: '', lineStart: true },
    { id: 'h3', icon: 'H3', label: 'Heading 3', before: '### ', after: '', lineStart: true },
    { id: 'sep2', type: 'separator' },
    { id: 'code', icon: '`', label: 'Inline Code', shortcut: 'Ctrl+`', before: '`', after: '`' },
    { id: 'codeblock', icon: '```', label: 'Code Block', shortcut: 'Ctrl+Shift+K', before: '```\n', after: '\n```', multiline: true },
    { id: 'sep3', type: 'separator' },
    { id: 'link', icon: '🔗', label: 'Link', shortcut: 'Ctrl+K', template: '[text](url)' },
    { id: 'image', icon: '🖼️', label: 'Image', template: '![alt](url)' },
    { id: 'sep4', type: 'separator' },
    { id: 'ul', icon: '•', label: 'Bullet List', before: '- ', after: '', lineStart: true },
    { id: 'ol', icon: '1.', label: 'Numbered List', before: '1. ', after: '', lineStart: true },
    { id: 'quote', icon: '❝', label: 'Quote', before: '> ', after: '', lineStart: true },
    { id: 'hr', icon: '—', label: 'Horizontal Rule', before: '\n---\n', after: '' },
    { id: 'sep5', type: 'separator' },
    { id: 'table', icon: '▦', label: 'Table', template: '| Column 1 | Column 2 |\n| -------- | -------- |\n| Cell 1   | Cell 2   |' }
  ];

  /**
   * Create editor container with toolbar, textarea, and preview
   */
  function createEditorContainer() {
    // Remove existing editor
    const existing = document.getElementById(UI_IDS.EDITOR);
    if (existing) existing.remove();

    const container = document.createElement('div');
    container.id = UI_IDS.EDITOR;
    container.className = 'mdv-viewer mdv-editor';
    Object.assign(container.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      zIndex: '999991',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--mdv-bg)'
    });

    // Generate toolbar HTML
    const toolbarHTML = EDITOR_TOOLBAR.map(item => {
      if (item.type === 'separator') {
        return '<span class="mdv-editor-sep"></span>';
      }
      return `<button class="mdv-editor-btn" data-action="${item.id}" title="${item.label}${item.shortcut ? ' (' + item.shortcut + ')' : ''}">${item.icon}</button>`;
    }).join('');

    container.innerHTML = `
      <div class="mdv-editor-header">
        <div class="mdv-editor-toolbar">${toolbarHTML}</div>
        <div class="mdv-editor-actions">
          <span class="mdv-editor-status" id="mdv-editor-status"></span>
          <button class="mdv-editor-btn mdv-editor-save" id="mdv-editor-save" title="Download edited file (Ctrl+S)">💾 Save New File</button>
          <button class="mdv-editor-btn mdv-editor-close" id="mdv-editor-close" title="Close Editor (Esc)">✕</button>
        </div>
      </div>
      <div class="mdv-editor-body">
        <div class="mdv-editor-pane mdv-editor-input">
          <div class="mdv-editor-line-numbers" id="mdv-line-numbers"></div>
          <textarea class="mdv-editor-textarea" id="mdv-editor-textarea" spellcheck="false" placeholder="Write your markdown here..."></textarea>
        </div>
        <div class="mdv-editor-divider"></div>
        <div class="mdv-editor-pane mdv-editor-preview">
          <article class="mdv-content" id="mdv-editor-preview"></article>
        </div>
      </div>
    `;

    document.body.appendChild(container);

    // Setup event listeners
    setupEditorEvents(container);

    return container;
  }

  /**
   * Setup editor event listeners
   */
  function setupEditorEvents(container) {
    const textarea = container.querySelector('#mdv-editor-textarea');
    const preview = container.querySelector('#mdv-editor-preview');
    const saveBtn = container.querySelector('#mdv-editor-save');
    const closeBtn = container.querySelector('#mdv-editor-close');
    const toolbar = container.querySelector('.mdv-editor-toolbar');
    const lineNumbers = container.querySelector('#mdv-line-numbers');

    // Initial content
    textarea.value = state.editedContent || state.rawContent;
    updateLineNumbers(textarea, lineNumbers);
    updatePreview(textarea.value, preview);

    // Debounced preview update
    let previewTimeout;
    textarea.addEventListener('input', () => {
      state.editedContent = textarea.value;
      state.hasUnsavedChanges = textarea.value !== state.rawContent;
      updateEditorStatus();
      updateLineNumbers(textarea, lineNumbers);

      clearTimeout(previewTimeout);
      previewTimeout = setTimeout(() => {
        updatePreview(textarea.value, preview);
      }, 300);
    });

    // Scroll sync for line numbers
    textarea.addEventListener('scroll', () => {
      lineNumbers.scrollTop = textarea.scrollTop;
    });

    // Toolbar actions
    toolbar.addEventListener('click', (e) => {
      const btn = e.target.closest('.mdv-editor-btn');
      if (!btn) return;

      const action = btn.dataset.action;
      applyToolbarAction(textarea, action);
      textarea.focus();

      // Trigger input event to update preview
      textarea.dispatchEvent(new Event('input'));
    });

    // Save button
    saveBtn.addEventListener('click', () => saveFile());

    // Close button
    closeBtn.addEventListener('click', () => {
      if (state.hasUnsavedChanges) {
        if (confirm('You have unsaved changes. Discard them?')) {
          closeEditor();
        }
      } else {
        closeEditor();
      }
    });

    // Editor keyboard shortcuts
    textarea.addEventListener('keydown', handleEditorKeydown);

    // Setup resizable divider
    setupEditorDivider(container);
  }

  /**
   * Update line numbers display
   */
  function updateLineNumbers(textarea, lineNumbers) {
    const lines = textarea.value.split('\n').length;
    const html = Array.from({ length: lines }, (_, i) => `<span>${i + 1}</span>`).join('');
    lineNumbers.innerHTML = html;
  }

  /**
   * Update preview with rendered markdown
   */
  function updatePreview(content, previewEl) {
    const html = renderMarkdown(content);
    previewEl.innerHTML = html;

    // Add copy buttons and render mermaid
    addCopyButtons(previewEl);
    if (hasMermaid(content)) {
      renderMermaidDiagrams(previewEl);
    }
  }

  /**
   * Update editor status indicator
   */
  function updateEditorStatus() {
    const statusEl = document.getElementById('mdv-editor-status');
    if (statusEl) {
      statusEl.textContent = state.hasUnsavedChanges ? '● Unsaved' : '';
      statusEl.className = 'mdv-editor-status' + (state.hasUnsavedChanges ? ' unsaved' : '');
    }
  }

  /**
   * Apply toolbar action to textarea
   */
  function applyToolbarAction(textarea, actionId) {
    const action = EDITOR_TOOLBAR.find(a => a.id === actionId);
    if (!action || action.type === 'separator') return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);

    let newText, newStart, newEnd;

    if (action.template) {
      // Template-based (link, image, table)
      if (action.id === 'link') {
        const linkText = selectedText || 'text';
        newText = text.substring(0, start) + `[${linkText}](url)` + text.substring(end);
        newStart = start + linkText.length + 3;
        newEnd = newStart + 3;
      } else if (action.id === 'image') {
        const altText = selectedText || 'alt';
        newText = text.substring(0, start) + `![${altText}](url)` + text.substring(end);
        newStart = start + altText.length + 4;
        newEnd = newStart + 3;
      } else {
        // Table or other templates
        newText = text.substring(0, start) + action.template + text.substring(end);
        newStart = start + action.template.length;
        newEnd = newStart;
      }
    } else if (action.lineStart) {
      // Line-start formatting (headings, lists, quotes)
      const lineStart = text.lastIndexOf('\n', start - 1) + 1;
      newText = text.substring(0, lineStart) + action.before + text.substring(lineStart);
      newStart = start + action.before.length;
      newEnd = end + action.before.length;
    } else {
      // Wrap selection with before/after
      newText = text.substring(0, start) + action.before + selectedText + action.after + text.substring(end);
      if (selectedText) {
        newStart = start + action.before.length;
        newEnd = end + action.before.length;
      } else {
        newStart = start + action.before.length;
        newEnd = newStart;
      }
    }

    textarea.value = newText;
    textarea.setSelectionRange(newStart, newEnd);
  }

  /**
   * Handle editor keyboard shortcuts
   */
  function handleEditorKeydown(e) {
    // Ctrl/Cmd + S to save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      saveFile();
      return;
    }

    // Ctrl/Cmd + B for bold
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault();
      applyToolbarAction(e.target, 'bold');
      e.target.dispatchEvent(new Event('input'));
      return;
    }

    // Ctrl/Cmd + I for italic
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
      e.preventDefault();
      applyToolbarAction(e.target, 'italic');
      e.target.dispatchEvent(new Event('input'));
      return;
    }

    // Ctrl/Cmd + K for link
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      applyToolbarAction(e.target, 'link');
      e.target.dispatchEvent(new Event('input'));
      return;
    }

    // Ctrl/Cmd + ` for inline code
    if ((e.ctrlKey || e.metaKey) && e.key === '`') {
      e.preventDefault();
      applyToolbarAction(e.target, 'code');
      e.target.dispatchEvent(new Event('input'));
      return;
    }

    // Ctrl/Cmd + Shift + K for code block
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'K') {
      e.preventDefault();
      applyToolbarAction(e.target, 'codeblock');
      e.target.dispatchEvent(new Event('input'));
      return;
    }

    // Ctrl/Cmd + Shift + S for strikethrough
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
      e.preventDefault();
      applyToolbarAction(e.target, 'strikethrough');
      e.target.dispatchEvent(new Event('input'));
      return;
    }

    // Tab for indent
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const text = e.target.value;

      if (e.shiftKey) {
        // Unindent - remove leading spaces/tab
        const lineStart = text.lastIndexOf('\n', start - 1) + 1;
        const linePrefix = text.substring(lineStart, start);
        if (linePrefix.startsWith('  ')) {
          e.target.value = text.substring(0, lineStart) + text.substring(lineStart + 2);
          e.target.setSelectionRange(start - 2, end - 2);
        } else if (linePrefix.startsWith('\t')) {
          e.target.value = text.substring(0, lineStart) + text.substring(lineStart + 1);
          e.target.setSelectionRange(start - 1, end - 1);
        }
      } else {
        // Indent - add two spaces
        e.target.value = text.substring(0, start) + '  ' + text.substring(end);
        e.target.setSelectionRange(start + 2, start + 2);
      }
      e.target.dispatchEvent(new Event('input'));
    }
  }

  /**
   * Setup resizable divider for editor
   */
  function setupEditorDivider(container) {
    const divider = container.querySelector('.mdv-editor-divider');
    const inputPane = container.querySelector('.mdv-editor-input');
    const previewPane = container.querySelector('.mdv-editor-preview');
    const body = container.querySelector('.mdv-editor-body');

    if (!divider || !inputPane || !previewPane || !body) return;

    let isResizing = false;

    divider.addEventListener('mousedown', () => {
      isResizing = true;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', (e) => {
      if (!isResizing) return;
      const bodyRect = body.getBoundingClientRect();
      const percent = ((e.clientX - bodyRect.left) / bodyRect.width) * 100;
      const clampedPercent = Math.min(Math.max(percent, 20), 80);
      inputPane.style.flex = `0 0 ${clampedPercent}%`;
      previewPane.style.flex = `0 0 ${100 - clampedPercent - 0.5}%`;
    });

    document.addEventListener('mouseup', () => {
      if (isResizing) {
        isResizing = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    });
  }

  /**
   * Toggle edit mode
   */
  function toggleEditMode() {
    if (state.isEditing) {
      closeEditor();
    } else {
      openEditor();
    }
  }

  /**
   * Open editor
   */
  function openEditor() {
    state.isEditing = true;
    state.editedContent = state.rawContent;
    state.hasUnsavedChanges = false;

    // Hide other containers
    [UI_IDS.REPLACE, UI_IDS.SPLIT, UI_IDS.MODAL, UI_IDS.TOC].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });

    createEditorContainer();
    applyViewerStyles();

    // Update edit button text
    const editBtn = document.getElementById('mdv-edit-toggle');
    if (editBtn) {
      editBtn.innerHTML = '<span style="width:20px;display:inline-block">📖</span> View Mode';
    }
  }

  /**
   * Close editor and return to view mode
   */
  function closeEditor() {
    state.isEditing = false;

    // Remove editor container
    const editor = document.getElementById(UI_IDS.EDITOR);
    if (editor) editor.remove();

    // Restore view mode
    if (state.currentMode) {
      // Re-render with possibly updated content
      if (state.hasUnsavedChanges && state.editedContent) {
        state.rawContent = state.editedContent;
      }
      setDisplayMode(state.currentMode);
    } else {
      // Show the appropriate container
      [UI_IDS.REPLACE, UI_IDS.SPLIT, UI_IDS.MODAL].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = '';
      });
    }

    // Update edit button text
    const editBtn = document.getElementById('mdv-edit-toggle');
    if (editBtn) {
      editBtn.innerHTML = '<span style="width:20px;display:inline-block">✏️</span> Edit File';
    }

    state.hasUnsavedChanges = false;
  }

  /**
   * Save file - downloads the edited content
   * Note: Direct file write is not possible from file:// protocol due to browser security
   * Tip: Enable "Ask where to save" in browser settings to choose save location
   */
  function saveFile() {
    downloadFile();
  }

  /**
   * Download file - the only way to save from file:// protocol
   * Browser security prevents direct file writes
   */
  function downloadFile() {
    const textarea = document.getElementById('mdv-editor-textarea');
    const content = textarea ? textarea.value : state.editedContent;
    const filename = getFilenameFromPath();

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    // Update state
    state.rawContent = content;
    state.hasUnsavedChanges = false;
    updateEditorStatus();

    showSaveNotification(`Downloaded "${filename}" - replace original to save`, 'info');
  }

  /**
   * Get filename from current path
   */
  function getFilenameFromPath() {
    const path = window.location.pathname;
    const parts = path.split('/');
    return parts[parts.length - 1] || 'document.md';
  }

  /**
   * Show save notification
   * @param {string} message - Notification message
   * @param {'success' | 'info'} type - Notification type
   */
  function showSaveNotification(message, type = 'success') {
    const existing = document.getElementById('mdv-save-notification');
    if (existing) existing.remove();

    const colors = {
      success: '#22c55e',
      info: '#3b82f6'
    };

    const notification = document.createElement('div');
    notification.id = 'mdv-save-notification';
    notification.textContent = message;
    Object.assign(notification.style, {
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      padding: '12px 24px',
      background: colors[type] || colors.success,
      color: '#fff',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
      zIndex: '999999',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      animation: 'mdv-fade-in 0.2s ease'
    });

    document.body.appendChild(notification);

    // Info notifications stay longer
    const duration = type === 'info' ? 3000 : 2000;

    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transition = 'opacity 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, duration);
  }

  // ==========================================================================
  // Loading Indicator
  // ==========================================================================

  /**
   * Show loading indicator
   */
  function showLoading() {
    const existing = document.getElementById('mdv-loader');
    if (existing) return;

    const loader = document.createElement('div');
    loader.id = 'mdv-loader';
    Object.assign(loader.style, {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: '999999',
      padding: '16px 32px',
      borderRadius: '8px',
      background: '#fff',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      fontSize: '14px',
      color: '#4a5568'
    });
    loader.textContent = 'Rendering...';
    document.body.appendChild(loader);
  }

  /**
   * Hide loading indicator
   */
  function hideLoading() {
    const loader = document.getElementById('mdv-loader');
    if (loader) loader.remove();
  }

  /**
   * Create replace container (replaces entire page)
   */
  function createReplaceContainer(html) {
    const container = document.createElement('div');
    container.id = UI_IDS.REPLACE;
    container.className = 'mdv-viewer mdv-replace';
    container.innerHTML = `<article class="mdv-content">${html}</article>`;

    // Replace body content
    document.body.innerHTML = '';
    document.body.appendChild(container);

    // Re-add floating button and dropdown
    createFloatingButton();
    createDropdownMenu();

    // Apply base styles
    applyViewerStyles();
  }

  /**
   * Create split container (raw left, rendered right)
   */
  function createSplitContainer(raw, html) {
    const container = document.createElement('div');
    container.id = UI_IDS.SPLIT;
    container.className = 'mdv-viewer mdv-split';
    Object.assign(container.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      zIndex: '999990',
      display: 'flex',
      background: '#fff'
    });

    container.innerHTML = `
      <div class="mdv-panel mdv-raw" style="flex:1;overflow:auto;padding:20px;background:#f8f9fa;border-right:1px solid #e2e8f0">
        <pre style="white-space:pre-wrap;word-wrap:break-word;margin:0;font-family:monospace;font-size:13px">${escapeHTML(raw)}</pre>
      </div>
      <div class="mdv-divider" style="width:6px;background:#e2e8f0;cursor:col-resize;flex-shrink:0"></div>
      <div class="mdv-panel mdv-rendered" style="flex:1;overflow:auto;padding:20px">
        <article class="mdv-content">${html}</article>
      </div>
    `;

    document.body.appendChild(container);
    setupResizableDivider(container);
    applyViewerStyles();
  }

  /**
   * Create modal container (overlay)
   */
  function createModalContainer(html) {
    const container = document.createElement('div');
    container.id = UI_IDS.MODAL;
    container.className = 'mdv-viewer mdv-modal';
    Object.assign(container.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      zIndex: '999990',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    });

    container.innerHTML = `
      <div class="mdv-backdrop" style="position:absolute;inset:0;background:rgba(0,0,0,0.5)"></div>
      <div class="mdv-modal-content" style="position:relative;width:90%;max-width:900px;max-height:90vh;overflow:auto;border-radius:12px;padding:32px;background:#fff;box-shadow:0 25px 50px rgba(0,0,0,0.25)">
        <button class="mdv-close-btn" aria-label="Close" style="position:absolute;top:12px;right:12px;border:none;background:none;cursor:pointer;font-size:24px;color:#718096;padding:4px 8px">×</button>
        <article class="mdv-content">${html}</article>
      </div>
    `;

    container.querySelector('.mdv-backdrop').addEventListener('click', closeViewer);
    container.querySelector('.mdv-close-btn').addEventListener('click', closeViewer);

    document.body.appendChild(container);
    applyViewerStyles();
  }

  /**
   * Close the viewer and restore original content
   */
  function closeViewer() {
    // Remove all containers including TOC
    [UI_IDS.REPLACE, UI_IDS.SPLIT, UI_IDS.MODAL, UI_IDS.TOC].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.remove();
    });

    // Restore original body if in replace mode
    if (state.currentMode === 'replace' && state.originalBody) {
      document.body.innerHTML = state.originalBody;
      createFloatingButton();
      createDropdownMenu();
    }

    state.currentMode = null;
    state.isOpen = false;
    setPreference(PREFS.LAST_STATE, 'closed');
  }

  /**
   * Setup resizable divider for split view
   */
  function setupResizableDivider(container) {
    const divider = container.querySelector('.mdv-divider');
    const leftPanel = container.querySelector('.mdv-raw');
    const rightPanel = container.querySelector('.mdv-rendered');
    if (!divider || !leftPanel || !rightPanel) return;

    let isResizing = false;

    divider.addEventListener('mousedown', () => {
      isResizing = true;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', (e) => {
      if (!isResizing) return;
      const containerRect = container.getBoundingClientRect();
      const percent = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      const clampedPercent = Math.min(Math.max(percent, 20), 80);
      leftPanel.style.flex = `0 0 ${clampedPercent}%`;
      rightPanel.style.flex = `0 0 ${100 - clampedPercent - 1}%`;
    });

    document.addEventListener('mouseup', () => {
      if (isResizing) {
        isResizing = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    });
  }

  // ==========================================================================
  // UI Components - Keyboard Shortcuts
  // ==========================================================================

  let keyboardSetup = false;

  /**
   * Setup keyboard shortcuts
   */
  function setupKeyboardShortcuts() {
    if (keyboardSetup) return;
    keyboardSetup = true;

    document.addEventListener('keydown', (e) => {
      // Don't trigger shortcuts when typing in input fields
      const target = e.target;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // ESC to close help modal first, then editor, then viewer
      if (e.key === 'Escape') {
        if (isHelpModalVisible()) {
          e.preventDefault();
          hideHelpModal();
          return;
        }
        if (state.isEditing) {
          e.preventDefault();
          if (state.hasUnsavedChanges) {
            if (confirm('You have unsaved changes. Discard them?')) {
              closeEditor();
            }
          } else {
            closeEditor();
          }
          return;
        }
        if (state.isOpen) {
          e.preventDefault();
          closeViewer();
        }
        return;
      }

      // ? to show help modal (Shift+/ on most keyboards)
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        if (isHelpModalVisible()) {
          hideHelpModal();
        } else {
          showHelpModal();
        }
        return;
      }

      // Ctrl+Shift+M to toggle viewer
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        if (state.isOpen) {
          closeViewer();
        } else {
          const mode = getPreference(PREFS.DISPLAY_MODE, DEFAULT_MODE);
          setDisplayMode(mode);
        }
      }

      // Ctrl+Shift+E to toggle editor (local files only)
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'e') {
        if (isLocalFile()) {
          e.preventDefault();
          toggleEditMode();
        }
      }

      // Ctrl+Shift+T to cycle theme
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        cycleTheme();
      }
    });
  }

  // ==========================================================================
  // UI Components - Styles
  // ==========================================================================

  /**
   * Apply viewer styles using GM_addStyle
   * Phase 4: GitHub-like styling with CSS custom properties
   */
  function applyViewerStyles() {
    // Only add once
    if (document.getElementById('mdv-styles')) return;

    const styles = `
/* ==========================================================================
   CSS Custom Properties - Light Theme (GitHub)
   ========================================================================== */
:root,
:root[data-mdv-theme="light"] {
  --mdv-bg: #ffffff;
  --mdv-text: #24292f;
  --mdv-text-secondary: #57606a;
  --mdv-link: #0969da;
  --mdv-border: #d0d7de;
  --mdv-code-bg: #f6f8fa;
  --mdv-blockquote-border: #d0d7de;
  --mdv-blockquote-text: #57606a;
  --mdv-table-border: #d0d7de;
  --mdv-table-row-alt: #f6f8fa;
  --mdv-btn-bg: #f6f8fa;
  --mdv-btn-hover: #eaeef2;
  --mdv-shadow: rgba(0,0,0,0.1);
  --mdv-pre-bg: #f6f8fa;
  --mdv-pre-text: #24292f;
}

/* Dark Theme (GitHub Dark) - via system preference */
@media (prefers-color-scheme: dark) {
  :root:not([data-mdv-theme="light"]) {
    --mdv-bg: #0d1117;
    --mdv-text: #c9d1d9;
    --mdv-text-secondary: #8b949e;
    --mdv-link: #58a6ff;
    --mdv-border: #30363d;
    --mdv-code-bg: #161b22;
    --mdv-blockquote-border: #3b434b;
    --mdv-blockquote-text: #8b949e;
    --mdv-table-border: #30363d;
    --mdv-table-row-alt: #161b22;
    --mdv-btn-bg: #21262d;
    --mdv-btn-hover: #30363d;
    --mdv-shadow: rgba(0,0,0,0.4);
    --mdv-pre-bg: #161b22;
    --mdv-pre-text: #c9d1d9;
  }
}

/* Dark Theme - manual override */
:root[data-mdv-theme="dark"] {
  --mdv-bg: #0d1117;
  --mdv-text: #c9d1d9;
  --mdv-text-secondary: #8b949e;
  --mdv-link: #58a6ff;
  --mdv-border: #30363d;
  --mdv-code-bg: #161b22;
  --mdv-blockquote-border: #3b434b;
  --mdv-blockquote-text: #8b949e;
  --mdv-table-border: #30363d;
  --mdv-table-row-alt: #161b22;
  --mdv-btn-bg: #21262d;
  --mdv-btn-hover: #30363d;
  --mdv-shadow: rgba(0,0,0,0.4);
  --mdv-pre-bg: #161b22;
  --mdv-pre-text: #c9d1d9;
}

/* ==========================================================================
   Floating Button & Dropdown
   ========================================================================== */
#mdv-floating-btn {
  background: var(--mdv-btn-bg) !important;
  color: var(--mdv-text) !important;
  border: 1px solid var(--mdv-border) !important;
  transition: transform 0.2s, box-shadow 0.2s, background 0.2s !important;
}

#mdv-floating-btn:hover {
  background: var(--mdv-btn-hover) !important;
  transform: scale(1.05);
  box-shadow: 0 4px 12px var(--mdv-shadow) !important;
}

#mdv-floating-btn:active {
  transform: scale(0.98);
}

#mdv-floating-btn svg {
  width: 24px;
  height: 24px;
}

#mdv-dropdown {
  background: var(--mdv-bg) !important;
  border: 1px solid var(--mdv-border) !important;
  box-shadow: 0 8px 24px var(--mdv-shadow) !important;
}

#mdv-dropdown button {
  background: transparent !important;
  color: var(--mdv-text) !important;
}

#mdv-dropdown button:hover {
  background: var(--mdv-btn-hover) !important;
}

#mdv-dropdown > div[style*="height: 1px"] {
  background: var(--mdv-border) !important;
}

/* ==========================================================================
   Container Styles
   ========================================================================== */
.mdv-viewer {
  background: var(--mdv-bg);
  color: var(--mdv-text);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif;
  font-size: 16px;
  line-height: 1.5;
}

/* Replace Mode */
.mdv-replace {
  min-height: 100vh;
  padding: 32px;
  box-sizing: border-box;
  background: var(--mdv-bg) !important;
}

.mdv-replace .mdv-content {
  max-width: 900px;
  margin: 0 auto;
}

/* Split Mode */
.mdv-split {
  background: var(--mdv-bg) !important;
}

.mdv-split .mdv-panel {
  background: var(--mdv-bg) !important;
}

.mdv-split .mdv-raw {
  background: var(--mdv-code-bg) !important;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  font-size: 14px;
  color: var(--mdv-text-secondary) !important;
}

.mdv-split .mdv-raw pre {
  color: var(--mdv-text-secondary) !important;
}

.mdv-split .mdv-divider {
  background: var(--mdv-border) !important;
  transition: background 0.15s;
}

.mdv-split .mdv-divider:hover {
  background: var(--mdv-link) !important;
}

/* Modal Mode */
.mdv-modal .mdv-backdrop {
  background: rgba(0, 0, 0, 0.5);
}

@media (prefers-color-scheme: dark) {
  .mdv-modal .mdv-backdrop {
    background: rgba(0, 0, 0, 0.7);
  }
}

.mdv-modal .mdv-modal-content {
  background: var(--mdv-bg) !important;
  box-shadow: 0 8px 32px var(--mdv-shadow) !important;
}

.mdv-modal .mdv-close-btn {
  color: var(--mdv-text-secondary) !important;
  font-size: 28px;
  line-height: 1;
  padding: 8px;
  transition: color 0.15s;
}

.mdv-modal .mdv-close-btn:hover {
  color: var(--mdv-text) !important;
}

/* Loading Indicator */
#mdv-loader {
  background: var(--mdv-bg) !important;
  color: var(--mdv-text) !important;
  border: 1px solid var(--mdv-border) !important;
  box-shadow: 0 4px 12px var(--mdv-shadow) !important;
}

/* ==========================================================================
   Markdown Content Styles (GitHub-like)
   ========================================================================== */
.mdv-content {
  word-wrap: break-word;
  color: var(--mdv-text);
}

.mdv-content > *:first-child {
  margin-top: 0 !important;
}

.mdv-content > *:last-child {
  margin-bottom: 0 !important;
}

/* Headings */
.mdv-content h1,
.mdv-content h2,
.mdv-content h3,
.mdv-content h4,
.mdv-content h5,
.mdv-content h6 {
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
  line-height: 1.25;
  color: var(--mdv-text);
}

.mdv-content h1 {
  font-size: 2em;
  padding-bottom: 0.3em;
  border-bottom: 1px solid var(--mdv-border);
}

.mdv-content h2 {
  font-size: 1.5em;
  padding-bottom: 0.3em;
  border-bottom: 1px solid var(--mdv-border);
}

.mdv-content h3 { font-size: 1.25em; }
.mdv-content h4 { font-size: 1em; }
.mdv-content h5 { font-size: 0.875em; }
.mdv-content h6 { font-size: 0.85em; color: var(--mdv-text-secondary); }

/* Anchor Links */
.mdv-content .header-anchor {
  float: left;
  padding-right: 4px;
  margin-left: -20px;
  line-height: 1;
  opacity: 0;
  text-decoration: none;
  transition: opacity 0.15s;
}

.mdv-content h1:hover .header-anchor,
.mdv-content h2:hover .header-anchor,
.mdv-content h3:hover .header-anchor,
.mdv-content h4:hover .header-anchor,
.mdv-content h5:hover .header-anchor,
.mdv-content h6:hover .header-anchor {
  opacity: 1;
}

/* Paragraphs */
.mdv-content p {
  margin-top: 0;
  margin-bottom: 16px;
}

/* Links */
.mdv-content a {
  color: var(--mdv-link);
  text-decoration: none;
}

.mdv-content a:hover {
  text-decoration: underline;
}

/* Lists */
.mdv-content ul,
.mdv-content ol {
  margin-top: 0;
  margin-bottom: 16px;
  padding-left: 2em;
}

.mdv-content li {
  margin-top: 0.25em;
}

.mdv-content li + li {
  margin-top: 0.25em;
}

/* Task Lists */
.mdv-content input[type="checkbox"] {
  margin-right: 0.5em;
  vertical-align: middle;
}

/* Blockquotes */
.mdv-content blockquote {
  margin: 0 0 16px 0;
  padding: 0 1em;
  color: var(--mdv-blockquote-text);
  border-left: 0.25em solid var(--mdv-blockquote-border);
}

.mdv-content blockquote > :first-child {
  margin-top: 0;
}

.mdv-content blockquote > :last-child {
  margin-bottom: 0;
}

/* Inline Code */
.mdv-content code {
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  font-size: 85%;
  padding: 0.2em 0.4em;
  margin: 0;
  background: var(--mdv-code-bg);
  border-radius: 6px;
}

/* Code Blocks */
.mdv-content pre {
  position: relative;
  margin-top: 0;
  margin-bottom: 16px;
  padding: 16px;
  overflow: auto;
  font-size: 85%;
  line-height: 1.45;
  background: var(--mdv-pre-bg);
  border-radius: 6px;
}

.mdv-content pre code {
  padding: 0;
  background: transparent;
  border: 0;
  font-size: 100%;
  color: var(--mdv-pre-text);
}

/* Copy Button */
.mdv-copy-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px 8px;
  font-size: 12px;
  font-family: inherit;
  color: var(--mdv-text-secondary);
  background: var(--mdv-btn-bg);
  border: 1px solid var(--mdv-border);
  border-radius: 4px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s, background 0.15s, color 0.15s;
  z-index: 1;
}

.mdv-content pre:hover .mdv-copy-btn {
  opacity: 1;
}

.mdv-copy-btn:hover {
  background: var(--mdv-btn-hover);
  color: var(--mdv-text);
}

.mdv-copy-btn:active {
  transform: scale(0.95);
}

.mdv-copy-btn.copied {
  color: #22c55e;
  border-color: #22c55e;
}

/* Tables */
.mdv-content table {
  width: 100%;
  border-spacing: 0;
  border-collapse: collapse;
  margin-top: 0;
  margin-bottom: 16px;
  display: block;
  overflow-x: auto;
}

.mdv-content table th,
.mdv-content table td {
  padding: 6px 13px;
  border: 1px solid var(--mdv-table-border);
}

.mdv-content table th {
  font-weight: 600;
  background: var(--mdv-table-row-alt);
}

.mdv-content table tr:nth-child(2n) {
  background: var(--mdv-table-row-alt);
}

/* Images */
.mdv-content img {
  max-width: 100%;
  height: auto;
  box-sizing: border-box;
  border-radius: 6px;
}

/* Horizontal Rules */
.mdv-content hr {
  height: 0.25em;
  padding: 0;
  margin: 24px 0;
  background-color: var(--mdv-border);
  border: 0;
}

/* Inline TOC (from [[toc]]) */
.mdv-content .table-of-contents {
  background: var(--mdv-code-bg);
  border: 1px solid var(--mdv-border);
  border-radius: 6px;
  padding: 16px 24px;
  margin-bottom: 24px;
}

.mdv-content .table-of-contents::before {
  content: 'Table of Contents';
  display: block;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--mdv-text);
}

.mdv-content .table-of-contents ul {
  margin: 0;
  padding-left: 1.5em;
  list-style: none;
}

.mdv-content .table-of-contents > ul {
  padding-left: 0;
}

.mdv-content .table-of-contents li {
  margin: 4px 0;
}

.mdv-content .table-of-contents a {
  color: var(--mdv-link);
  text-decoration: none;
}

.mdv-content .table-of-contents a:hover {
  text-decoration: underline;
}

/* Footnotes */
.mdv-content .footnotes {
  font-size: 85%;
  color: var(--mdv-text-secondary);
  border-top: 1px solid var(--mdv-border);
  margin-top: 32px;
  padding-top: 16px;
}

.mdv-content .footnotes-sep {
  display: none;
}

.mdv-content .footnote-ref a,
.mdv-content .footnote-backref {
  text-decoration: none;
}

/* Math (KaTeX) */
.mdv-content .katex-display {
  margin: 16px 0;
  overflow-x: auto;
  overflow-y: hidden;
}

/* KaTeX font fallbacks for CSP-restricted sites (e.g., GitHub raw) */
.mdv-content .katex {
  font-family: KaTeX_Main, "Times New Roman", Times, Georgia, serif;
}

.mdv-content .katex .mathnormal {
  font-family: KaTeX_Math, "Times New Roman", Times, Georgia, serif;
  font-style: italic;
}

.mdv-content .katex .mathit {
  font-family: KaTeX_Main, "Times New Roman", Times, Georgia, serif;
  font-style: italic;
}

.mdv-content .katex .mathrm {
  font-family: KaTeX_Main, "Times New Roman", Times, Georgia, serif;
  font-style: normal;
}

.mdv-content .katex .mathbf {
  font-family: KaTeX_Main, "Times New Roman", Times, Georgia, serif;
  font-weight: bold;
}

.mdv-content .katex .mathsf {
  font-family: KaTeX_SansSerif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
}

.mdv-content .katex .mathtt {
  font-family: KaTeX_Typewriter, ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
}

.mdv-content .katex .amsrm {
  font-family: KaTeX_AMS, "Times New Roman", Times, Georgia, serif;
}

.mdv-content .katex .mathcal {
  font-family: KaTeX_Caligraphic, "Lucida Calligraphy", cursive, serif;
}

.mdv-content .katex .mathfrak {
  font-family: KaTeX_Fraktur, "Old English Text MT", serif;
}

.mdv-content .katex .mathbb {
  font-family: KaTeX_AMS, "Times New Roman", Times, Georgia, serif;
}

.mdv-content .katex .mathscr {
  font-family: KaTeX_Script, "Brush Script MT", cursive;
}

/* Mermaid Diagrams */
.mdv-content .mermaid-diagram {
  text-align: center;
  margin: 16px 0;
  padding: 16px;
  background: var(--mdv-code-bg);
  border-radius: 6px;
  overflow-x: auto;
}

.mdv-content .mermaid-diagram svg {
  max-width: 100%;
  height: auto;
}

.mdv-content .mermaid-error {
  border: 2px dashed #e53e3e;
  background: rgba(229, 62, 62, 0.1);
}

/* ==========================================================================
   TOC Sidebar Styles
   ========================================================================== */
#mdv-toc-sidebar {
  background: var(--mdv-bg) !important;
  border: 1px solid var(--mdv-border) !important;
  box-shadow: 0 4px 12px var(--mdv-shadow) !important;
}

#mdv-toc-sidebar .mdv-toc-header {
  background: var(--mdv-code-bg) !important;
  border-bottom: 1px solid var(--mdv-border) !important;
  color: var(--mdv-text) !important;
}

#mdv-toc-sidebar .mdv-toc-toggle {
  color: var(--mdv-text-secondary) !important;
}

#mdv-toc-sidebar .mdv-toc-toggle:hover {
  color: var(--mdv-text) !important;
}

#mdv-toc-sidebar .mdv-toc-link {
  color: var(--mdv-text-secondary) !important;
  border-left: 2px solid transparent;
  transition: all 0.15s ease;
}

#mdv-toc-sidebar .mdv-toc-link:hover {
  color: var(--mdv-link) !important;
  background: var(--mdv-code-bg) !important;
  border-left-color: var(--mdv-link) !important;
}

/* ==========================================================================
   Help Modal Styles
   ========================================================================== */
#mdv-help-modal .mdv-help-backdrop {
  background: rgba(0, 0, 0, 0.5);
}

#mdv-help-modal .mdv-help-content {
  background: var(--mdv-bg) !important;
  box-shadow: 0 8px 32px var(--mdv-shadow) !important;
}

#mdv-help-modal .mdv-help-header {
  background: var(--mdv-code-bg) !important;
  border-bottom-color: var(--mdv-border) !important;
}

#mdv-help-modal .mdv-help-header h3 {
  color: var(--mdv-text) !important;
}

#mdv-help-modal .mdv-help-close {
  color: var(--mdv-text-secondary) !important;
  transition: color 0.15s;
}

#mdv-help-modal .mdv-help-close:hover {
  color: var(--mdv-text) !important;
}

#mdv-help-modal .mdv-help-body {
  color: var(--mdv-text);
}

#mdv-help-modal .mdv-help-table tr {
  border-bottom: 1px solid var(--mdv-border);
}

#mdv-help-modal .mdv-help-table tr:last-child {
  border-bottom: none;
}

#mdv-help-modal .mdv-help-keys {
  padding: 10px 16px 10px 0;
  white-space: nowrap;
  text-align: right;
  width: 50%;
}

#mdv-help-modal .mdv-help-desc {
  padding: 10px 0 10px 16px;
  color: var(--mdv-text-secondary);
}

#mdv-help-modal .mdv-help-footer {
  background: var(--mdv-code-bg) !important;
  border-top-color: var(--mdv-border) !important;
  color: var(--mdv-text-secondary) !important;
}

.mdv-kbd {
  display: inline-block;
  padding: 3px 6px;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  font-size: 12px;
  line-height: 1;
  color: var(--mdv-text);
  background: var(--mdv-bg);
  border: 1px solid var(--mdv-border);
  border-radius: 4px;
  box-shadow: inset 0 -1px 0 var(--mdv-border);
}

/* ==========================================================================
   Responsive Styles
   ========================================================================== */
@media (max-width: 768px) {
  .mdv-replace {
    padding: 16px;
  }

  .mdv-replace .mdv-content {
    max-width: 100%;
  }

  .mdv-split {
    flex-direction: column !important;
  }

  .mdv-split .mdv-divider {
    width: 100% !important;
    height: 4px !important;
    cursor: row-resize !important;
  }

  .mdv-modal .mdv-modal-content {
    width: 95% !important;
    padding: 16px !important;
  }

  #mdv-floating-btn {
    width: 40px !important;
    height: 40px !important;
  }

  /* Hide TOC sidebar on mobile */
  #mdv-toc-sidebar {
    display: none !important;
  }
}

/* ==========================================================================
   Print Styles
   ========================================================================== */
@media print {
  #mdv-floating-btn,
  #mdv-dropdown,
  #mdv-toc-sidebar,
  #mdv-help-modal {
    display: none !important;
  }

  .mdv-modal .mdv-backdrop,
  .mdv-modal .mdv-close-btn {
    display: none !important;
  }

  .mdv-replace {
    padding: 0;
  }

  .mdv-content {
    max-width: 100%;
  }

  .mdv-content a {
    color: inherit;
    text-decoration: underline;
  }

  .mdv-content pre {
    white-space: pre-wrap;
    word-wrap: break-word;
  }
}

/* ==========================================================================
   Editor Styles (Phase 5)
   ========================================================================== */
.mdv-editor {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif;
}

.mdv-editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: var(--mdv-code-bg);
  border-bottom: 1px solid var(--mdv-border);
  gap: 16px;
  flex-shrink: 0;
}

.mdv-editor-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.mdv-editor-sep {
  width: 1px;
  height: 24px;
  background: var(--mdv-border);
  margin: 0 4px;
}

.mdv-editor-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 8px;
  border: 1px solid var(--mdv-border);
  border-radius: 6px;
  background: var(--mdv-bg);
  color: var(--mdv-text);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.mdv-editor-btn:hover {
  background: var(--mdv-btn-hover);
  border-color: var(--mdv-text-secondary);
}

.mdv-editor-btn:active {
  transform: scale(0.95);
}

.mdv-editor-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mdv-editor-status {
  font-size: 13px;
  color: var(--mdv-text-secondary);
}

.mdv-editor-status.unsaved {
  color: #f59e0b;
  font-weight: 500;
}

.mdv-editor-save {
  background: #22c55e !important;
  color: #fff !important;
  border-color: #16a34a !important;
}

.mdv-editor-save:hover {
  background: #16a34a !important;
}

.mdv-editor-close {
  font-size: 18px;
  color: var(--mdv-text-secondary) !important;
}

.mdv-editor-close:hover {
  color: var(--mdv-text) !important;
  background: rgba(239, 68, 68, 0.1) !important;
  border-color: #ef4444 !important;
}

.mdv-editor-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.mdv-editor-pane {
  flex: 1;
  overflow: auto;
  position: relative;
}

.mdv-editor-input {
  display: flex;
  background: var(--mdv-code-bg);
}

.mdv-editor-line-numbers {
  flex-shrink: 0;
  width: 48px;
  padding: 16px 8px 16px 0;
  text-align: right;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  font-size: 14px;
  line-height: 1.6;
  color: var(--mdv-text-secondary);
  background: var(--mdv-code-bg);
  border-right: 1px solid var(--mdv-border);
  user-select: none;
  overflow: hidden;
}

.mdv-editor-line-numbers span {
  display: block;
  opacity: 0.6;
}

.mdv-editor-textarea {
  flex: 1;
  width: 100%;
  padding: 16px;
  border: none;
  outline: none;
  resize: none;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  font-size: 14px;
  line-height: 1.6;
  color: var(--mdv-text);
  background: var(--mdv-code-bg);
  tab-size: 2;
}

.mdv-editor-textarea::placeholder {
  color: var(--mdv-text-secondary);
  opacity: 0.6;
}

.mdv-editor-divider {
  width: 6px;
  background: var(--mdv-border);
  cursor: col-resize;
  flex-shrink: 0;
  transition: background 0.15s;
}

.mdv-editor-divider:hover {
  background: var(--mdv-link);
}

.mdv-editor-preview {
  padding: 20px;
  background: var(--mdv-bg);
  overflow: auto;
}

/* Animation */
@keyframes mdv-fade-in {
  from { opacity: 0; transform: translateX(-50%) translateY(10px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}

/* Mobile responsive editor */
@media (max-width: 768px) {
  .mdv-editor-header {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .mdv-editor-toolbar {
    justify-content: center;
  }

  .mdv-editor-actions {
    justify-content: center;
  }

  .mdv-editor-body {
    flex-direction: column;
  }

  .mdv-editor-divider {
    width: 100% !important;
    height: 4px !important;
    cursor: row-resize !important;
  }

  .mdv-editor-line-numbers {
    display: none;
  }
}

/* Print: hide editor */
@media print {
  #mdv-editor-container {
    display: none !important;
  }
}
    `;

    const styleEl = document.createElement('style');
    styleEl.id = 'mdv-styles';
    styleEl.textContent = styles;
    document.head.appendChild(styleEl);
  }

  // ==========================================================================
  // Helper Functions
  // ==========================================================================

  /**
   * Escape HTML special characters
   */
  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ==========================================================================
  // Initialization
  // ==========================================================================

  /**
   * Initialize the markdown viewer
   */
  async function init() {
    if (!isMarkdownPage()) {
      return;
    }


    // Get raw content before modifying DOM
    const rawContent = getRawContent();
    if (!rawContent.trim()) {
      return;
    }

    // Load dependencies from @resource (CSP-safe)
    const loaded = await loadDependencies();
    if (!loaded) {
      console.error('[Markdown Viewer] Failed to load critical dependencies. Check console for details.');
      return;
    }

    // Store raw content in closure-based state (no global pollution)
    setState({ rawContent });

    // Load and apply saved theme preference
    const savedTheme = getPreference(PREFS.THEME, THEMES.AUTO);
    state.theme = savedTheme;
    applyTheme(savedTheme);
    setupThemeListener();

    // Create UI components
    createFloatingButton();
    createDropdownMenu();
    setupKeyboardShortcuts();

    // Auto-render if last state was 'open' (remember last state feature)
    const lastState = getPreference(PREFS.LAST_STATE, 'closed');
    if (lastState === 'open') {
      const lastMode = getPreference(PREFS.DISPLAY_MODE, DEFAULT_MODE);
      setDisplayMode(lastMode);
    }

    console.log('[Markdown Viewer] Initialized');
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
