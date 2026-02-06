// ==UserScript==
// @name         GitHub Zen Mode
// @namespace    https://userjs.khuong.dev
// @version      1.1
// @description  Distraction-free reading with full-width content and toggleable sidebar
// @icon64       data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMyNDI5MmYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cmVjdCB4PSIzIiB5PSIzIiB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHJ4PSIyIi8+PHBhdGggZD0iTTE1IDN2MTgiLz48cGF0aCBkPSJtOCA5IDMgMy0zIDMiLz48L3N2Zz4=
// @author       Lam Ngoc Khuong
// @updateURL    https://raw.githubusercontent.com/lamngockhuong/userjs/main/scripts/github/github-zen-mode.user.js
// @downloadURL  https://raw.githubusercontent.com/lamngockhuong/userjs/main/scripts/github/github-zen-mode.user.js
// @match        https://github.com/*/issues/*
// @match        https://github.com/*/pull/*
// @match        https://github.com/*/discussions/*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  // Layout 1: New UI (Issues with React)
  const SELECTORS_NEW = {
    contentContainer: '[class*="ContentWrapper-module__contentContainer"]',
    sidebar: '[data-testid="issue-viewer-metadata-container"]'
  };

  // Layout 2: Old UI (PR with Layout component)
  const SELECTORS_LAYOUT = {
    layout: '.Layout',
    mainContent: '.Layout-main',
    sidebar: '.Layout-sidebar'
  };

  // Layout 3: Discussion (flexbox gutter)
  const SELECTORS_DISCUSSION = {
    container: '.gutter-condensed.gutter-lg',
    sidebar: '#partial-discussion-sidebar'
  };

  // Layout 4: PageLayout (React - newer PR/Issues)
  // Note: GitHub uses PascalCase (Pane, Content) not lowercase
  const SELECTORS_PAGELAYOUT = {
    root: '[class*="prc-PageLayout-PageLayoutRoot"]',
    contentWrapper: '[class*="prc-PageLayout-ContentWrapper"]',
    content: '[class*="prc-PageLayout-Content-"]',
    paneWrapper: '[class*="prc-PageLayout-PaneWrapper"]',
    pane: '[class*="prc-PageLayout-Pane-"]'
  };

  const STORAGE_KEY = 'github-zen-mode-sidebar-hidden';
  const ANIMATION_MS = 250;
  const BUTTON_ID = 'gh-zen-toggle-btn';
  const HIDDEN_CLASS = 'gh-zen-sidebar-hidden';

  let isHidden = loadState();

  function loadState() {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  }

  function saveState(hidden) {
    localStorage.setItem(STORAGE_KEY, String(hidden));
  }

  function detectLayout() {
    if (document.querySelector(SELECTORS_PAGELAYOUT.paneWrapper)) return 'pagelayout';
    if (document.querySelector(SELECTORS_NEW.sidebar)) return 'new';
    if (document.querySelector(SELECTORS_LAYOUT.sidebar)) return 'layout';
    if (document.querySelector(SELECTORS_DISCUSSION.sidebar)) return 'discussion';
    return null;
  }

  function getSidebar() {
    return (
      document.querySelector(SELECTORS_PAGELAYOUT.paneWrapper) ||
      document.querySelector(SELECTORS_NEW.sidebar) ||
      document.querySelector(SELECTORS_LAYOUT.sidebar) ||
      document.querySelector(SELECTORS_DISCUSSION.sidebar)
    );
  }

  function injectStyles() {
    if (document.getElementById('gh-zen-styles')) return;

    const style = document.createElement('style');
    style.id = 'gh-zen-styles';
    style.textContent = `
      /* === Layout 1: New UI (Issues) === */
      ${SELECTORS_NEW.contentContainer} {
        max-width: 100% !important;
      }

      ${SELECTORS_NEW.sidebar} {
        transition: margin-right ${ANIMATION_MS}ms ease,
                    opacity ${ANIMATION_MS}ms ease,
                    visibility ${ANIMATION_MS}ms ease;
        overflow: hidden;
      }

      ${SELECTORS_NEW.sidebar}.${HIDDEN_CLASS} {
        margin-right: -320px !important;
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
      }

      /* === Layout 2: Old UI (PR) === */
      ${SELECTORS_LAYOUT.layout} {
        max-width: 100% !important;
      }

      ${SELECTORS_LAYOUT.sidebar} {
        transition: transform ${ANIMATION_MS}ms ease,
                    opacity ${ANIMATION_MS}ms ease,
                    visibility ${ANIMATION_MS}ms ease;
        transform-origin: right center;
      }

      ${SELECTORS_LAYOUT.sidebar}.${HIDDEN_CLASS} {
        transform: translateX(100%);
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
        position: absolute;
        right: 0;
      }

      /* Grid-based expansion for PR layout */
      ${SELECTORS_LAYOUT.layout}:has(${SELECTORS_LAYOUT.sidebar}.${HIDDEN_CLASS}) {
        grid-template-columns: 1fr !important;
      }

      ${SELECTORS_LAYOUT.layout}:has(${SELECTORS_LAYOUT.sidebar}.${HIDDEN_CLASS}) ${SELECTORS_LAYOUT.mainContent} {
        max-width: 100% !important;
        grid-column: 1 / -1 !important;
      }

      /* Expand container-xl when PR/Discussion sidebar hidden */
      .container-xl:has(${SELECTORS_LAYOUT.sidebar}.${HIDDEN_CLASS}),
      .container-xl:has(${SELECTORS_DISCUSSION.sidebar}.${HIDDEN_CLASS}) {
        max-width: 100% !important;
      }

      /* === Layout 3: Discussion (flexbox gutter) === */
      ${SELECTORS_DISCUSSION.sidebar} {
        transition: transform ${ANIMATION_MS}ms ease,
                    opacity ${ANIMATION_MS}ms ease,
                    visibility ${ANIMATION_MS}ms ease;
        transform-origin: right center;
      }

      ${SELECTORS_DISCUSSION.sidebar}.${HIDDEN_CLASS} {
        transform: translateX(100%);
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
        position: absolute;
        right: 0;
      }

      /* When discussion sidebar hidden, main content expands */
      ${SELECTORS_DISCUSSION.container}:has(${SELECTORS_DISCUSSION.sidebar}.${HIDDEN_CLASS}) > .col-md-9 {
        flex: 0 0 100% !important;
        max-width: 100% !important;
      }

      /* === Layout 4: PageLayout (React) === */
      /* Hide the pane wrapper (contains sidebar) */
      ${SELECTORS_PAGELAYOUT.paneWrapper}.${HIDDEN_CLASS} {
        display: none !important;
      }

      /* Override pane width CSS custom properties when hidden */
      @layer primer-react {
        [class*="prc-PageLayout-PageLayoutRoot"]:has(${SELECTORS_PAGELAYOUT.paneWrapper}.${HIDDEN_CLASS}) {
          --pane-width-small: 0px !important;
          --pane-width-medium: 0px !important;
          --pane-width-large: 0px !important;
          --pane-max-width-diff: 0px !important;
        }
      }

      /* Expand content when pane is hidden */
      [class*="prc-PageLayout-PageLayoutContent"]:has(${SELECTORS_PAGELAYOUT.paneWrapper}.${HIDDEN_CLASS}) ${SELECTORS_PAGELAYOUT.contentWrapper},
      [class*="prc-PageLayout-PageLayoutContent"]:has(${SELECTORS_PAGELAYOUT.paneWrapper}.${HIDDEN_CLASS}) ${SELECTORS_PAGELAYOUT.content} {
        max-width: 100% !important;
        flex: 1 1 100% !important;
      }

      /* Expand container-xl to full width when PageLayout pane is hidden */
      .container-xl:has(${SELECTORS_PAGELAYOUT.paneWrapper}.${HIDDEN_CLASS}) {
        max-width: 100% !important;
      }

      /* === Toggle Button === */
      #${BUTTON_ID} {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 40px;
        height: 40px;
        border-radius: 6px;
        border: 1px solid var(--borderColor-default, #d0d7de);
        background-color: var(--bgColor-default, #ffffff);
        color: var(--fgColor-default, #1f2328);
        cursor: pointer;
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 1px 3px rgba(31, 35, 40, 0.12);
        transition: background-color 150ms ease;
      }

      #${BUTTON_ID}:hover {
        background-color: var(--bgColor-muted, #f6f8fa);
      }

      #${BUTTON_ID}:active {
        background-color: var(--bgColor-emphasis, #eaeef2);
      }

      #${BUTTON_ID} svg {
        width: 20px;
        height: 20px;
      }
    `;
    document.head.appendChild(style);
  }

  function getSidebarShowIcon() {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M15 3v18"/>
      <path d="m10 15-3-3 3-3"/>
    </svg>`;
  }

  function getSidebarHideIcon() {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M15 3v18"/>
      <path d="m8 9 3 3-3 3"/>
    </svg>`;
  }

  function updateButtonIcon(button, hidden) {
    button.innerHTML = hidden ? getSidebarShowIcon() : getSidebarHideIcon();
    button.title = hidden ? 'Show sidebar (Alt+M)' : 'Hide sidebar (Alt+M)';
  }

  function createToggleButton() {
    if (document.getElementById(BUTTON_ID)) return;
    if (!getSidebar()) return;

    const button = document.createElement('button');
    button.id = BUTTON_ID;
    updateButtonIcon(button, isHidden);

    button.addEventListener('click', toggleSidebar);
    document.body.appendChild(button);
  }

  function toggleSidebar() {
    const sidebar = getSidebar();
    if (!sidebar) return;

    isHidden = !isHidden;
    sidebar.classList.toggle(HIDDEN_CLASS, isHidden);
    saveState(isHidden);

    const button = document.getElementById(BUTTON_ID);
    if (button) {
      updateButtonIcon(button, isHidden);
    }
  }

  function applySidebarState() {
    const sidebar = getSidebar();
    if (!sidebar) return;

    sidebar.classList.toggle(HIDDEN_CLASS, isHidden);

    const button = document.getElementById(BUTTON_ID);
    if (button) {
      updateButtonIcon(button, isHidden);
    }
  }

  function setupKeyboardShortcut() {
    document.addEventListener('keydown', (e) => {
      if (e.altKey && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        toggleSidebar();
      }
    });
  }

  function observeNavigation() {
    let lastUrl = location.href;

    const observer = new MutationObserver(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        setTimeout(() => {
          applySidebarState();
          createToggleButton();
        }, 100);
      }

      // Check for dynamically loaded sidebar
      const sidebar = getSidebar();
      if (sidebar && !sidebar.hasAttribute('data-gh-zen-init')) {
        sidebar.setAttribute('data-gh-zen-init', 'true');
        applySidebarState();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  function init() {
    injectStyles();
    createToggleButton();
    applySidebarState();
    setupKeyboardShortcut();
    observeNavigation();
    console.log('[GitHub Zen Mode] v1.1 Initialized - Layout:', detectLayout() || 'pending');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
