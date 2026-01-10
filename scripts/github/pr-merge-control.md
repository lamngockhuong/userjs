# PR Merge Control

Automatically controls merge button states on GitHub Pull Requests based on target branch.

## Features

- **Release branches** (`main`, `master`): Only regular merge enabled
- **Feature branches**: Only squash merge enabled
- Rebase merge always disabled
- Visual indication for disabled options (reduced opacity + "(disabled)" label)

## Why?

Enforces consistent merge strategy:

- Direct merges to release branches preserve commit history
- Feature branch PRs use squash to keep history clean

## How It Works

1. Monitors for GitHub's merge dropdown menu to open
2. Detects target branch from PR page
3. Applies CSS styling to disable unwanted merge options
4. Works with GitHub's new React-based UI (2024+)

## Usage

Install the script and navigate to any GitHub PR page. When you click the merge dropdown, options will be automatically restricted based on the target branch.

## Changelog

- **v1.4** - Fix selector for new GitHub Primer React UI
- **v1.3** - Add polling for lazy-loaded merge box
- **v1.2** - Fix main merge button not being disabled
- **v1.1** - Fix CSS specificity issues with inline styles
- **v1.0** - Updated for GitHub's new React UI (2024+)
- **v0.7** - Initial version for classic GitHub UI
