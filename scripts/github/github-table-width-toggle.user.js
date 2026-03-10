// ==UserScript==
// @name         GitHub Table Width Toggle
// @namespace    https://userjs.khuong.dev
// @version      1.0
// @description  Toggle max-width constraint on markdown tables in GitHub issues and discussions
// @icon64       data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMyNDI5MmYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cmVjdCB4PSIzIiB5PSIzIiB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHJ4PSIyIi8+PHBhdGggZD0iTTMgOWgxOCIvPjxwYXRoIGQ9Ik0zIDE1aDE4Ii8+PHBhdGggZD0iTTkgM3YxOCIvPjwvc3ZnPg==
// @author       Lam Ngoc Khuong
// @updateURL    https://raw.githubusercontent.com/lamngockhuong/userjs/main/scripts/github/github-table-width-toggle.user.js
// @downloadURL  https://raw.githubusercontent.com/lamngockhuong/userjs/main/scripts/github/github-table-width-toggle.user.js
// @match        https://github.com/*/issues/*
// @match        https://github.com/*/discussions/*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const STORAGE_PREFIX = 'gh-table-width';
  const EXPANDED_CLASS = 'gh-table-expanded';
  const BUTTON_CLASS = 'gh-table-toggle-btn';

  function injectStyles() {
    if (document.getElementById('gh-table-width-styles')) return;

    const style = document.createElement('style');
    style.id = 'gh-table-width-styles';
    style.textContent = `
      .${EXPANDED_CLASS} {
        max-width: none !important;
        width: max-content !important;
      }

      .gh-table-wrapper {
        position: relative;
      }

      .${BUTTON_CLASS} {
        position: absolute;
        top: -28px;
        right: 0;
        width: 24px;
        height: 24px;
        border-radius: 4px;
        border: 1px solid var(--borderColor-default, #d0d7de);
        background-color: var(--bgColor-default, #ffffff);
        color: var(--fgColor-muted, #656d76);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 150ms ease, background-color 150ms ease;
      }

      .gh-table-wrapper:hover .${BUTTON_CLASS},
      .${BUTTON_CLASS}:focus {
        opacity: 1;
      }

      .${BUTTON_CLASS}:hover {
        background-color: var(--bgColor-muted, #f6f8fa);
        color: var(--fgColor-default, #1f2328);
      }

      .${BUTTON_CLASS} svg {
        width: 14px;
        height: 14px;
      }
    `;
    document.head.appendChild(style);
  }

  function getLockIcon() {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;
  }

  function getUnlockIcon() {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>`;
  }

  function getStorageKey(tableIndex) {
    return `${STORAGE_PREFIX}:${location.pathname}:${tableIndex}`;
  }

  function loadState(tableIndex) {
    return localStorage.getItem(getStorageKey(tableIndex)) === 'true';
  }

  function saveState(tableIndex, expanded) {
    localStorage.setItem(getStorageKey(tableIndex), String(expanded));
  }

  function updateButton(button, expanded) {
    button.innerHTML = expanded ? getUnlockIcon() : getLockIcon();
    button.title = expanded ? 'Restore table width' : 'Expand table width';
  }

  function processTable(table, tableIndex) {
    if (table.hasAttribute('data-gh-table-init')) return;
    table.setAttribute('data-gh-table-init', 'true');

    let wrapper = table.closest('.gh-table-wrapper');
    if (!wrapper) {
      wrapper = document.createElement('div');
      wrapper.className = 'gh-table-wrapper';
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    }

    const button = document.createElement('button');
    button.className = BUTTON_CLASS;
    button.type = 'button';

    const isExpanded = loadState(tableIndex);
    table.classList.toggle(EXPANDED_CLASS, isExpanded);
    updateButton(button, isExpanded);

    button.addEventListener('click', () => {
      const expanded = table.classList.toggle(EXPANDED_CLASS);
      saveState(tableIndex, expanded);
      updateButton(button, expanded);
    });

    wrapper.appendChild(button);
  }

  function processTables() {
    const tables = document.querySelectorAll('.markdown-body table');
    tables.forEach((table, index) => processTable(table, index));
  }

  function observeChanges() {
    let lastUrl = location.href;

    const observer = new MutationObserver(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        setTimeout(processTables, 100);
      } else {
        const uninitTables = document.querySelectorAll('.markdown-body table:not([data-gh-table-init])');
        if (uninitTables.length > 0) {
          processTables();
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  function init() {
    injectStyles();
    processTables();
    observeChanges();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
