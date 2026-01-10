# Userscript Guidelines

Guidelines for adding userscripts to this repository.

## File Structure

```bash
scripts/
├── github/           # GitHub-related scripts
├── youtube/          # YouTube-related scripts
├── general/          # General purpose scripts
└── <new-category>/   # Create new category if needed
```

Each script requires:

- `<name>.user.js` - The userscript file
- `<name>.md` - Documentation file

## Required Metadata

```javascript
// ==UserScript==
// @name         Script Name
// @namespace    https://userjs.khuong.dev
// @version      1.0
// @description  Brief description of what the script does
// @author       Lam Ngoc Khuong
// @updateURL    https://raw.githubusercontent.com/lamngockhuong/userjs/main/scripts/<category>/<filename>.user.js
// @downloadURL  https://raw.githubusercontent.com/lamngockhuong/userjs/main/scripts/<category>/<filename>.user.js
// @match        https://example.com/*
// @grant        none
// ==/UserScript==
```

### Field Descriptions

| Field          | Required | Description                                           |
| -------------- | -------- | ----------------------------------------------------- |
| `@name`        | Yes      | Human-readable script name                            |
| `@namespace`   | Yes      | Always `https://userjs.khuong.dev`                    |
| `@version`     | Yes      | Semantic version (e.g., `1.0`, `1.0.1`)               |
| `@description` | Yes      | Brief description of functionality                    |
| `@author`      | Yes      | `Lam Ngoc Khuong`                                     |
| `@updateURL`   | Yes      | Raw GitHub URL for auto-updates                       |
| `@downloadURL` | Yes      | Raw GitHub URL for downloads                          |
| `@match`       | Yes      | URL patterns where script runs                        |
| `@grant`       | Yes      | Permissions needed (`none` if no special permissions) |
| `@icon64`      | No       | Base64 encoded icon (optional)                        |
| `@source`      | No       | Link to source/gist (optional)                        |

## Naming Convention

- **Filename**: `kebab-case.user.js`
  - Good: `pr-merge-control.user.js`, `video-speed-controller.user.js`
  - Bad: `prMergeControl.user.js`, `video_speed.user.js`

- **Categories**: Use existing or create descriptive new ones
  - `github` - GitHub.com scripts
  - `youtube` - YouTube.com scripts
  - `general` - Multi-site or general purpose

## Documentation Template

Create `<name>.md` alongside the script:

```markdown
# Script Name

Brief description of what the script does.

## Features

- Feature 1
- Feature 2
- Feature 3

## Usage

How to use the script after installation.

## Notes

Any additional notes or configuration options.
```

## Adding a Script

1. Place `.user.js` in appropriate `scripts/<category>/`
2. Create matching `.md` documentation file
3. Run `pnpm generate-index`
4. Verify in dev server: `pnpm dev`

## URL Patterns

Update/Download URLs must use raw GitHub format:

```
https://raw.githubusercontent.com/lamngockhuong/userjs/main/scripts/<category>/<filename>.user.js
```

This ensures userscript managers can fetch updates directly from the repository.
