# GitHub Table Width Toggle

Toggle the max-width constraint on markdown tables in GitHub issues and discussions for better
readability of wide tables.

## Features

- Toggle button appears on hover above each markdown table
- Removes `max-width: 100%` constraint when expanded
- State persisted per-table (URL path + table index)
- Works with GitHub SPA navigation
- Uses GitHub's CSS variables for theme compatibility

## Usage

1. Install the userscript in Tampermonkey or Violentmonkey
2. Navigate to any GitHub issue or discussion with a table
3. Hover over a table to reveal the toggle button (top-right)
4. Click to expand/collapse the table width

## Icons

- **Lock icon**: Table has default width constraint
- **Unlock icon**: Table width is expanded (no max-width)

## Notes

- State is stored in localStorage per URL path and table index
- Tables are re-processed on SPA navigation
- Button appears only on hover to minimize visual clutter
