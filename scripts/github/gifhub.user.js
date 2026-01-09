// ==UserScript==
// @name         GIFHub
// @namespace    https://userjs.khuong.dev
// @version      1.1.0
// @description  Insert GIFs into GitHub comments, PRs, issues, and discussions
// @author       Lam Ngoc Khuong
// @match        https://github.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM.xmlHttpRequest
// @connect      github-gifs.aldilaff6545.workers.dev
// @connect      *
// @run-at       document-idle
// @sandbox      JavaScript
// @updateURL    https://raw.githubusercontent.com/lamngockhuong/userjs/main/scripts/github/gifhub.user.js
// @downloadURL  https://raw.githubusercontent.com/lamngockhuong/userjs/main/scripts/github/gifhub.user.js
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
    'textarea[id^="new_comment_field"]',
    'textarea[placeholder="Leave a comment"]',
    'textarea[placeholder^="Type your description"]',
    'textarea[placeholder^="Use Markdown"]',
    'textarea[aria-label="Markdown value"]',
    'textarea[class*="prc-Textarea"]'
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

  // Vietnamese diacritics mapping
  const VIET_MAP = {
    'à': 'a', 'á': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
    'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
    'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
    'è': 'e', 'é': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
    'ê': 'e', 'ề': 'e', 'ế': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
    'ì': 'i', 'í': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
    'ò': 'o', 'ó': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
    'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
    'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
    'ù': 'u', 'ú': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
    'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
    'ỳ': 'y', 'ý': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y',
    'đ': 'd',
    'À': 'A', 'Á': 'A', 'Ả': 'A', 'Ã': 'A', 'Ạ': 'A',
    'Ă': 'A', 'Ằ': 'A', 'Ắ': 'A', 'Ẳ': 'A', 'Ẵ': 'A', 'Ặ': 'A',
    'Â': 'A', 'Ầ': 'A', 'Ấ': 'A', 'Ẩ': 'A', 'Ẫ': 'A', 'Ậ': 'A',
    'È': 'E', 'É': 'E', 'Ẻ': 'E', 'Ẽ': 'E', 'Ẹ': 'E',
    'Ê': 'E', 'Ề': 'E', 'Ế': 'E', 'Ể': 'E', 'Ễ': 'E', 'Ệ': 'E',
    'Ì': 'I', 'Í': 'I', 'Ỉ': 'I', 'Ĩ': 'I', 'Ị': 'I',
    'Ò': 'O', 'Ó': 'O', 'Ỏ': 'O', 'Õ': 'O', 'Ọ': 'O',
    'Ô': 'O', 'Ồ': 'O', 'Ố': 'O', 'Ổ': 'O', 'Ỗ': 'O', 'Ộ': 'O',
    'Ơ': 'O', 'Ờ': 'O', 'Ớ': 'O', 'Ở': 'O', 'Ỡ': 'O', 'Ợ': 'O',
    'Ù': 'U', 'Ú': 'U', 'Ủ': 'U', 'Ũ': 'U', 'Ụ': 'U',
    'Ư': 'U', 'Ừ': 'U', 'Ứ': 'U', 'Ử': 'U', 'Ữ': 'U', 'Ự': 'U',
    'Ỳ': 'Y', 'Ý': 'Y', 'Ỷ': 'Y', 'Ỹ': 'Y', 'Ỵ': 'Y',
    'Đ': 'D'
  };

  // Convert Vietnamese to ASCII and remove unsupported characters
  function normalizeQuery(str) {
    return str
      .split('')
      .map(c => VIET_MAP[c] || c)
      .join('')
      .replace(/[^\x00-\x7F]/g, '') // Remove non-ASCII
      .replace(/\s+/g, ' ')
      .trim();
  }

  // State
  let currentTextarea = null;
  let modal = null;
  let overlay = null;
  let debounceTimer = null;

  // CSS styles - GIF button as text badge matching GitHub's tab style
  const styles = `
        .gif-picker-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 8px 16px;
            margin: 0;
            border: 1px solid transparent;
            border-bottom: none;
            border-radius: 6px 6px 0 0;
            background: transparent;
            color: var(--fgColor-muted, #656d76);
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif;
            line-height: 20px;
            transition: color 0.2s;
        }
        .gif-picker-btn:hover {
            color: var(--fgColor-default, #1f2328);
        }
        .gif-picker-wrapper {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 4px;
        }
        .gif-picker-wrapper .gif-picker-btn {
            padding: 4px 8px;
            font-size: 12px;
            border: 1px solid var(--borderColor-default, #d0d7de);
            border-radius: 6px;
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

  // Create GIF picker button matching GitHub's tab style
  function createGifButton() {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'gif-picker-btn';
    btn.textContent = 'GIF';
    btn.title = 'Insert GIF';
    btn.setAttribute('aria-label', 'Insert GIF');
    return btn;
  }

  // Close modal and cleanup
  function closeModal() {
    clearTimeout(debounceTimer);
    if (modal) {
      // Remove focus trap
      if (modal._focusTrap) {
        document.removeEventListener('focusin', modal._focusTrap, true);
      }
      modal.remove();
      modal = null;
    }
    if (overlay) {
      overlay.remove();
      overlay = null;
    }
    // Refocus the textarea after closing
    if (currentTextarea) {
      currentTextarea.focus();
    }
    currentTextarea = null;
  }

  // Create modal
  function createModal() {
    overlay = document.createElement('div');
    overlay.className = 'gif-picker-overlay';
    overlay.addEventListener('click', closeModal);

    modal = document.createElement('div');
    modal.className = 'gif-picker-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'GIF Picker');
    modal.innerHTML = `
            <div class="gif-picker-header">
                <h3>🎬 Search GIFs</h3>
                <button class="gif-picker-close" title="Close" aria-label="Close">&times;</button>
            </div>
            <div class="gif-picker-search">
                <input type="text" placeholder="Search for GIFs... (e.g., celebrate, thumbs up)" aria-label="Search GIFs" autocomplete="off">
            </div>
            <div class="gif-picker-content" role="listbox" aria-label="GIF results">
                <div class="gif-picker-empty">Type something to search for GIFs</div>
            </div>
        `;

    const closeBtn = modal.querySelector('.gif-picker-close');
    const searchInput = modal.querySelector('input');
    const content = modal.querySelector('.gif-picker-content');

    closeBtn.addEventListener('click', closeModal);

    // Block keyboard events - use BOTH capture and bubble phases
    const stopKeys = (e) => {
      e.stopPropagation();
      e.stopImmediatePropagation();
      if (e.key === 'Escape') {
        closeModal();
      }
    };

    // Capture phase (runs first)
    searchInput.addEventListener('keydown', stopKeys, true);
    searchInput.addEventListener('keyup', stopKeys, true);
    searchInput.addEventListener('keypress', stopKeys, true);
    modal.addEventListener('keydown', stopKeys, true);
    modal.addEventListener('keyup', stopKeys, true);
    modal.addEventListener('keypress', stopKeys, true);

    // Bubble phase (runs after)
    searchInput.addEventListener('keydown', stopKeys, false);
    searchInput.addEventListener('keyup', stopKeys, false);
    searchInput.addEventListener('keypress', stopKeys, false);

    searchInput.addEventListener('input', (e) => {
      e.stopPropagation();
      clearTimeout(debounceTimer);
      const query = e.target.value.trim();
      debounceTimer = setTimeout(() => searchGifs(query, content), DEBOUNCE_DELAY);
    });

    // Focus trap - refocus input if focus leaves modal
    const focusTrap = (e) => {
      if (modal && !modal.contains(e.target)) {
        e.preventDefault();
        e.stopPropagation();
        searchInput.focus();
      }
    };
    document.addEventListener('focusin', focusTrap, true);

    // Store focusTrap to remove later
    modal._focusTrap = focusTrap;

    document.body.appendChild(overlay);
    document.body.appendChild(modal);

    // Aggressive focus - multiple methods
    const doFocus = () => {
      searchInput.focus();
      searchInput.select();
    };

    // Immediate
    doFocus();

    // After paint
    requestAnimationFrame(doFocus);

    // After short delays
    setTimeout(doFocus, 10);
    setTimeout(doFocus, 50);
    setTimeout(doFocus, 100);
  }

  // Search for GIFs
  function searchGifs(query, container) {
    // Normalize: Vietnamese → ASCII, remove Japanese/other non-ASCII
    const normalizedQuery = normalizeQuery(query);

    if (!normalizedQuery) {
      container.innerHTML = '<div class="gif-picker-empty">Type in English or Vietnamese (diacritics will be removed)</div>';
      return;
    }

    container.innerHTML = '<div class="gif-picker-loading">Searching</div>';

    gmXHR({
      method: 'GET',
      url: `${API_URL}?q=${encodeURIComponent(normalizedQuery)}`,
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

  // Add GIF button to textarea
  function addGifButtonToToolbar(textarea) {
    if (textarea.dataset.gifButtonAdded) return;

    const btn = createGifButton();
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      currentTextarea = textarea;
      createModal();
    });

    // Method 1: Find markdown-toolbar (classic GitHub UI - PR, discussions)
    const form = textarea.closest('form, .js-previewable-comment-form');
    const markdownToolbar = form?.querySelector('markdown-toolbar');
    if (markdownToolbar) {
      markdownToolbar.appendChild(btn);
      textarea.dataset.gifButtonAdded = 'true';
      return;
    }

    // Method 2: Find Primer toolbar (new GitHub UI - issues)
    // Look for toolbar with role="toolbar" or the formatting icons container
    const primerContainer = textarea.closest('[class*="MarkdownEditor"], [class*="CommentBox"], form');
    const primerToolbar = primerContainer?.querySelector('[role="toolbar"], [class*="MarkdownToolbar"], [class*="ActionBar"]');
    if (primerToolbar) {
      primerToolbar.appendChild(btn);
      textarea.dataset.gifButtonAdded = 'true';
      return;
    }

    // Method 3: Find tab nav (Write/Preview tabs)
    const tabContainer = textarea.closest('form')?.closest('div')?.parentElement;
    const tabNav = tabContainer?.querySelector('.tabnav-tabs, [class*="UnderlineNav"]');
    if (tabNav) {
      tabNav.appendChild(btn);
      textarea.dataset.gifButtonAdded = 'true';
      return;
    }

    // Method 4: Last resort - add wrapper (only if no toolbar found)
    if (textarea.className.includes('prc-Textarea') && textarea.parentNode) {
      const wrapper = document.createElement('div');
      wrapper.className = 'gif-picker-wrapper';
      wrapper.appendChild(btn);
      textarea.parentNode.insertBefore(wrapper, textarea);
      textarea.dataset.gifButtonAdded = 'true';
    }
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
