# Markdown Viewer

Render markdown files from local (file://) or raw URLs with full GFM support.

## Features

- Floating button with dropdown menu
- 3 display modes: Replace, Split view, Modal
- Manual theme toggle (Auto/Light/Dark)
- GitHub-flavored markdown rendering
- KaTeX math support ($...$ and $$...$$)
- Mermaid diagram support (flowcharts, sequence, mindmaps, etc.)
- Syntax highlighting (highlight.js)
- Copy button on code blocks (hover to show)
- Inline TOC via `[[toc]]` placeholder
- Auto-generated TOC sidebar
- Footnotes support
- Keyboard shortcuts with help modal (`?`)
- Position & preferences persist
- CSP-safe: works on GitHub raw URLs (FontFace API for fonts)

## Supported URLs

| Source      | URL Pattern                    |
| ----------- | ------------------------------ |
| Local files | `file:///*.md`                 |
| GitHub raw  | `raw.githubusercontent.com/*`  |
| GitHub Gist | `gist.githubusercontent.com/*` |
| GitLab raw  | `gitlab.com/*/-/raw/*`         |
| Bitbucket   | `bitbucket.org/*/raw/*`        |

## Usage

1. Navigate to a markdown file URL
2. Click the floating button (bottom-right corner)
3. Select display mode from dropdown

### Keyboard Shortcuts

| Shortcut       | Action                    |
| -------------- | ------------------------- |
| `?`            | Show keyboard help        |
| `Ctrl+Shift+M` | Toggle viewer             |
| `Ctrl+Shift+T` | Cycle theme               |
| `ESC`          | Close help / Close viewer |

### Display Modes

- **Replace**: Replaces entire page with rendered markdown
- **Split**: Side-by-side raw and rendered view (resizable)
- **Modal**: Full-screen overlay modal

### Theme Options

- **Auto**: Follows system preference (default)
- **Light**: Force light theme
- **Dark**: Force dark theme

## Local File Access

For `file://` URLs to work, enable file access in your browser:

### Chrome/Edge (Tampermonkey)

1. Go to `chrome://extensions`
2. Click "Details" on Tampermonkey
3. Enable "Allow access to file URLs"

### Firefox (Tampermonkey)

1. Go to `about:addons`
2. Click Tampermonkey → Permissions
3. Enable "Access your data for all websites"

## Notes

- Button position is draggable and persists across sessions
- Display mode and theme preferences persist via GM_setValue
- TOC sidebar shows on left, auto-hides on mobile
- Math renders only when content contains `$` expressions
- Uses @resource for CSP-safe dependency loading

## Known Limitations

### Chrome + GitHub Raw URLs

Chrome's strict sandbox blocks userscript managers on `raw.githubusercontent.com`. The script won't
run.

**Workaround:** Use Firefox for GitHub raw URLs.

Other sources (file://, GitLab, Bitbucket, Gist) work fine on Chrome.

## Dependencies

Loaded from CDN (jsdelivr) via @resource:

- markdown-it v14.1.0
- markdown-it-footnote v4.0.0
- markdown-it-anchor v9.2.0
- markdown-it-toc-done-right v4.2.0
- markdown-it-texmath v1.0.0
- KaTeX v0.16.21
- Mermaid v10.9.0
- highlight.js v11.11.1
- DOMPurify v3.2.4
