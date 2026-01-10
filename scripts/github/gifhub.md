# GIFHub

Insert GIFs directly into GitHub comments, PRs, issues, and discussions with a simple click.

## Features

- **GIF Button** - Adds a "GIF" button to GitHub's markdown toolbar
- **Search GIFs** - Search from Giphy's extensive GIF library
- **Vietnamese Support** - Automatically converts Vietnamese diacritics to ASCII for better search
  results
- **Keyboard Accessible** - Full keyboard navigation support (Tab, Enter, Escape)
- **Dark Mode** - Respects GitHub's theme settings

## How to Use

1. Navigate to any GitHub page with a comment box (PR, Issue, Discussion)
2. Click the **GIF** button in the markdown toolbar
3. Search for a GIF using keywords (English or Vietnamese)
4. Click on a GIF to insert it into your comment

## Supported Locations

- Pull Request comments and descriptions
- Issue comments and descriptions
- Discussion comments
- Code review comments
- Commit comments

## Requirements

- Userscript manager with `GM_xmlhttpRequest` support:
  - Tampermonkey
  - Violentmonkey
  - Greasemonkey 4+

## Permissions

| Permission                                      | Reason                            |
| ----------------------------------------------- | --------------------------------- |
| `GM_xmlhttpRequest`                             | Fetch GIFs from API (CORS bypass) |
| `@connect github-gifs.aldilaff6545.workers.dev` | GIF search API endpoint           |

## Changelog

### v1.1.1

- Exclude merge/commit dialog textareas to avoid UI conflicts

### v1.1.0

- Improved compatibility with GitHub's new Primer UI
- Added support for multiple textarea selectors
- Better focus management in modal

### v1.0.0

- Initial release
- GIF search and insert functionality
- Vietnamese diacritics support
