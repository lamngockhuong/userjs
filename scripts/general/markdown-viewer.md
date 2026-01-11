# Markdown Viewer

Render markdown files from local or raw URLs with full GFM (GitHub Flavored Markdown) support,
including syntax highlighting, math rendering, and diagram support.

## Features

- **GFM Support**: Full GitHub Flavored Markdown rendering with tables, strikethrough, task lists
- **Multiple Source Support**: Render from:
  - Local markdown files (`file:///...`)
  - GitHub raw content (`raw.githubusercontent.com`)
  - GitLab raw content (`gitlab.com/-/raw/`)
  - Bitbucket raw content (`bitbucket.org/*/raw/`)
  - GitHub Gist (`gist.githubusercontent.com`)
- **Syntax Highlighting**: Supports 11 common languages (JavaScript, TypeScript, Python, Bash, JSON,
  YAML, HTML, CSS, SQL, Markdown, Shell)
- **Math Support**: Render KaTeX mathematical expressions inline and as blocks
- **Diagram Rendering**: Support for Mermaid diagrams
- **Table of Contents**: Auto-generated from headings
- **Footnotes & Anchors**: Extended markdown features with auto-generated anchor links
- **CDN Fallback**: Automatic fallback between jsDelivr and unpkg if primary CDN fails
- **Preference Persistence**: Remember display mode and last viewer state via
  `GM_getValue`/`localStorage`

## Usage

1. Install the userscript in your userscript manager (Tampermonkey, Violentmonkey, etc.)
2. Navigate to any markdown file (`.md` or `.markdown` extension) from supported sources
3. The script will automatically detect markdown content
4. In Phase 2: Control rendering via floating button with display mode options

## Notes

- **Phase 1 Implementation**: Focuses on dependency loading and state management. UI components
  (floating button, dropdown menu, TOC sidebar) planned for Phase 2
- **Performance**: Uses common language subset for highlight.js (~200KB) instead of full bundle
  (~1.3MB)
- **Dependency Loading**: Scripts load in optimized order - independent scripts in parallel,
  dependent scripts sequentially
- **State Management**: Closure-based state prevents global namespace pollution
- **Fallback Support**: If primary CDN fails, automatically tries fallback CDN

## Supported Content Sources

| Source      | URL Pattern                  | Status    |
| ----------- | ---------------------------- | --------- |
| Local Files | `file:///*.md`               | Supported |
| GitHub      | `raw.githubusercontent.com`  | Supported |
| GitHub Gist | `gist.githubusercontent.com` | Supported |
| GitLab      | `gitlab.com/*/-/raw/*.md`    | Supported |
| Bitbucket   | `bitbucket.org/*/raw/*.md`   | Supported |
