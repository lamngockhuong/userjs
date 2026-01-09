# System Architecture: UserJS Vue Userscript Manager

## Architecture Overview
- Single-page application (SPA) built with Vue 3 Composition API
- Vite as build tool and development server
- Tailwind CSS for styling
- Modular component and composable architecture

## Component Architecture

### Composables
- `useScripts`: 
  - Manages script data retrieval
  - Handles error states
  - Provides reactive script list

- `useBookmarks`: 
  - Manages bookmark data
  - Provides CRUD operations
  - Handles bookmark state management

- `useDarkMode`: 
  - Manages dark mode toggle
  - Persists mode in localStorage
  - Provides reactive dark mode state

- `useUserscriptManager`:
  - Detects userscript manager
  - Provides install detection logic
  - Manages userscript-related operations

### UI Components
- `ScriptCard`: Renders individual script details
- `BookmarkCard`: Displays bookmark information
- `Header`: Application navigation
- `SearchBar`: Enables script/bookmark searching
- `Footer`: Application footer
- `InstallBanner`: Userscript manager installation prompt

## State Management
- Composition API reactive state
- localStorage for persistent settings
- Minimal global state, component-level reactivity

## Browser Interaction
- SSR-safe browser API usage
- Graceful fallback for unsupported browsers
- Minimal DOM manipulation

## Performance Considerations
- Code-splitting via Vite
- Lazy loading of components
- Efficient reactivity with Vue 3
