# Markdown Viewer

Render and edit markdown files from local (file://) or raw URLs with full GFM support.

## Features

- Floating button with dropdown menu
- 3 display modes: Replace, Split view, Modal
- **Editor mode** for local files (with live preview)
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

| Shortcut       | Action                      |
| -------------- | --------------------------- |
| `?`            | Show keyboard help          |
| `Ctrl+Shift+M` | Toggle viewer               |
| `Ctrl+Shift+E` | Toggle editor (local files) |
| `Ctrl+Shift+T` | Cycle theme                 |
| `ESC`          | Close viewer/editor/help    |

### Display Modes

- **Replace**: Replaces entire page with rendered markdown
- **Split**: Side-by-side raw and rendered view (resizable)
- **Modal**: Full-screen overlay modal

| Replace Mode                                                                                                    | Split Mode                                                                                                  |
| --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| ![Replace](https://raw.githubusercontent.com/lamngockhuong/userjs/main/docs/images/markdown-viewer-replace.png) | ![Split](https://raw.githubusercontent.com/lamngockhuong/userjs/main/docs/images/markdown-viewer-split.png) |

| Modal Mode                                                                                                  | Floating Button                                                                                                 |
| ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| ![Modal](https://raw.githubusercontent.com/lamngockhuong/userjs/main/docs/images/markdown-viewer-modal.png) | ![Button](https://raw.githubusercontent.com/lamngockhuong/userjs/main/docs/images/markdown-viewer-dropdown.png) |

### Theme Options

- **Auto**: Follows system preference (default)
- **Light**: Force light theme
- **Dark**: Force dark theme

## Editor Mode (Local Files Only)

Edit markdown files directly in browser with live preview.

![Editor Mode](https://raw.githubusercontent.com/lamngockhuong/userjs/main/docs/images/markdown-viewer-editor.png)

### How to Use

1. Open a local markdown file (`file://`)
2. Click dropdown → "Edit File" (or press `Ctrl+Shift+E`)
3. Edit in left pane, see live preview in right pane
4. Click "Save New File" to download edited content
5. Replace original file with downloaded file

### Editor Shortcuts

| Shortcut       | Action        |
| -------------- | ------------- |
| `Ctrl+S`       | Download file |
| `Ctrl+B`       | Bold          |
| `Ctrl+I`       | Italic        |
| `Ctrl+K`       | Insert link   |
| `Ctrl+Shift+S` | Strikethrough |
| `Ctrl+Shift+K` | Code block    |
| `Tab`          | Indent        |
| `Shift+Tab`    | Unindent      |
| `ESC`          | Close editor  |

### Editor Toolbar

- **B** / **I** / **S**: Bold, Italic, Strikethrough
- **H1** / **H2** / **H3**: Headings
- **`** / **```**: Inline code, Code block
- **Link** / **Image**: Insert link, image
- **Lists**: Bullet, Numbered, Quote
- **Table**: Insert table template

### Save Limitation

Due to browser security, direct file overwrite is not possible. The editor downloads the edited
file - you need to manually replace the original file.

**Tip**: Enable "Ask where to save" in browser settings to choose save location directly.

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

### Editor Save

Browser security prevents direct file writes from `file://` protocol. Edited content is downloaded
as a new file - manually replace the original to save changes.

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
