// ==UserScript==
// @name         PR Merge Control
// @namespace    https://userjs.khuong.dev
// @version      1.3
// @description  Automatically disable regular/squash merge on target branch for GitHub PRs
// @icon64       data:image/png;base64,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
// @author       Lam Ngoc Khuong
// @updateURL    https://raw.githubusercontent.com/lamngockhuong/userjs/main/scripts/github/pr-merge-control.user.js
// @downloadURL  https://raw.githubusercontent.com/lamngockhuong/userjs/main/scripts/github/pr-merge-control.user.js
// @match        https://github.com/*/pull/*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const RELEASE_BRANCHES = ['main', 'master'];

  function getTargetBranch() {
    const selectors = [
      '.base-ref .css-truncate-target',
      '[data-hovercard-type="repository"] + span .css-truncate-target',
      '.commit-ref.base-ref .css-truncate-target',
      'span.commit-ref.css-truncate.user-select-contain.expandable.base-ref span.css-truncate-target'
    ];

    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el?.textContent) {
        return el.textContent.trim();
      }
    }

    const mergeInfo = document.querySelector('.merge-message .commit-ref');
    if (mergeInfo?.textContent) {
      return mergeInfo.textContent.trim();
    }

    return null;
  }

  function isReleaseBranch(branch) {
    return RELEASE_BRANCHES.includes(branch);
  }

  function shouldDisableMethod(methodLabel, isRelease) {
    const label = methodLabel.toLowerCase();
    const isMergeCommit = label.includes('merge commit') || label === 'merge pull request';
    const isSquash = label.includes('squash');
    const isRebase = label.includes('rebase');

    if (isRelease) {
      // Release branch: only allow merge commit
      return isSquash || isRebase;
    } else {
      // Feature branch: only allow squash
      return isMergeCommit || isRebase;
    }
  }

  function disableElement(el) {
    el.style.opacity = '0.35';
    el.style.pointerEvents = 'none';
    el.style.cursor = 'not-allowed';
    el.setAttribute('aria-disabled', 'true');
    if (el.tagName === 'BUTTON') {
      el.disabled = true;
    }
  }

  function enableElement(el) {
    el.style.opacity = '';
    el.style.pointerEvents = '';
    el.style.cursor = '';
    el.removeAttribute('aria-disabled');
    if (el.tagName === 'BUTTON') {
      el.disabled = false;
    }
  }

  function addDisabledBadge(container) {
    if (container.querySelector('.pr-merge-disabled-badge')) return;
    const badge = document.createElement('span');
    badge.className = 'pr-merge-disabled-badge';
    badge.style.cssText = 'color: #cf222e; font-size: 0.85em; margin-left: 6px;';
    badge.textContent = '(disabled)';
    container.appendChild(badge);
  }

  function removeDisabledBadge(container) {
    const badge = container.querySelector('.pr-merge-disabled-badge');
    if (badge) badge.remove();
  }

  // Disable dropdown menu items
  function applyMenuRestrictions(menu, targetBranch) {
    const items = menu.querySelectorAll('li[role="menuitemradio"]');
    if (items.length === 0) return;

    const isRelease = isReleaseBranch(targetBranch);

    items.forEach((item) => {
      const labelEl = item.querySelector('[class*="ItemLabel"]');
      const label = labelEl?.textContent?.trim();
      if (!label) return;

      enableElement(item);
      removeDisabledBadge(labelEl);

      if (shouldDisableMethod(label, isRelease)) {
        disableElement(item);
        addDisabledBadge(labelEl);
      }
    });

    console.log(`[PR Merge Control] Menu restricted for: ${targetBranch}`);
  }

  // Disable main merge button
  function applyMainButtonRestriction(targetBranch) {
    // Find main merge button by looking for button with merge-related text in merge box
    const mergeBox = document.querySelector('.merge-message, [data-testid="merge-box"]');
    if (!mergeBox) return;

    // Find button group containing merge actions (use partial class match for stability)
    const buttonGroup = mergeBox.querySelector('[class*="ButtonGroup"]');
    if (!buttonGroup) return;

    // Find the main button (first button with flex-1 class or primary action button)
    const mainButton = buttonGroup.querySelector('button.flex-1, button[class*="ButtonBase"]:first-of-type');
    if (!mainButton) return;

    const labelEl = mainButton.querySelector('[data-component="text"]');
    const label = labelEl?.textContent?.trim();
    if (!label) return;

    const isRelease = isReleaseBranch(targetBranch);

    enableElement(mainButton);

    if (shouldDisableMethod(label, isRelease)) {
      disableElement(mainButton);
      console.log(`[PR Merge Control] Main button disabled: "${label}"`);
    }
  }

  function observeDOM() {
    const targetBranch = getTargetBranch();

    const observer = new MutationObserver((mutations) => {
      const branch = getTargetBranch();
      if (!branch) return;

      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType !== Node.ELEMENT_NODE) continue;

          // Check for dropdown menu
          const menu =
            node.querySelector?.('ul[role="menu"]') ||
            (node.matches?.('ul[role="menu"]') ? node : null);

          if (menu && menu.querySelector('li[aria-keyshortcuts="c"]')) {
            setTimeout(() => applyMenuRestrictions(menu, branch), 10);
          }

          // Check for button group (merge button area) - use partial class match for stability
          if (
            node.querySelector?.('[class*="ButtonGroup"]') ||
            node.matches?.('[class*="ButtonGroup"]') ||
            node.closest?.('[class*="ButtonGroup"]')
          ) {
            setTimeout(() => applyMainButtonRestriction(branch), 50);
          }
        }
      }

      // Also check main button on any mutation in merge area
      applyMainButtonRestriction(branch);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return observer;
  }

  // Poll until merge box is found and restriction applied
  function pollForMergeBox(maxAttempts = 30, interval = 500) {
    let attempts = 0;
    let applied = false;

    const poll = () => {
      const branch = getTargetBranch();
      if (!branch) {
        if (attempts < maxAttempts) {
          attempts++;
          setTimeout(poll, interval);
        }
        return;
      }

      const mergeBox = document.querySelector('.merge-message, [data-testid="merge-box"]');
      const buttonGroup = mergeBox?.querySelector('[class*="ButtonGroup"]');
      const mainButton = buttonGroup?.querySelector('button.flex-1, button[class*="ButtonBase"]:first-of-type');

      if (mainButton && !applied) {
        applyMainButtonRestriction(branch);
        applied = true;
        console.log(`[PR Merge Control] Applied via polling after ${attempts} attempts`);
      } else if (attempts < maxAttempts) {
        attempts++;
        setTimeout(poll, interval);
      }
    };

    poll();
  }

  function init() {
    observeDOM();
    pollForMergeBox();
    console.log('[PR Merge Control] v1.3 Initialized');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
