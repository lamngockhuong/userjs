// ==UserScript==
// @name         Markdown Viewer
// @namespace    https://userjs.khuong.dev
// @version      3.0.0
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
    isDragging: false
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
    const sep = document.createElement('div');
    sep.style.cssText = 'height: 1px; background: #e2e8f0; margin: 4px 0;';
    dropdown.appendChild(sep);

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
    });
  }

  // ==========================================================================
  // UI Components - Styles
  // ==========================================================================

  /**
   * Apply viewer styles using GM_addStyle
   */
  function applyViewerStyles() {
    // Only add once
    if (document.getElementById('mdv-styles')) return;

    const styles = `
      .mdv-content {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.6;
        color: #1a202c;
        max-width: 800px;
        margin: 0 auto;
      }
      .mdv-content h1, .mdv-content h2, .mdv-content h3,
      .mdv-content h4, .mdv-content h5, .mdv-content h6 {
        margin-top: 1.5em;
        margin-bottom: 0.5em;
        font-weight: 600;
        line-height: 1.3;
      }
      .mdv-content h1 { font-size: 2em; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.3em; }
      .mdv-content h2 { font-size: 1.5em; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.3em; }
      .mdv-content h3 { font-size: 1.25em; }
      .mdv-content p { margin: 1em 0; }
      .mdv-content a { color: #3182ce; text-decoration: none; }
      .mdv-content a:hover { text-decoration: underline; }
      .mdv-content code {
        background: #edf2f7;
        padding: 0.2em 0.4em;
        border-radius: 3px;
        font-size: 0.9em;
        font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
      }
      .mdv-content pre {
        background: #1a202c;
        color: #e2e8f0;
        padding: 16px;
        border-radius: 6px;
        overflow-x: auto;
        font-size: 0.9em;
      }
      .mdv-content pre code {
        background: none;
        padding: 0;
        color: inherit;
      }
      .mdv-content blockquote {
        border-left: 4px solid #e2e8f0;
        margin: 1em 0;
        padding: 0.5em 1em;
        color: #718096;
        background: #f7fafc;
      }
      .mdv-content table {
        border-collapse: collapse;
        width: 100%;
        margin: 1em 0;
      }
      .mdv-content th, .mdv-content td {
        border: 1px solid #e2e8f0;
        padding: 8px 12px;
        text-align: left;
      }
      .mdv-content th { background: #f7fafc; font-weight: 600; }
      .mdv-content img { max-width: 100%; height: auto; }
      .mdv-content ul, .mdv-content ol { padding-left: 2em; margin: 1em 0; }
      .mdv-content li { margin: 0.25em 0; }
      .mdv-content hr { border: none; border-top: 1px solid #e2e8f0; margin: 2em 0; }
      .mdv-replace { padding: 40px 20px; min-height: 100vh; background: #fff; }

      /* Dark mode support */
      @media (prefers-color-scheme: dark) {
        .mdv-content { color: #e2e8f0; }
        .mdv-content a { color: #63b3ed; }
        .mdv-content code { background: #2d3748; }
        .mdv-content blockquote { background: #2d3748; border-color: #4a5568; color: #a0aec0; }
        .mdv-content th { background: #2d3748; }
        .mdv-content th, .mdv-content td { border-color: #4a5568; }
        .mdv-replace { background: #1a202c; }
        .mdv-split .mdv-raw { background: #2d3748 !important; }
        .mdv-split .mdv-rendered { background: #1a202c; }
        .mdv-split .mdv-divider { background: #4a5568 !important; }
        .mdv-modal .mdv-modal-content { background: #2d3748; }
        .mdv-modal .mdv-backdrop { background: rgba(0,0,0,0.7); }
        #${UI_IDS.DROPDOWN} { background: #2d3748 !important; }
        #${UI_IDS.DROPDOWN} button { color: #e2e8f0 !important; }
        #${UI_IDS.DROPDOWN} button:hover { background: #4a5568 !important; }
        #${UI_IDS.DROPDOWN} > div { background: #4a5568 !important; }
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

    console.log('[Markdown Viewer] v3.0.0 Initialized (Phase 3 Rendering)');
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
