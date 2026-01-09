// ==UserScript==
// @name         GIFHub
// @namespace    https://userjs.khuong.dev
// @version      1.0.0
// @description  Insert GIFs into GitHub comments, PR descriptions, and issue bodies
// @author       Lam Ngoc Khuong
// @match        https://github.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM.xmlHttpRequest
// @connect      github-gifs.aldilaff6545.workers.dev
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  // Constants
  const API_URL = 'https://github-gifs.aldilaff6545.workers.dev';
  const DEBOUNCE_DELAY = 300;
  const STYLE_ID = 'gif-picker-styles';
  const TEXTAREA_SELECTORS = [
    'textarea[name="comment[body]"]',
    'textarea[name="pull_request[body]"]',
    'textarea[name="issue[body]"]',
    'textarea.js-comment-field',
    'textarea[id^="new_comment_field"]'
  ].join(', ');

  // GM_xmlhttpRequest compatibility
  const gmXHR = typeof GM_xmlhttpRequest !== 'undefined'
    ? GM_xmlhttpRequest
    : typeof GM !== 'undefined' && GM.xmlHttpRequest
      ? GM.xmlHttpRequest
      : null;

  if (!gmXHR) {
    console.error('[GIF Picker] GM_xmlhttpRequest not available');
    return;
  }

  // State
  let currentTextarea = null;
  let modal = null;
  let overlay = null;
  let debounceTimer = null;
  let abortController = null;

  // CSS styles
  const styles = `
        .gif-picker-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 4px 8px;
            margin-left: 4px;
            border: 1px solid var(--borderColor-default, #d0d7de);
            border-radius: 6px;
            background: var(--bgColor-default, #ffffff);
            color: var(--fgColor-default, #1f2328);
            cursor: pointer;
            font-size: 12px;
            font-weight: 500;
            transition: background 0.2s;
        }
        .gif-picker-btn:hover {
            background: var(--bgColor-muted, #f6f8fa);
        }
        .gif-picker-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.5);
            z-index: 999998;
        }
        .gif-picker-modal {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 500px;
            max-width: 90vw;
            max-height: 80vh;
            background: var(--bgColor-default, #ffffff);
            border: 1px solid var(--borderColor-default, #d0d7de);
            border-radius: 12px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.2);
            z-index: 999999;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
        .gif-picker-header {
            padding: 16px;
            border-bottom: 1px solid var(--borderColor-default, #d0d7de);
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .gif-picker-header h3 {
            margin: 0;
            flex: 1;
            font-size: 16px;
            font-weight: 600;
        }
        .gif-picker-close {
            background: none;
            border: none;
            font-size: 20px;
            cursor: pointer;
            color: var(--fgColor-muted, #656d76);
            padding: 4px 8px;
            border-radius: 4px;
        }
        .gif-picker-close:hover {
            background: var(--bgColor-muted, #f6f8fa);
        }
        .gif-picker-search {
            padding: 12px 16px;
            border-bottom: 1px solid var(--borderColor-default, #d0d7de);
        }
        .gif-picker-search input {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid var(--borderColor-default, #d0d7de);
            border-radius: 6px;
            font-size: 14px;
            background: var(--bgColor-default, #ffffff);
            color: var(--fgColor-default, #1f2328);
        }
        .gif-picker-search input:focus {
            outline: none;
            border-color: var(--borderColor-accent-emphasis, #0969da);
            box-shadow: 0 0 0 3px rgba(9,105,218,0.3);
        }
        .gif-picker-content {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            grid-auto-rows: 120px;
            gap: 8px;
            min-height: 200px;
        }
        .gif-picker-item {
            border-radius: 8px;
            overflow: hidden;
            cursor: pointer;
            border: 2px solid transparent;
            transition: border-color 0.2s, transform 0.2s;
            background: var(--bgColor-muted, #f6f8fa);
        }
        .gif-picker-item:hover,
        .gif-picker-item:focus {
            border-color: var(--borderColor-accent-emphasis, #0969da);
            transform: scale(1.05);
            z-index: 1;
            outline: none;
        }
        .gif-picker-item img {
            display: block;
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        .gif-picker-loading,
        .gif-picker-empty,
        .gif-picker-error {
            grid-column: 1 / -1;
            text-align: center;
            padding: 40px;
            color: var(--fgColor-muted, #656d76);
        }
        .gif-picker-loading::after {
            content: '';
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 2px solid var(--borderColor-default, #d0d7de);
            border-top-color: var(--borderColor-accent-emphasis, #0969da);
            border-radius: 50%;
            animation: gif-picker-spin 0.8s linear infinite;
            margin-left: 8px;
            vertical-align: middle;
        }
        @keyframes gif-picker-spin {
            to { transform: rotate(360deg); }
        }
        .gif-picker-error {
            color: var(--fgColor-danger, #d1242f);
            background: var(--bgColor-danger-muted, #ffebe9);
            border-radius: 6px;
            padding: 20px;
        }
    `;

  // Inject styles once
  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const styleEl = document.createElement('style');
    styleEl.id = STYLE_ID;
    styleEl.textContent = styles;
    document.head.appendChild(styleEl);
  }

  // Create GIF picker button
  function createGifButton() {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'gif-picker-btn';
    btn.innerHTML = '🎬 GIF';
    btn.title = 'Insert GIF';
    btn.setAttribute('aria-label', 'Insert GIF');
    return btn;
  }

  // Close modal and cleanup
  function closeModal() {
    clearTimeout(debounceTimer);
    if (modal) {
      modal.remove();
      modal = null;
    }
    if (overlay) {
      overlay.remove();
      overlay = null;
    }
    currentTextarea = null;
    document.removeEventListener('keydown', handleEscapeKey);
  }

  // Handle Escape key
  function handleEscapeKey(e) {
    if (e.key === 'Escape') closeModal();
  }

  // Create modal
  function createModal() {
    overlay = document.createElement('div');
    overlay.className = 'gif-picker-overlay';
    overlay.addEventListener('click', closeModal);

    modal = document.createElement('div');
    modal.className = 'gif-picker-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-label', 'GIF Picker');
    modal.innerHTML = `
            <div class="gif-picker-header">
                <h3>🎬 Search GIFs</h3>
                <button class="gif-picker-close" title="Close" aria-label="Close">&times;</button>
            </div>
            <div class="gif-picker-search">
                <input type="text" placeholder="Search for GIFs... (e.g., celebrate, thumbs up)" aria-label="Search GIFs">
            </div>
            <div class="gif-picker-content" role="listbox" aria-label="GIF results">
                <div class="gif-picker-empty">Type something to search for GIFs</div>
            </div>
        `;

    const closeBtn = modal.querySelector('.gif-picker-close');
    const searchInput = modal.querySelector('input');
    const content = modal.querySelector('.gif-picker-content');

    closeBtn.addEventListener('click', closeModal);
    document.addEventListener('keydown', handleEscapeKey);

    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      const query = e.target.value.trim();
      debounceTimer = setTimeout(() => searchGifs(query, content), DEBOUNCE_DELAY);
    });

    document.body.appendChild(overlay);
    document.body.appendChild(modal);
    searchInput.focus();
  }

  // Search for GIFs
  function searchGifs(query, container) {
    if (!query) {
      container.innerHTML = '<div class="gif-picker-empty">Type something to search for GIFs</div>';
      return;
    }

    container.innerHTML = '<div class="gif-picker-loading">Searching</div>';

    gmXHR({
      method: 'GET',
      url: `${API_URL}?q=${encodeURIComponent(query)}`,
      anonymous: true,
      headers: { 'Accept': 'application/json' },
      onload(response) {
        if (response.status !== 200) {
          container.innerHTML = '<div class="gif-picker-error">Failed to load GIFs. Please try again.</div>';
          return;
        }

        try {
          const data = JSON.parse(response.responseText);
          const gifs = data.data || [];

          if (!gifs.length) {
            container.innerHTML = '<div class="gif-picker-empty">No GIFs found. Try a different search term.</div>';
            return;
          }

          container.innerHTML = '';
          gifs.forEach(gif => renderGifItem(gif, query, container));
        } catch {
          container.innerHTML = '<div class="gif-picker-error">Error parsing response.</div>';
        }
      },
      onerror() {
        container.innerHTML = '<div class="gif-picker-error">Error loading GIFs. Please try again.</div>';
      }
    });
  }

  // Render single GIF item
  function renderGifItem(gif, query, container) {
    const images = gif.images || {};
    const previewUrl = images.fixed_width_small?.url
      || images.preview_gif?.url
      || images.fixed_height_small?.url
      || images.downsized?.url;
    const gifUrl = images.original?.url
      || images.fixed_height?.url
      || images.downsized?.url;
    const title = gif.title || query;

    if (!gifUrl || !previewUrl) return;

    const item = document.createElement('div');
    item.className = 'gif-picker-item';
    item.tabIndex = 0;
    item.setAttribute('role', 'option');
    item.setAttribute('aria-label', title);

    const img = document.createElement('img');
    img.src = previewUrl;
    img.alt = title;
    img.loading = 'lazy';
    img.onerror = () => item.remove();

    item.appendChild(img);

    const selectGif = () => {
      insertGif(gifUrl, title);
      closeModal();
    };

    item.addEventListener('click', selectGif);
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectGif();
      }
    });

    container.appendChild(item);
  }

  // Insert GIF into textarea
  function insertGif(url, alt) {
    if (!currentTextarea) return;

    const markdown = `![${alt}](${url})`;
    const { selectionStart: start, selectionEnd: end, value } = currentTextarea;

    currentTextarea.value = value.substring(0, start) + markdown + value.substring(end);
    currentTextarea.dispatchEvent(new Event('input', { bubbles: true }));

    const newPos = start + markdown.length;
    currentTextarea.setSelectionRange(newPos, newPos);
    currentTextarea.focus();
  }

  // Add GIF button to textarea toolbar
  function addGifButtonToToolbar(textarea) {
    if (textarea.dataset.gifButtonAdded) return;

    const container = textarea.closest('.js-previewable-comment-form, .CommentBox, .comment-form-head');
    if (!container) return;

    const toolbar = container.querySelector('markdown-toolbar, .toolbar-commenting, .comment-form-head .d-flex, .tabnav-tabs');
    if (!toolbar) return;

    const btn = createGifButton();
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      currentTextarea = textarea;
      createModal();
    });

    toolbar.appendChild(btn);
    textarea.dataset.gifButtonAdded = 'true';
  }

  // Process all textareas
  function processTextareas() {
    document.querySelectorAll(TEXTAREA_SELECTORS).forEach(addGifButtonToToolbar);
  }

  // Initialize
  function init() {
    injectStyles();
    processTextareas();

    // Single MutationObserver for DOM changes and URL changes
    let lastUrl = location.href;
    const observer = new MutationObserver((mutations) => {
      // Check for URL change (GitHub SPA navigation)
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        setTimeout(processTextareas, 300);
        return;
      }

      // Check for new textareas
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType !== Node.ELEMENT_NODE) continue;

          if (node.tagName === 'TEXTAREA') {
            setTimeout(() => addGifButtonToToolbar(node), 50);
          } else if (node.querySelectorAll) {
            const textareas = node.querySelectorAll('textarea');
            if (textareas.length) {
              setTimeout(() => textareas.forEach(addGifButtonToToolbar), 50);
            }
          }
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Run initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
