# Project Overview: UserJS Vue Userscript Manager

## Project Description
Vue 3 + Vite userscript management application with modern frontend architecture.

## Core Components

### Composables
1. `useScripts`: Manages userscript data fetching and state
2. `useBookmarks`: Handles bookmark-related operations
3. `useDarkMode`: Implements dark mode toggle with localStorage persistence
4. `useUserscriptManager`: Core userscript management logic

### UI Components
1. `ScriptCard`: Displays individual userscript details
2. `BookmarkCard`: Renders bookmark information
3. `Header`: Application navigation header
4. `SearchBar`: Enables script/bookmark searching
5. `Footer`: Application footer
6. `InstallBanner`: Userscript manager detection and installation prompt

## Key Features
- Dark mode with persistent state
- SSR-safe browser API usage
- WCAG-compliant accessibility
- Dynamic script/bookmark management
- Userscript manager install detection

## Technical Stack
- Vue 3 (Composition API)
- Vite
- Tailwind CSS v4
- TypeScript

## Browser Compatibility
- Modern browsers supporting ES6+ and Vue 3
- Userscript manager integration

## Future Roadmap
- Enhance script management features
- Improve accessibility
- Add more userscript manager support
