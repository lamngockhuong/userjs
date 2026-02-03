# GitHub Zen Mode

Distraction-free reading mode for GitHub with full-width content and toggleable sidebar.

## Features

- **Full-width content**: Removes max-width constraints (1280px → 100%)
- **Toggleable sidebar**: Hide/show metadata sidebar with smooth animation
- **State persistence**: Remembers preference via localStorage
- **SPA-aware**: Works with GitHub's single-page navigation
- **GPU-accelerated**: Smooth 60fps animations using CSS transforms

## Supported Pages

- Issues: `github.com/*/issues/*`
- Pull Requests: `github.com/*/pull/*`
- Discussions: `github.com/*/discussions/*`

## Usage

### Toggle Button

Floating button (bottom-right) appears on pages with sidebar.

### Keyboard Shortcut

`Alt+M` - Toggle sidebar visibility

## Notes

- Respects GitHub's dark/light mode
- Button only shows on pages with sidebar
- Animation: 250ms ease transition
