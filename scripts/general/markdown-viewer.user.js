// ==UserScript==
// @name         Markdown Viewer
// @namespace    https://userjs.khuong.dev
// @version      1.0.0
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
    TOC: 'mdv-toc-sidebar'
  };

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
    isOpen: false,
    originalBody: null,
    currentMode: null,
    isDragging: false,
    theme: THEMES.AUTO
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

    // Create and update TOC sidebar
    createTocSidebar();
    const contentEl = document.querySelector('.mdv-content');
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
    const md = unsafeWindow.markdownit({
      html: true,
      linkify: true,
      typographer: true,
      highlight: function(str, lang) {
        // Use highlight.js if available
        if (lang && unsafeWindow.hljs) {
          try {
            // Try specific language first
            if (unsafeWindow.hljs.getLanguage(lang)) {
              return unsafeWindow.hljs.highlight(str, { language: lang }).value;
            }
            // Fallback to auto-detect
            return unsafeWindow.hljs.highlightAuto(str).value;
          } catch (e) {
            console.warn('[Markdown Viewer] Highlight error:', e);
          }
        }
        return ''; // Use default escaping
      }
    });

    // Add footnotes plugin
    if (unsafeWindow.markdownitFootnote) {
      md.use(unsafeWindow.markdownitFootnote);
    }

    // Add anchor plugin for heading IDs
    if (unsafeWindow.markdownItAnchor) {
      md.use(unsafeWindow.markdownItAnchor, {
        permalink: unsafeWindow.markdownItAnchor.permalink?.linkInsideHeader?.({
          symbol: '🔗',
          placement: 'before'
        }) || false,
        slugify: slugify
      });
    }

    // Add math support with KaTeX
    if (needsMath && unsafeWindow.texmath && unsafeWindow.katex) {
      md.use(unsafeWindow.texmath, {
        engine: unsafeWindow.katex,
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
    if (typeof unsafeWindow.markdownit !== 'function') {
      return `<pre style="white-space:pre-wrap">${escapeHTML(raw)}</pre>`;
    }

    try {
      // Setup markdown-it with plugins
      mdInstance = setupMarkdownIt(raw);

      // Render markdown
      let html = mdInstance.render(raw);

      // Sanitize with DOMPurify
      if (unsafeWindow.DOMPurify) {
        const purify = typeof unsafeWindow.DOMPurify.sanitize === 'function'
          ? unsafeWindow.DOMPurify
          : unsafeWindow.DOMPurify(window); // Factory pattern

        html = purify.sanitize(html, {
          ADD_TAGS: ['math', 'mrow', 'mi', 'mo', 'mn', 'msup', 'msub', 'mfrac', 'semantics', 'annotation', 'mtext', 'mspace', 'mover', 'munder'],
          ADD_ATTR: ['xmlns', 'encoding', 'mathvariant', 'displaystyle', 'scriptlevel'],
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
      // ESC to close viewer
      if (e.key === 'Escape' && state.isOpen) {
        e.preventDefault();
        closeViewer();
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
  #mdv-toc-sidebar {
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

    console.log('[Markdown Viewer] v1.0.0 Initialized (Theme Toggle)');
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
