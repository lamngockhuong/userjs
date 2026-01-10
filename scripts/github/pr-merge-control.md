# PR Merge Control

Automatically controls merge button states on GitHub Pull Requests based on target branch.

## Features

- **Release branches** (`main`, `master`): Only regular merge enabled
- **Feature branches**: Only squash merge enabled
- Rebase merge always disabled

## Why?

Enforces consistent merge strategy:
- Direct merges to release branches preserve commit history
- Feature branch PRs use squash to keep history clean

## Usage

Install the script and navigate to any GitHub PR page. The merge buttons will automatically adjust based on the target branch.
